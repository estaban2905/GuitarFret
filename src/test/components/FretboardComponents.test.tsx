import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TUNINGS } from '../../constants/music';
import { ChordDiagram } from '../../features/fretboard/components/ChordDiagram';
import { ScaleBoxDiagram } from '../../features/fretboard/components/ScaleBoxDiagram';
import { ScaleContextControls } from '../../features/fretboard/components/ScaleContextControls';
import { ScaleDetailsAccordion } from '../../features/fretboard/components/ScaleDetailsAccordion';
import { TablatureView } from '../../features/fretboard/components/TablatureView';
import {
  calculateScaleFretboard,
  generateScaleRuns,
  getChordData,
  getRootOccurrences
} from '../../utils/theory';

describe('Componentes de fretboard', () => {
  it('ScaleDetailsAccordion expande notas, intervalos y secuencia de recorrido', async () => {
    const user = userEvent.setup();
    const scaleResult = calculateScaleFretboard('C', 'major', 'CAGED', null, 'standard', 21);
    const occs = getRootOccurrences('C', TUNINGS.standard.notes, 15);
    const runResult = generateScaleRuns({
      startString: occs[0].string,
      startFret: occs[0].fret,
      scaleId: 'major',
      root: 'C',
      tuningId: 'standard',
      direction: 'ascending',
      span: '1_octave'
    });

    render(
      <ScaleDetailsAccordion
        scaleResult={scaleResult}
        selectedRoot="C"
        notation="spanish"
        scaleDisplayName="Mayor"
        steps={runResult.activeVariation?.steps}
        isRootRunMode={true}
      />
    );

    const toggle = screen.getByRole('button', { name: /Detalles de la escala/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Fórmula de Intervalos')).toBeInTheDocument();
    expect(screen.getByText('Secuencia del recorrido')).toBeInTheDocument();
  });

  it('TablatureView renderiza pasos de recorrido en notación española y permite expandir', async () => {
    const user = userEvent.setup();
    const occs = getRootOccurrences('C', TUNINGS.standard.notes, 15);
    const runResult = generateScaleRuns({
      startString: occs[0].string,
      startFret: occs[0].fret,
      scaleId: 'major',
      root: 'C',
      tuningId: 'standard',
      direction: 'ascending',
      span: '1_octave'
    });
    const steps = runResult.activeVariation?.steps ?? [];

    render(
      <TablatureView
        steps={steps}
        notation="spanish"
        tuningLabels={['E', 'A', 'D', 'G', 'B', 'E']}
      />
    );

    const toggle = screen.getByRole('button', { name: /Tablatura/i });
    await user.click(toggle);
    expect(screen.getByText(/Haz clic en cualquier nota para escucharla/i)).toBeInTheDocument();
  });

  it('ChordDiagram y ScaleBoxDiagram renderizan sus diagramas SVG y controles', async () => {
    const user = userEvent.setup();
    const chord = getChordData('C', 'major', 0, 'standard', 21);
    const scale = calculateScaleFretboard('C', 'major', 'CAGED', 1, 'standard', 21);
    const onSelectDisplayMode = vi.fn();

    render(
      <div>
        {chord.currentPosition && (
          <ChordDiagram
            chordName="Do Mayor"
            symbol="C"
            notation="spanish"
            position={chord.currentPosition}
            positionIndex={0}
            totalPositions={chord.positions.length}
            displayMode="notes"
          />
        )}
        <ScaleBoxDiagram
          scaleName="Mayor"
          rootNote="C"
          notation="american"
          boxInfo={scale.availableBoxes[0]}
          boxDots={scale.dots}
          displayMode="fingers"
          onSelectDisplayMode={onSelectDisplayMode}
          positionIndex={1}
          totalPositions={scale.availableBoxes.length}
        />
      </div>
    );

    expect(screen.getByText('Posición 1')).toBeInTheDocument();
    const intervalsBtn = screen.getByRole('button', { name: /Intervalos/i });
    await user.click(intervalsBtn);
    expect(onSelectDisplayMode).toHaveBeenCalledWith('intervals');
  });

  it('ScaleContextControls alterna sistema CAGED/TNPS, visualización y reproducción', async () => {
    const user = userEvent.setup();
    const scaleResult = calculateScaleFretboard('C', 'major', 'CAGED', null, 'standard', 21);
    const occs = getRootOccurrences('C', TUNINGS.standard.notes, 15);
    const runResult = generateScaleRuns({
      startString: occs[0].string,
      startFret: occs[0].fret,
      scaleId: 'major',
      root: 'C',
      tuningId: 'standard',
      direction: 'ascending',
      span: '1_octave'
    });

    const onSelectSystem = vi.fn();
    const onTogglePlay = vi.fn();

    render(
      <ScaleContextControls
        notation="american"
        scaleSubMode="patterns"
        scaleRunResult={runResult}
        rootOccurrences={occs}
        selectedStartOccurrence={occs[0]}
        onSelectStartOccurrence={vi.fn()}
        runDirection="ascending"
        onChangeRunDirection={vi.fn()}
        runSpan="1_octave"
        onChangeRunSpan={vi.fn()}
        selectedVariationIndex={0}
        onSelectVariationIndex={vi.fn()}
        system="CAGED"
        onSelectSystem={onSelectSystem}
        selectedPosition={null}
        onSelectPosition={vi.fn()}
        scaleResult={scaleResult}
        isDiatonic={true}
        displayMode="notes"
        onChangeDisplayMode={vi.fn()}
        hideOutside={false}
        onToggleHideOutside={vi.fn()}
        isPlaying={false}
        bpm={120}
        onChangeBpm={vi.fn()}
        onTogglePlay={onTogglePlay}
      />
    );

    await user.click(screen.getByRole('button', { name: '3NPS (7)' }));
    expect(onSelectSystem).toHaveBeenCalledWith('TNPS');

    await user.click(screen.getByRole('button', { name: /Reproducir/i }));
    expect(onTogglePlay).toHaveBeenCalled();
  });
});
