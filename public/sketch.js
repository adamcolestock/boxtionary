// <----- p5 CODE HERE  ------>


let gameData = [];
let isDrawing = false;
// let clearButton;
let bgColor;
let penColor;
let edgeColor
let penWeight;

// gameModes: 0:Boxes, 1:Dots 2:Sticks

//Boxes variables
let boxX, boxY;

//Dots variables
let points = []; //an array of pVectors
let totalPoints = 125;
let startPoint = null;
let endPoint = null
let ptSize = 10;

//Sticks variables
let lines = [];
let deleted = [];
let myDeleted = [];
let totalLines = 30;
let lineLength = 200;
let threshold = 25;
let selected = null;


function setup() {

    // var canvasWidth = 0.9 * document.getElementById('sketch-holder').offsetWidth;

    var canvas = createCanvas(700, 400);

    // Move the canvas so it’s inside our <div id="sketch-holder">.
    canvas.parent('sketch-holder');
    bgColor = color('#434343');
    penColor = color('#ffffff');
    edgeColor = color('#cb2c37');
    penWeight = 2;
    background(bgColor);

    noFill();
    stroke(penColor);
    strokeWeight(penWeight);

    //No setup for Boxes

    //Dots setup

}

function draw() {
    background(bgColor);
    stroke(penColor);
    strokeWeight(penWeight);

    switch (gameMode) {
        case 0:     //Boxes
            // draw the box currently being drawn
            if (isDrawing) {
                let boxWidth = mouseX - boxX;
                let boxHeight = mouseY - boxY;
                rect(boxX, boxY, boxWidth, boxHeight);
            }

            // draw the boxes in gameData
            if (gameData) {
                for (let j = 0; j < gameData.length; j++) {
                    stroke(color(gameData[j].color));
                    for (let i = 0; i < gameData[j].boxes.length; i++) {
                        if (gameData[j].boxes[i]) {
                            let box = gameData[j].boxes[i];
                            new Box(box.x, box.y, box.w, box.h).display();
                        }
                    }
                }
            }
            break;
        case 1:     //Dots
            //display points
            fill(255);
            points = modeData;
            if (points) {
                for (let i = 0; i < points.length; i++) {
                    ellipse(points[i].x, points[i].y, ptSize);
                }
            }
            if (startPoint) {
                fill(255, 0, 0);
                ellipse(startPoint.x, startPoint.y, ptSize);
            }
            if (endPoint) {
                fill(255, 0, 0);
                ellipse(endPoint.x, endPoint.y, ptSize);
            }

            // draw the line currently being drawn
            if (isDrawing) {
                line(startPoint.x, startPoint.y, mouseX, mouseY);
            }

            // draw the lines in gameData
            if (gameData) {
                for (let j = 0; j < gameData.length; j++) {
                    stroke(color(gameData[j].color));
                    for (let i = 0; i < gameData[j].boxes.length; i++) {
                        if (gameData[j].boxes[i]) {
                            let segment = gameData[j].boxes[i];
                            new Segment(segment.startX, segment.startY, segment.endX, segment.endY).display();
                        }
                    }
                }
            }
            break;
        case 2:         //Sticks
            //set lines and deleted
            lines = modeData;
            deleted = [];
            for (let j = 0; j < gameData.length; j++) {
                for (let i = 0; i < gameData[j].boxes.length; i++) {
                    deleted.push(parseInt(gameData[j].boxes[i]));
                }
            }
            //draw lines
            stroke(255);
            if (lines) {
                for (let i = 0; i < lines.length; i++) {
                    if (!deleted.includes(i)) {
                        new Segment(lines[i].startX, lines[i].startY, lines[i].endX, lines[i].endY).display();
                    }
                }
            }
            if (selected) {
                stroke(255, 0, 0);
                new Segment(lines[selected-1].startX, lines[selected-1].startY, lines[selected-1].endX, lines[selected-1].endY).display();
            }
            break;
    }

    // draw the rounded edge of the screen
    noFill();
    strokeWeight(20);
    stroke(edgeColor);
    rect(-10, -10, width + 20, height + 20, 50);
}

function mouseMoved() {
    if (playerRole == "drawer" && onCanvas()) {

        switch (gameMode) {
            case 2:     //Sticks
                let mouse = createVector(mouseX, mouseY);
                selected = null;
                if (lines) {
                    for (let i = 0; i < lines.length; i++) {
                        if (!deleted.includes(i)) {
                            let p1 = createVector(lines[i].startX, lines[i].startY);
                            let p2 = createVector(lines[i].endX, lines[i].endY);
                            if (SquaredDistancePointToLineSegment(p1, p2, mouse) < threshold) {
                                selected = i + 1;
                            }
                        }
                    }
                }
        }
    }

}

function mousePressed() {
    if (playerRole == "drawer" && onCanvas()) {

        switch (gameMode) {
            case 0:     //Boxes
                boxX = mouseX;
                boxY = mouseY;
                isDrawing = true;
                break;
            case 1:     //Dots
                for (let i = 0; i < points.length; i++) {
                    if (dist(mouseX, mouseY, points[i].x, points[i].y) < ptSize) {
                        startPoint = points[i];
                        isDrawing = true;
                    }
                }
                break;
            case 2:     //Sticks
                if (selected) {
                    // myDeleted.push(selected - 1);
                    socket.emit('draw-box', selected - 1);
                }
                break;
        }
    }
}

function mouseDragged() {
    if (isDrawing) {
        switch (gameMode) {
            case 1:         //Dots
                for (let i = 0; i < points.length; i++) {
                    if (dist(mouseX, mouseY, points[i].x, points[i].y) < ptSize && points[i] != startPoint) {
                        endPoint = points[i];
                    }
                }
                break;
        }
    }
}

function mouseReleased() {
    if (playerRole == "drawer" && onCanvas()) {
        isDrawing = false;
        switch (gameMode) {
            case 0:         //Boxes
                let boxWidth = mouseX - boxX;
                let boxHeight = mouseY - boxY;
                let obj = new Box(boxX, boxY, boxWidth, boxHeight);
                socket.emit('draw-box', obj);

                break;
            case 1:         //Dots
                if (startPoint && endPoint) {
                    let obj = new Segment(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
                    socket.emit('draw-box', obj);
                }
                startPoint = null
                endPoint = null;
                break;
        }
    }
}

function onCanvas() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        return true;
    } else {
        return false;
    }
}

function createModeData(mode) {
    switch (mode) {
        case 0:
            console.log('generating modeData');
            return null;
        case 1:
            // generate random points
            console.log('generating modeData');
            let pts = [];
            for (let i = 0; i < totalPoints; i++) {
                let pt = { x: random(width), y: random(height) };
                pts.push(pt);
            }
            console.log('points generated' + pts);
            return pts;
        case 2:
            lines = [];
            for (let i = 0; i < totalLines; i++) {
                let start = createVector(0, 1);
                start.rotate(random(TWO_PI));
                start.setMag(100);
                let end = createVector(random(0.25 * lineLength, width - 0.25 * lineLength), random(0.25 * lineLength, height - 0.25 * lineLength));
                start.add(end);
                lines.push(new Segment(start.x, start.y, end.x, end.y));
            }
            return lines;

    }
}

// <--  Classes for the p5 Sketch -->

class Box {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    display() {
        rect(this.x, this.y, this.w, this.h);
    }
}

class Segment {
    constructor(startX, startY, endX, endY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
    }

    display() {
        strokeWeight(3);
        line(this.startX, this.startY, this.endX, this.endY);
    }
}

// ----Intersection functions-----

function SquaredDistancePointToLineSegment(A, B, P) {
    vx = P.x - A.x, // v = A->P
        vy = P.y - A.y;
    ux = B.x - A.x, // u = A->B
        uy = B.y - A.y;
    det = vx * ux + vy * uy;

    if (det <= 0) { // its outside the line segment near A
        //S.set(A);
        return vx * vx + vy * vy;
    }
    len = ux * ux + uy * uy; // len = u^2
    if (det >= len) { // its outside the line segment near B
        //S.set(B);
        return sq(B.x - P.x) + sq(B.y - P.y);
    }
    // its near line segment between A and B
    ex = ux / sqrt(len); // e = u / |u^2|
    ey = uy / sqrt(len);
    f = ex * vx + ey * vy; // f = e . v
    //S.x = A.x + f * ex;           // S = A + f * e
    //S.y = A.y + f * ey;

    return sq(ux * vy - uy * vx) / len; // (u X v)^2 / len
}

function ClosestPointOnLineSegment(A, B, P) {
    S = createVector();
    vx = P.x - A.x, // v = A->P
        vy = P.y - A.y;
    ux = B.x - A.x, // u = A->B
        uy = B.y - A.y;
    det = vx * ux + vy * uy;

    if (det <= 0) { // its outside the line segment near A
        S.set(A);
        //return vx*vx + vy*vy;
    }
    len = ux * ux + uy * uy; // len = u^2
    if (det >= len) { // its outside the line segment near B
        S.set(B);
        //return sq(B.x-P.x) + sq(B.y-P.y);  
    }
    // its near line segment between A and B
    ex = ux / sqrt(len); // e = u / |u^2|
    ey = uy / sqrt(len);
    f = ex * vx + ey * vy; // f = e . v
    S.x = A.x + f * ex; // S = A + f * e
    S.y = A.y + f * ey;

    //return sq(ux*vy-uy*vx) / len;    // (u X v)^2 / len
    return S;
}