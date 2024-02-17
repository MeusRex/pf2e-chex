import {FALLBACK_COLOR, EXPLORATION_STATES, HIGHLIGHT_LAYER} from "./const.mjs";
import ChexHex from "./hex.mjs";
import ChexFormulaParser, { KEY_INCOME } from "./formula-parser.mjs";
import KoApplication from "./KoApplication.mjs";
import ImprovementVM from "./ViewModels/ImprovementVM.mjs";
import FeatureVM from "./ViewModels/FeatureVM.mjs";
import ResourceVM from "./ViewModels/ResourceVM.mjs";
import ClaimVM from "./ViewModels/ClaimVM.mjs";
import TerrainVM from "./ViewModels/TerrainVM.mjs";
import TravelVM from "./ViewModels/TravelVM.mjs";
import ExplorationVM from "./ViewModels/ExplorationVM.mjs";

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
  
    private claimVM = window.ko.observable(new ClaimVM());
    private terrainVM = window.ko.observable(new TerrainVM());
    private travelVM = window.ko.observable(new TravelVM());
    private explorationVM = window.ko.observable(new ExplorationVM());
    private improvementVMs = window.ko.observableArray<ImprovementVM>();
    private featureVMs = window.ko.observableArray<FeatureVM>();
    private resourceVMs = window.ko.observableArray<ResourceVM>();
    private forageableVMs = window.ko.observableArray<ResourceVM>();

    private title = window.ko.observable("");

    public showHud = window.ko.observable(false);

    // inject directly into the hud, which is the playable area. If this isn't done, you get wierd ass effects.
    _injectHTML(html) {
      this._element = html;
      // @ts-ignore
      document.getElementById("hud").appendChild(html[0]);
    }

    loadData() {
      if (!this.hex) return;

      const data = this.hex.hexData;
      const gm = game.user.isGM;

      this.title(`${this.hex}`);

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
  
    setHex(hex: ChexHex) {
      this.hex = hex;
      this.loadData();

      const {x, y} = hex.topLeft;
      const options = {left: x + hex.config.width + 20, top: y};

      canvas.grid.clearHighlightLayer(HIGHLIGHT_LAYER);
      canvas.grid.highlightPosition(HIGHLIGHT_LAYER, {x, y, color: Color.from(hex.color)});

      if (chex.manager.pendingPatches.length > 0) {
        chex.manager.pendingPatches.forEach(patch => {
          const {x, y} = patch.hex.topLeft;
          let color = "#ff0000";
          if (patch.patch.terrain)
            color = chex.terrains[patch.patch.terrain]?.color || FALLBACK_COLOR;
          else if (patch.patch.claimed)
            color = chex.realms[patch.patch.claimed]?.color || FALLBACK_COLOR;

          canvas.grid.highlightPosition(HIGHLIGHT_LAYER, {x, y, color: Color.from(color)});
        });
      }

      if (!this.rendered) {
        this.render(true, options);
      }
      else {
        this.setPosition(options)
      }

      this.show(true);
    }
  
    public show(visible: boolean) {
      this.showHud(visible);
      if (!visible)
        canvas.grid.clearHighlightLayer(HIGHLIGHT_LAYER);
      // this.element.hide();
    }
  
    override close(options: any): void {
      canvas.grid.clearHighlightLayer(HIGHLIGHT_LAYER);
      super.close(options);
    }
  }
  