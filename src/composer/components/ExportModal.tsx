/**
 * @file ExportModal.tsx
 * @description Modal para exportar partituras a MIDI, MusicXML, PDF e importar/exportar proyectos JSON.
 */

import React, { useRef } from 'react';
import { CompositionProject } from '../types';
import { generateMidiFile, generateMusicXml, downloadFile } from '../exportUtils';
import {
  X,
  FileMusic,
  FileCode,
  Printer,
  Download,
  Upload,
  Check
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CompositionProject;
  onImportProject: (imported: CompositionProject) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedNotification, setCopiedNotification] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportMidi = () => {
    const bytes = generateMidiFile(project);
    const cleanName = (project.title || 'composicion').toLowerCase().replace(/\s+/g, '_');
    downloadFile(bytes, `${cleanName}.mid`, 'audio/midi');
  };

  const handleExportMusicXml = () => {
    const xml = generateMusicXml(project);
    const cleanName = (project.title || 'composicion').toLowerCase().replace(/\s+/g, '_');
    downloadFile(xml, `${cleanName}.musicxml`, 'application/vnd.recordare.musicxml+xml');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const cleanName = (project.title || 'composicion').toLowerCase().replace(/\s+/g, '_');
    downloadFile(jsonStr, `${cleanName}_proyecto.json`, 'application/json');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as CompositionProject;
        if (parsed.measures && Array.isArray(parsed.measures)) {
          onImportProject(parsed);
          onClose();
        } else {
          alert('El archivo no tiene el formato de proyecto válido.');
        }
      } catch {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-xs">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar y Guardar Composición</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Formatos estándar compatibles con MuseScore, Guitar Pro y DAWs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opciones de Exportación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opción 1: Archivo MIDI */}
          <button
            type="button"
            onClick={handleExportMidi}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 group-hover:text-amber-400 text-sm">
                Archivo MIDI (.mid)
              </span>
              <FileMusic className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Descarga un archivo SMF estándar con todas las alturas, duraciones y tempo para abrir en cualquier DAW.
            </p>
          </button>

          {/* Opción 2: MusicXML */}
          <button
            type="button"
            onClick={handleExportMusicXml}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 group-hover:text-sky-400 text-sm">
                MusicXML (.musicxml)
              </span>
              <FileCode className="w-5 h-5 text-sky-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Partitura profesional completa para abrir y editar en MuseScore, Guitar Pro, Sibelius o Finale.
            </p>
          </button>

          {/* Opción 3: Imprimir / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 group-hover:text-emerald-400 text-sm">
                Imprimir o Guardar PDF
              </span>
              <Printer className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Abre el cuadro de diálogo de impresión para imprimir directamente la partitura o guardarla como PDF.
            </p>
          </button>

          {/* Opción 4: Guardar JSON de Proyecto */}
          <button
            type="button"
            onClick={handleExportJson}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 group-hover:text-purple-400 text-sm">
                Proyecto JSON
              </span>
              <Download className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Copia de seguridad completa editable para restaurar la composición en cualquier momento.
            </p>
          </button>
        </div>

        {/* Importar archivo JSON */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar archivo de proyecto (.json)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
