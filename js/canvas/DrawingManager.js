//draw

export class DrawingManager {

    /**
     * @type {CanvasManager} cm 
     */
    cm;

    constructor () {

    }
    
    /**
     * Canvas manager sets itself as context once the DrawingManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvas) {
        this.cm = canvas;
    }


    /**
     * Called whenever the viewport changes
     * @param {*} viewport 
     */
    updateViewport(viewport) {
        
    }

    
    resize(width, height) {
        throw "resize not implemented";
    }

    /**
     * Called automatically before first draw
     */
    prepare() {
        throw "prepare not implemented";
    }    



    redraw(viewport) {
        throw "redraw not implemented";
    }


    close() {
        console.log("DrawingManager closed")
    }

}

