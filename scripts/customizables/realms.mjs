export class Realm {
    constructor(id, label, color, owners = []) {
        this.id = id;
        this.label = label;
        this.color = color;
        this.owners = owners;
    }

    id;
    label;
    color;
    /**
     * Ids of users that manage this realm's economy (build, trade, drains).
     * @type {string[]}
     */
    owners;

    static getDefaults() {
        return {
            helas: new Realm("helas", "Council of Helas", "#ff0000"),
        };
    }
}
