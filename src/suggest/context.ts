import type { Editor, EditorPosition } from "obsidian";

export type SuggestKind =
	| "grimoire"
	| "oculus-key"
	| "oculus-view"
	| "oculus-filter"
	| "oculus-path"
	| "vtabs-key"
	| "vtabs-position"
	| "vtabs-align"
	| "vcard"
	| "lexicon-dict"
	| "lexicon-context";

export interface SuggestTrigger {
	kind: SuggestKind;
	start: EditorPosition;
	end: EditorPosition;
	query: string;
}

function fenceAt(editor: Editor, cursor: EditorPosition): { lang: string } | null {
	let open: { marker: string; lang: string } | null = null;
	for (let i = 0; i <= cursor.line; i++) {
		const line = editor.getLine(i);
		const match = /^(`{3,}|~{3,})([^\s`]*)\s*$/.exec(line);
		if (!match?.[1]) continue;
		const marker = match[1];
		const lang = (match[2] ?? "").toLowerCase();
		if (!open) {
			open = { marker, lang };
			continue;
		}
		if (marker[0] === open.marker[0] && marker.length >= open.marker.length) {
			open = null;
		}
	}
	return open ? { lang: open.lang } : null;
}

function inlineCodeAt(editor: Editor, cursor: EditorPosition): { startCh: number; endCh: number; text: string } | null {
	const line = editor.getLine(cursor.line);
	let start = -1;
	for (let i = 0; i < line.length; i++) {
		if (line[i] !== "`") continue;
		if (start === -1) {
			start = i;
			continue;
		}
		const end = i;
		if (cursor.ch > start && cursor.ch <= end) {
			return { startCh: start + 1, endCh: end, text: line.slice(start + 1, end) };
		}
		start = -1;
	}
	if (start !== -1 && cursor.ch > start) {
		return { startCh: start + 1, endCh: cursor.ch, text: line.slice(start + 1, cursor.ch) };
	}
	return null;
}

function queryFrom(line: string, ch: number): { startCh: number; query: string } {
	let start = ch;
	while (start > 0) {
		const prev = line[start - 1];
		if (!prev || /[\s,{([|]/.test(prev)) break;
		start -= 1;
	}
	return { startCh: start, query: line.slice(start, ch) };
}

function keyValue(line: string): { key: string; value: string } | null {
	const match = /^(\s*)(?:- )?([A-Za-z]+):\s*(.*)$/.exec(line);
	if (!match) return null;
	return { key: (match[2] ?? "").toUpperCase(), value: match[3] ?? "" };
}

function isIndented(line: string): boolean {
	return /^(\t| {2,})\S/.test(line);
}

function inFrontmatter(editor: Editor, cursor: EditorPosition): boolean {
	if (editor.getLine(0).trim() !== "---") return false;
	for (let i = 1; i <= cursor.line; i++) {
		if (editor.getLine(i).trim() === "---") return i > cursor.line;
	}
	return true;
}

function currentYamlKey(editor: Editor, cursor: EditorPosition): string | null {
	for (let i = cursor.line; i >= 0; i--) {
		const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(editor.getLine(i).trim());
		if (match?.[1]) return match[1].toLowerCase();
		if (!/^\s+-/.test(editor.getLine(i)) && editor.getLine(i).trim() !== "") return null;
	}
	return null;
}

export function detectSuggestTrigger(
	editor: Editor,
	cursor: EditorPosition,
	options: { grimoirePrefix: string; lexiconFolder: string; filePath: string | null },
): SuggestTrigger | null {
	const line = editor.getLine(cursor.line);
	const fence = fenceAt(editor, cursor);

	if (fence?.lang === "oculus") {
		const kv = keyValue(line);
		if (kv?.key === "VIEW") {
			const q = queryFrom(line, cursor.ch);
			return { kind: "oculus-view", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
		if (kv?.key === "FILTER") {
			const q = queryFrom(line, cursor.ch);
			return { kind: "oculus-filter", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
		if (kv?.key === "LOCAL" || kv?.key === "SEARCH" || isIndented(line)) {
			const q = queryFrom(line, cursor.ch);
			return { kind: "oculus-path", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
		const q = queryFrom(line, cursor.ch);
		return { kind: "oculus-key", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}

	if (fence?.lang === "v-tabs") {
		const kv = keyValue(line);
		if (kv?.key === "POSITION") {
			const q = queryFrom(line, cursor.ch);
			return { kind: "vtabs-position", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
		if (kv?.key === "ALIGN") {
			const q = queryFrom(line, cursor.ch);
			return { kind: "vtabs-align", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
		const q = queryFrom(line, cursor.ch);
		return { kind: "vtabs-key", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}

	const inline = inlineCodeAt(editor, cursor);
	if (inline) {
		const prefix = options.grimoirePrefix;
		if (inline.text.startsWith(prefix) || prefix.startsWith(inline.text)) {
			const afterPrefix = Math.max(inline.startCh + prefix.length, inline.startCh);
			const startCh = Math.min(Math.max(afterPrefix, queryFrom(line, cursor.ch).startCh), cursor.ch);
			return {
				kind: "grimoire",
				start: { line: cursor.line, ch: startCh },
				end: cursor,
				query: line.slice(startCh, cursor.ch),
			};
		}
		if (/^v-card(?:\s|$)/.test(inline.text)) {
			const q = queryFrom(line, cursor.ch);
			return { kind: "vcard", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
	}

	if (
		options.filePath &&
		(options.filePath === options.lexiconFolder ||
			options.filePath.startsWith(`${options.lexiconFolder}/`))
	) {
		const q = queryFrom(line, cursor.ch);
		return { kind: "lexicon-dict", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}

	if (inFrontmatter(editor, cursor)) {
		const key = currentYamlKey(editor, cursor);
		if (key === "lexicon-context" || key === "def-context") {
			const q = queryFrom(line, cursor.ch);
			return { kind: "lexicon-context", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
	}

	return null;
}
