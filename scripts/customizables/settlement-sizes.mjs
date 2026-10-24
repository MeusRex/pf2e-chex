export class SettlementSize {
    constructor(id, label, {rank = 1, lots = 1, needs = {}} = {}) {
        this.id = id;
        this.label = label;
        this.rank = rank;
        this.lots = lots;
        this.needs = needs;
    }

    id;
    label;
    /**
     * Ordering of sizes. Higher is bigger. Used for minimum size requirements of buildings.
     * @type {number}
     */
    rank;
    /**
     * Building lots available.
     * @type {number}
     */
    lots;
    /**
     * Resources consumed per turn. Keys are resource ids or `group:<group>`.
     * @type {Record<string, number>}
     */
    needs;

    static getDefaults() {
        return {
            village: new SettlementSize("village", "Village", {rank: 1, lots: 2, needs: {"group:food": 1}}),
            town: new SettlementSize("town", "Town", {rank: 2, lots: 4, needs: {"group:food": 2, cloth: 1}}),
            city: new SettlementSize("city", "City", {rank: 3, lots: 9, needs: {"group:food": 4, cloth: 1, tools: 1, "group:luxury": 1}}),
            metropolis: new SettlementSize("metropolis", "Metropolis", {rank: 4, lots: 16, needs: {"group:food": 6, cloth: 2, tools: 2, "group:luxury": 2, medicine: 1}})
        };
    }
}
