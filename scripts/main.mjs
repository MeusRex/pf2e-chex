import ChexLayer from "./chex-layer.mjs";
import * as C from "./const.mjs";
import ChexData from "./hex-data.mjs";
import ChexHexEdit from "./hex-edit.mjs";
import ChexHexHUD from "./hex-hud.mjs";
import ChexManager from "./manager.mjs";
import ChexSceneData from "./scene-data.mjs";


const MODULE_ID = "pf2e-chex";

Hooks.once("init", function() {
    globalThis.chex = game.modules.get(MODULE_ID);

    chex.CSS_CLASS = "pf2e-km";    
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