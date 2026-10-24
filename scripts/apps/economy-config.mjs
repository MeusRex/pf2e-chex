import * as C from "../const.mjs";
import { Resource, RESOURCE_CATEGORIES, RESOURCE_KINDS } from "../customizables/resources.mjs";
import { Improvement } from "../customizables/improvements.mjs";
import { Building } from "../customizables/buildings.mjs";
import { SettlementSize } from "../customizables/settlement-sizes.mjs";
import { addAmounts, GROUP_PREFIX } from "../economy/engine.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const TEMPLATES = "modules/pf2e-chex/templates/economy";
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

// fields holding {resourceId: amount} maps, per category
const AMOUNT_FIELDS = {
    resources: [],
    improvements: [],
    buildings: ["cost", "upkeep", "production"],
    sizes: ["needs"]
};

/**
 * Configuration of resources, improvements, buildings and settlement sizes.
 * Edits a draft, which is only saved on submit.
 */
export default class EconomyConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "chex-economy-config",
        tag: "form",
        classes: ["chex-economy", "chex-economy-config"],
        window: {
            title: "CHEX.ECONOMY.Config.Title",
            icon: "fa-solid fa-coins",
            resizable: true
        },
        position: {width: 960, height: 720},
        form: {
            handler: EconomyConfig.#onSubmit,
            closeOnSubmit: true
        },
        actions: {
            addRow: EconomyConfig.#onAddRow,
            deleteRow: EconomyConfig.#onDeleteRow,
            addEntry: EconomyConfig.#onAddEntry,
            deleteEntry: EconomyConfig.#onDeleteEntry,
            pickImage: EconomyConfig.#onPickImage,
            editExtraction: EconomyConfig.#onEditExtraction,
            addDefaults: EconomyConfig.#onAddDefaults,
            exportJson: EconomyConfig.#onExport,
            importJson: EconomyConfig.#onImport
        }
    };

    static TABS = {
        primary: {
            tabs: [
                {id: "resources", icon: "fa-solid fa-cubes"},
                {id: "improvements", icon: "fa-solid fa-person-digging"},
                {id: "buildings", icon: "fa-solid fa-building"},
                {id: "sizes", icon: "fa-solid fa-city"}
            ],
            initial: "resources",
            labelPrefix: "CHEX.ECONOMY.Config.Tab"
        }
    };

    static PARTS = {
        tabs: {template: "templates/generic/tab-navigation.hbs"},
        resources: {template: `${TEMPLATES}/config-resources.hbs`, scrollable: [""]},
        improvements: {template: `${TEMPLATES}/config-improvements.hbs`, scrollable: [""]},
        buildings: {template: `${TEMPLATES}/config-buildings.hbs`, scrollable: [""], templates: [`${TEMPLATES}/amount-list.hbs`]},
        sizes: {template: `${TEMPLATES}/config-sizes.hbs`, scrollable: [""], templates: [`${TEMPLATES}/amount-list.hbs`]},
        footer: {template: "templates/generic/form-footer.hbs"}
    };

    /**
     * Open the configuration, or bring it to front if already open.
     */
    static open() {
        const app = foundry.applications.instances.get(EconomyConfig.DEFAULT_OPTIONS.id) ?? new EconomyConfig();
        return app.render({force: true});
    }

    /**
     * Working copy. Each category is an array, amount maps are arrays of {id, amount}.
     */
    #draft = {
        resources: EconomyConfig.#toDraft("resources", chex.resources),
        improvements: EconomyConfig.#toDraft("improvements", chex.improvements),
        buildings: EconomyConfig.#toDraft("buildings", chex.buildings),
        sizes: EconomyConfig.#toDraft("sizes", chex.settlementSizes)
    };

    static #toDraft(category, definitions) {
        return Object.values(foundry.utils.deepClone(definitions ?? {})).map(def => {
            for (const field of AMOUNT_FIELDS[category]) {
                def[field] = Object.entries(def[field] ?? {}).map(([id, amount]) => ({id, amount}));
            }
            return def;
        });
    }

    static #fromDraft(category, entries) {
        const result = {};
        for (const entry of entries) {
            const def = {...entry};
            for (const field of AMOUNT_FIELDS[category]) {
                def[field] = (entry[field] ?? []).reduce((map, {id, amount}) => {
                    if (id && Number(amount)) addAmounts(map, {[id]: Number(amount)});
                    return map;
                }, {});
            }
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
            kinds: RESOURCE_KINDS,
            categories: RESOURCE_CATEGORIES,
            improvementRows: this.#draft.improvements.map(m => ({...m, extraction: this.#extractionSummary(m)})),
            resourceOptions,
            needOptions: [
                ...groups.map(g => ({id: `${GROUP_PREFIX}${g}`, label: game.i18n.format("CHEX.ECONOMY.AnyOfGroup", {group: g})})),
                ...resourceOptions
            ],
            sizeOptions: this.#draft.sizes.map(s => ({id: s.id, label: s.label || s.id})),
            buttons: [
                {type: "button", icon: "fa-solid fa-wand-magic-sparkles", label: "CHEX.ECONOMY.Config.AddDefaults", action: "addDefaults"},
                {type: "button", icon: "fa-solid fa-file-export", label: "CHEX.ECONOMY.Config.Export", action: "exportJson"},
                {type: "button", icon: "fa-solid fa-file-import", label: "CHEX.ECONOMY.Config.Import", action: "importJson"},
                {type: "submit", icon: "fa-solid fa-save", label: "CHEX.HEXEDIT.Save"}
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
        for (const category of Object.keys(AMOUNT_FIELDS)) {
            this.#draft[category] = toArray(data[category]).map(entry => {
                for (const field of AMOUNT_FIELDS[category]) entry[field] = toArray(entry[field]);
                if (category === "improvements") entry.allowed = String(entry.allowed ?? "").split(",").filter(a => a);
                return entry;
            });
        }
    }

    static #onAddRow(event, target) {
        this.#sync();
        const category = target.dataset.category;
        const id = foundry.utils.randomID(8);
        const blank = {
            resources: () => new Resource(id, "", "icons/svg/item-bag.svg"),
            improvements: () => new Improvement(id, "", "icons/svg/hazard.svg"),
            buildings: () => new Building(id, "", "icons/svg/house.svg"),
            sizes: () => new SettlementSize(id, "", {rank: this.#draft.sizes.length + 1})
        }[category]();
        this.#draft[category].push(...EconomyConfig.#toDraft(category, {[id]: blank}));
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
            label: category ? RESOURCE_CATEGORIES[category] : "CHEX.ECONOMY.Config.Uncategorized",
            resources: raw.filter(r => (r.category || "") === category)
                .map(r => ({id: r.id, label: r.label || r.id, img: r.img, category: r.category || "", selected: selected(r)}))
        })).filter(g => g.resources.length);

        const content = await foundry.applications.handlebars.renderTemplate(`${TEMPLATES}/extraction-dialog.hbs`, {
            extracts: improvement.extracts ?? "",
            categories: RESOURCE_CATEGORIES,
            groups
        });
        const data = await foundry.applications.api.DialogV2.input({
            window: {title: game.i18n.format("CHEX.ECONOMY.Config.ExtractionTitle", {name: improvement.label || improvement.id}), icon: "fa-solid fa-person-digging"},
            position: {width: 560},
            classes: ["chex-economy", "chex-extraction-dialog"],
            content,
            render: (event, dialog) => EconomyConfig.#activateExtractionDialog(dialog.element),
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
        const defaults = {
            resources: Resource.getDefaults(),
            improvements: Improvement.getDefaults(),
            buildings: Building.getDefaults(),
            sizes: SettlementSize.getDefaults()
        };
        let added = 0;
        for (const [category, definitions] of Object.entries(defaults)) {
            const existing = new Set(this.#draft[category].map(e => e.id));
            const missing = Object.fromEntries(Object.entries(definitions).filter(([id]) => !existing.has(id)));
            added += Object.keys(missing).length;
            this.#draft[category].push(...EconomyConfig.#toDraft(category, missing));
        }
        ui.notifications.info(game.i18n.format("CHEX.ECONOMY.Config.DefaultsAdded", {count: added}));
        this.render();
    }

    static #onExport() {
        this.#sync();
        const data = Object.fromEntries(Object.keys(AMOUNT_FIELDS).map(c => [c, EconomyConfig.#fromDraft(c, this.#draft[c])]));
        foundry.utils.saveDataToFile(JSON.stringify(data, null, 2), "application/json", "chex-economy.json");
    }

    static async #onImport() {
        const file = await foundry.applications.api.DialogV2.prompt({
            window: {title: "CHEX.ECONOMY.Config.Import"},
            content: `<p>${game.i18n.localize("CHEX.ECONOMY.Config.ImportHint")}</p><input type="file" name="file" accept=".json">`,
            ok: {callback: (event, button) => button.form.elements.file.files[0]}
        }).catch(() => null);
        if (!file) return;
        try {
            const data = JSON.parse(await foundry.utils.readTextFromFile(file));
            for (const category of Object.keys(AMOUNT_FIELDS)) {
                if (data[category]) this.#draft[category] = EconomyConfig.#toDraft(category, data[category]);
            }
            this.render();
        } catch (error) {
            ui.notifications.error(game.i18n.format("CHEX.ECONOMY.Config.ImportFailed", {error: error.message}));
        }
    }

    /**
     * @this {EconomyConfig}
     */
    static async #onSubmit(event, form, formData) {
        this.#sync();
        for (const category of Object.keys(AMOUNT_FIELDS)) {
            const ids = this.#draft[category].map(e => e.id?.trim());
            const invalid = ids.find(id => !id || !ID_PATTERN.test(id));
            const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
            if (invalid !== undefined || duplicate) {
                // ApplicationV2 shows the error and keeps the window open
                throw new Error(game.i18n.format("CHEX.ECONOMY.Config.InvalidId", {
                    id: invalid ?? duplicate,
                    tab: game.i18n.localize(`CHEX.ECONOMY.Config.Tab.${category}`)
                }));
            }
        }

        const numeric = (entry, fields) => fields.forEach(f => entry[f] = Number(entry[f]) || 0);
        const resources = EconomyConfig.#fromDraft("resources", this.#draft.resources);
        Object.values(resources).forEach(r => {
            numeric(r, ["spawnWeight", "tradeValue"]);
            if (r.kind !== "raw") r.category = "";
        });
        const improvements = EconomyConfig.#fromDraft("improvements", this.#draft.improvements);
        Object.values(improvements).forEach(i => numeric(i, ["yield", "travel"]));
        const buildings = EconomyConfig.#fromDraft("buildings", this.#draft.buildings);
        Object.values(buildings).forEach(b => numeric(b, ["lots", "maxCount"]));
        const sizes = EconomyConfig.#fromDraft("sizes", this.#draft.sizes);
        Object.values(sizes).forEach(s => numeric(s, ["rank", "lots"]));

        await game.settings.set(C.MODULE_ID, "Resource", resources);
        await game.settings.set(C.MODULE_ID, "Improvement", improvements);
        await game.settings.set(C.MODULE_ID, "Building", buildings);
        await game.settings.set(C.MODULE_ID, "SettlementSize", sizes);
    }
}
