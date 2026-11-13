/**
 * @file ComposerPage.tsx
 * @description Módulo principal independiente del Editor de Composición Musical.
 * Orquesta los componentes de interfaz delegando el estado del proyecto a `useComposerProject`.
 */

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { NotificationBanner } from '../../../components/ui/NotificationBanner';
import type { NoteNotation } from '../../../types/music.types';
import { useComposerProject } from '../hooks/useComposerProject';
import { composerAudio } from '../services/composerAudio';
import { getKeySignatureInfo } from '../utils/musicTheoryEngine';
import { ComposerToolbar } from './ComposerToolbar';
import { ExportModal } from './ExportModal';
import { HarmonicSidebar } from './HarmonicSidebar';
import { PropertiesInspector } from './PropertiesInspector';
import { StaffCanvas } from './StaffCanvas';
import { TransportBar } from './TransportBar';
import type { AccidentalType, InstrumentType, NoteDuration } from '../types/composer.types';

interface ComposerPageProps {
  notation?: NoteNotation;
}

export const ComposerPage: React.FC<ComposerPageProps> = ({ notation = 'american' }) => {
  const {
    project,
    selectedMeasureIndex,
    setSelectedMeasureIndex,
    selectedNoteId,
    setSelectedNoteId,
    selectedMeasure,
    selectedNote,
    canUndo,
    canRedo,
    notification,
    dismissNotification,
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
  } = useComposerProject();

  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [isDotted, setIsDotted] = useState<boolean>(false);
  const [isRestMode, setIsRestMode] = useState<boolean>(false);
  const [selectedAccidental, setSelectedAccidental] = useState<AccidentalType>('natural');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [volume, setVolume] = useState<number>(0.8);
  const [activePlaybackMeasure, setActivePlaybackMeasure] = useState<number | null>(null);
  const [activePlaybackBeat, setActivePlaybackBeat] = useState<number | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    composerAudio.setInstrument(instrument);
  }, [instrument]);

  useEffect(() => {
    composerAudio.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    return () => {
      composerAudio.stopComposition();
    };
  }, []);

  const keyInfo = useMemo(() => {
    return getKeySignatureInfo(project.key, project.mode, notation);
  }, [project.key, project.mode, notation]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      composerAudio.stopComposition();
      setIsPlaying(false);
      setActivePlaybackMeasure(null);
      setActivePlaybackBeat(null);
      return;
    }

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
  };

  const handleStopPlayback = () => {
    composerAudio.stopComposition();
    setIsPlaying(false);
    setActivePlaybackMeasure(null);
    setActivePlaybackBeat(null);
  };

  return (
    <div className="w-full flex flex-col gap-4">
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
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddMeasure={handleAddMeasure}
        onDuplicateMeasure={handleDuplicateMeasure}
        onDeleteMeasure={handleDeleteMeasure}
        onTranspose={handleTranspose}
        onNewProject={requestNewProject}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      <NotificationBanner notification={notification} onDismiss={dismissNotification} />

      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
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

        <div className="flex-1 w-full flex flex-col gap-4 overflow-hidden">
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

          <StaffCanvas
            measures={project.measures}
            timeSignature={project.timeSignature}
            clef={project.clef}
            notation={notation}
            keySignatureNotes={keyInfo.scaleNotes}
            selectedMeasureIndex={selectedMeasureIndex}
            selectedNoteId={selectedNoteId}
            onSelectMeasure={idx => {
              setSelectedMeasureIndex(idx);
              setSelectedNoteId(null);
            }}
            onSelectNote={handleSelectNote}
            onStaffClickToAddNote={(measureIndex, step, octave, beat) =>
              handleStaffClickToAddNote(measureIndex, step, octave, beat, {
                duration: selectedDuration,
                isDotted,
                isRestMode,
                accidental: selectedAccidental
              })
            }
            onDeleteNote={handleDeleteNote}
            activePlaybackMeasure={activePlaybackMeasure}
            activePlaybackBeat={activePlaybackBeat}
            bpm={project.tempo}
          />

          <PropertiesInspector
            selectedNote={selectedNote}
            selectedChord={selectedMeasure?.chord || null}
            notation={notation}
            measureNumber={selectedMeasureIndex + 1}
            onUpdateNote={handleUpdateSelectedNote}
            onDeleteNote={id => handleDeleteNote(selectedMeasureIndex, id)}
            onClearChord={handleClearChord}
            onClearMeasureNotes={handleClearMeasureNotes}
          />
        </div>
      </div>

      <TransportBar
        isPlaying={isPlaying}
        isLoop={isLoop}
        onToggleLoop={() => setIsLoop(!isLoop)}
        bpm={project.tempo}
        onChangeBpm={handleChangeTempo}
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

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        onImportProject={handleImportProject}
      />

      <ConfirmDialog
        isOpen={isNewProjectConfirmOpen}
        title="Nueva composición en blanco"
        message="¿Deseas iniciar una nueva composición con la plantilla inicial? Se guardará un punto en el historial para poder deshacer si lo necesitas."
        confirmLabel="Iniciar composición"
        cancelLabel="Cancelar"
        onConfirm={confirmNewProject}
        onCancel={cancelNewProject}
      />
    </div>
  );
};

export default ComposerPage;
