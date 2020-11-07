let socket = io('/drawer');

let guessesBox;

window.addEventListener('load', () => {

    guessesBox = document.getElementById('guesses-box-msgs');

    document.getElementById('get-target').addEventListener('click', () => {
        socket.emit('get-target');
        console.log('requesting target word');
    })
    // document.getElementById('get-answer').addEventListener('click', () => {
    //     socket.emit('getanswer');
    // })
})

socket.on('guess-made', (data) => {
    console.log(data.name + " guessed " + data.guess);

    addGuessToPage(data);

    // document.getElementById('answer-total').innerHTML = "Number of people who answered the question : " + data.total;
    // document.getElementById('answer-right').innerHTML = "How many got it correct : " +  data.right;
    // document.getElementById('answer-wrong').innerHTML = "How many got it incorrect : " + data.wrong;
})

socket.on('give-target', (data) => {
    console.log(data);
    document.getElementById('target-word').innerHTML = data.target;
    guessesBox.innerHTML = "";
})

function addGuessToPage(guessData) {
    //Create a message string and page element
    let newGuess = guessData.name + " guessed " + guessData.guess;
    let guessEl = document.createElement('p');
    guessEl.innerHTML = newGuess;

    //Add the element with the message to the page
    guessesBox.appendChild(guessEl);

    if (guessData.answer) {
        let successEl = document.createElement('p');
        successEl.innerHTML = "Target word guessed!!";
        guessesBox.appendChild(successEl);
    }
    //Add a bit of auto scroll for the chat box
    guessesBox.scrollTop = guessesBox.scrollHeight;
}


// <----- p5 CODE HERE  ------>

let boxX, boxY;
let boxes = [];
let isDrawing = false;
let clearButton;

function setup() {
    //   createCanvas(windowWidth, windowHeight);
    createCanvas(400, 400);
    noFill();
    stroke(0);
    strokeWeight(2);

    clearButton = createButton('Clear Canvas');
    clearButton.mousePressed(sendClear);

    //Listen for messages named 'data' from the server
    socket.on('draw-box', (data) => {
        console.log(data);
        addBox(data);
    });

    //Listen for messages named 'clear' from the server
    socket.on('clear', () => {
        console.log('Clear received');
        clearCanvas();
    });

}

function draw() {
    background(220);

    // draw the box currently being drawn
    if (isDrawing) {
        let boxWidth = mouseX - boxX;
        let boxHeight = mouseY - boxY;
        rect(boxX, boxY, boxWidth, boxHeight);
    }

    // draw the saved boxes
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].display();
    }
}

function mousePressed() {
    isDrawing = true;
    boxX = mouseX;
    boxY = mouseY;
}


function mouseReleased() {
    isDrawing = false;
    let boxWidth = mouseX - boxX;
    let boxHeight = mouseY - boxY;
    let box = new Box(boxX, boxY, boxWidth, boxHeight);
    socket.emit('draw-box', box);
    // addBox(box);
    // boxWidth = 0;
    // boxHeight = 0;
}

function clearCanvas() {
    boxes = [];
}

function sendClear() {
    socket.emit('clear');
    clearCanvas();
}


//Expects an object with an x and y properties
function addBox(box) {
    boxes.push(new Box(box.x, box.y, box.w, box.h));
    // rect(pos.x, pos.y, 100, 100);
}

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