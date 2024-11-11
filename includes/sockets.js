const websock = require('websocket');
const { vs:uuid } = require("uuid");
const ws = require('ws');

module.exports = function(app) {

    const wsServer = new ws.Server({ server: app, path: "/ws" });
    wsServer.on("connection", socket => {
        console.log("Got connection");
        socket.id = uuid();
        socket.on("message", function(message) {
            console.log(message);
            //handle message from client
            //get client id??
            console.log(socket.id);
        })
    });

}