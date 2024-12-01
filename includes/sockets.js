const websock = require('websocket');
const { v4:uuid } = require("uuid");
const ws = require('ws');
const settings = require('../settings');
const url = require('url');
const cookie = require('cookie');
const sessionFileStore = require('session-file-store');
const session = require('express-session');
const esi = require('./ESI');
const db = require('./db');

// Create the same session configuration as in main.js
const FileStore = sessionFileStore(session);
const sessionParser = session({
    name: 'esifleettool.sid',
    store: new FileStore({
        path: './sessions',
        ttl: 14 * 24 * 60 * 60,
        reapInterval: 24 * 60 * 60
    }),
    secret: settings.EVEclientID,
    resave: true,
    saveUninitialized: true
});

module.exports = function(app) {
    const wsServer = new ws.Server({ 
        port: settings.internalWebsocketPort,
        verifyClient: async ({ req }, done) => {
            // Parse session from the initial request
            sessionParser(req, {}, () => {
                if (!req.session) {
                    done(false, 401, 'Unauthorized');
                    return;
                }
                done(true);
            });
        }
    });

    wsServer.on("connection", async (socket, req) => {
        console.log("New client connected");
        let socketId;
        if(req.session && req.session.esifleettool?.loggedIn) {
            console.log("Client is logged in. get socket ID from database and reuse it");
            let discordUser = req.session.esifleettool.discordUser;
            db.users.getUserByDiscordid({did: discordUser.id}, (err, user) => {
                if (err) {
                    console.error("Error getting user:", err);
                } else {
                    //check user's socketid
                    if (user.socketid != 0) {
                        console.log("User already has a socket ID");
                        if(req.session.socketId != user.socketid) {
                            console.log("Session socket ID does not match user's socket ID. Updating to match.");
                            req.session.socketId = user.socketid;
                            socketId = user.socketid;
                            req.session.save((err) => {
                                if (err) {
                                    console.error("Error saving socket ID to session:", err);
                                } else {
                                    console.log("New socket ID saved to session:", user.socketid);
                                }
                            });
                        }
                        socket.send(JSON.stringify({
                            type: 'socket_id',
                            id: user.socketid
                        }));
                    } else {
                        console.log("User does not have a socket ID");
                        //generate a new socket ID and send to user after saving to the database
                        let newSocketId = uuid();
                        user.socketid = newSocketId;
                        socketId = newSocketId;
                        db.users.updateUser(user, (err, updatedUser) => {
                            if (err) {
                                console.error("Error updating user:", err);
                            } else {
                                console.log("User's socket ID updated:", newSocketId);
                                req.session.socketId = newSocketId;
                                req.session.save((err) => {
                                    if (err) {
                                        console.error("Error saving socket ID to session:", err);
                                    } else {
                                        console.log("New socket ID saved to session:", newSocketId);
                                    }
                                });
                            }
                        });
                        socket.send(JSON.stringify({
                            type: 'socket_id',
                            id: newSocketId
                        }));
                    }
                }
            });
        }
        // Attach socket ID to socket instance
        socket.id = socketId;

        socket.on("message", async function(message) {
            if(req.session && req.session.esifleettool?.loggedIn) {
                const messageStr = Buffer.from(message).toString();
                let messageData;
                
                try {
                    messageData = JSON.parse(messageStr);
                } catch (e) {
                    console.error("Invalid message format:", messageStr);
                    return;
                }

                console.log("Received message:", messageStr);
                
                switch(messageData.type) {
                    case 'get_character_token':
                        //won't be implemented. it was just a test
                        break;

                    default:
                        // Send back socket ID to confirm connection
                        socket.send(JSON.stringify({
                            type: 'socket_id',
                            id: socket.id
                        }));
                        break;
                }
            }
        });

        // Send initial socket ID
        socket.send(JSON.stringify({
            type: 'socket_id',
            id: socket.id
        }));
    });

    return wsServer;
}