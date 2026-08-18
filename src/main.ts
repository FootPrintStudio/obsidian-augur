import { MarkdownView, Notice, Plugin, type Editor } from "obsidian";
import { GalleryBuilderModal } from "./oculus/builderModal";
import { VaultPathBrowser, formatPickedPath } from "./picker/pathBrowser";
import { AugurSettingTab } from "./settings";
import { AugurEditorSuggest } from "./suggest/editorSuggest";
import { DEFAULT_SETTINGS, type AugurSettings } from "./types";
import { formatVTabsBlock, formatVTabsTemplate } from "./visage/formatTabs";
import { resolveVisageDefaults } from "./companions";

export default class AugurPlugin extends Plugin {
	settings: AugurSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new AugurSettingTab(this.app, this));
		this.registerEditorSuggest(new AugurEditorSuggest(this.app, () => this.settings));

		this.addCommand({
			id: "insert-oculus",
			name: "Insert Oculus gallery",
			icon: "images",
			editorCheckCallback: (checking) => {
				const editor = this.activeEditor();
				if (checking) return Boolean(editor);
				if (!editor) {
					new Notice("Open a note to insert an Oculus gallery block.");
					return false;
				}
				new GalleryBuilderModal(this.app, this.settings, editor).open();
				return true;
			},
		});

		this.addCommand({
			id: "insert-v-tabs",
			name: "Insert Visage tabs",
			icon: "layout",
			editorCheckCallback: (checking) => {
				const editor = this.activeEditor();
				if (checking) return Boolean(editor);
				if (!editor) {
					new Notice("Open a note to insert a Visage tabs block.");
					return false;
				}
				const block = formatVTabsBlock(formatVTabsTemplate(resolveVisageDefaults(this.app, this.settings)));
				const cursor = editor.getCursor();
				editor.replaceRange(`${block}\n`, cursor);
				new Notice("Visage tabs block inserted.");
				return true;
			},
		});

		this.addCommand({
			id: "pick-vault-folder",
			name: "Pick vault folder",
			icon: "folder",
			editorCheckCallback: (checking) => {
				const editor = this.activeEditor();
				if (checking) return Boolean(editor);
				if (!editor) {
					new Notice("Open a note to insert a folder path.");
					return false;
				}
				this.openPicker(editor, "folder");
				return true;
			},
		});

		this.addCommand({
			id: "pick-vault-file",
			name: "Pick vault file",
			icon: "file",
			editorCheckCallback: (checking) => {
				const editor = this.activeEditor();
				if (checking) return Boolean(editor);
				if (!editor) {
					new Notice("Open a note to insert a file path.");
					return false;
				}
				this.openPicker(editor, "file");
				return true;
			},
		});
	}

	private activeEditor(): Editor | null {
		return this.app.workspace.getActiveViewOfType(MarkdownView)?.editor ?? null;
	}

	private openPicker(editor: Editor, mode: "file" | "folder"): void {
		new VaultPathBrowser(this.app, {
			mode,
			allowModeSwitch: true,
			onPick: (picked) => {
				editor.replaceSelection(formatPickedPath(picked));
			},
		}).open();
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<AugurSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
