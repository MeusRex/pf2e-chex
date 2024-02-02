export default class ChexData {
    static getKey(offset) {
        return (1000 * offset.row) + offset.col;
    }
    terrain = "plains";
    travel = "open";
    exploration = 0;
    cleared = false;
    claimed = "";
    features = [];
    improvements = [];
    resources = [];
    forageables = [];
}
export class ChexFeature {
    type = "";
    name = "";
    show = false;
}
export class ChexImprovement {
    type = "";
    name = "";
    show = false;
}
export class ChexResource {
    type = "";
    name = "";
    amount = 1;
    show = false;
}
