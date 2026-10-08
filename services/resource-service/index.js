/**
 * Rescue & Resource Management Service (Port 5002)
 * Localized for Mumbai Western Suburbs / D.J. Sanghvi College of Engineering Sector
 * Coordinates Vile Parle Fire Brigade, BMC K-West Ward, and Juhu Marine Lifeguards
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORTS, URLS } = require('../../shared/config');

const app = express();
const PORT = PORTS.RESOURCE;

app.use(cors());
app.use(express.json());
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
app.use(express.static(path.join(__dirname, 'public')));

// Resource Service State
const state = {
  serviceId: 'resource-service',
  name: 'Mumbai Disaster Logistics & Rescue Depot',
  coverageZone: 'Vile Parle, Milan Subway, Juhu Beach & Andheri',
  deploymentStatus: 'NORMAL STANDBY',
  activeIncidentsHandled: 0,
  activeRequirement: null,
  inventory: {
    inflatableBoats: { total: 45, available: 38, unit: 'Boats' },
    submersiblePumps: { total: 60, available: 52, unit: 'Pumps' },
    rationKits: { total: 25000, available: 21000, unit: 'Packets' },
    shelterTents: { total: 2000, available: 1800, unit: 'Tents' },
    earthmovers: { total: 18, available: 16, unit: 'JCBs / Cranes' },
    hazmatSuits: { total: 200, available: 180, unit: 'Suits' },
  },
  battalions: [
    {
      id: 'BN-MFB-VILEPARLE',
      name: 'Mumbai Fire Brigade (Vile Parle Fire Command)',
      location: 'Near Vile Parle Station (0.8 km from DJSCE)',
      personnel: 65,
      specialty: 'Immediate First Response, Water Rescue & Structural Evacuation',
      status: 'Ready on Standby',
      contribution: null,
    },
    {
      id: 'BN-JUHU-MARINE',
      name: 'Juhu Beach Lifeguard Swift-Water Marine Unit',
      location: 'Juhu Tara Coastal Post (2.2 km from DJSCE)',
      personnel: 40,
      specialty: 'Inflatable Boat Operations & Coastal Surge Rescue',
      status: 'Ready on Standby',
      contribution: null,
    },
    {
      id: 'BN-BMC-KWEST',
      name: 'BMC K-West Ward Disaster Quick Response Team',
      location: 'Paliram Road, Andheri West (2.8 km from DJSCE)',
      personnel: 85,
      specialty: 'Milan & Andheri Subway Dewatering & Civilian Relief Logistics',
      status: 'Ready on Standby',
      contribution: null,
    },
    {
      id: 'BN-NDRF-05',
      name: '5th Battalion NDRF (Mumbai Metropolitan Unit)',
      location: 'Regional Staging Camp (Bandra Kurla)',
      personnel: 120,
      specialty: 'Collapsed Structure Search, Flood Combat & K9 Teams',
      status: 'Standby Reserve (Unassigned)',
      contribution: null,
    },
  ],
  coordinationLogs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      event: 'Rescue Depots Operational',
      details: 'Vile Parle Fire Command, Juhu Marine Lifeguards and BMC K-West connected.',
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
    service: 'resource-service',
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
    serviceId: 'resource-service',
    name: state.name,
    inventory: state.inventory,
    battalions: state.battalions,
  });
});

// 4. Receive Incoming Requirement from Master Orchestrator (Awaits Operator Input)
app.post('/api/requirement', (req, res) => {
  const { incidentId, title, boatsRequired, pumpsRequired, rationsRequired, battalions } = req.body;
  const targetBoats = Number(boatsRequired) || 14;
  const targetPumps = Number(pumpsRequired) || 22;

  // Reset battalion contributions
  state.battalions.forEach(b => {
    b.contribution = null;
    b.status = 'Awaiting Operational Commitment';
  });

  state.activeRequirement = {
    incidentId: incidentId || `INC-${Date.now().toString().slice(-5)}`,
    title: title || 'Inundation Emergency near DJSCE',
    boatsRequired: targetBoats,
    pumpsRequired: targetPumps,
    boatsCollected: 0,
    pumpsCollected: 0,
    boatsRemaining: targetBoats,
    pumpsRemaining: targetPumps,
    status: 'AGGREGATING_QUORUM',
    responses: [],
    timestamp: new Date().toLocaleTimeString(),
  };

  state.deploymentStatus = 'ACTIVE REQUIREMENT PENDING UNIT DEPLOYMENT';

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: 'Rescue Requirement Received',
    details: `Master Orchestrator dispatched requirement of ${targetBoats} boats and ${targetPumps} pumps for "${state.activeRequirement.title}". Awaiting unit allocations.`,
    level: 'ACTION',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  broadcastUpdate();
  res.json({ success: true, message: 'Requirement registered. Awaiting unit response.', requirement: state.activeRequirement });
});

// 5. Dynamic Commitment of a Single Battalion
app.post('/api/commit-battalion', async (req, res) => {
  const { battalionId, boats, pumps } = req.body;
  const bn = state.battalions.find(b => b.id === battalionId);
  if (!bn) return res.status(404).json({ success: false, error: 'Battalion not found' });
  if (!state.activeRequirement) return res.status(400).json({ success: false, error: 'No active requirement registered' });

  const boatsToCommit = Math.max(0, parseInt(boats, 10) || 0);
  const pumpsToCommit = Math.max(0, parseInt(pumps, 10) || 0);

  bn.contribution = {
    boats: boatsToCommit,
    pumps: pumpsToCommit,
    timestamp: new Date().toLocaleTimeString(),
  };
  bn.status = `COMMITTED (${boatsToCommit} Boats, ${pumpsToCommit} Pumps)`;

  state.activeRequirement.boatsCollected += boatsToCommit;
  state.activeRequirement.pumpsCollected += pumpsToCommit;
  state.activeRequirement.boatsRemaining = Math.max(0, state.activeRequirement.boatsRequired - state.activeRequirement.boatsCollected);
  state.activeRequirement.pumpsRemaining = Math.max(0, state.activeRequirement.pumpsRequired - state.activeRequirement.pumpsCollected);
  state.activeRequirement.responses.push({ battalionName: bn.name, boats: boatsToCommit, pumps: pumpsToCommit });

  state.inventory.inflatableBoats.available = Math.max(0, state.inventory.inflatableBoats.available - boatsToCommit);
  state.inventory.submersiblePumps.available = Math.max(0, state.inventory.submersiblePumps.available - pumpsToCommit);

  const isFull = state.activeRequirement.boatsCollected >= state.activeRequirement.boatsRequired &&
                 state.activeRequirement.pumpsCollected >= state.activeRequirement.pumpsRequired;

  if (isFull) {
    state.activeRequirement.status = 'COMMITTED';
    state.deploymentStatus = 'RESCUE FLEET 100% MOBILIZED & DEPLOYED';
    state.activeIncidentsHandled++;
  }

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: `Units Committed: ${bn.name}`,
    details: `${bn.name} deployed ${boatsToCommit} boats and ${pumpsToCommit} pumps. Remaining needed: ${state.activeRequirement.boatsRemaining} boats, ${state.activeRequirement.pumpsRemaining} pumps.`,
    level: 'SUCCESS',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  // Transmit live update back to Master Orchestrator
  try {
    await fetch(`${URLS.ORCHESTRATOR}/api/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'resource-service',
        incidentId: state.activeRequirement.incidentId,
        status: isFull ? 'COMMITTED' : 'AGGREGATING',
        summary: `${bn.name} committed ${boatsToCommit} boats and ${pumpsToCommit} pumps. Total: ${state.activeRequirement.boatsCollected}/${state.activeRequirement.boatsRequired} boats, ${state.activeRequirement.pumpsCollected}/${state.activeRequirement.pumpsRequired} pumps.`,
        details: {
          battalionName: bn.name,
          boatsCommitted: boatsToCommit,
          pumpsCommitted: pumpsToCommit,
          boatsCollected: state.activeRequirement.boatsCollected,
          boatsRemaining: state.activeRequirement.boatsRemaining,
          pumpsCollected: state.activeRequirement.pumpsCollected,
          pumpsRemaining: state.activeRequirement.pumpsRemaining,
        },
      }),
    });
  } catch (err) {}

  broadcastUpdate();
  res.json({ success: true, requirement: state.activeRequirement, battalion: bn });
});

// 6. Reset
app.post('/api/action', (req, res) => {
  const { actionType } = req.body;
  if (actionType === 'RESET') {
    state.deploymentStatus = 'NORMAL STANDBY';
    state.inventory.inflatableBoats.available = 38;
    state.inventory.submersiblePumps.available = 52;
    state.inventory.rationKits.available = 21000;
    state.activeRequirement = null;
    state.battalions.forEach(b => {
      b.status = 'Ready on Standby';
      b.contribution = null;
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
  console.log(`[Resource Service] Running at http://localhost:${PORT}`);
});
