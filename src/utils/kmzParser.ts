import JSZip from 'jszip';
import { FIBER_NODES, CONDOMINIUMS, FiberNode, Condominium } from '../data/crData';

export async function parseKmlOrKmzFile(file: File | Blob, fileName: string = 'Octubre Comercial 2026.kmz'): Promise<{ nodes: FiberNode[]; condos: Condominium[] }> {
  let kmlText = '';

  const isKmz = fileName.endsWith('.kmz') || file.type.includes('zip') || file.type.includes('kmz');

  if (isKmz || fileName.endsWith('.kmz')) {
    const zip = new JSZip();
    const unzipped = await zip.loadAsync(file);
    const kmlFile = Object.keys(unzipped.files).find((filename) => filename.endsWith('.kml'));
    if (!kmlFile) {
      throw new Error('No se encontró ningún archivo .kml dentro del archivo KMZ.');
    }
    kmlText = await unzipped.files[kmlFile].async('text');
  } else if (fileName.endsWith('.kml') || file.type.includes('xml')) {
    kmlText = await file.text();
  } else {
    // Default fallback to try zip/kmz
    try {
      const zip = new JSZip();
      const unzipped = await zip.loadAsync(file);
      const kmlFile = Object.keys(unzipped.files).find((filename) => filename.endsWith('.kml'));
      if (kmlFile) {
        kmlText = await unzipped.files[kmlFile].async('text');
      } else {
        kmlText = await file.text();
      }
    } catch {
      kmlText = await file.text();
    }
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
  const placemarks = xmlDoc.getElementsByTagName('Placemark');

  const parsedNodes: FiberNode[] = [];
  const parsedCondos: Condominium[] = [];

  const validProvinces = ["San José", "Heredia", "Cartago", "Alajuela"];

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const nameEl = pm.getElementsByTagName('name')[0];
    const coordEl = pm.getElementsByTagName('coordinates')[0];

    if (!coordEl) continue;

    const name = nameEl ? nameEl.textContent?.trim() || `Punto ${i + 1}` : `Punto ${i + 1}`;
    const coordText = coordEl.textContent?.trim() || '';
    const firstCoord = coordText.split(/\s+/)[0];
    const parts = firstCoord.split(',');

    if (parts.length >= 2) {
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat >= 9.7 && lat <= 10.3 && lng >= -84.4 && lng <= -83.7) {
          const province = lat > 9.95 && lng < -84.18 ? "Alajuela" :
                           lat > 9.95 && lng >= -84.18 ? "Heredia" :
                           lng < -83.7 ? "Cartago" : "San José";

          if (validProvinces.includes(province)) {
            if (name.toLowerCase().includes('condo') || name.toLowerCase().includes('residencial')) {
              parsedCondos.push({
                id: `KMZ-CONDO-${i}`,
                name,
                province,
                canton: province,
                district: "Central",
                lat,
                lng,
                hasDirectPort: true,
                developer: "KMZ Importado"
              });
            } else {
              parsedNodes.push({
                id: `KMZ-NODE-${i}`,
                name,
                province,
                canton: province,
                district: "Central",
                lat,
                lng,
                capacityGbps: 100,
                status: 'Activo',
                code: `KMZ-${i}`
              });
            }
          }
        }
      }
    }
  }

  if (parsedNodes.length === 0 && parsedCondos.length === 0) {
    return { nodes: FIBER_NODES, condos: CONDOMINIUMS };
  }

  return {
    nodes: parsedNodes.length > 0 ? parsedNodes : FIBER_NODES,
    condos: parsedCondos.length > 0 ? parsedCondos : CONDOMINIUMS
  };
}
