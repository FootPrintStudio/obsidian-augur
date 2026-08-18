import { App, Modal, TAbstractFile, TFile, TFolder } from "obsidian";
import { AUGUR_PATH_MIME, MEDIA_EXTENSIONS } from "../types";

export type PathBrowserMode = "file" | "folder";

export interface PathPickResult {
	path: string;
	isFolder: boolean;
	recursive: boolean;
}

export interface PathBrowserOptions {
	mode: PathBrowserMode;
	allowModeSwitch?: boolean;
	onPick: (result: PathPickResult) => void;
}

const SKIP_DIRS = new Set([".git", "node_modules"]);
const IMAGE_LIKE = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function sortEntries(a: TAbstractFile, b: TAbstractFile): number {
	const aFolder = a instanceof TFolder;
	const bFolder = b instanceof TFolder;
	if (aFolder !== bFolder) return aFolder ? -1 : 1;
	return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function childrenOf(folder: TFolder): TAbstractFile[] {
	return folder.children.filter((child) => !(child instanceof TFolder && SKIP_DIRS.has(child.name))).sort(sortEntries);
}

export function formatPickedPath(result: PathPickResult): string {
	if (result.isFolder && result.recursive) {
		const trimmed = result.path.replace(/\/+$/, "");
		return `${trimmed}/`;
	}
	return result.path.replace(/\/+$/, "");
}

export class VaultPathBrowser extends Modal {
	private mode: PathBrowserMode;
	private allowModeSwitch: boolean;
	private onPick: (result: PathPickResult) => void;
	private currentFolder: TFolder;
	private selected: TAbstractFile | null = null;
	private recursive = false;
	private filter = "";
	private treeEl: HTMLElement | null = null;
	private listEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private pathEl: HTMLElement | null = null;

	constructor(app: App, options: PathBrowserOptions) {
		super(app);
		this.mode = options.mode;
		this.allowModeSwitch = options.allowModeSwitch ?? true;
		this.onPick = options.onPick;
		this.currentFolder = app.vault.getRoot();
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		modalEl.addClass("augur-picker-modal-container");
		contentEl.empty();
		contentEl.addClass("augur-picker-modal");

		const header = contentEl.createDiv({ cls: "augur-picker-header" });
		header.createEl("h2", { text: "Vault path browser" });
		header.createEl("p", {
			cls: "augur-picker-header-desc",
			text: "Pick a vault file or folder. Drag items onto the Oculus builder, or insert a vault-relative path. Folders can end with / for a recursive Oculus scan.",
		});

		const toolbar = contentEl.createDiv({ cls: "augur-picker-toolbar" });
		const modeBar = toolbar.createDiv({ cls: "augur-picker-mode" });
		this.renderModeButtons(modeBar);

		const search = toolbar.createEl("input", {
			cls: "augur-picker-search",
			attr: { type: "search", placeholder: "Filter this folder…" },
		});
		search.addEventListener("input", () => {
			this.filter = search.value.trim().toLowerCase();
			this.renderList();
		});

		const recursiveWrap = toolbar.createDiv({ cls: "augur-picker-recursive" });
		const recursive = recursiveWrap.createEl("input", { attr: { type: "checkbox", id: "augur-picker-recursive" } });
		recursive.addEventListener("change", () => {
			this.recursive = recursive.checked;
		});
		recursiveWrap.createEl("label", {
			text: "Recursive folder (/)",
			attr: { for: "augur-picker-recursive" },
		});

		this.pathEl = contentEl.createDiv({ cls: "augur-picker-crumb" });

		const body = contentEl.createDiv({ cls: "augur-picker-body" });
		this.treeEl = body.createDiv({ cls: "augur-picker-tree" });
		this.listEl = body.createDiv({ cls: "augur-picker-list" });
		this.previewEl = body.createDiv({ cls: "augur-picker-preview" });

		const footer = contentEl.createDiv({ cls: "augur-picker-footer" });
		footer
			.createEl("button", { cls: "augur-builder-cancel-btn", text: "Cancel" })
			.addEventListener("click", () => this.close());
		footer
			.createEl("button", { cls: "augur-builder-insert-btn mod-cta", text: "Insert path" })
			.addEventListener("click", () => this.confirm());

		this.renderAll();
	}

	onClose(): void {
		this.contentEl.empty();
		this.modalEl.removeClass("augur-picker-modal-container");
	}

	private renderModeButtons(bar: HTMLElement): void {
		bar.empty();
		if (!this.allowModeSwitch) {
			bar.createSpan({
				cls: "augur-picker-mode-badge",
				text: this.mode === "folder" ? "Folders" : "Files",
			});
			return;
		}
		for (const mode of ["folder", "file"] as const) {
			const btn = bar.createEl("button", {
				cls: `augur-builder-pill${this.mode === mode ? " is-active" : ""}`,
				text: mode === "folder" ? "Folders" : "Files",
			});
			btn.addEventListener("click", () => {
				this.mode = mode;
				this.selected = null;
				this.renderAll();
			});
		}
	}

	private renderAll(): void {
		this.renderCrumbs();
		this.renderTree();
		this.renderList();
		this.renderPreview();
	}

	private renderCrumbs(): void {
		if (!this.pathEl) return;
		this.pathEl.empty();
		const parts = this.currentFolder.path ? this.currentFolder.path.split("/") : [];
		const vault = this.pathEl.createEl("button", { cls: "augur-picker-crumb-btn", text: "Vault" });
		vault.addEventListener("click", () => this.openFolder(this.app.vault.getRoot()));
		let acc = "";
		for (const part of parts) {
			acc = acc ? `${acc}/${part}` : part;
			this.pathEl.createSpan({ text: " / " });
			const file = this.app.vault.getAbstractFileByPath(acc);
			if (!(file instanceof TFolder)) continue;
			const btn = this.pathEl.createEl("button", { cls: "augur-picker-crumb-btn", text: part });
			btn.addEventListener("click", () => this.openFolder(file));
		}
	}

	private renderTree(): void {
		if (!this.treeEl) return;
		this.treeEl.empty();
		this.treeEl.createDiv({ cls: "augur-picker-pane-title", text: "Folders" });
		const list = this.treeEl.createDiv({ cls: "augur-picker-tree-list" });
		this.renderTreeFolder(list, this.app.vault.getRoot(), 0);
	}

	private renderTreeFolder(parent: HTMLElement, folder: TFolder, depth: number): void {
		const row = parent.createDiv({ cls: "augur-picker-tree-row" });
		row.style.paddingLeft = `${0.4 + depth * 0.85}rem`;
		if (folder === this.currentFolder) row.addClass("is-current");
		row.setText(folder.path ? folder.name : "Vault");
		row.addEventListener("click", () => this.openFolder(folder));
		for (const child of childrenOf(folder)) {
			if (child instanceof TFolder) this.renderTreeFolder(parent, child, depth + 1);
		}
	}

	private visibleChildren(): TAbstractFile[] {
		const items = childrenOf(this.currentFolder).filter((child) => {
			if (this.mode === "folder") return child instanceof TFolder;
			return child instanceof TFile || child instanceof TFolder;
		});
		if (!this.filter) return items;
		return items.filter((child) => child.name.toLowerCase().includes(this.filter));
	}

	private renderList(): void {
		if (!this.listEl) return;
		this.listEl.empty();
		this.listEl.createDiv({
			cls: "augur-picker-pane-title",
			text: this.mode === "folder" ? "Folders in this directory" : "Files and folders",
		});
		const wrap = this.listEl.createDiv({ cls: "augur-picker-list-items" });
		if (this.currentFolder.parent) {
			const up = wrap.createDiv({ cls: "augur-picker-item is-folder", text: ".." });
			up.addEventListener("click", () => {
				if (this.currentFolder.parent) this.openFolder(this.currentFolder.parent);
			});
		}
		const items = this.visibleChildren();
		if (items.length === 0) {
			wrap.createDiv({ cls: "augur-picker-empty", text: "Nothing matches in this folder." });
			return;
		}
		for (const item of items) {
			const row = wrap.createDiv({
				cls: `augur-picker-item${item instanceof TFolder ? " is-folder" : " is-file"}`,
			});
			if (item === this.selected) row.addClass("is-selected");
			row.setText(item instanceof TFolder ? `${item.name}/` : item.name);
			row.setAttr("draggable", "true");
			row.addEventListener("dragstart", (event) => {
				event.dataTransfer?.setData(AUGUR_PATH_MIME, JSON.stringify(this.resultFor(item)));
				event.dataTransfer?.setData("text/plain", formatPickedPath(this.resultFor(item)));
			});
			row.addEventListener("click", () => {
				this.selected = item;
				if (item instanceof TFolder && this.mode === "file") {
					this.openFolder(item);
					return;
				}
				this.renderList();
				this.renderPreview();
			});
			row.addEventListener("dblclick", () => {
				if (item instanceof TFolder) this.openFolder(item);
				else this.confirmItem(item);
			});
		}
	}

	private renderPreview(): void {
		if (!this.previewEl) return;
		this.previewEl.empty();
		this.previewEl.createDiv({ cls: "augur-picker-pane-title", text: "Preview" });
		const body = this.previewEl.createDiv({ cls: "augur-picker-preview-body" });
		const item = this.selected;
		if (!item) {
			body.createEl("p", { text: "Select a file or folder." });
			return;
		}
		body.createEl("h4", { text: item.path || item.name });
		if (item instanceof TFolder) {
			const kids = childrenOf(item);
			body.createEl("p", { text: `${kids.length} item${kids.length === 1 ? "" : "s"}` });
			const sample = kids.slice(0, 12);
			for (const child of sample) {
				body.createDiv({ text: child instanceof TFolder ? `${child.name}/` : child.name });
			}
			if (kids.length > sample.length) {
				body.createEl("p", { text: `…and ${kids.length - sample.length} more` });
			}
			return;
		}
		if (!(item instanceof TFile)) return;
		if (MEDIA_EXTENSIONS.has(item.extension.toLowerCase()) && IMAGE_LIKE.has(item.extension.toLowerCase())) {
			const img = body.createEl("img", { cls: "augur-picker-thumb" });
			img.src = this.app.vault.getResourcePath(item);
			return;
		}
		void this.app.vault.cachedRead(item).then((text) => {
			body.createEl("pre", { text: text.slice(0, 1200) });
		});
	}

	private openFolder(folder: TFolder): void {
		this.currentFolder = folder;
		this.selected = folder;
		this.renderAll();
	}

	private resultFor(item: TAbstractFile): PathPickResult {
		const isFolder = item instanceof TFolder;
		return {
			path: item.path,
			isFolder,
			recursive: isFolder && this.recursive,
		};
	}

	private confirmItem(item: TAbstractFile): void {
		if (this.mode === "folder" && !(item instanceof TFolder)) return;
		if (this.mode === "file" && item instanceof TFolder) {
			this.openFolder(item);
			return;
		}
		this.onPick(this.resultFor(item));
		this.close();
	}

	private confirm(): void {
		const item = this.selected;
		if (!item) return;
		if (this.mode === "folder") {
			const folder = item instanceof TFolder ? item : this.currentFolder;
			this.onPick(this.resultFor(folder));
			this.close();
			return;
		}
		if (item instanceof TFile) {
			this.confirmItem(item);
			return;
		}
		if (item instanceof TFolder) this.openFolder(item);
	}
}
