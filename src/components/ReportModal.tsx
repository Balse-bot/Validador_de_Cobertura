import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { EvaluationResult, DEFAULT_FOOTPRINTS } from '../utils/fiberEngine';
import { X, Printer, ShieldCheck, Wifi, CheckCircle2, AlertTriangle, XCircle, Download, Layers, Crosshair } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: EvaluationResult;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, evaluation }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [certMapType, setCertMapType] = useState<'satellite' | 'streets'>('satellite');
  const certMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const satLayerRef = useRef<L.TileLayer | null>(null);
  const streetsLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize and update the dedicated Certificate Map showing coordinate & node
  useEffect(() => {
    if (!isOpen || !certMapRef.current) return;

    // Small timeout to ensure DOM container is rendered with dimensions
    const timer = setTimeout(() => {
      if (!certMapRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(certMapRef.current, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
        });

        const satLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
            maxZoom: 19,
            crossOrigin: 'anonymous',
          }
        );

        const streetsLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { maxZoom: 19, crossOrigin: 'anonymous' }
        );

        satLayer.addTo(map);
        satLayerRef.current = satLayer;
        streetsLayerRef.current = streetsLayer;
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear existing markers/lines
      map.eachLayer((layer) => {
        if (layer !== satLayerRef.current && layer !== streetsLayerRef.current) {
          map.removeLayer(layer);
        }
      });

            // Render Footprint Polygons on Certificate Map
      DEFAULT_FOOTPRINTS.forEach((poly) => {
        if (!poly.pts || poly.pts.length < 3) return;
        L.polygon(poly.pts, {
          color: '#00d4ff',
          weight: 2.5,
          fillColor: '#00d4ff',
          fillOpacity: 0.22,
          interactive: false,
        }).addTo(map);
      });

      const { lat, lng, nearestNode, nodeDistanceMeters, routingEstimate, feasibility, feasibilityLabel } = evaluation;
      const statusColor = feasibility === 'FACTIBLE' ? '#10b981' : feasibility === 'ESTUDIO' ? '#f59e0b' : '#ef4444';

      // 1. Evaluated Coordinate Marker (Client) with prominent badge label
      const clientIcon = L.divIcon({
        className: 'custom-cert-client-icon',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: rgba(15, 23, 42, 0.95);
              color: #ffffff;
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 800;
              border: 2px solid ${statusColor};
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
              white-space: nowrap;
              margin-bottom: 4px;
              letter-spacing: -0.01em;
            ">
              📍 CLIENTE (${lat.toFixed(4)}, ${lng.toFixed(4)})
            </div>
            <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
              <div style="
                position: absolute;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background-color: ${statusColor};
                opacity: 0.45;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
              <div style="
                background-color: ${statusColor};
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 14px rgba(0,0,0,0.6);
                border: 2.5px solid white;
                font-size: 14px;
                font-weight: bold;
                z-index: 10;
              ">📍</div>
            </div>
          </div>
        `,
        iconSize: [180, 70],
        iconAnchor: [90, 70],
      });

      const clientMarker = L.marker([lat, lng], { icon: clientIcon });
      clientMarker.bindPopup(`<b>Punto Evaluado</b><br>Coordenadas: ${lat}, ${lng}<br>Estado: <b>${feasibilityLabel}</b>`);
      clientMarker.addTo(map);

      // 2. Assigned Fiber Node Marker with prominent badge label positioned BELOW icon
      const nodeIcon = L.divIcon({
        className: 'custom-cert-node-icon',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: linear-gradient(135deg, #0284c7, #2563eb);
              color: white;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 16px rgba(2, 132, 199, 0.8);
              border: 2.5px solid white;
              font-size: 16px;
              font-weight: bold;
            ">⚡</div>
            <div style="
              background: rgba(15, 23, 42, 0.95);
              color: #38bdf8;
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 800;
              border: 2px solid #0284c7;
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
              white-space: nowrap;
              margin-top: 4px;
              letter-spacing: -0.01em;
            ">
              ⚡ NODO: ${nearestNode.name}
            </div>
          </div>
        `,
        iconSize: [210, 70],
        iconAnchor: [105, 17],
      });

      const nodeMarker = L.marker([nearestNode.lat, nearestNode.lng], { icon: nodeIcon });
      nodeMarker.bindPopup(`<b>${nearestNode.name}</b><br>Código: ${nearestNode.code}<br>Distancia: ${nodeDistanceMeters}m`);
      nodeMarker.addTo(map);

      // 3. High-contrast Dashed Connection Line
      const routeLine = L.polyline(
        [
          [lat, lng],
          [nearestNode.lat, nearestNode.lng],
        ],
        {
          color: '#38bdf8',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.95,
        }
      );
      routeLine.addTo(map);

      // 4. Central Distance Badge on the line
      const midLat = (lat + nearestNode.lat) / 2;
      const midLng = (lng + nearestNode.lng) / 2;
      const distBadgeIcon = L.divIcon({
        className: 'custom-cert-dist-badge',
        html: `
          <div style="
            background: #0284c7;
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.7);
            border: 2px solid white;
            transform: translateY(-50%);
          ">
            📏 ${nodeDistanceMeters}m al nodo
          </div>
        `,
        iconSize: [140, 26],
        iconAnchor: [70, 13],
      });
      L.marker([midLat, midLng], { icon: distBadgeIcon }).addTo(map);

      // Auto-fit bounds including both coordinate and node with comfortable padding
      const bounds = L.latLngBounds([
        [lat, lng],
        [nearestNode.lat, nearestNode.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, evaluation]);

  // Clean up Leaflet on unmount or close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCenterView = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([
      [evaluation.lat, evaluation.lng],
      [evaluation.nearestNode.lat, evaluation.nearestNode.lng],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
  };

  const handleToggleLayer = () => {
    const map = mapInstanceRef.current;
    if (!map || !satLayerRef.current || !streetsLayerRef.current) return;

    if (certMapType === 'satellite') {
      map.removeLayer(satLayerRef.current);
      streetsLayerRef.current.addTo(map);
      setCertMapType('streets');
    } else {
      map.removeLayer(streetsLayerRef.current);
      satLayerRef.current.addTo(map);
      setCertMapType('satellite');
    }
  };

  const handleDownloadCertificatePng = async () => {
    const certElement = document.getElementById('printable-certificate');
    if (!certElement) return;

    setIsExporting(true);
    const prevOverflow = certElement.style.overflow;
    const prevHeight = certElement.style.height;
    const prevMaxHeight = certElement.style.maxHeight;
    const prevScrollTop = certElement.scrollTop;

    try {
      certElement.scrollTop = 0;
      const fullHeight = certElement.scrollHeight;
      const fullWidth = certElement.scrollWidth;

      certElement.style.overflow = 'visible';
      certElement.style.maxHeight = 'none';
      certElement.style.height = `${fullHeight}px`;

      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(certElement, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        onclone: (clonedDoc) => {
          const clonedModal = clonedDoc.getElementById('printable-certificate');
          if (clonedModal) {
            clonedModal.style.overflow = 'visible';
            clonedModal.style.maxHeight = 'none';
            clonedModal.style.height = 'auto';
            clonedModal.style.width = `${certElement.offsetWidth}px`;
          }
        },
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Certificado-ADN-v4.11-${evaluation.lat}-${evaluation.lng}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Error al descargar la imagen del certificado.');
    } finally {
      certElement.style.overflow = prevOverflow;
      certElement.style.height = prevHeight;
      certElement.style.maxHeight = prevMaxHeight;
      certElement.scrollTop = prevScrollTop;
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Certificado Oficial de Factibilidad FTTH
              </h3>
              <p className="text-xs text-slate-400">
                Documento de validación técnica de cobertura en Costa Rica
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCertificatePng}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exportando...' : 'Descargar PNG'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-900 text-white font-sans" id="printable-certificate">
          <div className="border-b border-slate-800 pb-5 flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/30">
                ADN
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">Validador ADN v4.11 | American Data Networks</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ADN Fibra • Dirección de Redes FTTH & Infraestructura • Costa Rica
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-blue-400 block">CERT-ID: ADN-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span className="text-xs text-slate-400">Fecha: {new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border ${evaluation.badgeBg} flex items-center space-x-4 shadow-inner`}>
            <div>
              {evaluation.feasibility === 'FACTIBLE' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              {evaluation.feasibility === 'ESTUDIO' && <AlertTriangle className="w-8 h-8 text-amber-400" />}
              {evaluation.feasibility === 'NO_FACTIBLE' && <XCircle className="w-8 h-8 text-rose-400" />}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Dictamen Técnico de Cobertura</span>
              <span className={`text-base font-black ${evaluation.badgeColor}`}>{evaluation.feasibilityLabel}</span>
            </div>
          </div>

          {/* Condo alert if applicable */}
          {evaluation.condoAlert && (
            <div className="p-3.5 rounded-2xl border bg-amber-500/10 border-amber-500/30 text-amber-300 text-xs leading-relaxed">
              {evaluation.condoAlert}
            </div>
          )}

          {/* Location & Node Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ubicación Consultada</span>
              <div><b>Coordenadas:</b> <span className="font-mono text-cyan-300">{evaluation.lat}, {evaluation.lng}</span></div>
              <div><b>Provincia / Cantón:</b> {evaluation.province}, {evaluation.canton}</div>
              <div><b>Distrito / Barrio:</b> {evaluation.district}, {evaluation.neighborhood}</div>
              <div><b>Vía exacta:</b> {evaluation.exactStreet}</div>
              {evaluation.nearestCondo && (
                <div className="text-purple-300"><b>🏘️ Condominio:</b> {evaluation.nearestCondo.name} ({evaluation.condoDistanceMeters}m)</div>
              )}
              <div><b>Referencia Coloquial:</b> <span className="italic text-slate-300">"{evaluation.colloquialAddress}"</span></div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Infraestructura Asignada</span>
              <div><b>Nodo / Cierre Asignado:</b> <span className="font-bold text-white">{evaluation.nearestNode.name}</span></div>
              <div><b>Código de Cierre:</b> <span className="font-mono text-blue-400">{evaluation.nearestNode.code}</span></div>
              <div><b>Distancia Lineal:</b> <span className="font-bold text-white">{evaluation.nodeDistanceMeters} metros</span></div>
              <div><b>Recorrido Estimado (Acometida):</b> {evaluation.routingEstimate.min}m - {evaluation.routingEstimate.max}m</div>
              <div><b>Tiempo Estimado de Instalación:</b> {evaluation.installTime}</div>
            </div>
          </div>

          {/* DEDICATED MAP SECTION SHOWING CLIENT COORDINATE & ASSIGNED NODE WITH MAX CLARITY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>🗺️ Mapa Georreferenciado: Coordenada del Cliente y Nodo Asignado</span>
              </span>
              <div className="flex items-center space-x-2 print:hidden">
                <button
                  type="button"
                  onClick={handleCenterView}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-slate-700 transition flex items-center space-x-1 shadow-sm"
                  title="Centrar en la ruta entre coordenada y nodo"
                >
                  <Crosshair className="w-3 h-3 text-cyan-400" />
                  <span>Centrar Traza</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleLayer}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-slate-700 transition flex items-center space-x-1 shadow-sm"
                  title="Cambiar capa satélite / calles"
                >
                  <Layers className="w-3 h-3 text-blue-400" />
                  <span>{certMapType === 'satellite' ? 'Satélite' : 'Calles'}</span>
                </button>
              </div>
            </div>

            {/* Dedicated Map Container */}
            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
              <div ref={certMapRef} className="w-full h-full z-0" />

              {/* Sleek On-Map HUD Legend Overlay */}
              <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg text-[10px] space-y-1 max-w-[280px]">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm ${evaluation.feasibility === 'FACTIBLE' ? 'bg-emerald-400' : evaluation.feasibility === 'ESTUDIO' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
                  <span className="truncate">📍 Cliente: <span className="font-mono text-cyan-300">{evaluation.lat}, {evaluation.lng}</span></span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0 shadow-sm"></span>
                  <span className="truncate">⚡ Nodo: <span className="text-blue-300">{evaluation.nearestNode.name}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 pt-0.5 border-t border-slate-800">
                  <span className="text-cyan-400">📏</span>
                  <span>Distancia: <b className="text-white">{evaluation.nodeDistanceMeters}m</b> ({evaluation.routingEstimate.min}m - {evaluation.routingEstimate.max}m)</span>
                </div>
              </div>
            </div>

            {/* MANDATORY MAP NOTE UNDER CERTIFICATE MAP CONTAINER */}
            <div className="text-[11px] text-cyan-400 font-medium flex items-center gap-1.5 px-1 pt-1">
              <span className="w-3 h-0.5 bg-cyan-400 rounded-full inline-block"></span>
              <span>Las líneas azules son el tendido de fibra, no área de cobertura.</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800 space-y-1">
            <p>
              <b>Nota técnica:</b> Este certificado valida la factibilidad de conexión mediante la fórmula geodésica de Haversine y el inventario georreferenciado de nodos de la Gran Área Metropolitana (GAM). Todo servicio queda sujeto a inspección visual de posteo y disponibilidad de puertos en caja de empalme.
            </p>
            <p className="text-center pt-2 font-semibold text-slate-300">
              Validador ADN v4.11 | American Data Networks • Red Nacional FTTH
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
