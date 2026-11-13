/**
 * @file App.tsx
 * @description Raíz de la aplicación GuitarFret con carga diferida (lazy loading) para el módulo Compositor
 * y separación de estado mediante custom hooks.
 */

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Volume2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { SettingsModal } from '../components/shared/SettingsModal';
import { CHORD_TYPES, SCALE_TYPES, TUNINGS } from '../constants/music';
import { ChordDiagram } from '../features/fretboard/components/ChordDiagram';
import { FretboardView } from '../features/fretboard/components/FretboardView';
import { MainSelectionBar } from '../features/fretboard/components/MainSelectionBar';
import { ScaleBoxDiagram } from '../features/fretboard/components/ScaleBoxDiagram';
import { ScaleContextControls } from '../features/fretboard/components/ScaleContextControls';
import { ScaleDetailsAccordion } from '../features/fretboard/components/ScaleDetailsAccordion';
import { TablatureView } from '../features/fretboard/components/TablatureView';
import { useFretboardPlayback } from '../features/fretboard/hooks/useFretboardPlayback';
import { useHashRoute } from '../hooks/useHashRoute';
import { useInstrumentSettings } from '../hooks/useInstrumentSettings';
import type {
  FretboardDisplayMode,
  RootOccurrence,
  ScalePositionDot,
  ScaleSystem
} from '../types/music.types';
import { formatChordSymbol, formatNoteName, getSolfege } from '../utils/notation';
import {
  calculateScaleFretboard,
  generateScaleRuns,
  getChordData,
  getRootOccurrences
} from '../utils/theory';
import { clientEnv } from './config/env';

const LazyComposerPage = lazy(() => import('../features/composer/components/ComposerPage'));

export default function App() {
  const { currentTab, navigateToTab } = useHashRoute();
  const {
    notation,
    setNotation,
    tuningId,
    setTuningId,
    isLeftHanded,
    toggleLeftHanded,
    isMuted,
    toggleMute,
    fretCount,
    setFretCount,
    resetInstrumentSettings
  } = useInstrumentSettings();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Estado de Escalas
  const [scaleRoot, setScaleRoot] = useState<string>('C');
  const [scaleId, setScaleId] = useState<string>('major pentatonic');
  const [scaleSubMode, setScaleSubMode] = useState<'patterns' | 'root_run'>('patterns');
  const [scaleSystem, setScaleSystem] = useState<ScaleSystem>('CAGED');
  const [scalePosition, setScalePosition] = useState<number | null>(1);
  const [displayMode, setDisplayMode] = useState<FretboardDisplayMode>('notes');
  const [hideOutsideNotes, setHideOutsideNotes] = useState<boolean>(false);

  // Estado del recorrido "Desde una tónica"
  const [selectedStartOccurrence, setSelectedStartOccurrence] = useState<RootOccurrence | null>(
    null
  );
  const [runDirection, setRunDirection] = useState<'ascending' | 'descending'>('ascending');
  const [runSpan, setRunSpan] = useState<'1_octave' | '2_octaves'>('1_octave');
  const [runVariationIndex, setRunVariationIndex] = useState<number>(0);

  // Estado de Acordes
  const [chordRoot, setChordRoot] = useState<string>('C');
  const [chordSuffix, setChordSuffix] = useState<string>('major');
  const [chordPositionIndex, setChordPositionIndex] = useState<number>(0);
  const [chordAllFretboardArpeggio, setChordAllFretboardArpeggio] = useState<boolean>(false);
  const [isChordDiagramOpen, setIsChordDiagramOpen] = useState<boolean>(false);

  // Cálculos teóricos para Escalas y Acordes
  const rootOccurrences = useMemo(() => {
    return getRootOccurrences(scaleRoot, TUNINGS[tuningId].notes, fretCount, notation);
  }, [scaleRoot, tuningId, fretCount, notation]);

  const effectiveStartOccurrence: RootOccurrence = useMemo(() => {
    if (selectedStartOccurrence) {
      const stillValid = rootOccurrences.find(
        o => o.string === selectedStartOccurrence.string && o.fret === selectedStartOccurrence.fret
      );
      if (stillValid) return stillValid;
    }

    const pref5 = rootOccurrences.find(o => o.string === 5 && o.fret > 0 && o.fret <= 10);
    if (pref5) return pref5;
    const pref6 = rootOccurrences.find(o => o.string === 6 && o.fret > 0 && o.fret <= 10);
    if (pref6) return pref6;
    return (
      rootOccurrences[0] || {
        string: 5,
        fret: 3,
        pitch: 'C3',
        midi: 48,
        noteName: scaleRoot,
        solfege: getSolfege(scaleRoot),
        octave: 3,
        label: `${formatNoteName(scaleRoot, notation)} — 5.ª cuerda · traste 3`
      }
    );
  }, [selectedStartOccurrence, rootOccurrences, scaleRoot, notation]);

  const scaleResult = useMemo(() => {
    return calculateScaleFretboard(
      scaleRoot,
      scaleId,
      scaleSystem,
      scalePosition,
      tuningId,
      fretCount
    );
  }, [scaleRoot, scaleId, scaleSystem, scalePosition, tuningId, fretCount]);

  const scaleRunResult = useMemo(() => {
    return generateScaleRuns({
      startString: effectiveStartOccurrence.string,
      startFret: effectiveStartOccurrence.fret,
      scaleId,
      root: scaleRoot,
      tuningId,
      direction: runDirection,
      span: runSpan,
      selectedVariationIndex: runVariationIndex,
      fretCount
    });
  }, [
    effectiveStartOccurrence,
    scaleId,
    scaleRoot,
    tuningId,
    runDirection,
    runSpan,
    runVariationIndex,
    fretCount
  ]);

  const chordResult = useMemo(() => {
    return getChordData(chordRoot, chordSuffix, chordPositionIndex, tuningId, fretCount);
  }, [chordRoot, chordSuffix, chordPositionIndex, tuningId, fretCount]);

  const {
    activePlayingMidi,
    activeTabStepIndex,
    isPlaying,
    bpm,
    setBpm,
    togglePlay,
    stopPlayback
  } = useFretboardPlayback({
    currentTab: currentTab === 'chords' ? 'chords' : 'scales',
    scaleSubMode,
    scalePosition,
    scaleResult,
    scaleRunResult,
    chordResult
  });

  const currentScaleDef = SCALE_TYPES.find(s => s.id === scaleId) || SCALE_TYPES[0];
  const isDiatonic =
    currentScaleDef.category === 'diatonic' ||
    currentScaleDef.category === 'modes' ||
    ['phrygian dominant', 'lydian dominant', 'altered'].includes(currentScaleDef.id);

  useEffect(() => {
    if (
      scalePosition !== null &&
      scaleResult.availableBoxes.length > 0 &&
      scalePosition > scaleResult.availableBoxes.length
    ) {
      setScalePosition(1);
    }
  }, [scalePosition, scaleResult.availableBoxes.length]);

  const handleReset = () => {
    setScaleRoot('C');
    setScaleId('major pentatonic');
    setScalePosition(1);
    setScaleSystem('CAGED');
    setScaleSubMode('patterns');
    setSelectedStartOccurrence(null);
    setRunDirection('ascending');
    setRunSpan('1_octave');
    setRunVariationIndex(0);
    setDisplayMode('notes');
    setHideOutsideNotes(false);
    setChordRoot('C');
    setChordSuffix('major');
    setChordPositionIndex(0);
    setChordAllFretboardArpeggio(false);
    resetInstrumentSettings();
    stopPlayback();
  };

  const fretboardDots: ScalePositionDot[] = useMemo(() => {
    if (currentTab === 'scales') {
      if (scaleSubMode === 'root_run') {
        return scaleRunResult.dots;
      }
      return scaleResult.dots;
    }

    if (chordAllFretboardArpeggio) {
      return chordResult.allFretboardDots;
    }

    if (!chordResult.currentPosition) return [];

    return chordResult.currentPosition.stringNotes
      .filter(sn => sn.fret >= 0)
      .map(sn => ({
        string: sn.string,
        fret: sn.fret,
        note: sn.noteName,
        interval: sn.interval,
        isRoot: sn.isRoot,
        inBox: true,
        pitch: sn.pitch,
        midi: sn.midi
      }));
  }, [
    currentTab,
    scaleSubMode,
    scaleRunResult.dots,
    scaleResult.dots,
    chordResult,
    chordAllFretboardArpeggio
  ]);

  const handleSelectStartNoteFromFretboard = (pos: { string: number; fret: number }) => {
    const found = rootOccurrences.find(o => o.string === pos.string && o.fret === pos.fret);
    if (found) {
      setSelectedStartOccurrence(found);
      if (scaleSubMode !== 'root_run') {
        setScaleSubMode('root_run');
      }
    }
  };

  const currentChordDef = CHORD_TYPES.find(ct => ct.suffix === chordSuffix) || CHORD_TYPES[0];
  const formattedChordTitle = `${formatNoteName(chordRoot, notation)} ${currentChordDef.name}`;

  const fretboardSubtitle = useMemo(() => {
    if (currentTab === 'chords') {
      return `Posición ${chordPositionIndex + 1} de ${chordResult.positions.length} · ${formatChordSymbol(chordResult.symbol, notation)}`;
    }

    if (scaleSubMode === 'root_run') {
      const dirArrow = runDirection === 'descending' ? '↓' : '↑';
      const spanLabel = runSpan === '2_octaves' ? '2 octavas' : '1 octava';
      return `Inicio: ${effectiveStartOccurrence.string}.ª cuerda · traste ${effectiveStartOccurrence.fret} | ${spanLabel} ${dirArrow}`;
    }

    if (scalePosition === null) {
      return 'Todo el mástil';
    }

    const activeBox = scaleResult.availableBoxes.find(b => b.index === scalePosition);
    const boxShape = activeBox?.shapeName || `Posición ${scalePosition}`;
    const rangeText = scaleResult.boxFretRange
      ? ` · trastes ${scaleResult.boxFretRange[0]}–${scaleResult.boxFretRange[1]}`
      : '';
    return `${boxShape}${rangeText}`;
  }, [
    currentTab,
    chordPositionIndex,
    chordResult,
    notation,
    scaleSubMode,
    runDirection,
    runSpan,
    effectiveStartOccurrence,
    scalePosition,
    scaleResult
  ]);

  const fretboardTitle = useMemo(() => {
    if (currentTab === 'chords') {
      return formattedChordTitle;
    }
    return `${formatNoteName(scaleRoot, notation)} ${currentScaleDef.name}`;
  }, [currentTab, formattedChordTitle, scaleRoot, notation, currentScaleDef]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar
        currentTab={currentTab}
        onSelectTab={navigateToTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLeftHanded={isLeftHanded}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notation={notation}
        onChangeNotation={setNotation}
        tuningId={tuningId}
        onChangeTuning={setTuningId}
        isLeftHanded={isLeftHanded}
        onToggleLeftHanded={toggleLeftHanded}
        fretCount={fretCount}
        onChangeFretCount={setFretCount}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
        {currentTab === 'compositor' ? (
          <Suspense
            fallback={
              <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                Cargando editor musical...
              </div>
            }
          >
            <LazyComposerPage notation={notation} />
          </Suspense>
        ) : (
          <>
            <MainSelectionBar
              currentTab={currentTab}
              notation={notation}
              selectedScaleRoot={scaleRoot}
              onSelectScaleRoot={setScaleRoot}
              selectedScaleId={scaleId}
              onSelectScaleId={setScaleId}
              scaleSubMode={scaleSubMode}
              onChangeScaleSubMode={setScaleSubMode}
              selectedChordRoot={chordRoot}
              onSelectChordRoot={setChordRoot}
              selectedChordSuffix={chordSuffix}
              onSelectChordSuffix={setChordSuffix}
              selectedChordPositionIndex={chordPositionIndex}
              onSelectChordPositionIndex={setChordPositionIndex}
              allFretboardArpeggio={chordAllFretboardArpeggio}
              onToggleAllFretboardArpeggio={setChordAllFretboardArpeggio}
              chordResult={chordResult}
            />

            <section className="w-full">
              <FretboardView
                dots={fretboardDots}
                rootNote={currentTab === 'scales' ? scaleRoot : chordRoot}
                tuningId={tuningId}
                notation={notation}
                displayMode={displayMode}
                isLeftHanded={isLeftHanded}
                activePlayingMidi={activePlayingMidi}
                boxFretRange={scaleResult.boxFretRange}
                fretCount={fretCount}
                highlightOnlyBox={hideOutsideNotes}
                onSelectStartNote={handleSelectStartNoteFromFretboard}
                isRootRunMode={currentTab === 'scales' && scaleSubMode === 'root_run'}
                title={fretboardTitle}
                subtitle={fretboardSubtitle}
              />
            </section>

            {currentTab === 'scales' ? (
              <section className="flex flex-col gap-3">
                <ScaleContextControls
                  notation={notation}
                  scaleSubMode={scaleSubMode}
                  scaleRunResult={scaleRunResult}
                  rootOccurrences={rootOccurrences}
                  selectedStartOccurrence={effectiveStartOccurrence}
                  onSelectStartOccurrence={setSelectedStartOccurrence}
                  runDirection={runDirection}
                  onChangeRunDirection={setRunDirection}
                  runSpan={runSpan}
                  onChangeRunSpan={setRunSpan}
                  selectedVariationIndex={runVariationIndex}
                  onSelectVariationIndex={setRunVariationIndex}
                  system={scaleSystem}
                  onSelectSystem={setScaleSystem}
                  selectedPosition={scalePosition}
                  onSelectPosition={setScalePosition}
                  scaleResult={scaleResult}
                  isDiatonic={isDiatonic}
                  displayMode={displayMode}
                  onChangeDisplayMode={setDisplayMode}
                  hideOutside={hideOutsideNotes}
                  onToggleHideOutside={setHideOutsideNotes}
                  isPlaying={isPlaying}
                  bpm={bpm}
                  onChangeBpm={setBpm}
                  onTogglePlay={togglePlay}
                />

                {scaleSubMode === 'root_run' && scaleRunResult.activeVariation && (
                  <TablatureView
                    steps={scaleRunResult.activeVariation.steps}
                    notation={notation}
                    activeStepIndex={activeTabStepIndex}
                    activePlayingMidi={activePlayingMidi}
                    tuningLabels={TUNINGS[tuningId].labels}
                    defaultOpen={false}
                  />
                )}

                <ScaleDetailsAccordion
                  scaleResult={scaleResult}
                  selectedRoot={scaleRoot}
                  notation={notation}
                  scaleDisplayName={currentScaleDef.name}
                  steps={scaleRunResult.activeVariation?.steps}
                  isRootRunMode={scaleSubMode === 'root_run'}
                  defaultOpen={false}
                />

                {scaleSubMode === 'patterns' && scalePosition !== null && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsChordDiagramOpen(!isChordDiagramOpen)}
                      aria-expanded={isChordDiagramOpen}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isChordDiagramOpen ? (
                          <ChevronDown className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        )}
                        <span>
                          Diagrama vertical de caja (
                          {scaleResult.availableBoxes.find(b => b.index === scalePosition)
                            ?.shapeName || `Posición ${scalePosition}`}
                          )
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {isChordDiagramOpen ? 'Ocultar' : 'Ver'}
                      </span>
                    </button>
                    {isChordDiagramOpen && (
                      <div className="p-4 border-t border-slate-800/80 flex justify-center">
                        <ScaleBoxDiagram
                          scaleName={scaleResult.scaleName}
                          rootNote={scaleRoot}
                          notation={notation}
                          boxInfo={scaleResult.availableBoxes.find(b => b.index === scalePosition)}
                          boxDots={scaleResult.dots}
                          displayMode={displayMode === 'steps' ? 'notes' : displayMode}
                          onSelectDisplayMode={m => setDisplayMode(m)}
                          positionIndex={scalePosition}
                          totalPositions={scaleResult.availableBoxes.length}
                        />
                      </div>
                    )}
                  </div>
                )}
              </section>
            ) : (
              <section className="flex flex-col gap-3">
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    <span>Rasguear posición</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Mostrar en diagrama:</span>
                    <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setDisplayMode('notes')}
                        aria-pressed={displayMode === 'notes'}
                        className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                          displayMode === 'notes'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Notas
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode('intervals')}
                        aria-pressed={displayMode === 'intervals'}
                        className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                          displayMode === 'intervals'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Intervalos
                      </button>
                    </div>
                  </div>
                </div>

                {chordResult.currentPosition && (
                  <div className="flex justify-center p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <ChordDiagram
                      chordName={formattedChordTitle}
                      symbol={chordResult.symbol}
                      notation={notation}
                      position={chordResult.currentPosition}
                      positionIndex={chordPositionIndex}
                      totalPositions={chordResult.positions.length}
                      displayMode={displayMode === 'steps' ? 'notes' : displayMode}
                    />
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <footer className="mt-6 pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-400">{clientEnv.appName}</p>
        </footer>
      </main>
    </div>
  );
}
