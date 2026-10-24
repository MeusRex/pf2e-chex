import * as C from "../const.mjs";
import { TEMPLATES } from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * What the cHex overlay shows: the coloring, settlements and one kind of hex details. Stored per user.
 */
export default class MapViewPanel extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "chex-map-view",
        classes: ["chex-app", "chex-map-view"],
        window: {
            title: "CHEX.MAPVIEW.Title",
            icon: C.ICONS.mapView,
            minimizable: true
        },
        position: {width: 240, height: "auto", top: 80, left: 120},
        actions: {
            setColorBy: MapViewPanel.#onSetColorBy,
            toggleSettlements: MapViewPanel.#onToggleSettlements,
            setDetails: MapViewPanel.#onSetDetails
        }
    };

    static PARTS = {
        main: {template: `${TEMPLATES}/map-view.hbs`}
    };

    static COLOR_BY = [
        {id: C.MODE_REALM, icon: C.ICONS.realm, label: "CHEX.MAPVIEW.ColorBy.realm"},
        {id: C.MODE_TERRAIN, icon: C.ICONS.terrain, label: "CHEX.MAPVIEW.ColorBy.terrain"},
        {id: C.MODE_TRAVEL, icon: C.ICONS.travel, label: "CHEX.MAPVIEW.ColorBy.travel"}
    ];

    static DETAILS = [
        {id: C.MAP_DETAILS.NONE, icon: C.ICONS.none},
        {id: C.MAP_DETAILS.IMPROVEMENTS, icon: C.ICONS.improvement},
        {id: C.MAP_DETAILS.RESOURCES, icon: C.ICONS.resource},
        {id: C.MAP_DETAILS.PRODUCTION, icon: C.ICONS.production}
    ];

    /**
     * Open the panel, or close it if it is open.
     */
    static toggle() {
        const app = foundry.applications.instances.get(MapViewPanel.DEFAULT_OPTIONS.id);
        if (app?.rendered) return app.close();
        return (app ?? new MapViewPanel()).render({force: true});
    }

    /**
     * The map view of the current user.
     * @returns {{colorBy: string, settlements: boolean, details: string}}
     */
    static get view() {
        return {...C.MAP_VIEW_DEFAULT, ...game.settings.get(C.MODULE_ID, C.MAP_VIEW_SETTING)};
    }

    /**
     * Change parts of the map view of the current user.
     */
    static async update(changes) {
        const view = MapViewPanel.view;
        if (Object.entries(changes).every(([key, value]) => view[key] === value)) return;
        await game.settings.set(C.MODULE_ID, C.MAP_VIEW_SETTING, {...view, ...changes});
    }

    /** @override */
    async _prepareContext(options) {
        const view = MapViewPanel.view;
        return {
            colorBy: MapViewPanel.COLOR_BY.map(c => ({...c, active: view.colorBy === c.id})),
            settlements: view.settlements !== false,
            settlementIcon: C.ICONS.settlement,
            details: MapViewPanel.DETAILS.map(d => ({...d, label: `CHEX.MAPVIEW.Details.${d.id}`, active: view.details === d.id})),
            overlayOff: !chex.manager?.hud?.enabled
        };
    }

    static async #onSetColorBy(event, target) {
        await MapViewPanel.update({colorBy: target.dataset.value});
    }

    static async #onToggleSettlements() {
        await MapViewPanel.update({settlements: MapViewPanel.view.settlements === false});
    }

    static async #onSetDetails(event, target) {
        await MapViewPanel.update({details: target.dataset.value});
    }
}
