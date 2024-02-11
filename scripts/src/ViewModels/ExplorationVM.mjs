export default class ExplorationVM {
    explored = window.ko.observable(false);
    cleared = window.ko.observable(false);
    label = window.ko.observable("");
    update(explored, cleared, label) {
        this.explored(explored);
        this.cleared(cleared);
        this.label(label);
    }
}
