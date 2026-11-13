/**
 * @file PropertiesInspector.tsx
 * @description Panel de propiedades contextual para editar notas y acordes seleccionados.
 */

import React from 'react';
import { ScoreNote, ScoreChord, NoteDuration, DynamicIntensity } from '../types';
import { getSolfege, NoteNotation, formatNoteName, formatPitchName, formatChordSymbol } from '../../utils/theory';
import { Volume2, Trash2 } from 'lucide-react';
import { composerAudio } from '../composerAudio';

interface PropertiesInspectorProps {
  selectedNote: ScoreNote | null;
  selectedChord: ScoreChord | null;
  notation?: NoteNotation;
  measureNumber: number;
  onUpdateNote: (updatedNote: ScoreNote) => void;
  onDeleteNote: (noteId: string) => void;
  onClearChord: () => void;
  onClearMeasureNotes?: () => void;
  onClose: () => void;
}

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
  selectedNote,
  selectedChord,
  notation = 'american',
  measureNumber,
  onUpdateNote,
  onDeleteNote,
  onClearChord,
  onClearMeasureNotes
}) => {
  if (!selectedNote && !selectedChord) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-xs">
            {measureNumber}
          </span>
          <span>Compás {measureNumber} seleccionado. Haz clic en el pentagrama para agregar notas.</span>
        </div>
        {onClearMeasureNotes && (
          <button
            type="button"
            onClick={onClearMeasureNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-800 text-xs font-semibold cursor-pointer transition-colors"
            title="Borrar todas las notas de este compás"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar notas del compás {measureNumber}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* EDICIÓN DE NOTA SELECCIONADA */}
      {selectedNote ? (
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 font-mono text-xs">
              {formatNoteName(
                `${selectedNote.step}${selectedNote.alter === 1 ? '#' : selectedNote.alter === -1 ? 'b' : ''}`,
                notation
              )}
            </div>
            <div>
              <div className="font-bold text-slate-200">
                {formatPitchName(selectedNote.pitch, notation)} · Compás {measureNumber}
              </div>
              <div className="text-[11px] text-slate-400">
                MIDI {selectedNote.midi} · Pulso {selectedNote.startBeat + 1}
              </div>
            </div>
          </div>

          <div className="w-[1px] h-6 bg-slate-800 hidden sm:block" />

          {/* Ajuste de Octava */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Octava:</span>
            <div className="flex items-center bg-slate-950 rounded border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const newOct = Math.max(2, selectedNote.octave - 1);
                  const newPitch = `${selectedNote.step}${selectedNote.alter === 1 ? '#' : selectedNote.alter === -1 ? 'b' : ''}${newOct}`;
                  onUpdateNote({
                    ...selectedNote,
                    octave: newOct,
                    pitch: newPitch,
                    midi: selectedNote.midi - 12
                  });
                }}
                className="px-2 py-1 text-slate-300 hover:text-white cursor-pointer"
                title="Bajar una octava"
              >
                -
              </button>
              <span className="px-2 font-mono font-bold text-amber-400">{selectedNote.octave}</span>
              <button
                type="button"
                onClick={() => {
                  const newOct = Math.min(6, selectedNote.octave + 1);
                  const newPitch = `${selectedNote.step}${selectedNote.alter === 1 ? '#' : selectedNote.alter === -1 ? 'b' : ''}${newOct}`;
                  onUpdateNote({
                    ...selectedNote,
                    octave: newOct,
                    pitch: newPitch,
                    midi: selectedNote.midi + 12
                  });
                }}
                className="px-2 py-1 text-slate-300 hover:text-white cursor-pointer"
                title="Subir una octava"
              >
                +
              </button>
            </div>
          </div>

          {/* Alteración */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Alteración:</span>
            <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5">
              {[
                { alter: 0, label: '♮' },
                { alter: 1, label: '♯' },
                { alter: -1, label: '♭' }
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    const newPitch = `${selectedNote.step}${item.alter === 1 ? '#' : item.alter === -1 ? 'b' : ''}${selectedNote.octave}`;
                    const midiDiff = item.alter - selectedNote.alter;
                    onUpdateNote({
                      ...selectedNote,
                      alter: item.alter,
                      pitch: newPitch,
                      midi: selectedNote.midi + midiDiff,
                      solfege: `${getSolfege(selectedNote.step)}${item.alter === 1 ? '#' : item.alter === -1 ? 'b' : ''}`
                    });
                  }}
                  className={`px-2 py-0.5 font-bold rounded cursor-pointer ${
                    selectedNote.alter === item.alter ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Figura Rítmica */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Figura:</span>
            <select
              value={selectedNote.duration}
              onChange={(e) => {
                const dur = e.target.value as NoteDuration;
                onUpdateNote({
                  ...selectedNote,
                  duration: dur,
                  durationBeats: dur === 'whole' ? 4 : dur === 'half' ? 2 : dur === 'quarter' ? 1 : dur === 'eighth' ? 0.5 : 0.25
                });
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
            >
              <option value="whole">Redonda (4t)</option>
              <option value="half">Blanca (2t)</option>
              <option value="quarter">Negra (1t)</option>
              <option value="eighth">Corchea (1/2t)</option>
              <option value="sixteenth">Semicorchea (1/4t)</option>
            </select>
          </div>

          {/* Dinámica */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Dinámica:</span>
            <select
              value={selectedNote.dynamic || 'mf'}
              onChange={(e) => onUpdateNote({ ...selectedNote, dynamic: e.target.value as DynamicIntensity })}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400 font-bold"
            >
              <option value="pp">pp (Pianissimo)</option>
              <option value="p">p (Piano)</option>
              <option value="mp">mp (Mezzopiano)</option>
              <option value="mf">mf (Mezzoforte)</option>
              <option value="f">f (Forte)</option>
              <option value="ff">ff (Fortissimo)</option>
            </select>
          </div>
        </div>
      ) : selectedChord ? (
        /* ACORDE DEL COMPÁS */
        <div className="flex items-center gap-3">
          <div className="px-2.5 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-bold text-sky-400">
            {formatChordSymbol(selectedChord.symbol, notation)}
          </div>
          <div>
            <div className="font-bold text-slate-200">
              Acorde {formatChordSymbol(selectedChord.symbol, notation)} · Compás {measureNumber}
            </div>
            <div className="text-[11px] text-slate-400">
              Notas: {selectedChord.pitches.map(p => formatPitchName(p, notation)).join(' · ')}
            </div>
          </div>
        </div>
      ) : null}

      {/* Acciones de la barra */}
      <div className="flex items-center gap-2">
        {selectedNote && (
          <>
            <button
              type="button"
              onClick={() => composerAudio.playTone(selectedNote.midi, 0.8)}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 cursor-pointer"
              title="Escuchar nota"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteNote(selectedNote.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold cursor-pointer"
              title="Eliminar nota"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </>
        )}

        {selectedChord && !selectedNote && (
          <>
            <button
              type="button"
              onClick={() => composerAudio.playChord(selectedChord.midis, 1.2)}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 cursor-pointer"
              title="Escuchar acorde"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClearChord}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold cursor-pointer"
            >
              Quitar Acorde
            </button>
          </>
        )}
      </div>
    </div>
  );
};
