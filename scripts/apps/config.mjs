import * as C from "../const.mjs";
import { Realm } from "../customizables/realms.mjs";
import { Terrain } from "../customizables/terrain.mjs";
import { Travel } from "../customizables/travel.mjs";
import { Feature } from "../customizables/features.mjs";
import { Resource, RESOURCE_CATEGORIES, RESOURCE_KINDS } from "../customizables/resources.mjs";
import { Improvement } from "../customizables/improvements.mjs";
import { Building } from "../customizables/buildings.mjs";
import { SettlementSize } from "../customizables/settlement-sizes.mjs";
import { addAmounts, GROUP_PREFIX } from "../economy/engine.mjs";
import { PLAYER_REALM_SETTING } from "../economy/realm-store.mjs";
import { TEMPLATES } from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Everything configurable, by tab.
 * setting: world setting, source: current definitions, blank: new entry,
 * amounts: fields holding {resourceId: amount} maps, numbers: numeric fields.
 */
const CATEGORIES = {
    realms: {
        icon: C.ICONS.realm, setting: "Realm", source: () => chex.realms, defaults: () => Realm.getDefaults(),
        blank: id => new Realm(id, "", "#888888")
    },
    terrains: {
        icon: C.ICONS.terrain, setting: "Terrain", source: () => chex.terrains, defaults: () => Terrain.getDefaults(),
        blank: id => new Terrain(id, "", "icons/svg/mountain.svg", Object.keys(chex.travels)[0] ?? "", "#888888")
    },
    travels: {
        icon: C.ICONS.travel, setting: "Travel", source: () => chex.travels, defaults: () => Travel.getDefaults(),
        blank: id => new Travel(id, "", 1, "#888888", false), numbers: ["multiplier"]
    },
    features: {
        icon: C.ICONS.feature, setting: "Feature", source: () => chex.features, defaults: () => Feature.getDefaults(),
        blank: id => new Feature(id, "", "icons/svg/waterfall.svg")
    },
    resources: {
        icon: C.ICONS.resource, setting: "Resource", source: () => chex.resources, defaults: () => Resource.getDefaults(),
        blank: id => new Resource(id, "", "icons/svg/item-bag.svg"), numbers: ["spawnWeight", "tradeValue"]
    },
    improvements: {
        icon: C.ICONS.improvement, setting: "Improvement", source: () => chex.improvements, defaults: () => Improvement.getDefaults(),
        blank: id => new Improvement(id, "", "icons/svg/hazard.svg"), numbers: ["yield", "travel"]
    },
    buildings: {
        icon: C.ICONS.building, setting: "Building", source: () => chex.buildings, defaults: () => Building.getDefaults(),
        blank: id => new Building(id, "", "icons/svg/house.svg"), amounts: ["cost", "upkeep", "production"], numbers: ["lots", "maxCount"]
    },
    sizes: {
        icon: C.ICONS.settlement, setting: "SettlementSize", source: () => chex.settlementSizes, defaults: () => SettlementSize.getDefaults(),
        blank: id => new SettlementSize(id, ""), amounts: ["needs"], numbers: ["rank", "lots"]
    }
};

const amountFields = category => CATEGORIES[category].amounts ?? [];

/**
 * The cHex configuration: realms, terrains, travel, features and the economy.
 * Edits a draft, which is only saved on submit.
 */
export default class ChexConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "chex-config",
        tag: "form",
        classes: ["chex-app", "chex-config"],
        window: {
            title: "CHEX.CONFIG.Title",
            icon: C.ICONS.config,
            resizable: true
        },
        position: {width: 980, height: 740},
        form: {
            handler: ChexConfig.#onSubmit,
            closeOnSubmit: true
        },
        actions: {
            addRow: ChexConfig.#onAddRow,
            deleteRow: ChexConfig.#onDeleteRow,
            addEntry: ChexConfig.#onAddEntry,
            deleteEntry: ChexConfig.#onDeleteEntry,
            pickImage: ChexConfig.#onPickImage,
            editExtraction: ChexConfig.#onEditExtraction,
            addDefaults: ChexConfig.#onAddDefaults,
            exportJson: ChexConfig.#onExport,
            importJson: ChexConfig.#onImport
        }
    };

    static TABS = {
        primary: {
            tabs: Object.entries(CATEGORIES).map(([id, {icon}]) => ({id, icon})),
            initial: "realms",
            labelPrefix: "CHEX.CONFIG.Tab"
        }
    };

    static PARTS = {
        tabs: {template: "templates/generic/tab-navigation.hbs"},
        ...Object.fromEntries(Object.keys(CATEGORIES).map(id => [id, {
            template: `${TEMPLATES}/config-${id}.hbs`, scrollable: [""], templates: [`${TEMPLATES}/amount-list.hbs`]
        }])),
        footer: {template: "templates/generic/form-footer.hbs"}
    };

    /**
     * Open the configuration, or bring it to front if already open.
     */
    static open() {
        const app = foundry.applications.instances.get(ChexConfig.DEFAULT_OPTIONS.id) ?? new ChexConfig();
        return app.render({force: true});
    }

    /**
     * Working copy. Each category is an array, amount maps are arrays of {id, amount}.
     */
    #draft = Object.fromEntries(Object.entries(CATEGORIES).map(([id, c]) => [id, ChexConfig.#toDraft(id, c.source())]));

    #playerRealm = game.settings.get(C.MODULE_ID, PLAYER_REALM_SETTING);

    static #toDraft(category, definitions) {
        return Object.values(foundry.utils.deepClone(definitions ?? {})).map(def => {
            for (const field of amountFields(category)) {
                def[field] = Object.entries(def[field] ?? {}).map(([id, amount]) => ({id, amount}));
            }
            return def;
        });
    }

    static #fromDraft(category, entries) {
        const result = {};
        for (const entry of entries) {
            const def = {...entry};
            for (const field of amountFields(category)) {
                def[field] = (entry[field] ?? []).reduce((map, {id, amount}) => {
                    if (id && Number(amount)) addAmounts(map, {[id]: Number(amount)});
                    return map;
                }, {});
            }
            for (const field of CATEGORIES[category].numbers ?? []) def[field] = Number(def[field]) || 0;
            result[def.id] = def;
        }
        return result;
    }

    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const resources = this.#draft.resources;
        const groups = [...new Set(resources.map(r => r.group).filter(g => g))].sort();
        const resourceOptions = resources.map(r => ({id: r.id, label: r.label || r.id}));

        return Object.assign(context, {
            draft: this.#draft,
            playerRealm: this.#playerRealm,
            kinds: RESOURCE_KINDS,
            categories: RESOURCE_CATEGORIES,
            travelOptions: this.#draft.travels.map(t => ({id: t.id, label: t.label || t.id})),
            improvementRows: this.#draft.improvements.map(m => ({...m, extraction: this.#extractionSummary(m)})),
            resourceOptions,
            needOptions: [
                ...groups.map(g => ({id: `${GROUP_PREFIX}${g}`, label: game.i18n.format("CHEX.ECONOMY.AnyOfGroup", {group: g})})),
                ...resourceOptions
            ],
            sizeOptions: this.#draft.sizes.map(s => ({id: s.id, label: s.label || s.id})),
            buttons: [
                {type: "button", icon: "fa-solid fa-wand-magic-sparkles", label: "CHEX.CONFIG.AddDefaults", action: "addDefaults"},
                {type: "button", icon: "fa-solid fa-file-export", label: "CHEX.CONFIG.Export", action: "exportJson"},
                {type: "button", icon: "fa-solid fa-file-import", label: "CHEX.CONFIG.Import", action: "importJson"},
                {type: "submit", icon: "fa-solid fa-save", label: "CHEX.Save"}
            ]
        });
    }

    /**
     * What an improvement extracts, for the improvements table.
     */
    #extractionSummary(improvement) {
        const allowed = improvement.allowed ?? [];
        const raw = this.#draft.resources.filter(r => r.kind === "raw");
        return {
            category: improvement.extracts ? game.i18n.localize(RESOURCE_CATEGORIES[improvement.extracts] ?? improvement.extracts) : "",
            all: !!improvement.extracts && !allowed.length,
            resources: raw.filter(r => allowed.includes(r.id)).map(r => ({label: r.label || r.id, img: r.img})),
            allowedText: allowed.join(",")
        };
    }

    /** @override */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        if (partId in context.tabs) context.tab = context.tabs[partId];
        return context;
    }

    /* -------------------------------------------- */

    /**
     * Copy the current form values into the draft.
     */
    #sync() {
        if (!this.form) return;
        const data = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.form).object);
        const toArray = obj => obj ? Object.keys(obj).sort((a, b) => a - b).map(k => obj[k]) : [];
        for (const category of Object.keys(CATEGORIES)) {
            this.#draft[category] = toArray(data[category]).map(entry => {
                for (const field of amountFields(category)) entry[field] = toArray(entry[field]);
                if (category === "improvements") entry.allowed = String(entry.allowed ?? "").split(",").filter(a => a);
                return entry;
            });
        }
        // the radio buttons refer to rows, as ids may have been edited
        const row = data.playerRealm === "" || data.playerRealm == null ? null : this.#draft.realms[Number(data.playerRealm)];
        this.#playerRealm = row?.id ?? "";
    }

    static #onAddRow(event, target) {
        this.#sync();
        const category = target.dataset.category;
        const id = foundry.utils.randomID(8);
        const blank = CATEGORIES[category].blank(id);
        if (category === "sizes") blank.rank = this.#draft.sizes.length + 1;
        this.#draft[category].push(...ChexConfig.#toDraft(category, {[id]: blank}));
        this.render();
    }

    static #onDeleteRow(event, target) {
        this.#sync();
        this.#draft[target.dataset.category].splice(Number(target.dataset.index), 1);
        this.render();
    }

    static #onAddEntry(event, target) {
        this.#sync();
        foundry.utils.getProperty(this.#draft, target.dataset.path).push({id: "", amount: 1});
        this.render();
    }

    static #onDeleteEntry(event, target) {
        this.#sync();
        foundry.utils.getProperty(this.#draft, target.dataset.path).splice(Number(target.dataset.index), 1);
        this.render();
    }

    /**
     * Dialog to choose what an improvement extracts. Category buttons preselect all raw resources of that category,
     * single resources can then be toggled.
     */
    static async #onEditExtraction(event, target) {
        this.#sync();
        const improvement = this.#draft.improvements[Number(target.dataset.index)];
        const allowed = improvement.allowed ?? [];
        const raw = this.#draft.resources.filter(r => r.kind === "raw");
        const selected = r => allowed.length ? allowed.includes(r.id) : (!!improvement.extracts && r.category === improvement.extracts);
        const groups = [...Object.keys(RESOURCE_CATEGORIES), ""].map(category => ({
            label: category ? RESOURCE_CATEGORIES[category] : "CHEX.CONFIG.Uncategorized",
            resources: raw.filter(r => (r.category || "") === category)
                .map(r => ({id: r.id, label: r.label || r.id, img: r.img, category: r.category || "", selected: selected(r)}))
        })).filter(g => g.resources.length);

        const content = await foundry.applications.handlebars.renderTemplate(`${TEMPLATES}/extraction-dialog.hbs`, {
            extracts: improvement.extracts ?? "",
            categories: RESOURCE_CATEGORIES,
            noneIcon: C.ICONS.none,
            groups
        });
        const data = await foundry.applications.api.DialogV2.input({
            window: {title: game.i18n.format("CHEX.CONFIG.ExtractionTitle", {name: improvement.label || improvement.id}), icon: C.ICONS.improvement},
            position: {width: 560},
            classes: ["chex-app", "chex-extraction-dialog"],
            content,
            render: (event, dialog) => ChexConfig.#activateExtractionDialog(dialog.element),
            rejectClose: false
        });
        if (!data) return;

        const extracts = data.extracts ?? "";
        let chosen = Object.entries(data).filter(([key, value]) => key.startsWith("allowed.") && value).map(([key]) => key.slice("allowed.".length));
        const ofCategory = raw.filter(r => r.category === extracts).map(r => r.id);
        // exactly the whole category: store as "all of the category", so resources added later are included
        if (extracts && chosen.length === ofCategory.length && chosen.every(id => ofCategory.includes(id))) chosen = [];
        improvement.extracts = extracts;
        improvement.allowed = chosen;
        this.render();
    }

    static #activateExtractionDialog(element) {
        const presetInput = element.querySelector("input[name=extracts]");
        const presets = element.querySelectorAll("[data-preset]");
        const update = () => {
            const any = [...element.querySelectorAll(".chex-toggle input")].some(i => i.checked);
            // nothing selected means nothing is extracted
            if (!any) presetInput.value = "";
            presets.forEach(b => b.classList.toggle("active", b.dataset.preset === presetInput.value));
        };
        presets.forEach(button => button.addEventListener("click", () => {
            presetInput.value = button.dataset.preset;
            for (const toggle of element.querySelectorAll(".chex-toggle input")) {
                toggle.checked = !!button.dataset.preset && toggle.closest(".chex-toggle").dataset.category === button.dataset.preset;
            }
            update();
        }));
        element.querySelectorAll(".chex-toggle input").forEach(toggle => toggle.addEventListener("change", update));
        update();
    }

    static #onPickImage(event, target) {
        this.#sync();
        const path = target.dataset.path;
        new foundry.applications.apps.FilePicker.implementation({
            type: "image",
            current: foundry.utils.getProperty(this.#draft, path),
            callback: src => {
                foundry.utils.setProperty(this.#draft, path, src);
                this.render();
            }
        }).render({force: true});
    }

    /**
     * Add defaults whose id doesn't exist yet. Nothing is overwritten.
     */
    static #onAddDefaults() {
        this.#sync();
        let added = 0;
        for (const [category, {defaults}] of Object.entries(CATEGORIES)) {
            const existing = new Set(this.#draft[category].map(e => e.id));
            const missing = Object.fromEntries(Object.entries(defaults()).filter(([id]) => !existing.has(id)));
            added += Object.keys(missing).length;
            this.#draft[category].push(...ChexConfig.#toDraft(category, missing));
        }
        ui.notifications.info(game.i18n.format("CHEX.CONFIG.DefaultsAdded", {count: added}));
        this.render();
    }

    static #onExport() {
        this.#sync();
        const data = Object.fromEntries(Object.keys(CATEGORIES).map(c => [c, ChexConfig.#fromDraft(c, this.#draft[c])]));
        foundry.utils.saveDataToFile(JSON.stringify(data, null, 2), "application/json", "chex-config.json");
    }

    static async #onImport() {
        const file = await foundry.applications.api.DialogV2.prompt({
            window: {title: "CHEX.CONFIG.Import"},
            content: `<p>${game.i18n.localize("CHEX.CONFIG.ImportHint")}</p><input type="file" name="file" accept=".json">`,
            ok: {callback: (event, button) => button.form.elements.file.files[0]}
        }).catch(() => null);
        if (!file) return;
        try {
            const data = JSON.parse(await foundry.utils.readTextFromFile(file));
            for (const category of Object.keys(CATEGORIES)) {
                if (data[category]) this.#draft[category] = ChexConfig.#toDraft(category, data[category]);
            }
            this.render();
        } catch (error) {
            ui.notifications.error(game.i18n.format("CHEX.CONFIG.ImportFailed", {error: error.message}));
        }
    }

    /**
     * @this {ChexConfig}
     */
    static async #onSubmit(event, form, formData) {
        this.#sync();
        for (const category of Object.keys(CATEGORIES)) {
            const ids = this.#draft[category].map(e => e.id?.trim());
            const invalid = ids.find(id => !id || !ID_PATTERN.test(id));
            const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
            if (invalid !== undefined || duplicate) {
                // ApplicationV2 shows the error and keeps the window open
                throw new Error(game.i18n.format("CHEX.CONFIG.InvalidId", {
                    id: invalid ?? duplicate,
                    tab: game.i18n.localize(`CHEX.CONFIG.Tab.${category}`)
                }));
            }
        }

        const values = Object.fromEntries(Object.keys(CATEGORIES).map(c => [c, ChexConfig.#fromDraft(c, this.#draft[c])]));
        for (const r of Object.values(values.resources)) if (r.kind !== "raw") r.category = "";
        for (const t of Object.values(values.travels)) t.special = !!t.special;

        for (const [category, {setting}] of Object.entries(CATEGORIES)) {
            await game.settings.set(C.MODULE_ID, setting, values[category]);
        }
        await game.settings.set(C.MODULE_ID, PLAYER_REALM_SETTING, values.realms[this.#playerRealm] ? this.#playerRealm : "");
    }
}
