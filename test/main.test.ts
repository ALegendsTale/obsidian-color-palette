import { jest } from '@jest/globals';
import { App, Notice } from 'obsidian';
import { createMockEditor } from '_mocks_/utils/mockEditor';
import { createMockMarkdownPostProcessorContext } from '_mocks_/mockMarkdownPostProcessorContext';
import { defaultSettings } from 'src/settings';
import { createPaletteBlock } from 'src/utils/basicUtils';
import * as basicUtils from 'src/utils/basicUtils';

jest.mock('obsidian', () => {
  const actual = jest.requireActual('obsidian') as typeof import('obsidian');
  return {
    ...actual,
    Notice: jest.fn(),
  };
});

jest.mock('src/components/EditorModal', () => ({
  EditorModal: jest.fn().mockImplementation(function (
    _app: unknown,
    _settings: unknown,
    onSubmit: (colors: string[], settings?: unknown) => void
  ) {
    return { open: jest.fn(), onSubmit };
  }),
}));

jest.mock('src/components/GenerateModal', () => ({
  GenerateModal: jest.fn().mockImplementation(function () {
    return { open: jest.fn() };
  }),
}));

jest.mock('src/components/PaletteMRC', () => ({
  PaletteMRC: jest.fn(),
}));

jest.mock('src/settings', () => {
  const actual = jest.requireActual('src/settings') as typeof import('src/settings');
  return {
    ...actual,
    SettingsTab: jest.fn(),
  };
});

import ColorPalette, { urlRegex } from 'src/main';
import { EditorModal } from 'src/components/EditorModal';
import { GenerateModal } from 'src/components/GenerateModal';
import { PaletteMRC } from 'src/components/PaletteMRC';
import { SettingsTab } from 'src/settings';

const COLORHUNT_URL = 'https://colorhunt.co/palette/ff5733-33ff57-c70039';
const COOLORS_URL = 'https://coolors.co/ff573333ff57c70039';
const COOLORS_PALETTE_URL = 'https://coolors.co/palette/ff0000-00ff00';

function matchesUrlRegex(value: string): boolean {
  return Boolean(value.match(`^${urlRegex.source}$`));
}

function createPlugin() {
  const app = new App();
  const plugin = new ColorPalette(app, {
    id: 'color-palette',
    name: 'Color Palette',
    version: '0.0.0',
    minAppVersion: '0.0.0',
    author: 'test',
    description: 'test',
  });
  plugin.app = app;
  return plugin;
}

type CapturedOnload = {
  processor: (
    source: string,
    el: HTMLElement,
    ctx: ReturnType<typeof createMockMarkdownPostProcessorContext>
  ) => Promise<void>;
  commands: Record<string, { id: string; name: string; editorCallback: (editor: unknown) => void | Promise<void> }>;
};

async function captureOnload(plugin = createPlugin()): Promise<{ plugin: ColorPalette } & CapturedOnload> {
  jest.spyOn(plugin, 'loadData').mockResolvedValue({});

  const registerSpy = jest.spyOn(plugin, 'registerMarkdownCodeBlockProcessor');
  const addCommandSpy = jest.spyOn(plugin, 'addCommand');

  await plugin.onload();

  const processorCall = registerSpy.mock.calls.find(([language]) => language === 'palette');
  const processor = processorCall?.[1] as CapturedOnload['processor'];

  const commands = Object.fromEntries(
    addCommandSpy.mock.calls.map(([command]) => [command.id, command])
  ) as CapturedOnload['commands'];

  return { plugin, processor, commands };
}

function getEditorModalSubmitCallback(): (colors: string[], settings?: unknown) => void {
  const calls = jest.mocked(EditorModal).mock.calls;
  const lastCall = calls[calls.length - 1];
  return lastCall[2] as (colors: string[], settings?: unknown) => void;
}

describe('urlRegex', () => {
  it.each([COLORHUNT_URL, COOLORS_URL, COOLORS_PALETTE_URL])('matches full URL %s', (url) => {
    expect(matchesUrlRegex(url)).toBe(true);
  });

  it.each([
    'https://example.com/',
    '#ff0000',
    'not-a-url',
    'https://colorhunt.co/palette/',
    COLORHUNT_URL + ' extra',
  ])('does not match invalid or partial string %s', (value) => {
    expect(matchesUrlRegex(value)).toBe(false);
  });
});

describe('ColorPalette.loadSettings', () => {
  it('merges defaultSettings with loadData result', async () => {
    const plugin = createPlugin();
    jest.spyOn(plugin, 'loadData').mockResolvedValue({ height: 200 });

    await plugin.loadSettings();

    expect(plugin.settings.height).toBe(200);
    expect(plugin.settings.width).toBe(defaultSettings.width);
    expect(plugin.settings.direction).toBe(defaultSettings.direction);
  });
});

describe('ColorPalette.saveSettings', () => {
  it('calls saveData with current settings', async () => {
    const plugin = createPlugin();
    plugin.settings = { ...defaultSettings, height: 150 };
    const saveDataSpy = jest.spyOn(plugin, 'saveData').mockResolvedValue(undefined);

    await plugin.saveSettings();

    expect(saveDataSpy).toHaveBeenCalledWith(plugin.settings);
  });
});

describe('ColorPalette.onload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes palettes and registers plugin features', async () => {
    const { plugin, processor, commands } = await captureOnload();

    expect(plugin.palettes).toEqual([]);
    expect(processor).toBeDefined();
    expect(Object.keys(commands)).toEqual([
      'create',
      'convert-link',
      'convert-codeblock-link-to-hex',
      'generate-random-palette',
    ]);
    expect(jest.mocked(SettingsTab)).toHaveBeenCalledWith(plugin.app, plugin);
  });
});

describe('palette markdown processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trims source, creates PaletteMRC, and adds it as a child', async () => {
    const { plugin, processor } = await captureOnload();
    const el = document.createElement('div');
    const ctx = createMockMarkdownPostProcessorContext();
    const source = '  #ff0000\n#00ff00  ';

    await processor(source, el, ctx);

    expect(PaletteMRC).toHaveBeenCalledWith(plugin, el, '#ff0000\n#00ff00', ctx);
    expect(ctx.addChild).toHaveBeenCalledWith(expect.any(Object));
  });
});

describe('command: create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens EditorModal with app and settings', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();

    commands.create.editorCallback(editor);

    expect(EditorModal).toHaveBeenCalledWith(expect.any(App), defaultSettings, expect.any(Function));
    const modalInstance = jest.mocked(EditorModal).mock.results[0].value as { open: jest.Mock };
    expect(modalInstance.open).toHaveBeenCalled();
  });

  it('inserts palette block and shows success notice on submit', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.cursor = { line: 0, ch: 0 };
    const transactionSpy = jest.spyOn(editor, 'transaction');
    const setCursorSpy = jest.spyOn(editor, 'setCursor');

    commands.create.editorCallback(editor);
    const onSubmit = getEditorModalSubmitCallback();
    const block = '```palette\n#ff0000\n#00ff00\n```\n';
    jest.spyOn(basicUtils, 'createPaletteBlock').mockReturnValue(block);

    onSubmit(['#ff0000', '#00ff00'], undefined);

    expect(transactionSpy).toHaveBeenCalledWith({
      changes: [{ from: { line: 0, ch: 0 }, text: block }],
    });
    expect(setCursorSpy).toHaveBeenCalledWith({
      line: block.split('\n').length,
      ch: 0,
    });
    expect(Notice).toHaveBeenCalledWith(`Added ${block}`);
  });

  it('shows error notice when submit callback throws', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();

    commands.create.editorCallback(editor);
    const onSubmit = getEditorModalSubmitCallback();
    jest.spyOn(basicUtils, 'createPaletteBlock').mockImplementation(() => {
      throw new Error('create failed');
    });

    onSubmit(['#ff0000'], undefined);

    expect(Notice).toHaveBeenCalledWith('create failed');
  });
});

describe('command: convert-link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('prefers selection over clipboard when both are valid URLs', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.selection = COLORHUNT_URL;
    editor.cursor = { line: 0, ch: 0 };
    jest.spyOn(navigator.clipboard, 'readText').mockResolvedValue(COOLORS_URL);
    const replaceSelectionSpy = jest.spyOn(editor, 'replaceSelection');
    const setCursorSpy = jest.spyOn(editor, 'setCursor');
    const expectedBlock = createPaletteBlock(COLORHUNT_URL);

    await commands['convert-link'].editorCallback(editor);

    expect(replaceSelectionSpy).toHaveBeenCalledWith(expectedBlock);
    expect(setCursorSpy).toHaveBeenCalledWith({
      line: expectedBlock.split('\n').length,
      ch: 0,
    });
    expect(Notice).toHaveBeenCalledWith(`Converted ${COLORHUNT_URL}`);
  });

  it('falls back to clipboard when selection is invalid', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.selection = '';
    editor.cursor = { line: 0, ch: 0 };
    jest.spyOn(navigator.clipboard, 'readText').mockResolvedValue(COLORHUNT_URL);
    const replaceSelectionSpy = jest.spyOn(editor, 'replaceSelection');
    const expectedBlock = createPaletteBlock(COLORHUNT_URL);

    await commands['convert-link'].editorCallback(editor);

    expect(replaceSelectionSpy).toHaveBeenCalledWith(expectedBlock);
    expect(Notice).toHaveBeenCalledWith(`Converted ${COLORHUNT_URL}`);
  });

  it('shows error notice when selection and clipboard are invalid', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.selection = 'invalid';
    jest.spyOn(navigator.clipboard, 'readText').mockResolvedValue('also-invalid');

    await commands['convert-link'].editorCallback(editor);

    expect(Notice).toHaveBeenCalledWith(
      'Failed to convert link. Please select or copy a link, then try again.'
    );
  });

  it('shows error notice when clipboard read fails', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.selection = '';
    jest.spyOn(navigator.clipboard, 'readText').mockRejectedValue(new Error('clipboard denied'));

    await commands['convert-link'].editorCallback(editor);

    expect(Notice).toHaveBeenCalledWith('clipboard denied');
  });
});

describe('command: convert-codeblock-link-to-hex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('converts coolors link with dashes to hex colors', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    const selection = `\`\`\`palette\n${COOLORS_PALETTE_URL}\n\`\`\``;
    editor.selection = selection;
    const replaceSelectionSpy = jest.spyOn(editor, 'replaceSelection');

    commands['convert-codeblock-link-to-hex'].editorCallback(editor);

    expect(replaceSelectionSpy).toHaveBeenCalledWith(
      createPaletteBlock({ colors: ['#ff0000', '#00ff00'] })
    );
    expect(Notice).toHaveBeenCalledWith('Converted codeblock link to hex');
  });

  it('converts colorhunt link to 6-character hex chunks', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    const url = 'https://colorhunt.co/palette/aabbcc';
    editor.selection = `\`\`\`palette\n${url}\n\`\`\``;
    const replaceSelectionSpy = jest.spyOn(editor, 'replaceSelection');

    commands['convert-codeblock-link-to-hex'].editorCallback(editor);

    expect(replaceSelectionSpy).toHaveBeenCalledWith(
      createPaletteBlock({ colors: ['#aabbcc'] })
    );
    expect(Notice).toHaveBeenCalledWith('Converted codeblock link to hex');
  });

  it('shows error when selection is not a palette code block', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.selection = 'plain text';

    commands['convert-codeblock-link-to-hex'].editorCallback(editor);

    expect(Notice).toHaveBeenCalledWith('Selected text is not a codeblock with a link.');
  });

  it('shows error when URL inside code block is not convertible', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.selection = '```palette\nhttps://example.com/\n```';

    commands['convert-codeblock-link-to-hex'].editorCallback(editor);

    expect(Notice).toHaveBeenCalledWith('Selected codeblock can not be converted to hex.');
  });

  it('converts code block with settings JSON', async () => {
    const { commands } = await captureOnload();
    const editor = createMockEditor();
    editor.selection = `\`\`\`palette\n${COOLORS_PALETTE_URL}\n{"height":200}\n\`\`\``;
    const replaceSelectionSpy = jest.spyOn(editor, 'replaceSelection');

    commands['convert-codeblock-link-to-hex'].editorCallback(editor);

    expect(replaceSelectionSpy).toHaveBeenCalledWith(
      createPaletteBlock({ colors: ['#ff0000', '#00ff00'], settings: { height: 200 } })
    );
    expect(Notice).toHaveBeenCalledWith('Converted codeblock link to hex');
  });
});

describe('command: generate-random-palette', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens GenerateModal with app, editor, and settings', async () => {
    const { plugin, commands } = await captureOnload();
    const editor = createMockEditor();

    commands['generate-random-palette'].editorCallback(editor);

    expect(GenerateModal).toHaveBeenCalledWith(plugin.app, editor, plugin.settings);
    const modalInstance = jest.mocked(GenerateModal).mock.results[0].value as { open: jest.Mock };
    expect(modalInstance.open).toHaveBeenCalled();
  });
});
