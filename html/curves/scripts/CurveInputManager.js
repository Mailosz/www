import { InputManager, Manipulation } from "../../../js/canvas/InputManager.js";
import { PointerData, GestureData } from "../../../js/canvas/InputManager.js";
import { CurvesData } from "./CurvesData.js";

export class CurveInputManager extends InputManager {

    /**
     * 
     * @param {CurvesData} data 
     */
    constructor(data) {
        super();
        this.data = data;
    }



    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     */
    click(pointer) {
        
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     */
    doubleClick(pointer) {
        let {found, distance} = this.data.findNearestNode(pointer.x, pointer.y);

        if (distance < 10) {
            this.data.segments.splice(this.data.segments.indexOf(found), 1);
        } else {
            this.data.segments.push({position: {x: pointer.x, y: pointer.y}})
        }
        this.cm.redraw();
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer) {
        
    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer) {
        
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer) {
        let {found, distance} = this.data.findNearestPoint(pointer.pressX, pointer.pressY);

        console.log({found, distance} );

        if (found != null && distance < 10) {
            return new PointMoveManipulation(found);
        }
        return null;
    }

    

}

class PointMoveManipulation extends Manipulation {

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
        this.cm.redraw();
    }

    cancel() {
        this.point.x = this.startX;
        this.point.y = this.startY;

        this.cm.redraw();
    }
}