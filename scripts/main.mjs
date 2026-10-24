import ChexLayer from "./chex-layer.mjs";
import * as C from "./const.mjs";
import { Feature } from "./customizables/features.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ChexData, { ChexImprovement } from "./chex-data.mjs";
import ChexHexEdit from "./chex-edit.mjs";
import ChexHexHUD from "./chex-hud.mjs";
import ChexManager from "./manager.mjs";
import ChexSceneData from "./scene-data.mjs";
import { Building } from "./customizables/buildings.mjs";
import { SettlementSize } from "./customizables/settlement-sizes.mjs";
import { migrateDefinitions, persistMigration } from "./economy/migration.mjs";
import * as RealmStore from "./economy/realm-store.mjs";
import { followClaims } from "./economy/claims.mjs";
import EconomyConfig from "./apps/economy-config.mjs";
import KingdomView from "./apps/kingdom-view.mjs";
import SettlementSheet from "./apps/settlement-sheet.mjs";
import TradeWindow from "./apps/trade-window.mjs";
import { refreshEconomyApps, TEMPLATES } from "./apps/economy-ui.mjs";


const MODULE_ID = "pf2e-chex";

Hooks.once("init", function() {
    // register for all, in case someone wants to get wild
    globalThis.chex = game.modules.get(MODULE_ID);

    chex.CSS_CLASS = "pf2e-km";

    // setup customizables. Stored in settings as they are not linked with anyone scene
    game.settings.register(MODULE_ID, Feature.name, {
        name: Feature.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Feature.getDefaults(),
        onChange: value => {
            chex.features = value;
        }
    });

    game.settings.register(MODULE_ID, Improvement.name, {
        name: Improvement.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Improvement.getDefaults(),
        onChange: value => {
            chex.improvements = value;
            Hooks.callAll("chexEconomyChanged");
        }
    });

    game.settings.register(MODULE_ID, Realm.name, {
        name: Realm.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Realm.getDefaults(),
        onChange: value => {
            chex.realms = value;
            Hooks.callAll("chexEconomyChanged");
        }
    });

    game.settings.register(MODULE_ID, Resource.name, {
        name: Resource.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Resource.getDefaults(),
        onChange: value => {
            chex.resources = value;
            Hooks.callAll("chexEconomyChanged");
        }
    });

    game.settings.register(MODULE_ID, Terrain.name, {
        name: Terrain.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Terrain.getDefaults(),
        onChange: value => {
            chex.terrains = value;
        }
    });

    game.settings.register(MODULE_ID, Travel.name, {
        name: Travel.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Travel.getDefaults(),
        onChange: value => {
            chex.travels = value;
        }
    });

    game.settings.register(MODULE_ID, Building.name, {
        name: Building.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Building.getDefaults(),
        onChange: value => {
            chex.buildings = value;
            Hooks.callAll("chexEconomyChanged");
        }
    });

    game.settings.register(MODULE_ID, SettlementSize.name, {
        name: SettlementSize.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: SettlementSize.getDefaults(),
        onChange: value => {
            chex.settlementSizes = value;
            Hooks.callAll("chexEconomyChanged");
        }
    });

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

    game.settings.registerMenu(MODULE_ID, "economyConfig", {
        name: "CHEX.ECONOMY.Config.Title",
        label: "CHEX.ECONOMY.Config.Title",
        icon: "fa-solid fa-coins",
        type: EconomyConfig,
        restricted: true
    });

    CONFIG.queries[RealmStore.QUERY] = RealmStore.handleQuery;
    chex.economy = RealmStore;
    // for macros
    chex.openKingdom = realmId => KingdomView.open(realmId);
    chex.openSettlement = (realmId, settlementId) => SettlementSheet.open(realmId, settlementId);
    chex.openTrade = (realmId, partner) => TradeWindow.open(realmId, partner);
});

let definitionsMigrated = false;

Hooks.once("ready", async function() {
    await persistMigration(definitionsMigrated);
});

Hooks.once("setup", function() {
    // register own layer for UI controls. Only register if it doesn't exist yet.
    if (!CONFIG.Canvas.layers.chex)  {
        CONFIG.Canvas.layers.chex = { layerClass: ChexLayer, group: "interface" };
    }
    
    chex.manager = new ChexManager();

    // set up customizables
    chex.features = game.settings.get(MODULE_ID, Feature.name);
    chex.improvements = game.settings.get(MODULE_ID, Improvement.name);
    chex.realms = game.settings.get(MODULE_ID, Realm.name);
    chex.resources = game.settings.get(MODULE_ID, Resource.name);
    chex.terrains = game.settings.get(MODULE_ID, Terrain.name);
    chex.travels = game.settings.get(MODULE_ID, Travel.name);
    chex.buildings = game.settings.get(MODULE_ID, Building.name);
    chex.settlementSizes = game.settings.get(MODULE_ID, SettlementSize.name);
    definitionsMigrated = migrateDefinitions();

    // partials used by chat messages and several windows
    foundry.applications.handlebars.loadTemplates([`${TEMPLATES}/amounts-inline.hbs`, `${TEMPLATES}/turn-report.hbs`]);
});

Hooks.on("canvasReady", () => chex.manager._onReady());
Hooks.on("canvasTearDown", () => chex.manager._onTearDown());
Hooks.on("canvasInit", () => chex.manager._onInit());
Hooks.on("getSceneControlButtons", controls => chex.manager._extendSceneControlButtons(controls));
Hooks.on("updateScene", (document, change) => chex.manager._updateScene(document, change));

Hooks.on("chexEconomyChanged", () => {
    refreshEconomyApps();
    chex.manager?.kingdomLayer?.drawSettlements();
});
Hooks.on("updateScene", (document, change) => {
    // claims and improvements change the production of realms
    if (!foundry.utils.hasProperty(change, `flags.${MODULE_ID}`)) return;
    refreshEconomyApps();
    followClaims(document, change);
});
