# Augur — Guide

Augur is the authoring companion for **Grimoire**, **Oculus**, **Visage**, and **Lexicon Nexus**. Those plugins still render the results. Augur inserts blocks, picks vault paths, and suggests syntax while you type.

---

## Insert Oculus gallery

Command palette: **Insert Oculus gallery**.

The builder has three sections:

1. **Layout** — view (`grid`, `thumbnails`, `carousel`, `masonry-h`, `masonry-v`), filter (`all`, `images`, `video`), optional **Limit** (SEARCH/XIEWER), and optional **Sort**. Defaults come from Oculus settings when Oculus is enabled.
2. **Media sources** — Local, Search, Xiewer, URL, or YouTube cards. Drag cards to reorder. **Browse vault** or the per-card **Browse** button opens the path browser. Drop a vault file/folder onto the source list to add a Local card.
3. **Block preview** — live `oculus` body. Copy or **Insert at cursor**.

Folder paths ending in `/` are recursive. That trailing slash is the Oculus recursion flag.

---

## Insert Visage tabs

Command palette: **Insert Visage tabs**.

Pastes a **4-backtick** outer fence so tab bodies can contain ` ``` ` code. Position, align, and default titles come from Visage settings when Visage is enabled. The template omits `OPTIONS:` / `TABS:` — those headers are parse errors in Visage.

---

## Vault path browser

Commands: **Pick vault folder** and **Pick vault file**.

- Always vault-relative POSIX paths
- Switch Folders / Files in the toolbar
- **Recursive folder (/)** appends `/` for Oculus `LOCAL:` / `SEARCH:` scans
- Drag a row onto the Oculus builder source list
- Preview shows folder children, images, or file text

This replaces Path Picker for Oculus authoring. It does not browse the OS filesystem.

---

## As-you-type suggestions

| Where | Suggestions |
|-------|-------------|
| `` `q= …` `` | Grimoire functions, `file.*`, current-note frontmatter keys, `AS` styles (`card`, `tag`, `button`, `cards-code`, `inline`, `list`) |
| ` ```oculus ` | `VIEW` `FILTER` `LIMIT` `SORT` `LOCAL` `URL` `SEARCH` `XIEWER`, view/filter/sort values, vault media paths |
| `v-tabs` fence | `POSITION` `ALIGN` `TAB` and enums |
| List `` `v-card` `` | `{span=…}` `{layout=…}` `{tone=…}` |
| Lexicon dictionary folder | Header / alias templates and requirement flags |
| YAML `lexicon-context:` | Paths under the dictionary folder |

If a companion plugin is disabled, static vocabulary still completes. Live prefix, frontmatter keys, and dictionary folder fall back to Augur settings.

---

## Settings fallbacks

Used only when the matching companion is not enabled:

| Setting | Default |
|---------|---------|
| Default Oculus view / filter | `grid` / `all` |
| Default Visage tab position / align / titles | `top` / `left` / Tab 1 / Tab 2 |
| Grimoire prefix | `q=` |
| Lexicon folder | `Dictionary` |
