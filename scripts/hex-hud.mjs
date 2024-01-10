import * as C from "./const.mjs";
import ChexHex from "./hex.mjs";

/**
 * An Application instance that renders a HUD for a single hex on the Stolen Lands region map.
 */
export default class ChexHexHUD extends Application {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "kingmaker-hex-hud",
        classes: [chex.CSS_CLASS],
        template: "modules/pf2e-chex/templates/hex-hud.hbs",
        popOut: false,
        width: 760,
        height: "auto"
      });
    }
  
    /**
     * The target Hex that the HUD describes.
     * @type {ChexHex}}
     */
    hex;
  
    /**
     * Is the hex hud enabled?
     * @type {boolean}
     */
    enabled = false;
  
    /* -------------------------------------------- */
  
    /** @override */
    _injectHTML(html) {
      this._element = html;
      document.getElementById("hud").appendChild(html[0]);
    }
  
    /* -------------------------------------------- */
  
    toggle(enabled) {
      enabled ??= !this.enabled;
      this.enabled = enabled;
      if ( enabled ) chex.manager.kingdomLayer.visible = true;
      else {
        chex.manager.kingdomLayer.visible = false;
        this.clear();
      }
    }
  
    /* -------------------------------------------- */
  
    /** @inheritdoc */
    getData(options = {}) {
      const data = this.hex.hexData;
      return {
        id: this.options.id,
        cssClass: this.options.classes.join(" "),
        hex: this.hex,
        commodity: C.COMMODITIES[data.commodity],
        camp: C.CAMPS[data.camp],
        displayEncounter: data.page && (game.user.isGM || data.showEncounter),
        displayResources: (data.camp || data.commodity) && (game.user.isGM || data.showResources),
        explored: data.exploration > 0,
        zone: this.hex.zone,
        features: data.features.reduce((arr, f) => {
          if ( game.user.isGM || f.discovered ) arr.push({
            name: f.name || game.i18n.localize(C.FEATURES[f.type]?.label),
            discovered: f.discovered,
            img: game.i18n.localize(C.FEATURES[f.type]?.img) || "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/default.webp",
          });
          return arr;
        }, [])
      }
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    setPosition({left, top}={}) {
      const position = {
        height: undefined,
        left: left,
        top: top,
        width: this.options.width
      };
      this.element.css(position);
    }
  
    /* -------------------------------------------- */
  
    /**
     * Activate this HUD element, binding it to a specific hex.
     * @param {KingmakerHex} hex    The target hex for the HUD
     * @returns {Promise<*>}
     */
    async activate(hex) {
      this.hex = hex;

      if ( this.enabled ) {
        let {x, y} = hex.topLeft;
        const options = {left: x + hex.config.width + 20, top: y};
        // Highlights this hex  
        canvas.grid.clearHighlightLayer(C.HIGHLIGHT_LAYER);
        canvas.grid.highlightPosition(C.HIGHLIGHT_LAYER, {x, y, color: Color.from(hex.color)});

        if (chex.manager.pendingPatches.length > 0) {
          chex.manager.pendingPatches.forEach(patch => {
            let {x, y} = patch.hex.topLeft;
            canvas.grid.highlightPosition(C.HIGHLIGHT_LAYER, {x, y, color: Color.from(C.TERRAIN[patch.patch.terrain].color)});
          });
        }

        return this._render(true, options);
      }
    }
  
    /* -------------------------------------------- */
  
    /**
     * Clear the HUD.
     */
    clear() {
      let states = this.constructor.RENDER_STATES;
      canvas.grid.clearHighlightLayer(C.HIGHLIGHT_LAYER);
      if ( this._state <= states.NONE ) return;
      this._state = states.CLOSING;
      this.element.hide();
      this._element = null;
      this._state = states.NONE;
    }
  }
  