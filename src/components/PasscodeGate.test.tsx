import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasscodeGate } from './PasscodeGate';

vi.mock('../lib/passcode', async () => {
  const actual = await vi.importActual<typeof import('../lib/passcode')>('../lib/passcode');
  return { ...actual, expectedHash: vi.fn() };
});

import { expectedHash, UNLOCK_KEY } from '../lib/passcode';

// Published SHA-256 of the string "abc".
const HASH_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

const Secret = () => <p>the film log</p>;

describe('PasscodeGate', () => {
  beforeEach(() => {
    // Stub localStorage to work around jsdom limitations (same pattern as queue.test.ts)
    const store: { [key: string]: string } = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => {
          delete store[key];
        });
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      length: Object.keys(store).length,
    });

    vi.mocked(expectedHash).mockReset();
  });

  it('shows the app immediately when no passcode is configured', () => {
    vi.mocked(expectedHash).mockReturnValue('');
    render(<PasscodeGate><Secret /></PasscodeGate>);
    expect(screen.getByText('the film log')).toBeInTheDocument();
  });

  it('hides the app behind a prompt when a passcode is configured', () => {
    vi.mocked(expectedHash).mockReturnValue(HASH_ABC);
    render(<PasscodeGate><Secret /></PasscodeGate>);
    expect(screen.queryByText('the film log')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/passcode/i)).toBeInTheDocument();
  });

  it('unlocks on the correct passcode and remembers the device', async () => {
    vi.mocked(expectedHash).mockReturnValue(HASH_ABC);
    render(<PasscodeGate><Secret /></PasscodeGate>);

    await userEvent.type(screen.getByLabelText(/passcode/i), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));

    expect(await screen.findByText('the film log')).toBeInTheDocument();
    expect(localStorage.getItem(UNLOCK_KEY)).toBe(HASH_ABC);
  });

  it('rejects a wrong passcode, clears the field, and stays locked', async () => {
    vi.mocked(expectedHash).mockReturnValue(HASH_ABC);
    render(<PasscodeGate><Secret /></PasscodeGate>);

    const field = screen.getByLabelText(/passcode/i);
    await userEvent.type(field, 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));

    expect(await screen.findByText(/not that one/i)).toBeInTheDocument();
    expect(screen.queryByText('the film log')).not.toBeInTheDocument();
    expect(field).toHaveValue('');
  });

  it('stays unlocked on a device that already unlocked', () => {
    vi.mocked(expectedHash).mockReturnValue(HASH_ABC);
    localStorage.setItem(UNLOCK_KEY, HASH_ABC);
    render(<PasscodeGate><Secret /></PasscodeGate>);
    expect(screen.getByText('the film log')).toBeInTheDocument();
  });

  it('re-locks a device when the configured passcode changes', () => {
    // The stored value is the OLD hash; the configured one has moved on.
    vi.mocked(expectedHash).mockReturnValue('a-different-hash');
    localStorage.setItem(UNLOCK_KEY, HASH_ABC);
    render(<PasscodeGate><Secret /></PasscodeGate>);
    expect(screen.queryByText('the film log')).not.toBeInTheDocument();
  });
});
