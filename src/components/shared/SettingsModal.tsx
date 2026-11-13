/**
 * @file SettingsModal.tsx
 * @description Modal accesible de Configuración para GuitarFret:
 * - Notación musical (Americana C D E vs Española Do Re Mi)
 * - Afinación de la guitarra (Estándar, Drop D, Medio tono abajo)
 * - Cantidad de trastes visibles en el diapasón (15, 17, 21)
 * - Modo zurdo (mástil espejado)
 * - Opciones de audio y restablecer
 */

import type React from 'react';
import { useEffect, useRef } from 'react';
import { X, Sliders, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { TUNINGS } from '../../constants/music';
import { formatTuningLabels } from '../../utils/notation';
import type { NoteNotation, TuningId } from '../../types/music.types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notation: NoteNotation;
  onChangeNotation: (notation: NoteNotation) => void;
  tuningId: TuningId;
  onChangeTuning: (tuning: TuningId) => void;
  isLeftHanded: boolean;
  onToggleLeftHanded: () => void;
  fretCount: number;
  onChangeFretCount: (count: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  notation,
  onChangeNotation,
  tuningId,
  onChangeTuning,
  isLeftHanded,
  onToggleLeftHanded,
  fretCount,
  onChangeFretCount,
  isMuted,
  onToggleMute,
  onReset
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const standardLabels = formatTuningLabels(TUNINGS.standard.labels, notation).join(' · ');
  const dropDLabels = formatTuningLabels(TUNINGS.dropD.labels, notation).join(' · ');
  const halfStepLabels = formatTuningLabels(TUNINGS.halfStepDown.labels, notation).join(' · ');
  const activeTuningLabels = formatTuningLabels(TUNINGS[tuningId].labels, notation).join(' ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-slate-100"
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h2 id="settings-modal-title" className="text-base font-bold tracking-tight text-white">
              Configuración del Instrumento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar configuración"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 1. Notación musical */}
        <div className="flex flex-col gap-2" role="group" aria-labelledby="settings-notation-label">
          <span
            id="settings-notation-label"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Notación musical
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'american' as const, label: 'Americana', example: 'C · D · E' },
              { id: 'spanish' as const, label: 'Española', example: 'Do · Re · Mi' }
            ].map(opt => {
              const isSelected = notation === opt.id;
              return (
                <button
                  key={`notation-${opt.id}`}
                  type="button"
                  onClick={() => onChangeNotation(opt.id)}
                  aria-pressed={isSelected}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`font-mono text-[10px] ${isSelected ? 'text-slate-900/80' : 'text-slate-500'}`}
                  >
                    {opt.example}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Afinación */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="settings-tuning-select"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Afinación
          </label>
          <select
            id="settings-tuning-select"
            value={tuningId}
            onChange={e => onChangeTuning(e.target.value as TuningId)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
          >
            <option value="standard">Estándar ({standardLabels})</option>
            <option value="dropD">
              Drop {formatTuningLabels(['D'], notation)[0]} ({dropDLabels})
            </option>
            <option value="halfStepDown">Medio tono abajo ({halfStepLabels})</option>
          </select>
          <span className="text-[11px] text-slate-500 font-mono">
            Notas activas: {activeTuningLabels}
          </span>
        </div>

        {/* 3. Cantidad de Trastes */}
        <div className="flex flex-col gap-2" role="group" aria-labelledby="settings-frets-label">
          <span
            id="settings-frets-label"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Trastes visibles en el diapasón
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[15, 17, 21].map(cnt => {
              const isSelected = fretCount === cnt;
              return (
                <button
                  key={`fret-count-${cnt}`}
                  type="button"
                  onClick={() => onChangeFretCount(cnt)}
                  aria-pressed={isSelected}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {cnt} trastes
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Modo Zurdo */}
        <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
          <div>
            <span className="text-sm font-semibold text-slate-200 block">Modo para zurdos</span>
            <span className="text-xs text-slate-500">
              Espeja la orientación del diapasón (cejuela a la derecha)
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleLeftHanded}
            role="switch"
            aria-checked={isLeftHanded}
            aria-label="Modo para zurdos"
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              isLeftHanded ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isLeftHanded ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 5. Sonido y Restablecer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={isMuted}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{isMuted ? 'Sonido silenciado' : 'Sonido activado'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Botón Listo */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Listo
        </button>
      </div>
    </div>
  );
};
