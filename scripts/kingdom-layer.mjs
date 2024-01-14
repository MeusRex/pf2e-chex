import * as C from "./const.mjs"
import ChexInstructionParser from "./instruction-parser.mjs";

/**
 * A canvas Container used to represent the boundaries of the Kingdom.
 */
export default class ChexKingdomLayer extends PIXI.Container {
  constructor() {
    super();
    this.zIndex = 1;
    this.visible = false;
  }

  /**
   * Draw the layer.
   */
  draw() {
    this.removeChildren().forEach(c => c.destroy());
    this.mask = canvas.primary.mask;
    const g = this.addChild(new PIXI.Graphics());

    switch (chex.manager.mode) {
      case C.MODE_TERRAIN:
        this.#drawTerrain(g);
        break;

      case C.MODE_TRAVEL: 
        this.#drawTravel(g);
        break;

      case C.MODE_KINGDOM:
      default:
        this.#drawKingdoms(g);
        break;
    }
  }

  #drawKingdoms(g) {
    const groupedHexes = {};

    // Iterate through each hex
    chex.manager.hexes.filter(h => h.hexData.claimed).forEach(hex => {
      const realmId = hex.hexData.claimed;

      // If the travelId is not in the groupedHexes object, create an empty array
      if (!groupedHexes[realmId]) {
        groupedHexes[realmId] = [];
      }

      // Add the hex to the corresponding group
      groupedHexes[realmId].push(hex);
    });
    
    for (const realmId in groupedHexes) {
      if (groupedHexes.hasOwnProperty(realmId)) {
        const hexGroup = groupedHexes[realmId];
    
        // Assuming ChexKingdomLayer is the class containing the #drawSub method
        this.#drawSub(g, hexGroup, chex.realms[realmId].color);
      }
    }
  }

  #drawTerrain(g) {
    const groupedHexes = {};

    // Iterate through each hex
    chex.manager.hexes.forEach(hex => {
      const terrainId = hex.terrain.id;

      // If the travelId is not in the groupedHexes object, create an empty array
      if (!groupedHexes[terrainId]) {
        groupedHexes[terrainId] = [];
      }

    // Add the hex to the corresponding group
      groupedHexes[terrainId].push(hex);
    });
    
    for (const terrainId in groupedHexes) {
      if (groupedHexes.hasOwnProperty(terrainId)) {
        const hexGroup = groupedHexes[terrainId];
    
        this.#drawSub(g, hexGroup, chex.terrains[terrainId].color);
      }
    }
  }

  #drawTravel(g) {
    const groupedHexes = {};

    // Iterate through each hex
    chex.manager.hexes.forEach(hex => {
      const travelId = ChexInstructionParser.getTravel(hex.hexData);
      //const travelId = hex.travel.id;

      // If the travelId is not in the groupedHexes object, create an empty array
      if (!groupedHexes[travelId]) {
        groupedHexes[travelId] = [];
      }

    // Add the hex to the corresponding group
      groupedHexes[travelId].push(hex);
    });
    
    for (const travelId in groupedHexes) {
      if (groupedHexes.hasOwnProperty(travelId)) {
        const hexGroup = groupedHexes[travelId];
    
        // Assuming ChexKingdomLayer is the class containing the #drawSub method
        this.#drawSub(g, hexGroup, chex.travels[travelId].color);
      }
    }
  }

  #drawSub(g, hexes, color) {
    const polygons = ChexKingdomLayer.#buildPolygons(hexes);
    g.beginFill(color, 0.15).lineStyle({alignment: 0, color: color, width: 4})
    for ( const polygon of polygons ) {
      g.drawShape(polygon.outer);
      for ( const hole of polygon.holes ) {
        g.beginHole(0xFFFFFF).drawShape(hole).endHole();
      }
    }
    g.endFill();
  }
  /* -------------------------------------------- */

  /**
   * A helper function to combine hex coordinates to form polygon regions.
   * @param {KingmakerHex[]} hexes       The hexes which belong to this polygon type
   * @returns {Array<{outer: PIXI.Polygon, holes: PIXI.Polygon[]}>}
   */
  static #buildPolygons(hexes) {
    const g = canvas.grid.grid;
    const c = new ClipperLib.Clipper();
    let polyTree = new ClipperLib.PolyTree();

    // Unionize all hexes
    c.AddPath([], ClipperLib.PolyType.ptSubject, true);
    for ( const hex of hexes ) {
      const {x, y} = hex.topLeft;
      const p = new PIXI.Polygon(g.getPolygon(x, y, g.w, Math.ceil(g.h)+1));
      c.AddPath(p.toClipperPoints(), ClipperLib.PolyType.ptClip, true);
    }
    c.Execute(ClipperLib.ClipType.ctUnion, polyTree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftNonZero);

    // Convert PolyTree solutions an ExPolygons format converted to PIXI.Polygons
    const polygons = ClipperLib.JS.PolyTreeToExPolygons(polyTree);
    for ( const polygon of polygons ) {
      polygon.outer = PIXI.Polygon.fromClipperPoints(polygon.outer);
      polygon.holes = polygon.holes.map(hole => PIXI.Polygon.fromClipperPoints(hole));
    }
    return polygons;
  }
}
