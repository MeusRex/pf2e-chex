import * as C from "./const.mjs"

/**
 * A canvas Container used to represent the boundaries of the Kingdom.
 */
export default class ChexKingdomLayer extends PIXI.Container {
  constructor() {
    super();
    this.zIndex = 1;
    this.visible = false;
  }

  mode = C.MODE_KINGDOM;
  /**
   * Draw the layer.
   */
  draw() {
    this.removeChildren().forEach(c => c.destroy());
    this.mask = canvas.primary.mask;
    const g = this.addChild(new PIXI.Graphics());
    const hexes = chex.manager.hexes.filter(h => h.hexData.claimed);
    const polygons = ChexKingdomLayer.#buildPolygons(hexes);
    const color = game.actors.party?.getFlag("pf2e", "color") ?? Color.from("FF0000");
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
