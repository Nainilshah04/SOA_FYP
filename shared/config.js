/**
 * ResilientResponse - Shared Configuration
 * Service-Oriented Architecture (SOA) Topology
 */

module.exports = {
  PORTS: {
    ORCHESTRATOR: 5000,
    HOSPITAL: 5001,
    RESOURCE: 5002,
    TRAFFIC: 5003,
    NOTIFICATION: 5004,
    REGISTRY: 5005,
  },
  URLS: {
    ORCHESTRATOR: 'http://localhost:5000',
    HOSPITAL: 'http://localhost:5001',
    RESOURCE: 'http://localhost:5002',
    TRAFFIC: 'http://localhost:5003',
    NOTIFICATION: 'http://localhost:5004',
    REGISTRY: 'http://localhost:5005',
  },
  SERVICES: [
    {
      id: 'orchestrator-service',
      name: 'Master Orchestrator & Command Service',
      port: 5000,
      url: 'http://localhost:5000',
      description: 'Dynamic workflow composer, GDACS alert ingestion, incident repository and master coordination.',
      role: 'Orchestrator',
      code: 'ORCH',
    },
    {
      id: 'hospital-service',
      name: 'Hospital Emergency Service',
      port: 5001,
      url: 'http://localhost:5001',
      description: 'Trauma center readiness, ICU/emergency bed allocation, ambulance triage and medical intake.',
      role: 'Domain Service',
      code: 'MED',
    },
    {
      id: 'resource-service',
      name: 'Rescue & Resource Management Service',
      port: 5002,
      url: 'http://localhost:5002',
      description: 'First responder battalion mobilization, flood boats, de-watering pumps, rations, and equipment dispatch.',
      role: 'Domain Service',
      code: 'OPS',
    },
    {
      id: 'traffic-service',
      name: 'Traffic & Safe Routing Service',
      port: 5003,
      url: 'http://localhost:5003',
      description: 'Hazard buffer computation, road closures, green corridors for responders, and safe evacuation corridors.',
      role: 'Domain Service',
      code: 'TRAF',
    },
    {
      id: 'notification-service',
      name: 'Notification & Citizen Advisory Service',
      port: 5004,
      url: 'http://localhost:5004',
      description: 'Multi-channel broadcast (CAP push, SMS cell broadcast, civil sirens, multilingual public bulletins).',
      role: 'Domain Service',
      code: 'CAP',
    },
    {
      id: 'registry-service',
      name: 'Service Registry & Discovery Console',
      port: 5005,
      url: 'http://localhost:5005',
      description: 'Dynamic service discovery, health heartbeats, OpenAPI contracts, and chaos fault-injection console.',
      role: 'Governance & Registry',
      code: 'REG',
    },
  ],
  GDACS_FEED_URL: 'https://www.gdacs.org/xml/rss.xml',
};
