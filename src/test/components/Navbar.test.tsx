import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Navbar } from '../../components/layout/Navbar';

describe('Navbar', () => {
  it('renderiza las tres rutas principales y dispara acciones de navegación, ajustes y silencio', async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onOpenSettings = vi.fn();
    const onToggleMute = vi.fn();

    render(
      <Navbar
        currentTab="scales"
        onSelectTab={onSelectTab}
        onOpenSettings={onOpenSettings}
        isLeftHanded={false}
        isMuted={false}
        onToggleMute={onToggleMute}
      />
    );

    expect(screen.getByRole('button', { name: 'Escalas' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Acordes' }));
    expect(onSelectTab).toHaveBeenCalledWith('chords');

    await user.click(screen.getByRole('button', { name: /Compositor/i }));
    expect(onSelectTab).toHaveBeenCalledWith('compositor');

    await user.click(screen.getByRole('button', { name: 'Configuración del instrumento' }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Silenciar sonido' }));
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });
});
