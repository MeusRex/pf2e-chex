import ChexLayer from "./chex-layer.mjs";
import * as C from "./const.mjs";
import { Feature } from "./customizables/features.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ChexData, { ChexImprovement } from "./hex-data.mjs";
import ChexHexEdit from "./hex-edit.mjs";
import ChexHexHUD from "./hex-hud.mjs";
import ChexManager from "./manager.mjs";
import ChexSceneData from "./scene-data.mjs";


const MODULE_ID = "pf2e-chex";

Hooks.once("init", function() {
    globalThis.chex = game.modules.get(MODULE_ID);

    chex.CSS_CLASS = "pf2e-km";

    // setup settings
    game.settings.register(MODULE_ID, Feature.name, {
        name: Feature.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Feature.getDefaults()
    });

    game.settings.register(MODULE_ID, Improvement.name, {
        name: Improvement.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Improvement.getDefaults()
    });

    game.settings.register(MODULE_ID, Realm.name, {
        name: Realm.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Realm.getDefaults()
    });

    game.settings.register(MODULE_ID, Resource.name, {
        name: Resource.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Resource.getDefaults()
    });

    game.settings.register(MODULE_ID, Terrain.name, {
        name: Terrain.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Terrain.getDefaults()
    });

    game.settings.register(MODULE_ID, Travel.name, {
        name: Travel.name,
        scope: "world",
        config: false,
        requiresReload: false,
        type: Object,
        default: Travel.getDefaults()
    });
    
});

Hooks.once("ready", async function() {
    // enable kingmaker features like kingdoms
    game.settings.set("pf2e", "campaignType", "kingmaker");
});

Hooks.once("setup", function() {
    if (!CONFIG.Canvas.layers.chex) CONFIG.Canvas.layers.chex = { layerClass: ChexLayer, group: "interface" };
    chex.manager = new ChexManager();
});

Hooks.on("canvasReady", () => chex.manager._onReady());
Hooks.on("canvasTearDown", () => chex.manager._onTearDown());
Hooks.on("canvasInit", () => chex.manager._onInit());
Hooks.on("getSceneControlButtons", buttons => chex.manager._extendSceneControlButtons(buttons));
Hooks.on("updateScene", (document, change) => chex.manager._updateScene(document, change));