import { shader } from "./shader.js";

export class WebGpuEngine {

    #primitives = [];
    #pointsBuffer = null;
    #pointsCount = 0;

    constructor(context) {
        this.context = context;

        this.cameraMatrix = new Float32Array([
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

        this.mapBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0, // solidColor
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' },
                },
            ],
        });


        const mapLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                this.globalBindGroupLayout,     // → @group(0)
                this.mapBindGroupLayout,  // → @group(1)
            ],
        });



        //viewport matrix
        this.globalBuffer = this.device.createBuffer({
            label: 'global buffer',
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.globalBindGroup = this.device.createBindGroup({
            label: 'global bind group',
            layout: this.globalBindGroupLayout,
            entries: [
                {
                    binding: 0, 
                    resource: {
                        buffer: this.globalBuffer,
                    },
                },
            ],
        });

        // pipelines
        const mapVertexShaderDef = {
            entryPoint: 'mapVertexShader',
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

        const target = {
            format: presentationFormat,
            blend: {
                color: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                },
                alpha: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                }
            }
        };

        this.renderMapPipeline = this.device.createRenderPipeline({
            label: 'render map pipeline',
            layout: mapLayout,
            vertex: mapVertexShaderDef,
            fragment: {
                entryPoint: 'mapFragmentShader',
                module: this.module,
                targets: [target],
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


    }

    updateMap() {


        this.map = {

            top: this.createVertexBuffer([-10, -10, 1, -10, 10, 1, 10, 10, 1, 10, -10, 1]),

        };

    }

    createVertexBuffer(vertexCoords) {
        const vertexBuffer = this.device.createBuffer({
            label: 'vertex buffer vertices',
            size: vertexCoords.length * 6,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(vertexBuffer.getMappedRange()).set(vertexCoords);
        vertexBuffer.unmap();
        return vertexBuffer;
    }


    createSolidColorBindGroup(color) {
        //solid color uniform
        const solidColorBuffer = this.device.createBuffer({
            label: 'solid color buffer',
            size: 48,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        new Float32Array(solidColorBuffer.getMappedRange()).set(color);
        solidColorBuffer.unmap();


        //bind group for this primitive
        const bindGroup = this.device.createBindGroup({
            label: 'primitive bind group',
            layout: this.solidColorBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: solidColorBuffer } },
            ],
        });
        return bindGroup;
    }

    createGradientBindGroup(data) {
        const gradientParamsBuffer = this.device.createBuffer({
            size: 80, 
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        const mapped = gradientParamsBuffer.getMappedRange();
        new Float32Array(mapped).set([...data.gradientTransform, 0, 0, 0, 0]);
        new Uint32Array(mapped, 64, 4).set([data.gradientRepeat, 0, 0, 0]);
        gradientParamsBuffer.unmap();
        

        const gradientStopsBuffer = this.device.createBuffer({
            size: data.gradientStops.length * 32,
            usage: GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        new Float32Array(gradientStopsBuffer.getMappedRange()).set(data.gradientStops.map(s => [s.offset, 0, 0, 0, ...s.color]).flat());
        gradientStopsBuffer.unmap();

        const bindGroup = this.device.createBindGroup({
            layout: this.gradientBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: gradientParamsBuffer } },
                { binding: 1, resource: { buffer: gradientStopsBuffer } },
            ],
        });
        return bindGroup;

    }

    createTextureBindGroup(data) {
        const textureParamsBuffer = this.device.createBuffer({
            size: 80,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        const mapped = textureParamsBuffer.getMappedRange();
        new Float32Array(mapped).set([...data.textureTransform, 0, 0, 0, 0]);
        new Uint32Array(mapped, 64, 4).set([data.textureRepeat ?? 0, data.textureFiltering ?? 0, 0, 0]);
        textureParamsBuffer.unmap();

        const texture = this.device.createTexture({
            size: [data.textureWidth, data.textureHeight],
            format: data.textureFormat,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.device.queue.writeTexture(
            { texture },
            data.textureData,
            { bytesPerRow: data.textureWidth * 4 },
            { width: data.textureWidth, height: data.textureHeight },
        );



        let addressMode;

        if (data.textureRepeat === 2) addressMode = "repeat";
        else if (data.textureRepeat === 3) addressMode = "mirror-repeat";
        else addressMode = "clamp-to-edge"; 

        const sampler = this.device.createSampler({
            addressModeU: addressMode,
            addressModeV: addressMode,
            magFilter: data.textureFiltering === 1 ? "linear" : "nearest",
            minFilter: data.textureFiltering === 1 ? "linear" : "nearest",
        });


        const bindGroup = this.device.createBindGroup({
            layout: this.textureBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: textureParamsBuffer } },
                { binding: 1, resource: sampler },
                { binding: 2, resource: texture.createView() },
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



