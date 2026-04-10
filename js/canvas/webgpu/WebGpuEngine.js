const shader = /* wgsl */ `
    struct ViewportMatrix {
        mat: mat3x3<f32>
    };

    struct PerObjectUniforms {
        fillTyle: u32
    }

    struct Vertex {
        @location(0) position: vec2f,
    };

    @group(0) @binding(0)
    var<uniform> vp: ViewportMatrix;


    @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32,
        coord: Vertex
    ) -> @builtin(position) vec4f {
        let pos = vp.mat * vec3f(coord.position, 1.0);
        return vec4f(pos, 1.0);
    }

    @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
    }
    `;


export class WebGpuEngine {

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
                entryPoint: 'fs',
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

        this.bindGroup = this.device.createBindGroup({
            label: 'viewport bind group',
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

        //vertices
        this.createVertexBuffer(new Float32Array([
            0, 0,
            100, 0,
            100, 100,
            200, 0,
            300, 0,
            300, 200,
        ]));
    }

    createVertexBuffer(vertexCoords) {
        this.vertexBuffer = this.device.createBuffer({
            label: 'vertex buffer vertices',
            size: vertexCoords.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexCoords);
        this.vertexBuffer.unmap();
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
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(6);  
        pass.end();

        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);
    }

    

}



