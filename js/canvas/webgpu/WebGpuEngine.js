import { shader } from "./shader.js";

export class WebGpuEngine {

    #primitives = [];
    #pointsBuffer = null;
    #pointsCount = 0;

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


        //group layouts
        this.globalBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                        minBindingSize: 0,
                    },
                },
            ],
        });

        this.primitiveBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0, // solidColor
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' },
                },
                {
                    binding: 1, // gradient params
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' },
                },
                {
                    binding: 2, // gradientStops storage buffer
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'read-only-storage' },
                },
            ],
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                this.globalBindGroupLayout,     // → @group(0)
                this.primitiveBindGroupLayout,  // → @group(1)
            ],
        });


        //viewport matrix
        this.viewportMatrixBuffer = this.device.createBuffer({
            label: 'viewport matrix buffer',
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.globalBindGroup = this.device.createBindGroup({
            label: 'solid color bind group',
            layout: this.globalBindGroupLayout,
            entries: [
                {
                    binding: 0, 
                    resource: {
                        buffer: this.viewportMatrixBuffer,
                    },
                },
            ],
        });

        // pipelines
        const vertexState = {
            entryPoint: 'trianglesVertexShader',
            module: this.module,
            buffers: [
                {
                    arrayStride: 8, // size of one coord
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x2' },  // position
                    ],
                },
            ],
        };

        const triangleStripPrimitive = {
            topology: 'triangle-strip',
            cullMode: 'none',
        };

        this.solidColorPipeline = this.device.createRenderPipeline({
            label: 'solid color pipeline',
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: {
                entryPoint: 'fillSolidColor',
                module: this.module,
                targets: [{ format: presentationFormat }],
            },
            primitive: triangleStripPrimitive,
        });

        this.linearGradientPipeline = this.device.createRenderPipeline({
            label: 'linear gradient pipeline',
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: {
                entryPoint: 'fillLinearGradient',
                module: this.module,
                targets: [{ format: presentationFormat }],
            },
            primitive: triangleStripPrimitive,
        });

        this.radialGradientPipeline = this.device.createRenderPipeline({
            label: 'radial gradient pipeline',
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: {
                entryPoint: 'fillRadialGradient',
                module: this.module,
                targets: [{ format: presentationFormat }],
            },
            primitive: triangleStripPrimitive,
        });

        this.pointPipeline = this.device.createRenderPipeline({
            label: 'points pipeline',
            layout: pipelineLayout,
            vertex: {
                module: this.module,
                entryPoint: 'pointsVertexShader',
                buffers: [
                    {
                        arrayStride: 12, 
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x2' },  // position
                            { shaderLocation: 1, offset: 8, format: 'float32' },  // size
                        ],
                    },
                ],
            },
            fragment: {
                module: this.module,
                entryPoint: 'fillSolidColor',
                targets: [{ format: presentationFormat }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });


        this.conicGradientPipeline = this.device.createRenderPipeline({
            label: 'conic gradient pipeline',
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: {
                entryPoint: 'fillConicGradient',
                module: this.module,
                targets: [{ format: presentationFormat }],
            },
            primitive: triangleStripPrimitive,
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

        this.dummyUniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM,
        });

        this.dummyStorageBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE,
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

        let bindGroup, pipeline;
        if (primitiveData.fill === "solid-color") {
            bindGroup = this.createSolidColorBindGroup(primitiveData.fillColor);
            pipeline = this.solidColorPipeline;
        } else if (primitiveData.fill === "linear-gradient") {
            bindGroup = this.createGradientBindGroup(primitiveData);
            pipeline = this.linearGradientPipeline;
        } else if (primitiveData.fill === "radial-gradient") {
            bindGroup = this.createGradientBindGroup(primitiveData);
            pipeline = this.radialGradientPipeline;
        } else if (primitiveData.fill === "conic-gradient") {
            bindGroup = this.createGradientBindGroup(primitiveData);
            pipeline = this.conicGradientPipeline;
        } 
        
        this.#primitives.push({
            vertexBuffer: vertexBuffer,
            stripCounts: primitiveData.coords.map(strip => strip.length / 2), 
            pipeline: pipeline,
            bindGroup: bindGroup,
        });

    }

    createSolidColorBindGroup(fillColor) {
        //solid color uniform
        const solidColorBuffer = this.device.createBuffer({
            label: 'solid color buffer',
            size: 48,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        new Float32Array(solidColorBuffer.getMappedRange()).set(fillColor);
        solidColorBuffer.unmap();


        //bind group for this primitive
        const bindGroup = this.device.createBindGroup({
            label: 'primitive bind group',
            layout: this.primitiveBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: solidColorBuffer } },
                { binding: 1, resource: { buffer: this.dummyUniformBuffer } },
                { binding: 2, resource: { buffer: this.dummyStorageBuffer } },
            ],
        });
        return bindGroup;
    }

    createGradientBindGroup(data) {
        const gradientParamsBuffer = this.device.createBuffer({
            size: 64, 
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        const mapped = gradientParamsBuffer.getMappedRange();
        new Float32Array(mapped).set(data.gradientTransform);
        new Uint32Array(mapped, 48, 4).set([data.gradientRepeat, 0, 0, 0]);
        gradientParamsBuffer.unmap();
        

        const gradientStopsBuffer = this.device.createBuffer({
            size: data.gradientStops.length * 32,
            usage: GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        new Float32Array(gradientStopsBuffer.getMappedRange()).set(data.gradientStops.map(s => [s.offset, 0, 0, 0, ...s.color]).flat());
        gradientStopsBuffer.unmap();

        const bindGroup = this.device.createBindGroup({
            layout: this.primitiveBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.dummyUniformBuffer } },
                { binding: 1, resource: { buffer: gradientParamsBuffer } },
                { binding: 2, resource: { buffer: gradientStopsBuffer } },
            ],
        });
        return bindGroup;

    }


    setPoints(pointsData) {
        this.#pointsCount = pointsData.length;
        if (!pointsData || pointsData.length === 0) {
            this.#pointsBuffer = null;
            return;
        }
        this.#pointsBuffer = this.createVertexBuffer(pointsData.flatMap(p => [p.x, p.y, p.size]));
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
        pass.setBindGroup(0, this.globalBindGroup);
        
        for (let primitive of this.#primitives) {
            pass.setPipeline(primitive.pipeline);
            pass.setVertexBuffer(0, primitive.vertexBuffer);
            pass.setBindGroup(1, primitive.bindGroup);

            let stripOffset = 0;
            for (let stripCount of primitive.stripCounts) {
                pass.draw(stripCount, 1, stripOffset, 0);
                stripOffset += stripCount;  
            }
        }

        if (this.#pointsBuffer) {
            pass.setBindGroup(0, this.globalBindGroup);
            pass.setPipeline(this.pointPipeline);
            pass.setBindGroup(1, this.createSolidColorBindGroup([1, 1, 0, 1]));
            pass.setVertexBuffer(0, this.#pointsBuffer);

            pass.draw(6, this.#pointsCount, 0, 0); 
        }

        pass.end();

        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);
    }

    

}



