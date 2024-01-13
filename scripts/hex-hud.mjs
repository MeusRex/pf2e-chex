import * as C from "./const.mjs";
import ChexHex from "./hex.mjs";
import ChexInstructionParser, { KEY_INCOME } from "./instruction-parser.mjs";

/**
 * An Application instance that renders a HUD for a single hex on the Stolen Lands region map.
 */
export default class ChexHexHUD extends Application {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "chex-hud",
        classes: [chex.CSS_CLASS],
        template: "modules/pf2e-chex/templates/chex-hud.hbs",
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
      const visibleFrag = 'fa-eye';
      const hiddenFrag = 'fa-eye-slash';
      const data = this.hex.hexData;
      const isGM = game.user.isGM;

      let claim = {};
      if (data.claimed) {
        claim = {
          label: chex.realms[data.claimed].label,
          color: chex.realms[data.claimed].color
        };
      }

      const terrain = {
        label: chex.terrains[data.terrain].label,
        img: chex.terrains[data.terrain].img
      };

      const currentTravel = ChexInstructionParser.getTravel(data);
      const travel = {
        label: chex.travels[currentTravel].label,
        multiplier: chex.travels[currentTravel].multiplier
      };

      const explorationState = {
        explored: data.exploration > 0,
        label: Object.values(C.EXPLORATION_STATES).find(v => v.value === data.exploration).label
      };

      const improvements = data.improvements.reduce((arr, o) => {
        if (isGM || o.show) {
          let special = chex.improvements[o.id].special;
          if (special.startsWith(KEY_INCOME)) {
            special = special.substring(KEY_INCOME.length + 1);
          }
          arr.push({
            label: chex.improvements[o.id].label,
            img: chex.improvements[o.id].img,
            special: special,
            visiFrag: o.show ? visibleFrag : hiddenFrag
          });
        }
        return arr;
      }, []);

      const features = data.features.reduce((arr, o) => {
        if (isGM || o.show) {
          arr.push({
            label: chex.features[o.id].label,
            img: chex.features[o.id].img,
            name: o.name,
            visiFrag: o.show ? visibleFrag : hiddenFrag
          });
        }
        return arr;
      }, []);

      const resources = data.resources.reduce((arr, o) => {
        if (isGM || o.show) {
          arr.push({
            label: chex.resources[o.id].label,
            img: chex.resources[o.id].img,
            amount: o.amount,
            visiFrag: o.show ? visibleFrag : hiddenFrag
          });
        }
        return arr;
      }, []);
      
      const forageables = data.forageables.reduce((arr, o) => {
        if (isGM || o.show) {
          arr.push({
            label: chex.resources[o.id].label,
            img: chex.resources[o.id].img,
            amount: o.amount,
            visiFrag: o.show ? visibleFrag : hiddenFrag
          });
        }
        return arr;
      }, []);

      return {
        id: this.options.id,
        cssClass: this.options.classes.join(" "),
        hex: this.hex,

        terrain,
        travel,
        explorationState,
        claim,
        
        improvements: improvements,
        features: features,
        resources: resources,
        forageables: forageables
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
            canvas.grid.highlightPosition(C.HIGHLIGHT_LAYER, {x, y, color: Color.from(chex.terrains[patch.patch.terrain].color)});
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
  