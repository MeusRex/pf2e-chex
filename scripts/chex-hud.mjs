import * as C from "./const.mjs";
import ChexHex from "./hex.mjs";
import ChexFormulaParser, { KEY_INCOME } from "./formula-parser.mjs";

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
          label: chex.realms[data.claimed]?.label || C.FALLBACK_LABEL,
          color: chex.realms[data.claimed]?.color || C.FALLBACK_COLOR
        };
      }

      const terrain = {
        label: chex.terrains[data.terrain]?.label || C.FALLBACK_LABEL,
        img: chex.terrains[data.terrain]?.img || C.FALLBACK_IMAGE
      };

      const currentTravel = ChexFormulaParser.getTravel(data);
      const travel = {
        label: chex.travels[currentTravel]?.label || C.FALLBACK_LABEL,
        multiplier: chex.travels[currentTravel]?.multiplier || C.FALLBACK_MULTIPLIER
      };

      const explorationState = {
        explored: data.exploration > 0,
        label: Object.values(C.EXPLORATION_STATES).find(v => v.value === data.exploration).label
      };

      const improvements = data.improvements.reduce((arr, o) => {
        if (isGM || o.show) {
          let special = chex.improvements[o.id]?.special || "";
          if (special.startsWith(KEY_INCOME)) {
            special = special.substring(KEY_INCOME.length + 1);
          }
          arr.push({
            label: chex.improvements[o.id]?.label || C.FALLBACK_LABEL,
            img: chex.improvements[o.id]?.img || C.FALLBACK_IMAGE,
            special: special,
            visiFrag: o.show ? visibleFrag : hiddenFrag
          });
        }
        return arr;
      }, []);

      const features = data.features.reduce((arr, o) => {
        if (isGM || o.show) {
          arr.push({
            label: chex.features[o.id]?.label || C.FALLBACK_LABEL,
            img: chex.features[o.id]?.img || C.FALLBACK_IMAGE,
            name: o.name,
            visiFrag: o.show ? visibleFrag : hiddenFrag
          });
        }
        return arr;
      }, []);

      const resources = data.resources.reduce((arr, o) => {
        if (isGM || o.show) {
          arr.push({
            label: chex.resources[o.id]?.label || C.FALLBACK_LABEL,
            img: chex.resources[o.id]?.img || C.FALLBACK_IMAGE,
            amount: o.amount,
            visiFrag: o.show ? visibleFrag : hiddenFrag
          });
        }
        return arr;
      }, []);
      
      const forageables = data.forageables.reduce((arr, o) => {
        if (isGM || o.show) {
          arr.push({
            label: chex.resources[o.id]?.label || C.FALLBACK_LABEL,
            img: chex.resources[o.id]?.img || C.FALLBACK_IMAGE,
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
  
    async activate(hex) {
      this.hex = hex;

      if ( this.enabled ) {
        let {x, y} = hex.topLeft;
        const options = {left: x + hex.grid.sizeX + 20, top: y};
        // Highlights this hex  
        canvas.interface.grid.clearHighlightLayer(C.HIGHLIGHT_LAYER);
        canvas.interface.grid.highlightPosition(C.HIGHLIGHT_LAYER, {x, y, color: Color.from(hex.color)});

        if (chex.manager.pendingPatches.length > 0) {
          chex.manager.pendingPatches.forEach(patch => {
            let {x, y} = patch.hex.topLeft;
            let color = "#ff0000";
            if (patch.patch.terrain)
              color = chex.terrains[patch.patch.terrain]?.color || C.FALLBACK_COLOR;
            else if (patch.patch.claimed)
              color = chex.realms[patch.patch.claimed]?.color || C.FALLBACK_COLOR;

            canvas.interface.grid.highlightPosition(C.HIGHLIGHT_LAYER, {x, y, color: Color.from(color)});
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
      canvas.interface.grid.clearHighlightLayer(C.HIGHLIGHT_LAYER);
      if ( this._state <= states.NONE ) return;
      this._state = states.CLOSING;
      this.element.hide();
      this._element = null;
      this._state = states.NONE;
    }
  }
  