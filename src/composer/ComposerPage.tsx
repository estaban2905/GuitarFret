/**
 * @file ComposerPage.tsx
 * @description Módulo principal independiente del Editor de Composición Musical:
 * - Diseñado como software profesional de notación y composición musical
 * - Totalmente aislado con sus propios estados, historial (deshacer/rehacer) y motor de audio
 * - Integración con StaffCanvas, HarmonicSidebar, ComposerToolbar, PropertiesInspector y TransportBar
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CompositionProject,
  Measure,
  ScoreNote,
  ScoreChord,
  ClefType,
  TimeSignature,
  NoteDuration,
  AccidentalType,
  InstrumentType
} from './types';
import {
  getKeySignatureInfo,
  getMeasureCapacityBeats,
  createScoreNoteFromPitch,
  createVoicingForChord,
  getDiatonicChords,
  transposeNote,
  STEP_INDEX
} from './musicTheoryEngine';
import { composerAudio } from './composerAudio';
import { ComposerToolbar } from './components/ComposerToolbar';
import { HarmonicSidebar } from './components/HarmonicSidebar';
import { StaffCanvas } from './components/StaffCanvas';
import { PropertiesInspector } from './components/PropertiesInspector';
import { TransportBar } from './components/TransportBar';
import { ExportModal } from './components/ExportModal';
import { NoteNotation } from '../utils/theory';

const STORAGE_KEY = 'guitarfret_composer_saved_project_v1';

/**
 * Genera una composición inicial por defecto con 4 compases (C - G - Am - F).
 */
function createInitialProject(): CompositionProject {
  const initialMeasures: Measure[] = [
    {
      id: 'm-1',
      number: 1,
      timeSignature: '4/4',
      clef: 'treble',
      chord: {
        id: 'c-1',
        symbol: 'C',
        name: 'Do Mayor',
        solfege: 'Do',
        romanNumeral: 'I',
        harmonicFunction: 'tonic',
        pitches: ['C4', 'E4', 'G4'],
        midis: [60, 64, 67],
        startBeat: 0,
        durationBeats: 4
      },
      notes: [
        { id: 'n-1-1', step: 'C', alter: 0, octave: 4, duration: 'quarter', startBeat: 0, durationBeats: 1, midi: 60, pitch: 'C4', solfege: 'Do' },
        { id: 'n-1-2', step: 'E', alter: 0, octave: 4, duration: 'quarter', startBeat: 1, durationBeats: 1, midi: 64, pitch: 'E4', solfege: 'Mi' },
        { id: 'n-1-3', step: 'G', alter: 0, octave: 4, duration: 'half', startBeat: 2, durationBeats: 2, midi: 67, pitch: 'G4', solfege: 'Sol' }
      ]
    },
    {
      id: 'm-2',
      number: 2,
      timeSignature: '4/4',
      clef: 'treble',
      chord: {
        id: 'c-2',
        symbol: 'G',
        name: 'Sol Mayor',
        solfege: 'Sol',
        romanNumeral: 'V',
        harmonicFunction: 'dominant',
        pitches: ['G4', 'B4', 'D5'],
        midis: [67, 71, 74],
        startBeat: 0,
        durationBeats: 4
      },
      notes: [
        { id: 'n-2-1', step: 'D', alter: 0, octave: 4, duration: 'quarter', startBeat: 0, durationBeats: 1, midi: 62, pitch: 'D4', solfege: 'Re' },
        { id: 'n-2-2', step: 'G', alter: 0, octave: 4, duration: 'quarter', startBeat: 1, durationBeats: 1, midi: 67, pitch: 'G4', solfege: 'Sol' },
        { id: 'n-2-3', step: 'B', alter: 0, octave: 4, duration: 'half', startBeat: 2, durationBeats: 2, midi: 71, pitch: 'B4', solfege: 'Si' }
      ]
    },
    {
      id: 'm-3',
      number: 3,
      timeSignature: '4/4',
      clef: 'treble',
      chord: {
        id: 'c-3',
        symbol: 'Am',
        name: 'La Menor',
        solfege: 'Lam',
        romanNumeral: 'vi',
        harmonicFunction: 'tonic',
        pitches: ['A4', 'C5', 'E5'],
        midis: [69, 72, 76],
        startBeat: 0,
        durationBeats: 4
      },
      notes: [
        { id: 'n-3-1', step: 'A', alter: 0, octave: 4, duration: 'quarter', startBeat: 0, durationBeats: 1, midi: 69, pitch: 'A4', solfege: 'La' },
        { id: 'n-3-2', step: 'C', alter: 0, octave: 5, duration: 'quarter', startBeat: 1, durationBeats: 1, midi: 72, pitch: 'C5', solfege: 'Do' },
        { id: 'n-3-3', step: 'E', alter: 0, octave: 5, duration: 'half', startBeat: 2, durationBeats: 2, midi: 76, pitch: 'E5', solfege: 'Mi' }
      ]
    },
    {
      id: 'm-4',
      number: 4,
      timeSignature: '4/4',
      clef: 'treble',
      chord: {
        id: 'c-4',
        symbol: 'F',
        name: 'Fa Mayor',
        solfege: 'Fa',
        romanNumeral: 'IV',
        harmonicFunction: 'subdominant',
        pitches: ['F4', 'A4', 'C5'],
        midis: [65, 69, 72],
        startBeat: 0,
        durationBeats: 4
      },
      notes: [
        { id: 'n-4-1', step: 'F', alter: 0, octave: 4, duration: 'quarter', startBeat: 0, durationBeats: 1, midi: 65, pitch: 'F4', solfege: 'Fa' },
        { id: 'n-4-2', step: 'A', alter: 0, octave: 4, duration: 'quarter', startBeat: 1, durationBeats: 1, midi: 69, pitch: 'A4', solfege: 'La' },
        { id: 'n-4-3', step: 'C', alter: 0, octave: 5, duration: 'half', startBeat: 2, durationBeats: 2, midi: 72, pitch: 'C5', solfege: 'Do' }
      ]
    }
  ];

  return {
    id: 'project-default',
    title: 'Mi Primera Composición',
    composer: 'GuitarFret Composer',
    tempo: 120,
    key: 'C',
    mode: 'major',
    timeSignature: '4/4',
    clef: 'treble',
    measures: initialMeasures,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

interface ComposerPageProps {
  notation?: NoteNotation;
}

export const ComposerPage: React.FC<ComposerPageProps> = ({ notation = 'american' }) => {
  // 1. Estado del Proyecto
  const [project, setProject] = useState<CompositionProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.measures) && parsed.measures.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignorar error de parseo y cargar default
    }
    return createInitialProject();
  });

  // Pila de Deshacer / Rehacer
  const [historyPast, setHistoryPast] = useState<CompositionProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<CompositionProject[]>([]);

  // Guardar estado en historial antes de modificar
  const pushHistory = useCallback((prevProject: CompositionProject) => {
    setHistoryPast(past => [...past.slice(-20), prevProject]);
    setHistoryFuture([]);
  }, []);

  // 2. Selección activa en el pentagrama
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState<number>(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // 3. Herramientas activas de la barra superior
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [isDotted, setIsDotted] = useState<boolean>(false);
  const [isRestMode, setIsRestMode] = useState<boolean>(false);
  const [selectedAccidental, setSelectedAccidental] = useState<AccidentalType>('natural');

  // 4. Parámetros de Reproducción
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [volume, setVolume] = useState<number>(0.8);
  const [activePlaybackMeasure, setActivePlaybackMeasure] = useState<number | null>(null);
  const [activePlaybackBeat, setActivePlaybackBeat] = useState<number | null>(null);

  // 5. Modal de Exportación
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Guardado automático en localStorage al modificar la composición
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Ignore storage quota errors
    }
  }, [project]);

  // Actualizar instrumento en el motor de audio
  useEffect(() => {
    composerAudio.setInstrument(instrument);
  }, [instrument]);

  useEffect(() => {
    composerAudio.setVolume(volume);
  }, [volume]);

  // Información calculada de la tonalidad
  const keyInfo = React.useMemo(() => {
    return getKeySignatureInfo(project.key, project.mode, notation);
  }, [project.key, project.mode, notation]);

  // Nota y acorde actualmente seleccionados
  const selectedMeasure = project.measures[selectedMeasureIndex] || project.measures[0];
  const selectedNote = React.useMemo(() => {
    if (!selectedNoteId || !selectedMeasure) return null;
    return selectedMeasure.notes.find(n => n.id === selectedNoteId) || null;
  }, [selectedMeasure, selectedNoteId]);

  // ==========================================
  // MANEJADORES DE HERRAMIENTAS Y ACCIONES
  // ==========================================

  // Deshacer
  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryFuture(future => [project, ...future]);
    setHistoryPast(past => past.slice(0, -1));
    setProject(previous);
  };

  // Rehacer
  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryPast(past => [...past, project]);
    setHistoryFuture(future => future.slice(1));
    setProject(next);
  };

  // Cambio de Clave (Sol, Fa, Do)
  const handleChangeClef = (newClef: ClefType) => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      clef: newClef,
      measures: prev.measures.map(m => ({ ...m, clef: newClef }))
    }));
  };

  // Cambio de Métrica (4/4, 3/4, 6/8...)
  const handleChangeTimeSignature = (newTs: TimeSignature) => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      timeSignature: newTs,
      measures: prev.measures.map(m => ({ ...m, timeSignature: newTs }))
    }));
  };

  // Cambio de Tonalidad (Do, Sol, Re... Mayor/Menor)
  const handleChangeKey = (tonic: string, mode: 'major' | 'minor') => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      key: tonic,
      mode
    }));
  };

  // Transposición general de la partitura
  const handleTranspose = (semitones: number) => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map(m => ({
        ...m,
        notes: m.notes.map(n => transposeNote(n, semitones)),
        chord: m.chord
          ? {
              ...m.chord,
              midis: m.chord.midis.map(mid => Math.max(24, Math.min(96, mid + semitones)))
            }
          : undefined
      }))
    }));
  };

  // Añadir un nuevo compás
  const handleAddMeasure = () => {
    pushHistory(project);
    const newMeasureNumber = project.measures.length + 1;
    const newMeasure: Measure = {
      id: `m-${Date.now()}-${newMeasureNumber}`,
      number: newMeasureNumber,
      timeSignature: project.timeSignature,
      clef: project.clef,
      notes: []
    };
    setProject(prev => ({
      ...prev,
      measures: [...prev.measures, newMeasure]
    }));
    setSelectedMeasureIndex(project.measures.length);
  };

  // Duplicar compás seleccionado
  const handleDuplicateMeasure = () => {
    if (!selectedMeasure) return;
    pushHistory(project);
    const duplicated: Measure = {
      ...selectedMeasure,
      id: `m-${Date.now()}-dup`,
      number: project.measures.length + 1,
      notes: selectedMeasure.notes.map(n => ({ ...n, id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }))
    };
    setProject(prev => ({
      ...prev,
      measures: [...prev.measures, duplicated]
    }));
    setSelectedMeasureIndex(project.measures.length);
  };

  // Eliminar compás seleccionado
  const handleDeleteMeasure = () => {
    if (project.measures.length <= 1) return; // Mínimo 1 compás
    pushHistory(project);
    const updatedMeasures = project.measures
      .filter((_, idx) => idx !== selectedMeasureIndex)
      .map((m, idx) => ({ ...m, number: idx + 1 }));

    setProject(prev => ({
      ...prev,
      measures: updatedMeasures
    }));
    setSelectedMeasureIndex(Math.max(0, selectedMeasureIndex - 1));
    setSelectedNoteId(null);
  };

  // Nueva composición
  const handleNewProject = () => {
    if (window.confirm('¿Deseas iniciar una nueva composición en blanco? Se perderán los cambios no guardados en archivo.')) {
      pushHistory(project);
      setProject(createInitialProject());
      setSelectedMeasureIndex(0);
      setSelectedNoteId(null);
    }
  };

  // Guardar proyecto en localStorage explícitamente
  const handleSaveProject = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    alert('¡Proyecto guardado con éxito en el almacenamiento local!');
  };

  // Cargar proyecto desde localStorage
  const handleLoadProject = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        pushHistory(project);
        setProject(JSON.parse(saved));
        alert('¡Proyecto cargado con éxito!');
      } else {
        alert('No hay ningún proyecto guardado previamente.');
      }
    } catch {
      alert('Error al cargar el proyecto.');
    }
  };

  // Clic en el pentagrama para agregar nota o silencio
  const handleStaffClickToAddNote = (
    measureIndex: number,
    step: string,
    octave: number,
    beat: number
  ) => {
    const targetMeasure = project.measures[measureIndex];
    if (!targetMeasure) return;

    pushHistory(project);

    // Calcular alteración
    let alterVal = 0;
    if (selectedAccidental === 'sharp') alterVal = 1;
    else if (selectedAccidental === 'flat') alterVal = -1;

    // Calcular nombre de pitch
    const pitchStr = `${step}${alterVal === 1 ? '#' : alterVal === -1 ? 'b' : ''}${octave}`;
    const newNote = createScoreNoteFromPitch(pitchStr, selectedDuration, beat, isDotted);

    if (isRestMode) {
      newNote.isRest = true;
    }

    // Reproducir sonido inmediato de la nota colocada
    if (!newNote.isRest) {
      composerAudio.playTone(newNote.midi, 0.6);
    }

    // Evitar notas duplicadas idénticas en el mismo pulso exacto
    const existingIndex = targetMeasure.notes.findIndex(
      n => n.pitch === newNote.pitch && Math.abs(n.startBeat - newNote.startBeat) < 0.2
    );
    let updatedNotes: ScoreNote[];
    if (existingIndex >= 0) {
      updatedNotes = targetMeasure.notes.map((n, i) => i === existingIndex ? newNote : n);
    } else {
      updatedNotes = [...targetMeasure.notes, newNote].sort((a, b) => a.startBeat - b.startBeat);
    }

    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, idx) => idx === measureIndex ? { ...m, notes: updatedNotes } : m)
    }));

    setSelectedMeasureIndex(measureIndex);
    setSelectedNoteId(newNote.id);
  };

  // Seleccionar nota para edición
  const handleSelectNote = (note: ScoreNote, measureIndex: number) => {
    setSelectedMeasureIndex(measureIndex);
    setSelectedNoteId(note.id);
    if (!note.isRest && note.midi > 0) {
      composerAudio.playTone(note.midi, 0.5);
    }
  };

  // Actualizar propiedades de la nota seleccionada
  const handleUpdateSelectedNote = (updatedNote: ScoreNote) => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, mIdx) => {
        if (mIdx !== selectedMeasureIndex) return m;
        return {
          ...m,
          notes: m.notes.map(n => n.id === updatedNote.id ? updatedNote : n)
        };
      })
    }));
    if (!updatedNote.isRest && updatedNote.midi > 0) {
      composerAudio.playTone(updatedNote.midi, 0.5);
    }
  };

  // Eliminar nota
  const handleDeleteNote = (measureIndex: number, noteId: string) => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, mIdx) => {
        if (mIdx !== measureIndex) return m;
        return {
          ...m,
          notes: m.notes.filter(n => n.id !== noteId)
        };
      })
    }));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  };

  // Quitar acorde del compás
  const handleClearChord = () => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, idx) => idx === selectedMeasureIndex ? { ...m, chord: undefined } : m)
    }));
  };

  // Vaciar todas las notas del compás activo
  const handleClearMeasureNotes = () => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, idx) => idx === selectedMeasureIndex ? { ...m, notes: [] } : m)
    }));
    setSelectedNoteId(null);
  };

  // Aplicar un acorde a un compás específico
  const handleApplyChordToMeasure = (chord: ScoreChord, measureIndex: number) => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, idx) => idx === measureIndex ? { ...m, chord } : m)
    }));
    composerAudio.playChord(chord.midis, 1.2);
  };

  // Aplicar progresión armónica (reparte acordes por los compases)
  const handleApplyProgressionToMeasures = (chordNumerals: string[]) => {
    pushHistory(project);
    const diatonicList = getDiatonicChords(project.key, project.mode, project.clef);

    const findDiatonicMatch = (numeral: string) => {
      const exact = diatonicList.find(d => d.numeral === numeral);
      if (exact) return exact;
      const caseInsensitive = diatonicList.find(d => d.numeral.toLowerCase() === numeral.toLowerCase());
      if (caseInsensitive) return caseInsensitive;
      const cleanTarget = numeral.replace(/[°ø]/g, '').toLowerCase();
      return (
        diatonicList.find(d => d.numeral.replace(/[°ø]/g, '').toLowerCase() === cleanTarget) ||
        diatonicList[0]
      );
    };

    // Si hay menos compases que acordes en la progresión, crear los compases faltantes
    let currentMeasures = [...project.measures];
    while (currentMeasures.length < chordNumerals.length) {
      currentMeasures.push({
        id: `m-${Date.now()}-${currentMeasures.length + 1}`,
        number: currentMeasures.length + 1,
        timeSignature: project.timeSignature,
        clef: project.clef,
        notes: []
      });
    }

    const updated = currentMeasures.map((measure, idx) => {
      const numeral = chordNumerals[idx % chordNumerals.length];
      const match = findDiatonicMatch(numeral);

      const scoreChord: ScoreChord = {
        id: `chord-${Date.now()}-${idx}`,
        symbol: match.symbol,
        name: match.name,
        solfege: match.solfege,
        romanNumeral: match.numeral,
        harmonicFunction: match.harmonicFunction,
        pitches: match.suggestedPitches,
        midis: match.midis,
        startBeat: 0,
        durationBeats: 4
      };

      return {
        ...measure,
        chord: scoreChord
      };
    });

    setProject(prev => ({
      ...prev,
      measures: updated
    }));

    // Audición rápida del primer acorde
    const firstMatch = findDiatonicMatch(chordNumerals[0]);
    if (firstMatch) {
      composerAudio.playChord(firstMatch.midis, 1.2);
    }
  };

  // Distribuir notas de una escala en el pentagrama
  const handleInsertScaleNotesToStaff = (
    notes: string[],
    octave: number,
    duration: NoteDuration
  ) => {
    pushHistory(project);
    const beatsPerNote = duration === 'quarter' ? 1.0 : duration === 'eighth' ? 0.5 : 2.0;
    const capacity = getMeasureCapacityBeats(project.timeSignature);
    const notesPerMeasure = Math.floor(capacity / beatsPerNote);

    let currentMeasureIdx = selectedMeasureIndex;
    let noteInMeasureIdx = 0;
    let currentOctave = octave;
    let measuresCopy = [...project.measures];
    const touchedMeasures = new Set<number>();

    notes.forEach((noteName, idx) => {
      // Incrementar octava cuando la letra diatónica cruza el límite Si -> Do (ej: en Sol mayor: B -> C)
      if (idx > 0) {
        const prevStep = STEP_INDEX[notes[idx - 1][0].toUpperCase()] ?? 0;
        const curStep = STEP_INDEX[noteName[0].toUpperCase()] ?? 0;
        if (curStep <= prevStep) {
          currentOctave++;
        }
      }

      // Si necesitamos un nuevo compás, crearlo
      if (!measuresCopy[currentMeasureIdx]) {
        measuresCopy.push({
          id: `m-${Date.now()}-${measuresCopy.length + 1}`,
          number: measuresCopy.length + 1,
          timeSignature: project.timeSignature,
          clef: project.clef,
          notes: []
        });
      }

      // Limpiar las notas previas del compás receptor para evitar superposiciones
      if (!touchedMeasures.has(currentMeasureIdx)) {
        measuresCopy[currentMeasureIdx].notes = [];
        touchedMeasures.add(currentMeasureIdx);
      }

      const pitchStr = `${noteName}${currentOctave}`;
      const beat = noteInMeasureIdx * beatsPerNote;
      const scoreNote = createScoreNoteFromPitch(pitchStr, duration, beat, false);

      measuresCopy[currentMeasureIdx].notes.push(scoreNote);

      noteInMeasureIdx++;
      if (noteInMeasureIdx >= notesPerMeasure) {
        noteInMeasureIdx = 0;
        currentMeasureIdx++;
      }
    });

    setProject(prev => ({
      ...prev,
      measures: measuresCopy
    }));
  };

  // Iniciar / Detener Reproducción de la composición
  const handleTogglePlay = () => {
    if (isPlaying) {
      composerAudio.stopComposition();
      setIsPlaying(false);
      setActivePlaybackMeasure(null);
      setActivePlaybackBeat(null);
    } else {
      setIsPlaying(true);
      composerAudio.playComposition(
        project.measures,
        project.tempo,
        selectedMeasureIndex,
        isLoop,
        isMetronomeOn,
        (mIdx, beat) => {
          setActivePlaybackMeasure(mIdx);
          setActivePlaybackBeat(beat);
        },
        () => {
          setIsPlaying(false);
          setActivePlaybackMeasure(null);
          setActivePlaybackBeat(null);
        }
      );
    }
  };

  const handleStopPlayback = () => {
    composerAudio.stopComposition();
    setIsPlaying(false);
    setActivePlaybackMeasure(null);
    setActivePlaybackBeat(null);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Barra de Herramientas de Composición Superior */}
      <ComposerToolbar
        clef={project.clef}
        onChangeClef={handleChangeClef}
        timeSignature={project.timeSignature}
        onChangeTimeSignature={handleChangeTimeSignature}
        selectedDuration={selectedDuration}
        onChangeDuration={setSelectedDuration}
        isDotted={isDotted}
        onToggleDotted={() => setIsDotted(!isDotted)}
        isRestMode={isRestMode}
        onToggleRestMode={() => setIsRestMode(!isRestMode)}
        selectedAccidental={selectedAccidental}
        onChangeAccidental={setSelectedAccidental}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddMeasure={handleAddMeasure}
        onDuplicateMeasure={handleDuplicateMeasure}
        onDeleteMeasure={handleDeleteMeasure}
        onTranspose={handleTranspose}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* 2. Cuerpo Principal: Panel Lateral Armónico + Área Central de Partitura */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        {/* Panel Lateral Armónico */}
        <HarmonicSidebar
          keyInfo={keyInfo}
          notation={notation}
          onChangeKey={handleChangeKey}
          clef={project.clef}
          selectedMeasureIndex={selectedMeasureIndex}
          onApplyChordToMeasure={handleApplyChordToMeasure}
          onApplyProgressionToMeasures={handleApplyProgressionToMeasures}
          onInsertScaleNotesToStaff={handleInsertScaleNotesToStaff}
        />

        {/* Lienzo Central de Composición */}
        <div className="flex-1 w-full flex flex-col gap-4 overflow-hidden">
          {/* Cabecera contextual de la partitura */}
          <div className="flex items-center justify-between bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{project.title}</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400 font-semibold">{keyInfo.name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-sky-400 font-semibold">{project.timeSignature}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{project.tempo} BPM</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {project.measures.length} {project.measures.length === 1 ? 'compás' : 'compases'}
            </div>
          </div>

          {/* Pentagrama Interactivo SVG */}
          <StaffCanvas
            measures={project.measures}
            timeSignature={project.timeSignature}
            clef={project.clef}
            notation={notation}
            keySignatureNotes={keyInfo.scaleNotes}
            selectedMeasureIndex={selectedMeasureIndex}
            selectedNoteId={selectedNoteId}
            onSelectMeasure={(idx) => {
              setSelectedMeasureIndex(idx);
              setSelectedNoteId(null);
            }}
            onSelectNote={handleSelectNote}
            onStaffClickToAddNote={handleStaffClickToAddNote}
            onDeleteNote={handleDeleteNote}
            activePlaybackMeasure={activePlaybackMeasure}
            activePlaybackBeat={activePlaybackBeat}
            bpm={project.tempo}
          />

          {/* Panel de Propiedades e Inspector de Nota/Acorde */}
          <PropertiesInspector
            selectedNote={selectedNote}
            selectedChord={selectedMeasure?.chord || null}
            notation={notation}
            measureNumber={selectedMeasureIndex + 1}
            onUpdateNote={handleUpdateSelectedNote}
            onDeleteNote={(id) => handleDeleteNote(selectedMeasureIndex, id)}
            onClearChord={handleClearChord}
            onClearMeasureNotes={handleClearMeasureNotes}
            onClose={() => setSelectedNoteId(null)}
          />
        </div>
      </div>

      {/* 3. Panel Inferior de Transporte y Reproducción */}
      <TransportBar
        isPlaying={isPlaying}
        isLoop={isLoop}
        onToggleLoop={() => setIsLoop(!isLoop)}
        bpm={project.tempo}
        onChangeBpm={(newBpm) => setProject(p => ({ ...p, tempo: newBpm }))}
        instrument={instrument}
        onChangeInstrument={setInstrument}
        isMetronomeOn={isMetronomeOn}
        onToggleMetronome={() => setIsMetronomeOn(!isMetronomeOn)}
        volume={volume}
        onChangeVolume={setVolume}
        onPlay={handleTogglePlay}
        onStop={handleStopPlayback}
        currentMeasureIndex={selectedMeasureIndex}
        totalMeasures={project.measures.length}
      />

      {/* 4. Modal de Exportación (MIDI, MusicXML, PDF) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        onImportProject={(imported) => {
          pushHistory(project);
          setProject(imported);
          setSelectedMeasureIndex(0);
          setSelectedNoteId(null);
        }}
      />
    </div>
  );
};
