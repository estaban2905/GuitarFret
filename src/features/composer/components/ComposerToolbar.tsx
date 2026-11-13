/**
 * @file ComposerToolbar.tsx
 * @description Panel superior de herramientas de composición.
 */

import type React from 'react';
import { Undo, Redo, Plus, Copy, Trash2, Download, FolderOpen, Save, FilePlus } from 'lucide-react';
import type {
  AccidentalType,
  ClefType,
  NoteDuration,
  TimeSignature
} from '../types/composer.types';

interface ComposerToolbarProps {
  clef: ClefType;
  onChangeClef: (clef: ClefType) => void;
  timeSignature: TimeSignature;
  onChangeTimeSignature: (ts: TimeSignature) => void;
  selectedDuration: NoteDuration;
  onChangeDuration: (dur: NoteDuration) => void;
  isDotted: boolean;
  onToggleDotted: () => void;
  isRestMode: boolean;
  onToggleRestMode: () => void;
  selectedAccidental: AccidentalType;
  onChangeAccidental: (acc: AccidentalType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddMeasure: () => void;
  onDuplicateMeasure: () => void;
  onDeleteMeasure: () => void;
  onTranspose: (semitones: number) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onOpenExportModal: () => void;
}

export const ComposerToolbar: React.FC<ComposerToolbarProps> = ({
  clef,
  onChangeClef,
  timeSignature,
  onChangeTimeSignature,
  selectedDuration,
  onChangeDuration,
  isDotted,
  onToggleDotted,
  isRestMode,
  onToggleRestMode,
  selectedAccidental,
  onChangeAccidental,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddMeasure,
  onDuplicateMeasure,
  onDeleteMeasure,
  onTranspose,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onOpenExportModal
}) => {
  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* 1. SELECCIÓN DE CLAVE Y MÉTRICA */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div
          className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800"
          role="group"
          aria-label="Selector de clave musical"
        >
          <button
            type="button"
            onClick={() => onChangeClef('treble')}
            aria-pressed={clef === 'treble'}
            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              clef === 'treble'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Clave de Sol (Treble)"
          >
            𝄞 Sol
          </button>
          <button
            type="button"
            onClick={() => onChangeClef('bass')}
            aria-pressed={clef === 'bass'}
            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              clef === 'bass'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Clave de Fa (Bass)"
          >
            𝄢 Fa
          </button>
          <button
            type="button"
            onClick={() => onChangeClef('alto')}
            aria-pressed={clef === 'alto'}
            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              clef === 'alto'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Clave de Do en 3.ª línea (Alto)"
          >
            𝄡 Do
          </button>
        </div>

        <select
          value={timeSignature}
          onChange={e => onChangeTimeSignature(e.target.value as TimeSignature)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          title="Métrica del compás"
          aria-label="Métrica del compás"
        >
          <option value="4/4">4/4 (Cuaternario)</option>
          <option value="3/4">3/4 (Vals / Ternario)</option>
          <option value="2/4">2/4 (Binario)</option>
          <option value="5/4">5/4 (Amalgama)</option>
          <option value="6/8">6/8 (Compuesto binario)</option>
          <option value="7/8">7/8 (Amalgama 7/8)</option>
          <option value="9/8">9/8 (Compuesto ternario)</option>
          <option value="12/8">12/8 (Compuesto cuaternario)</option>
        </select>
      </div>

      {/* 2. PALETA DE FIGURAS RÍTMICAS Y ALTERACIONES */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap">
        <button
          type="button"
          onClick={() => onChangeDuration('whole')}
          aria-pressed={selectedDuration === 'whole' && !isRestMode}
          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
            selectedDuration === 'whole' && !isRestMode
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Redonda (4 tiempos en 4/4)"
          aria-label="Redonda"
        >
          𝅝
        </button>

        <button
          type="button"
          onClick={() => onChangeDuration('half')}
          aria-pressed={selectedDuration === 'half' && !isRestMode}
          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
            selectedDuration === 'half' && !isRestMode
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Blanca (2 tiempos en 4/4)"
          aria-label="Blanca"
        >
          𝅗𝅥
        </button>

        <button
          type="button"
          onClick={() => onChangeDuration('quarter')}
          aria-pressed={selectedDuration === 'quarter' && !isRestMode}
          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
            selectedDuration === 'quarter' && !isRestMode
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Negra (1 tiempo en 4/4)"
          aria-label="Negra"
        >
          𝅘𝅥
        </button>

        <button
          type="button"
          onClick={() => onChangeDuration('eighth')}
          aria-pressed={selectedDuration === 'eighth' && !isRestMode}
          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
            selectedDuration === 'eighth' && !isRestMode
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Corchea (1/2 tiempo en 4/4)"
          aria-label="Corchea"
        >
          𝅘𝅥𝅮
        </button>

        <button
          type="button"
          onClick={() => onChangeDuration('sixteenth')}
          aria-pressed={selectedDuration === 'sixteenth' && !isRestMode}
          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
            selectedDuration === 'sixteenth' && !isRestMode
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Semicorchea (1/4 tiempo en 4/4)"
          aria-label="Semicorchea"
        >
          𝅘𝅥𝅯
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

        <button
          type="button"
          onClick={onToggleDotted}
          aria-pressed={isDotted}
          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
            isDotted ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
          title="Puntillo (aumenta 50% la duración)"
        >
          • Puntillo
        </button>

        <button
          type="button"
          onClick={onToggleRestMode}
          aria-pressed={isRestMode}
          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
            isRestMode ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
          title="Modo Silencio"
        >
          𝄽 Silencio
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

        <button
          type="button"
          onClick={() => onChangeAccidental('natural')}
          aria-pressed={selectedAccidental === 'natural'}
          className={`px-1.5 py-1 rounded text-xs font-bold cursor-pointer ${
            selectedAccidental === 'natural'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Becuadro / Natural (♮)"
          aria-label="Natural"
        >
          ♮
        </button>
        <button
          type="button"
          onClick={() => onChangeAccidental('sharp')}
          aria-pressed={selectedAccidental === 'sharp'}
          className={`px-1.5 py-1 rounded text-xs font-bold cursor-pointer ${
            selectedAccidental === 'sharp'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Sostenido (♯)"
          aria-label="Sostenido"
        >
          ♯
        </button>
        <button
          type="button"
          onClick={() => onChangeAccidental('flat')}
          aria-pressed={selectedAccidental === 'flat'}
          className={`px-1.5 py-1 rounded text-xs font-bold cursor-pointer ${
            selectedAccidental === 'flat'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Bemol (♭)"
          aria-label="Bemol"
        >
          ♭
        </button>
      </div>

      {/* 3. EDICIÓN: DESHACER / TRANSPONER / COMPASES */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Deshacer (Ctrl+Z)"
            aria-label="Deshacer"
          >
            <Undo className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Rehacer (Ctrl+Y)"
            aria-label="Rehacer"
          >
            <Redo className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onTranspose(-1)}
            className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Bajar 1 semitono (-1 ST)"
          >
            -1 ST
          </button>
          <button
            type="button"
            onClick={() => onTranspose(1)}
            className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Subir 1 semitono (+1 ST)"
          >
            +1 ST
          </button>
          <button
            type="button"
            onClick={() => onTranspose(12)}
            className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Subir 1 octava (+8va)"
          >
            +8va
          </button>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={onAddMeasure}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded cursor-pointer"
            title="Añadir un compás al final"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            <span>Compás</span>
          </button>
          <button
            type="button"
            onClick={onDuplicateMeasure}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Duplicar compás seleccionado"
            aria-label="Duplicar compás seleccionado"
          >
            <Copy className="w-3 h-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDeleteMeasure}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded cursor-pointer"
            title="Eliminar compás seleccionado"
            aria-label="Eliminar compás seleccionado"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={onNewProject}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Nueva composición vacía"
            aria-label="Nueva composición"
          >
            <FilePlus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onSaveProject}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Guardar proyecto en el navegador"
            aria-label="Guardar proyecto"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onLoadProject}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Cargar proyecto guardado"
            aria-label="Cargar proyecto"
          >
            <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors ml-1"
            title="Exportar a MIDI, MusicXML o Imprimir partitura"
          >
            <Download className="w-3 h-3" aria-hidden="true" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
