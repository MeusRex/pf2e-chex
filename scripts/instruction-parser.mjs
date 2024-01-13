import ChexData, { ChexImprovement } from "./hex-data.mjs";

export const KEY_INCOME = "income:";
export const KEY_TRAVEL = "travel:"

const incomeRegex = new RegExp(`${KEY_INCOME} (\\w+): ([+-]?\\d+)`, 'g');
const travelRegex = new RegExp(`${KEY_TRAVEL} ([+-]?\\d+)`);

export default class ChexInstructionParser {
    /**
     * 
     * @param {ChexImprovement[]} improvements 
     */
    static parse(improvements) {
        const incomeSums = {};
        let travelSum = 0;

        improvements.forEach((improvement) => {
            const special = chex.improvements[improvement.id].special;

            if (special.startsWith(KEY_INCOME)) {
                const matches = special.matchAll(incomeRegex);
                for (const match of matches) {
                    const [, resource, amount] = match;
                    incomeSums[resource] = (incomeSums[resource] || 0) + parseInt(amount);
                }
            } else if (special.startsWith(KEY_TRAVEL)) {
                const [, travelChange] = special.match(travelRegex);
                travelSum += parseInt(travelChange);
            }
        });

        return {
            incomeSums: incomeSums,
            travelSum: travelSum
        }
    }

    /**
     * 
     * @param {ChexData} data 
     * @returns {string}
     */
    static getTravel(data) {
        const result = ChexInstructionParser.parse(data.improvements);
        if (result.travelSum === 0) {
            return data.travel;
        }
        
        /**
         * @type {Travel[]}
         */
        const sortedTravels = Object.values(chex.travels)
            .filter(travel => !travel.special)
            .sort((a, b) => a.multiplier - b.multiplier);

        let index = sortedTravels.findIndex((t, i) => t.id === data.travel);
        if (index >= 0) {
            index += result.travelSum;
            if (index < 0)
                index = 0;
            else if (index >= sortedTravels.length)
                index = sortedTravels.length - 1;
        }
        return sortedTravels[index].id;
    }

    /**
     * 
     * @param {ChexData} data 
     */
    static getResources(data) {
        return ChexInstructionParser.parse(data.improvements).incomeSums;
    }
}