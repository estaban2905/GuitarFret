import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ComposerPage } from '../../features/composer/components/ComposerPage';

describe('ComposerPage workflow', () => {
  it('permite añadir compases, deshacer/rehacer, guardar y confirmar nueva composición sin alerts nativos', async () => {
    const user = userEvent.setup();
    render(<ComposerPage notation="american" />);

    expect(screen.getByText('Mi Primera Composición')).toBeInTheDocument();
    expect(screen.getByText('4 compases')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Compás' }));
    expect(screen.getByText('5 compases')).toBeInTheDocument();

    const undoButton = screen.getByRole('button', { name: 'Deshacer' });
    expect(undoButton).toBeEnabled();
    await user.click(undoButton);
    expect(screen.getByText('4 compases')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar proyecto' }));
    expect(screen.getByText(/Proyecto guardado en el almacenamiento local/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Nueva composición' }));
    const confirmDialog = screen.getByRole('alertdialog');
    expect(confirmDialog).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Iniciar composición' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText('Nueva composición iniciada.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
