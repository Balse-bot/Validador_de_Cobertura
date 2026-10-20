import React, { useState } from 'react';
import { EvaluationResult, parseMapUrl } from '../utils/fiberEngine';
import { PRESET_LOCATIONS } from '../data/crData';
import { Navigation, Compass, Search, CheckCircle2, AlertTriangle, XCircle, Zap, ShieldCheck, Link2, Building, MapPin, Network, Eye, EyeOff } from 'lucide-react';

interface EvaluationPanelProps {
  evaluation: EvaluationResult;
  onUpdateCoords: (lat: number, lng: number) => void;
  onOpenReportModal: () => void;
  onOpenNodesModal: () => void;
  showNodes: boolean;
  onToggleShowNodes: () => void;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  evaluation,
  onUpdateCoords,
  onOpenReportModal,
  onOpenNodesModal,
  showNodes,
  onToggleShowNodes,
}) => {
  const [latInput, setLatInput] = useState(evaluation.lat.toString());
  const [lngInput, setLngInput] = useState(evaluation.lng.toString());
  const [mapUrlInput, setMapUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  React.useEffect(() => {
    setLatInput(evaluation.lat.toString());
    setLngInput(evaluation.lng.toString());
  }, [evaluation.lat, evaluation.lng]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      onUpdateCoords(lat, lng);
    }
  };

  const handleUrlPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMapUrlInput(val);
    setUrlError('');

    if (val.trim().length > 10) {
      const coords = parseMapUrl(val);
      if (coords) {
        onUpdateCoords(coords.lat, coords.lng);
        setMapUrlInput('');
      } else {
        setUrlError('No se pudieron extraer coordenadas del enlace.');
      }
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPreset(val);
    const found = PRESET_LOCATIONS.find((p) => p.name === val);
    if (found) {
      onUpdateCoords(found.lat, found.lng);
    }
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(5));
          const lng = Number(position.coords.longitude.toFixed(5));
          onUpdateCoords(lat, lng);
        },
        () => {
          alert("No se pudo obtener tu ubicación GPS.");
        }
      );
    }
  };

  return (
    <div className="bg-slate-900/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800 p-6 flex flex-col space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-white flex items-center space-x-2">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Panel de Cobertura Fibra Óptica CR</span>
          </h2>
          <button
            onClick={handleGeoLocation}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition border border-blue-500/20 shadow-sm"
          >
            <Navigation className="w-3 h-3" />
            <span>GPS</span>
          </button>
        </div>

        {/* Prominent Nodes Layer Visibility Toggle (OFF by default) */}
        <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 p-4 rounded-2xl border border-blue-500/30 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-slate-200">
            <div className={`p-2 rounded-xl ${showNodes ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {showNodes ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Visualización de Nodos en Mapa</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {showNodes ? '🟢 ACTIVA (Todos los nodos visibles)' : '🔴 APAGADA (Recomendado para búsqueda fluida)'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleShowNodes}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shrink-0 ${
              showNodes
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
            }`}
          >
            {showNodes ? 'ON (Visible)' : 'OFF (Oculto)'}
          </button>
        </div>

        {/* Smart Search Box (Coordinates & Waze/Google Maps links) */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
            <Link2 className="w-3 h-3 text-cyan-400" />
            <span>Buscador Inteligente (Pegar Link Waze / Google Maps o Coordenadas)</span>
          </label>
          <input
            type="text"
            value={mapUrlInput}
            onChange={handleUrlPaste}
            placeholder="Ej: 9.9281, -84.0907 o link de Maps/Waze..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {urlError && <p className="text-[10px] text-rose-400">{urlError}</p>}
        </div>

        {/* Preset Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Zonas Principales en Costa Rica (GAM)
          </label>
          <select
            value={selectedPreset}
            onChange={handlePresetChange}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">Seleccione una zona rápida...</option>
            {PRESET_LOCATIONS.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name} ({loc.province})
              </option>
            ))}
          </select>
        </div>

        {/* Manual Latitude & Longitude Inputs */}
        <form onSubmit={handleManualSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                Latitud
              </label>
              <input
                type="text"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="9.9333"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                Longitud
              </label>
              <input
                type="text"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="-84.1085"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Evaluar Cobertura al Instante</span>
          </button>
        </form>
      </div>

      <hr className="border-slate-800" />

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Resultado de Factibilidad FTTH</span>
          </h3>
          <button
            onClick={onOpenNodesModal}
            className="text-[11px] text-blue-400 font-semibold hover:underline flex items-center space-x-1"
          >
            <Building className="w-3 h-3" />
            <span>Inventario Nodos</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className={`p-4 rounded-2xl border ${evaluation.badgeBg} flex items-start space-x-3 shadow-inner`}>
          <div className="mt-0.5 shrink-0">
            {evaluation.feasibility === 'FACTIBLE' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {evaluation.feasibility === 'ESTUDIO' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {evaluation.feasibility === 'NO_FACTIBLE' && <XCircle className="w-5 h-5 text-rose-400" />}
          </div>
          <div>
            <div className={`text-xs font-black tracking-tight ${evaluation.badgeColor}`}>
              {evaluation.feasibilityLabel}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {evaluation.feasibilityDesc}
            </p>
          </div>
        </div>

        {evaluation.condoAlert && (
          <div className="p-3 rounded-2xl border bg-amber-500/15 border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{evaluation.condoAlert}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Nodo más cercano</span>
            <span className="font-bold text-white truncate block mt-0.5">
              {evaluation.nodeDistanceMeters} metros
            </span>
            <span className="text-[10px] text-blue-400 block truncate mt-0.5 font-mono">
              {evaluation.nearestNode.name}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Recorrido Estimado</span>
            <span className="font-bold text-white truncate block mt-0.5">
              {evaluation.routingEstimate.min}m - {evaluation.routingEstimate.max}m
            </span>
            <span className="text-[10px] text-cyan-400 block truncate mt-0.5">
              Tendido de fibra óptica
            </span>
          </div>
        </div>

        {/* Territorial & Residential Location Breakdown */}
        <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
            <span className="text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>Ubicación Exacta:</span>
            </span>
            <span className="font-semibold text-white text-right">{evaluation.province}, {evaluation.canton}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Distrito / Barrio:</span>
            <span className="font-medium text-slate-200">{evaluation.district}, {evaluation.neighborhood}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Vía / Calle:</span>
            <span className="font-medium text-slate-200">{evaluation.exactStreet}</span>
          </div>
          {evaluation.nearestCondo && (
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-purple-300 flex items-center space-x-1">
                <Building className="w-3 h-3" />
                <span>🏘️ Condominio cercano:</span>
              </span>
              <span className="font-bold text-purple-200">{evaluation.nearestCondo.name} ({evaluation.condoDistanceMeters}m)</span>
            </div>
          )}
        </div>

        {/* Subsequent Nodes List */}
        {evaluation.subsequentNodes.length > 0 && (
          <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/60 space-y-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center space-x-1">
              <Network className="w-3 h-3 text-cyan-400" />
              <span>Nodos de Respaldo Cercanos:</span>
            </span>
            <div className="space-y-1 pt-1">
              {evaluation.subsequentNodes.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-900/50 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-slate-300 truncate max-w-[200px]">{item.node.name}</span>
                  <span className="font-mono font-bold text-blue-400">{item.distance}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onOpenReportModal}
          className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg transition border border-slate-700"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Generar Certificado Oficial de Factibilidad</span>
        </button>
      </div>
    </div>
  );
};
