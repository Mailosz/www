
export class SEGMENT_KIND {
    static FREE = 0;
    static SMOOTH = 1;
    static SYMMETRICAL = 2;
    static KEEPANGLE = 3;

    static NORMAL = 0;
    static ARC = 8;
    static ARC_TO = 16;
}

export class Segment {
    position;
    cp1;
    cp2;
    kind;
    constructor(segment) {
        if (segment != null) {
            for (let property in segment) {
                this[property] = segment[property];
            }
        }
    }

}
export class PathShape {

    /** @type {Segment[]} */
    segments = [];
    isClosed = false;

    constructor(segment) {
        if (segment != null) {
            for (let property in segment) {
                this[property] = segment[property];
            }
        }
    }
}

export class Path {

    /** @type {PathShape[]} */
    shapes = [];

    constructor(segment) {
        if (segment != null) {
            for (let property in segment) {
                this[property] = segment[property];
            }
        }
    }
}