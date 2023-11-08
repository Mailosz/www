
class Cell {

    constructor(x,y) {

        this.x = x;
        this.y = y;

        this.computed = 99999;
        this.distance = 0;
        this.danger;

        this.units = [];
        this.bullets = [];
        this.structure = null;

        this.empty = true;
    }
}

export class TdData {

    constructor(w,h) {

        this.transform = new DOMMatrix([1, 0, 0, 1, 0, 0]);

        this.w = w;
        this.h = h;
        this.grid = new Array(w * h);

        this.selected = [];

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                this.grid[x * w + y] = new Cell(x,y);
            }
        }

        this.treasure = {x: 15, y: 15, type: "treasure"};
        this.grid[this.treasure.x * w + this.treasure.y].structure = this.treasure;

        this.unitCount = 0;
        this.bulletCount = 0;


        setTimeout(() => computeDistances(this), 200);

        // enemies spawning
        setInterval(()=> {
            for (let i = 0; i < 1; i++) {
            let number = Math.random() * (this.w + this.h) * 2;

            
            if (number < this.h) {
                let index = Math.floor(number);
                let unit = new Unit(0, number);
                this.grid[index].units.push(unit);    

            } else if (number < this.h * 2) {
                number -= this.h;

                let index = Math.floor(number);
                let unit = new Unit(this.w - 0.0001 , (this.h - number));
                this.grid[this.grid.length - 1 - index].units.push(unit);   

            } else if (number < this.h * 2 + this.w) {
                number -= this.h * 2;

                let index = Math.floor(number);
                let unit = new Unit(number, 0);
                this.grid[index * this.h].units.push(unit);   

            } else {
                number -= this.h * 2 + this.w;

                let index = Math.floor(number);
                let unit = new Unit(number, this.h - 0.0001);
                this.grid[index * this.h + this.w - 1].units.push(unit);   
            }

            this.unitCount++;}
            //console.log(this.unitCount);


            //this.grid[0].units.push(new Unit(0,0));
        }, 10)

        // objects move
        setInterval(() => {
            for (let x = 0; x < this.w; x++) {
                for (let y = 0; y < this.h; y++) {
                    let pos = x * this.h + y;
                    let cell = this.grid[pos];

                    for (let i = cell.units.length -1; i >= 0; i--) {

                        let unit = cell.units[i];

                        unit.x += unit.moveX;
                        unit.y += unit.moveY;

                        if (Math.floor(unit.x) != cell.x || Math.floor(unit.y) != cell.y) {
                            cell.units.splice(i,1);

                            if (unit.x >= 0 && unit.y >= 0 && unit.x < this.w && unit.y < this.h) {
                                let nc = this.grid[Math.floor(unit.x) * this.h + Math.floor(unit.y)];
                                if (nc.structure == null || nc.structure.type != "treasure") {
                                    nc.units.push(unit);
                                } else {
                                    this.unitCount--;
                                }
                            }else {
                                this.unitCount--;
                            }
                        }
                    }

                    for (let i = cell.bullets.length -1; i >= 0; i--) {

                        let bullet = cell.bullets[i];

                        bullet.x += bullet.moveX;
                        bullet.y += bullet.moveY;
                        
                        bullet.life-= bullet.speed;
                        if (bullet.life < 0) {
                            cell.bullets.splice(i,1);
                            this.bulletCount--;
                            continue;
                        } else {

                            if (Math.floor(bullet.x) != cell.x || Math.floor(bullet.y) != cell.y) {
                                cell.bullets.splice(i,1);
    
                                if (bullet.x >= 0 && bullet.y >= 0 && bullet.x < this.w && bullet.y < this.h) {
                                    let nc = this.grid[Math.floor(bullet.x) * this.h + Math.floor(bullet.y)];
                                    if (nc.structure == null || nc.structure == bullet.origin) {
                                        nc.bullets.push(bullet);
                                        continue;
                                    } else {
                                        this.bulletCount--;
                                        continue;
                                    }
                                }else {
                                    this.bulletCount--;
                                    continue;
                                }
                            }
                        }
                        // checking hits
                        for (let a = 0; a < cell.units.length; a++) {
                            let unit = cell.units[a];

                            let dis = Math.sqrt(Math.pow(bullet.x - unit.x,2) + Math.pow(bullet.y - unit.y,2));
                            if (dis < 10) {
                                cell.bullets.splice(i,1);
                                this.bulletCount--;

                                unit.life -= 10;
                                if (unit.life < 0) {
                                    cell.units.splice(a, 1);
                                    this.unitCount--;
                                }
                                break;
                            }

                        }
                    }
                }
            }
        }, 20);


        // enemy move calculation
        setInterval(()=> {
            // console.time("move");
            for (let x = 0; x < this.w; x++) {
                for (let y = 0; y < this.h; y++) {
                    let pos = x * this.h + y;
                    let cell = this.grid[pos];

                    
                    if (cell.units.length > 0) {
                        //search for target
                        let currentDistance = 99999;
                        let targets = [];

                        const check = (x,y) => {
                            let cellTarget = this.grid[x * this.h + y];

                            if (cellTarget.distance < currentDistance) {
                                currentDistance = cellTarget.distance;

                                targets = [{x: cellTarget.x, y: cellTarget.y}];

                            } else if (cellTarget.distance == currentDistance) {
                                targets.push({x: cellTarget.x, y: cellTarget.y});
                            }
                        }

                        if (cell.x > 0) {
                            check(x - 1, y);
                            if (cell.y > 0) {
                                check(x - 1, y - 1);
                            }
                            if (cell.y + 1 < this.h) {
                                check(x - 1, y + 1);
                            }
                        }
                        if (cell.x + 1 < this.w) {
                            check(x + 1, y);
                            if (cell.y > 0) {
                                check(x + 1, y - 1);
                            }
                            if (cell.y + 1 < this.h) {
                                check(x + 1, y + 1);
                            }
                        }
                        if (cell.y > 0) {
                            check(x, y - 1);
                        }
                        if (cell.y + 1 < this.h) {
                            check(x, y + 1);
                        }

                        let target;
                        if (targets.length > 1) {
                            let currentDis = 999999;
                            for (let t of targets) {
                                let dis = Math.sqrt(Math.pow(t.x - this.treasure.x,2) + Math.pow(t.y - this.treasure.y,2));

                                if (dis < currentDis) {
                                    currentDis = dis;
                                    target = t;
                                }
                            }
                        } else {
                            target = targets[0];
                        }

                        let targetX = target.x + 0.5;
                        let targetY = target.y + 0.5;

                        for (let i = cell.units.length -1; i >= 0; i--) {

                            let unit = cell.units[i];

                            unit.dX = targetX - unit.x;
                            unit.dY = targetY - unit.y;

                            let d = Math.sqrt(unit.dX * unit.dX + unit.dY * unit.dY);
                            if (d == 0) continue;
                            unit.dY /= d;
                            unit.dX /= d;

                            unit.dX *= 0.04;
                            unit.dY *= 0.04;

                            unit.moveX = (unit.moveX * 4 + unit.dX) / 5;
                            unit.moveY = (unit.moveY * 4 + unit.dY) / 5;
                        }
                    }
                }
            }
            // console.timeEnd("move")
        }, 50)


        //towers firing
        setInterval(() => {
            for (let x = 0; x < this.w; x++) {
                for (let y = 0; y < this.h; y++) {
                    let pos = x * this.h + y;
                    let cell = this.grid[pos];

                    if (cell.structure != null) {
                        if (cell.structure.type == "tower") {
                            cell.structure.wait -= 1;
                            cell.structure.direction = (cell.structure.direction + 0.05) % (Math.PI*2);
                            if (cell.structure.wait < 0) {
                                cell.structure.wait = 10;

                                let cos = Math.cos(cell.structure.direction);
                                let sin = Math.sin(cell.structure.direction);

                                let speed = 0.05;
                                cell.bullets.push({
                                    origin: cell.structure,
                                    x: x + 0.5 + cos * 0.5,
                                    y: y + 0.5 + sin * 0.5,
                                    direction: cell.structure.direction,
                                    speed: speed,
                                    moveX: cos * speed,
                                    moveY: sin * speed,
                                    life: 10
                                });
                                this.bulletCount++;
                            }
                        }
                    }
                }
            }
        }, 1);
    }



}

class Unit {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.dX = 0;
        this.dY = 0;

        this.moveX = 0;
        this.moveY = 0;

        this.life = 100;
    }
}



function computeDistances(data) {
    
    let maxloop = 100000;

    // console.time("Routes");

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

    let computePart = () => {
        let i = 0;
        while (true) {
            if (i++ > maxloop) {
                setTimeout(computePart,0);
                break;
            } else if (frontier.length > 0) {
                computeCell(data, frontier);
                continue;
            } else {
                for (let x = 0; x < data.w; x++) {
                    for (let y = 0; y < data.h; y++) {
                        let cell =data.grid[x * data.h + y];
                        cell.distance = cell.computed;
                    }
                }
                // console.timeEnd("Routes");
                setTimeout(() => computeDistances(data), 100);
                break;
            }
        }
    };
    setTimeout(computePart,0);

}

function computeCell(data, frontier) {

    let cell = frontier.shift();
    
    let cellData = data.grid[cell.x * data.h + cell.y];

    let dis = cell.dis + 1;

    if (cellData.structure != null) {
        dis += 100;
    }

    if (cellData.computed > dis) {
        cellData.computed = dis;

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
    }
}