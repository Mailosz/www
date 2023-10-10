//draw

export class DrawingManager {

    constructor () {

        this.zoom = 1;

        /** @type {CanvasManager} */
        this.cm = null;
    }

    resize(width, height) {
        throw "resize not implemented";
    }

    /**
     * Canvas manager sets itself as context once the DrawingManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvas) {
        this.cm = canvas;
    }

    /**
     * Called automatically before first draw
     */
    prepare() {
        throw "prepare not implemented";
    }

    zoomBy(factor, origin) {
        throw "zoomBy not implemented";
    }


    redraw() {
        throw "redraw not implemented";
    }


    close() {
        console.log("DrawingManager closed")
    }

}

