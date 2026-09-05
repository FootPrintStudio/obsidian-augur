# Augur

Authoring companion for FootPrintStudio’s [Obsidian](https://obsidian.md) plugins: **Grimoire**, **Oculus**, **Visage**, and **Lexicon Nexus**. Augur does not render galleries, cards, queries, or lexicon highlights. It helps you **write** their syntax.

Repository: [FootPrintStudio/obsidian-augur](https://github.com/FootPrintStudio/obsidian-augur)

## Commands

| Command | What it does |
|---------|----------------|
| **Insert Oculus gallery** | Builder modal for `oculus` fences, with vault browse/drag |
| **Insert Visage tabs** | Pastes a 4-backtick `v-tabs` template |
| **Pick vault folder** | Insert a vault-relative folder path (optional trailing `/`) |
| **Pick vault file** | Insert a vault-relative file path |

As-you-type suggestions fire inside `q=` queries (including Grimoire `AS` styles such as `card` and `tag`), `oculus` / `v-tabs` fences, `v-card` markers, Lexicon dictionary files, and `lexicon-context` YAML.

## Install (BRAT)

1. Enable **BRAT**.
2. **Add Beta plugin** → `FootPrintStudio/obsidian-augur`
3. Enable **Augur** and reload Obsidian.

Also enable the companion plugins you use (Oculus, Visage, Grimoire, Lexicon Nexus). Augur reads their settings when they are loaded.

## From source

```bash
cd /path/to/vault/.obsidian/plugins
git clone https://github.com/FootPrintStudio/obsidian-augur.git augur
cd augur
bash build.sh
```

## License

MIT — see [LICENSE](LICENSE).
