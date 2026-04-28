//draw

import { Graph } from "./Graphs.js";
import { CanvasRenderManager } from "../js/canvas/CanvasRenderManager.js";


export class GraphsDrawingManager extends CanvasRenderManager {

    constructor () {
        super();
    }


    /** 
     * @param {CanvasRenderingContext2D} ds
     * @param {Object} state
     */
    draw(ds, state) {
        ds.clearRect(0, 0, ds.canvas.width, ds.canvas.height);


        if (state.graph != null) {
            ds.strokeStyle = "black";
            ds.beginPath();
            for (let edge of state.graph.edges) {
                ds.moveTo(edge.n1.x, edge.n1.y);
                ds.lineTo(edge.n2.x, edge.n2.y);
            }
            //ds.closePath();
            ds.stroke();
    
            
            let index = 0;
            for (let node of state.graph.nodes) {
                ds.beginPath();
                ds.ellipse(node.x, node.y, 10, 10, 0, 0, 2*Math.PI, false);
    
                if (state.selectedIndex === index) {
                    ds.fillStyle = "red";
                } else {
                    ds.fillStyle = "blue";
                }
                ds.fill();
                ds.stroke();
                index++;
            }
        }



        if (state.click != null) {
            ds.beginPath();
            ds.fillStyle = "violet";
            ds.ellipse(state.click.x, state.click.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (state.dbClick != null) {
            ds.beginPath();
            ds.fillStyle = "lime";
            ds.ellipse(state.dbClick.x, state.dbClick.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (state.altClick != null) {
            ds.beginPath();
            ds.fillStyle = "cyan";
            ds.ellipse(state.altClick.x, state.altClick.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (state.mouse != null) {
            ds.beginPath();
            ds.fillStyle = "green";
            ds.ellipse(state.mouse.x, state.mouse.y, 5, 5, 0, 0, 2*Math.PI, false);
            ds.fill();
        }
    }
}