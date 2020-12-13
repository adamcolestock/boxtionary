// <----- p5 CODE HERE  ------>


let gameData = null;
let isDrawing = false;
let bgColor;
let penColor;
let edgeColor
let penWeight = 2;

// gameModes: 0:Boxes 1:Dots 2:Sticks 3: Slices

//Boxes variables
let boxX, boxY;

//Dots variables
let points = []; 
let totalPoints = 200;
let startPoint = null;
let endPoint = null
let ptSize = 10;

//Sticks variables
let lines = [];
let deleted = [];
let myDeleted = [];
let totalLines = 80;
let lineLength = 200;
let threshold = 25;
let selected = null;

//Slices variables
let shapes = []; 
let intersections = [];
let activeShape = null;
let isDragging = false;
let isSplitting = false;

function setup() {

    var canvas = createCanvas(700, 400);

    // Move the canvas so it’s inside our <div id="sketch-holder">.
    canvas.parent('sketch-holder');
    bgColor = color('#434343');
    penColor = color('#ffffff');
    edgeColor = color('#cb2c37');
    background(bgColor);
    noFill();
    stroke(penColor);
    strokeWeight(penWeight);

}

function draw() {
    background(bgColor);
    stroke(penColor);
    strokeWeight(penWeight);

    if (roundStarted) {

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
                    new Segment(lines[selected - 1].startX, lines[selected - 1].startY, lines[selected - 1].endX, lines[selected - 1].endY).display();
                }
                break;
            case 3:         //Slices
                // need to begin round by creating first shape
                if (roundStarted && shapes.length == 0 && playerRole == "drawer") {
                    shapes[0] = [];
                    shapes[0].push([100, 300]);
                    shapes[0].push([300, 300]);
                    shapes[0].push([300, 100]);
                    shapes[0].push([100, 100]);
                    // console.log('shapes created');

                    activeShape = shapes[0];
                    let updated = shapes;
                    socket.emit('replace-boxes', updated);
                }

                // draw the other shapes in gameData
                if (gameData) {
                    for (let j = 0; j < gameData.length; j++) {
                        // if (!gameData[j].id == socket.id) {
                        fill(color(gameData[j].color));
                        let shapes = gameData[j].boxes;
                        if (shapes) {
                            for (let i = 0; i < shapes.length; i++) {
                                beginShape();
                                for (let j = 0; j < shapes[i].length; j++) {
                                    vertex(shapes[i][j][0], shapes[i][j][1]);
                                }
                                endShape(CLOSE);
                            }
                        }
                        // }
                    }
                }

                if (playerRole == "drawer" && shapes.length != 0) {
                    // draw all my shapes
                    fill(255, 255, 255, 0);
                    for (let i = 0; i < shapes.length; i++) {
                        beginShape();
                        for (let j = 0; j < shapes[i].length; j++) {
                            vertex(shapes[i][j][0], shapes[i][j][1]);
                        }
                        endShape(CLOSE);
                    }

                    // draw activeShape
                    fill(255, 255, 255, 90);
                    beginShape();
                    for (let i = 0; i < activeShape.length; i++) {
                        vertex(activeShape[i][0], activeShape[i][1]);
                    }
                    endShape(CLOSE);

                    // draw vertices
                    fill(0);
                    for (let i = 0; i < shapes.length; i++) {
                        for (let j = 0; j < shapes[i].length; j++) {
                            ellipse(shapes[i][j][0], shapes[i][j][1], 10);
                        }
                    }

                    if (isSplitting) {
                        line(startPoint.x, startPoint.y, mouseX, mouseY);
                    }

                    //display intersections
                    if (intersections != null) {
                        fill(0, 0, 255);
                        for (let i = 0; i < intersections.length; i++) {
                            ellipse(intersections[i].position.x, intersections[i].position.y, 10);
                        }
                    }
                }
                break;
        }

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
            case 3:     //Slices
                // console.log(shapes);
                for (let i = 0; i < shapes.length; i++) {
                    for (let j = 0; j < shapes[i].length; j++) {
                        let p = shapes[i][j];
                        if (dist(mouseX, mouseY, p[0], p[1]) < 5) {
                            activeShape = shapes[i];
                            isDragging = true;
                            // console.log('started dragging');
                            // console.log(activePoint);
                        }
                    }
                }
                if (!isDragging) {
                    isSplitting = true;
                    startPoint = createVector(mouseX, mouseY);
                }
                isDrawing = true;
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
            case 3:         //Slices
                if (isSplitting) {
                    endPoint = createVector(mouseX, mouseY);
                    findIntersections(activeShape, startPoint, endPoint);
                } else if (isDragging) {
                    // move each point in activeShape by the same amount
                    let xOffset = mouseX - pmouseX;
                    let yOffset = mouseY - pmouseY;
                    for (i = 0; i < activeShape.length; i++) {
                        activeShape[i][0] += xOffset;
                        activeShape[i][1] += yOffset;
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
            case 3:         //Slices
                isSplitting = false;
                isDragging = false;
                startPoint = null
                endPoint = null;
                if (intersections.length == 2) {
                    splitShape();
                }
                let updated = shapes;
                socket.emit('replace-boxes', updated);
                intersections = [];
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
            // console.log('points generated' + pts);
            return pts;
        case 2:
            lines = [];
            console.log('generating modeData');

            for (let i = 0; i < totalLines; i++) {
                let start = createVector(0, 1);
                start.rotate(random(TWO_PI));
                start.setMag(100);
                let end = createVector(random(0.25 * lineLength, width - 0.25 * lineLength), random(0.25 * lineLength, height - 0.25 * lineLength));
                start.add(end);
                lines.push(new Segment(start.x, start.y, end.x, end.y));
                
            }
            // console.log('lines generated' + lines);
            return lines;
        case 3:
            return null;

    }
}

function resetGameVariables() {
    gameMode = gameSelection.value;
    modeData = null;
    gameData = null;
    roundStarted = false;

    //Boxes variables


    //Dots variables
    points = []; 
    startPoint = null;
    endPoint = null

    //Sticks variables
    lines = [];
    deleted = [];
    myDeleted = [];
    selected = null;

    //Slices variables
    shapes = []; 
    intersections = [];
    activeShape = null;
    isDragging = false;
    isSplitting = false;

}

function resetLocalVariables() {
    shapes = []; // an array of point sequences
    intersections = [];
    activeShape = null;
    isDragging = false;
    isSplitting = false;

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

// -------Shape Splitting functions--------

function splitShape() {
    // console.log(intersections);
    target = activeShape.slice(0)
    target.splice(intersections[0].index + 1, 0, [intersections[0].position.copy().x, intersections[0].position.copy().y]);
    target.splice(intersections[1].index + 2, 0, [intersections[1].position.copy().x, intersections[1].position.copy().y]);
    // console.log(target);

    shape1 = [];
    for (let i = 0; i < target.length; i++) {
        shape1.push(target[i].slice(0));
    }
    shape1 = shape1.slice(intersections[0].index + 1, intersections[1].index + 3);
    // console.log(shape1);

    shape2 = [];
    for (let i = 0; i < target.length; i++) {
        shape2.push(target[i].slice(0));
    }
    shape2.splice(intersections[0].index + 2, intersections[1].index - intersections[0].index);
    // console.log(shape2);

    shapes.push(shape1);
    shapes.push(shape2);

    shapes.splice(shapes.findIndex(k => k == activeShape), 1);
    activeShape = shapes[shapes.length - 1];
}

function findIntersections(activeShape, start, end) {
    intersections = [];
    let target = activeShape;
    for (let i = 0; i < target.length; i++) {
        let result = lineIntersect(startPoint, endPoint, target[i], target[(i + 1) % target.length]);
        if (result) {
            let intersection = {
                position: result,
                index: i
            };
            intersections.push(intersection);
        }
    }
}

function lineIntersect(p0, p1, p2, p3) {
    p2 = createVector(p2[0], p2[1]);
    p3 = createVector(p3[0], p3[1]);
    A1 = p1.y - p0.y;
    B1 = p0.x - p1.x;
    C1 = A1 * p0.x + B1 * p0.y;
    A2 = p3.y - p2.y;
    B2 = p2.x - p3.x;
    C2 = A2 * p2.x + B2 * p2.y;
    denominator = A1 * B2 - A2 * B1;

    if (denominator == 0) {
        return null;
    }

    intersectX = (B2 * C1 - B1 * C2) / denominator;
    intersectY = (A1 * C2 - A2 * C1) / denominator;
    rx0 = (intersectX - p0.x) / (p1.x - p0.x);
    ry0 = (intersectY - p0.y) / (p1.y - p0.y);
    rx1 = (intersectX - p2.x) / (p3.x - p2.x);
    ry1 = (intersectY - p2.y) / (p3.y - p2.y);

    if (((rx0 >= 0 && rx0 <= 1) || (ry0 >= 0 && ry0 <= 1)) &&
        ((rx1 >= 0 && rx1 <= 1) || (ry1 >= 0 && ry1 <= 1))) {
        return createVector(intersectX, intersectY);
    } else {
        return null;
    }
}