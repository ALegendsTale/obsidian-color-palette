import { jest } from '@jest/globals';
import colorsea from 'colorsea';
import { PaletteSettings } from 'src/components/Palette';
import { defaultSettings, Direction } from 'src/settings';
import { Combination, generateColors } from 'src/utils/generateUtils';

function createSettings(): PaletteSettings {
  return {
    height: defaultSettings.height,
    width: defaultSettings.width,
    direction: Direction.Column,
    gradient: false,
    hover: false,
    hideText: false,
    override: false,
    aliases: [],
  };
}

const baseColor = colorsea('#336699');
const hexPattern = /^#[0-9a-f]{6}$/i;

describe('generateColors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when generating deterministic combinations', () => {
    const combinationCases = [
      {
        combination: Combination.Complimentary,
        colorCount: 2,
        aliases: ['Base', 'Complimentary Color'],
      },
      {
        combination: Combination.Monochromatic,
        colorCount: 5,
        aliases: ['Lightest', 'Lighter', 'Base', 'Darker', 'Darkest'],
      },
      {
        combination: Combination.Analogous,
        colorCount: 3,
        aliases: ['Analogous East', 'Base', 'Analogous West'],
      },
      {
        combination: Combination.Triadic,
        colorCount: 3,
        aliases: ['Triadic First', 'Base', 'Triadic Third'],
      },
      {
        combination: Combination.Tetradic,
        colorCount: 4,
        aliases: ['Base', 'Tetradic Second', 'Tetradic Third', 'Tetradic Fourth'],
      },
    ];

    test.each(combinationCases)(
      'generates $combination with $colorCount colors',
      ({ combination, colorCount, aliases }) => {
        const settings = createSettings();
        const result = generateColors(combination, { baseColor, settings });

        expect(result.colors).toHaveLength(colorCount);
        expect(result.settings?.aliases).toEqual(aliases);
        result.colors.forEach((color) => expect(color).toMatch(hexPattern));
      }
    );
  });

  describe('when generating Random combinations', () => {
    it('returns between 2 and 10 colors', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = generateColors(Combination.Random, { settings: createSettings() });

      expect(result.colors.length).toBeGreaterThanOrEqual(2);
      expect(result.colors.length).toBeLessThanOrEqual(10);
      expect(result.settings?.aliases).toEqual([]);
    });

    it('uses Math.random to determine color count', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      const result = generateColors(Combination.Random);

      expect(result.colors).toHaveLength(2);
    });
  });

  describe('return shape', () => {
    it('returns colors and settings object', () => {
      const settings = createSettings();
      const result = generateColors(Combination.Complimentary, { baseColor, settings });

      expect(result).toEqual(
        expect.objectContaining({
          colors: expect.any(Array),
          settings,
        })
      );
    });
  });
});
