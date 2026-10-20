import React, { useState } from 'react';
import { FiberNode, Condominium } from '../data/crData';
import { X, Database, Building, Search, MapPin } from 'lucide-react';

interface NodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  nodes: FiberNode[];
  condos: Condominium[];
}

export const NodesModal: React.FC<NodesModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  nodes,
  condos,
}) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'condos'>('nodes');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredNodes = nodes.filter(
    (n) =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.canton.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCondos = condos.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.canton.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Inventario GAM (San José, Heredia, Cartago, Alajuela)
              </h3>
              <p className="text-xs text-slate-400">
                Nodos y condominios activos de fibra óptica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 pb-3 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('nodes')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-medium transition flex items-center justify-center space-x-2 ${
                activeTab === 'nodes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Nodos ({nodes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('condos')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-medium transition flex items-center justify-center space-x-2 ${
                activeTab === 'condos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Condominios ({condos.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, provincia o cantón..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeTab === 'nodes' ? (
            filteredNodes.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No se encontraron nodos.
              </div>
            ) : (
              filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between hover:border-blue-500 transition shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">
                        {node.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                        {node.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-3">
                      <span>📍 {node.canton}, {node.province}</span>
                      <span>⚡ {node.capacityGbps} Gbps</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectLocation(node.lat, node.lng);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Evaluar</span>
                  </button>
                </div>
              ))
            )
          ) : (
            filteredCondos.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No se encontraron condominios.
              </div>
            ) : (
              filteredCondos.map((condo) => (
                <div
                  key={condo.id}
                  className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between hover:border-purple-500 transition shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">
                        {condo.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/20 text-purple-300">
                        {condo.hasDirectPort ? 'FTTH Directo' : 'Expansión'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-3">
                      <span>📍 {condo.canton}, {condo.province}</span>
                      <span>🏗️ {condo.developer}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectLocation(condo.lat, condo.lng);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Evaluar</span>
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
