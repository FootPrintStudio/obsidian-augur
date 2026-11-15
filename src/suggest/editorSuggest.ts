import { App, EditorSuggest, TAbstractFile, TFile, TFolder, type Editor, type EditorPosition, type EditorSuggestContext, type EditorSuggestTriggerInfo } from "obsidian";
import { frontmatterKeys, listEpochsCalendars, resolveGrimoirePrefix, resolveLexiconFolder } from "../companions";
import { MEDIA_EXTENSIONS, type AugurSettings } from "../types";
import { detectSuggestTrigger, type SuggestKind } from "./context";
import {
	GRIMOIRE_FILE_FIELDS,
	GRIMOIRE_CROSS_NOTE,
	GRIMOIRE_FUNCTIONS,
	GRIMOIRE_STYLES,
	LEXICON_FLAGS,
	LEXICON_TEMPLATES,
	OCULUS_FILTERS,
	OCULUS_KEYS,
	OCULUS_SORTS,
	OCULUS_VIEWS,
	VCARD_BAGS,
	VTABS_ALIGNS,
	VTABS_KEYS,
	VTABS_POSITIONS,
	VTABS_TONE_BAGS,
	XIEWER_CLAUSES,
	XIEWER_KIND_VALUES,
} from "./vocab";

export interface AugurSuggestion {
	label: string;
	insert: string;
	detail?: string;
}

function matches(query: string, label: string): boolean {
	if (!query) return true;
	return label.toLowerCase().includes(query.toLowerCase());
}

/**
 * Cursor offset from the start of an inserted suggestion for continued typing.
 * Empty `()` → inside parens; `date("id:")` → before closing `")`; else end.
 */
export function cursorOffsetAfterInsert(insert: string): number {
	const emptyParen = insert.indexOf("()");
	if (emptyParen !== -1) return emptyParen + 1;
	if (insert.endsWith('")')) return insert.length - 2;
	return insert.length;
}

export class AugurEditorSuggest extends EditorSuggest<AugurSuggestion> {
	private settings: () => AugurSettings;
	private latestKind: SuggestKind = "oculus-key";

	constructor(app: App, settings: () => AugurSettings) {
		super(app);
		this.settings = settings;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
		const settings = this.settings();
		const trigger = detectSuggestTrigger(editor, cursor, {
			grimoirePrefix: resolveGrimoirePrefix(this.app, settings.grimoirePrefix),
			lexiconFolder: resolveLexiconFolder(this.app, settings.lexiconFolder),
			filePath: file?.path ?? null,
		});
		if (!trigger) return null;
		this.latestKind = trigger.kind;
		return { start: trigger.start, end: trigger.end, query: trigger.query };
	}

	getSuggestions(context: EditorSuggestContext): AugurSuggestion[] {
		const query = context.query;
		const kind = this.latestKind;
		const items: AugurSuggestion[] = [];

		const push = (label: string, insert = label, detail?: string) => {
			if (matches(query, label) || matches(query, insert)) items.push({ label, insert, detail });
		};

		if (kind === "grimoire") {
			this.pushEpochsCalendars(push, "snippet");
			for (const fn of GRIMOIRE_FUNCTIONS) push(fn.label, fn.insert, fn.detail);
			for (const snip of GRIMOIRE_CROSS_NOTE) push(snip.label, snip.insert, snip.detail);
			for (const field of GRIMOIRE_FILE_FIELDS) push(field);
			for (const key of frontmatterKeys(this.app, context.file)) push(key);
			if (/as\s*$/i.test(context.editor.getLine(context.start.line).slice(0, context.end.ch)) || /^as/i.test(query)) {
				for (const style of GRIMOIRE_STYLES) push(`AS ${style}`, style);
			} else {
				for (const style of GRIMOIRE_STYLES) push(style, `AS ${style}`, "display style");
			}
		} else if (kind === "grimoire-date" || kind === "epochs-calendar") {
			this.pushEpochsCalendars(push, kind === "grimoire-date" ? "date-string" : "id-only");
		} else if (kind === "oculus-key") {
			for (const key of OCULUS_KEYS) push(key);
		} else if (kind === "oculus-view") {
			for (const view of OCULUS_VIEWS) push(view);
		} else if (kind === "oculus-filter") {
			for (const filter of OCULUS_FILTERS) push(filter);
		} else if (kind === "oculus-sort") {
			for (const sort of OCULUS_SORTS) push(sort);
		} else if (kind === "oculus-path") {
			items.push(...this.vaultPathSuggestions(query, true));
		} else if (kind === "oculus-xiewer") {
			this.pushXiewerSuggestions(push, query);
		} else if (kind === "vtabs-key") {
			for (const key of VTABS_KEYS) push(key);
		} else if (kind === "vtabs-position") {
			for (const value of VTABS_POSITIONS) push(value);
		} else if (kind === "vtabs-align") {
			for (const value of VTABS_ALIGNS) push(value);
		} else if (kind === "vtabs-tab-tone") {
			for (const bag of VTABS_TONE_BAGS) push(bag.label, bag.insert);
		} else if (kind === "vcard") {
			push("`v-card`", "v-card", "card marker");
			for (const bag of VCARD_BAGS) push(bag.label, bag.insert, bag.detail);
		} else if (kind === "lexicon-dict") {
			for (const tmpl of LEXICON_TEMPLATES) push(tmpl.label, tmpl.insert, tmpl.detail);
			for (const flag of LEXICON_FLAGS) push(flag);
		} else if (kind === "lexicon-context") {
			items.push(...this.folderPathSuggestions(query, resolveLexiconFolder(this.app, this.settings().lexiconFolder)));
		}

		return items.slice(0, 50);
	}

	renderSuggestion(value: AugurSuggestion, el: HTMLElement): void {
		el.addClass("augur-suggest-item");
		el.createDiv({ cls: "augur-suggest-label", text: value.label });
		if (value.detail) el.createDiv({ cls: "augur-suggest-detail", text: value.detail });
	}

	selectSuggestion(value: AugurSuggestion, _evt: MouseEvent | KeyboardEvent): void {
		const context = this.context;
		if (!context) return;
		const { editor, start, end } = context;
		editor.replaceRange(value.insert, start, end);
		const ch = start.ch + cursorOffsetAfterInsert(value.insert);
		editor.setCursor({ line: start.line, ch });
	}

	private pushEpochsCalendars(
		push: (label: string, insert?: string, detail?: string) => void,
		mode: "snippet" | "date-string" | "id-only",
	): void {
		for (const cal of listEpochsCalendars(this.app)) {
			const form = cal.hasMonths ? `${cal.id}:year-month-day` : `${cal.id}:year-day`;
			const detail = cal.path ? `${cal.name} · ${cal.path}` : cal.name;
			if (mode === "id-only") {
				push(cal.id, cal.id, detail);
				continue;
			}
			if (mode === "date-string") {
				push(`${cal.id}:`, `${cal.id}:`, `${detail} — then ${cal.hasMonths ? "year-month-day" : "year-day"}`);
				push(form, form, detail);
				continue;
			}
			push(`date("${cal.id}:…")`, `date("${cal.id}:")`, detail);
			push(cal.id, cal.id, `calendar id · ${detail}`);
		}
	}

	private pushXiewerSuggestions(
		push: (label: string, insert?: string, detail?: string) => void,
		query: string,
	): void {
		const lower = query.toLowerCase();
		const kindPrefix = /^(-)?kind:(.*)$/i.exec(query);
		if (kindPrefix) {
			const neg = kindPrefix[1] ?? "";
			const partial = (kindPrefix[2] ?? "").toLowerCase();
			for (const kind of XIEWER_KIND_VALUES) {
				if (partial && !kind.startsWith(partial)) continue;
				push(`${neg}kind:${kind}`, `${neg}kind:${kind}`, "Xiewer media kind");
			}
			return;
		}
		if (lower === "kind" || lower === "kind:") {
			for (const kind of XIEWER_KIND_VALUES) push(`kind:${kind}`, `kind:${kind}`, "Xiewer media kind");
			return;
		}
		for (const clause of XIEWER_CLAUSES) push(clause.label, clause.insert, clause.detail);
	}

	private vaultPathSuggestions(query: string, mediaOnly: boolean): AugurSuggestion[] {
		const files = this.app.vault.getAllLoadedFiles();
		const out: AugurSuggestion[] = [];
		const needle = query.toLowerCase();
		for (const file of files) {
			if (file.path.startsWith(".")) continue;
			if (file instanceof TFolder) {
				if (needle && !file.path.toLowerCase().includes(needle)) continue;
				out.push({ label: `${file.path}/`, insert: `${file.path}/`, detail: "folder (recursive)" });
				out.push({ label: file.path, insert: file.path, detail: "folder" });
			} else if (file instanceof TFile) {
				if (mediaOnly && !MEDIA_EXTENSIONS.has(file.extension.toLowerCase())) continue;
				if (needle && !file.path.toLowerCase().includes(needle)) continue;
				out.push({ label: file.path, insert: file.path, detail: file.extension });
			}
			if (out.length >= 40) break;
		}
		return out;
	}

	private folderPathSuggestions(query: string, root: string): AugurSuggestion[] {
		const folder = this.app.vault.getAbstractFileByPath(root);
		const out: AugurSuggestion[] = [];
		const add = (file: TAbstractFile) => {
			if (query && !file.path.toLowerCase().includes(query.toLowerCase())) return;
			out.push({
				label: file.path,
				insert: file.path,
				detail: file instanceof TFolder ? "folder" : "file",
			});
		};
		if (folder instanceof TFolder) {
			add(folder);
			const walk = (node: TFolder) => {
				for (const child of node.children) {
					add(child);
					if (child instanceof TFolder) walk(child);
				}
			};
			walk(folder);
		}
		return out.slice(0, 40);
	}
}
