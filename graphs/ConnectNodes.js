import {Graph} from "./Graphs.js";

function removeAllEdges(graph) {
    for (let node of graph.nodes) {
        node.edges = [];
    }

    graph.edges = [];
}


/**
 * Modifies the graph by connecting all nodes to their nearest neighbors
 * @param {Graph} graph 
 * @returns 
 */
export function connectAllNodes(graph) {
    if (graph.nodes.length < 2) return;
    removeAllEdges(graph);

    let node = graph.nodes[0];
    let queue = [];
    let nearest = findNearestNode(node, graph.nodes);

    let nedge = graph.createEdge(node, nearest);

    queue.push({a: node, b: nearest, edge: nedge});
    queue.push({a: nearest, b: node, edge: nedge});

    while (queue.length > 0) {
        let edge = queue.shift();
    
        let found = findNearestNodeOfEdge(graph.nodes, edge);

        if (found.node != null) {

            let leftEdge = edge.a.edges.find((e) => e.n1 == found.node || e.n2 == found.node);
            if (leftEdge) {

                if (leftEdge.final) { // this edge is final, do not add any new
                    continue;
                }

                // 
                let index = queue.findIndex((e) => (e.a == edge.a || e.b == edge.a) && (e.a == found.node || e.b == found.node));

                if (index >= 0) {
                    let contestedEdge = queue.splice(index, 1)[0];

                    let contestedFound = findNearestNodeOfEdge(graph.nodes, contestedEdge);

                    if (contestedFound.node == edge.b) {
                        let nedge = graph.createEdge(found.node, edge.b);
                        queue.push({a: found.node, b: edge.b, edge: nedge});

                        edge.edge.final = true;
                        contestedEdge.edge.final = true;
                    } else if (contestedFound.distance < found.distance) {
                        queue.unshift(contestedEdge);
                    } else {
                        leftEdge.final = true;
                    }
                } else {
                    let nedge = graph.createEdge(found.node, edge.b);
                    queue.push({a: found.node, b: edge.b, edge: nedge});

                    edge.edge.final = true;
                    leftEdge.final = true;
                }
                
            } else {
                let rightEdge = edge.b.edges.find((e) => e.n1 == found.node || e.n2 == found.node);
                if (rightEdge) {
                    if (rightEdge.final) { // this edge is final, do not add any new
                        continue;
                    }
                    // 
                    let index = queue.findIndex((e) => (e.a == edge.b || e.b == edge.b) && (e.a == found.node || e.b == found.node));
                    if (index >= 0) {
                        let contestedEdge = queue.splice(index, 1)[0];

                        let contestedFound = findNearestNodeOfEdge(graph.nodes, contestedEdge);

                        if (contestedFound.node == edge.a) {
                            let nedge = graph.createEdge(edge.a, found.node);
                            queue.push({a: edge.a, b: found.node, edge: nedge});

                            edge.edge.final = true;
                            contestedEdge.edge.final = true;
                        } else if (contestedFound.distance < found.distance) {
                            queue.unshift(contestedEdge);
                        } else {
                            rightEdge.final = true;
                        }
                    } 
                    else {
                        let nedge = graph.createEdge(edge.a, found.node);
                        queue.push({a: edge.a, b: found.node, edge: nedge});

                        edge.edge.final = true;
                        rightEdge.final = true;
                    }
                } else {
                    //right = true;
                    let nedge1 = graph.createEdge(edge.a, found.node);
                    queue.push({a: edge.a, b: found.node, edge: nedge1});

                    let nedge2 = graph.createEdge(found.node, edge.b);
                    queue.push({a: found.node, b: edge.b, edge: nedge2});

                    edge.edge.final = true;
                }
            }
        }
    }
}

function findNearestNodeOfEdge(nodes, edge) {
    let found = null;
    let dis = Number.POSITIVE_INFINITY;

    let point = {x: (edge.a.x + edge.b.x) / 2, y: (edge.a.y + edge.b.y) / 2};

    for (let node of nodes) {
        if (node == edge.a || node == edge.b) continue;

        let d = Math.sqrt(Math.pow(node.x - point.x, 2) + Math.pow(node.y - point.y, 2));

        if (d < dis) {
            // check if node is on good side of a line
            if ((edge.b.x - edge.a.x)*(node.y - edge.a.y) - (edge.b.y - edge.a.y)*(node.x - edge.a.x) > 0) {
                found = node;
                dis = d;
            } else {
                // wrong side of the line
                continue;
            }
        }
    }
    return {node: found, distance: dis};
}

function findNearestNode(node, nodes) {

    let found = null;
    let dis = Number.POSITIVE_INFINITY;

    for (let n of nodes) {
        if (n == node) continue;

        let d = Math.sqrt(Math.pow(n.x - node.x, 2) + Math.pow(n.y - node.y, 2));

        if (d < dis) {
            found = n;
            dis = d;
        }
    }

    return found;
}