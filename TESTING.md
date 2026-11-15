# Augur — manual test checklist

Reload Obsidian after `bash build.sh`. Enable **Augur**. Companions can stay enabled.

## Commands

- [ ] **Insert Oculus gallery** opens the builder; Browse adds a Local path; Insert pastes an `oculus` fence
- [ ] Drag a folder from the path browser onto the builder source list
- [ ] Recursive checkbox writes a trailing `/`
- [ ] **Insert Visage tabs** pastes a 4-backtick `v-tabs` block with `POSITION` / `ALIGN`, a blank line, then `TAB:` entries (no `OPTIONS:` / `TABS:`)
- [ ] **Pick vault folder** / **Pick vault file** insert a vault-relative path at the cursor

## Suggestions

- [ ] Inside `` `q= ` ``, functions and frontmatter keys appear
- [ ] With Epochs enabled and calendars indexed, `` `q= ` `` offers `date("id:")` / calendar id snippets
- [ ] Inside `` `q= date(" ` ``, calendar ids / `id:year-…` forms appear (empty when Epochs is off)
- [ ] YAML `calendar:` / `cal:` under a fantasy date object suggests Epochs calendar ids
- [ ] Inside an `oculus` fence, `VIEW` / `LOCAL` and media paths appear
- [ ] On `XIEWER:` (and indented XIEWER lines), `tag:`, `kind:image`, `collection:`, booleans appear — not vault paths
- [ ] Accepting a suggestion leaves the cursor after the insert (inside `()` / before `date("…")` close when applicable) — not at the start
- [ ] After `` `v-card` ``, span/rows/layout/tone bags appear
- [ ] In a Dictionary file, flags and `# Term {Plural}` appear
- [ ] Under `lexicon-context:` in YAML, dictionary paths appear

## Automated

```bash
node test/suggest-context.test.mjs
```

## Companions

- [ ] Oculus no longer lists **Insert Oculus gallery**
- [ ] Visage no longer lists **Insert Visage tabs**
- [ ] Path Picker is disabled; Augur path commands work without it

## Build

```bash
cd .obsidian/plugins/augur
bash build.sh
```
