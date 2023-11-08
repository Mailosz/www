import {CanvasManager} from "../../../js/canvas/CanvasManager.js";
import { TdDrawingManager } from "./TdDrawingManager.js";
import { TdInputManager } from "./TdInputManager.js";
import { TdData } from "./TdData.js";

export class TdCanvas extends CanvasManager {

    constructor(canvas) {
        super(canvas);

        this.data = new TdData(30, 30);
        let drawingManager = new TdDrawingManager(this.data);
        let inputManager = new TdInputManager(this.data);

        this.setInputManager(inputManager);
        this.setDrawingManager(drawingManager);

        drawingManager.drawAnimation();
    }
}