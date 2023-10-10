import { MathUtils } from "../../../js/utils/MathUtils.js";

export class CurvesData {

    isclosed = false;
    segments = [
        {position: {x: 100, y: 100},},
        {cp1: {x: 100, y: 50}, cp2: {x: 200, y: 50}, position: {x: 200, y: 100}},
        {cp1: {x: 200, y: 150}, cp2: {x: 300, y: 150}, position: {x: 300, y: 100}},
        {cp1: {x: 350, y: 50},  position: {x: 400, y: 100}},
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

export class NODE_KIND {
    FREE = 0;
    SMOOTH = 1;
    SYMMETRICAL = 2;
    KEEPANGLE = 3;

    NORMAL = 0;
    ARC = 8;
}


