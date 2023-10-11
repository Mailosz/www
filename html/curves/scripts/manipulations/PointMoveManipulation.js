import { Manipulation } from "../../../../js/canvas/InputManager.js";
import { PointChange } from "../changes/PointChange.js";

export class PointMoveManipulation extends Manipulation {

    constructor(point) {
        super();
        this.point = point;
        this.startX = point.x;
        this.startY = point.y;
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(data) {
        
        this.point.x = data.x;
        this.point.y = data.y;

        this.cm.redraw();
    }
    
    complete() {
        return new PointChange(this.point, this.startX, this.startY, this.point.x, this.point.y);
    }

    cancel() {
        this.point.x = this.startX;
        this.point.y = this.startY;

        this.cm.redraw();
    }
}