/**
 * Service Registry & Discovery Microservice
 * Port: 5005
 * Role: Service Discovery, Health Heartbeats, Contract Catalog, and Chaos Fault Injection Console.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORTS, URLS, SERVICES } = require('../../shared/config');

const app = express();
const PORT = PORTS.REGISTRY;

app.use(cors());
app.use(express.json());

// Serve shared styles and assets
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
// Serve local static UI
app.use(express.static(path.join(__dirname, 'public')));

// Registry State
const serviceRegistry = {};
const chaosSimulation = {
  'traffic-service': false, // when true, simulated as DOWN
  'hospital-service': false,
  'resource-service': false,
  'notification-service': false,
};

// Heartbeat metrics
const serviceMetrics = {};

// Initialize registry with default SOA topology
SERVICES.forEach(s => {
  serviceRegistry[s.id] = {
    ...s,
    status: 'ONLINE',
    lastHeartbeat: Date.now(),
    latencyMs: 1,
    version: '1.4.0',
    contractsUrl: `${s.url}/api/contract`,
    healthUrl: `${s.url}/health`,
  };
  serviceMetrics[s.id] = {
    pingsSent: 0,
    pingsSucceeded: 0,
    history: [],
  };
});

// Periodic Heartbeat Worker
async function checkServiceHealth() {
  for (const service of SERVICES) {
    if (service.id === 'registry-service') continue;

    serviceMetrics[service.id].pingsSent++;
    const isSimulatedDown = chaosSimulation[service.id];

    if (isSimulatedDown) {
      serviceRegistry[service.id].status = 'SIMULATED_DOWN';
      serviceRegistry[service.id].latencyMs = -1;
      continue;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${service.url}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (res.ok) {
        serviceRegistry[service.id].status = 'ONLINE';
        serviceRegistry[service.id].latencyMs = latency;
        serviceRegistry[service.id].lastHeartbeat = Date.now();
        serviceMetrics[service.id].pingsSucceeded++;
      } else {
        serviceRegistry[service.id].status = 'DEGRADED';
        serviceRegistry[service.id].latencyMs = latency;
      }
    } catch {
      serviceRegistry[service.id].status = 'OFFLINE';
      serviceRegistry[service.id].latencyMs = -1;
    }
  }
}

setInterval(checkServiceHealth, 3500);

// SSE clients for real-time dashboard updates
const sseClients = [];
function broadcastRegistryUpdate() {
  const payload = JSON.stringify({
    timestamp: Date.now(),
    services: Object.values(serviceRegistry),
    chaos: chaosSimulation,
  });
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // client dropped
    }
  });
}
setInterval(broadcastRegistryUpdate, 2000);

// --- REST Endpoints ---

// 1. Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'registry-service',
    status: 'ONLINE',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. Discover all services (Used by Orchestrator)
app.get('/api/registry/services', (req, res) => {
  res.json({
    success: true,
    totalServices: Object.keys(serviceRegistry).length,
    services: serviceRegistry,
  });
});

// 3. Discover specific service by ID
app.get('/api/registry/discover/:serviceId', (req, res) => {
  const s = serviceRegistry[req.params.serviceId];
  if (!s) {
    return res.status(404).json({ success: false, error: 'Service not found in registry' });
  }

  // Check chaos simulation
  if (chaosSimulation[req.params.serviceId]) {
    return res.status(503).json({
      success: false,
      error: `Service ${req.params.serviceId} is currently FAILING (Simulated Chaos Fault)`,
      isChaosSimulated: true,
      service: { ...s, status: 'SIMULATED_DOWN' },
    });
  }

  res.json({
    success: true,
    service: s,
  });
});

// 4. Chaos Fault Injection Toggle (For Viva live demo)
app.post('/api/registry/chaos/toggle', (req, res) => {
  const { serviceId, forceState } = req.body;
  if (chaosSimulation[serviceId] === undefined) {
    return res.status(400).json({ error: 'Invalid service for chaos simulation' });
  }

  const newState = forceState !== undefined ? Boolean(forceState) : !chaosSimulation[serviceId];
  chaosSimulation[serviceId] = newState;

  if (newState) {
    serviceRegistry[serviceId].status = 'SIMULATED_DOWN';
  } else {
    serviceRegistry[serviceId].status = 'ONLINE';
    serviceRegistry[serviceId].lastHeartbeat = Date.now();
  }

  broadcastRegistryUpdate();

  res.json({
    success: true,
    serviceId,
    isDown: newState,
    message: newState
      ? `Simulated fault injected into ${serviceId}. Service marked DOWN for live resilience demo.`
      : `Service ${serviceId} restored to ONLINE status.`,
  });
});

// 5. Query Chaos status
app.get('/api/registry/chaos/status', (req, res) => {
  res.json({ chaos: chaosSimulation });
});

// 6. Service Contract
app.get('/api/contract', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'ResilientResponse - Service Registry & Discovery API',
      version: '1.4.0',
      description: 'Provides runtime discovery, heartbeat monitoring, and resilience fault-injection for SOA emergency services.',
    },
    paths: {
      '/api/registry/services': {
        get: { summary: 'List all registered microservices and their health status' },
      },
      '/api/registry/discover/{serviceId}': {
        get: { summary: 'Discover binding endpoint for a given domain service' },
      },
      '/api/registry/chaos/toggle': {
        post: { summary: 'Inject or resolve simulated microservice failures' },
      },
    },
  });
});

// 7. SSE Stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.push(client);

  // Send immediate state
  res.write(`data: ${JSON.stringify({ timestamp: Date.now(), services: Object.values(serviceRegistry), chaos: chaosSimulation })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(client);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

app.listen(PORT, () => {
  console.log(`[Registry Service] Running at http://localhost:${PORT}`);
});
