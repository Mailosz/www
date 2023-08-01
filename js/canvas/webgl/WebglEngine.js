/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
function compileShader(gl, shaderSource, shaderType) {
    // Create the shader object
    var shader = gl.createShader(shaderType);
   
    // Set the shader source code.
    gl.shaderSource(shader, shaderSource);
   
    // Compile the shader
    gl.compileShader(shader);
   
    // Check if it compiled
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      // Something went wrong during compilation; get the error
      throw "could not compile shader:" + gl.getShaderInfoLog(shader);
    }
    return shader;
}

/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext} gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
*/
function createProgram(gl, vertexShader, fragmentShader) {
    // create a program.
    var program = gl.createProgram();

    // attach the shaders.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // link the program.
    gl.linkProgram(program);

    // Check if it linked.
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        // something went wrong with the link
        throw ("program failed to link:" + gl.getProgramInfoLog (program));
    }

    return program;
};

export class WebglEngine {

    /**
     * 
     * @param {!WebGLRenderingContext} gl The WebGL context.
     */
    constructor(gl) {
        
        const simpleVertexShader = compileShader(gl, vertex_shader_2d, gl.VERTEX_SHADER);
        const simpleFragmentShader = compileShader(gl, fragment_shader_2d, gl.FRAGMENT_SHADER);
        const simpleProgram = createProgram(gl, simpleVertexShader, simpleFragmentShader);

        this.simpleProgram = new SimpleDrawingProgram(gl, simpleProgram);

    }


}


class SimpleDrawingProgram {
    /**
     * @param {!WebGLRenderingContext} gl The WebGL context.
     * @param {!WebGLProgram} program A program.
     */
    constructor(gl, program) {

        this.program = program;

        const positionAttributeLocation = gl.getAttribLocation(this.program, "a_pos");
        this.a_pos = (a_pos) => {
            this.positionBuffer = gl.createBuffer();
            gl.enableVertexAttribArray(positionAttributeLocation);
            //
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a_pos), gl.STATIC_DRAW);
            // Bind the position buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        }

        

        const resolutionUniformLocation = gl.getUniformLocation(this.program, "u_res");
        this.u_res = (u_res_1, u_res_2) => {
            gl.uniform2f(resolutionUniformLocation, u_res_1, u_res_2);
        };
        const colorUniformLocation = gl.getUniformLocation(this.program, "u_color");
        this.u_color = (r, g, b, a) => {
            gl.uniform4f(colorUniformLocation, r, g, b, a);
        };
    }
}



const vertex_shader_2d = /*glsl*/`#version 300 es
    // an attribute will receive data from a buffer
    in vec2 a_pos;
    uniform vec2 u_res;

    //out vec4 out_pos;

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


const fragment_shader_2d = /*glsl*/`#version 300 es
    // fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default
    precision highp float;

    uniform vec4 u_color;

    out vec4 out_color;

    void main() {
        // gl_FragColor is a special variable a fragment shader
        // is responsible for setting
        out_color = u_color;
    }
    `;
