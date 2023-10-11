import { Manipulation } from "../../../../js/canvas/InputManager.js";

export class NodeManipulation extends Manipulation {


    constructor(node, type) {
        super();
        this.type = type;
        this.
    }


    /**
     * 
     * @param {GestureData} data 
     */
    update(data) {
        
        this.point.x = data.x;
        this.point.y = data.y;

        this.cm.redraw();
    }
    
    complete() {
        this.cm.redraw();
    }

    cancel() {
        this.point.x = this.startX;
        this.point.y = this.startY;

        this.cm.redraw();
    }
}

export class NODE_MANIPULATION_TYPE {
    POSITION = 0;
    CONTROL_POINT = 1;
}