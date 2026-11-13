/**
 * @file FretboardView.tsx
 * @description Diapasón interactivo de guitarra (elemento principal de GuitarFret).
 * Diseñado conforme a los requerimientos de reducción de ruido visual:
 * - Sin títulos técnicos ("Mástil SVG" eliminado)
 * - Encabezado breve: Título musical ("Do pentatónica mayor") y subtítulo contextual ("Inicio: 5.ª cuerda · traste 3 | 1 octava ↑")
 * - Única instrucción breve en modo recorrido: "Selecciona una tónica en el mástil para cambiar el inicio"
 * - Afinación activa en una sola línea discreta
 * - Leyenda concisa que muestra solo las categorías presentes (Inicio con halo, Tónica, Escala)
 * - Identificación clara de cuerdas y números de trastes
 * - Clic en cualquier nota para escucharla y/o cambiar la tónica de inicio
 */

import React, { useEffect, useRef } from 'react';
import { Fretboard } from '@moonwave99/fretboard.js';
import { ScalePositionDot, TUNINGS, TuningId, NoteNotation, formatNoteName, formatTuningLabels } from '../utils/theory';
import { audioEngine } from '../utils/audio';

interface FretboardViewProps {
  dots: ScalePositionDot[];
  rootNote: string;
  tuningId: TuningId;
  notation: NoteNotation;
  displayMode: 'notes' | 'intervals' | 'fingers' | 'steps';
  isLeftHanded: boolean;
  activePlayingMidi?: number | null;
  boxFretRange?: [number, number];
  fretCount?: number;
  highlightOnlyBox?: boolean;
  onSelectStartNote?: (pos: { string: number; fret: number }) => void;
  isRootRunMode?: boolean;
  title: string;
  subtitle: string;
}

export const FretboardView: React.FC<FretboardViewProps> = ({
  dots,
  rootNote,
  tuningId,
  notation,
  displayMode,
  isLeftHanded,
  activePlayingMidi,
  fretCount = 21,
  highlightOnlyBox = false,
  onSelectStartNote,
  isRootRunMode = false,
  title,
  subtitle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fretboardInstanceRef = useRef<Fretboard | null>(null);

  const tuning = TUNINGS[tuningId] || TUNINGS.standard;

  // Renderizar o actualizar el mástil cuando cambien las propiedades
  useEffect(() => {
    if (!containerRef.current) return;

    // Limpiar contenedor anterior
    containerRef.current.innerHTML = '';

    // Filtrar los dots según highlightOnlyBox
    const visibleDots = highlightOnlyBox
      ? dots.filter(d => d.inBox)
      : dots;

    // Convertir dots al formato esperado por @moonwave99/fretboard.js
    const formattedDots = visibleDots.map(d => ({
      string: d.string,
      fret: d.fret,
      note: d.note,
      interval: d.interval,
      finger: d.finger || 0,
      isRoot: d.isRoot,
      inBox: d.inBox,
      isStart: Boolean(d.isStart),
      stepNumber: d.stepNumber ?? 0,
      midi: d.midi ?? 0,
      pitch: d.pitch
    }));

    try {
      const fb = new Fretboard({
        el: containerRef.current,
        fretCount,
        tuning: tuning.notes,
        showFretNumbers: true,
        scaleFrets: true,
        height: 200,
        stringWidth: 1.6,
        stringColor: '#64748b',
        fretWidth: 1.4,
        fretColor: '#475569',
        nutWidth: 5,
        nutColor: '#f1f5f9',
        fretNumbersColor: '#94a3b8',
        fretNumbersHeight: 26,
        fretNumbersMargin: 12,
        dotSize: notation === 'spanish' ? 25 : 22,
        dotTextSize: notation === 'spanish' ? 9.5 : 11,
        font: 'JetBrains Mono, monospace'
      });

      fb.setDots(formattedDots);
      fb.render();

      // Función auxiliar para determinar la etiqueta del punto
      const getDotLabel = (dot: any) => {
        if (displayMode === 'steps' && dot.stepNumber > 0) {
          return `${dot.stepNumber}`;
        }
        if (displayMode === 'fingers' && dot.finger > 0) {
          return `${dot.finger}`;
        }
        if (displayMode === 'intervals') {
          return dot.interval || '';
        }
        return formatNoteName(dot.note || '', notation);
      };

      const baseDotFontSize = notation === 'spanish' && displayMode === 'notes' ? 9.5 : 11;

      // 1. Estilizar nota inicial seleccionada del recorrido: tónica con halo y borde distintivo
      fb.style({
        filter: (dot: any) => dot.isStart,
        fill: '#f59e0b',
        stroke: '#ffffff',
        strokeWidth: 3.5,
        fontFill: '#000000',
        fontSize: notation === 'spanish' && displayMode === 'notes' ? 10 : 12,
        text: getDotLabel
      });

      // 2. Estilizar otras tónicas dentro del recorrido o caja
      fb.style({
        filter: (dot: any) => dot.isRoot && dot.inBox && !dot.isStart,
        fill: '#f59e0b',
        stroke: '#ffffff',
        strokeWidth: 1.5,
        fontFill: '#0f172a',
        fontSize: baseDotFontSize,
        text: getDotLabel
      });

      // 3. Estilizar notas normales dentro de la escala activa
      fb.style({
        filter: (dot: any) => !dot.isRoot && dot.inBox,
        fill: '#0284c7',
        stroke: '#bae6fd',
        strokeWidth: 1.5,
        fontFill: '#ffffff',
        fontSize: baseDotFontSize,
        text: getDotLabel
      });

      // 4. Estilizar notas fuera de foco (atenuadas sutilmente)
      fb.style({
        filter: (dot: any) => !dot.inBox,
        fill: '#1e293b',
        stroke: '#475569',
        strokeWidth: 1,
        fontFill: '#94a3b8',
        fontSize: notation === 'spanish' && displayMode === 'notes' ? 9 : 10,
        opacity: 0.28,
        text: getDotLabel
      });

      // Efecto post-render: aplicar halo brillante a la nota inicial y ajustar tamaño de texto largo (ej. Sol#, Mib)
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        const circles = svg.querySelectorAll('.dot-circle');
        circles.forEach((circle: any) => {
          const data = circle.__data__;
          if (data && data.isStart) {
            circle.setAttribute('data-is-start', 'true');
            circle.style.filter = 'drop-shadow(0 0 10px #f59e0b) drop-shadow(0 0 3px #ffffff)';
            circle.style.stroke = '#ffffff';
            circle.style.strokeWidth = '3.5px';
            circle.style.transform = 'scale(1.15)';
            circle.style.transformOrigin = `${circle.cx?.baseVal?.value ?? 0}px ${circle.cy?.baseVal?.value ?? 0}px`;
          }
        });

        const dotTexts = svg.querySelectorAll('.dot-text');
        dotTexts.forEach((txt: any) => {
          const len = (txt.textContent || '').trim().length;
          if (len >= 4) {
            txt.style.fontSize = '8.5px';
          } else if (len === 3) {
            txt.style.fontSize = '9.5px';
          }
        });
      }

      // Evento de clic: reproducir audio y seleccionar tónica si aplica
      fb.on('click', (position: any) => {
        const matchingDot = dots.find(
          d => d.string === position.string && d.fret === position.fret
        );

        if (matchingDot && matchingDot.midi) {
          audioEngine.playMidi(matchingDot.midi, 1.8);
        }

        if (onSelectStartNote && matchingDot) {
          if (matchingDot.isRoot || isRootRunMode) {
            onSelectStartNote({ string: position.string, fret: position.fret });
          }
        }
      });

      fretboardInstanceRef.current = fb;
    } catch (err) {
      console.error('Error al inicializar fretboard.js:', err);
    }
  }, [dots, rootNote, tuningId, notation, displayMode, fretCount, highlightOnlyBox, isRootRunMode, onSelectStartNote]);

  // Resaltar visualmente la nota activa durante la reproducción
  useEffect(() => {
    if (!containerRef.current || activePlayingMidi === undefined) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const allCircles = svg.querySelectorAll('.dot-circle');
    allCircles.forEach((circle: any) => {
      const data = circle.__data__;
      if (data && data.midi === activePlayingMidi) {
        circle.setAttribute('data-active-playing', 'true');
        circle.style.transition = 'transform 0.15s ease, filter 0.15s ease';
        circle.style.filter = 'drop-shadow(0 0 12px #38bdf8) drop-shadow(0 0 6px #f59e0b)';
        circle.style.transform = 'scale(1.3)';
        circle.style.transformOrigin = `${circle.cx?.baseVal?.value ?? 0}px ${circle.cy?.baseVal?.value ?? 0}px`;
      } else if (data && data.isStart) {
        circle.style.filter = 'drop-shadow(0 0 10px #f59e0b) drop-shadow(0 0 3px #ffffff)';
        circle.style.transform = 'scale(1.15)';
      } else {
        circle.removeAttribute('data-active-playing');
        circle.style.filter = '';
        circle.style.transform = '';
      }
    });
  }, [activePlayingMidi]);

  const hasStartDot = dots.some(d => d.isStart);
  const hasOutsideDots = !highlightOnlyBox && dots.some(d => !d.inBox);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-3">
      {/* Encabezado Principal y Contextual */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
            <span className="text-amber-400 font-semibold">{subtitle}</span>
            {isRootRunMode && (
              <span className="text-slate-400 text-[11px]">
                · Haz clic en cualquier tónica en el mástil para cambiar el inicio
              </span>
            )}
          </div>
        </div>

        {/* Afinación activa y Leyenda compacta (solo elementos presentes) */}
        <div className="flex flex-wrap items-center gap-3 text-xs self-start sm:self-auto">
          {/* Afinación activa discreta */}
          <span className="text-slate-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Afinación: {formatTuningLabels(tuning.labels, notation).join(' · ')}
          </span>

          {/* Leyenda concisa */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            {hasStartDot && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-400/40 inline-block" />
                <span className="font-semibold text-amber-300">Inicio</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Tónica</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
              <span>Escala</span>
            </span>
            {hasOutsideDots && (
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block opacity-40" />
                <span>Fuera</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenedor horizontal del mástil SVG */}
      <div className="relative w-full overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div
          className={`min-w-[920px] transition-transform duration-300 ${
            isLeftHanded ? 'left-handed-fretboard' : ''
          }`}
          style={{
            transform: isLeftHanded ? 'scaleX(-1)' : 'none'
          }}
        >
          <div ref={containerRef} className="fretboard-canvas select-none" />
        </div>
      </div>

      {/* Estilos CSS específicos */}
      <style>{`
        .left-handed-fretboard svg text {
          transform-box: fill-box;
          transform-origin: center;
          transform: scaleX(-1);
        }
        .fretboard-canvas svg {
          overflow: visible;
          border-radius: 8px;
        }
        .fretboard-canvas .dot-circle {
          cursor: pointer;
          transition: transform 0.15s ease, fill 0.15s ease;
        }
        .fretboard-canvas .dot-circle:hover {
          filter: brightness(1.25);
          transform: scale(1.12);
          transform-origin: center;
        }
        .fretboard-canvas .fretboard-fret-number {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
