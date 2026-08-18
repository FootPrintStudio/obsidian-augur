import type { GalleryViewType, MediaFilter } from "../types";

const DEFAULT_COLUMN_OPTION = "auto";

type MediaKey = "LOCAL" | "SEARCH" | "URL";

export type FormattedMediaSource =
	| { kind: "local"; path: string; recursive?: boolean; caption?: string }
	| { kind: "search"; path: string; recursive?: boolean; queries: string[] }
	| { kind: "url"; url: string; caption?: string };

function formatViewLine(options: {
	view: GalleryViewType;
	gridColumns?: string;
	thumbnailColumns?: string;
	carouselHeightPx?: number | null;
	carouselShowThumbnails?: boolean;
	masonryRowHeightPx?: number | null;
	masonryColumnWidth?: string;
}): string {
	if (options.view === "grid") {
		const columns = (options.gridColumns ?? DEFAULT_COLUMN_OPTION).trim();
		if (columns && columns.toLowerCase() !== "auto") return `VIEW: grid | ${columns}`;
		return "VIEW: grid";
	}
	if (options.view === "thumbnails") {
		const columns = (options.thumbnailColumns ?? DEFAULT_COLUMN_OPTION).trim();
		if (columns && columns.toLowerCase() !== "auto") return `VIEW: thumbnails | ${columns}`;
		return "VIEW: thumbnails";
	}
	if (options.view === "carousel") {
		const parts: string[] = [];
		if (options.carouselHeightPx != null) parts.push(`${options.carouselHeightPx}px`);
		if (options.carouselShowThumbnails) parts.push("show");
		if (parts.length > 0) return `VIEW: carousel | ${parts.join(", ")}`;
		return "VIEW: carousel";
	}
	if (options.view === "masonry-h" && options.masonryRowHeightPx != null) {
		return `VIEW: masonry-h | ${options.masonryRowHeightPx}px`;
	}
	if (options.view === "masonry-v") {
		const columns = (options.masonryColumnWidth ?? DEFAULT_COLUMN_OPTION).trim();
		if (columns && columns.toLowerCase() !== "auto") return `VIEW: masonry-v | ${columns}`;
		return "VIEW: masonry-v";
	}
	return `VIEW: ${options.view}`;
}

function formatSourceValue(source: FormattedMediaSource): string {
	if (source.kind === "local") {
		let path = source.path.replace(/\/+$/, "");
		if (source.recursive) path = `${path}/`;
		return source.caption ? `${path} | ${source.caption}` : path;
	}
	if (source.kind === "search") {
		let path = source.path.replace(/\/+$/, "");
		if (source.recursive) path = `${path}/`;
		const queries = source.queries.map((query) => query.trim());
		if (queries.length === 0 || queries.some((query) => !query)) {
			throw new Error("SEARCH sources require one or more non-empty queries.");
		}
		return `${path} | ${queries.join(", ")}`;
	}
	return source.caption ? `${source.url} | ${source.caption}` : source.url;
}

function sourceKey(kind: FormattedMediaSource["kind"]): MediaKey {
	if (kind === "local") return "LOCAL";
	if (kind === "search") return "SEARCH";
	return "URL";
}

export function formatMediaGalleryBlock(options: {
	view: GalleryViewType;
	filter: MediaFilter;
	gridColumns?: string;
	thumbnailColumns?: string;
	carouselHeightPx?: number | null;
	carouselShowThumbnails?: boolean;
	masonryRowHeightPx?: number | null;
	masonryColumnWidth?: string;
	sources: FormattedMediaSource[];
}): string {
	const lines: string[] = [formatViewLine(options), `FILTER: ${options.filter}`];
	let index = 0;
	const sources = options.sources;
	while (index < sources.length) {
		const first = sources[index];
		if (!first) break;
		const kind = first.kind;
		const group: FormattedMediaSource[] = [];
		while (index < sources.length && sources[index]?.kind === kind) {
			const item = sources[index];
			if (item) group.push(item);
			index += 1;
		}
		const key = sourceKey(kind);
		if (group.length === 1 && group[0]) {
			lines.push(`${key}: ${formatSourceValue(group[0])}`);
			continue;
		}
		lines.push(`${key}:`);
		for (const item of group) lines.push(`\t${formatSourceValue(item)}`);
	}
	return lines.join("\n");
}
