//draw

import { DrawingManager } from "../canvas/DrawingManager.js";


export class GraphiesDrawingManager extends DrawingManager {

    constructor (width, height) {
        super(width, height);

        this.nodes = [];
        this.edges = [];

        this.width = width;
        this.height = height;

        this.mouse = null;
        this.click = null;

        this.zoom = 1;
        this.selectedIndex = -1;

        this.prepare();
    }

    prepare() {
        this.nodes = [];
        this.edges = [];
        for (let a = 0; a < 10; a++) {
            let x = Math.random() * this.width;
            let y = Math.random() * this.height;

            this.nodes.push(new Node(x,y));

            for (let b = a % 4; b < a; b+= 2+a%3) {
                this.edges.push(new Edge(this.nodes[b], this.nodes[a]));
            }
        }
    }

    zoomBy(factor, origin) {
        this.zoom = Math.max(0.0001,Math.min(this.zoom * factor, 10000));
        console.log("zoom: " + this.zoom * 100 + "%");
    }

    /** 
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds) {
        ds.clearRect(0, 0, ds.canvas.width, ds.canvas.height);

        ds.tra

        ds.strokeStyle = "black";
        ds.beginPath();
        for (let edge of this.edges) {
            ds.moveTo(edge.n1.x, edge.n1.y);
            ds.lineTo(edge.n2.x, edge.n2.y);
        }
        //ds.closePath();
        ds.stroke();

        
        let index = 0;
        for (let node of this.nodes) {
            ds.beginPath();
            ds.ellipse(node.x, node.y, 10, 10, 0, 0, 2*Math.PI, false);

            if (this.selectedIndex === index) {
                ds.fillStyle = "red";
            } else {
                ds.fillStyle = "blue";
            }
            ds.fill();
            ds.stroke();
            index++;
        }

        if (this.click != null) {
            ds.beginPath();
            ds.fillStyle = "violet";
            ds.ellipse(this.click.x, this.click.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (this.dbClick != null) {
            ds.beginPath();
            ds.fillStyle = "lime";
            ds.ellipse(this.dbClick.x, this.dbClick.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (this.altClick != null) {
            ds.beginPath();
            ds.fillStyle = "cyan";
            ds.ellipse(this.altClick.x, this.altClick.y, 7, 7, 0, 0, 2*Math.PI, false);
            ds.fill();
        }

        if (this.mouse != null) {
            ds.beginPath();
            ds.fillStyle = "green";
            ds.ellipse(this.mouse.x, this.mouse.y, 5, 5, 0, 0, 2*Math.PI, false);
            ds.fill();
        }
    }
}

export class Node {
    x;
    y;
    /** 
     * @type {Node[]}
     */
    edges;
    constructor(x,y) {
        this.x = x;
        this.y = y;

        this.edges = [];
    }
}

export class Edge {
    /** 
     * @param {Node} n1
     * @param {Node} n2
     */
    constructor (n1, n2) {
        this.n1 = n1;
        this.n2 = n2;

        this.n1.edges.push(this);
        this.n2.edges.push(this);
    }

    remove() {
        this.n1.edges.splice(this.n1.edges.findIndex((e) => e === this));
        this.n2.edges.splice(this.n2.edges.findIndex((e) => e === this));
    }
}