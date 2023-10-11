import { InputManager, Manipulation } from "../../../js/canvas/InputManager.js";
import { PointerData, GestureData } from "../../../js/canvas/InputManager.js";
import { GenericUserAction } from "../../../js/canvas/UserAction.js";
import { CurvesData } from "./CurvesData.js";
import { ClosednesChange } from "./changes/ClosednesChange.js";
import { PointMoveManipulation } from "./manipulations/PointMoveManipulation.js";

export class CurveInputManager extends InputManager {

    /**
     * 
     * @param {CurvesData} data 
     */
    constructor(data) {
        super();
        this.data = data;

        this.actions.push(new GenericUserAction("Space", "Change closedness", "", (cm) => new ClosednesChange(this.isClosed, !this.isClosed)))
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

