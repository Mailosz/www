export class ViewportStateManager {


    constructor(cm) {
        this.viewport = { x: 0, y: 0, w: 100, h: 100 };
        this.zoom = 1;
        this.minzoom = 0.0001;
        this.maxzoom = 100000;
        this.cm = cm;
    }

    /**
     * Canvas manager sets itself as context once the RenderManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvas) {
        this.cm = canvas;
    }

    resize(w, h) {
        this.updateViewport(this.viewport.x, this.viewport.y, this.zoom);
    }


    redraw() {
        this.cm.redraw();
    }

    /**
     * Zooms the viewport by a given factor around a specified origin point.
     * @param {*} factor 
     * @param {x:Number, y:Number} origin 
     */
    zoomBy(factor, origin) {
        const screenX = (origin.x - this.viewport.x);
        const screenY = (origin.y - this.viewport.y);

        let oldzoom = this.zoom;
        this.zoom = Math.max(this.minzoom, Math.min(this.zoom * factor, this.maxzoom));
        const realFactor = oldzoom / this.zoom;

        const scrollX = this.viewport.x - (screenX) * (realFactor - 1);
        const scrollY = this.viewport.y - (screenY) * (realFactor - 1);

        this.updateViewport(scrollX, scrollY, this.zoom);

        console.log("zoom: " + this.zoom * 100 + "%");
    }

    updateViewport(x, y, zoom) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.w = this.cm.width / zoom;
        this.viewport.h = this.cm.height / zoom;
    }


    scrollBy(x, y) {
        this.updateViewport(this.viewport.x + x, this.viewport.y + y, this.zoom);
    }

    /**
     * Gets the pointer position from normalized screen coordinates (0,1)
     * @param {number} screenX normalized position on screen (0,1)
     * @param {number} screenY normalized position on screen (0,1)
     * @returns {[number, number]} pointer position in viewport coordinates
     */
    getPointerPosition(screenX, screenY) {
        const x = this.viewport.x + (screenX * (this.viewport.w));
        const y = this.viewport.y + (screenY * (this.viewport.h));
        return [x, y];
    }

}