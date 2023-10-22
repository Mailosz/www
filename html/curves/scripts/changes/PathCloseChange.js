import { UserChange } from "../../../../js/canvas/UserChange.js";

export class PathCloseChange extends UserChange {

    constructor() {
        super();
        this.oldValue = undefined;
    }

    commit(cm) {
        this.oldValue = cm.data.isClosed;

        cm.data.isClosed = !cm.data.isClosed;
        cm.redraw();
    }

    revert(cm) {
        cm.data.isClosed = this.oldValue;
        cm.redraw();
    }
}