export interface FiberNode {
  id: string;
  name: string;
  province: string;
  canton: string;
  district: string;
  lat: number;
  lng: number;
  capacityGbps: number;
  status: 'Activo' | 'Saturado' | 'Mantenimiento';
  code: string;
}

export interface Condominium {
  id: string;
  name: string;
  province: string;
  canton: string;
  district: string;
  lat: number;
  lng: number;
  hasDirectPort: boolean;
  developer: string;
}

export interface PresetLocation {
  name: string;
  description: string;
  lat: number;
  lng: number;
  province: string;
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  { name: "La Sabana, San José", description: "Zona metropolitana central", lat: 9.9333, lng: -84.1085, province: "San José" },
  { name: "San Pedro de Montes de Oca", description: "Cerca de universidades y comercios", lat: 9.9344, lng: -84.0532, province: "San José" },
  { name: "Curridabat Centro", description: "Zona residencial y comercial densa", lat: 9.9234, lng: -84.0321, province: "San José" },
  { name: "Escazú (Multiplaza)", description: "Zona comercial y torres corporativas", lat: 9.9402, lng: -84.1445, province: "San José" },
  { name: "Heredia Centro", description: "Casco central histórico de Heredia", lat: 9.9988, lng: -84.1165, province: "Heredia" },
  { name: "San Francisco de Heredia", description: "Zona residencial y parques tecnológicos", lat: 9.9912, lng: -84.1350, province: "Heredia" },
  { name: "Alajuela Centro (Parque Juan Santamaría)", description: "Centro histórico de Alajuela", lat: 10.0163, lng: -84.2115, province: "Alajuela" },
  { name: "Cartago (Ruinas de Santiago Apóstol)", description: "Centro de la Vieja Metrópoli", lat: 9.8656, lng: -83.9189, province: "Cartago" },
  { name: "Tres Ríos, La Unión", description: "Zona este residencial en expansión", lat: 9.9012, lng: -83.9789, province: "Cartago" }
];

export const FIBER_NODES: FiberNode[] = [
  { id: "NODE-SJO-01", name: "Nodo Central Sabana", province: "San José", canton: "San José", district: "Pavas", lat: 9.9380, lng: -84.1120, capacityGbps: 100, status: "Activo", code: "SJO-SAB-01" },
  { id: "NODE-SJO-02", name: "Nodo Los Yoses FO", province: "San José", canton: "San José", district: "Catedral", lat: 9.9310, lng: -84.0620, capacityGbps: 80, status: "Activo", code: "SJO-YOS-02" },
  { id: "NODE-SJO-03", name: "Nodo San Pedro Universidad", province: "San José", canton: "Montes de Oca", district: "San Pedro", lat: 9.9355, lng: -84.0510, capacityGbps: 120, status: "Activo", code: "SJO-SPE-03" },
  { id: "NODE-SJO-04", name: "Nodo Curridabat Este", province: "San José", canton: "Curridabat", district: "Curridabat", lat: 9.9210, lng: -84.0290, capacityGbps: 90, status: "Activo", code: "SJO-CUR-04" },
  { id: "NODE-SJO-05", name: "Nodo Escazú Multiplaza", province: "San José", canton: "Escazú", district: "San Rafael", lat: 9.9430, lng: -84.1410, capacityGbps: 150, status: "Activo", code: "SJO-ESC-05" },
  { id: "NODE-HER-01", name: "Nodo Heredia Centro", province: "Heredia", canton: "Heredia", district: "Heredia", lat: 10.0010, lng: -84.1130, capacityGbps: 100, status: "Activo", code: "HER-CTR-01" },
  { id: "NODE-HER-02", name: "Nodo San Francisco Zona Franca", province: "Heredia", canton: "Heredia", district: "San Francisco", lat: 9.9880, lng: -84.1410, capacityGbps: 200, status: "Activo", code: "HER-SFR-02" },
  { id: "NODE-ALA-01", name: "Nodo Alajuela Parque Central", province: "Alajuela", canton: "Alajuela", district: "Alajuela", lat: 10.0180, lng: -84.2140, capacityGbps: 90, status: "Activo", code: "ALA-CTR-01" },
  { id: "NODE-CAR-01", name: "Nodo Cartago Ruinas", province: "Cartago", canton: "Cartago", district: "Oriental", lat: 9.8660, lng: -83.9160, capacityGbps: 100, status: "Activo", code: "CAR-RUI-01" }
];

export const CONDOMINIUMS: Condominium[] = [
  { id: "CONDO-01", name: "Condominio Altamonte", province: "San José", canton: "Curridabat", district: "Concepción", lat: 9.9150, lng: -84.0250, hasDirectPort: true, developer: "Garnier & Garnier" },
  { id: "CONDO-02", name: "Condominio Torres de Granadilla", province: "San José", canton: "Curridabat", district: "Granadilla", lat: 9.9300, lng: -84.0200, hasDirectPort: true, developer: "Cuestamoras" },
  { id: "CONDO-03", name: "Condominio Hacienda del Sol", province: "San José", canton: "Escazú", district: "San Rafael", lat: 9.9510, lng: -84.1500, hasDirectPort: true, developer: "Portafolio Inmobiliario" },
  { id: "CONDO-04", name: "Condominio Torres de Heredia", province: "Heredia", canton: "Heredia", district: "Mercedes", lat: 10.0050, lng: -84.1250, hasDirectPort: true, developer: "Grupo Inmobiliario del Parque" },
  { id: "CONDO-05", name: "Condominio Alamedas del Oeste", province: "Alajuela", canton: "Alajuela", district: "Alajuela", lat: 10.0220, lng: -84.2200, hasDirectPort: true, developer: "PISSA" },
  { id: "CONDO-06", name: "Condominio Terramar Cartago", province: "Cartago", canton: "Cartago", district: "Occidental", lat: 9.8700, lng: -83.9250, hasDirectPort: false, developer: "Desarrollos del Este" }
];
