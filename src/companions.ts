import type { App, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	type AugurSettings,
	type GalleryViewType,
	type MediaFilter,
	type TabAlign,
	type TabPosition,
} from "./types";

export const OCULUS_ID = "oculus";
export const VISAGE_ID = "visage";
export const GRIMOIRE_ID = "grimoire";
export const LEXICON_ID = "lexicon-nexus";
export const MEDIA_EXTENDED_ID = "media-extended";

type AppWithPlugins = App & {
	plugins: { enabledPlugins: Set<string>; plugins: Record<string, Plugin & { settings?: Record<string, unknown> }> };
};

function pluginsApi(app: App): AppWithPlugins["plugins"] | null {
	return (app as AppWithPlugins).plugins ?? null;
}

export function isPluginEnabled(app: App, id: string): boolean {
	const plugins = pluginsApi(app);
	return Boolean(plugins?.enabledPlugins.has(id) && plugins.plugins[id]);
}

function companionSettings(app: App, id: string): Record<string, unknown> | null {
	if (!isPluginEnabled(app, id)) return null;
	return pluginsApi(app)?.plugins[id]?.settings ?? null;
}

export function isMediaExtendedAvailable(app: App): boolean {
	return isPluginEnabled(app, MEDIA_EXTENDED_ID);
}

export function resolveOculusDefaults(app: App, fallback: AugurSettings): {
	view: GalleryViewType;
	filter: MediaFilter;
} {
	const settings = companionSettings(app, OCULUS_ID);
	const view = settings?.defaultView;
	const filter = settings?.defaultFilter;
	return {
		view: typeof view === "string" ? (view as GalleryViewType) : fallback.defaultView,
		filter: typeof filter === "string" ? (filter as MediaFilter) : fallback.defaultFilter,
	};
}

export function resolveVisageDefaults(app: App, fallback: AugurSettings): {
	defaultPosition: TabPosition;
	defaultAlign: TabAlign;
	defaultTabTitle1: string;
	defaultTabTitle2: string;
} {
	const settings = companionSettings(app, VISAGE_ID);
	return {
		defaultPosition:
			typeof settings?.defaultPosition === "string"
				? (settings.defaultPosition as TabPosition)
				: fallback.defaultTabPosition,
		defaultAlign:
			typeof settings?.defaultAlign === "string"
				? (settings.defaultAlign as TabAlign)
				: fallback.defaultTabAlign,
		defaultTabTitle1:
			typeof settings?.defaultTabTitle1 === "string"
				? settings.defaultTabTitle1
				: fallback.defaultTabTitle1,
		defaultTabTitle2:
			typeof settings?.defaultTabTitle2 === "string"
				? settings.defaultTabTitle2
				: fallback.defaultTabTitle2,
	};
}

export function resolveGrimoirePrefix(app: App, fallback: string): string {
	const settings = companionSettings(app, GRIMOIRE_ID);
	const prefix = settings?.inlinePrefix;
	if (typeof prefix === "string" && prefix.trim()) return prefix;
	return fallback || DEFAULT_SETTINGS.grimoirePrefix;
}

export function resolveLexiconFolder(app: App, fallback: string): string {
	const settings = companionSettings(app, LEXICON_ID);
	const folder = settings?.dictionaryFolder;
	if (typeof folder === "string" && folder.trim()) return folder.replace(/\/+$/, "");
	return fallback.replace(/\/+$/, "") || DEFAULT_SETTINGS.lexiconFolder;
}

export function frontmatterKeys(app: App, file: TFile | null): string[] {
	if (!file) return [];
	const cache = app.metadataCache.getFileCache(file);
	const fm = cache?.frontmatter;
	if (!fm) return [];
	return Object.keys(fm).filter((key) => key !== "position");
}
