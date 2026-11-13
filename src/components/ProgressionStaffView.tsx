/**
 * @file ProgressionStaffView.tsx
 * @description Vista principal independiente del Pentagrama y Compositor Armónico:
 * - Selección de tonalidad (ej. Tonalidad de Do, Sol, Re, etc. Mayor o Menor)
 * - Progresiones sugeridas (I-IV-V, I-V-vi-IV, ii-V-I...)
 * - Visualización de acordes y escalas compatibles
 * - Inserción de acordes en el pentagrama
 * - Inserción de notas melódicas de la escala en los tiempos del compás (4/4, 3/4, 6/8)
 * - Reproductor interactivo con audio sincronizado de guitarra y cursor en tiempo real
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TimeSignature,
  NoteDuration,
  MeasureData,
  getKeyHarmonics,
  getChordVoicing,
  createDefaultComposition,
  CompatibleScale
} from '../utils/staffTheory';
import { ROOT_NOTES, getSolfege } from '../utils/theory';
import { audioEngine } from '../utils/audio';
import { ScoreStaff } from './ScoreStaff';
import {
  Play,
  Square,
  Repeat,
  Plus,
  Trash2,
  Sparkles,
  Music2,
  Sliders,
  Layers,
  ArrowRight,
  Info,
  Undo2
} from 'lucide-react';

export const ProgressionStaffView: React.FC = () => {
  // 1. Tonalidad y Modo
  const [tonic, setTonic] = useState<string>('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');

  // 2. Métrica y Tempo
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [bpm, setBpm] = useState<number>(100);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // 3. Estado de Compases del Pentagrama
  const [measures, setMeasures] = useState<MeasureData[]>(() => createDefaultComposition('C'));
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState<number>(0);

  // 4. Edición de Melodía: Escala activa y figura rítmica
  const [selectedScaleIndex, setSelectedScaleIndex] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');

  // 5. Reproducción de Audio
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeMeasureIndex, setActiveMeasureIndex] = useState<number | null>(null);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const playbackTimerRef = useRef<number | null>(null);

  // Armonía teórica calculada con Tonal
  const harmonics = useMemo(() => {
    return getKeyHarmonics(tonic, mode);
  }, [tonic, mode]);

  const activeScale: CompatibleScale = harmonics.compatibleScales[selectedScaleIndex] || harmonics.compatibleScales[0];

  // Cantidad de pulsos según métrica
  const totalBeats = timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6;

  // Detener reproducción al desmontar
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current !== null) {
        window.clearTimeout(playbackTimerRef.current);
      }
    };
  }, []);

  // Cargar una progresión predefinida
  const handleLoadProgressionPreset = (numerals: string[]) => {
    const newMeasures: MeasureData[] = numerals.map((numeral, idx) => {
      const found = harmonics.chords.find(c => c.numeral.toLowerCase() === numeral.toLowerCase()) || harmonics.chords[0];
      return {
        id: `m-${Date.now()}-${idx}`,
        measureNumber: idx + 1,
        chord: {
          id: `c-${Date.now()}-${idx}`,
          symbol: found.symbol,
          name: found.name,
          solfege: found.solfege,
          romanNumeral: numeral,
          pitches: found.pitches,
          midis: found.midis,
          beat: 0
        },
        notes: []
      };
    });

    setMeasures(newMeasures);
    setSelectedMeasureIndex(0);
    stopPlayback();
  };

  // Agregar un acorde al compás seleccionado
  const handleAddChordToMeasure = (chordItem: typeof harmonics.chords[0]) => {
    // Reproducir sonido del acorde
    audioEngine.strumChord(chordItem.midis.map(m => ({ midi: m })), 35, 'down');

    setMeasures(prev => {
      const updated = [...prev];
      const targetIndex = selectedMeasureIndex < updated.length ? selectedMeasureIndex : updated.length - 1;
      if (targetIndex >= 0 && targetIndex < updated.length) {
        updated[targetIndex] = {
          ...updated[targetIndex],
          chord: {
            id: `chord-${Date.now()}`,
            symbol: chordItem.symbol,
            name: chordItem.name,
            solfege: chordItem.solfege,
            romanNumeral: chordItem.numeral,
            pitches: chordItem.pitches,
            midis: chordItem.midis,
            beat: 0
          }
        };
      }
      return updated;
    });
  };

  // Agregar una nota melódica de la escala al compás seleccionado
  const handleAddScaleNote = (pitch: string, solfege: string) => {
    const midi = (audioEngine as any).playMidi ? (audioEngine as any).playMidi : null;
    const freq = 440 * Math.pow(2, ((requirePitchMidi(pitch)) - 69) / 12);
    audioEngine.playNote(freq, 1.4);

    setMeasures(prev => {
      const updated = [...prev];
      const mIdx = Math.min(selectedMeasureIndex, updated.length - 1);
      if (mIdx < 0 || mIdx >= updated.length) return prev;

      const currentMeasure = updated[mIdx];
      // Calcular siguiente beat disponible
      let nextBeat = 0;
      if (currentMeasure.notes.length > 0) {
        const lastNote = currentMeasure.notes[currentMeasure.notes.length - 1];
        const lastDurBeats = getDurationBeats(lastNote.duration, timeSignature);
        nextBeat = lastNote.beat + lastDurBeats;
      }

      // Si el compás ya está lleno, avanzar automáticamente al siguiente o crear uno nuevo
      let targetMIdx = mIdx;
      if (nextBeat >= totalBeats) {
        if (mIdx + 1 < updated.length) {
          targetMIdx = mIdx + 1;
          setSelectedMeasureIndex(targetMIdx);
          nextBeat = 0;
        } else {
          // Crear nuevo compás automáticamente
          const newM: MeasureData = {
            id: `m-${Date.now()}`,
            measureNumber: updated.length + 1,
            notes: []
          };
          updated.push(newM);
          targetMIdx = updated.length - 1;
          setSelectedMeasureIndex(targetMIdx);
          nextBeat = 0;
        }
      }

      const noteDurationBeats = getDurationBeats(selectedDuration, timeSignature);
      const newNote = {
        id: `note-${Date.now()}-${Math.random()}`,
        pitch,
        midi: requirePitchMidi(pitch),
        solfege,
        duration: selectedDuration,
        beat: Math.min(nextBeat, totalBeats - noteDurationBeats)
      };

      updated[targetMIdx] = {
        ...updated[targetMIdx],
        notes: [...updated[targetMIdx].notes, newNote]
      };

      return updated;
    });
  };

  // Añadir un nuevo compás vacío
  const handleAddMeasure = () => {
    setMeasures(prev => [
      ...prev,
      {
        id: `measure-${Date.now()}`,
        measureNumber: prev.length + 1,
        notes: []
      }
    ]);
    setSelectedMeasureIndex(measures.length);
  };

  // Eliminar un compás
  const handleDeleteMeasure = (index: number) => {
    if (measures.length <= 1) return;
    setMeasures(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((m, i) => ({ ...m, measureNumber: i + 1 }));
    });
    setSelectedMeasureIndex(Math.max(0, index - 1));
  };

  // Eliminar una nota específica
  const handleDeleteNote = (mIdx: number, noteId: string) => {
    setMeasures(prev => {
      const updated = [...prev];
      if (updated[mIdx]) {
        updated[mIdx] = {
          ...updated[mIdx],
          notes: updated[mIdx].notes.filter(n => n.id !== noteId)
        };
      }
      return updated;
    });
  };

  // Limpiar pentagrama por completo
  const handleClearAll = () => {
    stopPlayback();
    setMeasures([
      {
        id: `m-${Date.now()}`,
        measureNumber: 1,
        notes: []
      }
    ]);
    setSelectedMeasureIndex(0);
  };

  // Cargar ejemplo completo de melodía + acordes
  const handleLoadDemoComposition = () => {
    stopPlayback();
    setMeasures(createDefaultComposition(tonic));
    setSelectedMeasureIndex(0);
  };

  // -------------------------------------------------------------
  // REPRODUCCIÓN DEL PENTAGRAMA
  // -------------------------------------------------------------
  const stopPlayback = () => {
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaying(false);
    setActiveMeasureIndex(null);
    setActiveBeat(null);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (measures.length === 0) return;

    setIsPlaying(true);
    let curMeasureIdx = 0;
    let curBeat = 0;

    // Duración de un pulso de negra en milisegundos según BPM
    const beatMs = Math.round((60000 / bpm));

    const playNextTick = () => {
      if (curMeasureIdx >= measures.length) {
        if (isLooping) {
          curMeasureIdx = 0;
          curBeat = 0;
        } else {
          stopPlayback();
          return;
        }
      }

      const currentMeasure = measures[curMeasureIdx];
      setActiveMeasureIndex(curMeasureIdx);
      setActiveBeat(curBeat);

      // 1. Si es el primer tiempo (beat 0) y el compás tiene acorde, hacerlo sonar
      if (curBeat === 0 && currentMeasure.chord && currentMeasure.chord.midis.length > 0) {
        audioEngine.strumChord(
          currentMeasure.chord.midis.map(m => ({ midi: m })),
          30,
          'down'
        );
      }

      // 2. Hacer sonar notas melódicas programadas en este tiempo exacto
      const notesOnBeat = currentMeasure.notes.filter(n => Math.floor(n.beat) === curBeat);
      notesOnBeat.forEach(note => {
        audioEngine.playMidi(note.midi, 1.2, 0.85);
      });

      // Avanzar al siguiente pulso
      curBeat++;
      if (curBeat >= totalBeats) {
        curBeat = 0;
        curMeasureIdx++;
      }

      playbackTimerRef.current = window.setTimeout(playNextTick, beatMs);
    };

    playNextTick();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Barra de Tonalidad y Progresiones */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
        {/* Fila superior: Selector de Tonalidad */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-base tracking-tight text-white">
                Tonalidad:
              </span>
            </div>

            {/* Selector de Tónica */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-slate-400 text-xs font-medium">Tónica:</span>
              <select
                value={tonic}
                onChange={e => setTonic(e.target.value)}
                className="bg-transparent text-amber-300 font-bold text-sm focus:outline-none cursor-pointer"
                aria-label="Tónica de la tonalidad"
              >
                {ROOT_NOTES.map(r => (
                  <option key={`staff-root-${r}`} value={r} className="bg-slate-900 text-slate-100">
                    {getSolfege(r)} ({r})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector Mayor / Menor */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('major')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'major'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mayor
              </button>
              <button
                type="button"
                onClick={() => setMode('minor')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'minor'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Menor
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span className="text-amber-400 font-bold">{harmonics.name}</span>
            <span className="text-slate-600">·</span>
            <span>Armadura: {harmonics.keySignature === '0' ? 'Sin alteraciones' : harmonics.keySignature}</span>
          </div>
        </div>

        {/* Fila de Progresiones Sugeridas */}
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Progresiones Armónicas Sugeridas en {harmonics.solfegeTonic}:</span>
            </span>
            <span className="text-[11px] text-slate-500">Haz clic en un preset para cargar los compases</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {harmonics.presets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadProgressionPreset(preset.numerals)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 text-slate-200 transition-all cursor-pointer flex flex-col text-left group"
                title={preset.description}
              >
                <span className="font-bold text-amber-300 group-hover:text-amber-200 flex items-center gap-1">
                  {preset.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {preset.numerals.join(' → ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. El Pentagrama Musical Interactivo (Elemento Central) */}
      <section className="w-full">
        <ScoreStaff
          measures={measures}
          timeSignature={timeSignature}
          activeMeasureIndex={activeMeasureIndex}
          activeBeat={activeBeat}
          onSelectMeasure={setSelectedMeasureIndex}
          onDeleteNote={handleDeleteNote}
          onDeleteMeasure={handleDeleteMeasure}
          selectedMeasureIndex={selectedMeasureIndex}
        />
      </section>

      {/* 3. Barra de Transporte & Controles del Pentagrama */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Controles de Reproducción */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Detener</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Reproducir Pentagrama</span>
              </>
            )}
          </button>

          {/* Bucle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isLooping
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Repetir en bucle continuo"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bucle</span>
          </button>

          {/* Selector de Tempo (BPM) */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 text-[11px]">Tempo:</span>
            <select
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="bg-transparent text-slate-100 font-mono font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value={75} className="bg-slate-900 text-slate-100">75 BPM (Largo)</option>
              <option value={90} className="bg-slate-900 text-slate-100">90 BPM (Andante)</option>
              <option value={100} className="bg-slate-900 text-slate-100">100 BPM (Moderato)</option>
              <option value={120} className="bg-slate-900 text-slate-100">120 BPM (Allegro)</option>
              <option value={140} className="bg-slate-900 text-slate-100">140 BPM (Vivace)</option>
            </select>
          </div>

          {/* Selector de Métrica de Compás */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            {(['4/4', '3/4', '6/8'] as TimeSignature[]).map(ts => (
              <button
                key={`ts-${ts}`}
                type="button"
                onClick={() => setTimeSignature(ts)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  timeSignature === ts
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ts}
              </button>
            ))}
          </div>
        </div>

        {/* Acciones de Edición de Compases */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddMeasure}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold hover:text-white transition-all cursor-pointer"
            title="Añadir un nuevo compás al final"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Compás</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDemoComposition}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sky-300 font-semibold transition-all cursor-pointer"
            title="Cargar composición melódica de ejemplo"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Ejemplo</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-800/50 transition-colors cursor-pointer"
            title="Vaciar pentagrama"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Panel Dividido: Acordes de la Tonalidad & Escalas Melódicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* COLUMNA 1: Paleta de Acordes Diatónicos */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm tracking-tight text-white uppercase tracking-wider text-[11px]">
                Acordes de {harmonics.name}
              </h3>
            </div>
            <span className="text-[11px] text-amber-400 font-mono">
              Compás activo: #{selectedMeasureIndex + 1}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Haz clic en un acorde para escucharlo y asignarlo al compás seleccionado:
          </p>

          {/* Cuadrícula de Acordes Diatónicos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {harmonics.chords.map((chordItem, cIdx) => (
              <button
                key={`harm-chord-${chordItem.symbol}-${cIdx}`}
                type="button"
                onClick={() => handleAddChordToMeasure(chordItem)}
                className="p-2.5 rounded-xl text-left bg-slate-950 border border-slate-800 hover:border-amber-500/80 hover:bg-slate-850 text-slate-200 transition-all cursor-pointer flex flex-col gap-0.5 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold font-mono text-sm text-amber-300 group-hover:text-amber-200">
                    {chordItem.symbol}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">
                    {chordItem.numeral}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">
                  {chordItem.name}
                </span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Notas: {chordItem.pitches.map(p => getSolfege(p.slice(0, -1))).join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: Escalas Compatibles y Constructor de Melodía */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-sm tracking-tight text-white uppercase tracking-wider text-[11px]">
                Escalas Compatibles y Notas
              </h3>
            </div>
            <span className="text-[11px] text-sky-400">
              {activeScale.notes.length} notas
            </span>
          </div>

          {/* Selector de Escala Compatible */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Escala para melodía:
            </label>
            <select
              value={selectedScaleIndex}
              onChange={e => setSelectedScaleIndex(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-300 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {harmonics.compatibleScales.map((scale, sIdx) => (
                <option key={scale.id} value={sIdx} className="bg-slate-900 text-slate-100">
                  {scale.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 italic">
              {activeScale.description}
            </p>
          </div>

          {/* Selector de Figura Rítmica */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Duración rítmica de la nota:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { dur: 'quarter' as NoteDuration, label: 'Negra (1t)', sym: '𝅘𝅥' },
                { dur: 'eighth' as NoteDuration, label: 'Corchea (½t)', sym: '𝅘𝅥𝅮' },
                { dur: 'half' as NoteDuration, label: 'Blanca (2t)', sym: '𝅗𝅥' },
                { dur: 'whole' as NoteDuration, label: 'Redonda (4t)', sym: '𝅝' }
              ].map(item => (
                <button
                  key={item.dur}
                  type="button"
                  onClick={() => setSelectedDuration(item.dur)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    selectedDuration === item.dur
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-base leading-none">{item.sym}</span>
                  <span className="text-[11px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Teclas/Botones de las Notas de la Escala para Insertar en el Pentagrama */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pulsa una nota para insertarla en el compás #{selectedMeasureIndex + 1}:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {activeScale.suggestedPitches.map((pitch, pIdx) => {
                const solfege = getSolfege(pitch.slice(0, -1));
                return (
                  <button
                    key={`scale-pitch-${pitch}-${pIdx}`}
                    type="button"
                    onClick={() => handleAddScaleNote(pitch, solfege)}
                    className="flex-1 min-w-[55px] py-2.5 px-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-400 hover:bg-slate-850 text-slate-100 font-mono font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95"
                    title={`Insertar ${solfege} (${pitch}) en el pentagrama`}
                  >
                    <span className="text-sky-300 text-sm">{solfege}</span>
                    <span className="text-[10px] text-slate-500">{pitch}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper interno para obtener el valor MIDI aproximado de un pitch string
function requirePitchMidi(pitch: string): number {
  try {
    const pc = pitch.slice(0, -1);
    const oct = parseInt(pitch.slice(-1), 10) || 4;
    const semitonesMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    const semitone = semitonesMap[pc] ?? 0;
    return (oct + 1) * 12 + semitone;
  } catch {
    return 60;
  }
}

// Helper para convertir duración a cantidad de pulsos/beats
function getDurationBeats(duration: NoteDuration, timeSignature: TimeSignature): number {
  if (timeSignature === '6/8') {
    switch (duration) {
      case 'eighth': return 1;
      case 'quarter': return 2;
      case 'half': return 4;
      case 'whole': return 6;
      default: return 1;
    }
  }

  switch (duration) {
    case 'whole': return 4;
    case 'half': return 2;
    case 'quarter': return 1;
    case 'eighth': return 0.5;
    default: return 1;
  }
}
