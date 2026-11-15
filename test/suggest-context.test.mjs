/**
 * Lightweight Node tests for suggest trigger helpers (no Obsidian runtime).
 * Run: node test/suggest-context.test.mjs
 *
 * Mirrors the pure helpers in src/suggest/context.ts — keep in sync when changing detection.
 */

function assert(cond, msg) {
	if (!cond) {
		console.error("FAIL:", msg);
		process.exitCode = 1;
	} else {
		console.log("ok:", msg);
	}
}

function inGrimoireDateString(inlineTextBeforeCursor) {
	return /date\s*\(\s*"[^"]*$/i.test(inlineTextBeforeCursor);
}

function keyValue(line) {
	const match = /^(\s*)(?:- )?([A-Za-z]+):\s*(.*)$/.exec(line);
	if (!match) return null;
	return { key: (match[2] ?? "").toUpperCase(), value: match[3] ?? "" };
}

function isIndented(line) {
	return /^(\t| {2,})\S/.test(line);
}

const MEDIA_KEYS = new Set(["LOCAL", "SEARCH", "URL", "XIEWER"]);

function parentOculusMediaKey(lines, lineIndex) {
	const line = lines[lineIndex] ?? "";
	const current = keyValue(line);
	if (current && MEDIA_KEYS.has(current.key)) return current.key;
	if (!isIndented(line)) return null;
	for (let i = lineIndex - 1; i >= 0; i--) {
		const prev = lines[i] ?? "";
		if (!prev.trim()) continue;
		if (isIndented(prev)) continue;
		const kv = keyValue(prev);
		if (!kv) return null;
		if (MEDIA_KEYS.has(kv.key)) return kv.key;
		return null;
	}
	return null;
}

assert(inGrimoireDateString(' date("aether'), "open date string");
assert(inGrimoireDateString('date( "spiral:1'), "date with space before quote");
assert(!inGrimoireDateString(' date("aether:1") + 1'), "closed date string");
assert(!inGrimoireDateString(" dateformat(x"), "not a date string");

assert(parentOculusMediaKey(["XIEWER: tag:hero"], 0) === "XIEWER", "XIEWER key line");
assert(parentOculusMediaKey(["XIEWER:", "\ttag:hero"], 1) === "XIEWER", "indented under XIEWER");
assert(parentOculusMediaKey(["LOCAL:", "\tArt/"], 1) === "LOCAL", "indented under LOCAL");
assert(parentOculusMediaKey(["XIEWER: a", "VIEW"], 1) === null, "incomplete top-level key");
assert(parentOculusMediaKey(["VIEW: grid", "\tArt/"], 1) === null, "indented under non-media");
assert(keyValue("XIEWER: tag:hero kind:image")?.key === "XIEWER", "parse XIEWER key");

/** Mirrors cursorOffsetAfterInsert in src/suggest/editorSuggest.ts */
function cursorOffsetAfterInsert(insert) {
	const emptyParen = insert.indexOf("()");
	if (emptyParen !== -1) return emptyParen + 1;
	if (insert.endsWith('")')) return insert.length - 2;
	return insert.length;
}

assert(cursorOffsetAfterInsert("tag:") === 4, "cursor at end of tag:");
assert(cursorOffsetAfterInsert("default()") === 8, "cursor inside default()");
assert(cursorOffsetAfterInsert('date("aether:")') === 13, "cursor inside date stub before quote close");
assert(cursorOffsetAfterInsert("AS card") === 7, "cursor at end of AS style");
assert(cursorOffsetAfterInsert("kind:image") === 10, "cursor at end of kind value");

if (!process.exitCode) console.log("suggest-context.test.mjs: all passed");
