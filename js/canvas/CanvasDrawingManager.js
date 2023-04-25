//draw

export class CanvasDrawingManager {

    constructor (width, height) {

        this.width = width;
        this.height = height;

        this.zoom = 1;

        /** @type {CanvasManager} */
        this.canvas = null;
        /** @type {CanvasRenderingContext2D} */
        this.ctx = null;
    }

    /**
     * Canvas manager sets itself as context once the InputManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvas) {
        this.canvas = canvas;
    }

    prepare() {
        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.canvas.getContext("2d");
    }

    zoomBy(factor, origin) {
        this.zoom = Math.max(0.0001,Math.min(this.zoom * factor, 10000));
        console.log("zoom: " + this.zoom * 100 + "%");
    }


    /**
     * Drawing viewport has been changed
     * @param {Number} w width of the viewport
     * @param {Number} h height of the viewport
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        
        this.redraw();
    }

    redraw() {
        if (this.ctx == null) {
            this.prepare();
        }
        this.draw(this.ctx);
    }

    /** 
     * Drawing testing implementation - to override
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds) {

        //const scale = window.devicePixelRatio;
        ds.resetTransform();
        //ds.scale(scale, scale);

        
        ds.clearRect(0, 0, this.width, this.height);

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

