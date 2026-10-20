import React from 'react';
import { EvaluationResult } from '../utils/fiberEngine';
import { X, Printer, ShieldCheck, Wifi, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: EvaluationResult;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, evaluation }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Certificado Oficial de Factibilidad
              </h3>
              <p className="text-xs text-slate-400">
                Documento de validación técnica de cobertura FTTH en Costa Rica
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-900 text-white">
          <div className="border-b border-slate-800 pb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <Wifi className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-black tracking-tight">FIBRA-CR TELECOM</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Dirección General de Redes y Cobertura FTTH • Costa Rica
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">CERT-ID: CR-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span className="text-xs text-slate-400">Fecha: {new Date().toLocaleDateString('es-CR')}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${evaluation.badgeBg} flex items-center space-x-4`}>
            <div>
              {evaluation.feasibility === 'FACTIBLE' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              {evaluation.feasibility === 'ESTUDIO' && <AlertTriangle className="w-8 h-8 text-amber-400" />}
              {evaluation.feasibility === 'NO_FACTIBLE' && <XCircle className="w-8 h-8 text-rose-400" />}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Estado de Factibilidad</span>
              <span className={`text-base font-black ${evaluation.badgeColor}`}>{evaluation.feasibilityLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ubicación Evaluada</span>
              <div><b>Lat, Lng:</b> {evaluation.lat}, {evaluation.lng}</div>
              <div><b>Provincia:</b> {evaluation.province}</div>
              <div><b>Cantón:</b> {evaluation.canton}</div>
              <div><b>Referencia:</b> "{evaluation.colloquialAddress}"</div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Infraestructura de Red</span>
              <div><b>Nodo Más Cercano:</b> {evaluation.nearestNode.name}</div>
              <div><b>Código de Nodo:</b> {evaluation.nearestNode.code}</div>
              <div><b>Distancia al Nodo:</b> {evaluation.nodeDistanceMeters} metros</div>
              <div><b>Velocidad Máxima:</b> {evaluation.estimatedSpeed}</div>
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-2 pt-4 border-t border-slate-800">
            <p>
              <b>Nota técnica:</b> Este certificado fue generado automáticamente por el sistema geoespacial de validación de fibra óptica para las provincias de la GAM (San José, Heredia, Cartago, Alajuela) en Costa Rica.
            </p>
            <p className="text-center pt-4 font-semibold text-slate-300">
              🇨🇷 Costa Rica — Red Nacional de Fibra Óptica FTTH
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
