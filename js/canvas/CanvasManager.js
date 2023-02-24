import { InputManager, PointerData } from "./InputManager.js";
import { Settings } from "./Settings.js";

export class CanvasManager {
    #canvasResizeObserver
    /** 
     * @param {HTMLCanvasElement} canvasElement
     * @param {DrawingManager} drawing
     */
    constructor(canvasElement, drawing) {
        this.canvas = canvasElement;
        /** @type {CanvasRenderingContext2D} */
        this.ctx = canvasElement.getContext("2d");

        /** @type {DrawingManager} */
        this.drawing = drawing;
        this.drawing.setCanvasManager(this);

        /** @type {InputManager} */
        this.inputManager = null;
        this.currentManipulation = null;

        this.pointers = {};

        this.redraw();

        this.canvas.selectedIndex = null;

        //pointer events
        this.canvas.addEventListener("pointerdown", this.#pointerdown.bind(this));
        this.canvas.addEventListener("pointermove", this.#pointermove.bind(this));
        this.canvas.addEventListener("pointerup", this.#pointerup.bind(this));
        this.canvas.addEventListener("pointercancel", this.#pointercancel.bind(this));
        this.canvas.addEventListener("wheel", this.#pointerwheel.bind(this));

        // disable default contextmenu
        this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

        //size changes
        this.#canvasResizeObserver = new ResizeObserver((entries) => {
            if (entries.length > 0) {
                const entry = entries[entries.length - 1];

                let ratio = window.devicePixelRatio;

                const w = entry.contentRect.width;
                const h = entry.contentRect.height;

                this.ctx.canvas.width = w;
                this.ctx.canvas.height = h;

                drawing.resize(w, h, ratio);
            }
        });
        this.#canvasResizeObserver.observe(this.canvas);

        
    }

    /**
     * 
     * @param {InputManager} inputManager 
     */
    setInputManager(inputManager) {
        if (this.inputManager != null) {
            this.inputManager.pointerCancelled();
        }

        this.inputManager = inputManager;
        this.inputManager.setCanvasManager(this);
    }

    /**
     * Informs DrawingManager to redraw the canvas
     */
    redraw() {
        if (this.drawing != null) {
            let ds = this.ctx;
            this.drawing.draw(ds);
        }
    }

    /**
     * 
     * @param {WheelEent} event 
     */
    #pointerwheel(event) {
        event.preventDefault();
        let by = Math.sign(event.deltaY);
        if (Settings.invertMouseWheel) {by *= -1;}
        let factor = (10 + by) / 10;
        this.drawing.zoomBy(factor, {x: event.offsetX, y: event.offsetY});
    }

    /**
     * 
     * @param {PointerEvent} event 
     */
    #pointerdown(event) {
        /** @type {PointerInstance} */
        let pointer = this.pointers[event.pointerId];

        if (pointer == null) {
            pointer  = new PointerInstance();
            this.pointers[event.pointerId] = pointer;
        }

        pointer.x = event.offsetX;
        pointer.y = event.offsetY;
        pointer.pressX = event.offsetX;
        pointer.pressY = event.offsetY;
        pointer.pressed = true;
        pointer.pressTime = Date.now();
        pointer.moving = false;


        this.canvas.setPointerCapture(event.pointerId);
    }

    #makePointerData(pointer, id) {
        return {
            id: id,
            x: pointer.x,
            y: pointer.y,
            startX: pointer.startX,
            startY: pointer.startY,
            pressX: pointer.pressX,
            pressY: pointer.pressY,
            lastX: pointer.lastX,
            lastY: pointer.lastY,
        };
    }

    /**
     * 
     * @param {PointerEvent} event 
     */
    #pointermove(event) {
        /** @type {PointerInstance} */
        let pointer = this.pointers[event.pointerId];

        if (pointer == null) {
            pointer  = new PointerInstance();
            this.pointers[event.pointerId] = pointer;
        }

        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.x = event.offsetX;
        pointer.y = event.offsetY;
        pointer.lastTime = Date.now();

        if (pointer.pressed) {
            //sanity check
            if (event.pressure <= Number.EPSILON) {
                this.pointers[event.pointerId].pressed = false;
            }

            if (pointer.moving) {
                //pointer is pressed
                if (this.currentManipulation != null) {
                    let data = this.#makePointerData(pointer, event.pointerId);
                    data.startX = pointer.startX;
                    data.startY = pointer.startY;
                    this.currentManipulation.update(data);
                } 
            } else {

                let dis = Math.sqrt((pointer.pressX - pointer.x) ** 2 + (pointer.pressY - pointer.y) ** 2);

                let movedis = 10; //default distance after which move occurs

                // manipulation starts
                if (dis > movedis) {
                    pointer.moving = true;
                    pointer.startX = pointer.x;
                    pointer.startY = pointer.y;

                    let data = this.#makePointerData(pointer, event.pointerId);
                    let manipulation = this.inputManager.beginManipulation(data);
                    if (manipulation != null) {
                        this.currentManipulation = manipulation;
                    }
                }
            }


        } else { // pointer is hovering
            if (this.inputManager != null) {
                
                let data = this.#makePointerData(pointer, event.pointerId);

                this.inputManager.hover(data);
            }
        }
    }

    /**
     * 
     * @param {PointerEvent} event 
     */
    #pointerup(event) {
        /** @type {PointerInstance} */
        let pointer = this.pointers[event.pointerId];

        if (pointer == null) {
            pointer  = new PointerInstance();
            this.pointers[event.pointerId] = pointer;
        }

        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.x = event.offsetX;
        pointer.y = event.offsetY;

        pointer.releaseTime = Date.now();

        let primaryButton = (pointer, data) => {
            /** time between two clicks to be considered double click */
            let dbClickTime = 500;

            if (pointer.lastClickTime != null && (pointer.releaseTime - pointer.lastClickTime) < dbClickTime) { // double click
                let dis = Math.sqrt((pointer.pressX - pointer.lastClickX) ** 2 + (pointer.pressY - pointer.lastClickY) ** 2);

                if (dis > 10) { // too far - this is a normal click
                    this.inputManager.click(data);
                } else { // two consecutive clicks near each other - doubleclick
                    this.inputManager.doubleClick(data);
                }
            } else { //single click
                this.inputManager.click(data);
            }
            pointer.lastClickTime = Date.now();
            pointer.lastClickX = pointer.x;
            pointer.lastClickY = pointer.y;
        }

        if (pointer.pressed) {
            if (pointer.moving) { // end of manipulation
                if (this.currentManipulation != null) {
                    this.currentManipulation.complete();
                    this.currentManipulation = null;
                }
            } else { // click
                if (this.inputManager != null) { // if there is no input manager, there is no need to process thiss
                    let data = this.#makePointerData(pointer, event.pointerId);
                    
                    if (event.pointerType == "mouse") {
                        if (event.button == 0) { //primary button
                            primaryButton(pointer, data);
                        } else {
                            this.inputManager.alternativeClick(data);
                        }
                    } else {
                        /** Time of touch after which it is considered secondary touch */
                        let touchTime = 500;
                        if ((pointer.releaseTime - pointer.pressTime) < touchTime) {
                            primaryButton(pointer, data);
                        } else {
                            this.inputManager.alternativeClick(data);
                        }
                    }
                }
            }
        }

        pointer.pressed = false;
        

        this.canvas.releasePointerCapture(event.pointerId);
    }

    #pointercancel(event) {
        /** @type {PointerInstance} */
        let pointer = this.pointers[event.pointerId];

        if (pointer == null) {
            pointer  = new PointerInstance();
            this.pointers[event.pointerId] = pointer;
        }

        this.canvas.releasePointerCapture(event.pointerId);

        pointer.pressed = false;
        pointer.releaseTime = Date.now();

        if (this.currentManipulation != null) {
            this.currentManipulation.cancel();
            this.currentManipulation = null;
        }
    }

}

class PointerInstance {

    constructor () {
        this.pressed = false;
        this.x = Number.NaN;
        this.y = Number.NaN;
        this.pressX = Number.NaN;
        this.pressY = Number.NaN;
        /** @type {Date} */
        this.pressTime = null;
        this.moving = false;
        this.startX = Number.NaN;
        this.startY = Number.NaN;
        this.lastX = Number.NaN;
        this.lastY = Number.NaN;
        /** @type {Date} */
        this.lastTime = null;
        /** @type {Date} */
        this.releaseTime = null;
    }
}

