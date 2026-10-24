import * as C from "./const.mjs";
import { currentTravel } from "./travel.mjs";
import { allSettlements, getDefs } from "./economy/realm-store.mjs";
import { hexProduction } from "./economy/engine.mjs";
import ChexData from "./chex-data.mjs";

export default class ChexDrawingLayer extends PIXI.Container {
  constructor() {
    super();
    this.zIndex = 0;
    this.visible = false;

    /**
     * Stores a PIXI.Graphics object and its fingerprint for each layer/type
     * Map<string, { graphics: PIXI.Graphics, fingerprint: string }>
     */
    this._graphicsByType = new Map();

    /**
     * Icons of improvements, resources or production per hex, see the map view options.
     */
    this.detailMarkers = this.addChild(new PIXI.Container());

    /**
     * Markers of the settlements on this scene, drawn on top of every mode.
     */
    this.settlementMarkers = this.addChild(new PIXI.Container());
  }

  /**
   * Counter to drop outdated detail drawings, as loading textures is asynchronous.
   */
  #detailsDrawId = 0;

  /**
   * Draw or toggle the layer for the current mode.
   * Keeps previously drawn layers in the cache and avoids unnecessary redraws.
   */
  draw() {
    // draws run one after another, otherwise overlapping draws destroy the same cached graphics twice
    this.#drawing = this.#drawing.then(() => this.#draw()).catch(err => console.error("cHex | Drawing failed", err));
    return this.#drawing;
  }

  #drawing = Promise.resolve();

  async #draw() {
    this.mask = canvas.primary.mask;

    const layerType = this.#getLayerTypeFromMode();
    if (!layerType) return;

    // Hide all other layers first
    for (const [key, entry] of this._graphicsByType.entries()) {
      if (entry) entry.graphics.visible = false;
    }

    // Draw or toggle the requested layer
    await this.#toggleOrDrawLayer(layerType);
    await this.drawOverlays();
  }

  /**
   * Draw settlements and hex details according to the map view options of this user.
   */
  async drawOverlays() {
    this.drawSettlements();
    await this.drawDetails();
  }

  get mapView() {
    return game.settings.get(C.MODULE_ID, C.MAP_VIEW_SETTING);
  }

  /**
   * Draw a marker with the name of every settlement on this scene.
   */
  drawSettlements() {
    for (const child of this.settlementMarkers.removeChildren()) child.destroy({children: true});
    this.settlementMarkers.visible = this.mapView.settlements !== false;
    const size = canvas.grid.size;
    const style = CONFIG.canvasTextStyle.clone();
    style.fontSize = Math.max(14, Math.round(size * 0.2));

    for (const {realmId, settlement} of allSettlements()) {
      if (settlement.sceneId !== canvas.scene?.id || settlement.hexKey === "") continue;
      const hex = chex.manager.hexes.get(Number(settlement.hexKey));
      if (!hex) continue;
      const {x, y} = hex.center;
      const rank = chex.settlementSizes[settlement.size]?.rank ?? 1;
      const radius = size * (0.08 + 0.03 * Math.min(rank, 5));

      const marker = new PIXI.Graphics();
      // the outline shows how happy the settlement was last turn
      const happiness = settlement.happiness ?? 100;
      const outline = happiness >= 80 ? 0x2e7d32 : happiness >= 50 ? 0xf9a825 : 0xc62828;
      marker.lineStyle({width: Math.max(3, size * 0.04), color: outline, alpha: 1});
      marker.beginFill(Color.from(chex.realms[realmId]?.color || C.FALLBACK_COLOR), 1);
      marker.drawCircle(x, y, radius);
      marker.endFill();
      this.settlementMarkers.addChild(marker);

      const label = new foundry.canvas.containers.PreciseText(settlement.name, style);
      label.anchor.set(0.5, 0);
      label.position.set(x, y + radius + 2);
      this.settlementMarkers.addChild(label);
    }
    // keep on top of the hex groups
    this.addChild(this.detailMarkers);
    this.addChild(this.settlementMarkers);
  }

  /**
   * Draw a row of icons on every hex that has improvements, resources or production, depending on the map view.
   */
  async drawDetails() {
    const drawId = ++this.#detailsDrawId;
    const mode = this.mapView.details ?? C.MAP_DETAILS.NONE;
    const entries = [];
    if (mode !== C.MAP_DETAILS.NONE) {
      for (const hex of chex.manager.hexes) {
        const items = this.#detailItems(mode, hex.hexData);
        if (items.length) entries.push({hex, items});
      }
    }

    const sources = [...new Set(entries.flatMap(e => e.items.map(i => i.img)))];
    await Promise.all(sources.map(src => foundry.canvas.loadTexture(src, {fallback: C.FALLBACK_IMAGE})));
    if (drawId !== this.#detailsDrawId) return;

    for (const child of this.detailMarkers.removeChildren()) child.destroy({children: true});
    const size = canvas.grid.size;
    const iconSize = Math.round(size * 0.26);
    const gap = Math.round(iconSize * 0.12);
    const style = CONFIG.canvasTextStyle.clone();
    style.fontSize = Math.max(12, Math.round(size * 0.13));

    // on settlement hexes the icons move up, to make room for the marker
    const settlementHexes = new Set(this.settlementMarkers.visible ? allSettlements()
      .filter(({settlement}) => settlement.sceneId === canvas.scene?.id)
      .map(({settlement}) => String(settlement.hexKey)) : []);

    for (const {hex, items} of entries) {
      const {x, y} = hex.center;
      const width = items.length * iconSize + (items.length - 1) * gap;
      const top = settlementHexes.has(String(ChexData.getKey(hex.offset))) ? y - size * 0.42 : y - iconSize / 2;
      const group = new PIXI.Container();

      const background = new PIXI.Graphics();
      background.beginFill(0x000000, 0.45);
      background.drawRoundedRect(x - width / 2 - gap, top - gap, width + 2 * gap, iconSize + 2 * gap, gap * 2);
      background.endFill();
      group.addChild(background);

      items.forEach((item, i) => {
        const left = x - width / 2 + i * (iconSize + gap);
        const texture = foundry.canvas.getTexture(item.img) ?? foundry.canvas.getTexture(C.FALLBACK_IMAGE);
        if (texture) {
          const icon = new PIXI.Sprite(texture);
          icon.width = icon.height = iconSize;
          icon.position.set(left, top);
          group.addChild(icon);
        }
        if (item.text) {
          const label = new foundry.canvas.containers.PreciseText(item.text, style);
          label.anchor.set(1, 1);
          label.position.set(left + iconSize + gap, top + iconSize + gap);
          group.addChild(label);
        }
      });
      this.detailMarkers.addChild(group);
    }
  }

  /**
   * Icons to show on a hex. Players only see what the GM made visible.
   * @returns {{img: string, text?: string}[]}
   */
  #detailItems(mode, data) {
    const visible = entry => game.user.isGM || entry.show;
    switch (mode) {
      case C.MAP_DETAILS.IMPROVEMENTS:
        return (data.improvements ?? []).filter(i => i.id && visible(i))
          .map(i => ({img: chex.improvements[i.id]?.img || C.FALLBACK_IMAGE}));
      case C.MAP_DETAILS.RESOURCES:
        return (data.resources ?? []).filter(r => r.id && visible(r))
          .map(r => ({img: chex.resources[r.id]?.img || C.FALLBACK_IMAGE, text: Number(r.amount) > 1 ? `×${r.amount}` : ""}));
      case C.MAP_DETAILS.PRODUCTION: {
        // production only counts for claimed hexes. Buildings of settlements are not shown here.
        if (!data.claimed) return [];
        const improvements = (data.improvements ?? []).filter(visible);
        const {total} = hexProduction([{data: {...data, improvements}}], data.claimed, getDefs());
        return Object.entries(total).map(([id, amount]) => ({img: chex.resources[id]?.img || C.FALLBACK_IMAGE, text: `+${amount}`}));
      }
      default:
        return [];
    }
  }

  /** Returns "terrain", "realm", or "travel" based on current mode */
  #getLayerTypeFromMode() {
    switch (chex.manager.mode) {
      case C.MODE_TERRAIN: return "terrain";
      case C.MODE_REALM: return "realm";
      case C.MODE_TRAVEL: return "travel";
      default: return null;
    }
  }

  async #toggleOrDrawLayer(layerType) {
    const hexGroups = this.#getHexGroups(layerType);

    for (const [key, hexes] of Object.entries(hexGroups)) {
      const color = this.#getColor(layerType, key);
      const fingerprint = this.#computeLayerFingerprint(hexes, color);

      const cached = this._graphicsByType.get(key);

      if (cached?.fingerprint === fingerprint) {
        cached.graphics.visible = true; // Already drawn, just show
      } else {
        if (cached) cached.graphics.destroy(); // Remove outdated graphics
        const g = await this.#drawHexGroup(hexes, color, 0.15, key);
        this._graphicsByType.set(key, { graphics: g, fingerprint });
      }
    }
  }

  /**
   * Draws a group of hexes with specified color/alpha and returns the PIXI.Graphics object.
   * @private
   * @param {Array} hexes - Array of hex objects
   * @param {number} color - Fill color
   * @param {number} alpha - Transparency (0.0 - 1.0)
   * @param {string} key - Unique key for caching
   * @returns {PIXI.Graphics} - The drawn graphics object
   */
  async #drawHexGroup(hexes, color, alpha, key) {
    if (!hexes.length) return;

    const g = new PIXI.Graphics();

    // --- Fill all hexes, no per-hex borders ---
    g.beginFill(color, alpha);

    // Map<normalizedEdgeKey, [x1,y1,x2,y2]>; edges seen twice are internal and removed.
    const outerEdges = new Map();

    const round2 = (n) => Math.round(n * 100) / 100; // tame tiny float diffs
    const edgeKey = (x1, y1, x2, y2) => {
      // normalize order + round to reduce float noise
      const a = [round2(x1), round2(y1)];
      const b = [round2(x2), round2(y2)];
      const [ax, ay] = a, [bx, by] = b;
      return (ax < bx || (ax === bx && ay <= by))
        ? `${ax},${ay}|${bx},${by}`
        : `${bx},${by}|${ax},${ay}`;
    };

    const addEdge = (x1, y1, x2, y2) => {
      const k = edgeKey(x1, y1, x2, y2);
      if (outerEdges.has(k)) outerEdges.delete(k);    // shared edge -> internal
      else outerEdges.set(k, [x1, y1, x2, y2]);       // store original coords for drawing
    };

    for (let i = 0; i < hexes.length; i++) {
      const hex = hexes[i];
      const verts = canvas.grid.getVertices(hex.offset);

      // Draw filled polygon
      g.drawPolygon(verts);

      // Collect edges (support both flat number[] and array of Points/arrays)
      if (Array.isArray(verts) && verts.length) {
        const isFlat = typeof verts[0] === "number";
        if (isFlat) {
          // flat [x0,y0,x1,y1,...]
          for (let j = 0; j < verts.length; j += 2) {
            const x1 = verts[j], y1 = verts[j + 1];
            const j2 = (j + 2) % verts.length;
            const x2 = verts[j2], y2 = verts[j2 + 1];
            addEdge(x1, y1, x2, y2);
          }
        } else {
          // array of Points or [x,y]
          for (let j = 0; j < verts.length; j++) {
            const p1 = verts[j];
            const p2 = verts[(j + 1) % verts.length];
            const x1 = p1.x ?? p1[0], y1 = p1.y ?? p1[1];
            const x2 = p2.x ?? p2[0], y2 = p2.y ?? p2[1];
            addEdge(x1, y1, x2, y2);
          }
        }
      }

      // Yield occasionally on huge maps
      if (i % 500 === 0) await new Promise(r => requestIdleCallback(r));
    }

    g.endFill();

    // --- Draw one outline using the SAME color as the fill ---
    g.lineStyle({ width: 2, color, alpha: 1 });
    let drawn = 0;
    for (const [, [x1, y1, x2, y2]] of outerEdges) {
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      if (++drawn % 4000 === 0) await new Promise(r => requestIdleCallback(r));
    }

    this.addChild(g);
    return g;
  }


  /**
   * Compute a lightweight fingerprint for a hex group + color
   * @private
   * @param {Array} hexes - Array of hex objects
   * @param {number} color - Fill color
   * @returns {string} - Fingerprint string
   */
  #computeLayerFingerprint(hexes, color) {
    const ids = hexes.map(h => h.id).sort().join(",");
    return `${color}:${ids}`;
  }

  /**
   * Returns the color for a layerType and key
   * @private
   * @param {string} layerType - "terrain", "realm", "travel"
   * @param {string} key - Layer key
   */
  #getColor(layerType, key) {
    switch (layerType) {
      case "terrain": return chex.terrains[key.split("-")[1]]?.color || C.FALLBACK_COLOR;
      case "realm": return chex.realms[key.split("-")[1]]?.color || C.FALLBACK_COLOR;
      case "travel": return chex.travels[key.split("-")[1]]?.color || C.FALLBACK_COLOR;
      default: return C.FALLBACK_COLOR;
    }
  }

  /**
   * Returns hex groups based on layerType
   * @private
   * @param {string} layerType - "terrain", "realm", "travel"
   * @returns {Object<string, Array>} - key => hexes array
   */
  #getHexGroups(layerType) {
    const groups = {};
    switch (layerType) {
      case "terrain":
        for (const hex of chex.manager.hexes) {
          const tid = hex.terrain.id;
          if (!groups[`terrain-${tid}`]) groups[`terrain-${tid}`] = [];
          groups[`terrain-${tid}`].push(hex);
        }
        break;
      case "realm":
        for (const hex of chex.manager.hexes.filter(h => h.hexData.claimed)) { //Filtering here prevents unclaimed hexes from getting the fallback color
          const rid = hex.hexData.claimed;
          if (!groups[`realm-${rid}`]) groups[`realm-${rid}`] = [];
          groups[`realm-${rid}`].push(hex);
        }
        break;
      case "travel":
        for (const hex of chex.manager.hexes) {
          const tid = currentTravel(hex.hexData);
          if (!groups[`travel-${tid}`]) groups[`travel-${tid}`] = [];
          groups[`travel-${tid}`].push(hex);
        }
        break;
    }
    return groups;
  }
}
