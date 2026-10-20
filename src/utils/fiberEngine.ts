import { FIBER_NODES, CONDOMINIUMS, FiberNode, Condominium } from '../data/crData';

export interface EvaluationResult {
  lat: number;
  lng: number;
  nearestNode: FiberNode;
  nodeDistanceMeters: number;
  subsequentNodes: Array<{ node: FiberNode; distance: number }>;
  nearestCondo: Condominium | null;
  condoDistanceMeters: number | null;
  feasibility: 'FACTIBLE' | 'ESTUDIO' | 'NO_FACTIBLE';
  feasibilityLabel: string;
  badgeColor: string;
  badgeBg: string;
  province: string;
  canton: string;
  district: string;
  neighborhood: string;
  exactStreet: string;
  colloquialAddress: string;
  estimatedSpeed: string;
  installTime: string;
  routingEstimate: { min: number; max: number };
}

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function evaluateLocation(
  lat: number,
  lng: number,
  customNodes: FiberNode[] = FIBER_NODES,
  customCondos: Condominium[] = CONDOMINIUMS
): EvaluationResult {
  const nodes = customNodes.length > 0 ? customNodes : FIBER_NODES;
  const condos = customCondos.length > 0 ? customCondos : CONDOMINIUMS;

  // Calculate distances for all nodes and sort them
  const nodeDistances = nodes.map((node) => ({
    node,
    distance: calculateHaversineDistance(lat, lng, node.lat, node.lng),
  })).sort((a, b) => a.distance - b.distance);

  const nearestNode = nodeDistances[0]?.node || nodes[0];
  const minNodeDist = nodeDistances[0]?.distance || 0;

  // Subsequent nodes (next 4)
  const subsequentNodes = nodeDistances.slice(1, 5);

  let nearestCondo: Condominium | null = null;
  let minCondoDist = Infinity;

  for (const condo of condos) {
    const dist = calculateHaversineDistance(lat, lng, condo.lat, condo.lng);
    if (dist < minCondoDist) {
      minCondoDist = dist;
      nearestCondo = condo;
    }
  }

  // Advanced Feasibility Rules
  // 🟢 CON COBERTURA: <= 30m or inside a condo (<= 50m)
  // 🟠 AL BORDE DEL RANGO / ESTUDIO: 30m - 150m (or if condo rules require confirmation of public street)
  // 🔴 SIN COBERTURA: > 150m
  let feasibility: 'FACTIBLE' | 'ESTUDIO' | 'NO_FACTIBLE';
  let feasibilityLabel: string;
  let badgeColor: string;
  let badgeBg: string;
  let estimatedSpeed: string;
  let installTime: string;

  const isInsideCondo = minCondoDist <= 80 && nearestCondo !== null;

  if (minNodeDist <= 30 || isInsideCondo) {
    feasibility = 'FACTIBLE';
    feasibilityLabel = '🟢 CON COBERTURA (Red al frente / Huella FTTH Activa)';
    badgeColor = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/10 border-emerald-500/20';
    estimatedSpeed = 'Simétrico hasta 1000 Mbps (1 Gbps)';
    installTime = '24 a 48 horas hábiles';
  } else if (minNodeDist <= 150) {
    feasibility = 'ESTUDIO';
    feasibilityLabel = '🟠 AL BORDE DEL RANGO / ESTUDIO TÉCNICO';
    badgeColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/20';
    estimatedSpeed = 'Simétrico hasta 500 Mbps';
    installTime = '3 a 5 días hábiles (Inspección de posteo)';
  } else {
    feasibility = 'NO_FACTIBLE';
    feasibilityLabel = '🔴 SIN COBERTURA (Registrar para expansión)';
    badgeColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/20';
    estimatedSpeed = 'No disponible (Sujeto a factibilidad futura)';
    installTime = 'Requiere proyecto de expansión de red';
  }

  // Province detection
  let province = nearestNode.province;
  let canton = nearestNode.canton;
  let district = nearestNode.district;

  if (lat > 10.4) { province = "Guanacaste"; canton = "Liberia"; district = "Cañas Dulces"; }
  else if (lat > 9.95 && lng < -84.18) { province = "Alajuela"; canton = "Alajuela"; district = "San José"; }
  else if (lat > 9.95 && lng >= -84.18) { province = "Heredia"; canton = "Heredia"; district = "Mercedes"; }
  else if (lng < -83.7) { province = "Cartago"; canton = "Cartago"; district = "Oriental"; }
  else if (lat < 9.7) { province = "Puntarenas"; canton = "Puntarenas"; district = "El Roble"; }
  else { province = "San José"; canton = "San José"; district = "Pavas"; }

  const neighborhoods = ["Barrio Los Yoses", "Residencial Las Flores", "Urbanización El Sol", "Barrio Escalante", "Sabana Norte", "Rohrmoser", "San Francisco", "Condado del Parque"];
  const neighborhood = neighborhoods[Math.abs(Math.round(lat * 10000 + lng * 10000)) % neighborhoods.length];
  const exactStreet = `Calle ${Math.abs(Math.round(lat * 100)) % 50 + 1}, Avenidad Principal`;

  const directions = ["al norte", "al sur", "al este", "al oeste", "noreste", "suroeste"];
  const randomDir = directions[Math.abs(Math.round(lat * 1000 + lng * 1000)) % directions.length];
  const colloquialAddress = `Aprox. ${minNodeDist}m ${randomDir} del ${nearestNode.name} (${province}, ${canton})`;

  const routingEstimate = {
    min: Math.max(10, minNodeDist),
    max: Math.round(minNodeDist * 1.25 + 15),
  };

  return {
    lat,
    lng,
    nearestNode,
    nodeDistanceMeters: minNodeDist,
    subsequentNodes,
    nearestCondo: minCondoDist < 1200 ? nearestCondo : null,
    condoDistanceMeters: minCondoDist < 1200 ? minCondoDist : null,
    feasibility,
    feasibilityLabel,
    badgeColor,
    badgeBg,
    province,
    canton,
    district,
    neighborhood,
    exactStreet,
    colloquialAddress,
    estimatedSpeed,
    installTime,
    routingEstimate,
  };
}

export function parseMapUrl(url: string): { lat: number; lng: number } | null {
  try {
    const cleanUrl = url.trim();
    const atMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    const qMatch = cleanUrl.match(/[?&]q=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    const wazeLlMatch = cleanUrl.match(/[?&]ll=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) || cleanUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (wazeLlMatch) {
      return { lat: parseFloat(wazeLlMatch[1]), lng: parseFloat(wazeLlMatch[2]) };
    }

    const genericMatch = cleanUrl.match(/(-?9\.\d+)[,\s]+(-?8[34]\.\d+)/);
    if (genericMatch) {
      return { lat: parseFloat(genericMatch[1]), lng: parseFloat(genericMatch[2]) };
    }

    return null;
  } catch (e) {
    return null;
  }
}
