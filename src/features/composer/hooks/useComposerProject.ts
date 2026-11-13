/**
 * @file useComposerProject.ts
 * @description Custom hook para encapsular el estado de composición, historial deshacer/rehacer,
 * persistencia en almacenamiento local y notificaciones no bloqueantes (sin window.alert/confirm).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { readJsonStorage, writeJsonStorage } from '../../../utils/storage';
import { composerAudio } from '../services/composerAudio';
import {
  STEP_INDEX,
  createScoreNoteFromPitch,
  getDiatonicChords,
  getMeasureCapacityBeats,
  transposeNote
} from '../utils/musicTheoryEngine';
import type { NotificationMessage } from '../../../components/ui/NotificationBanner';
import type {
  AccidentalType,
  ClefType,
  CompositionProject,
  Measure,
  NoteDuration,
  ScoreChord,
  ScoreNote,
  TimeSignature
} from '../types/composer.types';

export const COMPOSER_STORAGE_KEY = 'guitarfret_composer_saved_project_v1';

export function createInitialProject(): CompositionProject {
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
        {
          id: 'n-1-1',
          step: 'C',
          alter: 0,
          octave: 4,
          duration: 'quarter',
          startBeat: 0,
          durationBeats: 1,
          midi: 60,
          pitch: 'C4',
          solfege: 'Do'
        },
        {
          id: 'n-1-2',
          step: 'E',
          alter: 0,
          octave: 4,
          duration: 'quarter',
          startBeat: 1,
          durationBeats: 1,
          midi: 64,
          pitch: 'E4',
          solfege: 'Mi'
        },
        {
          id: 'n-1-3',
          step: 'G',
          alter: 0,
          octave: 4,
          duration: 'half',
          startBeat: 2,
          durationBeats: 2,
          midi: 67,
          pitch: 'G4',
          solfege: 'Sol'
        }
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
        {
          id: 'n-2-1',
          step: 'D',
          alter: 0,
          octave: 4,
          duration: 'quarter',
          startBeat: 0,
          durationBeats: 1,
          midi: 62,
          pitch: 'D4',
          solfege: 'Re'
        },
        {
          id: 'n-2-2',
          step: 'G',
          alter: 0,
          octave: 4,
          duration: 'quarter',
          startBeat: 1,
          durationBeats: 1,
          midi: 67,
          pitch: 'G4',
          solfege: 'Sol'
        },
        {
          id: 'n-2-3',
          step: 'B',
          alter: 0,
          octave: 4,
          duration: 'half',
          startBeat: 2,
          durationBeats: 2,
          midi: 71,
          pitch: 'B4',
          solfege: 'Si'
        }
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
        {
          id: 'n-3-1',
          step: 'A',
          alter: 0,
          octave: 4,
          duration: 'quarter',
          startBeat: 0,
          durationBeats: 1,
          midi: 69,
          pitch: 'A4',
          solfege: 'La'
        },
        {
          id: 'n-3-2',
          step: 'C',
          alter: 0,
          octave: 5,
          duration: 'quarter',
          startBeat: 1,
          durationBeats: 1,
          midi: 72,
          pitch: 'C5',
          solfege: 'Do'
        },
        {
          id: 'n-3-3',
          step: 'E',
          alter: 0,
          octave: 5,
          duration: 'half',
          startBeat: 2,
          durationBeats: 2,
          midi: 76,
          pitch: 'E5',
          solfege: 'Mi'
        }
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
        {
          id: 'n-4-1',
          step: 'F',
          alter: 0,
          octave: 4,
          duration: 'quarter',
          startBeat: 0,
          durationBeats: 1,
          midi: 65,
          pitch: 'F4',
          solfege: 'Fa'
        },
        {
          id: 'n-4-2',
          step: 'A',
          alter: 0,
          octave: 4,
          duration: 'quarter',
          startBeat: 1,
          durationBeats: 1,
          midi: 69,
          pitch: 'A4',
          solfege: 'La'
        },
        {
          id: 'n-4-3',
          step: 'C',
          alter: 0,
          octave: 5,
          duration: 'half',
          startBeat: 2,
          durationBeats: 2,
          midi: 72,
          pitch: 'C5',
          solfege: 'Do'
        }
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

function isValidProject(data: unknown): data is CompositionProject {
  return (
    typeof data === 'object' &&
    data !== null &&
    'measures' in data &&
    Array.isArray((data as CompositionProject).measures) &&
    (data as CompositionProject).measures.length > 0
  );
}

export function useComposerProject() {
  const [project, setProject] = useState<CompositionProject>(() => {
    return (
      readJsonStorage<CompositionProject>(COMPOSER_STORAGE_KEY, isValidProject) ||
      createInitialProject()
    );
  });

  const [historyPast, setHistoryPast] = useState<CompositionProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<CompositionProject[]>([]);
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState<number>(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationMessage | null>(null);
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState<boolean>(false);

  const pushHistory = useCallback((prevProject: CompositionProject) => {
    setHistoryPast(past => [...past.slice(-20), prevProject]);
    setHistoryFuture([]);
  }, []);

  useEffect(() => {
    writeJsonStorage(COMPOSER_STORAGE_KEY, project);
  }, [project]);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const selectedMeasure = project.measures[selectedMeasureIndex] || project.measures[0];

  const selectedNote = useMemo(() => {
    if (!selectedNoteId || !selectedMeasure) return null;
    return selectedMeasure.notes.find(n => n.id === selectedNoteId) || null;
  }, [selectedMeasure, selectedNoteId]);

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryFuture(future => [project, ...future]);
    setHistoryPast(past => past.slice(0, -1));
    setProject(previous);
  }, [historyPast, project]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryPast(past => [...past, project]);
    setHistoryFuture(future => future.slice(1));
    setProject(next);
  }, [historyFuture, project]);

  const handleChangeClef = useCallback(
    (newClef: ClefType) => {
      pushHistory(project);
      setProject(prev => ({
        ...prev,
        clef: newClef,
        measures: prev.measures.map(m => ({ ...m, clef: newClef }))
      }));
    },
    [project, pushHistory]
  );

  const handleChangeTimeSignature = useCallback(
    (newTs: TimeSignature) => {
      pushHistory(project);
      setProject(prev => ({
        ...prev,
        timeSignature: newTs,
        measures: prev.measures.map(m => ({ ...m, timeSignature: newTs }))
      }));
    },
    [project, pushHistory]
  );

  const handleChangeKey = useCallback(
    (tonic: string, mode: 'major' | 'minor') => {
      pushHistory(project);
      setProject(prev => ({
        ...prev,
        key: tonic,
        mode
      }));
    },
    [project, pushHistory]
  );

  const handleChangeTempo = useCallback((newBpm: number) => {
    setProject(prev => ({ ...prev, tempo: newBpm }));
  }, []);

  const handleTranspose = useCallback(
    (semitones: number) => {
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
    },
    [project, pushHistory]
  );

  const handleAddMeasure = useCallback(() => {
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
  }, [project, pushHistory]);

  const handleDuplicateMeasure = useCallback(() => {
    if (!selectedMeasure) return;
    pushHistory(project);
    const duplicated: Measure = {
      ...selectedMeasure,
      id: `m-${Date.now()}-dup`,
      number: project.measures.length + 1,
      notes: selectedMeasure.notes.map(n => ({
        ...n,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      }))
    };
    setProject(prev => ({
      ...prev,
      measures: [...prev.measures, duplicated]
    }));
    setSelectedMeasureIndex(project.measures.length);
  }, [project, pushHistory, selectedMeasure]);

  const handleDeleteMeasure = useCallback(() => {
    if (project.measures.length <= 1) return;
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
  }, [project, pushHistory, selectedMeasureIndex]);

  const requestNewProject = useCallback(() => {
    setIsNewProjectConfirmOpen(true);
  }, []);

  const confirmNewProject = useCallback(() => {
    pushHistory(project);
    setProject(createInitialProject());
    setSelectedMeasureIndex(0);
    setSelectedNoteId(null);
    setIsNewProjectConfirmOpen(false);
    setNotification({
      variant: 'info',
      text: 'Nueva composición iniciada.'
    });
  }, [project, pushHistory]);

  const cancelNewProject = useCallback(() => {
    setIsNewProjectConfirmOpen(false);
  }, []);

  const handleSaveProject = useCallback(() => {
    const saved = writeJsonStorage(COMPOSER_STORAGE_KEY, project);
    setNotification(
      saved
        ? { variant: 'success', text: 'Proyecto guardado en el almacenamiento local.' }
        : { variant: 'error', text: 'No se pudo guardar en el almacenamiento local.' }
    );
  }, [project]);

  const handleLoadProject = useCallback(() => {
    const saved = readJsonStorage<CompositionProject>(COMPOSER_STORAGE_KEY, isValidProject);
    if (saved) {
      pushHistory(project);
      setProject(saved);
      setSelectedMeasureIndex(0);
      setSelectedNoteId(null);
      setNotification({ variant: 'success', text: 'Proyecto cargado correctamente.' });
    } else {
      setNotification({ variant: 'info', text: 'No hay ningún proyecto guardado previamente.' });
    }
  }, [project, pushHistory]);

  const handleImportProject = useCallback(
    (imported: CompositionProject) => {
      pushHistory(project);
      setProject(imported);
      setSelectedMeasureIndex(0);
      setSelectedNoteId(null);
      setNotification({ variant: 'success', text: 'Proyecto importado correctamente.' });
    },
    [project, pushHistory]
  );

  const handleStaffClickToAddNote = useCallback(
    (
      measureIndex: number,
      step: string,
      octave: number,
      beat: number,
      options: {
        duration: NoteDuration;
        isDotted: boolean;
        isRestMode: boolean;
        accidental: AccidentalType;
      }
    ) => {
      const targetMeasure = project.measures[measureIndex];
      if (!targetMeasure) return;

      pushHistory(project);

      let alterVal = 0;
      if (options.accidental === 'sharp') alterVal = 1;
      else if (options.accidental === 'flat') alterVal = -1;

      const pitchStr = `${step}${alterVal === 1 ? '#' : alterVal === -1 ? 'b' : ''}${octave}`;
      const newNote = createScoreNoteFromPitch(pitchStr, options.duration, beat, options.isDotted);

      if (options.isRestMode) {
        newNote.isRest = true;
      }

      if (!newNote.isRest) {
        composerAudio.playTone(newNote.midi, 0.6);
      }

      const existingIndex = targetMeasure.notes.findIndex(
        n => n.pitch === newNote.pitch && Math.abs(n.startBeat - newNote.startBeat) < 0.2
      );
      const updatedNotes =
        existingIndex >= 0
          ? targetMeasure.notes.map((n, i) => (i === existingIndex ? newNote : n))
          : [...targetMeasure.notes, newNote].sort((a, b) => a.startBeat - b.startBeat);

      setProject(prev => ({
        ...prev,
        measures: prev.measures.map((m, idx) =>
          idx === measureIndex ? { ...m, notes: updatedNotes } : m
        )
      }));

      setSelectedMeasureIndex(measureIndex);
      setSelectedNoteId(newNote.id);
    },
    [project, pushHistory]
  );

  const handleSelectNote = useCallback((note: ScoreNote, measureIndex: number) => {
    setSelectedMeasureIndex(measureIndex);
    setSelectedNoteId(note.id);
    if (!note.isRest && note.midi > 0) {
      composerAudio.playTone(note.midi, 0.5);
    }
  }, []);

  const handleUpdateSelectedNote = useCallback(
    (updatedNote: ScoreNote) => {
      pushHistory(project);
      setProject(prev => ({
        ...prev,
        measures: prev.measures.map((m, mIdx) => {
          if (mIdx !== selectedMeasureIndex) return m;
          return {
            ...m,
            notes: m.notes.map(n => (n.id === updatedNote.id ? updatedNote : n))
          };
        })
      }));
      if (!updatedNote.isRest && updatedNote.midi > 0) {
        composerAudio.playTone(updatedNote.midi, 0.5);
      }
    },
    [project, pushHistory, selectedMeasureIndex]
  );

  const handleDeleteNote = useCallback(
    (measureIndex: number, noteId: string) => {
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
    },
    [project, pushHistory, selectedNoteId]
  );

  const handleClearChord = useCallback(() => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, idx) =>
        idx === selectedMeasureIndex ? { ...m, chord: undefined } : m
      )
    }));
  }, [project, pushHistory, selectedMeasureIndex]);

  const handleClearMeasureNotes = useCallback(() => {
    pushHistory(project);
    setProject(prev => ({
      ...prev,
      measures: prev.measures.map((m, idx) =>
        idx === selectedMeasureIndex ? { ...m, notes: [] } : m
      )
    }));
    setSelectedNoteId(null);
  }, [project, pushHistory, selectedMeasureIndex]);

  const handleApplyChordToMeasure = useCallback(
    (chord: ScoreChord, measureIndex: number) => {
      pushHistory(project);
      setProject(prev => ({
        ...prev,
        measures: prev.measures.map((m, idx) => (idx === measureIndex ? { ...m, chord } : m))
      }));
      composerAudio.playChord(chord.midis, 1.2);
    },
    [project, pushHistory]
  );

  const handleApplyProgressionToMeasures = useCallback(
    (chordNumerals: string[]) => {
      pushHistory(project);
      const diatonicList = getDiatonicChords(project.key, project.mode, project.clef);

      const findDiatonicMatch = (numeral: string) => {
        const exact = diatonicList.find(d => d.numeral === numeral);
        if (exact) return exact;
        const caseInsensitive = diatonicList.find(
          d => d.numeral.toLowerCase() === numeral.toLowerCase()
        );
        if (caseInsensitive) return caseInsensitive;
        const cleanTarget = numeral.replace(/[°ø]/g, '').toLowerCase();
        return (
          diatonicList.find(d => d.numeral.replace(/[°ø]/g, '').toLowerCase() === cleanTarget) ||
          diatonicList[0]
        );
      };

      const currentMeasures = [...project.measures];
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

      const firstMatch = findDiatonicMatch(chordNumerals[0]);
      if (firstMatch) {
        composerAudio.playChord(firstMatch.midis, 1.2);
      }
    },
    [project, pushHistory]
  );

  const handleInsertScaleNotesToStaff = useCallback(
    (notes: string[], octave: number, duration: NoteDuration) => {
      pushHistory(project);
      const beatsPerNote = duration === 'quarter' ? 1.0 : duration === 'eighth' ? 0.5 : 2.0;
      const capacity = getMeasureCapacityBeats(project.timeSignature);
      const notesPerMeasure = Math.floor(capacity / beatsPerNote);

      let currentMeasureIdx = selectedMeasureIndex;
      let noteInMeasureIdx = 0;
      let currentOctave = octave;
      const measuresCopy = project.measures.map(m => ({ ...m, notes: [...m.notes] }));
      const touchedMeasures = new Set<number>();

      notes.forEach((noteName, idx) => {
        if (idx > 0) {
          const prevStep = STEP_INDEX[notes[idx - 1][0].toUpperCase()] ?? 0;
          const curStep = STEP_INDEX[noteName[0].toUpperCase()] ?? 0;
          if (curStep <= prevStep) {
            currentOctave++;
          }
        }

        if (!measuresCopy[currentMeasureIdx]) {
          measuresCopy.push({
            id: `m-${Date.now()}-${measuresCopy.length + 1}`,
            number: measuresCopy.length + 1,
            timeSignature: project.timeSignature,
            clef: project.clef,
            notes: []
          });
        }

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
    },
    [project, pushHistory, selectedMeasureIndex]
  );

  return {
    project,
    selectedMeasureIndex,
    setSelectedMeasureIndex,
    selectedNoteId,
    setSelectedNoteId,
    selectedMeasure,
    selectedNote,
    canUndo: historyPast.length > 0,
    canRedo: historyFuture.length > 0,
    notification,
    dismissNotification: () => setNotification(null),
    setNotification,
    isNewProjectConfirmOpen,
    requestNewProject,
    confirmNewProject,
    cancelNewProject,
    handleUndo,
    handleRedo,
    handleChangeClef,
    handleChangeTimeSignature,
    handleChangeKey,
    handleChangeTempo,
    handleTranspose,
    handleAddMeasure,
    handleDuplicateMeasure,
    handleDeleteMeasure,
    handleSaveProject,
    handleLoadProject,
    handleImportProject,
    handleStaffClickToAddNote,
    handleSelectNote,
    handleUpdateSelectedNote,
    handleDeleteNote,
    handleClearChord,
    handleClearMeasureNotes,
    handleApplyChordToMeasure,
    handleApplyProgressionToMeasures,
    handleInsertScaleNotesToStaff
  };
}
