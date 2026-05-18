import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock global de Phaser porque no corre bien en JSDOM
vi.mock('phaser', () => {
  const KeyCodes = {
    W: 87, S: 83, A: 65, D: 68,
    SPACE: 32, SHIFT: 16, ONE: 49, TWO: 50, THREE: 51
  };
  const phaserMock = {
    Physics: { Arcade: { Sprite: class Sprite {} } },
    Scene: class Scene {},
    Scale: { FIT: 'fit', CENTER_BOTH: 'center' },
    AUTO: 'auto',
    Input: {
      Keyboard: {
        KeyCodes,
        JustDown: vi.fn(() => false)
      }
    },
    Math: {
      Between: vi.fn((min) => min),
      Distance: { Between: vi.fn(() => 100) },
      Angle: { Between: vi.fn(() => 0) }
    }
  };
  return {
    default: phaserMock,
    ...phaserMock
  };
});

// Limpia el DOM después de cada test de React
afterEach(() => {
  cleanup();
});
