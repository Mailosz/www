import { CanvasManager } from "../js/canvas/CanvasManager.js";
import { PopupMenu } from "../js/ui/PopupMenu.js";
import { InputManager, Manipulation } from "../js/canvas/InputManager.js";

export class GraphsInputManager extends InputManager {


    constructor() {
        super();
        this.interaction = null;
        /** @type {CanvasManager} */
        this.cm = null;
    }

    /**
     * Canvas manager sets itself as context once the InputManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvasManager) {
        this.cm = canvasManager;
    }

    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     */
    click(pointer) {

        let sel = this.#getNode(pointer.pressX, pointer.pressY);

        if (sel >= 0 && this.cm.drawing.selectedIndex >= 0 && this.cm.drawing.selectedIndex != sel) {
            //TODO: check if node exists and add or delete
            let n1 = this.cm.graph.nodes[this.cm.drawing.selectedIndex];
            let n2 = this.cm.graph.nodes[sel];

            let add = true;
            let index = 0;
            for (let edge of this.cm.graph.edges) {
                if (edge.n1 == n1 && edge.n2 == n2 || edge.n1 == n2 && edge.n2 == n1) {

                    this.cm.graph.removeEdge(index)

                    add = false;
                    break;
                }
                index++;
            }

            if (add) {
                this.cm.graph.createEdge(n1, n2);
            }

        }

        this.cm.drawing.selectedIndex = sel;
        if (sel >= 0) {
            console.log(this.cm.graph.nodes[sel].id);
        }

        this.cm.redraw();
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     */
    doubleClick(pointer) {

        if (this.cm.drawing.selectedIndex >= 0) {

            this.cm.graph.nodes.splice(this.cm.drawing.selectedIndex, 1);
            this.cm.drawing.selectedIndex = -1;
        } else {
            this.cm.graph.createNode(pointer.pressX, pointer.pressY);
            this.cm.drawing.selectedIndex = this.cm.graph.nodes.length - 1;
        }
        this.cm.redraw();
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer) {
        this.cm.drawing.selectedIndex = -1;
        this.cm.redraw();

    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer) {
        this.cm.drawing.mouse = {x: pointer.x, y: pointer.y};
        this.cm.redraw();
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer) {
        
        let drawing = this.cm.drawing;
        
        this.cm.drawing.selectedIndex = this.#getNode(pointer.pressX, pointer.pressY);

        if (drawing.selectedIndex >= 0) {
            return new NodeMoveManipulation(this.cm, drawing.selectedIndex);
        }

        return null;
    }

    #getNode(x, y) {
        let index = 0;
        for (let node of this.cm.graph.nodes) {
            let dis = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (dis < 10) {
                return index;
            }
            index++;
        }
        return -1;
    }


}

export class NodeMoveManipulation extends Manipulation {
    
    /**
     * 
     * @param {CanvasManager} canvas 
     * @param {Number} index 
     */
    constructor(canvas, index) {
        super(canvas);
        this.index = index;

        this.startX = canvas.graph.nodes[index].x;
        this.startY = canvas.graph.nodes[index].y;
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(data) {
        if (this.index !== null) {
            let selNode = this.cm.graph.nodes[this.cm.drawing.selectedIndex]; 
            selNode.x = this.startX + data.lastX - data.pressX;
            selNode.y = this.startY + data.lastY - data.pressY;
        }
        this.cm.redraw();
    }
    
    complete() {
        this.cm.drawing.selectedIndex = -1;
    }

    cancel() {
        if (this.index !== null) {
            let selNode = this.nodes[this.cm.drawing.selectedIndex]; 
            selNode.x = this.startX;
            selNode.y = this.startY;
        }
        this.cm.redraw();
    }
}