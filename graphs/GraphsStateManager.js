import { Graph } from "./Graphs.js";
import { ViewportStateManager } from "../js/canvas/ViewportStateManager.js";

export { Graph };

export class GraphsStateManager extends ViewportStateManager {
    /** 
     * @param {Graph} graph
     */
    constructor(graph) {
        super();
        this.graph = graph;

        this.mouse = null;
        this.click = null;

        this.zoom = 1;
        this.selectedIndex = -1;
    }

    getNodeIndex(x, y) {
        let index = 0;
        for (let node of this.graph.nodes) {
            let dis = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (dis < 10) {
                return index;
            }
            index++;
        }
        return -1;
    }
}