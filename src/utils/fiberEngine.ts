import { FIBER_NODES, CONDOMINIUMS, FiberNode, Condominium } from '../data/crData';

export interface EvaluationResult {
  lat: number;
  lng: number;
  nearestNode: FiberNode;
  nodeDistanceMeters: number;
  nearestCondo: Condominium | null;
  condoDistanceMeters: number | null;
  feasibility: 'FACTIBLE' | 'ESTUDIO' | 'NO_FACTIBLE';
  feasibilityLabel: string;
  badgeColor: string;
  badgeBg: string;
  province: string;
  canton: string;
  district: string;
  colloquialAddress: string;
  estimatedSpeed: string;
  installTime: string;
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

  let nearestNode = nodes[0];
  let minNodeDist = Infinity;

  for (const node of nodes) {
    const dist = calculateHaversineDistance(lat, lng, node.lat, node.lng);
    if (dist < minNodeDist) {
      minNodeDist = dist;
      nearestNode = node;
    }
  }

  let nearestCondo: Condominium | null = null;
  let minCondoDist = Infinity;

  for (const condo of condos) {
    const dist = calculateHaversineDistance(lat, lng, condo.lat, condo.lng);
    if (dist < minCondoDist) {
      minCondoDist = dist;
      nearestCondo = condo;
    }
  }

  // Rules:
  // 0 - 20m: FACTIBLE (Green Apple)
  // 30 - 100m: ESTUDIO (Amber)
  // > 100m: NO_FACTIBLE (Red)
  let feasibility: 'FACTIBLE' | 'ESTUDIO' | 'NO_FACTIBLE';
  let feasibilityLabel: string;
  let badgeColor: string;
  let badgeBg: string;
  let estimatedSpeed: string;
  let installTime: string;

  if (minNodeDist <= 20) {
    feasibility = 'FACTIBLE';
    feasibilityLabel = 'FACTIBLE (Conexión Directa FTTH)';
    badgeColor = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/10 border-emerald-500/20';
    estimatedSpeed = 'Simétrico hasta 1000 Mbps';
    installTime = '24 a 48 horas hábiles';
  } else if (minNodeDist <= 100) {
    feasibility = 'ESTUDIO';
    feasibilityLabel = 'SE PUEDE MANDAR A ESTUDIO DE FACTIBILIDAD';
    badgeColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/20';
    estimatedSpeed = 'Simétrico hasta 500 Mbps';
    installTime = '3 a 5 días hábiles (Inspección técnica)';
  } else {
    feasibility = 'NO_FACTIBLE';
    feasibilityLabel = 'NO ES FACTIBLE (Fuera de cobertura)';
    badgeColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/20';
    estimatedSpeed = 'No disponible actualmente';
    installTime = 'Requiere expansión de red programada';
  }

  let province = nearestNode.province;
  let canton = nearestNode.canton;
  let district = nearestNode.district;

  if (lat > 10.4) province = "Guanacaste";
  else if (lat > 9.95 && lng < -84.18) province = "Alajuela";
  else if (lat > 9.95 && lng >= -84.18) province = "Heredia";
  else if (lng < -83.7) province = "Cartago";
  else if (lat < 9.7) province = "Puntarenas";

  const directions = ["al norte", "al sur", "al este", "al oeste", "noreste", "suroeste"];
  const randomDir = directions[Math.abs(Math.round(lat * 1000 + lng * 1000)) % directions.length];
  const colloquialAddress = `Aprox. ${minNodeDist}m ${randomDir} del ${nearestNode.name} (${province}, ${canton})`;

  return {
    lat,
    lng,
    nearestNode,
    nodeDistanceMeters: minNodeDist,
    nearestCondo: minCondoDist < 1500 ? nearestCondo : null,
    condoDistanceMeters: minCondoDist < 1500 ? minCondoDist : null,
    feasibility,
    feasibilityLabel,
    badgeColor,
    badgeBg,
    province,
    canton,
    district,
    colloquialAddress,
    estimatedSpeed,
    installTime
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
