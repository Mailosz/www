import { CanvasRenderManager } from "../CanvasRenderManager.js";

export class TestCanvasRenderManager extends CanvasRenderManager {

    /**
     * @type {CanvasManager} cm 
     */
    cm;

    constructor () {
        super();
    }


    /** 
     * Drawing testing implementation - to override
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds, state) {

        ds.resetTransform();
        ds.clearRect(0,0,this.width,this.height);
        ds.scale(this.width / state.viewport.w, this.height / state.viewport.h);
        ds.translate(-state.viewport.x, -state.viewport.y);


        ds.beginPath();
        ds.moveTo(0,0);
        ds.lineTo(this.width, this.height);
        ds.moveTo(this.width,0);
        ds.lineTo(0, this.height);
        ds.stroke();

        ds.strokeStyle = "black";
        ds.rect(1,1,this.width - 2, this.height - 2);
        ds.stroke();

        if (state.longPress != null) {
            ds.beginPath();
            ds.fillStyle = "yellow";
            ds.ellipse(state.longPress.x, state.longPress.y, 20, 20, 0, 0, 2 * Math.PI, false);
            ds.fill();
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

        
        if (state.lines != null && state.lines.length > 0) {
            ds.strokeStyle = "black";

            ds.beginPath();
            ds.moveTo(state.lines[0].x, state.lines[0].y);
            for (let i = 1; i < state.lines.length; i++) {
                ds.lineTo(state.lines[i].x, state.lines[i].y);
            }
            ds.stroke();
        }

        if (state.drag != null) {
            ds.beginPath();
            ds.fillStyle = "red";
            ds.ellipse(state.drag.x, state.drag.y, 5, 5, 0, 0, 2*Math.PI, false);
            ds.fill();
        }
    }
}

