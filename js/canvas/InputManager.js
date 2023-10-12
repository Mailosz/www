import { CanvasManager, KeyboardData } from "./CanvasManager.js";
import { PopupMenu } from "../ui/PopupMenu.js";
import { UserAction } from "./UserAction.js";

export class InputManager {

    /**
     * @type {UserAction[]} Actions in this InputManager context that can be invoked by keyboard
     */
    keyboardActions = [];

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

    /**
     * Handle keyboard input.
     * @param {KeyboardData} keyData 
     * @returns Return UserChange for CanvasManager to execute, or true to inform CM that input has been handled. Return null or false to make it try another input handler.
     */
    handleKey(keyData) {

        for (let action of this.keyboardActions) {
            if (keyData.keyWatcher.checkKeyboardShortcut(action.keyboardShortcut)) {
                this.cm.performUserAction(action);
                return true;
            }
        }

        return false;
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
     * @type {UserAction[]} Actions in this Manipulation context that can be invoked by keyboard
     */
    keyboardActions = [];
    
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
     * Occurs everytime a user moves pointer over the canvas
     * @param {GestureData} data 
     */
    update(data) {
        throw "Manipulation.update not implemented"
    }
    
    /**
     * Occurs whenever the manipulation is finished (e.g. pointer is lifted).
     * @returns Return a UserChange that will be executed by CanvasManager
     */
    complete() {
        throw "Manipulation.complete not implemented"
    }

    /**
     * Manipulation canceled - restore everything to initial values
     */
    cancel() {
        throw "Manipulation.cancel not implemented"
    }

    /**
     * Handle keyboard input.
     * @param {KeyboardData} keyData 
     * @returns Return UserChange for CanvasManager to execute, or true to inform CM that input has been handled. Return null or false to make it try another input handler.
     */
    handleKey(keyData) {

        for (let action of this.keyboardActions) {
            if (keyData.keyWatcher.checkKeyboardShortcut(action.keyboardShortcut)) {
                this.cm.performUserAction(action);
                return true;
            }
        }

        return false;
    }
}

