import * as C from "./const.mjs";
import ChexData from "./chex-data.mjs";

/**
 * Dialog to confirm paint bucket operation
 */
export default class PaintBucketConfirm extends FormApplication {
  constructor(startHex, targetTerrain, affectedHexes) {
    super();
    this.startHex = startHex;
    this.targetTerrain = targetTerrain;
    this.affectedHexes = affectedHexes;
  }
  
  static formId = "chex-paintBucketConfirm";

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: PaintBucketConfirm.formId,
      classes: [chex.CSS_CLASS],
      template: "modules/pf2e-chex/templates/chex-paint-bucket-confirm.hbs",
      width: 320,
      height: "auto",
      popOut: true,
      closeOnSubmit: true
    });
  }

  get title() {
    return game.i18n.localize("CHEX.PAINTBUCKET.ConfirmTitle");
  }

  startHex;
  targetTerrain;
  affectedHexes;

  async _render(force, options) {
    return super._render(force, options);
  }

  async close(options) {
    await super.close(options);
  }

  async getData(options) {
    const fromTerrainInfo = chex.terrains[this.startHex.hexData.terrain];
    const toTerrainInfo = chex.terrains[this.targetTerrain];
    
    return Object.assign(await super.getData(options), {
      hexCount: this.affectedHexes.length,
      fromTerrain: fromTerrainInfo?.label || C.FALLBACK_LABEL,
      toTerrain: toTerrainInfo?.label || C.FALLBACK_LABEL,
      startHex: this.startHex.toString()
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on("click", "[data-action]", this.#onClickAction.bind(this));
  }

  async #onClickAction(event) {
    event.preventDefault();
    const control = event.currentTarget;
    const action = control.dataset.action;
    
    if (action === "confirm") {
      await this.#executePaintBucket();
    }
    // For cancel or any other action, just close
    this.close();
  }

  async #executePaintBucket() {
    const patches = this.affectedHexes.reduce((result, hex) => {
      const key = ChexData.getKey(hex.offset);
      result.hexes[key] = {
        terrain: this.targetTerrain,
        travel: chex.terrains[this.targetTerrain].travel
      };
      return result;
    }, { hexes: {} });

    await canvas.scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, patches);
  }
}