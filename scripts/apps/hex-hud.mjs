import * as C from "../const.mjs";
import ChexData from "../chex-data.mjs";
import { hexProduction, isExtracting } from "../economy/engine.mjs";
import { findSettlementAt, getDefs } from "../economy/realm-store.mjs";
import { currentTravel } from "../travel.mjs";
import { realmImg, TEMPLATES } from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Shows the hovered hex next to it on the canvas while the cHex overlay is enabled.
 */
export default class HexHUD extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "chex-hud",
        classes: ["chex-app", "chex-hud"],
        window: {
            frame: false,
            positioned: true
        },
        position: {}
    };

    static PARTS = {
        main: {template: `${TEMPLATES}/hex-hud.hbs`}
    };

    /**
     * The hovered hex.
     * @type {ChexHex}
     */
    hex;

    /**
     * Is the cHex overlay enabled?
     */
    enabled = false;

    /** @override */
    _insertElement(element) {
        const existing = document.getElementById(element.id);
        if (existing) existing.replaceWith(element);
        else document.getElementById("hud").append(element);
    }

    /** @override */
    _updatePosition(position) {
        if (!this.hex) return position;
        const {x, y} = this.hex.topLeft;
        return Object.assign(position, {left: x + this.hex.grid.sizeX + 20, top: y, width: "auto", height: "auto"});
    }

    /**
     * Turn the overlay on or off.
     */
    toggle(enabled) {
        enabled ??= !this.enabled;
        this.enabled = enabled;
        if (chex.manager.kingdomLayer) chex.manager.kingdomLayer.visible = enabled;
        if (!enabled) this.clear();
        // the map view panel hints when the overlay is off
        foundry.applications.instances.get("chex-map-view")?.render();
    }

    /**
     * Show a hex and highlight it, together with the hexes of a stroke being painted.
     */
    async activate(hex) {
        this.hex = hex;
        if (!this.enabled) return;

        const grid = canvas.interface.grid;
        grid.clearHighlightLayer(C.HIGHLIGHT_LAYER);
        grid.highlightPosition(C.HIGHLIGHT_LAYER, {...hex.topLeft, color: Color.from(hex.color)});
        for (const {hex: painted, patch} of chex.manager.pendingPatches) {
            const color = patch.terrain !== undefined ? chex.terrains[patch.terrain]?.color
                : chex.realms[patch.claimed]?.color ?? "#000000";
            grid.highlightPosition(C.HIGHLIGHT_LAYER, {...painted.topLeft, color: Color.from(color || C.FALLBACK_COLOR)});
        }

        await this.render({force: true});
        if (this.element) this.element.hidden = false;
    }

    /**
     * Hide the HUD and the highlights.
     */
    clear() {
        canvas.interface?.grid?.clearHighlightLayer(C.HIGHLIGHT_LAYER);
        if (this.element) this.element.hidden = true;
    }

    /** @override */
    async _prepareContext(options) {
        const data = this.hex.hexData;
        const isGM = game.user.isGM;
        const visible = entry => entry.id && (isGM || entry.show);
        const eye = entry => entry.show ? "fa-eye" : "fa-eye-slash";

        const travel = chex.travels[currentTravel(data)];
        const found = findSettlementAt(this.hex.sceneId, ChexData.getKey(this.hex.offset));
        const realm = chex.realms[data.claimed];

        return {
            name: this.hex.name,
            isGM,
            icons: C.ICONS,
            terrain: {
                label: chex.terrains[data.terrain]?.label || C.FALLBACK_LABEL,
                img: chex.terrains[data.terrain]?.img || C.FALLBACK_IMAGE
            },
            travel: {
                label: travel?.label || C.FALLBACK_LABEL,
                multiplier: travel?.multiplier || C.FALLBACK_MULTIPLIER
            },
            exploration: data.exploration > 0
                ? Object.values(C.EXPLORATION_STATES).find(v => v.value === data.exploration)?.label : null,
            cleared: data.cleared,
            claim: realm ? {label: realm.label, color: realm.color, img: realmImg(realm)} : null,
            settlement: found ? {
                name: found.settlement.name,
                size: chex.settlementSizes[found.settlement.size]?.label ?? found.settlement.size,
                color: chex.realms[found.realmId]?.color || C.FALLBACK_COLOR
            } : null,
            improvements: (data.improvements ?? []).filter(visible).map(o => ({
                label: chex.improvements[o.id]?.label || C.FALLBACK_LABEL,
                img: chex.improvements[o.id]?.img || C.FALLBACK_IMAGE,
                effect: this.#describeImprovement(o, data),
                eye: eye(o)
            })),
            resources: (data.resources ?? []).filter(visible).map(o => ({
                label: chex.resources[o.id]?.label || C.FALLBACK_LABEL,
                img: chex.resources[o.id]?.img || C.FALLBACK_IMAGE,
                amount: o.amount,
                eye: eye(o)
            })),
            forageables: (data.forageables ?? []).filter(visible).map(o => ({
                label: chex.resources[o.id]?.label || C.FALLBACK_LABEL,
                img: chex.resources[o.id]?.img || C.FALLBACK_IMAGE,
                amount: o.amount,
                eye: eye(o)
            })),
            features: (data.features ?? []).filter(visible).map(o => ({
                label: chex.features[o.id]?.label || C.FALLBACK_LABEL,
                img: chex.features[o.id]?.img || C.FALLBACK_IMAGE,
                name: o.name,
                eye: eye(o)
            }))
        };
    }

    /**
     * Short description of what an improvement on a hex does, e.g. "Ore +2" or "Travel -1".
     */
    #describeImprovement(instance, data) {
        const improvement = chex.improvements[instance.id];
        const parts = [];
        if (isExtracting(improvement) && instance.resource) {
            const amount = hexProduction([{data: {...data, improvements: [instance]}}], data.claimed, getDefs()).total[instance.resource] ?? 0;
            parts.push(`${chex.resources[instance.resource]?.label || C.FALLBACK_LABEL} +${amount}`);
        }
        if (improvement?.travel) {
            parts.push(`${game.i18n.localize("CHEX.HUD.Travel")} ${improvement.travel > 0 ? "+" : ""}${improvement.travel}`);
        }
        return parts.join(", ");
    }
}
