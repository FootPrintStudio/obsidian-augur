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
- [ ] Inside an `oculus` fence, `VIEW` / `LOCAL` and media paths appear
- [ ] After `` `v-card` ``, span/layout/tone bags appear
- [ ] In a Dictionary file, flags and `# Term {Plural}` appear
- [ ] Under `lexicon-context:` in YAML, dictionary paths appear

## Companions

- [ ] Oculus no longer lists **Insert Oculus gallery**
- [ ] Visage no longer lists **Insert Visage tabs**
- [ ] Path Picker is disabled; Augur path commands work without it

## Build

```bash
cd .obsidian/plugins/augur
bash build.sh
```
