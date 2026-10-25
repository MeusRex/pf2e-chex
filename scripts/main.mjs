import ChexLayer from "./chex-layer.mjs";
import * as C from "./const.mjs";
import { Feature } from "./customizables/features.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import { Building } from "./customizables/buildings.mjs";
import { SettlementSize } from "./customizables/settlement-sizes.mjs";
import ChexManager from "./manager.mjs";
import { migrateDefinitions, persistMigration } from "./economy/migration.mjs";
import * as RealmStore from "./economy/realm-store.mjs";
import { followClaims } from "./economy/claims.mjs";
import ChexConfig from "./apps/config.mjs";
import KingdomView from "./apps/kingdom-view.mjs";
import SettlementSheet from "./apps/settlement-sheet.mjs";
import TradeWindow from "./apps/trade-window.mjs";
import { refreshEconomyApps, TEMPLATES } from "./apps/economy-ui.mjs";
import { CHANGELOG_SETTING, showChangelog } from "./changelog.mjs";

const MODULE_ID = C.MODULE_ID;

/**
 * Configurable definitions: world setting key, property on the module, defaults.
 * Stored in settings as they are not linked with any scene.
 */
const DEFINITIONS = [
    {setting: "Feature", property: "features", defaults: Feature.getDefaults},
    {setting: "Improvement", property: "improvements", defaults: Improvement.getDefaults},
    {setting: "Realm", property: "realms", defaults: Realm.getDefaults},
    {setting: "Resource", property: "resources", defaults: Resource.getDefaults},
    {setting: "Terrain", property: "terrains", defaults: Terrain.getDefaults},
    {setting: "Travel", property: "travels", defaults: Travel.getDefaults},
    {setting: "Building", property: "buildings", defaults: Building.getDefaults},
    {setting: "SettlementSize", property: "settlementSizes", defaults: SettlementSize.getDefaults}
];

Hooks.once("init", function() {
    // register for all, in case someone wants to get wild
    globalThis.chex = game.modules.get(MODULE_ID);

    for (const {setting, property, defaults} of DEFINITIONS) {
        game.settings.register(MODULE_ID, setting, {
            name: setting,
            scope: "world",
            config: false,
            requiresReload: false,
            type: Object,
            default: defaults(),
            onChange: value => {
                chex[property] = value;
                Hooks.callAll("chexEconomyChanged");
            }
        });
    }

    // the realm the players manage
    game.settings.register(MODULE_ID, RealmStore.PLAYER_REALM_SETTING, {
        name: RealmStore.PLAYER_REALM_SETTING,
        scope: "world",
        config: false,
        requiresReload: false,
        type: String,
        default: "",
        onChange: () => {
            Hooks.callAll("chexEconomyChanged");
            ui.controls?.render({reset: true});
        }
    });

    // what the overlay shows, per user
    game.settings.register(MODULE_ID, C.MAP_VIEW_SETTING, {
        name: C.MAP_VIEW_SETTING,
        scope: "user",
        config: false,
        requiresReload: false,
        type: Object,
        default: {...C.MAP_VIEW_DEFAULT},
        onChange: () => {
            chex.manager?.kingdomLayer?.draw();
            foundry.applications.instances.get("chex-map-view")?.render();
        }
    });

    // the version whose changelog this user has seen
    game.settings.register(MODULE_ID, CHANGELOG_SETTING, {
        name: CHANGELOG_SETTING,
        scope: "user",
        config: false,
        type: String,
        default: ""
    });

    // per realm: stockpile, settlements, drains. Only changed through RealmStore.request
    game.settings.register(MODULE_ID, RealmStore.REALM_STATE_SETTING, {
        name: RealmStore.REALM_STATE_SETTING,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: {},
        onChange: () => Hooks.callAll("chexEconomyChanged")
    });

    game.settings.registerMenu(MODULE_ID, "config", {
        name: "CHEX.CONFIG.Title",
        label: "CHEX.CONFIG.Title",
        icon: C.ICONS.config,
        type: ChexConfig,
        restricted: true
    });

    CONFIG.queries[RealmStore.QUERY] = RealmStore.handleQuery;
    chex.economy = RealmStore;
    // for macros
    chex.openKingdom = realmId => KingdomView.open(realmId);
    chex.openSettlement = (realmId, settlementId) => SettlementSheet.open(realmId, settlementId);
    chex.openTrade = (realmId, partner) => TradeWindow.open(realmId, partner);
    chex.openConfig = () => ChexConfig.open();
});

let definitionsMigrated = false;

Hooks.once("setup", function() {
    // register own layer for UI controls. Only register if it doesn't exist yet.
    if (!CONFIG.Canvas.layers.chex)  {
        CONFIG.Canvas.layers.chex = { layerClass: ChexLayer, group: "interface" };
    }

    chex.manager = new ChexManager();

    for (const {setting, property} of DEFINITIONS) chex[property] = game.settings.get(MODULE_ID, setting);
    definitionsMigrated = migrateDefinitions();

    // partials used by chat messages and several windows
    foundry.applications.handlebars.loadTemplates([`${TEMPLATES}/amounts-inline.hbs`, `${TEMPLATES}/turn-report.hbs`]);
});

Hooks.once("ready", async function() {
    await persistMigration(definitionsMigrated);
    showChangelog();
});

Hooks.on("canvasReady", () => chex.manager._onReady());
Hooks.on("canvasTearDown", () => chex.manager._onTearDown());
Hooks.on("canvasInit", () => chex.manager._onInit());
Hooks.on("getSceneControlButtons", controls => chex.manager._extendSceneControlButtons(controls));

Hooks.on("chexEconomyChanged", () => {
    refreshEconomyApps();
    chex.manager?.kingdomLayer?.draw();
});
Hooks.on("updateScene", (document, change) => {
    if (!foundry.utils.hasProperty(change, `flags.${MODULE_ID}`)) return;
    chex.manager._updateScene(document, change);
    // claims and improvements change the production of realms
    refreshEconomyApps();
    followClaims(document, change);
});
