import { UserChange } from "../../../../js/canvas/UserChange.js"; 
import { Segment } from "../data/Paths.js";

export class PathChange extends UserChange {

    /**
     * 
     * @param {PathChangeData} changeData 
     */
    constructor(changeData) {
        super();

        thish.changeData = changeData;
    }

    commit() {

    }

    undo() {
        
    }
}

class PathChangeData {
    path = null;
    /** @type {ShapeChangeData[]} */
    shapeChanges = [];
}

class ShapeChangeData {
    shapeIndex = null;
    /** @type {SegmentChangeData[]} */
    segmentChanges = [];
}

class SegmentChangeData {
    startIndex = 0;
    deleteCount = 0;
    /** @type {Segment} */
    insertList = [];
}