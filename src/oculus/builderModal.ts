import { App, Modal, Notice, Platform, Setting } from "obsidian";
import type { Editor } from "obsidian";
import { isMediaExtendedAvailable, resolveOculusDefaults } from "../companions";
import { parseMediaTitleQueries } from "./searchQuery";
import { formatMediaGalleryBlock, type FormattedMediaSource } from "./formatBlock";
import { describeUrlMediaEntry } from "./urlHint";
import {
	AUGUR_PATH_MIME,
	MEDIA_FILTERS,
	VIEW_TYPES,
	type AugurSettings,
	type GalleryViewType,
	type MediaFilter,
} from "../types";
import { formatPickedPath, VaultPathBrowser, type PathPickResult } from "../picker/pathBrowser";

interface LocalSource {
	kind: "local";
	path: string;
	caption: string;
}

interface UrlSource {
	kind: "url";
	url: string;
	caption: string;
}

interface SearchSource {
	kind: "search";
	path: string;
	query: string;
	recursive: boolean;
}

type BuilderSource = LocalSource | SearchSource | UrlSource;

const VIEW_LABELS: Record<GalleryViewType, string> = {
	grid: "Grid",
	thumbnails: "Thumbnails",
	carousel: "Carousel",
	"masonry-h": "Masonry (horizontal)",
	"masonry-v": "Masonry (vertical)",
};

const FILTER_LABELS: Record<MediaFilter, string> = {
	images: "Images only",
	video: "Video only",
	all: "All media",
};

export class GalleryBuilderModal extends Modal {
	private settings: AugurSettings;
	private editor: Editor;
	private view: GalleryViewType;
	private filter: MediaFilter;
	private gridColumns = "auto";
	private thumbnailColumns = "auto";
	private carouselHeight = "";
	private carouselShowThumbnails = false;
	private masonryRowHeight = "";
	private masonryColumnWidth = "auto";
	private sources: BuilderSource[] = [];
	private previewEl: HTMLElement | null = null;
	private sourcesContainer: HTMLElement | null = null;
	private layoutSection: HTMLElement | null = null;
	private layoutSettings: Setting[] = [];

	constructor(app: App, settings: AugurSettings, editor: Editor) {
		super(app);
		this.settings = settings;
		this.editor = editor;
		const defaults = resolveOculusDefaults(app, settings);
		this.view = defaults.view;
		this.filter = defaults.filter;
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		modalEl.addClass("augur-builder-modal-container");
		contentEl.empty();
		contentEl.addClass("augur-builder-modal");

		const header = contentEl.createDiv({ cls: "augur-builder-header" });
		header.createEl("h2", { text: "Insert Oculus gallery" });
		header.createEl("p", {
			cls: "augur-builder-header-desc",
			text: "Configure layout, filter, and sources. Browse or drag vault files into the source list.",
		});

		if (Platform.isDesktopApp && !isMediaExtendedAvailable(this.app)) {
			header.createEl("p", {
				cls: "augur-builder-header-note",
				text: "Install Media Extended to include YouTube, Vimeo, and other hosted platform URLs.",
			});
		}

		const layoutSection = contentEl.createDiv({ cls: "augur-builder-section" });
		layoutSection.createDiv({ cls: "augur-builder-section-title", text: "1 — Layout" });

		new Setting(layoutSection)
			.setName("View")
			.setDesc("Gallery layout in the note.")
			.addDropdown((dropdown) => {
				for (const view of VIEW_TYPES) dropdown.addOption(view, VIEW_LABELS[view]);
				dropdown.setValue(this.view).onChange((value) => {
					this.view = value as GalleryViewType;
					this.refreshLayoutSettings();
					this.refreshPreview();
				});
			});

		this.layoutSection = layoutSection;
		this.refreshLayoutSettings();

		new Setting(layoutSection)
			.setName("Filter")
			.setDesc("Applies to LOCAL folder scans, SEARCH sources, and URL entries by detected media type.")
			.addDropdown((dropdown) => {
				for (const filter of MEDIA_FILTERS) dropdown.addOption(filter, FILTER_LABELS[filter]);
				dropdown.setValue(this.filter).onChange((value) => {
					this.filter = value as MediaFilter;
					this.refreshPreview();
				});
			});

		const sourcesSection = contentEl.createDiv({ cls: "augur-builder-section" });
		const sourcesHeader = sourcesSection.createDiv({ cls: "augur-builder-section-header" });
		sourcesHeader.createDiv({ cls: "augur-builder-section-title", text: "2 — Media sources" });

		const quickAdd = sourcesHeader.createDiv({ cls: "augur-builder-quick-add" });
		quickAdd
			.createEl("button", { cls: "augur-builder-pill", text: "+ Local" })
			.addEventListener("click", () => this.addLocalSource());
		quickAdd
			.createEl("button", { cls: "augur-builder-pill", text: "+ Search" })
			.addEventListener("click", () => this.addSearchSource());
		quickAdd
			.createEl("button", { cls: "augur-builder-pill", text: "+ URL" })
			.addEventListener("click", () => this.addUrlSource());
		quickAdd
			.createEl("button", { cls: "augur-builder-pill", text: "+ YouTube" })
			.addEventListener("click", () => this.addUrlSource("https://www.youtube.com/watch?v="));
		quickAdd
			.createEl("button", { cls: "augur-builder-pill", text: "Browse vault" })
			.addEventListener("click", () => this.browseForNewLocal());

		this.sourcesContainer = sourcesSection.createDiv({ cls: "augur-builder-sources-list" });
		this.sourcesContainer.addEventListener("dragover", (event) => {
			if (event.dataTransfer?.types.includes(AUGUR_PATH_MIME)) {
				event.preventDefault();
				this.sourcesContainer?.addClass("is-drop-target");
			}
		});
		this.sourcesContainer.addEventListener("dragleave", () => {
			this.sourcesContainer?.removeClass("is-drop-target");
		});
		this.sourcesContainer.addEventListener("drop", (event) => {
			this.sourcesContainer?.removeClass("is-drop-target");
			const raw = event.dataTransfer?.getData(AUGUR_PATH_MIME);
			if (!raw) return;
			event.preventDefault();
			try {
				const picked = JSON.parse(raw) as PathPickResult;
				this.addPickedLocal(picked);
			} catch {
				return;
			}
		});
		this.renderSources();

		const previewSection = contentEl.createDiv({ cls: "augur-builder-section" });
		const previewHeader = previewSection.createDiv({ cls: "augur-builder-section-header" });
		previewHeader.createDiv({ cls: "augur-builder-section-title", text: "3 — Block preview" });
		const copyBtn = previewHeader.createEl("button", {
			cls: "augur-builder-copy-btn",
			text: "Copy",
		});
		copyBtn.addEventListener("click", () => {
			const validationError = this.getSearchValidationError();
			if (validationError) {
				new Notice(validationError);
				return;
			}
			void navigator.clipboard.writeText(this.buildBlockText());
			new Notice("Oculus block copied to clipboard.");
		});

		const previewBox = previewSection.createDiv({ cls: "augur-builder-preview-box" });
		previewBox.createDiv({ cls: "augur-builder-preview-lang", text: "oculus" });
		this.previewEl = previewBox.createEl("pre", { cls: "augur-builder-preview-code" });

		const footer = contentEl.createDiv({ cls: "augur-builder-footer" });
		footer
			.createEl("button", { cls: "augur-builder-cancel-btn", text: "Cancel" })
			.addEventListener("click", () => this.close());
		footer
			.createEl("button", { cls: "augur-builder-insert-btn mod-cta", text: "Insert at cursor" })
			.addEventListener("click", () => this.insertBlock());

		this.refreshPreview();
	}

	onClose(): void {
		this.contentEl.empty();
		this.modalEl.removeClass("augur-builder-modal-container");
	}

	private refreshLayoutSettings(): void {
		for (const setting of this.layoutSettings) setting.settingEl.remove();
		this.layoutSettings = [];
		if (!this.layoutSection) return;

		if (this.view === "grid") {
			this.layoutSettings.push(
				new Setting(this.layoutSection)
					.setName("Grid columns")
					.setDesc("Column layout: auto, a number (3), px width (200px), or CSS minmax.")
					.addText((text) =>
						text.setPlaceholder("auto").setValue(this.gridColumns).onChange((value) => {
							this.gridColumns = value.trim() || "auto";
							this.refreshPreview();
						}),
					),
			);
		}
		if (this.view === "thumbnails") {
			this.layoutSettings.push(
				new Setting(this.layoutSection)
					.setName("Thumbnail columns")
					.setDesc("Column layout: auto, a number (3), px width (120px), or CSS minmax.")
					.addText((text) =>
						text.setPlaceholder("auto").setValue(this.thumbnailColumns).onChange((value) => {
							this.thumbnailColumns = value.trim() || "auto";
							this.refreshPreview();
						}),
					),
			);
		}
		if (this.view === "carousel") {
			this.layoutSettings.push(
				new Setting(this.layoutSection)
					.setName("Carousel height")
					.setDesc("Main slide height in px (default 420). Leave empty for default.")
					.addText((text) =>
						text.setPlaceholder("420").setValue(this.carouselHeight).onChange((value) => {
							this.carouselHeight = value.trim();
							this.refreshPreview();
						}),
					),
			);
			this.layoutSettings.push(
				new Setting(this.layoutSection)
					.setName("Show thumbnails")
					.setDesc("Thumbnail strip under the main slide.")
					.addToggle((toggle) =>
						toggle.setValue(this.carouselShowThumbnails).onChange((value) => {
							this.carouselShowThumbnails = value;
							this.refreshPreview();
						}),
					),
			);
		}
		if (this.view === "masonry-h") {
			this.layoutSettings.push(
				new Setting(this.layoutSection)
					.setName("Row height")
					.setDesc("Target row height for horizontal masonry (default 200px).")
					.addText((text) =>
						text.setPlaceholder("200").setValue(this.masonryRowHeight).onChange((value) => {
							this.masonryRowHeight = value.trim();
							this.refreshPreview();
						}),
					),
			);
		}
		if (this.view === "masonry-v") {
			this.layoutSettings.push(
				new Setting(this.layoutSection)
					.setName("Column width")
					.setDesc("Column layout: auto, a number (3), px width (200px), or minmax CSS.")
					.addText((text) =>
						text.setPlaceholder("auto").setValue(this.masonryColumnWidth).onChange((value) => {
							this.masonryColumnWidth = value.trim() || "auto";
							this.refreshPreview();
						}),
					),
			);
		}
	}

	private addLocalSource(path = "", caption = ""): void {
		this.sources.push({ kind: "local", path, caption });
		this.renderSources();
		this.refreshPreview();
	}

	private addSearchSource(path = "", recursive = false): void {
		this.sources.push({ kind: "search", path, query: "", recursive });
		this.renderSources();
		this.refreshPreview();
	}

	private addUrlSource(initialUrl = ""): void {
		this.sources.push({ kind: "url", url: initialUrl, caption: "" });
		this.renderSources();
		this.refreshPreview();
	}

	private addPickedLocal(picked: PathPickResult): void {
		this.addLocalSource(formatPickedPath(picked));
	}

	private browseForNewLocal(): void {
		new VaultPathBrowser(this.app, {
			mode: "folder",
			allowModeSwitch: true,
			onPick: (picked) => this.addPickedLocal(picked),
		}).open();
	}

	private browseInto(source: LocalSource | SearchSource): void {
		new VaultPathBrowser(this.app, {
			mode: source.kind === "search" ? "folder" : "folder",
			allowModeSwitch: source.kind === "local",
			onPick: (picked) => {
				source.path = formatPickedPath(picked);
				if (source.kind === "search") source.recursive = picked.recursive;
				this.renderSources();
				this.refreshPreview();
			},
		}).open();
	}

	private moveSource(index: number, delta: number): void {
		const next = index + delta;
		if (next < 0 || next >= this.sources.length) return;
		const item = this.sources[index];
		if (!item) return;
		this.sources.splice(index, 1);
		this.sources.splice(next, 0, item);
		this.renderSources();
		this.refreshPreview();
	}

	private removeSource(index: number): void {
		this.sources.splice(index, 1);
		this.renderSources();
		this.refreshPreview();
	}

	private renderSources(): void {
		const container = this.sourcesContainer;
		if (!container) return;
		container.empty();

		if (this.sources.length === 0) {
			const empty = container.createDiv({ cls: "augur-builder-empty-state" });
			empty.createEl("h4", { text: "No sources yet" });
			empty.createEl("p", {
				text: "Add a vault path, browse the vault, drop a file here, or add a remote URL.",
			});
			return;
		}

		this.sources.forEach((source, index) => {
			const card = container.createDiv({ cls: "augur-builder-source-card" });
			card.setAttr("draggable", "true");
			card.addEventListener("dragstart", (event) => {
				event.dataTransfer?.setData("text/plain", String(index));
				card.addClass("is-dragging");
			});
			card.addEventListener("dragend", () => card.removeClass("is-dragging"));
			card.addEventListener("dragover", (event) => {
				event.preventDefault();
				card.addClass("is-drag-over");
			});
			card.addEventListener("dragleave", () => card.removeClass("is-drag-over"));
			card.addEventListener("drop", (event) => {
				event.preventDefault();
				card.removeClass("is-drag-over");
				const pickedRaw = event.dataTransfer?.getData(AUGUR_PATH_MIME);
				if (pickedRaw) {
					try {
						const picked = JSON.parse(pickedRaw) as PathPickResult;
						if (source.kind === "local" || source.kind === "search") {
							source.path = formatPickedPath(picked);
							if (source.kind === "search") source.recursive = picked.recursive;
							this.renderSources();
							this.refreshPreview();
						}
					} catch {
						return;
					}
					return;
				}
				const from = Number(event.dataTransfer?.getData("text/plain"));
				if (Number.isNaN(from) || from === index) return;
				const item = this.sources[from];
				if (!item) return;
				this.sources.splice(from, 1);
				this.sources.splice(index, 0, item);
				this.renderSources();
				this.refreshPreview();
			});

			const headerRow = card.createDiv({ cls: "augur-builder-source-card-header" });
			const sourceLabel =
				source.kind === "local" ? "Local" : source.kind === "search" ? "Search" : "URL";
			headerRow.createSpan({
				cls: "augur-builder-source-title",
				text: `${sourceLabel} #${index + 1}`,
			});
			const actions = headerRow.createDiv({ cls: "augur-builder-source-actions" });
			if (index > 0) {
				actions
					.createEl("button", { cls: "augur-builder-icon-btn", text: "↑", attr: { title: "Move up" } })
					.addEventListener("click", () => this.moveSource(index, -1));
			}
			if (index < this.sources.length - 1) {
				actions
					.createEl("button", { cls: "augur-builder-icon-btn", text: "↓", attr: { title: "Move down" } })
					.addEventListener("click", () => this.moveSource(index, 1));
			}
			actions
				.createEl("button", { cls: "augur-builder-icon-btn", text: "✕", attr: { title: "Remove" } })
				.addEventListener("click", () => this.removeSource(index));

			const body = card.createDiv({ cls: "augur-builder-source-card-body" });
			if (source.kind === "local") {
				new Setting(body)
					.setName("Vault path")
					.setDesc("File or folder from vault root. End a folder with / to scan recursively.")
					.addText((text) =>
						text.setValue(source.path).onChange((value) => {
							source.path = value.trim();
							this.refreshPreview();
						}),
					)
					.addButton((btn) =>
						btn.setButtonText("Browse").onClick(() => this.browseInto(source)),
					);
				new Setting(body)
					.setName("Caption")
					.addText((text) =>
						text.setPlaceholder("Optional").setValue(source.caption).onChange((value) => {
							source.caption = value;
							this.refreshPreview();
						}),
					);
			} else if (source.kind === "search") {
				new Setting(body)
					.setName("Folder path")
					.setDesc("Folder from vault root.")
					.addText((text) =>
						text.setValue(source.path).onChange((value) => {
							source.path = value.trim();
							this.refreshPreview();
						}),
					)
					.addButton((btn) =>
						btn.setButtonText("Browse").onClick(() => this.browseInto(source)),
					);
				new Setting(body)
					.setName("Title contains all")
					.setDesc("Comma-separated. Every query must match the filename.")
					.addText((text) =>
						text.setPlaceholder("Renaissance, Sculpture").setValue(source.query).onChange((value) => {
							source.query = value;
							this.refreshPreview();
						}),
					);
				new Setting(body)
					.setName("Recursive folder scan")
					.addToggle((toggle) =>
						toggle.setValue(source.recursive).onChange((value) => {
							source.recursive = value;
							this.refreshPreview();
						}),
					);
			} else {
				const urlSetting = new Setting(body)
					.setName("Media URL")
					.setDesc(describeUrlMediaEntry(source.url))
					.addText((text) =>
						text.setPlaceholder("https://").setValue(source.url).onChange((value) => {
							source.url = value.trim();
							urlSetting.setDesc(describeUrlMediaEntry(source.url));
							this.refreshPreview();
						}),
					);
				new Setting(body)
					.setName("Caption")
					.addText((text) =>
						text.setPlaceholder("Optional caption").setValue(source.caption).onChange((value) => {
							source.caption = value;
							this.refreshPreview();
						}),
					);
			}
		});
	}

	private parseHeightInput(raw: string): number | null {
		const trimmed = raw.trim();
		if (!trimmed) return null;
		const match = /^(\d+)\s*px?$/i.exec(trimmed);
		return match?.[1] ? Number.parseInt(match[1], 10) : null;
	}

	private getSearchValidationError(): string | null {
		for (const source of this.sources) {
			if (source.kind !== "search") continue;
			if (!source.path.trim() || !source.query.trim()) return "Complete or remove every Search source.";
			if (!parseMediaTitleQueries(source.query)) {
				return "Remove empty comma-separated values from every Search source.";
			}
		}
		return null;
	}

	private buildBlockBody(): string {
		const validationError = this.getSearchValidationError();
		if (validationError) return `# ${validationError}`;

		const sources: FormattedMediaSource[] = [];
		for (const source of this.sources) {
			if (source.kind === "local" && source.path) {
				sources.push({
					kind: "local",
					path: source.path,
					recursive: source.path.endsWith("/"),
					caption: source.caption.trim() || undefined,
				});
			} else if (source.kind === "search" && source.path) {
				const queries = parseMediaTitleQueries(source.query);
				if (!queries) continue;
				sources.push({
					kind: "search",
					path: source.path,
					queries,
					recursive: source.recursive,
				});
			} else if (source.kind === "url" && source.url) {
				sources.push({
					kind: "url",
					url: source.url,
					caption: source.caption.trim() || undefined,
				});
			}
		}
		if (sources.length === 0) return "# Add at least one complete local, search, or URL source.";
		return formatMediaGalleryBlock({
			view: this.view,
			filter: this.filter,
			gridColumns: this.view === "grid" ? this.gridColumns : undefined,
			thumbnailColumns: this.view === "thumbnails" ? this.thumbnailColumns : undefined,
			carouselHeightPx: this.view === "carousel" ? this.parseHeightInput(this.carouselHeight) : undefined,
			carouselShowThumbnails: this.view === "carousel" ? this.carouselShowThumbnails : undefined,
			masonryRowHeightPx: this.view === "masonry-h" ? this.parseHeightInput(this.masonryRowHeight) : undefined,
			masonryColumnWidth: this.view === "masonry-v" ? this.masonryColumnWidth : undefined,
			sources,
		});
	}

	private buildBlockText(): string {
		return `\`\`\`oculus\n${this.buildBlockBody()}\n\`\`\``;
	}

	private refreshPreview(): void {
		this.previewEl?.setText(this.buildBlockBody());
	}

	private insertBlock(): void {
		const validationError = this.getSearchValidationError();
		if (validationError) {
			new Notice(validationError);
			return;
		}
		const locals = this.sources.filter((s) => s.kind === "local" && s.path.trim());
		const searches = this.sources.filter(
			(s) => s.kind === "search" && s.path.trim() && parseMediaTitleQueries(s.query),
		);
		const urls = this.sources.filter((s) => s.kind === "url" && s.url.trim());
		if (locals.length === 0 && searches.length === 0 && urls.length === 0) {
			new Notice("Add at least one complete local, search, or URL source.");
			return;
		}
		const cursor = this.editor.getCursor();
		this.editor.replaceRange(`${this.buildBlockText()}\n`, cursor);
		this.close();
		new Notice("Oculus block inserted.");
	}
}
