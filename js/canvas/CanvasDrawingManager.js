//draw

import { DrawingManager } from "./DrawingManager.js";

export class CanvasDrawingManager extends DrawingManager {

    /**
     * @type {CanvasManager} cm 
     */
    cm;

    constructor () {
        super();
        /** @type {CanvasRenderingContext2D} */
        this.ctx = null;
    }

    /**
     * Canvas manager sets itself as context once the InputManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvas) {
        this.cm = canvas;
    }

    prepare() {

        this.width = this.cm.canvasElement.width;
        this.height = this.cm.canvasElement.height;

        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.cm.canvasElement.getContext("2d");
    }

    /**
     * Drawing viewport has been changed
     * @param {Number} w width of the viewport
     * @param {Number} h height of the viewport
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        this.cm.canvasElement.width = width;
        this.cm.canvasElement.height = height;
        
        this.redraw();
    }

    redraw(viewport) {
        if (this.ctx == null) {
            this.prepare();
        }
        if (!viewport) {
            viewport = this.cm.viewport;
        }
        this.draw(this.ctx, viewport);
    }

    /** 
     * Drawing testing implementation - to override
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds, viewport) {

        ds.resetTransform();
        ds.clearRect(0,0,this.width,this.height);
        ds.scale(this.width / viewport.w, this.height / viewport.h);
        ds.translate(-viewport.x, -viewport.y);

    

        ds.moveTo(0,0);
        ds.lineTo(this.width, this.height);
        ds.moveTo(this.width,0);
        ds.lineTo(0, this.height);
        ds.stroke();

        ds.strokeStyle = "black";
        ds.rect(1,1,this.width - 2, this.height - 2);
        ds.stroke();

        
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

        
        if (this.lines != null && this.lines.length > 0) {
            ds.strokeStyle = "black";
            
            ds.beginPath();
            ds.moveTo(this.lines[0].x, this.lines[0].y);
            for (let i = 1; i < this.lines.length; i++) {
                ds.lineTo(this.lines[i].x, this.lines[i].y);
            }

        }
        ds.stroke();

        if (this.drag != null) {
            ds.beginPath();
            ds.fillStyle = "red";
            ds.ellipse(this.drag.x, this.drag.y, 5, 5, 0, 0, 2*Math.PI, false);
            ds.fill();
        }
    }
}

