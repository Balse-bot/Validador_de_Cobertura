import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { EvaluationPanel } from './components/EvaluationPanel';
import { NodesModal } from './components/NodesModal';
import { ReportModal } from './components/ReportModal';
import { evaluateLocation, EvaluationResult } from './utils/fiberEngine';
import { PRESET_LOCATIONS, FIBER_NODES, CONDOMINIUMS, FiberNode, Condominium } from './data/crData';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [nodes, setNodes] = useState<FiberNode[]>(FIBER_NODES);
  const [condos, setCondos] = useState<Condominium[]>(CONDOMINIUMS);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: PRESET_LOCATIONS[0].lat,
    lng: PRESET_LOCATIONS[0].lng,
  });

  const [evaluation, setEvaluation] = useState<EvaluationResult>(() =>
    evaluateLocation(PRESET_LOCATIONS[0].lat, PRESET_LOCATIONS[0].lng, FIBER_NODES, CONDOMINIUMS)
  );

  const [isNodesModalOpen, setIsNodesModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleUpdateCoords = (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });
    const result = evaluateLocation(lat, lng, nodes, condos);
    setEvaluation(result);
  };

  const handleCustomDataLoaded = (newNodes: FiberNode[], newCondos: Condominium[], fileName: string) => {
    setNodes(newNodes);
    setCondos(newCondos);
    setLoadedFileName(fileName);
    const result = evaluateLocation(currentCoords.lat, currentCoords.lng, newNodes, newCondos);
    setEvaluation(result);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evaluation, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `factibilidad-fibra-cr-${evaluation.lat}-${evaluation.lng}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenNodesModal={() => setIsNodesModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onExportJSON={handleExportJSON}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[440px] shrink-0 z-20">
          <EvaluationPanel
            evaluation={evaluation}
            onUpdateCoords={handleUpdateCoords}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onOpenNodesModal={() => setIsNodesModalOpen(true)}
            onCustomDataLoaded={handleCustomDataLoaded}
            loadedFileName={loadedFileName}
          />
        </div>

        <div className="flex-1 flex flex-col z-10">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              🛰️ Vista Satelital Interactiva (GAM: San José, Heredia, Cartago, Alajuela)
            </span>
            <span className="text-xs font-mono bg-slate-900/80 border border-slate-800 text-blue-400 px-3 py-1 rounded-full shadow-inner">
              Lat: {evaluation.lat} • Lng: {evaluation.lng}
            </span>
          </div>
          <div className="flex-1 w-full min-h-[500px] lg:min-h-[700px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <MapView
              evaluation={evaluation}
              onSelectCoordinates={handleUpdateCoords}
              nodes={nodes}
              condos={condos}
            />
          </div>
        </div>
      </main>

      <NodesModal
        isOpen={isNodesModalOpen}
        onClose={() => setIsNodesModalOpen(false)}
        onSelectLocation={handleUpdateCoords}
        nodes={nodes}
        condos={condos}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        evaluation={evaluation}
      />
    </div>
  );
}
