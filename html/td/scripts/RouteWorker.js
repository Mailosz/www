function computeDistances(data) {

    let cell = {x: data.treasure.x, y: data.treasure.y, dis: 0};

    for (let x = 0; x < data.w; x++) {
        for (let y = 0; y < data.h; y++) {
            data.grid[x * data.h + y].computed = 9999999;
        }
    }

    //honeypot
    data.grid[data.treasure.x * data.h + data.treasure.y].computed = 0;

    let frontier = [];

    let dis = 1;

    if (cell.x > 0) {
        frontier.push({x: cell.x - 1, y : cell.y, dis: dis});
        // if (cell.y > 0) {
        //     frontier.push({x: cell.x - 1, y : cell.y - 1, dis: dis});
        // }
        // if (cell.y + 1 < data.h) {
        //     frontier.push({x: cell.x - 1, y : cell.y + 1, dis: dis});
        // }
    }
    if (cell.x + 1 < data.w) {
        frontier.push({x: cell.x + 1, y : cell.y, dis: dis});
        // if (cell.y > 0) {
        //     frontier.push({x: cell.x + 1, y : cell.y - 1, dis: dis});
        // }
        // if (cell.y + 1 < data.h) {
        //     frontier.push({x: cell.x + 1, y : cell.y + 1, dis: dis});
        // }
    }
    if (cell.y > 0) {
        frontier.push({x: cell.x, y : cell.y - 1, dis: dis});
    }
    if (cell.y + 1 < data.h) {
        frontier.push({x: cell.x, y : cell.y + 1, dis: dis});
    }


    while (frontier.length > 0) {
        computeCell(data, frontier);
    }
}


self.onmessage = function handleMessageFromMain(msg) {
    let data = msg.data;

    computeDistances(data);

    self.postMessage(data);
}

