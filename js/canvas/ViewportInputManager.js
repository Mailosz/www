
import { InputManager, Manipulation } from "./InputManager.js";


/**
 * For tests
 */
export class ViewportInputManager extends InputManager {

    constructor() {
        super();
        this.interaction = null;
        /** @type {CanvasManager} */
        this.cm = null;
    }


    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     */
    click(pointer, state) {
        
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer, state) {
        
    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer, state) {
        
    }

    /**
     * Mouse wheel action
     * @param {number} factor 
     * @param {{x: number, y: number}} position normalized position on screen (0,1)
     */;
    wheel(factor, { x, y }, state) {
        state.zoomBy(factor, { x: x, y: y });
        state.redraw();
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer, state) {
        if (pointer.button == 1) {
            return new ScrollManipulation();
        }
        

    }


}


export class ScrollManipulation extends Manipulation {

    scrollX = 0;
    scrollY = 0;
    /**
     * Occurs everytime a user moves pointer over the canvas
     * @param {GestureData} data 
     */
    update(data, state) {
        this.scrollX = data.lastX - data.x;
        this.scrollY = data.lastY - data.y;
        state.scrollBy(this.scrollX, this.scrollY);

        state.redraw();
    }

    /**
 * Occurs whenever the manipulation is finished (e.g. pointer is lifted).
 * @returns Return a UserChange that will be executed by CanvasManager
 */
    complete() {
        // Nothing
    }

    /**
     * Manipulation canceled - restore everything to initial values
     */
    cancel() {
        // Nothing
    }
}