const shader = /* wgsl */ `
    struct ViewportMatrix {
        mat: mat3x3<f32>
    };

    struct PerObjectUniforms {
        fillStyle: u32,
        fillTransform: mat3x3<f32>,
        fillColor: vec4f,
    }

    struct SolidColorFillUniforms {
        color: vec4f,
    }

    struct Vertex {
        @location(0) position: vec2f,
    };

    @group(0) @binding(0) var<uniform> vp: ViewportMatrix;
    @group(1) @binding(0) var<uniform> solidColor: SolidColorFillUniforms;


    @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32,
        coord: Vertex
    ) -> @builtin(position) vec4f {
        let pos = vp.mat * vec3f(coord.position, 1.0);
        return vec4f(pos, 1.0);
    }

    @fragment fn fillSolidColor() -> @location(0) vec4f {
        return solidColor.color;
    }
    `;


export class WebGpuEngine {

    #primitives = [];

    constructor(context) {
        this.context = context;

        this.viewportMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0
        ]);
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter?.requestDevice();

        if (!this.device) {
            throw "WebGPU not supported";
        }

        // this.device.lost.then((info) => {
        //     console.error(`WebGPU device was lost: ${info.message}`);

        //     // 'reason' will be 'destroyed' if we intentionally destroy the device.
        //     if (info.reason !== 'destroyed') {
        //         // try again
        //         this.init();
        //     }
        // });

        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: presentationFormat,
        });

        this.module = this.device.createShaderModule({
            label: 'shader module 1',
            code: shader
        });

        this.pipeline = this.device.createRenderPipeline({
            label: 'pipeline 1',
            layout: 'auto',
            vertex: {
                entryPoint: 'vs',
                module: this.module,
                buffers: [
                    {
                        arrayStride: 8, // size of one coord
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x2' },  // position
                        ],
                    },
                ],
            },
            fragment: {
                entryPoint: 'fillSolidColor',
                module: this.module,
                targets: [{ format: presentationFormat }],
            },
            primitive: {
                topology: 'triangle-strip',
                cullMode: 'none',
            }
        });

        this.renderPassDescriptor = {
            label: 'basic renderPass',
            colorAttachments: [
                {
                    // view: <- to be filled out when we render
                    clearValue: [0.3, 0.3, 0.3, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };  

        //viewport matrix
        this.viewportMatrixBuffer = this.device.createBuffer({
            label: 'viewport matrix buffer',
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.globalBindGroup = this.device.createBindGroup({
            label: 'solid color bind group',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0, 
                    resource: {
                        buffer: this.viewportMatrixBuffer,
                    },
                },
            ],
        });
    }

    createVertexBuffer(vertexCoords) {
        const vertexBuffer = this.device.createBuffer({
            label: 'vertex buffer vertices',
            size: vertexCoords.length * 4,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(vertexBuffer.getMappedRange()).set(vertexCoords);
        vertexBuffer.unmap();
        return vertexBuffer;
    }

    addPrimitive(primitiveData) {

        const vertexBuffer = this.createVertexBuffer(primitiveData.coords.flat());

        //solid color uniform
        const solidColorBuffer = this.device.createBuffer({
            label: 'solid color buffer',
            size: 48,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        new Float32Array(solidColorBuffer.getMappedRange()).set(primitiveData.fillColor);
        solidColorBuffer.unmap();


        //bind group for this primitive
        const bindGroup = this.device.createBindGroup({
            label: 'primitivebind group',
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: solidColorBuffer } },
            ],
        });
        
        this.#primitives.push({
            vertexBuffer: vertexBuffer,
            stripCounts: primitiveData.coords.map(strip => strip.length / 2), 
            fill: primitiveData.fill,
            fillBuffer: solidColorBuffer,
            bindGroup: bindGroup,
        });

    }

    render() {
        //set viewport matrix
        this.device.queue.writeBuffer(this.viewportMatrixBuffer, 0, this.viewportMatrix);

        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        this.renderPassDescriptor.colorAttachments[0].view =
            this.context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = this.device.createCommandEncoder({ label: 'our encoder' });

        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.globalBindGroup);
        
        for (let primitive of this.#primitives) {
            pass.setVertexBuffer(0, primitive.vertexBuffer);
            pass.setBindGroup(1, primitive.bindGroup);

            let stripOffset = 0;
            for (let stripCount of primitive.stripCounts) {
                pass.draw(stripCount, 1, stripOffset, 0);
                stripOffset += stripCount;  
            }
        }
        pass.end();

        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);
    }

    

}



