import { App, Modal, Setting } from "obsidian";

export class CommandInput extends Modal {
    result: string;
    onSubmit: (result: string) => void

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen(): void {
        const { contentEl } = this;
        
        contentEl.createEl('h1', { text: 'Insert URL' })

        new Setting(contentEl)
        .setName("Url")
        .addText((text) => {
            text.onChange((value) => {
                this.result = value;
            })
        })

        new Setting(contentEl)
        .addButton((btn) => 
            btn
            .setButtonText("enter")
            .setCta()
            .onClick(() => {
                this.close();
                this.onSubmit(this.result);
            })
        )
    }

    onClose(): void {
        let { contentEl } = this;
        contentEl.empty();
    }
}