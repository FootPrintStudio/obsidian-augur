export const GRIMOIRE_FUNCTIONS = [
	{ label: "default()", insert: "default()", detail: "value, fallback" },
	{
		label: "choice()",
		insert: "choice(cond, {ifTrue, ifFalse})",
		detail: "cond, {ifTrue, ifFalse} — or {ifTrue} true-only",
	},
	{ label: "select()", insert: "select()", detail: "key, {k, v}, …" },
	{
		label: "any()",
		insert: "any(value, {ifTrue, ifFalse})",
		detail: "value…, {ifTrue, ifFalse} — or boolean without brace",
	},
	{
		label: "exists()",
		insert: "exists(value, {ifTrue, ifFalse})",
		detail: "value, {ifTrue, ifFalse} — or boolean without brace",
	},
	{
		label: "contains()",
		insert: "contains({hay, needle}, {ifTrue, ifFalse})",
		detail: "{hay, needle}, {ifTrue, ifFalse}",
	},
	{
		label: "econtains()",
		insert: "econtains({hay, needle}, {ifTrue, ifFalse})",
		detail: "{hay, needle}, {ifTrue, ifFalse}",
	},
	{ label: "slice()", insert: "slice()", detail: "list, start, end?" },
	{ label: "dateformat()", insert: "dateformat()", detail: "date, format" },
	{ label: "durationformat()", insert: "durationformat()", detail: "dur, format?" },
	{ label: "age()", insert: "age()", detail: "date, format?" },
	{ label: "numberformat()", insert: "numberformat()", detail: "n, pattern" },
	{ label: "conv()", insert: "conv()", detail: "value, fromUnit, toUnit" },
	{
		label: "inRange()",
		insert: "inRange({value, low, high}, {below, inBand, above})",
		detail: "number | date | duration → {below, in, above}",
	},
	{ label: "date()", insert: "date()", detail: "string | now | today" },
	{ label: "dur()", insert: "dur()", detail: "n, unit or text" },
	{ label: "length()", insert: "length()", detail: "value" },
	{ label: "coalesce()", insert: "coalesce()", detail: "a, b, …" },
	{ label: "join()", insert: "join()", detail: "list, sep" },
	{ label: "lower()", insert: "lower()", detail: "string → lowercase" },
	{ label: "upper()", insert: "upper()", detail: "string → uppercase" },
	{ label: "replace()", insert: "replace()", detail: "hay, needle, replacement" },
	{ label: "round()", insert: "round()", detail: "n, digits?" },
	{ label: "abs()", insert: "abs()", detail: "n" },
] as const;

/** Cross-note wiki / link-pass / `@` snippets (Grimoire 0.9.7+ / 0.9.8+). */
export const GRIMOIRE_CROSS_NOTE = [
	{
		label: "[[Note]].field",
		insert: "[[Note]].field",
		detail: "Bare wiki page member (cross-note)",
	},
	{
		label: "[[Note]].file.mtime",
		insert: "[[Note]].file.mtime",
		detail: "Cross-note file metadata",
	},
	{
		label: "parent.title",
		insert: "parent.title",
		detail: "Link-valued property auto-pass",
	},
	{
		label: "links.title[0]",
		insert: "links.title[0]",
		detail: "List-of-links field + index",
	},
	{
		label: "links.title[0,1]",
		insert: "links.title[0,1]",
		detail: "List-of-links multi-index",
	},
	{
		label: '@({from("Folder")})',
		insert: '@({from("Folder")})',
		detail: "Multi-note from folder (quoted path)",
	},
	{
		label: '@({from("Folder")}, {!this.file})',
		insert: '@({from("Folder")}, {!this.file, exists(title)})',
		detail: "Where brace with !this.file exclude",
	},
	{
		label: "@({from}, {where}, {map})",
		insert: '@({from("Folder")}, {!this.file}, {this.file.name + " → " + title})',
		detail: "from + where + map (this = source)",
	},
	{
		label: '@({from("*")})',
		insert: '@({from("*")}, {exists(title)}, {title})',
		detail: "Vault-wide from(*) — prefer folder scope",
	},
	{
		label: "@ map AS pill",
		insert: '@({from("Characters")}, {any(status)}, {(status AS pill)})',
		detail: "Per-page AS style in map brace",
	},
] as const;

export const GRIMOIRE_FILE_FIELDS = [
	"file.name",
	"file.path",
	"file.folder",
	"file.ctime",
	"file.mtime",
	"file.size",
	"file.tags",
];

export const GRIMOIRE_STYLES = [
	"card",
	"cards",
	"tag",
	"tags",
	"button",
	"buttons",
	"cards-code",
	"code",
	"inline",
	"list",
	"badge",
	"pill",
	"callout",
	"progress",
	"meter",
	"stars",
	"image",
	"img",
	"wiki",
	"wikilink",
];

export const OCULUS_KEYS = ["VIEW:", "FILTER:", "LIMIT:", "SORT:", "LOCAL:", "URL:", "SEARCH:", "XIEWER:"];
export const OCULUS_VIEWS = ["grid", "thumbnails", "carousel", "masonry-h", "masonry-v"];
export const OCULUS_FILTERS = ["all", "images", "video"];
export const OCULUS_SORTS = ["name ASC", "name DSC", "date ASC", "date DSC", "random"];

/** Static CollectionXiewer searchParser operators (mirrors collectionxiewer/src/shared/searchParser.ts). */
export const XIEWER_CLAUSES = [
	{ label: "tag:", insert: "tag:", detail: "Media with tag (descendants included)" },
	{ label: "-tag:", insert: "-tag:", detail: "Without tag" },
	{ label: "suggested:", insert: "suggested:", detail: "Soft-linked suggestion tag" },
	{ label: "collection:", insert: 'collection:"', detail: "Collection membership (quote names)" },
	{ label: "principal:", insert: "principal:", detail: "Principal tag on a collection" },
	{ label: "folder:", insert: 'folder:"', detail: "Under a watch-folder root" },
	{ label: "name:", insert: "name:", detail: "Path/filename glob (* ?)" },
	{ label: "untagged:", insert: "untagged:", detail: "Media with no tags" },
	{ label: "kind:image", insert: "kind:image", detail: "Still images" },
	{ label: "kind:motion", insert: "kind:motion", detail: "GIF / APNG motion" },
	{ label: "kind:video", insert: "kind:video", detail: "Video files" },
	{ label: "AND", insert: "AND", detail: "Boolean AND (optional; space is AND)" },
	{ label: "OR", insert: "OR", detail: "Boolean OR" },
	{ label: "NOT", insert: "NOT", detail: "Boolean NOT" },
	{ label: "@subject", insert: "@subject", detail: "Same subject group on tag clauses" },
	{ label: "@subject:2", insert: "@subject:2", detail: "Named subject group number" },
] as const;

export const XIEWER_KIND_VALUES = ["image", "motion", "video"] as const;

export const VTABS_KEYS = ["POSITION:", "ALIGN:", "TAB:"];
export const VTABS_POSITIONS = ["top", "bottom", "left", "right"];
export const VTABS_ALIGNS = ["left", "right", "center", "justify"];

export const VCARD_BAGS = [
	{ label: "{span=2}", insert: "{span=2}", detail: "Fixed 2/8 of the row" },
	{ label: "{span=3}", insert: "{span=3}", detail: "Fixed 3/8 of the row" },
	{ label: "{span=4}", insert: "{span=4}", detail: "Fixed 4/8 of the row" },
	{ label: "{span=full}", insert: "{span=full}", detail: "Own row" },
	{ label: "{span=fill}", insert: "{span=fill}", detail: "Share leftover columns" },
	{ label: "{rows=2}", insert: "{rows=2}", detail: "Span 2 mosaic row tracks" },
	{ label: "{rows=3}", insert: "{rows=3}", detail: "Span 3 mosaic row tracks" },
	{ label: "{rows=4}", insert: "{rows=4}", detail: "Span 4 mosaic row tracks" },
	{ label: "{rows=8}", insert: "{rows=8}", detail: "Span 8 mosaic row tracks" },
	{ label: "{layout=hero}", insert: "{layout=hero}", detail: "Bleed first image" },
	{ label: "{layout=inline}", insert: "{layout=inline}", detail: "Subcard row" },
	{ label: "{layout=footer}", insert: "{layout=footer}", detail: "Pin nested list" },
	{ label: "{tone=note}", insert: "{tone=note}" },
	{ label: "{tone=tip}", insert: "{tone=tip}" },
	{ label: "{tone=warning}", insert: "{tone=warning}" },
	{ label: "{tone=danger}", insert: "{tone=danger}" },
	{ label: "{tone=success}", insert: "{tone=success}" },
	{ label: "{tone=neutral}", insert: "{tone=neutral}" },
	{ label: "{border=none}", insert: "{border=none}", detail: "Borderless card" },
];

export const VTABS_TONE_BAGS = [
	{ label: "{tone=note}", insert: "{tone=note}" },
	{ label: "{tone=tip}", insert: "{tone=tip}" },
	{ label: "{tone=warning}", insert: "{tone=warning}" },
	{ label: "{tone=danger}", insert: "{tone=danger}" },
	{ label: "{tone=success}", insert: "{tone=success}" },
	{ label: "{tone=neutral}", insert: "{tone=neutral}" },
];

export const LEXICON_FLAGS = [
	"None",
	"Case",
	"Whole",
	"Partial",
	"Priority: 10",
	"Draft",
	"Global",
	"NoHighlight",
	"NoLink",
	"NoCode",
	"Plain",
	"Once",
	"NoSpace",
];

export const LEXICON_TEMPLATES = [
	{ label: "# Term {Plural}", insert: "# Term {Plural}", detail: "Dictionary header" },
	{ label: "[Alias {Plural}]", insert: "[Alias {Plural}]", detail: "Alias line" },
	{ label: "---", insert: "---", detail: "Entry divider" },
];
