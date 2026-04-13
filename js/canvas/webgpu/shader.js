export const shader = /* wgsl */ `
    struct GlobalUniforms {
        viewportMatrix: mat3x3<f32>
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
        baseColor: vec4f,
        repeat: u32,
        _pad0: u32,
        _pad1: u32,
        _pad2: u32,
    }

    struct TextureFillUniforms {
        transform : mat3x3<f32>,
        baseColor: vec4f,
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

    struct Point {
        @location(0) position: vec2f,
        @location(1) size: f32,
    };


    @group(0) @binding(0) var<uniform> global: GlobalUniforms;
    @group(1) @binding(0) var<uniform> solidColor: SolidColorFillUniforms;

    @group(1) @binding(0) var<uniform> gradient: GradientFillUniforms;
    @group(1) @binding(1) var<storage, read> gradientStops: array<GradientStop>;

    @group(1) @binding(0) var<uniform> texUniforms: TextureFillUniforms;
    @group(1) @binding(1) var texSampler: sampler;
    @group(1) @binding(2) var texData: texture_2d<f32>;

    @vertex
    fn trianglesVertexShader(
        @builtin(vertex_index) vertexIndex : u32,
        coord: Vertex
    ) -> VertexOut {
        var out: VertexOut;

        let pos = global.viewportMatrix * vec3f(coord.position, 1.0);
        out.position = vec4f(pos, 1.0);

        // localPos in whatever space you want the gradient to live in
        out.localPos = coord.position;

        return out;
    }

    @vertex
    fn pointsVertexShader(
        @builtin(vertex_index) vertexIndex : u32,
        coord: Point
    ) -> VertexOut {
        let points = array(
            vec2f(-1, -1),
            vec2f( 1, -1),
            vec2f(-1,  1),
            vec2f(-1,  1),
            vec2f( 1, -1),
            vec2f( 1,  1),
        );
        var out: VertexOut;
        let pos = points[vertexIndex];
        out.position = vec4f(global.viewportMatrix * vec3f(coord.position + pos * coord.size, 1.0), 1.0);
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



    fn texClampToBase(uv: vec2f, base: vec4f) -> vec4f {
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            return base;
        }
        return textureSample(texData, texSampler, uv);
    }

    fn texRepeat(uv: vec2f) -> vec2f {
        return fract(uv);
    }

    fn texMirrorRepeat(uv: vec2f) -> vec2f {
        let ucycle = floor(uv);
        let vcycle = floor(uv);

        let ulocal = fract(uv.x);
        let vlocal = fract(uv.y);

        let u = select(1.0 - ulocal, ulocal, (i32(ucycle.x) % 2) == 0);
        let v = select(1.0 - vlocal, vlocal, (i32(vcycle.y) % 2) == 0);

        return vec2f(u, v);
    }


@fragment
fn fillTexture(in: VertexOut) -> @location(0) vec4f {

    // Transform localPos → UV
    let uv3 = vec3f(in.localPos, 1.0);
    let t = texUniforms.transform * uv3;
    let uv = t.xy;

    // Sample once (uniform control flow)
    let texColor = textureSample(texData, texSampler, uv);

    // Only repeat == 0 needs special handling
    if (texUniforms.repeat == 0u) {
        let inside =
            (uv.x >= 0.0 && uv.x <= 1.0 &&
             uv.y >= 0.0 && uv.y <= 1.0);

        // select() is uniform control flow
        return select(texUniforms.baseColor, texColor, inside);
    }

    // All other repeat modes handled by sampler
    return texColor;
}


    `;