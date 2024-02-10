import {FALLBACK_COLOR, FALLBACK_IMAGE, FALLBACK_LABEL, FALLBACK_MULTIPLIER, EXPLORATION_STATES, HIGHLIGHT_LAYER} from "./const.mjs";
import ChexHex from "./hex.mjs";
import ChexFormulaParser, { KEY_INCOME } from "./formula-parser.mjs";
import KoApplication from "./KoApplication.mjs";
import { Realm } from "./customizables/realms.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ImprovementVM from "./ViewModels/ImprovementVM.mjs";
import FeatureVM from "./ViewModels/FeatureVM.mjs";
import { Resource } from "./customizables/resources.mjs";
import ResourceVM from "./ViewModels/ResourceVM.mjs";

class ClaimVM {
  claimed = window.ko.observable(false);
  label = window.ko.observable("");
  color = window.ko.observable("");

  update(key: string) {
    if (key) {
      const realm: Realm = chex.realms[key];
      this.label(realm?.label || FALLBACK_LABEL);
      this.color(realm?.color || FALLBACK_COLOR)
      this.claimed(true);
    }
    else {
      this.claimed(false);
      this.label("");
      this.color("");
    }
  }
}

class TerrainVM {
  label: ko.Observable<string> = window.ko.observable("");
  img: ko.Observable<string> = window.ko.observable("");

  update(key: string) {
    const terrain: Terrain = chex.terrains[key];
    this.label(terrain?.label || FALLBACK_LABEL);
    this.img(terrain?.img || FALLBACK_IMAGE);
  }
}

class TravelVM {
  label: ko.Observable<string> = window.ko.observable("");
  multiplier: ko.Observable<number> = window.ko.observable(1);

  update(key: string) {
    const travel: Travel = chex.travels[key];
    this.label(travel?.label || FALLBACK_LABEL);
    this.multiplier(travel?.multiplier || FALLBACK_MULTIPLIER);
  }
}

class ExplorationVM {
  explored = window.ko.observable(false);
  cleared = window.ko.observable(false);
  label = window.ko.observable("");

  update(explored: boolean, cleared: boolean, label: string) {
    this.explored(explored);
    this.cleared(cleared);
    this.label(label);
  }
}

/**
 * An Application instance that renders a HUD for a single hex on the Stolen Lands region map.
 */
export default class ChexHexHUD extends KoApplication {
    static override get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "chex-hud",
        classes: [chex.CSS_CLASS],
        template: "modules/pf2e-chex/templates/chex-hud.html",
        popOut: false,
        width: 760,
        height: "auto"
      });
    }
  
    constructor() {
      super();
      this.mlKey = "CHEX.HUD.";
    }

    public hex: ChexHex | null = null;
    public enabled: boolean = false;
  
    toggle(enabled?: boolean): void {
      enabled ??= !this.enabled;
      this.enabled = enabled;
      if ( enabled ) chex.manager.kingdomLayer.visible = true;
      else {
        chex.manager.kingdomLayer.visible = false;
        this.clear();
      }
    }
  
    private claimVM = window.ko.observable(new ClaimVM());
    private terrainVM = window.ko.observable(new TerrainVM());
    private travelVM = window.ko.observable(new TravelVM());
    private explorationVM = window.ko.observable(new ExplorationVM());
    private improvementVMs = window.ko.observableArray<ImprovementVM>([]);
    private featureVMs = window.ko.observableArray<FeatureVM>([]);
    private resourceVMs = window.ko.observableArray<ResourceVM>([]);
    private forageableVMs = window.ko.observableArray<ResourceVM>([]);

    loadData() {
      if (!this.hex) return;

      const data = this.hex.hexData;
      const gm = game.user.isGM;

      this.claimVM().update(data.claimed);
      this.terrainVM().update(data.terrain);

      const currentTravel = ChexFormulaParser.getTravel(data);
      this.travelVM().update(currentTravel);

      this.explorationVM().update(data.exploration > 0, data.cleared, Object.values(EXPLORATION_STATES).find(v => v.value === data.exploration)?.label ?? "");
      this.improvementVMs(data.improvements
        .filter(i => gm || i.show)
        .map(i => new ImprovementVM(i)));

      this.featureVMs(data.features
        .filter(f => gm || f.show)
        .map(f => new FeatureVM(f)));

      this.resourceVMs(data.resources
        .filter(r => gm || r.show)
        .map(r => new ResourceVM(r)));

        this.forageableVMs(data.forageables
          .filter(f => gm || f.show)
          .map(f => new ResourceVM(f)));
    }

    eye(mode: boolean): string {
      return mode ? "fa-eye" : "fa-eye-slash";
    }
  
    override setPosition({left, top}={left: 0, top: 0}) {
      const position = {
        height: undefined,
        left: left,
        top: top,
        width: this.options.width
      };
      this.element.css(position);
    }
  
    async activate(hex: any) {
      this.hex = hex;

      this.loadData();
      if ( this.enabled ) {
        let {x, y} = hex.topLeft;
        const options = {left: x + hex.config.width + 20, top: y};
        // Highlights this hex  
        canvas.grid.clearHighlightLayer(HIGHLIGHT_LAYER);
        canvas.grid.highlightPosition(HIGHLIGHT_LAYER, {x, y, color: Color.from(hex.color)});

        if (chex.manager.pendingPatches.length > 0) {
          chex.manager.pendingPatches.forEach(patch => {
            let {x, y} = patch.hex.topLeft;
            let color = "#ff0000";
            if (patch.patch.terrain)
              color = chex.terrains[patch.patch.terrain]?.color || FALLBACK_COLOR;
            else if (patch.patch.claimed)
              color = chex.realms[patch.patch.claimed]?.color || FALLBACK_COLOR;

            canvas.grid.highlightPosition(HIGHLIGHT_LAYER, {x, y, color: Color.from(color)});
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
      // @ts-ignore
      let states = this.constructor.RENDER_STATES;
      canvas.grid.clearHighlightLayer(HIGHLIGHT_LAYER);
      if ( this._state <= states.NONE ) return;
      this._state = states.CLOSING;
      this.element.hide();
      this._element = null;
      this._state = states.NONE;
    }
  }
  