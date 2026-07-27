import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlRenderer } from './ControlRenderer';
import { getCamera } from '../../cameras';

describe('ControlRenderer', () => {
  it('renders every control the camera has', () => {
    render(
      <ControlRenderer
        controls={getCamera('olympus-xa').controls}
        value={{ aperture: 'f/8', focus: '3m (hyperfocal)', backlight: false }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Aperture')).toBeInTheDocument();
    expect(screen.getByText('Rangefinder distance')).toBeInTheDocument();
    expect(screen.getByText('Backlight +1.5 EV')).toBeInTheDocument();
  });

  it('never renders a control the camera does not have', () => {
    render(
      <ControlRenderer
        controls={getCamera('olympus-xa').controls}
        value={{ aperture: 'f/8', focus: '0.9m', backlight: false }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/mode dial/i)).not.toBeInTheDocument();
  });

  it('marks the current value as pressed', () => {
    render(
      <ControlRenderer
        controls={getCamera('olympus-xa').controls}
        value={{ aperture: 'f/8', focus: '0.9m', backlight: false }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'f/8' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'f/4' }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the whole settings object when one control changes', async () => {
    const onChange = vi.fn();
    render(
      <ControlRenderer
        controls={getCamera('olympus-xa').controls}
        value={{ aperture: 'f/8', focus: '0.9m', backlight: false }}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'f/16' }));
    expect(onChange).toHaveBeenCalledWith({
      aperture: 'f/16', focus: '0.9m', backlight: false,
    });
  });

  it('shows the distance range under a focus zone so ranges get learned', () => {
    render(
      <ControlRenderer
        controls={getCamera('pentax-17').controls}
        value={{ mode: 'Standard', zone: 'Close', expcomp: 0, flash: false }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('1.4–2.2 m')).toBeInTheDocument();
  });

  it('formats exposure compensation with a sign', () => {
    render(
      <ControlRenderer
        controls={getCamera('pentax-17').controls}
        value={{ mode: 'Standard', zone: 'Close', expcomp: 0, flash: false }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '−1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
  });

  it('toggles a boolean control', async () => {
    const onChange = vi.fn();
    render(
      <ControlRenderer
        controls={getCamera('olympus-xa').controls}
        value={{ aperture: 'f/8', focus: '0.9m', backlight: false }}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('switch', { name: /backlight/i }));
    expect(onChange).toHaveBeenCalledWith({
      aperture: 'f/8', focus: '0.9m', backlight: true,
    });
  });
});
