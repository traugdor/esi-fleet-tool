const websock = require('websocket');
const { v4:uuid } = require("uuid");
const ws = require('ws');

module.exports = function(app) {

    const wsServer = new ws.Server({ port:8081 });
    wsServer.on("connection", socket => {
        console.log("Got connection");
        socket.id = uuid();
        socket.on("message", function(message) {
            console.log(Buffer.from(message).toString());
            //handle message from client
            //get client id??
            console.log(socket.id);
            socket.send(socket.id);
        })
    });

}