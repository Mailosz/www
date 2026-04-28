import { CanvasManager } from "../js/canvas/CanvasManager.js";
import { PopupMenu } from "../js/ui/PopupMenu.js";
import { ViewportInputManager } from "../js/canvas/ViewportInputManager.js";
import { Manipulation } from "../js/canvas/InputManager.js";

export class GraphsInputManager extends ViewportInputManager {


    constructor() {
        super();
        /** @type {CanvasManager} */
        this.cm = null;
    }


    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     * @param {GraphsStateManager} state
     */
    click(pointer, state) {

        let sel = state.getNodeIndex(pointer.pressX, pointer.pressY);

        if (sel >= 0 && state.selectedIndex >= 0 && state.selectedIndex != sel) {
            //TODO: check if node exists and add or delete
            let n1 = state.graph.nodes[state.selectedIndex];
            let n2 = state.graph.nodes[sel];

            let add = true;
            let index = 0;
            for (let edge of state.graph.edges) {
                if (edge.n1 == n1 && edge.n2 == n2 || edge.n1 == n2 && edge.n2 == n1) {

                    state.graph.removeEdge(index)

                    add = false;
                    break;
                }
                index++;
            }

            if (add) {
                state.graph.createEdge(n1, n2);
            }

        }

        state.selectedIndex = sel;
        if (sel >= 0) {
            console.log(state.graph.nodes[sel].id);
        }

        this.cm.redraw();
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     * @param {GraphsStateManager} state
     */
    doubleClick(pointer, state) {

        if (state.selectedIndex >= 0) {

            state.graph.nodes.splice(state.selectedIndex, 1);
            state.selectedIndex = -1;
        } else {
            state.graph.createNode(pointer.pressX, pointer.pressY);
            state.selectedIndex = state.graph.nodes.length - 1;
        }
        this.cm.redraw();
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     * @param {GraphsStateManager} state
     */
    alternativeClick(pointer, state) {
        state.selectedIndex = -1;
        this.cm.redraw();

    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     * @param {GraphsStateManager} state
     */;
    hover(pointer, state) {
        state.mouse = {x: pointer.x, y: pointer.y};
        this.cm.redraw();
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @param {GraphsStateManager} state
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer, state) {
        
        let drawing = this.cm.drawing;
        
        state.selectedIndex = state.getNodeIndex(pointer.pressX, pointer.pressY);

        if (state.selectedIndex >= 0) {
            return new NodeMoveManipulation(this.cm, state.graph, state.selectedIndex);
        }

        return super.beginManipulation(pointer, state);
    }

}

export class NodeMoveManipulation extends Manipulation {
    
    /**
     * 
     * @param {CanvasManager} canvas 
     * @param {Graph} graph
     * @param {Number} index 
     */
    constructor(canvas, graph, index) {
        super(canvas);
        this.index = index;

        this.startX = graph.nodes[index].x;
        this.startY = graph.nodes[index].y;
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(data, state) {
        if (this.index !== null) {
            let selNode = state.graph.nodes[state.selectedIndex]; 
            selNode.x = this.startX + data.lastX - data.pressX;
            selNode.y = this.startY + data.lastY - data.pressY;
        }
        this.cm.redraw();
    }
    
    complete(state) {
        state.selectedIndex = -1;
    }

    cancel(state) {
        if (this.index !== null) {
            let selNode = this.nodes[state.selectedIndex]; 
            selNode.x = this.startX;
            selNode.y = this.startY;
        }
        this.cm.redraw();
    }
}