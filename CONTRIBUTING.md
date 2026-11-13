# Guía de contribución

Gracias por contribuir a **GuitarFret**. Este repositorio sigue estándares estrictos de calidad de código, accesibilidad y arquitectura modular.

## Flujo de trabajo

1. Instala las dependencias con `npm install`.
2. Crea una rama descriptiva a partir de la rama principal (`feat/...`, `fix/...`, `refactor/...`).
3. Implementa los cambios respetando la separación de capas descrita en [`ARCHITECTURE.md`](./ARCHITECTURE.md).
4. Añade o actualiza las pruebas en `src/test/`.
5. Ejecuta el gate completo antes de abrir un Pull Request:

```bash
npm run check
```

Este comando valida de forma secuencial:

1. `npm run typecheck` (`tsc --noEmit`)
2. `npm run lint` (`eslint .`)
3. `npm run format:check` (`prettier --check .`)
4. `npm run test:coverage` (Vitest + umbrales de cobertura)
5. `npm run build` (build de producción Vite)

## Estándares de código

- **TypeScript**:
  - Tipado explícito y estricto. No se permite `any` (`@typescript-eslint/no-explicit-any: error`).
  - Usar `import type` para importaciones de solo tipos (`@typescript-eslint/consistent-type-imports`).
- **React y Accesibilidad**:
  - Componentes funcionales con props tipadas.
  - Asociar etiquetas `<label htmlFor="...">` a sus controles.
  - Los elementos interactivos SVG o no nativos deben incluir `role`, `tabIndex`, `aria-label` y soporte de teclado (`onKeyDown` con `Enter` / `Espacio`).
  - Prohibido usar `window.alert`, `window.confirm` o `window.open`; usar `ConfirmDialog` o `NotificationBanner`.
- **Formato**:
  - Prettier configurado en `.prettierrc` (comillas simples, sin trailing commas, ancho máximo 100).
  - Ejecuta `npm run format` para formatear automáticamente.

## Convención de Commits y Hooks

El proyecto incluye configuración lista para **Husky**, **lint-staged** y **Commitlint** bajo el estándar **Conventional Commits**:

- `feat:` nueva funcionalidad
- `fix:` corrección de error
- `refactor:` refactorización sin cambio funcional
- `test:` adición o corrección de pruebas
- `docs:` cambios en documentación
- `chore:` mantenimiento, dependencias o configuración

Ejemplo:

```text
feat(composer): add keyboard navigation to measure blocks
```

- **Pre-commit (`.husky/pre-commit`)**: ejecuta `npx lint-staged` (`eslint --fix` y `prettier --write` sobre archivos modificados).
- **Commit-msg (`.husky/commit-msg`)**: valida el mensaje con `commitlint`.

## Pautas de testing

- Coloca las pruebas unitarias en `src/test/unit/`, pruebas de hooks en `src/test/hooks/` y pruebas de componentes/integración en `src/test/components/`.
- Evita acoplar los tests a clases CSS utilitarias; prioriza consultas accesibles (`getByRole`, `getByLabelText`, `getByText`).
- Asegúrate de limpiar mocks y timers en `afterEach` (configurado globalmente en `src/test/setup.ts`).
