import * as C from "../const.mjs";
import ChexData from "../chex-data.mjs";
import { extractionCandidates, isExtracting } from "../economy/engine.mjs";
import { assignExtraction } from "../economy/migration.mjs";
import { TEMPLATES } from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const MODES = Object.freeze({IMPROVEMENTS: "improvements", RESOURCES: "resources"});

/**
 * Paint improvements and resource deposits onto hexes with single clicks. GM only.
 * Click adds or updates the selected entry, Shift+click removes it.
 */
export default class BrushPalette extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "chex-brush",
        classes: ["chex-economy", "chex-brush"],
        window: {
            title: "CHEX.BRUSH.Title",
            icon: "fa-solid fa-paintbrush",
            minimizable: true
        },
        position: {width: 300, height: "auto", top: 80, left: 120},
        actions: {
            setMode: BrushPalette.#onSetMode,
            select: BrushPalette.#onSelect
        }
    };

    static PARTS = {
        main: {template: `${TEMPLATES}/brush.hbs`}
    };

    static open() {
        const app = foundry.applications.instances.get(BrushPalette.DEFAULT_OPTIONS.id) ?? new BrushPalette();
        return app.render({force: true});
    }

    mode = MODES.IMPROVEMENTS;
    improvement = Object.keys(chex.improvements)[0] ?? "";
    resource = Object.values(chex.resources).find(r => r.kind === "raw")?.id ?? "";
    /** fixed resource for extracting improvements, "" rolls one */
    extracted = "";
    amount = 1;
    show = false;

    /** clicks are applied one after another, so quick clicks don't work on outdated hex data */
    #queue = Promise.resolve();

    /** @override */
    async _prepareContext(options) {
        const improvement = chex.improvements[this.improvement];
        const raw = Object.values(chex.resources).filter(r => r.kind === "raw");
        return {
            mode: this.mode,
            isImprovements: this.mode === MODES.IMPROVEMENTS,
            modes: [
                {id: MODES.IMPROVEMENTS, label: "CHEX.HEXEDIT.Improvements", icon: "fa-solid fa-person-digging", active: this.mode === MODES.IMPROVEMENTS},
                {id: MODES.RESOURCES, label: "CHEX.HEXEDIT.Resources", icon: "fa-solid fa-gem", active: this.mode === MODES.RESOURCES}
            ],
            items: this.mode === MODES.IMPROVEMENTS
                ? Object.values(chex.improvements).map(i => ({id: i.id, label: i.label, img: i.img, active: i.id === this.improvement}))
                : raw.map(r => ({id: r.id, label: r.label, img: r.img, active: r.id === this.resource})),
            extracting: isExtracting(improvement),
            candidates: extractionCandidates(improvement, chex.resources).map(r => ({id: r.id, label: r.label})),
            extracted: this.extracted,
            amount: this.amount,
            show: this.show
        };
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        chex.brush = this;
        this.element.querySelector("select[name=extracted]")?.addEventListener("change", e => this.extracted = e.target.value);
        this.element.querySelector("input[name=amount]")?.addEventListener("change", e => this.amount = Math.max(1, Number(e.target.value) || 1));
        this.element.querySelector("input[name=show]")?.addEventListener("change", e => this.show = e.target.checked);
    }

    /** @override */
    _onClose(options) {
        super._onClose(options);
        if (chex.brush === this) chex.brush = null;
    }

    static #onSetMode(event, target) {
        this.mode = target.dataset.mode;
        BrushPalette.#showDetails(this.mode);
        this.render();
    }

    static #onSelect(event, target) {
        if (this.mode === MODES.IMPROVEMENTS) {
            this.improvement = target.dataset.id;
            this.extracted = "";
        } else {
            this.resource = target.dataset.id;
        }
        this.render();
    }

    /**
     * Show what is painted on the map, so the result of each click is visible.
     */
    static #showDetails(mode) {
        const view = game.settings.get(C.MODULE_ID, C.MAP_VIEW_SETTING);
        if (view.details === mode) return;
        game.settings.set(C.MODULE_ID, C.MAP_VIEW_SETTING, {...view, details: mode});
    }

    /** @override */
    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        BrushPalette.#showDetails(this.mode);
    }

    /**
     * Apply the brush to a hex.
     * @param {ChexHex} hex
     * @param {boolean} remove   remove the selected entry instead of adding it
     */
    apply(hex, remove = false) {
        this.#queue = this.#queue.then(() => this.#apply(hex, remove)).catch(err => console.error("cHex | Brush failed", err));
        return this.#queue;
    }

    async #apply(hex, remove) {
        const scene = canvas.scene;
        const key = ChexData.getKey(hex.offset);
        const data = foundry.utils.deepClone(scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY)?.hexes?.[key]);
        if (!data) return;
        data.improvements ??= [];
        data.resources ??= [];
        const patch = this.mode === MODES.IMPROVEMENTS ? this.#paintImprovement(data, remove) : this.#paintResource(data, remove);
        if (patch) await scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {hexes: {[key]: patch}});
    }

    #paintImprovement(data, remove) {
        const id = this.improvement;
        if (!chex.improvements[id]) return null;
        const existing = data.improvements.find(i => i.id === id);
        if (remove) {
            if (!existing) return null;
            data.improvements = data.improvements.filter(i => i.id !== id);
        } else if (existing) {
            existing.show = this.show;
            if (this.extracted) existing.resource = this.extracted;
        } else {
            data.improvements.push({id, show: this.show, resource: this.extracted});
        }
        return {improvements: assignExtraction(data) ?? data.improvements};
    }

    #paintResource(data, remove) {
        const id = this.resource;
        if (!chex.resources[id]) return null;
        const existing = data.resources.find(r => r.id === id);
        if (remove) {
            if (!existing) return null;
            data.resources = data.resources.filter(r => r.id !== id);
            return {resources: data.resources};
        }
        if (existing) Object.assign(existing, {amount: this.amount, show: this.show});
        else data.resources.push({id, amount: this.amount, show: this.show});

        // a deposit is what is really there: extracting improvements that can use it switch to it
        for (const instance of data.improvements) {
            const candidates = extractionCandidates(chex.improvements[instance.id], chex.resources);
            if (candidates.some(c => c.id === id)) instance.resource = id;
        }
        return {resources: data.resources, improvements: data.improvements};
    }
}
