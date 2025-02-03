
import { InputManager, Manipulation, ScrollManipulation } from "../InputManager.js";


/**
 * For tests
 */
export class TestInputManager extends InputManager {


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
    click(pointer) {
        if (pointer.consecutiveClickCount == 0) {
            this.cm.drawing.click = {x: pointer.x, y: pointer.y};
            this.cm.redraw();
        } else {
            console.log(pointer.consecutiveClickCount)
            this.cm.drawing.dbClick = {x: pointer.x, y: pointer.y};
            this.cm.redraw();
        }

    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer) {
        this.cm.drawing.altClick = {x: pointer.x, y: pointer.y};
        this.cm.redraw();
    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer) {
        this.cm.drawing.mouse = {x: pointer.x, y: pointer.y};
        this.cm.redraw();
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer) {
        if (pointer.button == 1) {
            return new ScrollManipulation(this.cm, pointer);
        }
        return new TestManipulation(this.cm, pointer);

    }


}

/**
 * For tests
 */
export class TestManipulation extends Manipulation {
    
    /**
     * @param {PointerData} pData
     * @param {CanvasManager} canvas 
     * @param {Number} index 
     */
    constructor(canvas, pData) {
        super();
        canvas.drawing.lines = [{x: pData.pressX, y: pData.pressY}];
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(pData) {
        this.cm.drawing.lines.push({x: pData.x, y: pData.y})
        this.cm.redraw();
    }
    
    complete() {

    }

    cancel() {
        this.canvas.drawing.lines = null;
        this.canvas.redraw();
    }
}