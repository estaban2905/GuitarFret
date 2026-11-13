# Arquitectura de GuitarFret

Este documento describe la arquitectura técnica de **GuitarFret**, diseñada bajo principios de **Feature-Based Architecture**, **Clean Code**, **SOLID** y separación estricta de responsabilidades.

## 1. Principios de diseño

1. **Aislamiento por dominio (`features/`)**: Los módulos de **Escalas/Acordes** (`src/features/fretboard`) y **Compositor** (`src/features/composer`) mantienen sus propios componentes, hooks, servicios de audio y tipos sin acoplamiento cruzado.
2. **Separación de responsabilidades (SoC)**:
   - Los componentes UI son presentacionales o coordinadores ligeros; la lógica de negocio y estado complejo reside en **Custom Hooks** y **servicios/motores puros**.
   - Los cálculos armónicos y de teoría musical están desacoplados del DOM y de React para facilitar pruebas unitarias deterministas.
3. **Resiliencia en entorno iFrame**: Se prohíbe `window.alert`, `window.confirm` y `window.open` (regla `no-alert` en ESLint). Todas las confirmaciones y avisos utilizan componentes declarativos (`ConfirmDialog`, `NotificationBanner`).
4. **Seguridad de almacenamiento**: El acceso a `localStorage` está encapsulado mediante un adaptador seguro (`src/utils/storage.ts`) que previene fallos en entornos restringidos o con JSON corrupto.

## 2. Capas y estructura de directorios

```text
src/
├── app/
│   ├── App.tsx                     # Orquestador de rutas, estado global del instrumento y lazy loading
│   └── config/
│       └── env.ts                  # Validación tipada de variables de entorno VITE_*
├── components/
│   ├── layout/
│   │   └── Navbar.tsx              # Barra de navegación principal y selector de notación
│   ├── shared/
│   │   └── SettingsModal.tsx       # Configuración persistente del instrumento
│   └── ui/
│       ├── ConfirmDialog.tsx       # Diálogo modal accesible para confirmaciones
│       └── NotificationBanner.tsx  # Banner de feedback en línea (error, éxito, info)
├── constants/
│   └── music.ts                    # Definición canónica de notas, escalas, afinaciones y CAGED
├── hooks/
│   ├── useHashRoute.ts             # Sincronización de navegación por hash (#/scales, #/chords, #/compositor)
│   └── useInstrumentSettings.ts    # Persistencia y reseteo de configuración del instrumento
├── types/
│   └── music.types.ts              # Tipos del dominio musical compartido
├── utils/
│   ├── notation.ts                 # Conversión y formateo consistente Anglosajón <-> Español
│   ├── storage.ts                  # Adaptador tipado y seguro para localStorage
│   └── theory.ts                   # Motor de cálculo de escalas, acordes y posiciones en mástil
└── features/
    ├── fretboard/
    │   ├── components/             # FretboardView, MainSelectionBar, ScaleContextControls, TablatureView, etc.
    │   ├── hooks/
    │   │   └── useFretboardPlayback.ts
    │   └── services/
    │       └── guitarAudio.ts      # Síntesis Web Audio para guitarra (notas, escalas, acordes)
    └── composer/
        ├── components/             # ComposerPage, ComposerToolbar, HarmonicSidebar, StaffCanvas, etc.
        ├── hooks/
        │   └── useComposerProject.ts # CRUD de proyecto, historial Undo/Redo, confirmaciones y guardado
        ├── services/
        │   ├── composerAudio.ts    # Motor de reproducción cronometrada y metrónomo
        │   └── exportUtils.ts      # Exportadores MIDI, MusicXML, JSON y SVG
        ├── types/
        │   └── composer.types.ts
        └── utils/
            └── musicTheoryEngine.ts # Cálculo algorítmico de tonalidades, modos, armaduras y acordes diatónicos
```

## 3. Patrones aplicados

- **Custom Hooks**: `useHashRoute`, `useInstrumentSettings`, `useFretboardPlayback` y `useComposerProject` encapsulan efectos secundarios, suscripciones y máquinas de estado fuera del JSX.
- **Adapter Pattern**:
  - `src/utils/storage.ts` adapta `window.localStorage` con manejo de excepciones y serialización segura.
  - `src/features/fretboard/services/guitarAudio.ts` y `src/features/composer/services/composerAudio.ts` encapsulan la Web Audio API detrás de interfaces de alto nivel.
- **Strategy / Pure Engines**:
  - `src/utils/theory.ts` y `src/features/composer/utils/musicTheoryEngine.ts` operan como motores puros sin estado mutante externo.
  - `src/features/composer/services/exportUtils.ts` agrupa estrategias independientes de serialización (MIDI binario, MusicXML, JSON, SVG).
- **Code Splitting (`React.lazy` + `Suspense`)**: `ComposerPage` se carga bajo demanda en `src/app/App.tsx` para evitar penalizar el bundle inicial cuando el usuario explora escalas o acordes.

## 4. Flujo de dependencias

Las dependencias siguen una dirección unidireccional para evitar referencias circulares:

```text
app/ -> features/* -> hooks/ & components/{ui,shared,layout} -> utils/ & constants/ -> types/
```

- `utils/`, `constants/` y `types/` **no importan** nada de `features/`, `components/` ni `app/`.
- `features/fretboard` y `features/composer` **no se importan entre sí**; comparten únicamente `types/`, `constants/` y `utils/`.

## 5. Estrategia de calidad y pruebas

- **TypeScript Strict**: `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noImplicitReturns": true`, cero usos de `any`.
- **ESLint 9 Flat Config**: Reglas de `typescript-eslint`, `react`, `react-hooks`, `jsx-a11y`, `import`, `no-alert` y compatibilidad con Prettier.
- **Vitest + React Testing Library**:
  - Pruebas unitarias sobre teoría musical (`theory.test.ts`, `composerTheory.test.ts`).
  - Pruebas de hooks (`useInstrumentSettings.test.ts`).
  - Pruebas de componentes e integración de flujos (`Navbar.test.tsx`, `SettingsModal.test.tsx`, `MainSelectionBar.test.tsx`, `ComposerWorkflow.test.tsx`).
