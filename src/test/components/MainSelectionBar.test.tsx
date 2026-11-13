import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MainSelectionBar } from '../../features/fretboard/components/MainSelectionBar';

describe('MainSelectionBar', () => {
  it('renderiza controles de escala y cambia entre Patrones y Desde una tónica', async () => {
    const user = userEvent.setup();
    const onSelectScaleRoot = vi.fn();
    const onSelectScaleId = vi.fn();
    const onChangeScaleSubMode = vi.fn();

    render(
      <MainSelectionBar
        currentTab="scales"
        notation="spanish"
        selectedScaleRoot="C"
        onSelectScaleRoot={onSelectScaleRoot}
        selectedScaleId="major pentatonic"
        onSelectScaleId={onSelectScaleId}
        scaleSubMode="patterns"
        onChangeScaleSubMode={onChangeScaleSubMode}
        selectedChordRoot="C"
        onSelectChordRoot={vi.fn()}
        selectedChordSuffix="major"
        onSelectChordSuffix={vi.fn()}
        selectedChordPositionIndex={0}
        onSelectChordPositionIndex={vi.fn()}
        allFretboardArpeggio={false}
        onToggleAllFretboardArpeggio={vi.fn()}
      />
    );

    await user.selectOptions(screen.getByLabelText('Tónica de la escala'), 'G');
    expect(onSelectScaleRoot).toHaveBeenCalledWith('G');

    await user.click(screen.getByRole('button', { name: 'Desde una tónica' }));
    expect(onChangeScaleSubMode).toHaveBeenCalledWith('root_run');
  });

  it('renderiza selector de acordes y alterna arpegio en todo el mástil', async () => {
    const user = userEvent.setup();
    const onToggleAllFretboardArpeggio = vi.fn();

    render(
      <MainSelectionBar
        currentTab="chords"
        notation="american"
        selectedScaleRoot="C"
        onSelectScaleRoot={vi.fn()}
        selectedScaleId="major pentatonic"
        onSelectScaleId={vi.fn()}
        scaleSubMode="patterns"
        onChangeScaleSubMode={vi.fn()}
        selectedChordRoot="C"
        onSelectChordRoot={vi.fn()}
        selectedChordSuffix="major"
        onSelectChordSuffix={vi.fn()}
        selectedChordPositionIndex={0}
        onSelectChordPositionIndex={vi.fn()}
        allFretboardArpeggio={false}
        onToggleAllFretboardArpeggio={onToggleAllFretboardArpeggio}
      />
    );

    await user.click(screen.getByRole('checkbox', { name: /Arpegio en todo el mástil/i }));
    expect(onToggleAllFretboardArpeggio).toHaveBeenCalledWith(true);
  });
});
