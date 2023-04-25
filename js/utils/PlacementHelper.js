/**
 * @typedef {{x: number, y: number, w: number, h: number}} Rectangle
 * @typedef {{x: number, y: number}} Point
 * @typedef {{w: number, h: number}} Size
 * @typedef {string|{horizontal: string, vertical: string}} PlacementOpts 
 */

export class PlacementHelper {
    /**
     * Computes the position relatve to the element
     * @param {HTMLElement|Size} element - An element to be placed  or its dimensions
     * @param {HTMLElement|Point} anchor - An object or rectangle to place popup relative to
     * @param {PlacementOpts} placement - "horizontal vertical" placement values
     * - Horizontal values:
     * - left - left edge of the anchor, inside
     * - leftOut - left edge of the anchor, outside
     * - leftMid - left edge of the anchor, centered
     * - leftIn - left edge of the anchor, inside
     * - center - center of the anchor element
     * - right - right edge of the anchor, outside
     * - rightOut - right edge of the anchor, outside
     * - rightMid - right edge of the anchor, centered
     * - rightIn - right edge of the anchor, inside
     * - Vertical values:
     * - top - top edge of the anchor, inside
     * - topOut - top edge of the anchor, outside
     * - topMid - top edge of the anchor, centered
     * - topIn - top edge of the anchor, inside
     * - center - center of the anchor element
     * - bottom - bottom edge of the anchor, outside
     * - bottomOut - bottom edge of the anchor, outside
     * - bottomMid - bottom edge of the anchor, centered
     * - bottomIn - bottom edge of the anchor, inside
     * @param {HTMLElement} box - Container in which placemnt takes place
     * @param {HTMLElement|Point} options.relativeTo - Element or point to which compute the raltive placement
     * @param {Object} options.keepInside - An area to which constrain computed placement (a true value constrains to the document size)
     * 
     * @returns {Point} Computed position of an element
     */
    static computePosition(element, anchor, placement, options) {

        // read placement string
        let horizontalPlacement = "center";
        let verticalPlacement = "center";

        if (placement != null) {
            if (Object.prototype.toString.call(placement) === "[object String]") {
                let args = placement.split(" ");
                if (args.length == 1) {
                    horizontalPlacement = args[0];
                    verticalPlacement = args[0];
                } else if (args.length == 2) {
                    horizontalPlacement = args[0];
                    verticalPlacement = args[1];
                } else {
                    throw "Too many placement args";
                }
            } else {
                horizontalPlacement = placement.horizontal;
                verticalPlacement = placement.vertical;
            }
        }



        // read anchor
        let anchorX, anchorY, anchorW, anchorH;
        if (anchor instanceof HTMLElement) {

            let rect = anchor.getBoundingClientRect();

            anchorX = rect.x;
            anchorY = rect.y;
            anchorW = rect.width;
            anchorH = rect.height;
        } else if (anchor != null) {
            anchorX = anchor.x;
            anchorY = anchor.y;
            anchorW = anchor.w ? anchor.w : 0;
            anchorH = anchor.h ? anchor.w : 0;
        } else { // anchor == null means we are placing relativeTo a window
            anchorX = 0;
            anchorY = 0;
            anchorW = window.innerWidth;
            anchorH = window.innerHeight;
        }

        let boundingBox = null;
        //reading options
        if (options != null) {
            let relativeX = 0;
            let relativeY = 0;
            let relW = 0;
            let relH = 0;
            if (options.relativeTo) {
                if (options.relativeTo instanceof HTMLElement) {
                    let rect = options.relativeTo.getBoundingClientRect();

                    relW = rect.width;
                    relH = rect.height;

                    relativeX = rect.x;
                    relativeY = rect.y;
                } else {
                    relativeX = options.relativeTo.x;
                    relativeY = options.relativeTo.y;
                }
                anchorX -= relativeX;
                anchorY -= relativeY;
            }
            if (options.keepInside) {
                if (options.keepInside === true) {
                    boundingBox = {x: -relativeX, y: -relativeX, w: document.body.offsetWidth+relativeX, h: document.body.offsetHeight+relativeX};
                } else if (options.keepInside == options.relativeTo) { // avoid recomputing
                    boundingBox = {
                        x: 0,
                        y: 0,
                        w: relW,
                        h: relH
                    }
                } else if (options.keepInside instanceof HTMLElement) {
                    let rect = options.keepInside.getBoundingClientRect();

                    boundingBox = {
                        x: rect.x - relativeX,
                        y: rect.y - relativeY,
                        w: rect.width,
                        h: rect.height
                    }
                } else {
                    boundingBox = options.keepInside;
                }
            }
        }

        let computePosition = (elWidth, elHeight) => {
            let x;
            switch (horizontalPlacement) {
                case "leftOut":
                    x = anchorX - elWidth;
                    break;
                case "left":
                case "leftIn":
                    x = anchorX;
                    break;
                case "leftMid":
                    x = anchorX - (elWidth * 0.5);
                    break;
                case "center":
                    x = anchorX + (anchorW * 0.5) - (elWidth * 0.5);
                    break;
                case "right":
                case "rightOut":
                    x = anchorX + anchorW;
                    break;
                case "rightIn":
                    x = anchorX + anchorW - elWidth;
                    break;
                case "rightMid":
                    x = anchorX + anchorW - (elWidth * 0.5);
                    break;
                default:
                    throw "Unknown placement type: " + horizontalPlacement;
            }

            let y;
            switch (verticalPlacement) {
                case "topOut":
                    y = anchorY - elHeight;
                    break;
                case "top":
                case "topIn":
                    y = anchorY;
                    break;
                case "topMid":
                    y = anchorY - (elHeight * 0.5);
                    break;
                case "center":
                    y = anchorY + (anchorH * 0.5) - (elHeight * 0.5);
                    break;
                case "bottom":
                case "bottomOut":
                    y = anchorY + anchorH;
                    break;
                case "bottomIn":
                    y = anchorY + anchorH - elHeight;
                    break;
                case "bottomMid":
                    y = anchorY + anchorH - (elHeight * 0.5);
                    break;
                default:
                    throw "Unknown placement type: " + verticalPlacement;
            }

            if (boundingBox != null) {
                x = Math.min(Math.max(x, boundingBox.x), boundingBox.x + boundingBox.w - elWidth);
                y = Math.min(Math.max(y, boundingBox.y), boundingBox.y + boundingBox.h - elHeight);
            }

            return {x: x, y: y};
        }


        //read element 
        if (element instanceof HTMLElement) {
            let elWidth = element.offsetWidth;
            let elHeight = element.offsetHeight;

            let pos = computePosition(elWidth, elHeight);

            return pos;
        } else {
            let elWidth = element.w;
            let elHeight = element.h;

            let pos = computePosition(elWidth, elHeight);

            return pos;
        }


    }

    /**
     * Computes position using PlacementHelper.computePosition and places element accordingly
     * @param {*} element 
     * @param {*} anchor 
     * @param {*} placement 
     * @param {*} options 
     * 
     * @returns {Point} - Computed position of an element
     */
    static placeElement(element, anchor, placement, options) {

        let pos = PlacementHelper.computePosition(element, anchor, placement, options);

        //read element 
        if (element instanceof HTMLElement) {
            element.style.left = pos.x + "px";
            element.style.top = pos.y + "px";
        } 

        return pos;
    }
}