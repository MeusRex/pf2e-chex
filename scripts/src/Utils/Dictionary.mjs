export default class Dictionary {
    fallback;
    items;
    constructor(fallback) {
        this.fallback = fallback;
        this.items = {};
    }
    get(key) {
        return this.items[key] !== undefined ? this.items[key] : this.fallback;
    }
    set(key, val) {
        this.items[key] = val;
    }
    all() {
        return Object.values(this.items);
    }
}
