import { RenderManager } from "./RenderManager.js";

export class CanvasRenderManager extends RenderManager {

    /**
     * @type {CanvasManager} cm 
     */
    cm;

    constructor () {
        super();
        /** @type {CanvasRenderingContext2D} */
        this.ctx = null;
    }

    prepare() {

        this.width = this.cm.canvasElement.width;
        this.height = this.cm.canvasElement.height;

        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.cm.canvasElement.getContext("2d");
    }

    /**
     * Drawing viewport has been changed
     * @param {Number} w width of the viewport
     * @param {Number} h height of the viewport
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        this.cm.canvasElement.width = width;
        this.cm.canvasElement.height = height;
    }

    /**
     * Notifies the renderer that the state has been changed and it should redraw itself
     * @param {*} state 
     */
    update(state) {
        if (this.ctx == null) {
            this.prepare();
        }
        this.draw(this.ctx, state);
    }

    /** 
     * Drawing testing implementation - to override
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds, state) {

        throw new Error("Not implemented");
    }
}

