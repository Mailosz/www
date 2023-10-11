import { UserChange } from "../../../../js/canvas/UserChange.js";

export class PointChange extends UserChange {

    constructor(point, startX, startY, px, py) {
        super();
        this.point = point;
        this.startX = startX;
        this.startY = startY;
        this.px = px;
        this.py = py;
    }

    commit(cm) {
        this.point.x = this.px;
        this.point.y = this.py;

        cm.redraw();
    }

    revert(cm) {
        this.point.x = this.startX;
        this.point.y = this.startY;

        cm.redraw();
    }
}