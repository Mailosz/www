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

    struct GradientFillUniforms {
        transform : mat3x3<f32>,
        repeat: u32,
        _pad0: u32,
        _pad1: u32,
        _pad2: u32,
    }

    struct GradientStop {
        position: f32,
        color: vec4f,
    }

    struct Vertex {
        @location(0) position: vec2f,
    };

    struct VertexOut {
        @builtin(position) position: vec4f,
        @location(0) localPos: vec2f,
    };

    @group(0) @binding(0) var<uniform> vp: ViewportMatrix;
    @group(1) @binding(0) var<uniform> solidColor: SolidColorFillUniforms;
    @group(1) @binding(1) var<uniform> gradient: GradientFillUniforms;
    @group(1) @binding(2) var<storage, read> gradientStops: array<GradientStop>;


    @vertex
    fn vs(
        @builtin(vertex_index) vertexIndex : u32,
        coord: Vertex
    ) -> VertexOut {
        var out: VertexOut;

        let pos = vp.mat * vec3f(coord.position, 1.0);
        out.position = vec4f(pos, 1.0);

        // localPos in whatever space you want the gradient to live in
        out.localPos = coord.position;

        return out;
    }


    @fragment fn fillSolidColor() -> @location(0) vec4f {
        return solidColor.color;
    }

    fn gradientClamp(t: f32) -> f32 {
        return clamp(t, 0.0, 1.0);
    }

    fn gradientRepeat(t: f32) -> f32 {
        return fract(t);
    }

    fn gradientMirror(t: f32) -> f32 {
        // Which cycle are we in?
        let cycle = floor(t);

        // Position inside the cycle
        let local = fract(t);

        // Even cycle → forward, odd cycle → reversed
        if (i32(cycle) % 2 == 0) {
            return local;        // forward
        } else {
            return 1.0 - local;  // reversed
        }
    }



    @fragment
    fn fillLinearGradient(
        in: VertexOut
    ) -> @location(0) vec4f {

        // Use the interpolated local position
        let p = gradient.transform * vec3f(in.localPos, 1.0);

        var t = p.x;

        if (gradient.repeat == 1u) {
            t = gradientRepeat(t);
        } else if (gradient.repeat == 2u) {
            t = gradientMirror(t);
        } else {
            t = gradientClamp(t);
        }

        let stopCount = arrayLength(&gradientStops);

        if (stopCount == 0u) {
            return vec4f(0.0, 0.0, 0.0, 1.0);
        }

        if (stopCount == 1u) {
            return gradientStops[0].color;
        }

        var i: u32 = 0u;
        loop {
            if (i + 1u >= stopCount) {
                break;
            }

            let p0 = gradientStops[i].position;
            let p1 = gradientStops[i + 1u].position;

            if (t >= p0 && t <= p1) {
                let f = (t - p0) / (p1 - p0);
                return mix(gradientStops[i].color,
                        gradientStops[i + 1u].color,
                        f);
            }

            i = i + 1u;
        }

        return gradientStops[stopCount - 1u].color;
    }

    @fragment
    fn fillRadialGradient(in: VertexOut) -> @location(0) vec4f {

        // Apply post-transform like a texture matrix
        let p = gradient.transform * vec3f(in.localPos, 1.0);

        // Now compute radial coordinate in transformed space
        var t = length(p.xy);


        if (gradient.repeat == 1u) {
            t = gradientRepeat(t);
        } else if (gradient.repeat == 2u) {
            t = gradientMirror(t);
        } else {
            t = gradientClamp(t);
        }

        // Stop interpolation (unchanged)
        let stopCount = arrayLength(&gradientStops);

        if (stopCount == 0u) {
            return vec4f(0.0, 0.0, 0.0, 1.0);
        }

        if (stopCount == 1u) {
            return gradientStops[0].color;
        }

        var i: u32 = 0u;
        loop {
            if (i + 1u >= stopCount) {
                break;
            }

            let p0 = gradientStops[i].position;
            let p1 = gradientStops[i + 1u].position;

            if (t >= p0 && t <= p1) {
                let f = (t - p0) / (p1 - p0);
                return mix(gradientStops[i].color,
                        gradientStops[i + 1u].color,
                        f);
            }

            i = i + 1u;
        }

        return gradientStops[stopCount - 1u].color;
    }

    fn gradientReverseRepeat(t: f32) -> f32 {
        let cycle = floor(t);
        let local = fract(t);
        if (i32(cycle) % 2 == 0) {
            return local;
        } else {
            return 1.0 - local;
        }
    }

    @fragment
    fn fillConicGradient(in: VertexOut) -> @location(0) vec4f {

        // Transform local position into gradient space
        let p = gradient.transform * vec3f(in.localPos, 1.0);

        // Compute angle-based coordinate
        let a = atan2(p.y, p.x);
        var t = (a + 3.141592653589793) / (2.0 * 3.141592653589793);

        // Apply clamp
        t = clamp(t, 0.0, 1.0);

        let stopCount = arrayLength(&gradientStops);

        if (stopCount == 0u) {
            return vec4f(0.0, 0.0, 0.0, 1.0);
        }

        if (stopCount == 1u) {
            return gradientStops[0].color;
        }

        // Find interval
        var i: u32 = 0u;
        loop {
            if (i + 1u >= stopCount) {
                break;
            }

            let p0 = gradientStops[i].position;
            let p1 = gradientStops[i + 1u].position;

            if (t >= p0 && t <= p1) {
                let f = (t - p0) / (p1 - p0);
                return mix(gradientStops[i].color,
                        gradientStops[i + 1u].color,
                        f);
            }

            i = i + 1u;
        }

        return gradientStops[stopCount - 1u].color;
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
        };

        const primitiveState = {
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
            primitive: primitiveState,
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
            primitive: primitiveState,
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
            primitive: primitiveState,
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
            primitive: primitiveState,
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
        pass.end();

        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);
    }

    

}



