import { CanvasManager } from "../canvas/CanvasManager.js";
import { ContextMenu } from "./../ui/ContextMenu.js";
import { InputManager, Manipulation } from "../canvas/InputManager.js";
import { Node, Edge } from "./GraphiesDrawingManager.js";

export class GraphiesInputManager extends InputManager {


    constructor() {
        super();
        this.interaction = null;
        /** @type {CanvasManager} */
        this.canvas = null;
    }

    /**
     * Canvas manager sets itself as context once the InputManager is set
     * @param {CanvasManager} canvasManager 
     */
    setCanvasManager(canvasManager) {
        this.canvas = canvasManager;
    }

    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     */
    click(pointer) {

        let sel = this.#getNode(pointer.pressX, pointer.pressY);

        if (sel >= 0 && this.canvas.drawing.selectedIndex >= 0 && this.canvas.drawing.selectedIndex != sel) {
            //TODO: check if node exists and add or delete
            let n1 = this.canvas.drawing.nodes[this.canvas.drawing.selectedIndex];
            let n2 = this.canvas.drawing.nodes[sel];

            let add = true;
            let index = 0;
            for (let edge of this.canvas.drawing.edges) {
                if (edge.n1 == n1 && edge.n2 == n2 || edge.n1 == n2 && edge.n2 == n1) {

                    this.canvas.drawing.edges.splice(index, 1);
                    edge.remove();

                    add = false;
                    break;
                }
                index++;
            }

            if (add) {
                this.canvas.drawing.edges.push(new Edge(n1, n2));
            }

        }

        this.canvas.drawing.selectedIndex = sel;

        this.canvas.redraw();
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     */
    doubleClick(pointer) {

        if (this.canvas.drawing.selectedIndex >= 0) {

            this.canvas.drawing.nodes.splice(this.canvas.drawing.selectedIndex, 1);
            this.canvas.drawing.selectedIndex = -1;
        } else {
            this.canvas.drawing.nodes.push(new Node(pointer.pressX, pointer.pressY));
            this.canvas.drawing.selectedIndex = this.canvas.drawing.nodes.length - 1;
        }
        this.canvas.redraw();
    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer) {
        this.canvas.drawing.selectedIndex = -1;
        this.canvas.redraw();

    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer) {
        this.canvas.drawing.mouse = {x: pointer.x, y: pointer.y};
        this.canvas.redraw();
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer) {
        
        let drawing = this.canvas.drawing;
        
        this.canvas.drawing.selectedIndex = this.#getNode(pointer.pressX, pointer.pressY);

        if (drawing.selectedIndex >= 0) {
            return new MoveManipulation(this.canvas, drawing.selectedIndex);
        }

        return null;
    }

    #getNode(x, y) {
        let index = 0;
        for (let node of this.canvas.drawing.nodes) {
            let dis = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (dis < 10) {
                return index;
            }
            index++;
        }
        return -1;
    }


}

export class MoveManipulation extends Manipulation {
    
    /**
     * 
     * @param {CanvasManager} canvas 
     * @param {Number} index 
     */
    constructor(canvas, index) {
        super(canvas);
        this.index = index;

        this.startX = canvas.drawing.nodes[index].x;
        this.startY = canvas.drawing.nodes[index].y;
    }

    /**
     * 
     * @param {GestureData} data 
     */
    update(data) {
        if (this.index !== null) {
            let selNode = this.canvas.drawing.nodes[this.canvas.drawing.selectedIndex]; 
            selNode.x = this.startX + data.lastX - data.pressX;
            selNode.y = this.startY + data.lastY - data.pressY;
        }
        this.canvas.redraw();
    }
    
    complete() {
        this.canvas.drawing.selectedIndex = -1;
    }

    cancel() {
        if (this.index !== null) {
            let selNode = this.nodes[this.canvas.drawing.selectedIndex]; 
            selNode.x = this.startX;
            selNode.y = this.startY;
        }
        this.canvas.redraw();
    }
}