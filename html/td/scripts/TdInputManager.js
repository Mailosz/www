import { InputManager, Manipulation } from "../../../js/canvas/InputManager.js";
import { PointerData, GestureData } from "../../../js/canvas/InputManager.js";
import { GenericUserAction } from "../../../js/canvas/UserAction.js";

export class TdInputManager extends InputManager {

    /**
     * 
     * @param {CurvesData} data 
     */
    constructor(data) {
        super();
        this.data = data;

        this.keyboardActions.push(new GenericUserAction("KeyW", "Build wall", "", (cm) => {
            for (let sel of this.cm.data.selected) {
                if (sel.cell.structure == null) {
                    sel.cell.structure = {
                        x: sel.x,
                        y: sel.y,
                        type: "wall"
                    } 
                }
            }
        }));

        this.keyboardActions.push(new GenericUserAction("KeyT", "Build tower", "", (cm) => {
            for (let sel of this.cm.data.selected) {
                if (sel.cell.structure == null) {
                    sel.cell.structure = {
                        x: sel.x,
                        y: sel.y,
                        direction: 0,
                        wait: 10,
                        type: "tower"
                    } 
                }
            }
        }));

        this.keyboardActions.push(new GenericUserAction("Delete", "Build Destroy", "", (cm) => {
            for (let sel of this.cm.data.selected) {
                if (sel.cell.structure != null && sel.cell.structure.type != "treasure") {
                    sel.cell.structure = null;
                }
            }
        }));
    }



    /**
     * Single click action (pointer pressed and quickly released without moving)
     * @param {PointerData} pointer 
     */
    click(pointer) {

        //TODO: check for CTRL
        this.cm.data.selected = [];

        let x = pointer.x - this.cm.data.transform.e;
        let y = pointer.y - this.cm.data.transform.f;

        x = Math.floor(x / 32);
        y = Math.floor(y / 32);

        let num = x * this.cm.data.w + y;
        if (num >= 0 && num < this.cm.data.w * this.cm.data.h) {
            
            let cell = this.cm.data.grid[num];
            this.cm.data.selected.push({x: x, y: y, cell: cell});

            // if (cell.structure == null) {
            //     cell.structure = {
            //         x: x,
            //         y: y,
            //         type: "wall"
            //     } 
            // } else if (cell.structure.type == "wall") {
            //     cell.structure = null;
            // }
        }
    }

    /**
     * Double click action (pointer clicked twice quickly)
     * @param {PointerData} pointer 
     */
    doubleClick(pointer) {

    }

    /**
     * Alternative click action (e.g. right mouse button)
     * @param {PointerData} pointer 
     */
    alternativeClick(pointer) {
        
    }

    /**
     * Pointer moved over canvas without contact (e.g. mouse hover)
     * @param {PointerData} data 
     */;
    hover(pointer) {
        
    }

    /**
     * Pointer pressed and moved - manipulation starts
     * @param {PointerData} pointer 
     * @returns {Manipulation} A manipulation object that manages further inputs or null.
     */
    beginManipulation(pointer) {
        return new PanManipulation(pointer);
    }

    

}

class PanManipulation extends Manipulation {


    /**
     * Occurs everytime a user moves pointer over the canvas
     * @param {GestureData} data 
     */
    update(data) {
        this.cm.data.transform.e += data.x - data.lastX;
        this.cm.data.transform.f += data.y - data.lastY;
    }

    complete() {

    }
}

