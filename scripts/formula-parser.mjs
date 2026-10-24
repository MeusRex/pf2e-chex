import ChexData from "./chex-data.mjs";
import { hexProduction } from "./economy/engine.mjs";
import { getDefs } from "./economy/realm-store.mjs";

export default class ChexFormulaParser {
    /**
     * Sum of the travel modifiers of the improvements of a hex.
     * @param {object[]} improvements
     */
    static travelModifier(improvements) {
        return (improvements ?? []).reduce((sum, i) => sum + (Number(chex.improvements[i.id]?.travel) || 0), 0);
    }

    /**
     *
     * @param {ChexData} data
     * @returns {string}
     */
    static getTravel(data) {
        const travelSum = ChexFormulaParser.travelModifier(data.improvements);
        if (travelSum === 0) {
            return data.travel;
        }

        /**
         * @type {Travel[]}
         */
        const sortedTravels = Object.values(chex.travels)
            .filter(travel => !travel.special)
            .sort((a, b) => a.multiplier - b.multiplier);

        let index = sortedTravels.findIndex((t, i) => t.id === data.travel);
        if (index < 0) return data.travel;
        index = Math.clamp(index + travelSum, 0, sortedTravels.length - 1);
        return sortedTravels[index].id;
    }

    /**
     * Resources produced by the hex per turn, independent of who claimed it.
     * @param {ChexData} data
     * @returns {Record<string, number>}
     */
    static getResources(data) {
        return hexProduction([{data}], data.claimed, getDefs()).total;
    }
}
