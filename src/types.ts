export type GalleryViewType = "grid" | "thumbnails" | "carousel" | "masonry-h" | "masonry-v";
export type MediaFilter = "images" | "video" | "all";
export type TabPosition = "top" | "bottom" | "left" | "right";
export type TabAlign = "left" | "right" | "center" | "justify";

export interface AugurSettings {
	defaultView: GalleryViewType;
	defaultFilter: MediaFilter;
	defaultTabPosition: TabPosition;
	defaultTabAlign: TabAlign;
	defaultTabTitle1: string;
	defaultTabTitle2: string;
	grimoirePrefix: string;
	lexiconFolder: string;
}

export const DEFAULT_SETTINGS: AugurSettings = {
	defaultView: "grid",
	defaultFilter: "all",
	defaultTabPosition: "top",
	defaultTabAlign: "left",
	defaultTabTitle1: "Tab 1",
	defaultTabTitle2: "Tab 2",
	grimoirePrefix: "q=",
	lexiconFolder: "Dictionary",
};

export const VIEW_TYPES: GalleryViewType[] = [
	"grid",
	"thumbnails",
	"carousel",
	"masonry-h",
	"masonry-v",
];

export const MEDIA_FILTERS: MediaFilter[] = ["images", "video", "all"];
export const TAB_POSITIONS: TabPosition[] = ["top", "bottom", "left", "right"];
export const TAB_ALIGNS: TabAlign[] = ["left", "right", "center", "justify"];

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
export const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);
export const MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export const AUGUR_PATH_MIME = "application/x-augur-path";
