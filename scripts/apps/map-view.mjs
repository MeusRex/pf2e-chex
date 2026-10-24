import * as C from "../const.mjs";
import { TEMPLATES } from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * What the cHex overlay shows besides its colors: settlements and one kind of hex details.
 * Stored per user.
 */
export default class MapViewPanel extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "chex-map-view",
        classes: ["chex-economy", "chex-map-view"],
        window: {
            title: "CHEX.MAPVIEW.Title",
            icon: "fa-solid fa-layer-group",
            minimizable: true
        },
        position: {width: 240, height: "auto", top: 80, left: 120},
        actions: {
            toggleSettlements: MapViewPanel.#onToggleSettlements,
            setDetails: MapViewPanel.#onSetDetails
        }
    };

    static PARTS = {
        main: {template: `${TEMPLATES}/map-view.hbs`}
    };

    static DETAILS = [
        {id: C.MAP_DETAILS.NONE, icon: "fa-solid fa-ban"},
        {id: C.MAP_DETAILS.IMPROVEMENTS, icon: "fa-solid fa-person-digging"},
        {id: C.MAP_DETAILS.RESOURCES, icon: "fa-solid fa-gem"},
        {id: C.MAP_DETAILS.PRODUCTION, icon: "fa-solid fa-arrow-trend-up"}
    ];

    /**
     * Open the panel, or close it if it is open.
     */
    static toggle() {
        const app = foundry.applications.instances.get(MapViewPanel.DEFAULT_OPTIONS.id);
        if (app?.rendered) return app.close();
        return (app ?? new MapViewPanel()).render({force: true});
    }

    static get view() {
        return game.settings.get(C.MODULE_ID, C.MAP_VIEW_SETTING);
    }

    static async #update(changes) {
        await game.settings.set(C.MODULE_ID, C.MAP_VIEW_SETTING, {...MapViewPanel.view, ...changes});
    }

    /** @override */
    async _prepareContext(options) {
        const view = MapViewPanel.view;
        return {
            settlements: view.settlements !== false,
            details: MapViewPanel.DETAILS.map(d => ({...d, label: `CHEX.MAPVIEW.Details.${d.id}`, active: (view.details ?? C.MAP_DETAILS.NONE) === d.id})),
            overlayOff: !chex.manager?.hud?.enabled
        };
    }

    static async #onToggleSettlements() {
        await MapViewPanel.#update({settlements: MapViewPanel.view.settlements === false});
    }

    static async #onSetDetails(event, target) {
        await MapViewPanel.#update({details: target.dataset.details});
    }
}
