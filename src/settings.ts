import { App, Component, PluginSettingTab, Setting } from "obsidian";
import type AugurPlugin from "./main";
import {
	renderGuidePanel,
	renderReadmePanel,
	renderSettingsTabBar,
	type PluginSettingsTabId,
} from "./readmeTab";
import { DEFAULT_SETTINGS, MEDIA_FILTERS, TAB_ALIGNS, TAB_POSITIONS, VIEW_TYPES } from "./types";

export class AugurSettingTab extends PluginSettingTab {
	plugin: AugurPlugin;
	private activeTab: PluginSettingsTabId = "settings";
	private readmeComponent = new Component();

	constructor(app: App, plugin: AugurPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	hide(): void {
		this.readmeComponent.unload();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.readmeComponent.unload();
		this.readmeComponent = new Component();

		containerEl.createEl("h2", { text: "Augur" });

		const tabBar = containerEl.createDiv();
		renderSettingsTabBar(tabBar, this.activeTab, (tab) => {
			this.activeTab = tab;
			this.display();
		}, "augur");

		const content = containerEl.createDiv({ cls: "augur-settings-content" });
		const pluginDir =
			this.plugin.manifest.dir ?? `${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}`;

		if (this.activeTab === "readme") {
			renderReadmePanel(this.app, content, this.readmeComponent, "augur-readme-panel", pluginDir);
			return;
		}
		if (this.activeTab === "guide") {
			renderGuidePanel(this.app, content, this.readmeComponent, "augur-guide-panel", pluginDir);
			return;
		}

		content.createEl("p", {
			text: "Fallbacks used when Grimoire, Oculus, Visage, or Lexicon Nexus are not enabled. Live companion settings win when those plugins are loaded.",
		});

		new Setting(content)
			.setName("Default Oculus view")
			.addDropdown((dropdown) => {
				for (const view of VIEW_TYPES) dropdown.addOption(view, view);
				dropdown.setValue(this.plugin.settings.defaultView).onChange(async (value) => {
					this.plugin.settings.defaultView = value as typeof DEFAULT_SETTINGS.defaultView;
					await this.plugin.saveSettings();
				});
			});

		new Setting(content)
			.setName("Default Oculus filter")
			.addDropdown((dropdown) => {
				for (const filter of MEDIA_FILTERS) dropdown.addOption(filter, filter);
				dropdown.setValue(this.plugin.settings.defaultFilter).onChange(async (value) => {
					this.plugin.settings.defaultFilter = value as typeof DEFAULT_SETTINGS.defaultFilter;
					await this.plugin.saveSettings();
				});
			});

		new Setting(content)
			.setName("Default Visage tab position")
			.addDropdown((dropdown) => {
				for (const value of TAB_POSITIONS) dropdown.addOption(value, value);
				dropdown.setValue(this.plugin.settings.defaultTabPosition).onChange(async (value) => {
					this.plugin.settings.defaultTabPosition = value as typeof DEFAULT_SETTINGS.defaultTabPosition;
					await this.plugin.saveSettings();
				});
			});

		new Setting(content)
			.setName("Default Visage tab align")
			.addDropdown((dropdown) => {
				for (const value of TAB_ALIGNS) dropdown.addOption(value, value);
				dropdown.setValue(this.plugin.settings.defaultTabAlign).onChange(async (value) => {
					this.plugin.settings.defaultTabAlign = value as typeof DEFAULT_SETTINGS.defaultTabAlign;
					await this.plugin.saveSettings();
				});
			});

		new Setting(content)
			.setName("Default first tab title")
			.addText((text) =>
				text.setValue(this.plugin.settings.defaultTabTitle1).onChange(async (value) => {
					this.plugin.settings.defaultTabTitle1 = value.trim() || DEFAULT_SETTINGS.defaultTabTitle1;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(content)
			.setName("Default second tab title")
			.addText((text) =>
				text.setValue(this.plugin.settings.defaultTabTitle2).onChange(async (value) => {
					this.plugin.settings.defaultTabTitle2 = value.trim() || DEFAULT_SETTINGS.defaultTabTitle2;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(content)
			.setName("Grimoire prefix fallback")
			.setDesc("Used for autocomplete when Grimoire is not enabled.")
			.addText((text) =>
				text.setValue(this.plugin.settings.grimoirePrefix).onChange(async (value) => {
					this.plugin.settings.grimoirePrefix = value || DEFAULT_SETTINGS.grimoirePrefix;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(content)
			.setName("Lexicon folder fallback")
			.setDesc("Used for dictionary autocomplete when Lexicon Nexus is not enabled.")
			.addText((text) =>
				text.setValue(this.plugin.settings.lexiconFolder).onChange(async (value) => {
					this.plugin.settings.lexiconFolder = value.trim() || DEFAULT_SETTINGS.lexiconFolder;
					await this.plugin.saveSettings();
				}),
			);
	}
}
