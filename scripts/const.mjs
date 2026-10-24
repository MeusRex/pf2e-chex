export const MODULE_ID = "pf2e-chex";
export const CHEX_DATA_KEY = "chex-data";
export const HIGHLIGHT_LAYER = "KingmakerRegion";
export const MODE_REALM = "kingdom";
export const MODE_TERRAIN = "terrain";
export const MODE_TRAVEL = "travel";
export const FALLBACK_COLOR = "#ff0000";
export const FALLBACK_LABEL = "Missing Data";
export const FALLBACK_IMAGE = "icons/sundries/flags/banner-flag-pirate.webp";
export const FALLBACK_MULTIPLIER = 1;
export const MAP_VIEW_SETTING = "mapView";
export const MAP_VIEW_DEFAULT = Object.freeze({colorBy: "kingdom", settlements: true, details: "none"});

/**
 * One icon per concept, used by all tools and windows.
 */
export const ICONS = Object.freeze({
    overlay: "fa-solid fa-hexagon-image",
    mapView: "fa-solid fa-layer-group",
    realm: "fa-solid fa-flag",
    kingdom: "fa-solid fa-crown",
    terrain: "fa-solid fa-mountain",
    travel: "fa-solid fa-route",
    feature: "fa-solid fa-landmark",
    settlement: "fa-solid fa-city",
    improvement: "fa-solid fa-person-digging",
    resource: "fa-solid fa-gem",
    production: "fa-solid fa-arrow-trend-up",
    building: "fa-solid fa-building",
    paint: "fa-solid fa-paintbrush",
    bucket: "fa-solid fa-fill-drip",
    config: "fa-solid fa-gear",
    power: "fa-solid fa-power-off",
    trade: "fa-solid fa-scale-balanced",
    none: "fa-solid fa-ban"
});
export const MAP_DETAILS = Object.freeze({
    NONE: "none",
    IMPROVEMENTS: "improvements",
    RESOURCES: "resources",
    PRODUCTION: "production"
});

export const EXPLORATION_STATES = Object.freeze({
    NONE: {value: 0, label: "CHEX.EXPLORATION_STATES.None"},
    RECON: {value: 1, label: "CHEX.EXPLORATION_STATES.Scouted"},
    MAP: {value: 2, label: "CHEX.EXPLORATION_STATES.Mapped"}
  });