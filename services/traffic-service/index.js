/**
 * Traffic & Safe Routing Service (Port 5003)
 * Localized for Mumbai Traffic Police (Western Suburbs Division)
 * Manages Milan Subway, Andheri Subway, Western Express Highway (WEH), and SV Road
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORTS, URLS } = require('../../shared/config');

const app = express();
const PORT = PORTS.TRAFFIC;

app.use(cors());
app.use(express.json());
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
app.use(express.static(path.join(__dirname, 'public')));

// Traffic Service State
const state = {
  serviceId: 'traffic-service',
  name: 'Mumbai Traffic Police (Western Suburbs Operations)',
  coverageZone: 'Vile Parle, Juhu, Andheri & Western Express Highway',
  routingStatus: 'NORMAL MONITORED FLOW',
  activeIncidentsHandled: 0,
  activeRequirement: null,
  activeHazardBufferKm: 12,
  roadsClosedCount: 0,
  greenCorridorsActive: 0,
  routes: [
    {
      id: 'ROUTE-MILAN-SUBWAY',
      name: 'Milan Subway (Vile Parle West - East Underpass)',
      type: 'Subway Underpass (High Flood Risk - 0.7 km from DJSCE)',
      status: 'OPEN',
      clearance: 'Normal Vehicular Transit',
      speedLimit: '30 km/h',
      contribution: null,
    },
    {
      id: 'ROUTE-ANDHERI-SUBWAY',
      name: 'Andheri Subway (SV Road to Highway Connector)',
      type: 'Low-Lying Underpass (Severe Inundation Risk)',
      status: 'OPEN',
      clearance: 'Normal Transit',
      speedLimit: '30 km/h',
      contribution: null,
    },
    {
      id: 'ROUTE-WEH',
      name: 'Western Express Highway (WEH - Vile Parle Flyover)',
      type: 'Primary Interstate Arterial Highway (Emergency Artery)',
      status: 'OPEN',
      clearance: 'Unrestricted Civilian & Transit',
      speedLimit: '80 km/h',
      contribution: null,
    },
    {
      id: 'ROUTE-SV-ROAD',
      name: 'Swami Vivekanand (SV) Road (Vile Parle - Cooper Corridor)',
      type: 'Major Suburban Spine',
      status: 'OPEN',
      clearance: 'Heavy Civilian Transit',
      speedLimit: '50 km/h',
      contribution: null,
    },
    {
      id: 'ROUTE-JUHU-TARA',
      name: 'Juhu Tara Road & Coastal Arterial Link',
      type: 'Coastal Inundation Zone',
      status: 'OPEN',
      clearance: 'Beachfront Transit',
      speedLimit: '40 km/h',
      contribution: null,
    },
  ],
  coordinationLogs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      event: 'Traffic Control Matrix Active',
      details: 'Milan Subway sensors, WEH green corridor signals and SV Road junctions operational.',
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
    service: 'traffic-service',
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
    serviceId: 'traffic-service',
    name: state.name,
    routes: state.routes,
    roadsClosed: state.roadsClosedCount,
    greenCorridors: state.greenCorridorsActive,
  });
});

// 4. Receive Incoming Requirement from Master Orchestrator (Awaits Operator Input)
app.post('/api/requirement', (req, res) => {
  const { incidentId, title, closures, greenCorridors } = req.body;

  // Reset routes contributions
  state.routes.forEach(r => {
    r.contribution = null;
    r.status = 'Awaiting Field Status';
  });

  state.roadsClosedCount = 0;
  state.greenCorridorsActive = 0;

  state.activeRequirement = {
    incidentId: incidentId || `INC-${Date.now().toString().slice(-5)}`,
    title: title || 'Waterlogging in Vile Parle Sector',
    checkpointsRequired: 3,
    checkpointsSecured: 0,
    status: 'AGGREGATING_QUORUM',
    responses: [],
    timestamp: new Date().toLocaleTimeString(),
  };

  state.routingStatus = 'EMERGENCY PROTOCOL ACTIVE - FIELD CORDON IN PROGRESS';

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: 'Traffic Requirement Received',
    details: `Master Orchestrator dispatched requirement for subway closures and ambulance green corridor. Awaiting field chowky verification.`,
    level: 'ACTION',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  broadcastUpdate();
  res.json({ success: true, message: 'Traffic requirement registered. Awaiting checkpoint response.', requirement: state.activeRequirement });
});

// 5. Dynamic Commitment of a Single Route Checkpoint
app.post('/api/commit-route', async (req, res) => {
  const { routeId, status, clearance, actionType } = req.body;
  const route = state.routes.find(r => r.id === routeId);
  if (!route) return res.status(404).json({ success: false, error: 'Route not found' });
  if (!state.activeRequirement) return res.status(400).json({ success: false, error: 'No active requirement registered' });

  const chosenAction = actionType || (status && status.includes('GREEN') ? 'GREEN_CORRIDOR' : 'BARRICADED');
  const chosenStatus = status || (chosenAction === 'BARRICADED' ? 'CLOSED (WATERLOGGED / BARRICADED)' : 'GREEN_CORRIDOR (AMBULANCE PRIORITY)');
  const chosenClearance = clearance || (chosenAction === 'BARRICADED' ? 'Barricaded by Mumbai Traffic Police' : 'Priority Emergency Convoy Lane');

  route.status = chosenStatus;
  route.clearance = chosenClearance;
  route.contribution = { actionType: chosenAction, timestamp: new Date().toLocaleTimeString() };

  if (chosenAction === 'BARRICADED') state.roadsClosedCount++;
  if (chosenAction === 'GREEN_CORRIDOR') state.greenCorridorsActive++;

  state.activeRequirement.checkpointsSecured++;
  state.activeRequirement.responses.push({ routeName: route.name, actionType: chosenAction, clearance: chosenClearance });

  const isFull = state.activeRequirement.checkpointsSecured >= state.activeRequirement.checkpointsRequired;

  if (isFull) {
    state.activeRequirement.status = 'COMMITTED';
    state.routingStatus = 'EMERGENCY TRAFFIC CORRIDORS FULLY SECURED';
    state.activeIncidentsHandled++;
  }

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: `Checkpoint Updated: ${route.name}`,
    details: `${route.name} secured as ${chosenAction}. Clearances: ${chosenClearance}. Checkpoints secured: ${state.activeRequirement.checkpointsSecured}/${state.activeRequirement.checkpointsRequired}.`,
    level: 'SUCCESS',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  // Transmit live update back to Master Orchestrator
  try {
    await fetch(`${URLS.ORCHESTRATOR}/api/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'traffic-service',
        incidentId: state.activeRequirement.incidentId,
        status: isFull ? 'COMMITTED' : 'AGGREGATING',
        summary: `Secured ${state.activeRequirement.checkpointsSecured}/${state.activeRequirement.checkpointsRequired} Checkpoints. Latest: ${route.name} (${chosenAction}).`,
        details: {
          routeName: route.name,
          actionType: chosenAction,
          checkpointsSecured: state.activeRequirement.checkpointsSecured,
          roadsClosed: state.roadsClosedCount,
          greenCorridors: state.greenCorridorsActive,
        },
      }),
    });
  } catch (err) {}

  broadcastUpdate();
  res.json({ success: true, requirement: state.activeRequirement, route });
});

// 6. Reset
app.post('/api/action', (req, res) => {
  const { actionType } = req.body;
  if (actionType === 'RESET') {
    state.routingStatus = 'NORMAL MONITORED FLOW';
    state.roadsClosedCount = 0;
    state.greenCorridorsActive = 0;
    state.activeRequirement = null;
    state.routes.forEach(r => {
      r.status = 'OPEN';
      r.clearance = 'Normal Transit';
      r.contribution = null;
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
  console.log(`[Traffic Service] Running at http://localhost:${PORT}`);
});
