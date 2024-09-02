// Implements foundry.GridOffset
// https://foundryvtt.com/api/interfaces/foundry.GridOffset.html
// Created as a mapping from the Typescript interface to a concrete class
export default class ChexOffset {
    i;
    j;
    constructor(i, j) {
        this.i = i;
        this.j = j;
    }
}