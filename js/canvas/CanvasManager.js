import { KeyWatcher } from "../utils/KeyWatcher.js";
import { InputManager, PointerData } from "./InputManager.js";
import { CanvasSettings } from "./CanvasSettings.js";
import { GenericUserAction } from "./UserAction.js";
import { UserChange } from "./UserChange.js";

export class CanvasManager {
    #canvasResizeObserver
    /** 
     * @param {HTMLCanvasElement} canvasElement
     * @param {CanvasSettings} settings
     */
    constructor(canvasElement, settings) {
        if (canvasElement == null) {
            throw "No canvasElement";
        }
        this.canvasElement = canvasElement;
        this.canvasElement.tabIndex = "0"; // without tab index canvasElement wouldn't produce keyboard events

        /**
         * @type {CanvasSettings}
         */
        this.settings = {...(new CanvasSettings()), ...settings};

        // /** @type {DrawingManager} */
        // this.drawing = drawing;
        // this.drawing.setCanvasManager(this);
        this.drawing = null;

        this.width = 100;
        this.height = 100;
        this.viewport = {x: 0, y: 0, w: 100, h: 100};
        this.zoom = 1;

        /** @type {InputManager} */
        this.inputManager = null;
        this.currentManipulation = null;

        this.userChanges = [];
        this.commitedChangesCount = 0;

        this.pointers = {};

        // watches which keyboard keys are pressed at the moment
        this.keyWatcher = new KeyWatcher();
        //keyboard events
        this.canvasElement.addEventListener("keydown", this.#keydown.bind(this));
        // this.canvasElement.addEventListener("keyup", this.#keyup.bind(this));

        //pointer events
        this.canvasElement.addEventListener("pointerdown", this.#pointerdown.bind(this));
        this.canvasElement.addEventListener("pointermove", this.#pointermove.bind(this));
        this.canvasElement.addEventListener("pointerup", this.#pointerup.bind(this));
        this.canvasElement.addEventListener("pointercancel", this.#pointercancel.bind(this));
        this.canvasElement.addEventListener("wheel", this.#pointerwheel.bind(this));


        // disable default contextmenu
        this.canvasElement.addEventListener("contextmenu", (event) => event.preventDefault());
        //disable mouse events, because they are handled internally
        this.canvasElement.addEventListener("dblclick", (event) => { event.preventDefault(); event.stopPropagation();}, true);
        this.canvasElement.addEventListener("mousedown", (event) => { event.preventDefault(); event.stopPropagation();}, true);

        //size changes
        this.#canvasResizeObserver = new ResizeObserver((entries) => {
            if (entries.length > 0) {
                const entry = entries[entries.length - 1];

                let w, h;
                if (entry.devicePixelContentBoxSize) {
                    w = entry.devicePixelContentBoxSize[0].inlineSize;
                    h = entry.devicePixelContentBoxSize[0].blockSize;
                } else {
                    if (entry.contentBoxSize) {
                        if (entry.contentBoxSize[0]) {
                            w = entry.contentBoxSize[0].inlineSize;
                            h = entry.contentBoxSize[0].blockSize;
                        } else {
                            w = entry.contentBoxSize.inlineSize;
                            h = entry.contentBoxSize.blockSize;
                        }
                    } else {
                        w = entry.contentRect.width;
                        h = entry.contentRect.height;
                    }
                    w *= window.devicePixelRatio;
                    h *= window.devicePixelRatio;
                }

                // console.log(`width: ${w}, height: ${h}, ratio: ${window.devicePixelRatio}`);

                this.width = w;
                this.height = h;
                this.updateViewport(this.viewport.x, this.viewport.y, this.zoom);

                if (this.drawing != null) {
                    this.drawing.resize(w, h);
                }
            }
        });

        try {
            this.#canvasResizeObserver.observe(this.canvasElement, {box: 'device-pixel-content-box'});
        } catch (ex) {
            console.log("device-pixel-content-box not supported, fallback to content-box");
            this.#canvasResizeObserver.observe(this.canvasElement, {box: 'content-box'});
        }
        

    }

    /**
     * Sets the DrawingManager used to handle user input
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
     * Sets the DrawingManager used to draw contents
     * @param {DrawingManager} drawingManager 
     */
    setDrawingManager(drawingManager) {
        if (this.drawing != null) {
            this.drawing.close();
        }

        this.drawing = drawingManager;
        this.drawing.setCanvasManager(this);
        this.drawing.prepare();
    }

    /**
     * 
     * @param {*} factor 
     * @param {x:Number, y:Number} origin 
     */
    zoomBy(factor, origin) {
        this.zoom = Math.max(0.0001,Math.min(this.zoom * factor, 10000));
        console.log("zoom: " + this.zoom * 100 + "%");

        this.updateViewport(this.viewport.x, this.viewport.y, this.zoom);
    }

    updateViewport(x, y, zoom) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.w = this.width / zoom;
        this.viewport.h = this.height / zoom;

        this.drawing?.updateViewport(this.viewport);
    }


    scrollBy(x, y) {
        this.updateViewport(this.viewport.x + x, this.viewport.y + y, this.zoom);
    }

    /**
     * Informs DrawingManager to redraw the canvas
     */
    redraw(viewport) {
        if (this.drawing != null) {
            this.drawing.redraw(viewport);
        }
    }

    /**
     * Performs the change and adds it to the list of commited changes to allow to undo it
     * @param {UserChange} change 
     */
    commitChange(change) {
        try {
            change.commit(this);
            if (this.commitedChangesCount < this.userChanges.length) {
                this.userChanges.splice(this.commitedChangesCount, this.userChanges.length - this.commitedChangesCount);
            }
            this.userChanges.push(change);
            this.commitedChangesCount = this.userChanges.length;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Reverts last user change
     * @param {UserChange|undefined} change 
     */
    revertChange() {
        try {
            if (this.commitedChangesCount > 0) {
                this.commitedChangesCount -= 1;
                const change = this.userChanges[this.commitedChangesCount];

                if (change != null) {
                    change.revert(this);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Reverts last user change
     * @param {UserChange|undefined} change 
     */
    redoChange() {
        try {
            if (this.commitedChangesCount < this.userChanges.length) {
                const change = this.userChanges[this.commitedChangesCount];
                this.commitedChangesCount += 1;

                if (change != null) {
                    change.commit(this);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * 
     * @param {WheelEent} event 
     */
    #pointerwheel(event) {
        event.preventDefault();
        let by = Math.sign(event.deltaY);
        if (this.settings.invertMouseWheel) {by *= -1;}
        let factor = (10 + by) / 10;

        const [x, y] = this.#getPointerPosition(event.offsetX, event.offsetY);
        this.zoomBy(factor, {x: x, y: y});
        this.redraw();
    }

    #getPointerPosition(pointerX, pointerY) {
    const dpr = window.devicePixelRatio;
    
    const x = this.viewport.x + ((pointerX * dpr) * (this.viewport.w / this.width));
    const y = this.viewport.y + ((pointerY * dpr) * (this.viewport.h / this.height));

        return [
            x,
            y
        ];
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

        //this is to allow capturing for keyboard input
        this.canvasElement.focus({focusVisible: false, preventScroll: true});

        const [x,y] = this.#getPointerPosition(event.offsetX, event.offsetY);

        pointer.realX = event.offsetX;
        pointer.realY = event.offsetY;
        pointer.x = x;
        pointer.y = y;
        pointer.pressX = x;
        pointer.pressY = y;
        pointer.pressed = true;
        pointer.pressTime = Date.now();
        pointer.moving = false;
        pointer.button = event.button;

        this.canvasElement.setPointerCapture(event.pointerId);
    }

    /**
     * 
     * @param {PointerData} pointer 
     * @param {*} id 
     * @returns 
     */
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
            consecutiveClickCount: pointer.consecutiveClickCount,
            button: pointer.button
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

        const [x,y] = this.#getPointerPosition(event.offsetX, event.offsetY);
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.x = x;
        pointer.y = y;
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

                // manipulation starts
                if (dis > this.settings.pointerMoveDistance) {
                    pointer.moving = true;
                    pointer.startX = pointer.x;
                    pointer.startY = pointer.y;

                    let data = this.#makePointerData(pointer, event.pointerId);
                    if (this.inputManager != null) {
                        let manipulation = this.inputManager.beginManipulation(data);
                        if (manipulation != null) {
                            this.currentManipulation = manipulation;
                            manipulation.setCanvasManager(this);
                        }
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

        const [x,y] = this.#getPointerPosition(event.offsetX, event.offsetY);
        pointer.realX = event.offsetX;
        pointer.realY = event.offsetY;
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.x = x;
        pointer.y = y;

        pointer.releaseTime = Date.now();

        let primaryButton = (pointer) => {
            // double click
            if (pointer.lastClickTime != null && (pointer.releaseTime - pointer.lastClickTime) < this.settings.dbClickTime) { 
                let dis = Math.sqrt((pointer.pressX - pointer.lastClickX) ** 2 + (pointer.pressY - pointer.lastClickY) ** 2);

                if (dis > this.settings.pointerMoveDistance) { // too far - this is a normal click
                    pointer.consecutiveClickCount = 0;
                    this.inputManager.click(this.#makePointerData(pointer, event.pointerId));
                } else { // two consecutive clicks near each other - doubleclick
                    pointer.consecutiveClickCount++;
                    this.inputManager.click(this.#makePointerData(pointer, event.pointerId));
                }
                pointer.lastClickTime = Date.now();
            } else { //single click
                pointer.consecutiveClickCount = 0;
                this.inputManager.click(this.#makePointerData(pointer, event.pointerId));
                pointer.lastClickTime = Date.now();
            }
            pointer.lastClickX = pointer.x;
            pointer.lastClickY = pointer.y;
        }

        if (pointer.pressed) {
            if (pointer.moving) { // end of manipulation
                if (this.currentManipulation != null) {
                    let change = this.currentManipulation.complete();
                    this.currentManipulation = null;
                    if (change != null) {
                        this.commitChange(change);
                    }
                }
            } else { // click
                if (this.inputManager != null) { // if there is no input manager, there is no need to process thiss
                    let data = this.#makePointerData(pointer, event.pointerId);
                    
                    if (event.pointerType == "mouse") {
                        if (pointer.button == 0) { //primary button
                            primaryButton(pointer, data);
                        } else {
                            this.inputManager.alternativeClick(this.#makePointerData(pointer, event.pointerId));
                        }
                    } else {
                        /** Time of touch after which it is considered secondary touch */
                        if ((pointer.releaseTime - pointer.pressTime) < this.settings.touchTime) {
                            primaryButton(pointer, data);
                        } else {
                            this.inputManager.alternativeClick(this.#makePointerData(pointer, event.pointerId));
                        }
                    }
                }
            }
        }

        pointer.pressed = false;
        

        this.canvasElement.releasePointerCapture(event.pointerId);
    }

    #pointercancel(event) {
        /** @type {PointerInstance} */
        let pointer = this.pointers[event.pointerId];

        if (pointer == null) {
            pointer  = new PointerInstance();
            this.pointers[event.pointerId] = pointer;
        }

        this.canvasElement.releasePointerCapture(event.pointerId);

        pointer.pressed = false;
        pointer.releaseTime = Date.now();

        if (this.currentManipulation != null) {
            this.currentManipulation.cancel();
            this.currentManipulation = null;
        }
    }

    #keydown(event) {
        let keyData = new KeyboardData();
        keyData.pressedKeys = this.keyWatcher.pressedKeys;
        keyData.keyWatcher = this.keyWatcher;
        keyData.code = event.code;


        let result;
        if ( //check handleKey of manipulation, then inputmanager, then this CanvasManager
            (this.currentManipulation != null && (result = this.currentManipulation.handleKey(keyData))) ||
            (this.inputManager != null && (result = this.inputManager.handleKey(keyData))) ||
            (result = this.handleKey(keyData))
        ) {
            if (result !== true) {
                this.commitChange(result);
            }
        } 
    }

    /**
     * Handle keyboard input.
     * @param {KeyboardData} keyData 
     * @returns Return UserChange for CanvasManager to execute, or true to inform CM that input has been handled. Return null or false to make it try another input handler.
     */
    handleKey(keyData) {

        for (let action of this.keyboardActions) {
            if (keyData.keyWatcher.checkKeyboardShortcut(action.keyboardShortcut)) {
                this.performUserAction(action);
                return true;
            }
        }

        return false;
    }

    /**
     * @type {UserAction[]}Actions in the global context that can be invoked by keyboard
     */
    keyboardActions = [
        new GenericUserAction("ControlLeft+KeyZ","Undo", "Undo last change", (cm) => cm.revertChange()),
        new GenericUserAction("ControlLeft+KeyY","Redo", "Redo last change", (cm) => cm.redoChange()),
    ]


    /**
     * Performs given user action
     * @param {UserAction} action 
     */
    performUserAction(action) {
        console.log(action.getName() + ": " + action.getDescription());
        const change = action.perform(this);
        // a user action can return a user change - if so CanvasManager will commit this change
        if (change != null) {
            console.log("Perform change")
            this.commitChange(change);
        }
    }
}

export class KeyboardData {
    pressedKeys={};
    /** @type {KeyWatcher} */
    keyWatcher=null;
    code=null;
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
        /** @type {Date} */
        this.lastClickTime = null;
        this.consecutiveClickCount = 0;
        this.button = 0;
    }
}

