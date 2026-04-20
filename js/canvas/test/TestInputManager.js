
import { InputManager, Manipulation } from "../InputManager.js";
import { ViewportInputManager, ScrollManipulation } from "../ViewportInputManager.js";


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
    click(pointer, state) {
        if (pointer.consecutiveClickCount == 0) {
            state.click = {x: pointer.x, y: pointer.y};
            state.redraw();
        } else {
            console.log(pointer.consecutiveClickCount)
            state.dbClick = {x: pointer.x, y: pointer.y};
            state.redraw();
        }
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer, state) {
        state.altClick = {x: pointer.x, y: pointer.y};
        state.redraw();
    }

    /**
     * Occurs when the user keeps pointer (different than mouse) pressed without moving for a certain time
     * @param {PointerData} pointer 
     */
    longPress(pointer, state) {
        state.longPress = { x: pointer.x, y: pointer.y };
        state.redraw();
        return { manipulation: new ScrollManipulation() };
    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer, state) {
        state.mouse = {x: pointer.x, y: pointer.y};
        state.redraw();
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
        return new TestManipulation(state, pointer);

    }


}

/**
 * For tests
 */
export class TestManipulation extends Manipulation {
    
    /**
     * @param {PointerData} pData
     * @param {CanvasManager} canvas 
     * @param {object} state
     */
    constructor(state, pData) {
        super();
        this.state = state;
        this.state.lines = [{x: pData.pressX, y: pData.pressY}];
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(pData) {
        this.state.lines.push({x: pData.x, y: pData.y})
        this.state.redraw();
    }
    
    complete() {

    }

    cancel() {
        this.state.lines = null;
        this.state.redraw();
    }
}