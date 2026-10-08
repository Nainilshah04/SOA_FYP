/**
 * Hospital Emergency Service (Port 5001)
 * Localized for D.J. Sanghvi College of Engineering & Mumbai Western Suburbs
 * Multi-Hospital Decentralized Capacity Commitment Engine
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORTS, URLS } = require('../../shared/config');

const app = express();
const PORT = PORTS.HOSPITAL;

app.use(cors());
app.use(express.json());
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory state for Hospital Service
const state = {
  serviceId: 'hospital-service',
  name: 'Mumbai Suburban Emergency Hospital Network',
  coverageZone: 'Vile Parle (West), Juhu, Andheri & Bandra',
  triageLevel: 'CODE GREEN (Normal Standby)',
  activeIncidentsHandled: 0,
  totalBeds: 2150,
  availableBeds: 345,
  icuAvailable: 78,
  ambulancesTotal: 52,
  ambulancesDeployed: 12,
  bloodReserveUnits: 620,
  activeRequirement: null,
  facilities: [
    {
      id: 'HOSP-COOPER',
      name: 'Dr. R. N. Cooper Municipal General Hospital',
      location: 'Juhu / Vile Parle West (1.5 km from DJSCE)',
      type: 'Major Municipal Trauma Center',
      totalBeds: 600,
      availableBeds: 95,
      icuAvailable: 24,
      ambulances: 16,
      maxSurgeLimit: 50,
      status: 'Ready on Standby',
      contribution: null,
    },
    {
      id: 'HOSP-NANAVATI',
      name: 'Nanavati Max Super Speciality Hospital',
      location: 'SV Road, Vile Parle West (1.2 km from DJSCE)',
      type: 'Level 1 Quaternary Trauma Care',
      totalBeds: 650,
      availableBeds: 110,
      icuAvailable: 28,
      ambulances: 18,
      maxSurgeLimit: 45,
      status: 'Ready on Standby',
      contribution: null,
    },
    {
      id: 'HOSP-KOKILABEN',
      name: 'Kokilaben Dhirubhai Ambani Hospital',
      location: 'Four Bungalows, Andheri West (4.2 km from DJSCE)',
      type: 'Multi-Specialty Critical Care Unit',
      totalBeds: 550,
      availableBeds: 85,
      icuAvailable: 16,
      ambulances: 12,
      maxSurgeLimit: 35,
      status: 'Ready on Standby',
      contribution: null,
    },
    {
      id: 'HOSP-LILAVATI',
      name: 'Lilavati Hospital & Research Centre',
      location: 'Bandra Reclamation (7.5 km from DJSCE)',
      type: 'Specialized Burns & Emergency Wing',
      totalBeds: 350,
      availableBeds: 55,
      icuAvailable: 10,
      ambulances: 6,
      maxSurgeLimit: 25,
      status: 'Standby Reserve (Unassigned)',
      contribution: null,
    },
  ],
  coordinationLogs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      event: 'Hospital Network Operational',
      details: 'Cooper, Nanavati, Kokilaben and Lilavati connected on municipal emergency exchange.',
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
    service: 'hospital-service',
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
  const totalVacant = state.facilities.reduce((acc, f) => acc + f.availableBeds, 0);
  const totalSurge = state.facilities.reduce((acc, f) => acc + f.maxSurgeLimit, 0);
  const totalAmbs = state.facilities.reduce((acc, f) => acc + f.ambulances, 0);

  res.json({
    success: true,
    serviceId: 'hospital-service',
    name: state.name,
    totalBeds: state.totalBeds,
    availableBeds: totalVacant,
    surgeCapacityBuffer: totalSurge,
    ambulancesAvailable: totalAmbs,
    facilities: state.facilities.map(f => ({
      id: f.id,
      name: f.name,
      location: f.location,
      availableBeds: f.availableBeds,
      icuAvailable: f.icuAvailable,
      ambulances: f.ambulances,
      maxSurgeLimit: f.maxSurgeLimit,
      status: f.status,
    })),
  });
});

// 4. Receive Incoming Requirement from Master Orchestrator (Awaits Operator Input)
app.post('/api/requirement', (req, res) => {
  const { incidentId, title, bedsRequired, t1Required, t2Required, ambulancesRequired, protocol, location } = req.body;
  const targetBeds = Number(bedsRequired) || 90;
  const targetT1 = Number(t1Required) || 40;
  const targetT2 = Number(t2Required) || 50;
  const targetAmbs = Number(ambulancesRequired) || 16;

  // Reset facility contributions
  state.facilities.forEach(f => {
    f.contribution = null;
    f.status = 'Awaiting Operational Commitment';
  });

  state.activeRequirement = {
    incidentId: incidentId || `INC-${Date.now().toString().slice(-5)}`,
    title: title || 'Emergency Incident near D.J. Sanghvi Sector',
    bedsRequired: targetBeds,
    t1Required: targetT1,
    t2Required: targetT2,
    ambulancesRequired: targetAmbs,
    bedsCollected: 0,
    ambulancesCollected: 0,
    bedsRemaining: targetBeds,
    protocol: protocol || 'START Triage: Red & Yellow Categories',
    location: location || 'Vile Parle (West), Mumbai',
    status: 'AGGREGATING_QUORUM',
    responses: [],
    timestamp: new Date().toLocaleTimeString(),
  };

  state.triageLevel = 'CODE YELLOW (Active Requirement Pending Allocation)';

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: 'Emergency Requirement Received',
    details: `Master Orchestrator dispatched requirement of ${targetBeds} beds and ${targetAmbs} ambulances for "${state.activeRequirement.title}". Awaiting facility allocations.`,
    level: 'ACTION',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  broadcastUpdate();
  res.json({ success: true, message: 'Requirement registered. Awaiting facility response.', requirement: state.activeRequirement });
});

// 5. Dynamic Commitment of a Single Facility
app.post('/api/commit-facility', async (req, res) => {
  const { facilityId, beds, ambulances, notes } = req.body;
  const fac = state.facilities.find(f => f.id === facilityId);
  if (!fac) return res.status(404).json({ success: false, error: 'Facility not found' });
  if (!state.activeRequirement) return res.status(400).json({ success: false, error: 'No active requirement registered' });

  const bedsToCommit = Math.max(0, parseInt(beds, 10) || 0);
  const ambsToCommit = Math.max(0, parseInt(ambulances, 10) || 0);

  fac.contribution = {
    beds: bedsToCommit,
    ambulances: ambsToCommit,
    notes: notes || 'Operational Surge Commitment',
    timestamp: new Date().toLocaleTimeString(),
  };
  fac.status = `COMMITTED (${bedsToCommit} Beds, ${ambsToCommit} Amb)`;
  fac.availableBeds = Math.max(0, fac.availableBeds - bedsToCommit);

  state.activeRequirement.bedsCollected += bedsToCommit;
  state.activeRequirement.ambulancesCollected += ambsToCommit;
  state.activeRequirement.bedsRemaining = Math.max(0, state.activeRequirement.bedsRequired - state.activeRequirement.bedsCollected);
  state.activeRequirement.responses.push({ facilityName: fac.name, beds: bedsToCommit, ambulances: ambsToCommit });

  state.availableBeds = Math.max(0, state.availableBeds - bedsToCommit);
  state.ambulancesDeployed = Math.min(state.ambulancesTotal, state.ambulancesDeployed + ambsToCommit);

  const isFull = state.activeRequirement.bedsCollected >= state.activeRequirement.bedsRequired;
  if (isFull) {
    state.activeRequirement.status = 'COMMITTED';
    state.triageLevel = 'CODE RED (Full Quota Committed)';
    state.activeIncidentsHandled++;
  }

  state.coordinationLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event: `Resource Committed: ${fac.name}`,
    details: `${fac.name} committed ${bedsToCommit} beds and ${ambsToCommit} ambulances. Remaining needed across network: ${state.activeRequirement.bedsRemaining} beds.`,
    level: 'SUCCESS',
  });
  if (state.coordinationLogs.length > 30) state.coordinationLogs.pop();

  // Transmit live update back to Master Orchestrator
  try {
    await fetch(`${URLS.ORCHESTRATOR}/api/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'hospital-service',
        incidentId: state.activeRequirement.incidentId,
        status: isFull ? 'COMMITTED' : 'AGGREGATING',
        summary: `${fac.name} committed ${bedsToCommit} beds and ${ambsToCommit} ambulances. Remaining: ${state.activeRequirement.bedsRemaining} beds. Total: ${state.activeRequirement.bedsCollected}/${state.activeRequirement.bedsRequired} beds.`,
        details: {
          facilityName: fac.name,
          bedsCommitted: bedsToCommit,
          ambulancesCommitted: ambsToCommit,
          bedsCollected: state.activeRequirement.bedsCollected,
          bedsRemaining: state.activeRequirement.bedsRemaining,
          ambulancesCollected: state.activeRequirement.ambulancesCollected,
          allResponses: state.activeRequirement.responses,
        },
      }),
    });
  } catch (err) {}

  broadcastUpdate();
  res.json({ success: true, requirement: state.activeRequirement, facility: fac });
});

// 6. Reset
app.post('/api/action', (req, res) => {
  const { actionType } = req.body;
  if (actionType === 'RESET') {
    state.triageLevel = 'CODE GREEN (Normal Standby)';
    state.availableBeds = 345;
    state.icuAvailable = 78;
    state.ambulancesDeployed = 12;
    state.activeRequirement = null;
    const baselines = {
      'HOSP-COOPER': 95,
      'HOSP-NANAVATI': 110,
      'HOSP-KOKILABEN': 85,
      'HOSP-LILAVATI': 55,
    };
    state.facilities.forEach(f => {
      f.status = 'Ready on Standby';
      f.contribution = null;
      if (baselines[f.id]) f.availableBeds = baselines[f.id];
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
  console.log(`[Hospital Service] Running at http://localhost:${PORT}`);
});
