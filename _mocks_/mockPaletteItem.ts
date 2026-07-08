import { EventEmitter } from "../src/utils/EventEmitter";
import { AliasMode, Direction } from '../src/settings';
import { PaletteItem, PaletteItemSettings } from "../src/components/PaletteItem";

const DEFAULT_SETTINGS: PaletteItemSettings = {
  aliasMode: AliasMode.Both,
  stabilityWhileEditing: false,
  height: 30,
  direction: Direction.Row,
  hover: true,
  hideText: false,
  alias: 'Test Alias',
  editMode: false,
  colorCount: 5,
};

const createMockEmitter = (): EventEmitter<any> => {
  return {
    on: jest.fn(),
    emit: jest.fn(),
    clear: jest.fn(),
  } as unknown as EventEmitter<any>;
};

export const createMockPaletteItem = (
  overrides?: Partial<PaletteItem>
): PaletteItem => {
  const baseMock: PaletteItem = {
    container: document.createElement('div'),
    color: '#000000',
    settings: DEFAULT_SETTINGS,
    emitter: createMockEmitter(),
    load: jest.fn(),
    unload: jest.fn(),
  } as unknown as PaletteItem;

  return {
    ...baseMock,
    ...overrides,
  } as PaletteItem;
};
