export class Graph {
    /** @type [Node] */
    nodes = [];
    /** @type [Edge] */
    edges = [];

    idCounter = 0;

    /**
     * A graph is a collection of nodes an edges 
     * @param {*} saved Optional object to restore graph from (created by function save())
     */
    constructor(saved) {

        if (saved) {
            if (saved.version == 1) {
                let maxid = 0;
                for (let node of saved.nodes) {
                    maxid = Math.max(maxid,node.id);
                    let nnode = {id: node.id, x: node.x, y: node.y, edges: []};
                    this.nodes.push(nnode);
                }
    
                for (let edge of saved.edges) {
                    let n1 = this.nodes.find((n) => n.id == edge.a);
                    let n2 = this.nodes.find((n) => n.id == edge.b);

                    this.createEdge(n1, n2);
                }

                this.idCounter = maxid + 1;
            } else {
                console.error("Unknown version");
            }

        }
    }


    /**
     * Produces structure without cyclical references which can be saved as JSON, and from which the actual graph can be recreated
     */
    save() {
        let i = 0;
        return {
            version: 1,
            nodes: this.nodes.map((n) => ({id: n.id, x: n.x, y: n.y})),
            edges: this.edges.map((e) => ({a: e.n1.id, b: e.n2.id}))
        };
    }

    /**
     * Creates new node
     * @param {*} x 
     * @param {*} y 
     */
    createNode(x, y) {
        let node = {id: this.idCounter++, x: x, y: y, edges: []};
        this.nodes.push(node);
        return node;
    }

    /**
     * Creates new edge connecting two nodes
     * @param {*} n1
     * @param {*} n2
     */
    createEdge(n1, n2) {
        let edge = {n1: n1, n2: n2};
        this.edges.push(edge);

        n1.edges.push(edge);
        n2.edges.push(edge);

        return edge;
    }

    removeEdge(index) {
        let edge = this.edges[index];
        edge.n1.edges.splice(edge.n1.edges.findIndex((e) => e === edge));
        edge.n2.edges.splice(edge.n2.edges.findIndex((e) => e === edge));

        this.edges.splice(index, 1);
    }
}

class Node {
    id;
    x;
    y;
    /** 
     * @type {Node[]}
     */
    edges;
    constructor(x,y) {
        this.id = ++Node.num;
        this.x = x;
        this.y = y;

        this.edges = [];
    }

    static num = 0;
}

class Edge {
    /** 
     * @param {Node} n1
     * @param {Node} n2
     */
    constructor (n1, n2) {
        this.n1 = n1;
        this.n2 = n2;
        this.final = false;

        this.n1.edges.push(this);
        this.n2.edges.push(this);
    }

    remove() {
        this.n1.edges.splice(this.n1.edges.findIndex((e) => e === this));
        this.n2.edges.splice(this.n2.edges.findIndex((e) => e === this));
    }
}