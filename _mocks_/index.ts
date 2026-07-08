/**
 * Complete Obsidian API Mock for Jest
 * https://devinhedge.com/2024/08/27/creating-modular-mocks-for-the-obsidian-api-in-jest/
 * https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+add+automated+tests+to+your+plugin
 */

export class App {
  vault = new Vault();
  workspace = new Workspace();
  metadataCache = new MetadataCache();
}

export class Vault { }

export class Workspace {
  getActiveViewOfType(type: any) {
    return null;
  }
}

export class MetadataCache {
  getFirstLinkpathDest(linkpath: string, sourcePath: string) {
    return null;
  }

  getFileCache(file: any) {
    return null;
  }
}

export class Plugin {
  app!: App;
  manifest: any = {};

  registerMarkdownCodeBlockProcessor(language: string, processor: any) { }
  addCommand(command: any) { }
  addSettingTab(tab: any) { }
  loadSettings() { }
  loadData() {
    return Promise.resolve({});
  }
  saveData(data: any) {
    return Promise.resolve();
  }
}

export class MarkdownRenderChild {
  containerEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
  }
}

export class Modal {
  app: App;
  contentEl: HTMLElement;
  containerEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
    this.containerEl = document.createElement('div');
  }

  open() {
    this.onOpen();
  }

  close() {
    this.onClose();
  }

  onOpen() { }

  onClose() { }
}

export class SuggestModal<T> extends Modal {
  inputEl: HTMLInputElement;
  suggestions: T[] = [];

  constructor(app: App) {
    super(app);
    this.inputEl = document.createElement('input');
  }

  getSuggestions(query: string): T[] {
    return [];
  }

  renderSuggestion(item: T, el: HTMLElement) { }

  onChooseSuggestion(item: T, evt: MouseEvent | KeyboardEvent) { }
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display() { }
}

export class Setting {
  settingEl: HTMLDivElement;
  controlEl: HTMLDivElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    this.controlEl = document.createElement('div');
    this.settingEl.appendChild(this.controlEl);
    containerEl.appendChild(this.settingEl);
  }

  setName(_name: string) {
    return this;
  }

  setDesc(_desc: string | DocumentFragment) {
    return this;
  }

  setClass(cls: string) {
    this.settingEl.className = cls;
    return this;
  }

  addText(callback: (text: TextComponent) => void) {
    callback(new TextComponent(this.controlEl));
    return this;
  }

  addToggle(callback: (toggle: ToggleComponent) => void) {
    callback(new ToggleComponent());
    return this;
  }

  addDropdown(callback: (dropdown: DropdownComponent) => void) {
    callback(new DropdownComponent());
    return this;
  }

  addButton(callback: (button: ButtonComponent) => void) {
    callback(new ButtonComponent(this.controlEl));
    return this;
  }
}

export class TextComponent {
  inputEl: HTMLInputElement;
  private changeHandler?: (value: string) => void;

  constructor(container: HTMLElement) {
    this.inputEl = document.createElement('input');
    container.appendChild(this.inputEl);
  }

  setPlaceholder(_placeholder: string) {
    return this;
  }

  onChange(fn: (value: string) => void) {
    this.changeHandler = fn;
    return this;
  }

  setValue(value: string) {
    this.inputEl.value = value;
    return this;
  }

  getValue() {
    return this.inputEl.value;
  }

  triggerChange(value: string) {
    this.inputEl.value = value;
    this.changeHandler?.(value);
  }
}

export class ColorComponent {
  constructor(_container: HTMLElement) { }

  onChange(_fn: (value: string) => void) {
    return this;
  }

  setValue(_value: string) {
    return this;
  }

  setDisabled(_disabled: boolean) {
    return this;
  }
}

export class DropdownComponent {
  private changeHandler?: (value: string) => void;
  private value = '';

  onChange(fn: (value: string) => void) {
    this.changeHandler = fn;
    return this;
  }

  setValue(value: string) {
    this.value = value;
    return this;
  }

  addOption(_key: string, _value: string) {
    return this;
  }

  triggerChange(value: string) {
    this.value = value;
    this.changeHandler?.(value);
  }
}

export class SliderComponent {
  private value = 8;

  constructor(_container: HTMLElement) { }

  setLimits(_min: number, _max: number, _step: number) {
    return this;
  }

  setDynamicTooltip() {
    return this;
  }

  setValue(value: number) {
    this.value = value;
    return this;
  }

  onChange(_fn: (value: number) => void) {
    return this;
  }

  getValue() {
    return this.value;
  }
}

export class ToggleComponent {
  private changeHandler?: (value: boolean) => void;
  private value = false;

  onChange(fn: (value: boolean) => void) {
    this.changeHandler = fn;
    return this;
  }

  setValue(value: boolean) {
    this.value = value;
    return this;
  }

  triggerChange(value: boolean) {
    this.value = value;
    this.changeHandler?.(value);
  }
}

export class Editor {
  getSelection() {
    return '';
  }

  getLine(line: number) {
    return '';
  }

  getCursor(side?: string) {
    return { line: 0, ch: 0 };
  }

  setCursor(cursor: any) { }

  getRange(from: any, to: any) {
    return '';
  }

  replaceRange(replacement: string, from: any, to: any) { }

  replaceSelection(replacement: string) { }

  somethingSelected() {
    return false;
  }

  transaction(options: any) { }
}

export class MarkdownView {
  editor?: Editor;
}

export class Notice {
  constructor(message: string, duration?: number) {
    console.log(`Notice: ${message}`);
  }
}

export class ButtonComponent {
  buttonEl: HTMLButtonElement;

  constructor(container: HTMLElement) {
    this.buttonEl = document.createElement('button');
    container.appendChild(this.buttonEl);
  }

  setIcon(_icon: string) {
    return this;
  }

  setTooltip(_tooltip: string) {
    return this;
  }

  setButtonText(text: string) {
    this.buttonEl.textContent = text;
    return this;
  }

  setCta() {
    return this;
  }

  removeCta() {
    return this;
  }

  setClass(cls: string) {
    this.buttonEl.classList.add(cls);
    return this;
  }

  onClick(fn: (e: MouseEvent) => void) {
    this.buttonEl.addEventListener('click', fn);
    return this;
  }
}

export class MenuItem {
  title = '';
  icon = '';
  checked = false;
  clickHandler?: () => void | Promise<void>;

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  setIcon(icon: string) {
    this.icon = icon;
    return this;
  }

  setChecked(checked: boolean) {
    this.checked = checked;
    return this;
  }

  onClick(fn: () => void | Promise<void>) {
    this.clickHandler = fn;
    return this;
  }
}

export class Menu {
  items: (MenuItem | { separator: true })[] = [];

  addItem(callback: (item: MenuItem) => void) {
    const item = new MenuItem();
    callback(item);
    this.items.push(item);
    return this;
  }

  addSeparator() {
    this.items.push({ separator: true });
    return this;
  }

  showAtMouseEvent(_e: MouseEvent) {}
}

export function createEl(
  tag: string,
  o?: { text?: string; cls?: string; attr?: Record<string, string> }
) {
  const el = document.createElement(tag);
  if (o?.text) el.textContent = o.text;
  if (o?.cls) el.className = o.cls;
  if (o?.attr) {
    Object.entries(o.attr).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  return el;
}

export function createDiv() {
  return createEl('div');
}

export interface FrontMatterCache {
  [key: string]: any;
}

export interface MarkdownPostProcessorContext {
  sourcePath: string;
  getSectionInfo(el: HTMLElement): any;
  addChild(child: any): void;
}