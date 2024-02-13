export default class KoApplication extends Application {
    activateListeners(html) {
        super.activateListeners(html);
        window.ko.applyBindings(this, this._element[0]);
        this.register && this.register();
    }
    close(options) {
        window.ko.cleanNode(this._element[0]);
        super.close(options);
        this.unregister && this.unregister();
    }
    localize(key) {
        if (this.mlKey)
            key = this.mlKey + key;
        return game.i18n.localize(key);
    }
    refreshPosition() {
        this.setPosition({ height: "auto" });
    }
    knockify(origin, target) {
        origin.forEach(o => {
            target.push(window.ko.mapping.toJS(o));
        });
    }
    deknockify(origin) {
        const arr = [];
        origin.forEach(o => {
            arr.push(window.ko.mapping.fromJS(o));
        });
        return arr;
    }
    deknockifyAndZip(origin) {
        return this.zip(this.deknockify(origin));
    }
    zip(array) {
        return array.reduce((acc, item) => {
            acc[item.id] = { ...item }; // Use spread operator to create a new object
            return acc;
        }, {});
    }
    register = null;
    unregister = null;
    mlKey = null;
}
