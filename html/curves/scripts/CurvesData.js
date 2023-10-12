import { MathUtils } from "../../../js/utils/MathUtils.js";

export class CurvesData {

    isClosed = false;
    segments = [
        {cp1: {x: 600, y: 250}, cp2: {x: 100, y: 250}, position: {x: 100, y: 100}, kind: SEGMENT_KIND.NORMAL},
        {cp1: {x: 100, y: 50}, cp2: {x: 200, y: 50}, position: {x: 200, y: 100}, kind: SEGMENT_KIND.NORMAL},
        {cp1: {x: 200, y: 150}, cp2: {x: 300, y: 150}, position: {x: 300, y: 100}, kind: SEGMENT_KIND.NORMAL},
        {cp1: {x: 350, y: 50},  position: {x: 400, y: 100}, kind: SEGMENT_KIND.NORMAL},
        {cp1: {x: 450, y: 100},  position: {x: 500, y: 100}, kind: SEGMENT_KIND.ARC},
        {cp1: {x: 550, y: 150},  position: {x: 600, y: 100}, kind: SEGMENT_KIND.ARC_TO},
        
    ];


    findNearestPoint(x,y) {
        let p = {x: x, y: y};

        let distance = Number.POSITIVE_INFINITY;
        let found = null;

        for (let segment of this.segments) {

            let points = [segment.cp1, segment.cp2, segment.position];

            for (let point of points) {

                if (point == null) continue;

                let dis = MathUtils.pointsDistance(point, p);
    
                if (dis < distance) {
                    distance = dis;
                    found = point;
                }
            }
        }


        return {found, distance};
    }

    findNearestNode(x,y) {
        let p = {x: x, y: y};

        let distance = Number.POSITIVE_INFINITY;
        let found = null;

        for (let segment of this.segments) {

            let dis = MathUtils.pointsDistance(segment.position, p);

            if (dis < distance) {
                distance = dis;
                found = segment;
            }
        }

        return {found, distance};
    }
        
}

export class Segment {
    position;
    cp1;
    cp2;
    kind;
}

export class SEGMENT_KIND {
    static FREE = 0;
    static SMOOTH = 1;
    static SYMMETRICAL = 2;
    static KEEPANGLE = 3;

    static NORMAL = 0;
    static ARC = 8;
    static ARC_TO = 16;
}


