//draw

import { Graph } from "./Graphs.js";
import { CanvasDrawingManager } from "../js/canvas/test/CanvasDrawingManager.js";


export class GraphsDrawingManager extends CanvasDrawingManager {

    constructor () {
        super();

        this.mouse = null;
        this.click = null;

        this.zoom = 1;
        this.selectedIndex = -1;
    }

    prepare() {
        super.prepare();
    }

    // zoomBy(factor, origin) {
    //     this.zoom = Math.max(0.0001,Math.min(this.zoom * factor, 10000));
    //     console.log("zoom: " + this.zoom * 100 + "%");
    // }

    /** 
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds) {
        ds.clearRect(0, 0, ds.canvas.width, ds.canvas.height);


        if (this.cm.graph != null) {
            ds.strokeStyle = "black";
            ds.beginPath();
            for (let edge of this.cm.graph.edges) {
                ds.moveTo(edge.n1.x, edge.n1.y);
                ds.lineTo(edge.n2.x, edge.n2.y);
            }
            //ds.closePath();
            ds.stroke();
    
            
            let index = 0;
            for (let node of this.cm.graph.nodes) {
                ds.beginPath();
                ds.ellipse(node.x, node.y, 10, 10, 0, 0, 2*Math.PI, false);
    
                if (this.selectedIndex === index) {
                    ds.fillStyle = "red";
                } else {
                    ds.fillStyle = "blue";
                }
                ds.fill();
                ds.stroke();
                index++;
            }
        }



        if (this.click != null) {
            ds.beginPath();
            ds.fillStyle = "violet";
            ds.ellipse(this.click.x, this.click.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (this.dbClick != null) {
            ds.beginPath();
            ds.fillStyle = "lime";
            ds.ellipse(this.dbClick.x, this.dbClick.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (this.altClick != null) {
            ds.beginPath();
            ds.fillStyle = "cyan";
            ds.ellipse(this.altClick.x, this.altClick.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (this.mouse != null) {
            ds.beginPath();
            ds.fillStyle = "green";
            ds.ellipse(this.mouse.x, this.mouse.y, 5, 5, 0, 0, 2*Math.PI, false);
            ds.fill();
        }
    }
}