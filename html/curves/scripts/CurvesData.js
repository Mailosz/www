import { MathUtils } from "../../../js/utils/MathUtils.js";
import { Path, PathShape, Segment, SEGMENT_KIND } from "./data/Paths.js";

export class CurvesData {

    /** @type {Path[]} */
    elements = [
        new Path({
            shapes: [
                new PathShape({
                    segments: [
                        new Segment({cp1: {x: 600, y: 250}, cp2: {x: 100, y: 250}, position: {x: 100, y: 100}, kind: SEGMENT_KIND.NORMAL}),
                        new Segment({cp1: {x: 100, y: 50}, cp2: {x: 200, y: 50}, position: {x: 200, y: 100}, kind: SEGMENT_KIND.NORMAL}),
                        new Segment({cp1: {x: 200, y: 150}, cp2: {x: 300, y: 150}, position: {x: 300, y: 100}, kind: SEGMENT_KIND.NORMAL}),
                        new Segment({cp1: {x: 350, y: 50},  position: {x: 400, y: 100}, kind: SEGMENT_KIND.NORMAL}),
                        new Segment({cp1: {x: 450, y: 100},  position: {x: 500, y: 100}, kind: SEGMENT_KIND.ARC}),
                        new Segment({cp1: {x: 550, y: 150},  position: {x: 600, y: 100}, kind: SEGMENT_KIND.ARC_TO}),
                    ]
                })
            ]
        })
    ];



    findNearestPoint(x,y) {
        let p = {x: x, y: y};

        let distance = Number.POSITIVE_INFINITY;
        let found = null;

        for (let element of this.elements) {
            for (let shape of element.shapes) {
                for (let segment of shape.segments) {
    
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




