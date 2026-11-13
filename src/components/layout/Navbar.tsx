/**
 * @file Navbar.tsx
 * @description Cabecera compacta para GuitarFret:
 * - Logo y nombre GuitarFret
 * - Selector de rutas/vistas: "Escalas | Acordes | Compositor"
 * - Botón "Configuración" accesible con indicador de ajustes activos
 * - Botón de silencio rápido
 */

import type React from 'react';
import { Volume2, VolumeX, Settings, Music } from 'lucide-react';
import type { AppRouteTab } from '../../types/music.types';

interface NavbarProps {
  currentTab: AppRouteTab;
  onSelectTab: (tab: AppRouteTab) => void;
  onOpenSettings: () => void;
  isLeftHanded: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  isLeftHanded,
  isMuted,
  onToggleMute
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* 1. Logo y Nombre */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <span className="font-mono font-black text-slate-950 text-sm leading-none">GF</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white hidden sm:inline">
            GuitarFret
          </span>
        </div>

        {/* 2. Selector de Rutas "Escalas | Acordes | Compositor" */}
        <nav
          aria-label="Navegación principal"
          className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800"
        >
          <button
            type="button"
            onClick={() => onSelectTab('scales')}
            aria-current={currentTab === 'scales' ? 'page' : undefined}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              currentTab === 'scales'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Escalas
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('chords')}
            aria-current={currentTab === 'chords' ? 'page' : undefined}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              currentTab === 'chords'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Acordes
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('compositor')}
            aria-current={currentTab === 'compositor' ? 'page' : undefined}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'compositor'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Editor de Composición Musical y Pentagrama"
          >
            <Music className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Compositor</span>
          </button>
        </nav>

        {/* 3. Acciones de Utilidad: Configuración y Silencio */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
            title="Abrir configuración de afinación, zurdo y trastes"
            aria-label="Configuración del instrumento"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="hidden md:inline">Configuración</span>
            {isLeftHanded && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modo zurdo activo" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            aria-pressed={isMuted}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
