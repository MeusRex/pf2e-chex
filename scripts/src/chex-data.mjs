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
    id = "";
    name = "";
    show = false;
}
export class ChexImprovement {
    id = "";
    name = "";
    show = false;
}
export class ChexResource {
    id = "";
    name = "";
    amount = 1;
    show = false;
}
