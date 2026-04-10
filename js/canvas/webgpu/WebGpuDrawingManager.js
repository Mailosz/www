//draw

import { DrawingManager } from "../DrawingManager.js";
import { WebGpuEngine } from "./WebGpuEngine.js";

export class WebGpuDrawingManager extends DrawingManager {

    /**
     * @type {CanvasManager} cm 
     */
    cm;

    #initialized = null;

    constructor () {
        super();

        this.zoom = 1;

        /** @type {CanvasManager} */
        this.cm = null;
        /** @type {GPUCanvasContext} */
        this.context = null;
        /** @type {WebGpuEngine} */
        this.engine = null;
    }

    /**
     * Canvas manager sets itself as context once the InputManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvas) {
        this.cm = canvas;
    }

    prepare() {

        this.width = this.cm.canvasElement.width;
        this.height = this.cm.canvasElement.height;

        ///
        ///
        ///
        /** @type {GPUCanvasContext} */
        let context = this.cm.canvasElement.getContext("webgpu");
        if (!context) {
            console.error("WebGPU error");
        }
        this.context = context;

        this.engine = new WebGpuEngine(context);
        this.#initialized = this.engine.init();
        
        ///
        ///
        ///
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
        
        this.redraw();
    }

    updateViewport(viewport) {
        const sx = 2 / viewport.w;
        const sy = -2 / viewport.h;
        const tx = -1 - viewport.x * sx;
        const ty = 1 - viewport.y * sy;

        this.engine.viewportMatrix = new Float32Array([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            tx, ty, 1, 0,
        ]);
    }

    redraw() {
        if (this.context == null) {
            this.prepare();
        }

        this.#initialized?.then(() => this.engine.render());
    }
}
