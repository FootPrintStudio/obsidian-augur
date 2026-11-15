import type { Editor, EditorPosition } from "obsidian";

export type SuggestKind =
	| "grimoire"
	| "grimoire-date"
	| "oculus-key"
	| "oculus-view"
	| "oculus-filter"
	| "oculus-sort"
	| "oculus-path"
	| "oculus-xiewer"
	| "vtabs-key"
	| "vtabs-position"
	| "vtabs-align"
	| "vtabs-tab-tone"
	| "vcard"
	| "lexicon-dict"
	| "lexicon-context"
	| "epochs-calendar";

export interface SuggestTrigger {
	kind: SuggestKind;
	start: EditorPosition;
	end: EditorPosition;
	query: string;
}

const MEDIA_KEYS = new Set(["LOCAL", "SEARCH", "URL", "XIEWER"]);

/**
 * Innermost open fence at the cursor (supports Visage 4-backtick `v-tabs`
 * wrapping nested 3-backtick `oculus` / other fences).
 *
 * Closing fences must be the same tick character, at least as long as the
 * opener, and have an empty info string (CommonMark).
 */
export function fenceAt(editor: Editor, cursor: EditorPosition): { lang: string } | null {
	const stack: { marker: string; lang: string }[] = [];
	for (let i = 0; i <= cursor.line; i++) {
		const line = editor.getLine(i);
		const match = /^(`{3,}|~{3,})([^\s`]*)\s*$/.exec(line);
		if (!match?.[1]) continue;
		const marker = match[1];
		const lang = (match[2] ?? "").toLowerCase();
		const top = stack[stack.length - 1];
		if (
			top &&
			marker[0] === top.marker[0] &&
			marker.length >= top.marker.length &&
			lang === ""
		) {
			stack.pop();
			continue;
		}
		if (!top) {
			stack.push({ marker, lang });
			continue;
		}
		// Nested open (typically shorter fence with a language tag inside v-tabs).
		if (lang !== "") {
			stack.push({ marker, lang });
		}
		// Bare shorter fence that cannot close the outer — ignore.
	}
	const top = stack[stack.length - 1];
	return top ? { lang: top.lang } : null;
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

/** Parent LOCAL/SEARCH/URL/XIEWER key for the current oculus line (including indented continuations). */
export function parentOculusMediaKey(editor: Editor, cursor: EditorPosition): string | null {
	const line = editor.getLine(cursor.line);
	const current = keyValue(line);
	if (current && MEDIA_KEYS.has(current.key)) return current.key;
	// Incomplete top-level keys (e.g. typing "XIEW") must not inherit a prior media key.
	if (!isIndented(line)) return null;

	for (let i = cursor.line - 1; i >= 0; i--) {
		const prev = editor.getLine(i);
		if (!prev.trim()) continue;
		if (isIndented(prev)) continue;
		const kv = keyValue(prev);
		if (!kv) return null;
		if (MEDIA_KEYS.has(kv.key)) return kv.key;
		return null;
	}
	return null;
}

/** True when the cursor sits inside an open date("… string in a Grimoire inline. */
export function inGrimoireDateString(inlineTextBeforeCursor: string): boolean {
	return /date\s*\(\s*"[^"]*$/i.test(inlineTextBeforeCursor);
}

function detectInlineSuggest(
	editor: Editor,
	cursor: EditorPosition,
	options: { grimoirePrefix: string },
): SuggestTrigger | null {
	const line = editor.getLine(cursor.line);
	const inline = inlineCodeAt(editor, cursor);
	if (!inline) return null;

	const prefix = options.grimoirePrefix;
	if (inline.text.startsWith(prefix) || prefix.startsWith(inline.text)) {
		const afterPrefix = Math.max(inline.startCh + prefix.length, inline.startCh);
		const beforeCursor = line.slice(inline.startCh, cursor.ch);
		const exprBefore = beforeCursor.startsWith(prefix) ? beforeCursor.slice(prefix.length) : beforeCursor;
		if (inGrimoireDateString(exprBefore)) {
			const quoteAt = line.lastIndexOf('"', cursor.ch - 1);
			const startCh =
				quoteAt >= afterPrefix
					? quoteAt + 1
					: Math.min(Math.max(afterPrefix, queryFrom(line, cursor.ch).startCh), cursor.ch);
			return {
				kind: "grimoire-date",
				start: { line: cursor.line, ch: startCh },
				end: cursor,
				query: line.slice(startCh, cursor.ch),
			};
		}
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
	return null;
}

function detectOculusSuggest(editor: Editor, cursor: EditorPosition): SuggestTrigger {
	const line = editor.getLine(cursor.line);
	const kv = keyValue(line);
	if (kv?.key === "VIEW") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "oculus-view", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}
	if (kv?.key === "FILTER") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "oculus-filter", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}
	if (kv?.key === "SORT") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "oculus-sort", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}

	const mediaKey = parentOculusMediaKey(editor, cursor);
	if (mediaKey === "XIEWER") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "oculus-xiewer", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}
	if (mediaKey === "LOCAL" || mediaKey === "SEARCH") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "oculus-path", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}

	const q = queryFrom(line, cursor.ch);
	return { kind: "oculus-key", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
}

function detectVtabsSuggest(editor: Editor, cursor: EditorPosition): SuggestTrigger | null {
	const line = editor.getLine(cursor.line);
	const kv = keyValue(line);
	if (kv?.key === "POSITION") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "vtabs-position", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}
	if (kv?.key === "ALIGN") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "vtabs-align", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}
	if (kv?.key === "TAB") {
		const q = queryFrom(line, cursor.ch);
		return { kind: "vtabs-tab-tone", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
	}
	// Structural keys only — do not steal tab-body prose / lists / nested authoring.
	const trimmed = line.trim();
	if (!trimmed || /^(POSITION|ALIGN|TAB)\b/i.test(trimmed) || /^[A-Za-z]+$/.test(trimmed)) {
		const q = queryFrom(line, cursor.ch);
		return { kind: "vtabs-key", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
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

	// Innermost fence (e.g. ```oculus inside ````v-tabs).
	if (fence?.lang === "oculus") {
		return detectOculusSuggest(editor, cursor);
	}

	// Inline `v-card` / `q=` must win over a surrounding v-tabs fence (Carl nesting).
	const inline = detectInlineSuggest(editor, cursor, options);
	if (inline) return inline;

	if (fence?.lang === "v-tabs") {
		return detectVtabsSuggest(editor, cursor);
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
		if (key === "calendar" || key === "cal") {
			const q = queryFrom(line, cursor.ch);
			return { kind: "epochs-calendar", start: { line: cursor.line, ch: q.startCh }, end: cursor, query: q.query };
		}
	}

	return null;
}
