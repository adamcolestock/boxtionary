let express = require('express');
let app = express();
app.use('/', express.static('public'));

//Set target words
let targets = ["pizza", "flower", "car", "ice cream", "bicycle", "sun", "camel", "tree","umbrella", "suitcase", "bed", "chair", "boat", "lion", "snake", "doorknob", "earth", "moustache", "lipstick", "guitar", "shoe", "missile", "heart", "banana", "clown"];

let playerDB = [];

let timeLimit = 30;
let targetNo = 0;
let drawersNo = 0;
let guessersNo = 0;
let numCorrect = 0;
let roundOver = false;

//Initialize the actual HTTP server
let http = require('http');
let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server listening at port: " + port);
});

//Initialize socket.io
let io = require('socket.io').listen(server);

//track the number of sockets
// var srvSockets = io.sockets.sockets;
// let numClients = Object.keys(srvSockets).length;

io.sockets.on('connection', function (socket) {
    console.log("We have a new client: " + socket.id);

    socket.on('new-player', (data) => {
        socket.username = data.username;
        socket.role = data.role;
        socket.score = data.score;
        console.log('Registered new player ' + socket.username);
        playerDB.push({ id: socket.id, username: socket.username, role: socket.role, score: socket.score });
        io.sockets.emit('update-playerlist', playerDB);
    })


    //Admin messages

    //Start the round
    socket.on('start-round', () => {

        console.log('admin has requested round start');

        let isDrawer = false;
        let isGuesser = false;
        roundOver = false;
        numCorrect = 0;
        drawersNo = 0;
        guessersNo = 0;

        // Count the number of drawers and guessers
        for (let i = 0; i < playerDB.length; i++) {
            if (playerDB[i].role == "guesser") {
                isGuesser = true;
                guessersNo++;
            } else if (playerDB[i].role == "drawer") {
                isDrawer = true;
                drawersNo++;
            }
        }

        // Only start round if there is at least one of each
        if (isDrawer && isGuesser) {
            targetNo = Math.floor(Math.random() * targets.length);

            let targetData = {
                target: targets[targetNo],
            };
            io.sockets.emit('new-round', targetData);

            // counter variable 
            var counter = 0;
            // time limit
            var seconds = timeLimit;
            // temporary variable for storing how far we have to go in the countdown
            var remaining;
            // set a new interval to go off every second and keep the countdown synced among all players
            var interval = setInterval(function () {
                // perform the calculation for how many seconds left
                remaining = seconds - Math.ceil(counter / 1000);
                // broadcast how advanced the countdown is
                io.sockets.emit('countdown', remaining);
                if (counter >= timeLimit * 1000 || roundOver) {
                    // countdown is finished tell the client to change the views.
                    io.sockets.emit('round-ended');
                    clearInterval(interval);
                }
                counter += 1000;
            }, 1000);
        } else {
            io.sockets.emit('roles-problem');
        }


    })

    socket.on('end-round', () => {
        console.log('admin has ended the round');

        io.sockets.emit('round-ended');
    })


    //Drawer messages

    //Listen for a message named 'clear-canvas' from this client
    socket.on('clear-canvas', () => {
        // console.log("Received: 'clear-canvas'");
        io.sockets.emit('clear-canvas');
    });

    //Listen for a message named 'draw-box' from this client
    socket.on('draw-box', (data) => {
        // console.log("Received: 'box' " + data);
        io.sockets.emit('draw-box', data);
    });

    //guesser and drawer messages

    socket.on('role-selected', (data) => {
        socket.role = data.role;
        var index = playerDB.findIndex(p => p.id == socket.id);
        playerDB[index].role = data.role;
        io.sockets.emit("update-playerlist", playerDB);
    })

    //guesser messages

    //on receiving answer from the client
    socket.on('make-guess', (guessData) => {
        // console.log('Received guess: ' + guessData.guess);
        if (guessData.guess == targets[targetNo]) {
            socket.emit('guess-check', { answer: true });
            io.sockets.emit('guess-made', { name: socket.username, guess: guessData.guess, answer: true })
            //increase guesser score
            var index = playerDB.findIndex(p => p.id == socket.id);
            playerDB[index].score += guessData.time;
            //increase drawers score
            for (let i = 0; i < playerDB.length; i++) {
                if (playerDB[i].role == "drawer") {
                    playerDB[i].score += guessData.time / guessersNo;
                    playerDB[i].score.toFixed(2);
                }
            }
            io.sockets.emit("update-playerlist", playerDB);
            numCorrect ++;
            if (numCorrect == guessersNo){
                roundOver = true;
            }
        } else {
            socket.emit('guess-check', { answer: false })
            io.sockets.emit('guess-made', { name: socket.username, guess: guessData.guess, answer: false })
        }
    })

    //Listen for this client to disconnect
    socket.on('disconnect', function () {
        console.log("A client has disconnected: " + socket.id);
        var index = playerDB.findIndex(p => p.id == socket.id);
        playerDB.splice(index, 1);
        io.sockets.emit("update-playerlist", playerDB);
    });

});



