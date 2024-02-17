export default class KoApplication extends Application {
    override activateListeners(html: any) {
        super.activateListeners(html);
        window.ko.applyBindings(this, this._element[0]);
        this.register && this.register();
    }

    override close(options: any | undefined) {
        window.ko.cleanNode(this._element[0]);
        super.close(options);
        this.unregister && this.unregister();
    }

    localize(key: string): string {
        if (this.mlKey)
            key = this.mlKey + key;
        return game.i18n.localize(key);
    }

    refreshPosition() {
        this.setPosition({height: "auto"});
    }

    knockify(origin: any[], target: ko.ObservableArray) {
      if (!origin)
        origin = [];

        origin.forEach(o => {
          target.push(window.ko.mapping.fromJS(o));
        });
      }
    
    deknockify(origin: any[]): any[] {
      if (!origin)
        origin = [];

        const arr: any[] = [];
        origin.forEach(o => {
          arr.push(window.ko.mapping.toJS(o));
        });

        return arr;
    }

    deknockifyAndZip(origin: any[]): object {
        return this.zip(this.deknockify(origin));
    }

    zip(array: any[]): { [key: string]: any} {
        return array.reduce((acc: { [x: string]: any; }, item: { id: string | number; }) => {
          acc[item.id] = { ...item }; // Use spread operator to create a new object
          return acc;
        }, {});
      }

    register: Function | null = null;
    unregister: Function | null = null; 
    mlKey: string | null = null;
}