import {CanvasDrawingManager} from "../../../js/canvas/test/CanvasDrawingManager.js";

export class TdDrawingManager extends CanvasDrawingManager {

    constructor(data) {
        super();
        this.data = data;

        let img = new Image();
        img.src = "./enemy.png";
        img.onload = async () => {
            console.log("loaded");
            this.enemyImg = await createImageBitmap(img);
        }

    }

    /** 
     * Drawing testing implementation - to override
     * @param {CanvasRenderingContext2D} ds
     */
    draw(ds) {

        const data = this.cm.data;

        let enemy = new Path2D();
        enemy.moveTo(-5,0);
        enemy.arc(0,0,5,0,Math.PI*2);

        // super.draw(ds);
        ds.resetTransform();
        ds.clearRect(0, 0, this.width, this.height);
        ds.setTransform(this.cm.data.transform);

        ds.fillStyle = "gray";
        
        ds.lineWidth = 1;
        ds.strokeStyle = "gray";
        ds.textAlign = "center";
        ds.font = "16px Arial";

        let startX = Math.max(0, Math.floor(0 - this.cm.data.transform.e / 32));
        let startY = Math.max(0, Math.floor(0 - this.cm.data.transform.f / 32));

        let endX = Math.min(this.cm.data.w, startX + this.width / 32);
        let endY = Math.min(this.cm.data.h, startY + this.height / 32);

        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                ds.strokeStyle = "gray";
                ds.strokeRect(x * 32, y * 32, 32, 32);

                let cell = data.grid[x * data.h + y];

                if (cell.structure != null) {
                    switch (cell.structure.type) {
                        case "treasure": 
                            ds.fillStyle = "red";
                            ds.beginPath();
                            ds.roundRect(x * 32 + 2, y * 32 + 2, 28, 28, 5);
                            ds.fill();
                            break;
                        case "wall": 
                            ds.fillStyle = "black";
                            ds.beginPath();
                            ds.roundRect(x * 32 + 2, y * 32 + 2, 28, 28, 5);
                            ds.fill();
                            break;
                        case "tower": 
                            ds.fillStyle = "lightgreen";
                            ds.lineWidth = 1;
                            ds.strokeStyle = "black";
                            ds.beginPath();
                            ds.ellipse((x + 0.5) * 32, (y + 0.5) * 32, 16, 16, 0, 0, 2*Math.PI);
                            ds.fill();
                            ds.stroke()

                            ds.save();
                            ds.translate((x + 0.5) * 32, (y + 0.5) * 32);
                            ds.rotate(cell.structure.direction + Math.PI / 2);
                            ds.beginPath();
                            ds.moveTo(-4,-24);
                            ds.lineTo(-4,0);
                            ds.arc(0, 0, 4, 4, 0, Math.PI);
                            ds.lineTo(4,-24);
                            ds.lineTo(-4,-24);
                            ds.fill();
                            ds.stroke()

                            ds.restore();
                            break;
                    }
                }

                if (this.enemyImg != null) {
                    for (let unit of cell.units) {
                        ds.drawImage(this.enemyImg, unit.x * 32 - 6, unit.y * 32 - 6)
                        // ds.fillStyle = "red";
                        // ds.beginPath()
                        // ds.ellipse(unit.x * 32, unit.y * 32, 5, 5, 0, 0, Math.PI * 2);
                        // ds.fill()
                        // ds.stroke();
                    }
                }

                for (let unit of cell.bullets) {
                    ds.fillStyle = "lime";
                    ds.beginPath()
                    ds.ellipse(unit.x * 32, unit.y * 32, 4, 4, 0, 0, Math.PI * 2);
                    ds.fill()
                }

                ds.fillStyle = "gray";
                ds.fillText(cell.distance, x * 32 + 16, y * 32 + 21, 20);
            }
        }

        for (let sel of this.cm.data.selected) {
            ds.strokeStyle = "#00ffff";
            ds.lineWidth = 4;
            ds.beginPath();
            ds.roundRect(sel.x * 32 - 1, sel.y * 32 - 1, 34, 34, 8);
            ds.stroke();
        }

        ds.resetTransform();
        ds.fillStyle = "black";
        ds.font = "20px arial";
        ds.textAlign = "left";
        ds.fillText("Units: " + this.cm.data.unitCount, 20, 40);
        ds.fillText("Bullets: " + this.cm.data.bulletCount, 20, 60);
        ds.fillText("Time: " + this.time, 20, 80);

    }

    timer = Date.now();
    times = [];
    time = 0;

    drawAnimation() {

        this.redraw();
        let time = Date.now() - this.timer;
        this.times.unshift(time);

        if (this.times.length > 10) {
            this.times.splice(10, this.times.length - 10);
        }

        let meantime = 0;
        for (let t of this.times) {
            meantime += t;
        }

        this.time = meantime / this.times.length;
        this.timer = Date.now();


        requestAnimationFrame(this.drawAnimation.bind(this));
    }


}