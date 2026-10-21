import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FiberNode, Condominium } from '../data/crData';
import { EvaluationResult, DEFAULT_FOOTPRINTS } from '../utils/fiberEngine';
import { Layers, Navigation } from 'lucide-react';

interface MapViewProps {
  evaluation: EvaluationResult;
  onSelectCoordinates: (lat: number, lng: number) => void;
  nodes: FiberNode[];
  condos: Condominium[];
  showNodes: boolean;
}

export const MapView: React.FC<MapViewProps> = ({ evaluation, onSelectCoordinates, nodes, condos, showNodes }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapType, setMapType] = useState<'dark' | 'streets'>('dark');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([evaluation.lat, evaluation.lng], 14);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const darkMatter = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 19,
        }
      );

      const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });

      darkMatter.addTo(map);
      (map as any)._currentBaseLayer = darkMatter;
      (map as any)._darkLayer = darkMatter;
      (map as any)._streetsLayer = streets;

      map.on('click', (e: L.LeafletMouseEvent) => {
        onSelectCoordinates(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
      });

      markersLayerRef.current = L.layerGroup().addTo(map);
      polylineLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markersLayerRef.current || !polylineLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    polylineLayerRef.current.clearLayers();

    map.setView([evaluation.lat, evaluation.lng], map.getZoom(), { animate: true });

    // Render nodes and condos only if showNodes is true
    if (showNodes) {
      nodes.forEach((node) => {
        const isNearest = node.id === evaluation.nearestNode.id;
        const nodeIcon = L.divIcon({
          className: 'custom-node-icon',
          html: `
            <div style="
              background-color: ${isNearest ? '#3b82f6' : '#10b981'};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
              border: 2px solid white;
              font-size: 12px;
              font-weight: bold;
            ">⚡</div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([node.lat, node.lng], { icon: nodeIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; color: #0f172a;">
            <b style="color: #2563eb;">${node.name}</b><br/>
            <b>Provincia:</b> ${node.province} (${node.canton})<br/>
            <b>Capacidad:</b> ${node.capacityGbps} Gbps<br/>
            <b>Estado:</b> <span style="color: #10b981;">${node.status}</span>
          </div>
        `);
        markersLayerRef.current?.addLayer(marker);
      });

      condos.forEach((condo) => {
        const condoIcon = L.divIcon({
          className: 'custom-condo-icon',
          html: `
            <div style="
              background-color: #8b5cf6;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              border: 2px solid white;
              font-size: 11px;
            ">🏢</div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([condo.lat, condo.lng], { icon: condoIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; color: #0f172a;">
            <b style="color: #7c3aed;">${condo.name}</b><br/>
            <b>Provincia:</b> ${condo.province} (${condo.canton})<br/>
            <b>Puerto FTTH:</b> ${condo.hasDirectPort ? 'Disponible' : 'En expansión'}
          </div>
        `);
        markersLayerRef.current?.addLayer(marker);
      });
    }

    // Always ensure evaluated point and nearest node are clearly visible
    const evaluatedIcon = L.divIcon({
      className: 'custom-evaluated-icon',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: ${evaluation.feasibility === 'FACTIBLE' ? '#10b981' : evaluation.feasibility === 'ESTUDIO' ? '#f59e0b' : '#ef4444'};
            opacity: 0.5;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            background-color: ${evaluation.feasibility === 'FACTIBLE' ? '#059669' : evaluation.feasibility === 'ESTUDIO' ? '#d97706' : '#dc2626'};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            border: 2px solid white;
            font-size: 16px;
            z-index: 10;
          ">📍</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const evaluatedMarker = L.marker([evaluation.lat, evaluation.lng], { icon: evaluatedIcon });
    evaluatedMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 13px; color: #0f172a;">
        <b>Punto Evaluado</b><br/>
        <b>Lat, Lng:</b> ${evaluation.lat}, ${evaluation.lng}<br/>
        <b>Factibilidad:</b> <span style="font-weight: bold;">${evaluation.feasibility}</span><br/>
        <b>Nodo Cercano:</b> ${evaluation.nearestNode.name} (${evaluation.nodeDistanceMeters}m)
      </div>
    `);
    markersLayerRef.current.addLayer(evaluatedMarker);

    // If nodes are hidden, at least show the nearest node marker so user sees the connection target
    if (!showNodes && evaluation.nearestNode) {
      const nearestNodeIcon = L.divIcon({
        className: 'custom-nearest-node-icon',
        html: `
          <div style="
            background-color: #3b82f6;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            border: 2px solid white;
            font-size: 15px;
            font-weight: bold;
          ">⚡</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const nearestMarker = L.marker([evaluation.nearestNode.lat, evaluation.nearestNode.lng], { icon: nearestNodeIcon });
      nearestMarker.bindPopup(`<b>${evaluation.nearestNode.name}</b> (Nodo más cercano)`);
      markersLayerRef.current.addLayer(nearestMarker);
    }

    const polyline = L.polyline(
      [
        [evaluation.lat, evaluation.lng],
        [evaluation.nearestNode.lat, evaluation.nearestNode.lng],
      ],
      {
        color: evaluation.feasibility === 'FACTIBLE' ? '#10b981' : evaluation.feasibility === 'ESTUDIO' ? '#f59e0b' : '#ef4444',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.9,
      }
    );

    const midLat = (evaluation.lat + evaluation.nearestNode.lat) / 2;
    const midLng = (evaluation.lng + evaluation.nearestNode.lng) / 2;

    const distanceBadgeIcon = L.divIcon({
      className: 'distance-badge',
      html: `
        <div style="
          background: #0f172a;
          color: white;
          padding: 4px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.3);
        ">
          ⚡ ${evaluation.nodeDistanceMeters} m al nodo
        </div>
      `,
      iconSize: [110, 26],
      iconAnchor: [55, 13],
    });

    const distanceMarker = L.marker([midLat, midLng], { icon: distanceBadgeIcon });

    // Render backbone fiber lines in bright electric blue with defined dark border
    if (nodes.length > 1) {
      for (let i = 0; i < Math.min(nodes.length - 1, 30); i++) {
        const n1 = nodes[i];
        const n2 = nodes[i + 1];
        if (Math.abs(n1.lat - n2.lat) < 0.09 && Math.abs(n1.lng - n2.lng) < 0.09) {
          // Defined dark outer border
          L.polyline([[n1.lat, n1.lng], [n2.lat, n2.lng]], {
            color: '#081a2e',
            weight: 4.5,
            opacity: 0.9,
            interactive: false,
          }).addTo(polylineLayerRef.current);
          // Bright electric blue inner line
          L.polyline([[n1.lat, n1.lng], [n2.lat, n2.lng]], {
            color: '#00d4ff',
            weight: 2.2,
            opacity: 0.95,
            interactive: false,
          }).addTo(polylineLayerRef.current);
        }
      }
    }

        // Render Official FTTH Footprint Polygons (CartoDB Dark Matter with bright cyan border)
    DEFAULT_FOOTPRINTS.forEach(poly => {
      if (!poly.pts || poly.pts.length < 3) return;
      L.polygon(poly.pts, {
        color: '#00d4ff',
        weight: 2.5,
        fillColor: '#00d4ff',
        fillOpacity: 0.22,
        interactive: false,
      }).addTo(polylineLayerRef.current!);
    });

    polylineLayerRef.current.addLayer(polyline);
    polylineLayerRef.current.addLayer(distanceMarker);
  }, [evaluation, nodes, condos, showNodes]);

  const toggleMapType = (type: 'dark' | 'streets') => {
    const map = mapRef.current;
    if (!map) return;
    setMapType(type);

    const dark = (map as any)._darkLayer;
    const streets = (map as any)._streetsLayer;
    const current = (map as any)._currentBaseLayer;

    if (type === 'dark' && current !== dark) {
      map.removeLayer(current);
      dark.addTo(map);
      (map as any)._currentBaseLayer = dark;
    } else if (type === 'streets' && current !== streets) {
      map.removeLayer(current);
      streets.addTo(map);
      (map as any)._currentBaseLayer = streets;
    }
  };

  return (
    <div className="flex flex-col space-y-2 w-full h-full">
      <div id="leaflet-map-container" className="relative w-full h-[400px] lg:h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-10" />

        <div className="absolute top-4 left-4 z-20 bg-slate-900/85 backdrop-blur-xl p-1.5 rounded-2xl shadow-xl border border-slate-800 flex flex-wrap gap-1.5">
          <button
            onClick={() => toggleMapType('dark')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              mapType === 'dark'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Modo Oscuro</span>
          </button>
          <button
            onClick={() => toggleMapType('streets')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              mapType === 'streets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Calles</span>
          </button>
        </div>

        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/80 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-xl border border-slate-800 text-xs text-slate-300 space-y-2 hidden sm:block">
          <div className="font-bold text-white mb-1">Red American Data Networks (GAM)</div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-1 rounded-full bg-cyan-400"></div>
            <span>Tendido de Fibra Óptica</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Nodo Principal Activo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Condominio Residencial</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Punto Evaluado</span>
          </div>
        </div>
      </div>

      {/* MANDATORY MAP NOTE: EXACT TEXT REQUIRED UNDER MAP CONTAINER */}
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-md">
        <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
          <span className="w-3.5 h-1 bg-cyan-400 rounded-full inline-block shrink-0 shadow-sm"></span>
          <span>Las líneas azules son el tendido de fibra, no área de cobertura.</span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">Validador ADN v4.11 | American Data Networks</span>
      </div>
    </div>
  );
};
