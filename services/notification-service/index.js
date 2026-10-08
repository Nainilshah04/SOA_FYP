/**
 * Notification & Citizen Advisory Service (Port 5004)
 * Localized for BMC Disaster Management / K-West Ward (Vile Parle & Juhu)
 * Dispatches Common Alerting Protocol (CAP v1.2), Cellular Broadcast SMS, and Civil Defense Sirens
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORTS, URLS } = require('../../shared/config');

const app = express();
const PORT = PORTS.NOTIFICATION;

app.use(cors());
app.use(express.json());
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
app.use(express.static(path.join(__dirname, 'public')));

// Notification Service State
const state = {
  serviceId: 'notification-service',
  name: 'BMC Disaster Management Emergency Broadcast Gateway',
  coverageZone: 'K-West Ward (Vile Parle West, Juhu, Versova & Andheri)',
  broadcastStatus: 'MONITORING STANDBY',
  activeIncidentsHandled: 0,
  activeRequirement: null,
  citizensReachedCount: 0,
  sirensActiveCount: 0,
  smsDeliveredCount: 0,
  activeBulletins: {
    english: 'All systems quiet. Monitoring Mumbai meteorological and coastal tidal gauges.',
    regional: 'सर्व यंत्रणा शांत आहेत. विलेपार्ले व जुहू परिसर हवामान निरीक्षण सुरू आहे.',
    actionSteps: ['Follow official BMC guidelines', 'Emergency helpline: 1916 / 112'],
  },
  channels: [
    {
      id: 'CHANNEL-CELL-SMS',
      name: 'Emergency Cell Broadcast (K-West Ward Geo-Fenced SMS)',
      type: 'Cellular Tower Geo-Cast (Vile Parle W & Juhu cells)',
      status: 'ONLINE',
      successRate: '99.2%',
      contribution: null,
    },
    {
      id: 'CHANNEL-SIRENS-VILEPARLE',
      name: 'Vile Parle Civil Defense Acoustic Siren Tower (130dB)',
      type: 'Suburban Horn Network (0.5 km from DJSCE)',
      status: 'ARMED',
      successRate: '100%',
      contribution: null,
    },
    {
      id: 'CHANNEL-SIRENS-JUHU',
      name: 'Juhu Beach Coastal Warning Sirens & Media Alert Post',
      type: 'Marine Acoustic Sirens & FM/TV Emergency Crawl',
      status: 'ARMED',
      successRate: '99.5%',
      contribution: null,
    },
    {
      id: 'CHANNEL-CAP',
      name: 'Common Alerting Protocol (CAP v1.2 XML Engine)',
      type: 'Open Standard Inter-Agency Push to NDMA/BMC',
      status: 'ONLINE',
      successRate: '99.8%',
      contribution: null,
    },
  ],
  coordinationLogs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      event: 'Notification Gateways Connected',
      details: 'CAP XML engine, K-West cellular towers and suburban siren stations online.',
      level: 'INFO',
    },
  ],
};

const sseClients = [];
function broadcastUpdate() {
  const data = JSON.stringify(state);
  sseClients.forEach(c => {
    try { c.res.write(`data: ${data}\n\n`); } catch {}
  });
}

// 1. Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'ONLINE',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// 2. Status
app.get('/api/status', (req, res) => {
  res.json({ success: true, data: state });
});

// 3. Inquire Live Capacity
app.post('/api/inquire', (req, res) => {
  res.json({
    success: true,
    serviceId: 'notification-service',
    name: state.name,
    channels: state.channels,
    estimatedReach: 240000,
  });
});

// 4. Receive Incoming Requirement from Master Orchestrator (Awaits Operator Input)
app.post('/api/requirement', (req, res) => {
  const { incidentId, title, reachCitizens, sirensToSound, bulletinEnglish, bulletinRegional } = req.body;
  const targetCitizens = Number(reachCitizens) || 180000;
  const targetSirens = Number(sirensToSound) || 16;

  // Reset channels
  state.channels.forEach(ch => {
    ch.contribution = null;
    ch.status = 'Awaiting Gateway Trigger';
  });

  state.activeRequirement = {
    incidentId: incidentId || `INC-${Date.now().toString().slice(-5)}`,
    title: title || 'Emergency Incident in Vile Parle Sector',
    reachCitizensRequired: targetCitizens,
    sirensRequired: targetSirens,
    citizensReached: 0,
    sirensActive: 0,
    citizensRemaining: targetCitizens,
    sirensRemaining: targetSirens,
    bulletinEnglish: bulletinEnglish || 'BMC EMERGENCY ADVISORY: Flash flooding in Vile Parle (W) & Milan Subway. Seek higher ground.',
    bulletinRegional: bulletinRegional || 'बीएमसी आपत्कालीन सूचना: विलेपार्ले (पश्चिम) व मिलन सबवे भागात पाणी साचले आहे. सुरक्षित राहा.',
    status: 'AGGREGATING_QUORUM',
    responses: [],
    timestamp: new Date().toLocaleTimeString(),
  };

  state.broadcastStatus = 'ACTIVE REQUIREMENT PENDING BROADCAST';
  state.activeBulletins.english = state.activeRequirement.bulletinEnglish;
  state.activeBulletins.regional = state.activeRequirement.bulletinRegional;

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: 'Broadcast Requirement Received',
    details: `Master Orchestrator dispatched requirement for ${targetCitizens.toLocaleString()} citizens and ${targetSirens} sirens for "${state.activeRequirement.title}". Awaiting gateway execution.`,
    level: 'ACTION',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  broadcastUpdate();
  res.json({ success: true, message: 'Broadcast requirement registered. Awaiting channel response.', requirement: state.activeRequirement });
});

// 5. Dynamic Commitment of a Single Channel
app.post('/api/commit-channel', async (req, res) => {
  const { channelId, citizens, sirens } = req.body;
  const ch = state.channels.find(c => c.id === channelId);
  if (!ch) return res.status(404).json({ success: false, error: 'Channel not found' });
  if (!state.activeRequirement) return res.status(400).json({ success: false, error: 'No active requirement registered' });

  const citizensToCommit = Math.max(0, parseInt(citizens, 10) || 0);
  const sirensToCommit = Math.max(0, parseInt(sirens, 10) || 0);

  ch.contribution = {
    citizens: citizensToCommit,
    sirens: sirensToCommit,
    timestamp: new Date().toLocaleTimeString(),
  };
  ch.status = `ACTIVE (${citizensToCommit > 0 ? citizensToCommit.toLocaleString() + ' SMS' : ''} ${sirensToCommit > 0 ? sirensToCommit + ' Sirens' : ''})`.trim();

  state.activeRequirement.citizensReached += citizensToCommit;
  state.activeRequirement.sirensActive += sirensToCommit;
  state.activeRequirement.citizensRemaining = Math.max(0, state.activeRequirement.reachCitizensRequired - state.activeRequirement.citizensReached);
  state.activeRequirement.sirensRemaining = Math.max(0, state.activeRequirement.sirensRequired - state.activeRequirement.sirensActive);
  state.activeRequirement.responses.push({ channelName: ch.name, citizens: citizensToCommit, sirens: sirensToCommit });

  state.citizensReachedCount += citizensToCommit;
  state.smsDeliveredCount += citizensToCommit;
  state.sirensActiveCount += sirensToCommit;

  const isFull = state.activeRequirement.citizensReached >= state.activeRequirement.reachCitizensRequired &&
                 state.activeRequirement.sirensActive >= state.activeRequirement.sirensRequired;

  if (isFull) {
    state.activeRequirement.status = 'COMMITTED';
    state.broadcastStatus = 'ACTIVE EMERGENCY BROADCAST TRANSMITTED';
    state.activeIncidentsHandled++;
  }

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: `Gateway Transmitted: ${ch.name}`,
    details: `${ch.name} transmitted alerts. Delivered to ${citizensToCommit.toLocaleString()} citizens, activated ${sirensToCommit} sirens. Remaining: ${state.activeRequirement.citizensRemaining.toLocaleString()} citizens.`,
    level: 'SUCCESS',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  // Transmit live update back to Master Orchestrator
  try {
    await fetch(`${URLS.ORCHESTRATOR}/api/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'notification-service',
        incidentId: state.activeRequirement.incidentId,
        status: isFull ? 'COMMITTED' : 'AGGREGATING',
        summary: `${ch.name} transmitted alerts. Total: ${state.activeRequirement.citizensReached.toLocaleString()}/${state.activeRequirement.reachCitizensRequired.toLocaleString()} citizens, ${state.activeRequirement.sirensActive}/${state.activeRequirement.sirensRequired} sirens.`,
        details: {
          channelName: ch.name,
          citizensCommitted: citizensToCommit,
          sirensCommitted: sirensToCommit,
          citizensReached: state.activeRequirement.citizensReached,
          citizensRemaining: state.activeRequirement.citizensRemaining,
          sirensActive: state.activeRequirement.sirensActive,
          sirensRemaining: state.activeRequirement.sirensRemaining,
        },
      }),
    });
  } catch (err) {}

  broadcastUpdate();
  res.json({ success: true, requirement: state.activeRequirement, channel: ch });
});

// 6. Reset
app.post('/api/action', (req, res) => {
  const { actionType } = req.body;
  if (actionType === 'RESET') {
    state.broadcastStatus = 'MONITORING STANDBY';
    state.sirensActiveCount = 0;
    state.activeRequirement = null;
    state.activeBulletins.english = 'All systems quiet. Monitoring Mumbai meteorological and coastal tidal gauges.';
    state.activeBulletins.regional = 'सर्व यंत्रणा शांत आहेत. विलेपार्ले व जुहू परिसर हवामान निरीक्षण सुरू आहे.';
    state.channels.forEach(ch => {
      ch.status = ch.id.includes('SIREN') ? 'ARMED' : 'ONLINE';
      ch.contribution = null;
    });
    broadcastUpdate();
  }
  res.json({ success: true, state });
});

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.push(client);
  res.write(`data: ${JSON.stringify(state)}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(client);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

app.listen(PORT, () => {
  console.log(`[Notification Service] Running at http://localhost:${PORT}`);
});
