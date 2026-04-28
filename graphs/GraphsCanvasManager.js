import { Graph} from "./Graphs.js";
import { CanvasManager } from "../js/canvas/CanvasManager.js";
import { GraphsDrawingManager } from "./GraphsDrawingManager.js";
import { GraphsInputManager } from "./GraphsInputManager.js";
import { GraphsStateManager } from "./GraphsStateManager.js";

export { Graph };

export class GraphsCanvasManager extends CanvasManager {
    /** 
     * @param {HTMLCanvasElement} canvasElement
     * @param {Graph} graph
     * @param {Object} settings
     */
    constructor(canvasElement, graph, settings) {
        super(canvasElement, settings);
        this.setRenderManager(new GraphsDrawingManager());
        this.setInputManager(new GraphsInputManager());
        this.setStateManager(new GraphsStateManager(graph));
    }

    getState() {
        return this.stateManager;
    }
}