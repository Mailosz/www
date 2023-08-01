//draw

import { DrawingManager } from "./DrawingManager.js";
import { WebglEngine } from "./webgl/WebglEngine.js";

export class WebglDrawingManager extends DrawingManager {

    constructor () {
        super();

        this.zoom = 1;

        /** @type {CanvasManager} */
        this.cm = null;
        /** @type {WebGLRenderingContext} */
        this.gl = null;
        /** @type {WebglEngine} */
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
        /** @type {WebGLRenderingContext} */
        let gl = this.cm.canvasElement.getContext("webgl2");
        if (!gl) {
            console.error("WebGL error");
        }
        this.gl = gl;


        this.engine = new WebglEngine(gl);
        


        ///
        ///
        ///
    }

    zoomBy(factor, origin) {
        this.zoom = Math.max(0.0001,Math.min(this.zoom * factor, 10000));
        console.log("zoom: " + this.zoom * 100 + "%");
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

        //resize viewport
        this.gl.viewport(0, 0, this.width, this.height);
        
        this.redraw();
    }

    redraw() {
        if (this.gl == null) {
            this.prepare();
        }
        this.draw(this.gl);
    }

    /** 
     * Drawing testing implementation - to override
     * @param {WebGLRenderingContext} gl
     */
    draw(gl) {


        //resize the canvas
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Tell it to use our program (pair of shaders)
        gl.useProgram(this.engine.simpleProgram.program);
        this.engine.simpleProgram.u_res(gl.canvas.width, gl.canvas.height);
        this.engine.simpleProgram.u_color(0.1, 0.3, 0.7, 1);
        


        var positions = [
            50,20,
            200, 50,
            150, 100,
            300, 300,
            400, 300,
            350, 350,
            200, 100
        ];
        this.engine.simpleProgram.a_pos(positions);


        
        
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(this.positionAttributeLocation, size, type, normalize, stride, offset)

        var primitiveType = gl.TRIANGLE_STRIP;
        var offset = 0;
        var count = 7;
        gl.drawArrays(primitiveType, offset, count);

        
        // gl.drawArrays(gl.TRIANGLE_STRIP /* type */, 0 /* offset */, 7 /* count */);


        // var positions2 = [
        //     250, 120,
        //     300, 150,
        //     350, 200,
        //     400, 300,
        //     400, 400,
        //     350, 550,
        //     500, 100
        // ];
        // this.engine.simpleProgram.a_pos(positions2);
        // this.engine.simpleProgram.u_color(0.7, 0.3, 0.2, 1);
        // gl.drawArrays(gl.TRIANGLE_STRIP /* type */, 0 /* offset */, 7 /* count */);
    }
}
