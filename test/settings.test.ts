import { jest } from '@jest/globals';
import { App, Notice, Setting } from 'obsidian';
import {
  DropdownComponent,
  TextComponent,
  ToggleComponent,
} from '_mocks_/index';
import {
  AliasMode,
  ColorPaletteSettings,
  CopyFormat,
  defaultSettings,
  Direction,
  SettingsTab,
} from 'src/settings';

jest.mock('obsidian', () => {
  const actual = jest.requireActual('obsidian') as typeof import('obsidian');
  return {
    ...actual,
    Notice: jest.fn(),
  };
});

type MockPlugin = {
  settings: ColorPaletteSettings;
  saveSettings: jest.Mock<() => Promise<void>>;
  palettes: Array<{ update: jest.Mock }> | undefined;
};

function createMockPlugin(overrides: Partial<MockPlugin> = {}): MockPlugin {
  return {
    settings: { ...defaultSettings },
    saveSettings: jest.fn(() => Promise.resolve()),
    palettes: [],
    ...overrides,
  };
}

function createSettingsTab(plugin = createMockPlugin()) {
  const tab = new SettingsTab(new App(), plugin as never);
  return { tab, plugin };
}

type CapturedControls = {
  dropdowns: DropdownComponent[];
  toggles: ToggleComponent[];
  texts: TextComponent[];
};

function captureControls(): CapturedControls {
  const dropdowns: DropdownComponent[] = [];
  const toggles: ToggleComponent[] = [];
  const texts: TextComponent[] = [];

  jest.spyOn(Setting.prototype, 'addDropdown').mockImplementation(function (callback) {
    const component = new DropdownComponent();
    callback(component as never);
    dropdowns.push(component);
    return this;
  });

  jest.spyOn(Setting.prototype, 'addToggle').mockImplementation(function (callback) {
    const component = new ToggleComponent();
    callback(component as never);
    toggles.push(component);
    return this;
  });

  jest.spyOn(Setting.prototype, 'addText').mockImplementation(function (callback) {
    const component = new TextComponent(document.createElement('div'));
    callback(component as never);
    texts.push(component);
    return this;
  });

  return { dropdowns, toggles, texts };
}

function getHeaderTexts(tab: SettingsTab) {
  return Array.from(tab.containerEl.querySelectorAll('h2')).map((header) => header.textContent);
}

function getInputValues(tab: SettingsTab) {
  return Array.from(tab.containerEl.querySelectorAll('input')).map((input) => input.value);
}

describe('defaultSettings', () => {
  it('contains all ColorPaletteSettings keys', () => {
    const expectedKeys: (keyof ColorPaletteSettings)[] = [
      'noticeDuration',
      'errorPulse',
      'aliasMode',
      'corners',
      'stabilityWhileEditing',
      'reloadDelay',
      'copyFormat',
      'height',
      'width',
      'direction',
      'gradient',
      'hover',
      'hideText',
      'override',
      'propertyKeyAlias',
      'propertyKeyColor',
    ];

    expect(Object.keys(defaultSettings).sort()).toEqual(expectedKeys.sort());
  });

  it('has expected representative default values', () => {
    expect(defaultSettings.noticeDuration).toBe(10000);
    expect(defaultSettings.reloadDelay).toBe(5);
    expect(defaultSettings.direction).toBe(Direction.Column);
    expect(defaultSettings.propertyKeyAlias).toBe('Name');
    expect(defaultSettings.propertyKeyColor).toBe('Color');
  });
});

describe('SettingsTab.isReservedProperty', () => {
  let tab: SettingsTab;

  beforeEach(() => {
    ({ tab } = createSettingsTab());
  });

  it.each([
    'tags',
    'aliases',
    'cssclasses',
    'publish',
    'permalink',
    'description',
    'image',
    'cover',
    'tag',
    'alias',
    'cssclass',
  ])('returns true for reserved property %s', (property) => {
    expect(tab.isReservedProperty(property)).toBe(true);
  });

  it.each(['Name', 'Color', 'MyLabel', ''])('returns false for non-reserved property %s', (property) => {
    expect(tab.isReservedProperty(property)).toBe(false);
  });
});

describe('SettingsTab.display', () => {
  let tab: SettingsTab;
  let plugin: MockPlugin;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ tab, plugin } = createSettingsTab());
  });

  describe('structure', () => {
    it('adds color-palette-settings class and section headers', () => {
      tab.display();

      expect(tab.containerEl.classList.contains('color-palette-settings')).toBe(true);
      expect(getHeaderTexts(tab)).toEqual(['General', 'Defaults', 'Other']);
    });

    it('empties container on re-display', () => {
      tab.display();
      const firstChildCount = tab.containerEl.childElementCount;

      tab.display();

      expect(tab.containerEl.childElementCount).toBe(firstChildCount);
    });

    it('renders text inputs with current settings values', () => {
      tab.display();

      expect(getInputValues(tab)).toEqual(
        expect.arrayContaining([
          defaultSettings.reloadDelay.toString(),
          defaultSettings.height.toString(),
          defaultSettings.width.toString(),
          (defaultSettings.noticeDuration / 1000).toString(),
          defaultSettings.propertyKeyAlias,
          defaultSettings.propertyKeyColor,
        ])
      );
    });

    it('renders donate buttons with sponsor images', () => {
      tab.display();

      const donateButtons = tab.containerEl.querySelectorAll('.color-palette-donate');
      const donateImages = tab.containerEl.querySelectorAll('.color-palette-donate img');

      expect(donateButtons).toHaveLength(2);
      expect(donateImages).toHaveLength(2);
    });
  });

  describe('onChange saves valid values', () => {
    it('saves reload delay', async () => {
      const { texts } = captureControls();
      tab.display();

      texts[0].triggerChange('250');
      await Promise.resolve();

      expect(plugin.settings.reloadDelay).toBe(250);
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it('saves height and width', async () => {
      const { texts } = captureControls();
      tab.display();

      texts[1].triggerChange('200');
      texts[2].triggerChange('800');
      await Promise.resolve();

      expect(plugin.settings.height).toBe(200);
      expect(plugin.settings.width).toBe(800);
      expect(plugin.saveSettings).toHaveBeenCalledTimes(2);
    });

    it('saves notice duration in milliseconds', async () => {
      const { texts } = captureControls();
      tab.display();

      texts[3].triggerChange('15');
      await Promise.resolve();

      expect(plugin.settings.noticeDuration).toBe(15000);
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it('saves property key aliases', async () => {
      const { texts } = captureControls();
      tab.display();

      texts[4].triggerChange('Label');
      texts[5].triggerChange('Hex');
      await Promise.resolve();

      expect(plugin.settings.propertyKeyAlias).toBe('Label');
      expect(plugin.settings.propertyKeyColor).toBe('Hex');
      expect(plugin.saveSettings).toHaveBeenCalledTimes(2);
    });

    it('saves toggle settings', async () => {
      const { toggles } = captureControls();
      tab.display();

      toggles[0].triggerChange(false);
      toggles[1].triggerChange(false);
      toggles[2].triggerChange(true);
      toggles[3].triggerChange(false);
      toggles[4].triggerChange(true);
      toggles[5].triggerChange(true);
      toggles[6].triggerChange(false);
      await Promise.resolve();

      expect(plugin.settings.corners).toBe(false);
      expect(plugin.settings.stabilityWhileEditing).toBe(false);
      expect(plugin.settings.gradient).toBe(true);
      expect(plugin.settings.hover).toBe(false);
      expect(plugin.settings.hideText).toBe(true);
      expect(plugin.settings.override).toBe(true);
      expect(plugin.settings.errorPulse).toBe(false);
      expect(plugin.saveSettings).toHaveBeenCalledTimes(7);
    });

    it('saves dropdown settings', async () => {
      const { dropdowns } = captureControls();
      tab.display();

      dropdowns[0].triggerChange(AliasMode.Alias);
      dropdowns[1].triggerChange(CopyFormat.Value);
      dropdowns[2].triggerChange(Direction.Row);
      await Promise.resolve();

      expect(plugin.settings.aliasMode).toBe(AliasMode.Alias);
      expect(plugin.settings.copyFormat).toBe(CopyFormat.Value);
      expect(plugin.settings.direction).toBe(Direction.Row);
      expect(plugin.saveSettings).toHaveBeenCalledTimes(3);
    });
  });

  describe('validation and error paths', () => {
    it('shows Notice and does not save invalid reload delay', async () => {
      const { texts } = captureControls();
      tab.display();
      const originalReloadDelay = plugin.settings.reloadDelay;

      texts[0].triggerChange('abc');
      await Promise.resolve();

      expect(Notice).toHaveBeenCalled();
      expect(plugin.settings.reloadDelay).toBe(originalReloadDelay);
      expect(plugin.saveSettings).not.toHaveBeenCalled();
    });

    it('shows Notice and does not save invalid height, width, or notice duration', async () => {
      const { texts } = captureControls();
      tab.display();
      const originalHeight = plugin.settings.height;
      const originalWidth = plugin.settings.width;
      const originalNoticeDuration = plugin.settings.noticeDuration;

      texts[1].triggerChange('not-a-number');
      texts[2].triggerChange('bad');
      texts[3].triggerChange('xyz');
      await Promise.resolve();

      expect(Notice).toHaveBeenCalledTimes(3);
      expect(plugin.settings.height).toBe(originalHeight);
      expect(plugin.settings.width).toBe(originalWidth);
      expect(plugin.settings.noticeDuration).toBe(originalNoticeDuration);
      expect(plugin.saveSettings).not.toHaveBeenCalled();
    });

    it('shows Notice and does not save reserved property keys', async () => {
      const { texts } = captureControls();
      tab.display();
      const originalAlias = plugin.settings.propertyKeyAlias;
      const originalColor = plugin.settings.propertyKeyColor;

      texts[4].triggerChange('tags');
      texts[5].triggerChange('alias');
      await Promise.resolve();

      expect(Notice).toHaveBeenCalledTimes(2);
      expect(plugin.settings.propertyKeyAlias).toBe(originalAlias);
      expect(plugin.settings.propertyKeyColor).toBe(originalColor);
      expect(plugin.saveSettings).not.toHaveBeenCalled();
    });
  });
});

describe('SettingsTab.hide', () => {
  let tab: SettingsTab;
  let plugin: MockPlugin;
  let paletteOne: { update: jest.Mock };
  let paletteTwo: { update: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    paletteOne = { update: jest.fn() };
    paletteTwo = { update: jest.fn() };
    plugin = createMockPlugin({ palettes: [paletteOne, paletteTwo] });
    ({ tab, plugin } = createSettingsTab(plugin));
  });

  it('does not update palettes when nothing changed', () => {
    tab.display();
    tab.hide();

    expect(paletteOne.update).not.toHaveBeenCalled();
    expect(paletteTwo.update).not.toHaveBeenCalled();
  });

  it('updates all palettes when a palette-relevant setting changes', () => {
    tab.display();
    plugin.settings.height = 999;
    tab.hide();

    expect(paletteOne.update).toHaveBeenCalledTimes(1);
    expect(paletteTwo.update).toHaveBeenCalledTimes(1);
  });

  it('updates palettes when only reload delay changes', () => {
    tab.display();
    plugin.settings.reloadDelay = 100;
    tab.hide();

    expect(paletteOne.update).toHaveBeenCalledTimes(1);
    expect(paletteTwo.update).toHaveBeenCalledTimes(1);
  });

  it.each([
  ['aliasMode', AliasMode.Alias],
  ['errorPulse', false],
  ['noticeDuration', 5000],
  ['copyFormat', CopyFormat.Value],
  ['propertyKeyAlias', 'Custom'],
] as const)('does not update palettes when only %s changes', (key, value) => {
    tab.display();
    plugin.settings[key] = value as never;
    tab.hide();

    expect(paletteOne.update).not.toHaveBeenCalled();
    expect(paletteTwo.update).not.toHaveBeenCalled();
  });

  it('updates each palette when width changes', () => {
    tab.display();
    plugin.settings.width = 500;
    tab.hide();

    expect(paletteOne.update).toHaveBeenCalledTimes(1);
    expect(paletteTwo.update).toHaveBeenCalledTimes(1);
  });

  it('does not throw when palettes is empty', () => {
    plugin.palettes = [];
    tab.display();
    plugin.settings.height = 999;

    expect(() => tab.hide()).not.toThrow();
  });

  it('does not throw when palettes is undefined', () => {
    plugin.palettes = undefined;
    tab.display();
    plugin.settings.height = 999;

    expect(() => tab.hide()).not.toThrow();
  });
});
