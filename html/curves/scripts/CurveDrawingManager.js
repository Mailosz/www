import {CanvasDrawingManager} from "../../../js/canvas/test/CanvasDrawingManager.js";
import { MathUtils } from "../../../js/utils/MathUtils.js";
import { SEGMENT_KIND } from "./data/Paths.js";

export class CurveDrawingManager extends CanvasDrawingManager {

    constructor(data) {
        super();
        this.data = data;
    }

    /** 
     * Drawing testing implementation - to override
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds) {
        // super.draw(ds);
        ds.resetTransform();
        ds.clearRect(0, 0, this.width, this.height);

        let drawCircle = (p, r = 5) => {
            ds.ellipse(p.x, p.y, r, r, 0, 0, 2*Math.PI);
        }

        let drawSmoothSegment = (a, b, c) => {
            let ab = MathUtils.pointsDistance(a, b); 
            let bc = MathUtils.pointsDistance(b, c); 
            let ca = MathUtils.pointsDistance(c, a); 

            let area = Math.sqrt(ab + bc + ca) * Math.sqrt(-ab + bc + ca) * Math.sqrt(ab - bc + ca) * Math.sqrt(ab + bc - ca);

            let h;
            if (ab > bc) {
                h = 0.5 / ab * area;
                ds.arcTo(b.x, b.y, c.x, c.y, h * 0.5);
                ds.lineTo(c.x, c.y);
                
            } else {
                h = 0.5 / bc * area;
                ds.arcTo(b.x, b.y, c.x, c.y, h * 0.5);
                ds.lineTo(c.x, c.y);
            }
        }


        let drawSegment = (lastPoint, segment) => {
            // debugger
            if ((segment.kind & SEGMENT_KIND.ARC) == SEGMENT_KIND.ARC) {
                //ds.arcTo()
                ds.lineTo(segment.position.x, segment.position.y);
            } else if ((segment.kind & SEGMENT_KIND.ARC_TO) == SEGMENT_KIND.ARC_TO) {
                drawSmoothSegment(lastPoint, segment.cp1, segment.position);
            } else {
                if (segment.cp1 == null) {
                    ds.lineTo(segment.position.x, segment.position.y);
                } else if (segment.cp2 == null) {
                    ds.quadraticCurveTo(segment.cp1.x, segment.cp1.y, segment.position.x, segment.position.y)
                } else {
                    ds.bezierCurveTo(segment.cp1.x, segment.cp1.y, segment.cp2.x, segment.cp2.y, segment.position.x, segment.position.y);
                }
            }
        }

        let drawSegmentControls = (lastSegment, currentSegment) => {
            
            if (lastSegment.cp2 != null) {
                ds.lineWidth = 1;
                ds.beginPath();
                ds.moveTo(lastSegment.position.x, lastSegment.position.y);
                ds.lineTo(lastSegment.cp2.x, lastSegment.cp2.y);
                ds.stroke();

                ds.lineWidth = 2;
                ds.beginPath();
                ds.fillStyle = "lime";
                drawCircle(lastSegment.cp2);
                ds.fill();
                ds.stroke();



            } else if (lastSegment.cp1 != null) {
                ds.lineWidth = 1;
                ds.beginPath();
                ds.moveTo(lastSegment.position.x, lastSegment.position.y);
                ds.lineTo(lastSegment.cp1.x, lastSegment.cp1.y);
                ds.stroke();

                ds.lineWidth = 2;
                ds.beginPath();
                ds.fillStyle = "lime";
                drawCircle(lastSegment.cp1);
                ds.fill();
                ds.stroke();
            }

            if (currentSegment.cp1 != null) {
                ds.lineWidth = 1;
                ds.beginPath();
                ds.moveTo(lastSegment.position.x, lastSegment.position.y);
                ds.lineTo(currentSegment.cp1.x, currentSegment.cp1.y);
                ds.stroke();

                ds.lineWidth = 2;
                ds.beginPath();
                ds.fillStyle = "lime";
                drawCircle(currentSegment.cp1);
                ds.fill();
                ds.stroke();
            }

            ds.lineWidth = 2;
            ds.beginPath();
            ds.fillStyle = "white";
            drawCircle(lastSegment.position, 6);
            ds.fill();
            ds.stroke();
        }

        for (let element of this.data.elements)
        {
            for (let shape of element.shapes) {
                if (shape.segments.length > 1) {
                    ds.lineWidth = 4;
                    ds.beginPath()
                    let lastPoint = {x: shape.segments[0].position.x, y: shape.segments[0].position.y};
                    ds.moveTo(lastPoint.x, lastPoint.y);
                    for (let i = 1; i < shape.segments.length; i++) {
                        drawSegment(lastPoint, shape.segments[i]);
                        lastPoint = shape.segments[i].position;
                    }
                    if (shape.isClosed) {
                        drawSegment(lastPoint, shape.segments[0]);
                        ds.fillStyle = "lightblue";
                        ds.fill();
                    }
                    ds.stroke();
    
                    //draw controls
                    let lastSegment = shape.segments[0];
                    for (let i = 1; i < shape.segments.length; i++) {
                        let currentSegment = shape.segments[i];
                        drawSegmentControls(lastSegment, currentSegment);
                        lastSegment = currentSegment;
                    }
                    drawSegmentControls(lastSegment, shape.segments[0]);
                }
            }


        }


    }



}