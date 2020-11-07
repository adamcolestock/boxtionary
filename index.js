let express = require('express');
let app = express();
app.use('/', express.static('public'));

//target words
let targets = [{
    target: "pizza"
}, {
    target: "flower"
}, {
    target: "car"
}];



//Initialize the actual HTTP server
let http = require('http');
let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server listening at port: " + port);
});

//Initialize socket.io
let io = require('socket.io').listen(server);

let drawer = io.of('/drawer');
let guesser = io.of('/guesser');
let targetNo = 0;

var srvSockets = io.sockets.sockets;
// let numClients = Object.keys(srvSockets).length;

//Listen for users connecting to main page
//If they are the first to sign on direct  them to the drawer name space
io.sockets.on('connection', function (socket) {
    console.log("We have a new client: " + socket.id);

    let numClients = Object.keys(srvSockets).length;
    console.log(numClients);

    if (numClients == 1) {
        socket.role = "drawer";
    } else{
        socket.role = "guesser";
    }

    socket.emit('assign-role');

    // //Listen for a message named 'msg' from this client
    // socket.on('msg', function (data) {
    //     //Data can be numbers, strings, objects
    //     console.log("Received a 'msg' event");
    //     console.log(data);

    //     //Send a response to all clients, including this one
    //     io.sockets.emit('msg', data);
    // });

    //Listen for this client to disconnect
    socket.on('disconnect', function () {
        console.log("A client has disconnected: " + socket.id);
    });
});

drawer.on('connection', (socket) => {
    console.log('drawer socket connected !!!!!!! : ' + socket.id);

    socket.on('get-target', () => {

        console.log('drawer client has requested a target');
        targetNo = Math.floor(Math.random() * targets.length);
        //send the target word to the drawer client
        let targetData = {
            target: targets[targetNo].target,
        };
        drawer.emit('give-target', targetData);
        guesser.emit('new-round');
        // //send the question + options  to the input client
        // let inputdata = {
        //     question : quiz[quizNo].question,
        //     options : quiz[quizNo].options
        // };
        // input.emit('question', inputdata);
    })

    // socket.on('getanswer', () => {
    //     output.emit('answers', answer);
    // })
    //Listen for a message named 'draw-box' from this client
    socket.on('draw-box', (data) => {
        console.log("Received: 'data' " + data);
        drawer.emit('draw-box', data);
        guesser.emit('draw-box', data);

    });

    //Listen for a message named 'clear' from this client
    socket.on('clear', () => {
        console.log("Received: 'clear'");
        drawer.emit('clear');
        guesser.emit('clear');

    });
})

guesser.on('connection', (socket) => {
    console.log('guesser socket connected : ' + socket.id);

    //on receiving answer from the client
    socket.on('make-guess', (data) => {
        if (data.guess == targets[targetNo].target) {
            socket.emit('guess-check', { answer: true });
            drawer.emit('guess-made', { name: data.name, guess: data.guess, answer: true })
        } else {
            socket.emit('guess-check', { answer: false })
            drawer.emit('guess-made', { name: data.name, guess: data.guess, answer: false })
        }
    })

})