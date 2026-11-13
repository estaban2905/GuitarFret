import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsModal } from '../../components/shared/SettingsModal';

describe('SettingsModal', () => {
  it('permite cambiar notación, afinación, trastes y restablecer configuración', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onChangeNotation = vi.fn();
    const onChangeTuning = vi.fn();
    const onToggleLeftHanded = vi.fn();
    const onChangeFretCount = vi.fn();
    const onToggleMute = vi.fn();
    const onReset = vi.fn();

    render(
      <SettingsModal
        isOpen
        onClose={onClose}
        notation="american"
        onChangeNotation={onChangeNotation}
        tuningId="standard"
        onChangeTuning={onChangeTuning}
        isLeftHanded={false}
        onToggleLeftHanded={onToggleLeftHanded}
        fretCount={21}
        onChangeFretCount={onChangeFretCount}
        isMuted={false}
        onToggleMute={onToggleMute}
        onReset={onReset}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Española/i }));
    expect(onChangeNotation).toHaveBeenCalledWith('spanish');

    await user.selectOptions(screen.getByLabelText('Afinación'), 'dropD');
    expect(onChangeTuning).toHaveBeenCalledWith('dropD');

    await user.click(screen.getByRole('button', { name: '15 trastes' }));
    expect(onChangeFretCount).toHaveBeenCalledWith(15);

    await user.click(screen.getByRole('switch', { name: 'Modo para zurdos' }));
    expect(onToggleLeftHanded).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Restablecer/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
