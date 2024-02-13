export default class ChexData {
    static getKey(offset: GridOffset) {
        return (1000 * offset.row) + offset.col;
    }

    terrain: string = "plains";
    travel: string = "open";
    exploration: number = 0; 
    cleared: boolean = false; 
    claimed: string = "";
    features: ChexFeature[] = [];
    improvements: ChexImprovement[] = [];
    resources: ChexResource[] = [];
    forageables: ChexResource[] = [];
}

export class ChexFeature {
    id: string = "";
    name: string = "";
    show: boolean = false;
}

export class ChexImprovement {
    id: string = "";
    name: string = "";
    show: boolean = false;
}

export class ChexResource {
    id: string = "";
    name: string = "";
    amount: number = 1;
    show: boolean = false;
}