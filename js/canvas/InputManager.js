import { CanvasManager } from "./CanvasManager.js";
import { PopupMenu } from "../ui/PopupMenu.js";

export class InputManager {


    constructor() {

        if (this.constructor == InputManager) {
            throw new Error("This is an abstract class and cannot be instantiated.");
        }

        this.interaction = null;
        /** @type {CanvasManager} */
        this.cm = null;
    }

    /**
     * Canvas manager sets itself as context once the InputManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvasManager) {
        this.cm = canvasManager;
    }

    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     */
    click(pointer) {
        throw "click not implemented";
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     */
    doubleClick(pointer) {
        throw "doubleClick not implemented";
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer) {
        throw "alternativeClick not implemented";
    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer) {
        throw "hover not implemented";
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer) {
        
        throw "beginManipulation not implemented";
    }


}

export class PointerData {
    /** Pointer id */
    id;
    /** @type {Number} Current pointer X */
    x;
    /** @type {Number} Current pointer Y */
    y;
    /** @type {Number} Pointer's last position X */
    lastX;
    /** @type {Number} Pointer's last position Y */
    lastY;
    /** @type {Number} Pointer location when pressed X */
    pressX;
    /** @type {Number} Pointer location when pressed Y */
    pressY;
}

export class GestureData extends PointerData {
    /** @type {Number} Gesture start position X */
    startX;
    /** @type {Number} Gesture start position Y */
    startY;
}

/**
 * Represents a single continous action a user takes
 */
export class Manipulation {
    
    /**
     * 
     * @param {CanvasManager} cm 
     * @param {Number} index 
     */
    constructor() {

    }

    /**
     * Canvas manager sets itself as context once the Manipulation is returned from beginManipulation in InputManager
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvasManager) {
        this.cm = canvasManager;
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(data) {
        throw "Manipulation.update not implemented"
    }
    
    complete() {
        throw "Manipulation.complete not implemented"
    }

    cancel() {
        throw "Manipulation.cancel not implemented"
    }
}









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
        this.cm.drawing.click = {x: pointer.x, y: pointer.y};
        this.cm.redraw();
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     */
    doubleClick(pointer) {
        this.cm.drawing.dbClick = {x: pointer.x, y: pointer.y};
        this.cm.redraw();
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
        super(canvas);
        this.canvas = canvas;
        this.canvas.drawing.lines = [{x: pData.pressX, y: pData.pressY}];
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(pData) {
        this.canvas.drawing.lines.push({x: pData.x, y: pData.y})
        this.canvas.redraw();
    }
    
    complete() {

    }

    cancel() {
        this.canvas.drawing.lines = null;
        this.canvas.redraw();
    }
}