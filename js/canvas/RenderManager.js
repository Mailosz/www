//draw

export class RenderManager {

    /**
     * @type {CanvasManager} cm 
     */
    cm;

    constructor () {

    }
    
    /**
     * Canvas manager sets itself as context once the RenderManager is set
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

    /**
     * Called by the canvas manager whenever the canvas is resized
     * @param {number} width in pixels
     * @param {number} height in pixels
     */
    resize(width, height) {
        throw "resize not implemented";
    }

    /**
     * Called automatically before first draw
     */
    prepare() {
        throw "prepare not implemented";
    }    


    /**
     * Notifies the renderer that the state has been changed and it should redraw itself
     * @param {*} state 
     */
    update(state) {
        throw "update not implemented";
    }


    /**
     * For cleaning up resources when the canvas manager is deleted
     */
    close() {
        console.log("RenderManager closed")
    }

}

