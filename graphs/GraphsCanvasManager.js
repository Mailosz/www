import { Graph} from "./Graphs.js";
import { CanvasManager } from "../js/canvas/CanvasManager.js";
import { GraphsDrawingManager } from "./GraphsDrawingManager.js";

export { Graph };

export class GraphsCanvasManager extends CanvasManager {
    /** 
     * @param {HTMLCanvasElement} canvasElement
     * @param {DrawingManager} drawing
     * @param {Graph} drawing
     */
    constructor(canvasElement, graph) {
        super(canvasElement, new GraphsDrawingManager());
        this.graph = graph;
    }
}