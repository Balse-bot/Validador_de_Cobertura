import React from 'react';
import { Wifi, Moon, Sun, Database, FileText, Download } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenNodesModal: () => void;
  onOpenReportModal: () => void;
  onExportJSON: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  onOpenNodesModal,
  onOpenReportModal,
  onExportJSON,
}) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 shadow-sm transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Validador ADN v4.11 <span className="text-blue-400 font-semibold">| American Data Networks</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ADN Fibra 🇨🇷
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ADN Fibra • San José • Heredia • Cartago • Alajuela (GAM)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenNodesModal}
            className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition border border-slate-700/80"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Nodos & Condos</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition border border-slate-700/80"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Certificado</span>
          </button>

          <button
            onClick={onExportJSON}
            title="Exportar JSON"
            className="p-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition border border-slate-700/80"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition border border-slate-700/80"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
