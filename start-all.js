/**
 * ResilientResponse - Multi-Service Orchestration Launcher
 * Boots all 6 independent microservices concurrently for the FYP viva presentation.
 */

const { fork } = require('child_process');
const path = require('path');
const { SERVICES } = require('./shared/config');

console.log('\x1b[36m%s\x1b[0m', `
========================================================================
   ResilientResponse: Service-Oriented Emergency Incident Platform
   GDACS Dynamic Orchestration Architecture
========================================================================
`);

const children = [];

const serviceOrder = [
  'registry-service',     // Port 5005
  'hospital-service',     // Port 5001
  'resource-service',     // Port 5002
  'traffic-service',      // Port 5003
  'notification-service', // Port 5004
  'orchestrator-service', // Port 5000
];

function startServices() {
  serviceOrder.forEach(serviceId => {
    const serviceMeta = SERVICES.find(s => s.id === serviceId);
    const servicePath = path.join(__dirname, 'services', serviceId, 'index.js');

    const child = fork(servicePath, [], {
      stdio: ['pipe', 'inherit', 'inherit', 'ipc'],
    });

    children.push({ id: serviceId, meta: serviceMeta, process: child });
  });

  setTimeout(() => {
    console.log('\x1b[32m%s\x1b[0m', '\n========================================================================');
    console.log('\x1b[32m%s\x1b[0m', '   ALL 6 MICROSERVICES ONLINE & OPERATIONAL FOR VIVA REVIEW:');
    console.log('\x1b[32m%s\x1b[0m', '========================================================================');
    SERVICES.forEach(s => {
      console.log(`  \x1b[33m[${s.code || 'SVC'}]\x1b[0m \x1b[37m${s.name.padEnd(42)}\x1b[0m -> \x1b[36m${s.url}\x1b[0m`);
    });
    console.log('\x1b[32m%s\x1b[0m', '========================================================================');
    console.log('\x1b[35m%s\x1b[0m', 'Incident Command Center: http://localhost:5000');
    console.log('\x1b[35m%s\x1b[0m', 'Press Ctrl+C in this terminal to gracefully terminate all 6 processes.\n');
  }, 1200);
}

function shutdown() {
  console.log('\n\x1b[31m%s\x1b[0m', 'Terminating microservice cluster...');
  children.forEach(c => {
    try {
      c.process.kill();
    } catch {}
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServices();
