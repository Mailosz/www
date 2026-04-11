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

        this.#initialized.then(() => {
            this.engine.addPrimitive({
                coords: [[
                    50, 50,
                    150, 50,
                    150, 150,
                    50, 150,
                ]],
                fill: "solid-color",
                fillColor: new Float32Array([1, 0, 0, 1]),
            });
            this.engine.addPrimitive({
                coords: [[
                    200, 0,
                    300, 0,
                    300, 100,
                    200, 100,
                ]],
                fill: "solid-color",
                fillColor: new Float32Array([0, 1, 0, 1]),
            });
            this.engine.addPrimitive({
                coords: [[
                    300, 100,
                    400, 100,
                    400, 200,
                    300, 200,
                ]],
                fill: "solid-color",
                fillColor: new Float32Array([0, 0, 1, 1]),
            });
            this.engine.addPrimitive({
                coords: [[
                    0, 0,
                    200, 0,
                    0, 200,
                    200, 200,
                ]],
                fill: "conic-gradient",
                gradientTransform: [
                    1 / 50, 0, 0, 0,
                    0, 1 / 50, 0, 0,
                    -100 / 100, -100 / 100, 1, 0,
                ],
                gradientRepeat: 2,
                gradientStops: [
                    {offset: 0, color: [1, 0, 0, 1]},
                    {offset: 0.5, color: [0, 1, 0, 1]},
                    {offset: 1, color: [0, 0, 1, 1]},
                ],
            });
        });
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
