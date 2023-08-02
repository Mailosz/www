import { CanvasManager } from "./CanvasManager.js";
import { PopupMenu } from "../ui/PopupMenu.js";

export class InputManager {


    constructor() {

        if (this.constructor == InputManager) {
            throw new Error("This is an abstract class and cannot be instantiated.");
        }

        this.interaction = null;
        /** @type {CanvasManager} */
        this.canvas = null;
    }

    /**
     * Canvas manager sets itself as context once the InputManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvasManager) {
        this.canvas = canvasManager;
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
    constructor(cm, index) {
        this.cm = cm;
        //this.startX = canvas.drawing.nodes[index].x;
        //this.startY = canvas.drawing.nodes[index].y;

        this.cm.drawing.lines = [{}]
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(data) {
        if (this.index !== null) {
            let selNode = this.cm.drawing.nodes[this.cm.drawing.selectedIndex]; 
            selNode.x = this.startX + data.lastX - data.pressX;
            selNode.y = this.startY + data.lastY - data.pressY;
        }
        this.cm.redraw();
    }
    
    complete() {
        this.cm.drawing.selectedIndex = null;
    }

    cancel() {
        if (this.index !== null) {
            let selNode = this.nodes[this.cm.drawing.selectedIndex]; 
            selNode.x = this.startX;
            selNode.y = this.startY;
        }
        this.cm.redraw();
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
        this.canvas = null;
    }


    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     */
    click(pointer) {
        this.canvas.drawing.click = {x: pointer.x, y: pointer.y};
        this.canvas.redraw();
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     */
    doubleClick(pointer) {
        this.canvas.drawing.dbClick = {x: pointer.x, y: pointer.y};
        this.canvas.redraw();
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer) {
        this.canvas.drawing.altClick = {x: pointer.x, y: pointer.y};
        this.canvas.redraw();
    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer) {
        this.canvas.drawing.mouse = {x: pointer.x, y: pointer.y};
        this.canvas.redraw();
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer) {

        return new TestManipulation(this.canvas, pointer);

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

        //this.startX = canvas.drawing.nodes[index].x;
        //this.startY = canvas.drawing.nodes[index].y;

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