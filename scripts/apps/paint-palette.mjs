import * as C from "../const.mjs";
import ChexData from "../chex-data.mjs";
import { extractionCandidates, isExtracting } from "../economy/engine.mjs";
import { assignExtraction } from "../economy/migration.mjs";
import { confirm, TEMPLATES } from "./economy-ui.mjs";
import MapViewPanel from "./map-view.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export const PAINT_TABS = Object.freeze({
    TERRAIN: "terrain",
    REALM: "realm",
    IMPROVEMENTS: "improvements",
    RESOURCES: "resources"
});

/**
 * Paint hexes on the map. GM only.
 * Terrain and realm are painted by clicking or dragging, or filled as an area with the bucket.
 * Improvements and deposits are added by clicking a hex and removed with Shift+click.
 */
export default class PaintPalette extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "chex-paint",
        classes: ["chex-app", "chex-live", "chex-paint"],
        window: {
            title: "CHEX.PAINT.Title",
            icon: C.ICONS.paint,
            minimizable: true
        },
        position: {width: 300, height: "auto", top: 80, left: 120},
        actions: {
            setTab: PaintPalette.#onSetTab,
            select: PaintPalette.#onSelect
        }
    };

    static PARTS = {
        main: {template: `${TEMPLATES}/paint-palette.hbs`}
    };

    static open() {
        const app = foundry.applications.instances.get(PaintPalette.DEFAULT_OPTIONS.id) ?? new PaintPalette();
        return app.render({force: true});
    }

    tab = PAINT_TABS.TERRAIN;
    /** selected entry per tab */
    selection = {
        [PAINT_TABS.TERRAIN]: Object.keys(chex.terrains)[0] ?? "",
        [PAINT_TABS.REALM]: Object.keys(chex.realms)[0] ?? "",
        [PAINT_TABS.IMPROVEMENTS]: Object.keys(chex.improvements)[0] ?? "",
        [PAINT_TABS.RESOURCES]: Object.values(chex.resources).find(r => r.kind === "raw")?.id ?? ""
    };
    /** fill connected areas instead of painting single hexes (terrain and realm) */
    bucket = false;
    /** fixed resource for extracting improvements, "" rolls one */
    extracted = "";
    amount = 1;
    show = false;

    /** clicks are applied one after another, so quick clicks don't work on outdated hex data */
    #queue = Promise.resolve();

    get selected() {
        return this.selection[this.tab];
    }

    /** Terrain and realm are painted in strokes, the others by clicks. */
    get isArea() {
        return this.tab === PAINT_TABS.TERRAIN || this.tab === PAINT_TABS.REALM;
    }

    /** @override */
    async _prepareContext(options) {
        const improvement = chex.improvements[this.selection[PAINT_TABS.IMPROVEMENTS]];
        const tabs = [
            {id: PAINT_TABS.TERRAIN, icon: C.ICONS.terrain},
            {id: PAINT_TABS.REALM, icon: C.ICONS.realm},
            {id: PAINT_TABS.IMPROVEMENTS, icon: C.ICONS.improvement},
            {id: PAINT_TABS.RESOURCES, icon: C.ICONS.resource}
        ].map(t => ({...t, label: `CHEX.PAINT.Tab.${t.id}`, active: t.id === this.tab}));

        return {
            tabs,
            items: this.#items(),
            isArea: this.isArea,
            isImprovements: this.tab === PAINT_TABS.IMPROVEMENTS,
            isResources: this.tab === PAINT_TABS.RESOURCES,
            bucket: this.bucket,
            bucketIcon: C.ICONS.bucket,
            extracting: isExtracting(improvement),
            candidates: extractionCandidates(improvement, chex.resources).map(r => ({id: r.id, label: r.label})),
            extracted: this.extracted,
            amount: this.amount,
            show: this.show,
            hint: `CHEX.PAINT.Hint.${this.isArea ? "area" : "click"}`
        };
    }

    #items() {
        const selected = this.selected;
        switch (this.tab) {
            case PAINT_TABS.TERRAIN:
                return Object.values(chex.terrains).map(t => ({id: t.id, label: t.label, img: t.img, color: t.color}));
            case PAINT_TABS.REALM:
                return [
                    {id: "", label: game.i18n.localize("CHEX.PAINT.Unclaimed"), icon: C.ICONS.none},
                    ...Object.values(chex.realms).map(r => ({id: r.id, label: r.label, color: r.color, swatch: true}))
                ].map(i => ({...i, active: i.id === selected}));
            case PAINT_TABS.IMPROVEMENTS:
                return Object.values(chex.improvements).map(i => ({id: i.id, label: i.label, img: i.img}));
            case PAINT_TABS.RESOURCES:
                return Object.values(chex.resources).filter(r => r.kind === "raw").map(r => ({id: r.id, label: r.label, img: r.img}));
        }
        return [];
    }

    /** @override */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        for (const item of context.items) item.active ??= item.id === this.selected;
        return context;
    }

    /** @override */
    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this.#showOnMap();
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        chex.paint = this;
        const on = (selector, handler) => this.element.querySelector(selector)?.addEventListener("change", handler);
        on("input[name=bucket]", e => this.bucket = e.target.checked);
        on("select[name=extracted]", e => this.extracted = e.target.value);
        on("input[name=amount]", e => this.amount = Math.max(1, Number(e.target.value) || 1));
        on("input[name=show]", e => this.show = e.target.checked);
    }

    /** @override */
    _onClose(options) {
        super._onClose(options);
        if (chex.paint === this) chex.paint = null;
        canvas.interface?.grid?.clearHighlightLayer(C.HIGHLIGHT_LAYER);
    }

    static #onSetTab(event, target) {
        this.tab = target.dataset.tab;
        this.#showOnMap();
        this.render();
    }

    static #onSelect(event, target) {
        this.selection[this.tab] = target.dataset.id;
        if (this.tab === PAINT_TABS.IMPROVEMENTS) this.extracted = "";
        this.render();
    }

    /**
     * Show what is painted, so the result of each click is visible.
     */
    #showOnMap() {
        switch (this.tab) {
            case PAINT_TABS.TERRAIN: return MapViewPanel.update({colorBy: C.MODE_TERRAIN});
            case PAINT_TABS.REALM: return MapViewPanel.update({colorBy: C.MODE_REALM});
            case PAINT_TABS.IMPROVEMENTS: return MapViewPanel.update({details: C.MAP_DETAILS.IMPROVEMENTS});
            case PAINT_TABS.RESOURCES: return MapViewPanel.update({details: C.MAP_DETAILS.RESOURCES});
        }
    }

    /* -------------------------------------------- */
    /*  Painting, called by the manager             */
    /* -------------------------------------------- */

    /**
     * Handle a click on a hex.
     * @returns {boolean} whether the click was handled. If not, the manager paints a stroke with strokePatch.
     */
    click(hex, shift = false) {
        if (this.isArea) {
            if (!this.bucket) return false;
            this.#fill(hex);
            return true;
        }
        this.#queue = this.#queue.then(() => this.#applyEntry(hex, shift)).catch(err => console.error("cHex | Painting failed", err));
        return true;
    }

    /**
     * The change of a hex while painting a stroke, or null if nothing changes.
     */
    strokePatch(hex) {
        if (!this.isArea || this.bucket) return null;
        const value = this.selected;
        if (this.tab === PAINT_TABS.TERRAIN) {
            if (!chex.terrains[value] || hex.hexData.terrain === value) return null;
            return {terrain: value, travel: chex.terrains[value].travel};
        }
        if (value && !chex.realms[value]) return null;
        if ((hex.hexData.claimed ?? "") === value) return null;
        return {claimed: value};
    }

    /**
     * Color used to highlight hexes that are about to change.
     */
    get color() {
        if (this.tab === PAINT_TABS.TERRAIN) return chex.terrains[this.selected]?.color || C.FALLBACK_COLOR;
        if (this.tab === PAINT_TABS.REALM) return chex.realms[this.selected]?.color || "#000000";
        return C.FALLBACK_COLOR;
    }

    /**
     * Fill the connected area of equal terrain or claim, after confirmation.
     */
    async #fill(start) {
        const field = this.tab === PAINT_TABS.TERRAIN ? "terrain" : "claimed";
        const from = start.hexData[field] ?? "";
        const patch = this.#withBucketOff(() => this.strokePatch(start));
        if (!patch) return;

        const hexes = chex.manager.floodFill(start, hex => (hex.hexData[field] ?? "") === from);
        const grid = canvas.interface.grid;
        grid.clearHighlightLayer(C.HIGHLIGHT_LAYER);
        for (const hex of hexes) grid.highlightPosition(C.HIGHLIGHT_LAYER, {...hex.topLeft, color: Color.from(this.color)});

        const label = id => (field === "terrain" ? chex.terrains[id]?.label : chex.realms[id]?.label) || game.i18n.localize("CHEX.PAINT.Unclaimed");
        const ok = await confirm(game.i18n.localize("CHEX.PAINT.FillTitle"), game.i18n.format("CHEX.PAINT.FillConfirm", {
            count: hexes.length, from: label(from), to: label(this.selected), start: start.toString()
        }));
        grid.clearHighlightLayer(C.HIGHLIGHT_LAYER);
        if (!ok) return;
        const hexesPatch = Object.fromEntries(hexes.map(hex => [ChexData.getKey(hex.offset), patch]));
        await canvas.scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {hexes: hexesPatch});
    }

    #withBucketOff(fn) {
        const bucket = this.bucket;
        this.bucket = false;
        try { return fn(); } finally { this.bucket = bucket; }
    }

    async #applyEntry(hex, remove) {
        const scene = canvas.scene;
        const key = ChexData.getKey(hex.offset);
        const data = foundry.utils.deepClone(scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY)?.hexes?.[key]);
        if (!data) return;
        data.improvements ??= [];
        data.resources ??= [];
        const patch = this.tab === PAINT_TABS.IMPROVEMENTS ? this.#paintImprovement(data, remove) : this.#paintResource(data, remove);
        if (patch) await scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {hexes: {[key]: patch}});
    }

    #paintImprovement(data, remove) {
        const id = this.selected;
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
        const id = this.selected;
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
