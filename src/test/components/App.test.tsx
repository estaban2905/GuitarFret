import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';

vi.mock('../../features/fretboard/components/FretboardView', () => ({
  FretboardView: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="mock-fretboard-view">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  )
}));

describe('App integration & lazy routing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/escalas';
  });

  it('navega entre Escalas, Acordes, abre Configuración y carga Compositor bajo demanda', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('mock-fretboard-view')).toBeInTheDocument();

    // Cambiar a pestaña Acordes
    await user.click(screen.getByRole('button', { name: /Acordes/i }));
    expect(window.location.hash).toBe('#/acordes');
    expect(screen.getByRole('button', { name: /Rasguear posición/i })).toBeInTheDocument();

    // Abrir modal de configuración
    await user.click(screen.getByRole('button', { name: /Configuración/i }));
    expect(screen.getByText(/Configuración del Instrumento/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Listo' }));

    // Navegar al Compositor con React.lazy + Suspense
    await user.click(screen.getByRole('button', { name: /Compositor/i }));
    expect(window.location.hash).toBe('#/compositor');

    expect(
      await screen.findByText('Mi Primera Composición', {}, { timeout: 5000 })
    ).toBeInTheDocument();
  });
});
