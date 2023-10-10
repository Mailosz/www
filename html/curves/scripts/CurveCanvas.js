import {CanvasManager} from "../../../js/canvas/CanvasManager.js";
import { CurveDrawingManager } from "./CurveDrawingManager.js";
import { CurveInputManager } from "./CurveInputManager.js";
import { CurvesData as CurveData } from "./CurvesData.js";

export class CurveCanvas extends CanvasManager {

    constructor(canvas) {
        super(canvas);

        this.data = new CurveData();
        let drawingManager = new CurveDrawingManager(this.data);
        let inputManager = new CurveInputManager(this.data);

        this.setInputManager(inputManager);
        this.setDrawingManager(drawingManager);
    }
}