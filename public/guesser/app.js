let socket = io('/guesser');
let isAnswered = true;
let playerName;

window.addEventListener('load', () => {
    while (playerName == null || playerName == "") {
        playerName = prompt("Please enter your name", "C3PO");
    }

    document.getElementById('player-name')

    // if (playerName == null || playerName == "") {
    //     txt = "User cancelled the prompt.";
    // } else {
    //     txt = "Hello " + playerName + "! How are you today?";
    // }
    // createOptionButtons();
    /* --- Code to SEND a socket message to the Server --- */
    // let nameInput = document.getElementById('name-input')
    let nameDisplay = document.getElementById('player-name');
    let guessInput = document.getElementById('guess-input');
    let sendButton = document.getElementById('send-button');

    nameDisplay.innerHTML = playerName;

    // Add a listner to the input field to allow for hitting Enter to send
    guessInput.addEventListener("keyup", function (event) {
        if (event.key === 'Enter') {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            sendButton.click();
        }
    });

    sendButton.addEventListener('click', function () {
        // let curName = nameInput.value;
        let curGuess = guessInput.value;
        let guessData = { "name": playerName, "guess": curGuess };

        //Send the message object to the server
        if (!isAnswered) {
            socket.emit('make-guess', guessData);
        }
    });
})

// socket.on('question', (data)=> {
//     isAnswered = false;
//     console.log(data);
//     document.body.style.background = "#ffffff";
//     let options = data.options;
//     document.getElementById('questions').innerHTML = data.question;
//     populateOptions(data.options);
// })

//change the colour of the screen based on answer
socket.on('guess-check', (data) => {
    if (data.answer) {
        document.body.style.background = "#62ca7a";
        isAnswered = true;
    } else {
        document.body.style.background = "#f33a66";
    }
})

socket.on('new-round', ()=>{
    isAnswered = false;
    document.body.style.background = "#add8e6";
})

/* Functions to populate the HTML via javascript */

// function : create the option buttons on page load
// function createOptionButtons() {
//     for(let i =0;i<4;i++) {
//       let button = document.createElement('button');
//       let buttonSpan = document.createElement('span');
//       buttonSpan.classList.add("button-span");
//       button.innerHTML = 1+i;
//       button.classList.add("button-options");

//       // when user selects answer
//       button.onclick = function() {
//           if(isAnswered == false) { 
//               socket.emit('answer', {answer: i})
//               isAnswered = true;
//           }
//       }
//       button.appendChild(buttonSpan);
//       document.getElementById('answers').appendChild(button);
//     }
//   }

//function : populate the options when question is asked
// function populateOptions(options) {
//     let optionsElt = document.getElementsByClassName('button-span');
//     for(let i=0;i<optionsElt.length;i++ ){
//       optionsElt[i].innerHTML = options[i];
//     }
// }

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

    // clearButton = createButton('Clear Canvas');
    // clearButton.mousePressed(sendClear);

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
    // if (isDrawing) {
    //     let boxWidth = mouseX - boxX;
    //     let boxHeight = mouseY - boxY;
    //     rect(boxX, boxY, boxWidth, boxHeight);
    // }

    // draw the saved boxes
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].display();
    }
}

// function mousePressed() {
//     isDrawing = true;
//     boxX = mouseX;
//     boxY = mouseY;
// }


// function mouseReleased() {
//     isDrawing = false;
//     let boxWidth = mouseX - boxX;
//     let boxHeight = mouseY - boxY;
//     let box = new Box(boxX, boxY, boxWidth, boxHeight);
//     socket.emit('draw-box', box);
//     // addBox(box);
//     // boxWidth = 0;
//     // boxHeight = 0;
// }

function clearCanvas() {
    boxes = [];
}

// function sendClear() {
//     socket.emit('clear');
//     clearCanvas();
// }


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