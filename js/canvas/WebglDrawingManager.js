//draw

import { DrawingManager } from "./DrawingManager.js";

export class WebglDrawingManager extends DrawingManager {

    constructor () {
        super();

        this.zoom = 1;

        /** @type {CanvasManager} */
        this.cm = null;
        /** @type {WebGLRenderingContext} */
        this.gl = null;
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
        let gl = this.cm.canvasElement.getContext("webgl");
        if (!gl) {
            console.error("WebGL error");
        }
        this.gl = gl;
        
        //var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
        //var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
        
        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex_shader_2d);
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment_shader_2d);
        
        this.program = createProgram(gl, vertexShader, fragmentShader);
        
        //set attributes position
        this.positionAttributeLocation = gl.getAttribLocation(this.program, "a_pos");
        this.positionBuffer = gl.createBuffer();
        gl.enableVertexAttribArray(this.positionAttributeLocation);

        this.resolutionUniformLocation = gl.getUniformLocation(this.program, "u_res");

        this.colorUniformLocation = gl.getUniformLocation(this.program, "u_color");


        function createShader(gl, type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (success) {
                return shader;
            }
            
            console.log(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
        }

        function createProgram(gl, vertexShader, fragmentShader) {
            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            var success = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (success) {
                return program;
            }
            
            console.log(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
        }

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
        gl.useProgram(this.program);
        gl.uniform2f(this.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform4f(this.colorUniformLocation, 1.0,0,1.0,1.0);



        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        // three 2d points
        var positions = [
            50,20,
            200, 50,
            150, 100,
            300, 300,
            400, 300,
            350, 350,
            200, 100
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        
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
    }
}




const vertex_shader_2d = /*glsl*/`
    // an attribute will receive data from a buffer
    attribute vec2 a_pos;
    uniform vec2 u_res;

    // all shaders have a main function
    void main() {

        // convert the position from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_pos / u_res;
    
        // convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;
    
        // convert from 0->2 to -1->+1 (clip space)
        vec2 clipSpace = zeroToTwo - 1.0;
    
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
    `;


const fragment_shader_2d = /*glsl*/`
    // fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default
    precision mediump float;

    uniform vec4 u_color;

    void main() {
        // gl_FragColor is a special variable a fragment shader
        // is responsible for setting
        gl_FragColor = u_color;
    }
    `;