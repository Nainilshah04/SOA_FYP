/**
 * D.J. Sanghvi College of Engineering (Mumbai) - Realistic Localized Disaster Scenarios
 * Demonstrates Service-Oriented Emergency Incident Coordination around Vile Parle, Juhu, and Mumbai Western Suburbs.
 * Formulated with START Triage (T1 Immediate vs T2 Delayed) and Dynamic Cumulative Multi-Hospital Absorption.
 */

module.exports = [
  {
    id: 'SCENARIO-DJSCE-MONSOON-BURST',
    title: 'Mumbai Cloudburst & Inundation — Vile Parle / Milan Subway Sector',
    disasterType: 'FL',
    disasterTypeName: 'Flash Flood / Cloudburst',
    alertLevel: 'Red',
    alertScore: 2.8,
    country: 'India',
    locationName: 'Vile Parle (West) & Juhu Coastal Belt, Mumbai',
    coordinates: [19.1075, 72.8372], // D.J. Sanghvi College of Engineering
    affectedPopulation: 240000,
    impactRadiusKm: 12,
    details: {
      cloudburstVolume: '320 mm rainfall within 5 hours',
      criticalSubways: 'Milan Subway & Andheri Subway submerged (6-8 ft water)',
      highRiskZones: 'SV Road, Irla Nullah, Juhu Scheme, Milan Subway',
      nearbyReference: 'D.J. Sanghvi College of Engineering (Vile Parle West)',
      primaryMedicalReceivers: 'Dr. R.N. Cooper Hospital (Juhu) & Nanavati Max Hospital (SV Road)',
    },
    triage: {
      totalCasualties: 90,
      t1Immediate: 40, // Red Tag: Critical Trauma, Resuscitation, 1:1 Ambulance
      t2Delayed: 50,   // Yellow Tag: Serious/Stable, Step-down Ward
    },
    requirements: {
      hospital: {
        bedsRequired: 90,
        t1Required: 40,
        t2Required: 50,
        ambulancesRequired: 16,
        protocol: 'START Triage: Red (T1 Trauma) & Yellow (T2 Inundation Ward)',
        targetFacilities: ['Dr. R. N. Cooper Hospital (Juhu)', 'Nanavati Max Hospital (SV Road)', 'Kokilaben Hospital (Andheri)'],
        steps: [
          { facilityId: 'HOSP-COOPER', name: 'Dr. R. N. Cooper Hospital', delayMs: 1400, commitBeds: 40, commitT1: 20, commitT2: 20, commitAmbs: 7, reason: 'Closest Municipal Trauma Center (1.5 km). Capped at 40 beds to prevent hospital crash.' },
          { facilityId: 'HOSP-NANAVATI', name: 'Nanavati Max Hospital', delayMs: 2700, commitBeds: 35, commitT1: 15, commitT2: 20, commitAmbs: 6, reason: 'Level-1 Quaternary Trauma Care (1.2 km). Absorbs 35 casualties.' },
          { facilityId: 'HOSP-KOKILABEN', name: 'Kokilaben Dhirubhai Ambani Hospital', delayMs: 4000, commitBeds: 15, commitT1: 5, commitT2: 10, commitAmbs: 3, reason: 'Four Bungalows Critical Unit (4.2 km). Absorbs remaining 15 casualties. 100% Quorum reached.' },
        ],
      },
      resource: {
        boatsRequired: 14,
        pumpsRequired: 22,
        rationsRequired: 5000,
        battalions: ['Mumbai Fire Brigade (Vile Parle Station)', 'Juhu Beach Lifeguard Unit', 'BMC K-West Ward QRT'],
        steps: [
          { battalionId: 'BN-MFB-VILEPARLE', name: 'Mumbai Fire Brigade (Vile Parle Command)', delayMs: 1400, commitBoats: 6, commitPumps: 10, reason: 'First Responder Station (0.8 km from DJSCE). Deploys to Milan Subway.' },
          { battalionId: 'BN-JUHU-MARINE', name: 'Juhu Beach Swift-Water Marine Unit', delayMs: 2700, commitBoats: 6, commitPumps: 4, reason: 'Coastal surge swift-water specialists (2.2 km from DJSCE).' },
          { battalionId: 'BN-BMC-KWEST', name: 'BMC K-West Ward Disaster QRT', delayMs: 4000, commitBoats: 2, commitPumps: 8, reason: 'Civic municipal logistics depot. Delivers high-head dewatering pumps. 100% Quorum reached.' },
        ],
      },
      traffic: {
        closures: ['Milan Subway (Flooded)', 'Andheri Subway (Flooded)'],
        greenCorridors: ['Western Express Highway (Emergency Ambulance Lane)'],
        steps: [
          { routeId: 'ROUTE-MILAN-SUBWAY', name: 'Milan Subway Checkpoint', delayMs: 1300, action: 'BARRICADED', note: 'Flooded with 7 ft water. Diverted to SV Road.' },
          { routeId: 'ROUTE-ANDHERI-SUBWAY', name: 'Andheri Subway Checkpoint', delayMs: 2600, action: 'BARRICADED', note: 'Low-lying transit sealed. Diverted via Gokhale Bridge.' },
          { routeId: 'ROUTE-WEH', name: 'Western Express Highway (WEH)', delayMs: 3900, action: 'GREEN_CORRIDOR', note: 'Ambulance Priority Green Corridor active to Cooper & Nanavati. 100% Secured.' },
        ],
      },
      notification: {
        reachCitizens: 180000,
        sirensToSound: 16,
        bulletinEnglish: 'BMC EMERGENCY ADVISORY: Heavy cloudburst inundation in Vile Parle (W) & Juhu. Milan and Andheri Subways closed. Emergency green corridor active on Western Express Highway.',
        bulletinRegional: 'बीएमसी आपत्कालीन सूचना: विलेपार्ले (पश्चिम) व जुहू भागात अतिवृष्टीमुळे पाणी साचले आहे. मिलन व अंधेरी सबवे बंद आहेत. नागरिकांनी सुरक्षित स्थळी राहावे.',
        steps: [
          { channelId: 'CHANNEL-CELL-SMS', name: 'Emergency Cell Broadcast', delayMs: 1300, commitCitizens: 95000, commitSirens: 0, note: 'Geo-fenced SMS delivered to K-West telecom cells.' },
          { channelId: 'CHANNEL-SIRENS-VILEPARLE', name: 'Vile Parle Acoustic Siren Tower', delayMs: 2600, commitCitizens: 0, commitSirens: 8, note: '8 civil defense sirens sounding at 130dB tone.' },
          { channelId: 'CHANNEL-SIRENS-JUHU', name: 'Juhu Coastal Sirens & Media Alert Post', delayMs: 3900, commitCitizens: 85000, commitSirens: 8, note: '8 coastal sirens + local FM/TV warning crawl. 100% Broadcast Quorum.' },
        ],
      },
    },
  },
  {
    id: 'SCENARIO-JUHU-CYCLONE-TAUKTAE',
    title: 'Arabian Sea Severe Cyclone Landfall — Mumbai Coast & Juhu Beach',
    disasterType: 'TC',
    disasterTypeName: 'Severe Tropical Cyclone',
    alertLevel: 'Red',
    alertScore: 2.9,
    country: 'India',
    locationName: 'Juhu Beach & Western Coastal Belt, Mumbai',
    coordinates: [19.0988, 72.8267], // Juhu Beach
    affectedPopulation: 550000,
    impactRadiusKm: 35,
    details: {
      cycloneCategory: 'Category 3 Very Severe Cyclonic Storm',
      sustainedWinds: '145 km/h with gusts up to 170 km/h',
      stormSurge: '4.2 meters above astronomical tide at high water',
      evacuationZones: 'Juhu Koliwada, Versova Fishermen Colony, Bandra Bandstand',
      nearbyReference: '2.5 km from D.J. Sanghvi College of Engineering',
    },
    triage: {
      totalCasualties: 120,
      t1Immediate: 55,
      t2Delayed: 65,
    },
    requirements: {
      hospital: {
        bedsRequired: 120,
        t1Required: 55,
        t2Required: 65,
        ambulancesRequired: 22,
        protocol: 'Storm Surge Trauma, Crush Injury & Emergency Surgery',
        targetFacilities: ['Dr. R. N. Cooper Hospital (Juhu)', 'Nanavati Max Hospital (Vile Parle)', 'Kokilaben Hospital (Andheri)'],
        steps: [
          { facilityId: 'HOSP-COOPER', name: 'Dr. R. N. Cooper Hospital', delayMs: 1400, commitBeds: 50, commitT1: 25, commitT2: 25, commitAmbs: 9, reason: 'Immediate surge absorption' },
          { facilityId: 'HOSP-NANAVATI', name: 'Nanavati Max Hospital', delayMs: 2700, commitBeds: 45, commitT1: 20, commitT2: 25, commitAmbs: 8, reason: 'Quaternary critical care absorption' },
          { facilityId: 'HOSP-KOKILABEN', name: 'Kokilaben Dhirubhai Ambani Hospital', delayMs: 4000, commitBeds: 25, commitT1: 10, commitT2: 15, commitAmbs: 5, reason: 'Absorbs remaining quota' },
        ],
      },
      resource: {
        boatsRequired: 24,
        pumpsRequired: 28,
        rationsRequired: 8000,
        battalions: ['5th Battalion NDRF (Mumbai Contingent)', 'Juhu Beach Swift-Water Marine Unit'],
        steps: [
          { battalionId: 'BN-JUHU-MARINE', name: 'Juhu Beach Lifeguard Unit', delayMs: 1400, commitBoats: 10, commitPumps: 8, reason: 'Beachfront immediate deployment' },
          { battalionId: 'BN-MFB-VILEPARLE', name: 'Mumbai Fire Brigade', delayMs: 2700, commitBoats: 8, commitPumps: 10, reason: 'Suburban secondary response' },
          { battalionId: 'BN-BMC-KWEST', name: 'BMC K-West Ward QRT', delayMs: 4000, commitBoats: 6, commitPumps: 10, reason: 'Evacuation logistics and pumps' },
        ],
      },
      traffic: {
        closures: ['Juhu Tara Road (Storm Surge Risk)', 'Carter Road Coastal Corridor'],
        greenCorridors: ['Western Express Highway (Priority Convoys)'],
        steps: [
          { routeId: 'ROUTE-JUHU-TARA', name: 'Juhu Tara Coastal Road', delayMs: 1300, action: 'BARRICADED', note: 'Surge waves breaching coastal seawall.' },
          { routeId: 'ROUTE-MILAN-SUBWAY', name: 'Milan Subway Checkpoint', delayMs: 2600, action: 'BARRICADED', note: 'Pre-emptive flood barrier sealed.' },
          { routeId: 'ROUTE-WEH', name: 'Western Express Highway (WEH)', delayMs: 3900, action: 'GREEN_CORRIDOR', note: 'Emergency convoy arterial cleared.' },
        ],
      },
      notification: {
        reachCitizens: 350000,
        sirensToSound: 24,
        bulletinEnglish: 'CRITICAL CYCLONE WARNING: Severe storm surge imminent along Juhu and Versova coast. Immediate evacuation to storm shelters ordered.',
        bulletinRegional: 'चक्रीवादळ धोक्याचा इशारा: जुहू आणि वर्सोवा किनारपट्टीवर प्रचंड लाटांचा इशारा. नागरिकांनी त्वरित सुरक्षित निवारक केंद्रात जावे.',
        steps: [
          { channelId: 'CHANNEL-CELL-SMS', name: 'Emergency Cell Broadcast', delayMs: 1300, commitCitizens: 180000, commitSirens: 0, note: 'Mass coastal cell alert.' },
          { channelId: 'CHANNEL-SIRENS-VILEPARLE', name: 'Vile Parle Siren Tower', delayMs: 2600, commitCitizens: 0, commitSirens: 8, note: 'Sirens activated.' },
          { channelId: 'CHANNEL-SIRENS-JUHU', name: 'Juhu Coastal Sirens', delayMs: 3900, commitCitizens: 170000, commitSirens: 16, note: 'High-intensity coastal horns sounding.' },
        ],
      },
    },
  },
  {
    id: 'SCENARIO-ANDHERI-MIDC-GAS',
    title: 'Industrial Toxic Chemical Vapor Leak — MIDC Andheri East Zone',
    disasterType: 'HZ',
    disasterTypeName: 'Chemical Plume Hazard',
    alertLevel: 'Orange',
    alertScore: 2.2,
    country: 'India',
    locationName: 'MIDC Andheri East / SEEPZ Industrial Corridor',
    coordinates: [19.1197, 72.8697], // MIDC Andheri East
    affectedPopulation: 95000,
    impactRadiusKm: 8,
    details: {
      hazardType: 'Toxic Inhalation Hazard (TIH) Gas Release',
      substance: 'Ammonia & Chlorine Vapor Dispersion',
      downwindPlume: '4.5 km dispersion corridor towards Western Express Highway',
      nearbyReference: '4.5 km East of D.J. Sanghvi College of Engineering',
    },
    triage: {
      totalCasualties: 70,
      t1Immediate: 30,
      t2Delayed: 40,
    },
    requirements: {
      hospital: {
        bedsRequired: 70,
        t1Required: 30,
        t2Required: 40,
        ambulancesRequired: 14,
        protocol: 'Respiratory Triage, Toxic Inhalation & Antidote Infusion',
        targetFacilities: ['Nanavati Max Hospital', 'Dr. R. N. Cooper Hospital', 'Kokilaben Hospital'],
        steps: [
          { facilityId: 'HOSP-NANAVATI', name: 'Nanavati Max Hospital', delayMs: 1400, commitBeds: 35, commitT1: 15, commitT2: 20, commitAmbs: 7, reason: 'Specialized chemical burn and lung trauma wing.' },
          { facilityId: 'HOSP-COOPER', name: 'Dr. R. N. Cooper Hospital', delayMs: 2700, commitBeds: 25, commitT1: 10, commitT2: 15, commitAmbs: 5, reason: 'Emergency oxygen ward.' },
          { facilityId: 'HOSP-KOKILABEN', name: 'Kokilaben Hospital', delayMs: 4000, commitBeds: 10, commitT1: 5, commitT2: 5, commitAmbs: 2, reason: 'Absorbs remaining quota.' },
        ],
      },
      resource: {
        boatsRequired: 0,
        pumpsRequired: 6,
        rationsRequired: 2000,
        battalions: ['Civil Defense Hazmat & CBRN Logistics Group', 'Vile Parle Fire Brigade'],
        steps: [
          { battalionId: 'BN-MFB-VILEPARLE', name: 'Vile Parle Fire Command (Hazmat Unit)', delayMs: 1400, commitBoats: 0, commitPumps: 4, reason: 'Water fog curtains deployed to neutralize vapor cloud.' },
          { battalionId: 'BN-BMC-KWEST', name: 'BMC K-West Civic Logistics', delayMs: 2700, commitBoats: 0, commitPumps: 2, reason: 'Civilian evacuation transport and hazmat suits.' },
        ],
      },
      traffic: {
        closures: ['MIDC Central Crossroad (Plume Exclusion Zone)', 'Andheri-Kurla Road Link'],
        greenCorridors: ['Western Express Highway (WEH Elevated Bypass)'],
        steps: [
          { routeId: 'ROUTE-ANDHERI-SUBWAY', name: 'Andheri Crossroad Corridor', delayMs: 1400, action: 'BARRICADED', note: 'Plume dispersion exclusion zone.' },
          { routeId: 'ROUTE-WEH', name: 'Western Express Highway', delayMs: 2800, action: 'GREEN_CORRIDOR', note: 'Clean air evacuation bypass active.' },
        ],
      },
      notification: {
        reachCitizens: 95000,
        sirensToSound: 12,
        bulletinEnglish: 'HAZMAT WARNING: Airborne chemical plume in MIDC Andheri East. Shelter indoors, seal windows, and avoid air conditioning.',
        bulletinRegional: 'रासायनिक वायू गळती इशारा: एमआयडीसी अंधेरी पूर्व भागात वायू गळती. घरातच राहा, खिडक्या बंद करा, एसी बंद ठेवा.',
        steps: [
          { channelId: 'CHANNEL-CELL-SMS', name: 'Emergency Cell Broadcast', delayMs: 1400, commitCitizens: 95000, commitSirens: 0, note: 'Plume zone localized SMS.' },
          { channelId: 'CHANNEL-SIRENS-VILEPARLE', name: 'Vile Parle Siren Tower', delayMs: 2800, commitCitizens: 0, commitSirens: 12, note: 'Hazmat intermittent alert sirens.' },
        ],
      },
    },
  },
];
