/**
 * @file App.tsx
 * @description Aplicación principal GuitarFret con 3 rutas/secciones independientes:
 * 1. Modo Escalas: Visualizador de patrones (CAGED/3NPS) y recorridos desde una tónica con tablatura.
 * 2. Modo Acordes: Voicings de chords-db, arpegio en el mástil y diagrama vertical clásico.
 * 3. Modo Pentagrama / Compositor Armónico (Ruta separada #/pentagrama):
 *    - Selección de tonalidad (ej. Do, Sol, Re, etc. Mayor/Menor)
 *    - Progresiones armónicas sugeridas (I-IV-V, I-V-vi-IV, ii-V-I...)
 *    - Paleta de acordes diatónicos y escalas compatibles
 *    - Pentagrama interactivo en SVG con métrica rítmica (4/4, 3/4, 6/8)
 *    - Inserción de acordes y notas de la escala en los tiempos del compás
 *    - Reproducción de audio sincronizada con cursor en tiempo real.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  TuningId,
  TUNINGS,
  ScaleSystem,
  calculateScaleFretboard,
  getChordData,
  ScalePositionDot,
  getRootOccurrences,
  generateScaleRuns,
  RootOccurrence,
  getSolfege,
  SCALE_TYPES,
  CHORD_TYPES,
  NoteNotation,
  formatNoteName,
  formatChordSymbol
} from './utils/theory';
import { audioEngine } from './utils/audio';
import { Navbar } from './components/Navbar';
import { SettingsModal } from './components/SettingsModal';
import { MainSelectionBar } from './components/MainSelectionBar';
import { FretboardView } from './components/FretboardView';
import { ScaleContextControls } from './components/ScaleContextControls';
import { TablatureView } from './components/TablatureView';
import { ScaleDetailsAccordion } from './components/ScaleDetailsAccordion';
import { ScaleBoxDiagram } from './components/ScaleBoxDiagram';
import { ChordDiagram } from './components/ChordDiagram';
import { ComposerPage } from './composer/ComposerPage';
import { Volume2, ChevronDown, ChevronRight } from 'lucide-react';

export default function App() {
  // Sincronizar ruta hash con la pestaña activa (#/compositor, #/acordes, #/escalas)
  const getTabFromHash = (): 'scales' | 'chords' | 'compositor' => {
    if (typeof window === 'undefined') return 'scales';
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('compositor') || hash.includes('pentagrama') || hash.includes('staff')) {
      return 'compositor';
    }
    if (hash.includes('acordes') || hash.includes('chords')) {
      return 'chords';
    }
    return 'scales';
  };

  const [currentTab, setCurrentTab] = useState<'scales' | 'chords' | 'compositor'>(getTabFromHash);

  // Escuchar cambios en la URL (Botones atrás/adelante del navegador)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: 'scales' | 'chords' | 'compositor') => {
    setCurrentTab(tab);
    if (tab === 'compositor') {
      window.location.hash = '#/compositor';
    } else if (tab === 'chords') {
      window.location.hash = '#/acordes';
    } else {
      window.location.hash = '#/escalas';
    }
  };

  // 1. Configuración General (gestionada centralmente en SettingsModal)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [notation, setNotation] = useState<NoteNotation>(() => {
    try {
      const saved = localStorage.getItem('guitarfret_notation_v1');
      if (saved === 'american' || saved === 'spanish') return saved;
    } catch {
      // ignore storage access errors
    }
    return 'american';
  });
  const [tuningId, setTuningId] = useState<TuningId>('standard');
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [fretCount, setFretCount] = useState<number>(21);

  useEffect(() => {
    try {
      localStorage.setItem('guitarfret_notation_v1', notation);
    } catch {
      // ignore storage write errors
    }
  }, [notation]);

  // 2. Estado de Escalas
  const [scaleRoot, setScaleRoot] = useState<string>('C');
  const [scaleId, setScaleId] = useState<string>('major pentatonic');
  const [scaleSubMode, setScaleSubMode] = useState<'patterns' | 'root_run'>('patterns');
  const [scaleSystem, setScaleSystem] = useState<ScaleSystem>('CAGED');
  const [scalePosition, setScalePosition] = useState<number | null>(1); // Posición 1 por defecto
  const [displayMode, setDisplayMode] = useState<'notes' | 'intervals' | 'steps' | 'fingers'>('notes'); // Notas como presentación inicial
  const [hideOutsideNotes, setHideOutsideNotes] = useState<boolean>(false);

  // Estado del recorrido "Desde una tónica"
  const [selectedStartOccurrence, setSelectedStartOccurrence] = useState<RootOccurrence | null>(null);
  const [runDirection, setRunDirection] = useState<'ascending' | 'descending'>('ascending');
  const [runSpan, setRunSpan] = useState<'1_octave' | '2_octaves'>('1_octave');
  const [runVariationIndex, setRunVariationIndex] = useState<number>(0);
  const [activePlayingMidi, setActivePlayingMidi] = useState<number | null>(null);
  const [activeTabStepIndex, setActiveTabStepIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);
  const cancelPlaybackRef = React.useRef<(() => void) | null>(null);

  // Estado del Modo Acordes
  const [chordRoot, setChordRoot] = useState<string>('C');
  const [chordSuffix, setChordSuffix] = useState<string>('major');
  const [chordPositionIndex, setChordPositionIndex] = useState<number>(0);
  const [chordAllFretboardArpeggio, setChordAllFretboardArpeggio] = useState<boolean>(false);
  const [isChordDiagramOpen, setIsChordDiagramOpen] = useState<boolean>(false);

  // 3. Cálculos de teoría musical para Escalas y Acordes
  const rootOccurrences = useMemo(() => {
    return getRootOccurrences(scaleRoot, TUNINGS[tuningId].notes, fretCount, notation);
  }, [scaleRoot, tuningId, fretCount, notation]);

  // Aparición inicial efectiva sincronizada
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
    return rootOccurrences[0] || {
      string: 5,
      fret: 3,
      pitch: 'C3',
      midi: 48,
      noteName: scaleRoot,
      solfege: getSolfege(scaleRoot),
      octave: 3,
      label: `${formatNoteName(scaleRoot, notation)} — 5.ª cuerda · traste 3`
    };
  }, [selectedStartOccurrence, rootOccurrences, scaleRoot, notation]);

  // Escala en modo Patrones (CAGED / 3NPS)
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

  // Escala en modo Desde una tónica
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
  }, [effectiveStartOccurrence, scaleId, scaleRoot, tuningId, runDirection, runSpan, runVariationIndex, fretCount]);

  // Acordes
  const chordResult = useMemo(() => {
    return getChordData(
      chordRoot,
      chordSuffix,
      chordPositionIndex,
      tuningId,
      fretCount
    );
  }, [chordRoot, chordSuffix, chordPositionIndex, tuningId, fretCount]);

  const currentScaleDef = SCALE_TYPES.find(s => s.id === scaleId) || SCALE_TYPES[0];
  const isDiatonic =
    currentScaleDef.category === 'diatonic' ||
    currentScaleDef.category === 'modes' ||
    ['phrygian dominant', 'lydian dominant', 'altered'].includes(currentScaleDef.id);

  // Ajustar posición si se cambia a una escala o sistema con menos cajas
  useEffect(() => {
    if (scalePosition !== null && scaleResult.availableBoxes.length > 0 && scalePosition > scaleResult.availableBoxes.length) {
      setScalePosition(1);
    }
  }, [scalePosition, scaleResult.availableBoxes.length]);

  // Manejo de silencio
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  // Restablecer valores
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
    setTuningId('standard');
    setNotation('american');
    setIsLeftHanded(false);
    setFretCount(21);
    audioEngine.stopCurrentSequence();
    setActivePlayingMidi(null);
    setActiveTabStepIndex(null);
    setIsPlaying(false);
  };

  // Puntos del diapasón
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
  }, [currentTab, scaleSubMode, scaleRunResult.dots, scaleResult.dots, chordResult, chordAllFretboardArpeggio]);

  // Selección de tónica en diapasón sincronizada
  const handleSelectStartNoteFromFretboard = (pos: { string: number; fret: number }) => {
    const found = rootOccurrences.find(o => o.string === pos.string && o.fret === pos.fret);
    if (found) {
      setSelectedStartOccurrence(found);
      if (scaleSubMode !== 'root_run') {
        setScaleSubMode('root_run');
      }
    }
  };

  // Reproducción en diapasón
  const handleTogglePlay = () => {
    if (isPlaying) {
      if (cancelPlaybackRef.current) cancelPlaybackRef.current();
      setIsPlaying(false);
      setActivePlayingMidi(null);
      setActiveTabStepIndex(null);
      return;
    }

    if (currentTab === 'scales') {
      if (scaleSubMode === 'root_run') {
        const steps = scaleRunResult.activeVariation?.steps || [];
        if (steps.length === 0) return;
        const stepDurationMs = Math.round((60000 / bpm) * 0.7);

        setIsPlaying(true);
        const stopFn = audioEngine.playScaleSequence(
          steps.map(s => ({
            string: s.string,
            fret: s.fret,
            note: s.noteName,
            interval: s.interval,
            isRoot: s.isRoot,
            inBox: true,
            pitch: s.pitch,
            midi: s.midi
          })),
          stepDurationMs,
          stepIndex => {
            const currentStep = steps[stepIndex];
            if (currentStep) {
              setActivePlayingMidi(currentStep.midi);
              setActiveTabStepIndex(stepIndex);
            }
          },
          () => {
            setIsPlaying(false);
            setActivePlayingMidi(null);
            setActiveTabStepIndex(null);
          }
        );
        cancelPlaybackRef.current = stopFn;
      } else {
        // Modo Patrones
        const dotsToPlay = (
          scalePosition === null
            ? scaleResult.dots
            : scaleResult.dots.filter(d => d.inBox)
        )
          .filter(d => d.midi && d.midi > 0)
          .sort((a, b) => (a.midi || 0) - (b.midi || 0));

        const uniqueNotes: typeof dotsToPlay = [];
        const seenMidis = new Set<number>();
        for (const d of dotsToPlay) {
          if (d.midi && !seenMidis.has(d.midi)) {
            seenMidis.add(d.midi);
            uniqueNotes.push(d);
          }
        }
        const finalSeq = uniqueNotes.slice(0, 16);
        if (finalSeq.length === 0) return;

        const stepDurationMs = Math.round((60000 / bpm) * 0.65);
        setIsPlaying(true);
        const stopFn = audioEngine.playScaleSequence(
          finalSeq,
          stepDurationMs,
          stepIndex => {
            const currentDot = finalSeq[stepIndex];
            if (currentDot && currentDot.midi) {
              setActivePlayingMidi(currentDot.midi);
            }
          },
          () => {
            setIsPlaying(false);
            setActivePlayingMidi(null);
          }
        );
        cancelPlaybackRef.current = stopFn;
      }
    } else {
      // Modo Acordes: rasguear
      if (!chordResult.currentPosition) return;
      const notesToPlay = chordResult.currentPosition.stringNotes
        .filter(sn => sn.fret >= 0 && sn.midi > 0)
        .map(sn => ({ midi: sn.midi }));
      audioEngine.strumChord(notesToPlay, 35, 'down');
    }
  };

  const currentChordDef = CHORD_TYPES.find(ct => ct.suffix === chordSuffix) || CHORD_TYPES[0];
  const formattedChordTitle = `${formatNoteName(chordRoot, notation)} ${currentChordDef.name}`;

  // Subtítulo contextual del diapasón
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
    const rangeText = scaleResult.boxFretRange ? ` · trastes ${scaleResult.boxFretRange[0]}–${scaleResult.boxFretRange[1]}` : '';
    return `${boxShape}${rangeText}`;
  }, [currentTab, chordPositionIndex, chordResult, notation, scaleSubMode, runDirection, runSpan, effectiveStartOccurrence, scalePosition, scaleResult]);

  // Título breve del diapasón
  const fretboardTitle = useMemo(() => {
    if (currentTab === 'chords') {
      return formattedChordTitle;
    }
    return `${formatNoteName(scaleRoot, notation)} ${currentScaleDef.name}`;
  }, [currentTab, formattedChordTitle, scaleRoot, notation, currentScaleDef]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Cabecera Compacta con navegación por rutas */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLeftHanded={isLeftHanded}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Modal de Configuración Accesible */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notation={notation}
        onChangeNotation={setNotation}
        tuningId={tuningId}
        onChangeTuning={setTuningId}
        isLeftHanded={isLeftHanded}
        onToggleLeftHanded={() => setIsLeftHanded(!isLeftHanded)}
        fretCount={fretCount}
        onChangeFretCount={setFretCount}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onReset={handleReset}
      />

      {/* Contenido Principal con Contenedor Centrado */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
        {/* CONDICIONAL: SECCIÓN COMPOSITOR MUSICAL (Ruta independiente #/compositor) */}
        {currentTab === 'compositor' ? (
          <ComposerPage notation={notation} />
        ) : (
          /* SECCIONES GUITARRA: ESCALAS Y ACORDES */
          <>
            {/* 2. Barra Principal de Selección (Antes del diapasón) */}
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

            {/* 3. Diapasón como Elemento Principal con Alta Prioridad Visual */}
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

            {/* 4. Controles Contextuales del Modo Activo y Reproducción */}
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
                  onTogglePlay={handleTogglePlay}
                />

                {/* Tablatura Secundaria Desplegable (Modo Desde una tónica) */}
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

                {/* Detalles de la Escala en Bloque Desplegable Único */}
                <ScaleDetailsAccordion
                  scaleResult={scaleResult}
                  selectedRoot={scaleRoot}
                  notation={notation}
                  scaleDisplayName={currentScaleDef.name}
                  steps={scaleRunResult.activeVariation?.steps}
                  isRootRunMode={scaleSubMode === 'root_run'}
                  defaultOpen={false}
                />

                {/* Diagrama vertical de caja en modo patrones */}
                {scaleSubMode === 'patterns' && scalePosition !== null && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsChordDiagramOpen(!isChordDiagramOpen)}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isChordDiagramOpen ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <span>Diagrama vertical de caja ({scaleResult.availableBoxes.find(b => b.index === scalePosition)?.shapeName || `Posición ${scalePosition}`})</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{isChordDiagramOpen ? 'Ocultar' : 'Ver'}</span>
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
              /* MODO ACORDES */
              <section className="flex flex-col gap-3">
                {/* Barra de rasgueo y opciones de visualización */}
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Rasguear posición</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Mostrar en diagrama:</span>
                    <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setDisplayMode('notes')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                          displayMode === 'notes' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Notas
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode('intervals')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                          displayMode === 'intervals' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Intervalos
                      </button>
                    </div>
                  </div>
                </div>

                {/* Diagrama de acorde vertical clásico */}
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

        {/* Footer Mínimo */}
        <footer className="mt-6 pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-400">GuitarFret</p>
        </footer>
      </main>
    </div>
  );
}
