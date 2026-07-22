import * as C from "./const.mjs";
import ChexFormulaParser from "./formula-parser.mjs";

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
  }

  /**
   * Draw or toggle the layer for the current mode.
   * Keeps previously drawn layers in the cache and avoids unnecessary redraws.
   */
  async draw() {
    this.mask = canvas.primary.mask;

    const layerType = this.#getLayerTypeFromMode();
    if (!layerType) return;

    // Hide all other layers first
    for (const [key, entry] of this._graphicsByType.entries()) {
      if (entry) entry.graphics.visible = false;
    }

    // Draw or toggle the requested layer
    await this.#toggleOrDrawLayer(layerType);
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
          const tid = ChexFormulaParser.getTravel(hex.hexData);
          if (!groups[`travel-${tid}`]) groups[`travel-${tid}`] = [];
          groups[`travel-${tid}`].push(hex);
        }
        break;
    }
    return groups;
  }
}
