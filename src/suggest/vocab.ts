export const GRIMOIRE_FUNCTIONS = [
	{ label: "default()", insert: "default()", detail: "value, fallback" },
	{ label: "choice()", insert: "choice()", detail: "cond, ifTrue, ifFalse" },
	{ label: "select()", insert: "select()", detail: "key, {k, v}, …" },
	{ label: "any()", insert: "any()", detail: "value or hay, candidates" },
	{ label: "contains()", insert: "contains()", detail: "hay, needle" },
	{ label: "econtains()", insert: "econtains()", detail: "hay, needle" },
	{ label: "slice()", insert: "slice()", detail: "list, start, end?" },
	{ label: "dateformat()", insert: "dateformat()", detail: "date, format" },
	{ label: "durationformat()", insert: "durationformat()", detail: "dur, format?" },
	{ label: "date()", insert: "date()", detail: "string | now | today" },
	{ label: "dur()", insert: "dur()", detail: "n, unit or text" },
	{ label: "length()", insert: "length()", detail: "value" },
	{ label: "coalesce()", insert: "coalesce()", detail: "a, b, …" },
	{ label: "join()", insert: "join()", detail: "list, sep" },
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

export const GRIMOIRE_STYLES = ["card", "cards", "button", "buttons", "cards-code", "code", "inline", "list"];

export const OCULUS_KEYS = ["VIEW:", "FILTER:", "LOCAL:", "URL:", "SEARCH:"];
export const OCULUS_VIEWS = ["grid", "thumbnails", "carousel", "masonry-h", "masonry-v"];
export const OCULUS_FILTERS = ["all", "images", "video"];

export const VTABS_KEYS = ["OPTIONS:", "TABS:", "POSITION:", "ALIGN:", "TAB:"];
export const VTABS_POSITIONS = ["top", "bottom", "left", "right"];
export const VTABS_ALIGNS = ["left", "right", "center", "justify"];

export const VCARD_BAGS = [
	{ label: "{span=2}", insert: "{span=2}", detail: "Fixed 2/8 of the row" },
	{ label: "{span=3}", insert: "{span=3}", detail: "Fixed 3/8 of the row" },
	{ label: "{span=4}", insert: "{span=4}", detail: "Fixed 4/8 of the row" },
	{ label: "{span=full}", insert: "{span=full}", detail: "Own row" },
	{ label: "{span=fill}", insert: "{span=fill}", detail: "Share leftover space" },
	{ label: "{layout=hero}", insert: "{layout=hero}", detail: "Bleed first image" },
	{ label: "{layout=inline}", insert: "{layout=inline}", detail: "Subcard row" },
	{ label: "{layout=footer}", insert: "{layout=footer}", detail: "Pin nested list" },
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
