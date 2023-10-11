import { UserChange } from "../../../../js/canvas/UserChange.js";

export class ClosednesChange extends UserChange {

    constructor(oldValue, newValue) {
        super();
        this.newValue = newValue;
        this.oldValue = oldValue
    }

    commit(cm) {
        cm.isClosed = this.newValue;
        cm.redraw();
    }

    revert(cm) {
        this.isClosed = this.oldValue;
        cm.redraw();
    }
}