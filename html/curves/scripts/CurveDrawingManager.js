import {CanvasDrawingManager} from "../../../js/canvas/CanvasDrawingManager.js";
import { MathUtils } from "../../../js/utils/MathUtils.js";

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

        let drawCircle = (p) => {
            ds.ellipse(p.x, p.y, 5, 5, 0, 0, 2*Math.PI);
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
            console.log(h)
        }


        let drawSegment = (segment) => {
            if (segment.cp1 == null) {
                ds.lineTo(segment.position.x, segment.position.y);
            } else if (segment.cp2 == null) {
                ds.quadraticCurveTo(segment.cp1.x, segment.cp1.y, segment.position.x, segment.position.y)
            } else {
                ds.bezierCurveTo(segment.cp1.x, segment.cp1.y, segment.cp2.x, segment.cp2.y, segment.position.x, segment.position.y);
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
                ds.fillStyle = "green";
                drawCircle(lastSegment.cp2);
                ds.fill();
                ds.stroke();
            } 

            if (currentSegment.cp1 != null) {
                ds.lineWidth = 1;
                ds.beginPath();
                ds.moveTo(lastSegment.position.x, lastSegment.position.y);
                ds.lineTo(currentSegment.cp1.x, currentSegment.cp1.y);
                ds.stroke();

                if (currentSegment.cp2 == null) {
                    ds.lineWidth = 1;
                    ds.beginPath();
                    ds.moveTo(currentSegment.position.x, currentSegment.position.y);
                    ds.lineTo(currentSegment.cp1.x, currentSegment.cp1.y);
                    ds.stroke();
                }

                ds.lineWidth = 2;
                ds.beginPath();
                ds.fillStyle = "green";
                drawCircle(currentSegment.cp1);
                ds.fill();
                ds.stroke();
            }

            ds.beginPath();
            ds.fillStyle = "blue";
            drawCircle(currentSegment.position);
            ds.fill();
            ds.stroke();
        }

        if (this.data.segments.length > 1) {
            ds.lineWidth = 4;
            ds.beginPath()
            ds.moveTo(this.data.segments[0].position.x, this.data.segments[0].position.y);
            for (let i = 1; i < this.data.segments.length; i++) {
                drawSegment(this.data.segments[i]);
            }
            if (this.data.isClosed) {
                drawSegment(this.data.segments[0]);
                ds.fill();
            }
            ds.stroke();

            //draw controls
            let lastSegment = this.data.segments[0];
            for (let i = 1; i < this.data.segments.length; i++) {
                let currentSegment = this.data.segments[i];
                drawSegmentControls(lastSegment, currentSegment);
                lastSegment = currentSegment;
            }
            drawSegmentControls(lastSegment, this.data.segments[0]);
        }




    }



}