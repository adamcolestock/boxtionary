//Open and connect socket
let socket = io();

//Create and initialize variables
let messagesBox;
let sendButton;
let guessInput;
let startButton;
let isAnswered = true;
let playerName = "";
let playerRole = "guesser"
let playerScore = 0;
let timeLeft = 0;

let playerInfo = {"username":playerName, "role":playerRole, "score":playerScore};

window.addEventListener('load', () => {

  //Identify variables with DOM interface elements
  nameDisplay = document.getElementById('player-name');
  playersList = document.getElementById('player-list');
  guessInput = document.getElementById('guess-input');
  sendButton = document.getElementById('send-button');
  messagesBox = document.getElementById('messages-box');
  targetWord = document.getElementById('target-word');
  startButton = document.getElementById('start-round');
  endButton = document.getElementById('end-round');
  roleButton = document.getElementById('role-button');
  roleChoices = document.getElementsByName('role-selection');
  roleDisplay = document.getElementById('role-display');
  timeDisplay = document.getElementById('timer');

  //Set the initial message
  messagesBox.innerHTML = "Welcome! <p> please select if you want to draw or guess";
  
  //Add scroll to the messages box
  messagesBox.scrollTop = messagesBox.scrollHeight;

  roleDisplay.innerHTML = "Role: " + playerRole;
  guessInput.disabled = true;
  sendButton.disabled = true;

  //Prompt immediately to get username
  while (playerName == null || playerName == "") {
    playerName = prompt("Please enter your name");
  }
  nameDisplay.innerHTML = playerName;
  playerInfo.username = playerName;

  //Add a listener for the role submit button and send message when changed
  roleButton.addEventListener('click', () => {
    roleChoices.forEach((choice) => {
      if (choice.checked) {
        playerRole = choice.value;
        playerInfo.role = playerRole;
        socket.emit('role-selected', playerInfo);
        roleDisplay.innerHTML = "Role: " + playerRole;
      }
    })
  });

  //Add listener to manual round start button for admin panel
  startButton.addEventListener('click', () => {
    socket.emit('start-round');
    console.log('starting round');
  });

  //Add listener to manual round end button for admin panel
  endButton.addEventListener('click', () => {
    socket.emit('end-round');
    console.log('this round has ended');
  });

  //Add listener to guess input field so enter functions as a send
  guessInput.addEventListener("keyup", function (event) {
    if (event.key === 'Enter') {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the sned button element with a click
      sendButton.click();
    }
  });

  //Add listener to send button for submitting guesses if not answered
  sendButton.addEventListener('click', function () {
    let curGuess = guessInput.value;
    let guessData = {"guess": curGuess,"time": timeLeft};

    if (!isAnswered) {
      socket.emit('make-guess', guessData);
    }
  });
})

//Listen for confirmation of connection and send playerInfo in response
socket.on('connect', function () {
  console.log("Connected");
  socket.emit('new-player', playerInfo);
});

socket.on('update-playerlist', (data) => {
  updatePlayerList(data);
})

//Messages for the drawer only

//Add each new guess to the messages box
socket.on('guess-made', (data) => {
  if (playerRole == "drawer") {
    addGuessToPage(data);
  }
})


//Messages for the initiating guesser only

socket.on('guess-check', (data) => {
  if (data.answer) {
    document.getElementById('player-controls').style.backgroundColor = "#62ca7a";
    isAnswered = true;
  } else {
    document.getElementById('player-controls').style.backgroundColor = "#f33a66";
  }
})

//Messages for both drawers and guessers

socket.on('new-round', (data) => {
  // console.log('new round started');
  // console.log(data);
  document.body.style.background = "#add8e6";
  messagesBox.innerHTML = "a new round has begun";

  for (const role of roleChoices) {
    role.disabled = true;
  }
  roleButton.disabled = true;

  //for drawers
  if (playerRole == "drawer") {
    targetWord.innerHTML = "Please draw a " + data.target;
    guessInput.disabled = true;
    sendButton.disabled = true;
  }

  //for guessers
  if (playerRole == "guesser") {
    guessInput.disabled = false;
    sendButton.disabled = false;
    targetWord.innerHTML = "";
    isAnswered = false;
  }
})

socket.on('roles-problem', () => {
  messagesBox.innerHTML = "We need at least one drawer and one guesser to start"
})

socket.on('countdown', (timer) => {
  timeLeft = timer;
  timeDisplay.innerHTML = "Time: " + timeLeft;
})

socket.on('round-ended', () => {
  // console.log('round has ended');
  document.getElementById('player-controls').style.backgroundColor = "#add8e6";
  messagesBox.innerHTML = "the round has ended <p> please select if you want to draw or guess";
  guessInput.innerHTML = "";
  // guessInput.setAttribute('placeholder', "Guess");
  for (const role of roleChoices) {
    role.disabled = false;
  }
  roleButton.disabled = false;
  guessInput.disabled = true;
  sendButton.disabled = true;
  targetWord.innerHTML = "";
  timeDisplay.innerHTML = "";
})

//Update the scoreboard with current player data
function updatePlayerList(playerData){
  playersList.innerHTML = "";
  for (let i = 0; i < playerData.length; i++){
    let playerEl = document.createElement('p');
    playerEl.innerHTML = playerData[i].username + " -- " + playerData[i].score + " pts";
    playersList.appendChild(playerEl);
  }
}

function addMsgToPage(message){
  let msgEl = document.createElement('p');
  msgEl.innerHTML = message;
  messagesBox.appendChild(msgEl);
}

function addGuessToPage(guessData) {
  //Create a message string and page element
  let newGuess = guessData.name + " guessed " + guessData.guess;
  let guessEl = document.createElement('p');
  guessEl.innerHTML = newGuess;

  //Add the element with the message to the page
  messagesBox.appendChild(guessEl);

  if (guessData.answer) {
    let successEl = document.createElement('p');
    successEl.innerHTML = "Target word guessed!!";
    messagesBox.appendChild(successEl);
  }
}

// <----- p5 CODE HERE  ------>

let boxX, boxY;
let boxes = [];
let isDrawing = false;
let clearButton;

function setup() {

  // var canvasWidth = 0.9 * document.getElementById('sketch-holder').offsetWidth;

  var canvas = createCanvas(800, 400);

  // Move the canvas so it’s inside our <div id="sketch-holder">.
  canvas.parent('sketch-holder');

  background(255, 200, 200);

  noFill();
  stroke(0);
  strokeWeight(2);

  // space = createP('testing');
  // space.parent('sketch-hodler');

  clearButton = createButton('Clear Canvas');
  clearButton.mousePressed(sendClear);
  clearButton.parent('sketch-holder');

  //Listen for draw-box and add new box to the canvas
  socket.on('draw-box', (data) => {
    addBox(data);
  });

  //Listen for clear-canvas and clear the canvas
  socket.on('clear-canvas', () => {
    clearCanvas();
  });
}

function draw() {
  background(255, 200, 200);

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
  if (playerRole == "drawer" && onCanvas()) {
    isDrawing = true;
    boxX = mouseX;
    boxY = mouseY;
  }
}


function mouseReleased() {
  if (playerRole == "drawer" && onCanvas()) {
    isDrawing = false;
    let boxWidth = mouseX - boxX;
    let boxHeight = mouseY - boxY;
    let box = new Box(boxX, boxY, boxWidth, boxHeight);
    socket.emit('draw-box', box);
  }
}

function clearCanvas() {
  boxes = [];
}

function sendClear() {
  if (playerRole == "drawer") {
    socket.emit('clear-canvas');
    clearCanvas();
  }
}

//Expects an object for box with x,y,w,h properties
function addBox(box) {
  boxes.push(new Box(box.x, box.y, box.w, box.h));
}

function onCanvas() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height){
    return true;
  } else {
    return false;
  }
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