# GuitarFret

Aplicación web interactiva de teoría musical, visualización de diapasón de guitarra y composición en pentagrama desarrollada con **React 19**, **TypeScript** y **Vite**.

## Funcionalidades principales

- **Escalas (`#/scales`)**: Explorador interactivo sobre mástil configurable (15, 17 o 21 trastes, afinaciones múltiples, modo para zurdos), patrones CAGED / 3 notas por cuerda, modo "Desde una tónica" (1 o 2 octavas, ascendente/descendente), tablatura sincronizada y reproducción Web Audio con control de BPM.
- **Acordes (`#/chords`)**: Diccionario de digitaciones de guitarra (`@tombatossals/chords-db`), visualización en mástil y diagramas verticales con cejillas, bajos e intervalos, además de reproducción arpegiada o rasgueada.
- **Compositor (`#/compositor`)**: Editor de composición musical en pentagrama SVG con motor de teoría musical dinámico (12 tonalidades mayores/menores y modos griegos), generador de progresiones armónicas, inspector de propiedades, historial Undo/Redo, persistencia local segura y exportación (MIDI, MusicXML, JSON y SVG).
- **Notación dual**: Soporte consistente en toda la aplicación para notación anglosajona (`C D E F G A B`) y española/latina (`Do Re Mi Fa Sol La Si`).

## Stack tecnológico

- **UI y Renderizado**: React 19, TypeScript 5.9 (strict), Tailwind CSS 4, Lucide Icons, `@moonwave99/fretboard.js`
- **Teoría Musical**: `tonal`, `@tombatossals/chords-db`, motor armónico propio en `src/features/composer/utils/musicTheoryEngine.ts`
- **Audio**: Web Audio API nativa (sin dependencias externas en runtime)
- **Calidad de código**: ESLint 9 (Flat Config + `typescript-eslint`, `react-hooks`, `jsx-a11y`, `import`), Prettier, Husky, `lint-staged`, Commitlint
- **Testing**: Vitest, React Testing Library, `@testing-library/jest-dom`, cobertura V8

## Requisitos

- **Node.js** `>= 20.x`
- **npm** `>= 10.x`

## Instalación y ejecución local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno (opcional)
cp .env.example .env

# 3. Iniciar servidor de desarrollo en http://localhost:3000
npm run dev
```

## Variables de entorno

Definidas y documentadas en `.env.example` y validadas en `src/app/config/env.ts`:

| Variable           | Descripción                                        | Valor por defecto |
| ------------------ | -------------------------------------------------- | ----------------- |
| `VITE_APP_NAME`    | Nombre de la aplicación expuesto al cliente        | `GuitarFret`      |
| `VITE_DEFAULT_BPM` | Tempo inicial predeterminado en BPM (rango 40–240) | `120`             |

## Scripts disponibles

| Script                  | Descripción                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`           | Inicia Vite en el puerto `3000`                                                  |
| `npm run build`         | Genera el bundle de producción en `dist/`                                        |
| `npm run preview`       | Sirve el build de producción localmente                                          |
| `npm run typecheck`     | Ejecuta validación estricta de TypeScript (`tsc --noEmit`)                       |
| `npm run lint`          | Analiza el proyecto con ESLint                                                   |
| `npm run lint:fix`      | Corrige automáticamente problemas de ESLint                                      |
| `npm run format`        | Formatea el código con Prettier                                                  |
| `npm run format:check`  | Verifica el formato con Prettier sin modificar archivos                          |
| `npm run test`          | Ejecuta la suite de pruebas con Vitest                                           |
| `npm run test:watch`    | Ejecuta Vitest en modo observador                                                |
| `npm run test:coverage` | Ejecuta pruebas y verifica umbrales de cobertura                                 |
| `npm run check`         | Gate completo: `typecheck` + `lint` + `format:check` + `test:coverage` + `build` |
| `npm run clean`         | Limpia `dist/`, `coverage/` y artefactos temporales                              |

## Estructura del proyecto

```text
src/
├── app/                   # Raíz de la aplicación y configuración de entorno
├── components/
│   ├── layout/            # Navegación y estructura global (Navbar)
│   ├── shared/            # Modales y componentes transversales (SettingsModal)
│   └── ui/                # Primitivas accesibles (ConfirmDialog, NotificationBanner)
├── constants/             # Constantes musicales, afinaciones, escalas y progresiones
├── features/
│   ├── fretboard/         # Módulo de Escalas y Acordes (componentes, hooks, audio)
│   └── composer/          # Módulo independiente de Compositor en pentagrama
├── hooks/                 # Custom hooks compartidos (useHashRoute, useInstrumentSettings)
├── test/                  # Configuración Vitest y pruebas unitarias/hooks/integración
├── types/                 # Contratos TypeScript compartidos
└── utils/                 # Utilidades puras de teoría, notación y almacenamiento seguro
```

Para detalles arquitectónicos profundos, consulta [`ARCHITECTURE.md`](./ARCHITECTURE.md).
