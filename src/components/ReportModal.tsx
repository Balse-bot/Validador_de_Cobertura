import React, { useState } from 'react';
import { EvaluationResult } from '../utils/fiberEngine';
import { X, Printer, ShieldCheck, Wifi, CheckCircle2, AlertTriangle, XCircle, Camera, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: EvaluationResult;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, evaluation }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCaptureMap = async () => {
    const mapElement = document.getElementById('leaflet-map-container');
    if (!mapElement) {
      alert("No se encontró el contenedor del mapa para capturar.");
      return;
    }

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
    } catch (err) {
      console.error(err);
      alert("Error al capturar la imagen del mapa.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadImage = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `certificado-fibra-cr-${evaluation.lat}-${evaluation.lng}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between print:hidden">
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
              onClick={handleCaptureMap}
              disabled={isCapturing}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition shadow-md disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCapturing ? 'Capturando...' : 'Capturar Mapa'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition shadow-md"
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

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-900 text-white font-sans" id="printable-certificate">
          <div className="border-b border-slate-800 pb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <Wifi className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-black tracking-tight">FIBRA-CR TELECOM</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Dirección Nacional de Infraestructura y Redes FTTH • Costa Rica
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">CERT-ID: CR-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span className="text-xs text-slate-400">Fecha: {new Date().toLocaleDateString('es-CR')}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${evaluation.badgeBg} flex items-center space-x-4 shadow-inner`}>
            <div>
              {evaluation.feasibility === 'FACTIBLE' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              {evaluation.feasibility === 'ESTUDIO' && <AlertTriangle className="w-8 h-8 text-amber-400" />}
              {evaluation.feasibility === 'NO_FACTIBLE' && <XCircle className="w-8 h-8 text-rose-400" />}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Estado de Factibilidad FTTH</span>
              <span className={`text-base font-black ${evaluation.badgeColor}`}>{evaluation.feasibilityLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ubicación Evaluada</span>
              <div><b>Lat, Lng:</b> <span className="font-mono">{evaluation.lat}, {evaluation.lng}</span></div>
              <div><b>Provincia:</b> {evaluation.province}</div>
              <div><b>Cantón / Distrito:</b> {evaluation.canton}, {evaluation.district}</div>
              <div><b>Barrio / Vía:</b> {evaluation.neighborhood}, {evaluation.exactStreet}</div>
              {evaluation.nearestCondo && (
                <div className="text-purple-300"><b>🏘️ Condominio:</b> {evaluation.nearestCondo.name} ({evaluation.condoDistanceMeters}m)</div>
              )}
              <div><b>Referencia:</b> "{evaluation.colloquialAddress}"</div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Infraestructura y Red Asignada</span>
              <div><b>Nodo Más Cercano:</b> {evaluation.nearestNode.name}</div>
              <div><b>Código de Nodo:</b> {evaluation.nearestNode.code}</div>
              <div><b>Distancia Lineal:</b> {evaluation.nodeDistanceMeters} metros</div>
              <div><b>Recorrido Estimado (Tendido):</b> {evaluation.routingEstimate.min}m - {evaluation.routingEstimate.max}m</div>
              <div><b>Velocidad Máxima:</b> {evaluation.estimatedSpeed}</div>
              <div><b>Tiempo de Instalación:</b> {evaluation.installTime}</div>
            </div>
          </div>

          {capturedImage && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Captura Georreferenciada del Mapa</span>
                <button
                  onClick={handleDownloadImage}
                  className="text-xs text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar Imagen</span>
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
                <img src={capturedImage} alt="Mapa satelital de cobertura" className="w-full h-auto max-h-[300px] object-cover" />
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400 space-y-2 pt-4 border-t border-slate-800">
            <p>
              <b>Nota técnica oficial:</b> Este certificado valida la factibilidad de fibra óptica (FTTH) calculada mediante coordenadas GPS y proximidad a nodos en las provincias de la GAM (San José, Heredia, Cartago, Alajuela) en Costa Rica. Sujeto a verificación técnica en campo.
            </p>
            <p className="text-center pt-2 font-semibold text-slate-300">
              🇨🇷 Costa Rica — Red Nacional de Fibra Óptica FTTH • Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
