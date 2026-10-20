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

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const nameEl = pm.getElementsByTagName('name')[0];
    const name = nameEl ? nameEl.textContent?.trim() || `Elemento ${i + 1}` : `Elemento ${i + 1}`;

    const coordElements = pm.getElementsByTagName('coordinates');
    
    for (let c = 0; c < coordElements.length; c++) {
      const coordText = coordElements[c].textContent?.trim() || '';
      const tuples = coordText.split(/\s+/);

      for (let t = 0; t < tuples.length; t++) {
        const parts = tuples[t].split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);

          if (!isNaN(lat) && !isNaN(lng)) {
            // Costa Rica bounding box
            if (lat >= 8.0 && lat <= 11.5 && lng >= -86.0 && lng <= -82.0) {
              const province = lat > 10.4 ? "Guanacaste" :
                               lat > 9.95 && lng < -84.18 ? "Alajuela" :
                               lat > 9.95 && lng >= -84.18 ? "Heredia" :
                               lng < -83.7 ? "Cartago" :
                               lat < 9.7 ? "Puntarenas" : "San José";

              const lowerName = name.toLowerCase();
              const isCondo = lowerName.includes('condo') || lowerName.includes('residencial') || lowerName.includes('urbaniza') || lowerName.includes('edificio');

              if (isCondo) {
                const exists = parsedCondos.some(condo => Math.abs(condo.lat - lat) < 0.0001 && Math.abs(condo.lng - lng) < 0.0001);
                if (!exists) {
                  parsedCondos.push({
                    id: `KMZ-CONDO-${i}-${c}-${t}`,
                    name: tuples.length > 1 ? `${name} (Punto ${t + 1})` : name,
                    province,
                    canton: province,
                    district: "Central",
                    lat,
                    lng,
                    hasDirectPort: true,
                    developer: "KMZ / KML Red"
                  });
                }
              } else {
                const exists = parsedNodes.some(node => Math.abs(node.lat - lat) < 0.0001 && Math.abs(node.lng - lng) < 0.0001);
                if (!exists) {
                  parsedNodes.push({
                    id: `KMZ-NODE-${i}-${c}-${t}`,
                    name: tuples.length > 1 ? `${name} [${t + 1}]` : name,
                    province,
                    canton: province,
                    district: "Central",
                    lat,
                    lng,
                    capacityGbps: 100,
                    status: 'Activo',
                    code: `NET-${i}-${t}`
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    nodes: parsedNodes.length > 0 ? parsedNodes : FIBER_NODES,
    condos: parsedCondos.length > 0 ? parsedCondos : CONDOMINIUMS
  };
}
