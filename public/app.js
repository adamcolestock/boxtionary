//Open and connect socket
let socket = io();

//Create and initialize variables
let messagesBox;
let sendButton;
let guessInput;
let startButton;
let clearButton;
let gameSelection;
let isAnswered = true;
let playerName = "";
let playerRole = "guesser"
let playerScore = 0;
let timeLeft = 0;
let gameMode = 0;
let modeData;

let playerInfo = { "username": playerName, "role": playerRole, "score": playerScore };

window.addEventListener('load', () => {

  //Identify variables with DOM interface elements
  nameDisplay = document.getElementById('player-name');
  playersList = document.getElementById('player-list');
  guessInput = document.getElementById('guess-input');
  sendButton = document.getElementById('send-button');
  clearButton = document.getElementById('clear-button');
  messagesBox = document.getElementById('messages-box');
  targetWord = document.getElementById('target-word');
  startButton = document.getElementById('start-round');
  endButton = document.getElementById('end-round');
  roleButton = document.getElementById('role-button');
  roleChoices = document.getElementsByName('role-selection');
  gameSelection = document.getElementById('game-mode');
  roleDisplay = document.getElementById('role-display');
  timeDisplay = document.getElementById('timer');

  //Set the initial message
  messagesBox.innerHTML = "Welcome! <p> please select if you want to draw or guess";

  //Add scroll to the messages box
  messagesBox.scrollTop = messagesBox.scrollHeight;

  roleDisplay.innerHTML = "Role: " + playerRole;
  guessInput.disabled = true;
  sendButton.disabled = true;

  nameDisplay.innerHTML = playerName;

  //Add a listener for gameSelection
  gameSelection.addEventListener('change', (event) => {
    gameMode = parseInt(event.target.value);
    console.log('Game Mode changed to ' + gameMode);
  });

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

  //Add a listener for the clear canvas button
  clearButton.addEventListener('click', () => {
    socket.emit('clear-canvas');
    console.log('clearing canvas');
  });

  //Add listener to manual round start button for admin panel
  startButton.addEventListener('click', () => {
    modeData = createModeData(gameMode);
    let data = {gameMode: gameMode, modeData: modeData};
    socket.emit('start-round', data);
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
    let guessData = { "guess": curGuess, "time": timeLeft };

    if (!isAnswered) {
      socket.emit('make-guess', guessData);
    }
  });
})

//Listen for confirmation of connection and send playerInfo in response
socket.on('connect', function () {
  console.log("Connected");
  //Prompt immediately to get username
  // while (playerName == null || playerName == "") {
  playerName = prompt("Please enter your name");
  // }
  playerInfo.username = playerName;
  socket.emit('new-player', playerInfo);
});

socket.on('update-playerlist', (data) => {
  updatePlayerList(data);
})

//Listen for updated game data and update
socket.on('update-boxes', (data) => {
  gameData = data;
  console.log(gameData);
});

//Messages for the drawer only

//Add each new guess to the messages box
socket.on('guess-made', (data) => {
  // if (playerRole == "drawer") {
  //   addGuessToPage(data);
  // }
  addGuessToPage(data);
})


//Messages for the initiating guesser only

socket.on('guess-check', (data) => {
  if (data.answer) {
    // document.getElementById('player-controls').style.backgroundColor = "#62ca7a";
    isAnswered = true;
  } else {
    // document.getElementById('player-controls').style.backgroundColor = "#f33a66";
  }
})

//Messages for both drawers and guessers

socket.on('new-round', (data) => {
  console.log('new round started');
  console.log(data);
  document.body.style.background = "#add8e6";
  messagesBox.innerHTML = "a new round has begun";

  for (const role of roleChoices) {
    role.disabled = true;
  }
  roleButton.disabled = true;

  gameMode = data.gameMode;
  modeData = data.modeData;

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
  // document.getElementById('player-controls').style.backgroundColor = "#add8e6";
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
function updatePlayerList(playerData) {
  playersList.innerHTML = "";
  for (let i = 0; i < playerData.length; i++) {
    let playerEl = document.createElement('p');
    playerEl.innerHTML = playerData[i].username + " -- " + playerData[i].score + " pts";
    playersList.appendChild(playerEl);
  }
}

function addMsgToPage(message) {
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


