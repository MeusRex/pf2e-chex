export const KEY_INCOME = "income:";
export const KEY_TRAVEL = "travel:";
const incomeRegex = new RegExp(`${KEY_INCOME} (\\w+): ([+-]?\\d+)`, 'g');
const travelRegex = new RegExp(`${KEY_TRAVEL} ([+-]?\\d+)`);
export default class ChexFormulaParser {
    static parse(improvements) {
        const incomeSums = {};
        let travelSum = 0;
        improvements.forEach((improvement) => {
            if (improvement.type) {
                const special = chex.improvements[improvement.type].special;
                if (special.startsWith(KEY_INCOME)) {
                    const matches = special.matchAll(incomeRegex);
                    for (const match of matches) {
                        const [, resource, amount] = match;
                        incomeSums[resource] = (incomeSums[resource] || 0) + parseInt(amount);
                    }
                }
                else if (special.startsWith(KEY_TRAVEL)) {
                    const [, travelChange] = special.match(travelRegex);
                    travelSum += parseInt(travelChange);
                }
            }
        });
        return {
            incomeSums: incomeSums,
            travelSum: travelSum
        };
    }
    static getTravel(data) {
        const result = ChexFormulaParser.parse(data.improvements);
        if (result.travelSum === 0) {
            return data.travel;
        }
        const sortedTravels = Object.values(chex.travels)
            .filter(travel => !travel.special)
            .sort((a, b) => (a.multiplier ?? 0) - (b.multiplier ?? 0));
        let index = sortedTravels.findIndex((t) => t.id === data.travel);
        if (index >= 0) {
            index += result.travelSum;
            if (index < 0)
                index = 0;
            else if (index >= sortedTravels.length)
                index = sortedTravels.length - 1;
        }
        return sortedTravels[index].id ?? "";
    }
    static getResources(data) {
        return ChexFormulaParser.parse(data.improvements).incomeSums;
    }
}
