/**
 * GDACS Client
 * Fetches, parses, and normalizes live disaster alerts from the Global Disaster Alert and Coordination System (GDACS).
 */

const xml2js = require('xml2js');
const { GDACS_FEED_URL } = require('./config');
const sampleScenarios = require('./sampleScenarios');

let cachedAlerts = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

const DISASTER_TYPE_MAP = {
  EQ: 'Earthquake',
  TC: 'Tropical Cyclone',
  FL: 'Flood',
  VO: 'Volcano',
  DR: 'Drought',
  WF: 'Wildfire',
  TS: 'Tsunami',
  HZ: 'Chemical Hazard',
};

function getWorkflowForDisaster(type) {
  const t = (type || '').toUpperCase();
  if (t === 'EQ') {
    return {
      sequence: ['hospital-service', 'traffic-service', 'resource-service', 'notification-service'],
      rationale: 'Earthquake: Immediate trauma/casualty triage (Hospital), clearing transit debris (Traffic), urban search & rescue (Resource), public advisory (Notification).',
    };
  } else if (t === 'TC' || t === 'FL') {
    return {
      sequence: ['resource-service', 'traffic-service', 'notification-service', 'hospital-service'],
      rationale: 'Flood/Cyclone: Inundation relief & rescue boats (Resource), flood route diversions (Traffic), storm warning sirens (Notification), and hospital standby.',
    };
  } else if (t === 'HZ') {
    return {
      sequence: ['hospital-service', 'notification-service', 'traffic-service', 'resource-service'],
      rationale: 'Hazardous Chemical: Toxicological treatment & antidote prep (Hospital), downwind sirens & shelter-in-place (Notification), cordon road closure (Traffic), hazmat containment (Resource).',
    };
  } else {
    return {
      sequence: ['notification-service', 'resource-service', 'hospital-service', 'traffic-service'],
      rationale: 'General Disaster: Rapid broadcast alert (Notification), relief staging (Resource), hospital readiness (Hospital), and transit security (Traffic).',
    };
  }
}

async function fetchLiveGDACSAlerts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedAlerts.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedAlerts;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(GDACS_FEED_URL, {
      headers: {
        'User-Agent': 'ResilientResponse-SOA-Coordination-FYP/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`GDACS server returned status ${response.status}`);
    }

    const xmlText = await response.text();
    const parsed = await xml2js.parseStringPromise(xmlText, { explicitArray: false, trim: true });

    const rawItems = parsed?.rss?.channel?.item;
    if (!rawItems) {
      throw new Error('No items found in GDACS RSS feed');
    }

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    const normalized = items.map((item, index) => {
      const typeCode = item['gdacs:eventtype'] || 'FL';
      const typeName = DISASTER_TYPE_MAP[typeCode] || typeCode;
      const level = item['gdacs:alertlevel'] || 'Green';
      const score = parseFloat(item['gdacs:alertscore'] || '1.0');
      const country = item['gdacs:country'] || 'Global';

      // Parse coordinates from georss:point (format: "lat long")
      let coords = [20.5937, 78.9629]; // fallback India center
      if (item['georss:point']) {
        const parts = item['georss:point'].split(/\s+/).map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          coords = [parts[0], parts[1]];
        }
      } else if (item['geo:Point']) {
        const lat = parseFloat(item['geo:Point']['geo:lat']);
        const lng = parseFloat(item['geo:Point']['geo:long']);
        if (!isNaN(lat) && !isNaN(lng)) coords = [lat, lng];
      }

      // Parse population affected
      let affected = 50000;
      if (item['gdacs:population']) {
        const popVal = typeof item['gdacs:population'] === 'object'
          ? item['gdacs:population']['$']?.value || item['gdacs:population']['_']
          : item['gdacs:population'];
        const num = parseInt(popVal, 10);
        if (!isNaN(num) && num > 0) affected = num;
      }

      const workflow = getWorkflowForDisaster(typeCode);

      return {
        id: item['gdacs:eventid'] ? `GDACS-${typeCode}-${item['gdacs:eventid']}` : `GDACS-${index + 1}`,
        title: item.title || `${level} ${typeName} Alert in ${country}`,
        description: item.description || 'No detailed description available.',
        disasterType: typeCode,
        disasterTypeName: typeName,
        alertLevel: level,
        alertScore: isNaN(score) ? 1.5 : score,
        country: country,
        coordinates: coords,
        affectedPopulation: affected,
        impactRadiusKm: level === 'Red' ? 80 : (level === 'Orange' ? 45 : 20),
        capUrl: item['gdacs:cap'] || null,
        link: item.link || null,
        pubDate: item.pubDate || new Date().toUTCString(),
        workflowSequence: workflow.sequence,
        workflowRationale: workflow.rationale,
        isLive: true,
      };
    });

    cachedAlerts = normalized;
    lastFetchTime = now;
    return cachedAlerts;
  } catch (err) {
    console.warn(`[GDACS Client] Live fetch failed or timed out (${err.message}). Using local fallback feed.`);
    // Fall back to sample scenarios marked as fallback
    if (cachedAlerts.length === 0) {
      cachedAlerts = sampleScenarios.map(s => ({ ...s, isLive: false }));
    }
    return cachedAlerts;
  }
}

module.exports = {
  fetchLiveGDACSAlerts,
  getWorkflowForDisaster,
};
