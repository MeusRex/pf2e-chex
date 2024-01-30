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
import * as ko from "./knockout.js"


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
    
});

Hooks.once("ready", async function() {
    // enable kingmaker features like kingdoms
    // game.settings.set("pf2e", "campaignType", "kingmaker");
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
});

Hooks.on("canvasReady", () => chex.manager._onReady());
Hooks.on("canvasTearDown", () => chex.manager._onTearDown());
Hooks.on("canvasInit", () => chex.manager._onInit());
Hooks.on("getSceneControlButtons", buttons => chex.manager._extendSceneControlButtons(buttons));
Hooks.on("updateScene", (document, change) => chex.manager._updateScene(document, change));