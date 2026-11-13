/**
 * @file TransportBar.tsx
 * @description Panel inferior con controles profesionales de reproducción y transporte:
 * - Reproducir, Pausar, Detener, Reiniciar
 * - Selector de instrumento (Piano, Guitarra, Bajo, Cuerdas, Sintetizador)
 * - Control de BPM con ajuste fino
 * - Modo Bucle (Loop), Metrónomo y Control de Volumen
 */

import React from 'react';
import { InstrumentType } from '../types';
import {
  Play,
  Square,
  RotateCcw,
  Repeat,
  Volume2,
  VolumeX,
  Gauge
} from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  isLoop: boolean;
  onToggleLoop: () => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  instrument: InstrumentType;
  onChangeInstrument: (inst: InstrumentType) => void;
  isMetronomeOn: boolean;
  onToggleMetronome: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  onPlay: () => void;
  onStop: () => void;
  currentMeasureIndex: number;
  totalMeasures: number;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isLoop,
  onToggleLoop,
  bpm,
  onChangeBpm,
  instrument,
  onChangeInstrument,
  isMetronomeOn,
  onToggleMetronome,
  volume,
  onChangeVolume,
  onPlay,
  onStop,
  currentMeasureIndex,
  totalMeasures
}) => {
  return (
    <footer className="w-full bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* 1. BOTONES PRINCIPALES DE TRANSPORTE */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isPlaying ? onStop : onPlay}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all cursor-pointer ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
          }`}
          title={isPlaying ? 'Detener reproducción' : 'Reproducir partitura'}
        >
          {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isPlaying ? 'Detener' : 'Reproducir'}</span>
        </button>

        <button
          type="button"
          onClick={onStop}
          className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
          title="Reiniciar al compás 1"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleLoop}
          className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
            isLoop
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title={isLoop ? 'Bucle activado' : 'Activar bucle'}
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Indicador de posición actual */}
        <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-slate-300">
          Compás: <span className="font-bold text-amber-400">{currentMeasureIndex + 1}</span> / {totalMeasures}
        </div>
      </div>

      {/* 2. SELECTOR DE INSTRUMENTO */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 font-medium hidden sm:inline">Instrumento:</span>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'piano', label: 'Piano' },
            { id: 'guitar', label: 'Guitarra' },
            { id: 'bass', label: 'Bajo' },
            { id: 'strings', label: 'Cuerdas' },
            { id: 'synth', label: 'Sintetizador' }
          ].map(inst => (
            <button
              key={inst.id}
              type="button"
              onClick={() => onChangeInstrument(inst.id as InstrumentType)}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                instrument === inst.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {inst.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TEMPO / BPM, METRÓNOMO Y VOLUMEN */}
      <div className="flex items-center gap-3">
        {/* Metrónomo */}
        <button
          type="button"
          onClick={onToggleMetronome}
          className={`px-2.5 py-1.5 rounded-lg border font-semibold text-xs transition-colors cursor-pointer ${
            isMetronomeOn
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Metrónomo"
        >
          Metrónomo {isMetronomeOn ? 'ON' : 'OFF'}
        </button>

        {/* BPM Stepper y Slider */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          <input
            type="number"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => onChangeBpm(Math.max(40, Math.min(240, parseInt(e.target.value, 10) || 120)))}
            className="w-12 bg-transparent text-white font-mono font-bold focus:outline-none"
          />
          <span className="text-slate-500 text-[11px]">BPM</span>
        </div>

        {/* Volumen */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-16 accent-amber-500 cursor-pointer"
            title="Volumen Maestro"
          />
        </div>
      </div>
    </footer>
  );
};
