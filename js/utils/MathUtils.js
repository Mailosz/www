/** @typedef {{x: number, y: number}} Point */

export class MathUtils {

    /**
     * Computes distance between two points
     * @param {*} a 
     * @param {*} b 
     * @returns 
     */
    static pointsDistance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y));
    }

    /**
     * Returns distance from a point to the line defined by two points A nad B. 
     * The distance is signed which indicates which side of a line a point is on. 
     * Value above zero indicates point on the right side of line as looking from point A to B.
     * @param {Point} p 
     * @param {Point} a 
     * @param {Point} b 
     */
    static pointDistanceToLine(p, a, b) {
        return (b.x - a.x)*(p.y - a.y) - (b.y - a.y)*(p.x - a.x)
    }



}