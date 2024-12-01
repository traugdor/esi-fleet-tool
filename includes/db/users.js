const db = require("node-persist");
const { v4: uuid } = require("uuid");

db.initSync({});

db.getItem('users').then(function(users){
    //check to see if users exists in the db
    if (!users) {
        var userarray = []; //initalize blank array
        db.setItem('users', userarray);
    }
});

/*
    user structure: 
    _id            - generated uuid for each user
    did            - discord id
    character_info - array of strings
    socketid       - websocket id for this user for this session (agnostic of character or fleet)
*/

/**
 * 
 * @function allUsers
 * @param {*} callback Usage: function(response) { ... }
 */

function getallUsers(callback){
    db.getItem('users').then((users) => {
        callback(users);
    });
}

exports.allUsers = getallUsers;

/**
 * 
 * @param {*} data {_id, did, character_info, socketid}
 * @param {*} callback function(error, response) { ... }
 */

exports.saveNewUser = function(data, callback) {
    const {_id, did, character_info, socketid} = data;
    
    // Validate and convert character_info to array of strings
    let validatedCharInfo;
    try {
        if (!Array.isArray(character_info)) {
            validatedCharInfo = [String(character_info)];
        } else {
            validatedCharInfo = character_info.map(String);
        }
    } catch (error) {
        return callback("character_info must be convertible to string array", null);
    }

    //first make sure id = 0; If we send an actual id then fail
    if(_id == 0){
        //lookup user first
        db.getItem('users').then((users) => {
            var user = users.find(function(user) {
                return (user.did == did)
            });
            if(user) {
                callback(`User with DiscordID ${did} already exists!`, null);
            } else {
                var id = uuid();
                var newuser = {
                    _id:id,
                    did:did,
                    character_info:validatedCharInfo,
                    socketid: socketid == null || socketid == undefined ? 0 : socketid
                }
                users.push(newuser);
                db.setItem('users', users).then(callback(null, newuser));
            }
        });
    }
}

/**
 * 
 * @param {*} data {did}
 * @param {*} callback function(error, response) { ... }
 */

exports.getUserByDiscordid = function(data, callback) {
    const {did} = data;
    //get users and lookup
    db.getItem('users').then(users => {
        var user = users.find(user => user.did == did);
        if(!user) {
            callback(`User with DiscordID ${did} was not found!`, null);
        } else 
            callback(null, user); 
    });
}

/**
 * 
 * @param {*} data {type, did, character_info, socketid}
 * @param {*} callback function(error, response) { ... }
 */

exports.updateUser = function(data, callback) {
    const {type, did, character_info, socketid} = data;
    db.getItem('users').then((users) => {
        var user = users.find(function(user) {
            return (user.did == did)
        });
        if(user) {
            user.type = type;
            user.character_info = character_info;
            user.socketid = socketid;
            db.setItem('users', users).then(callback(null, user));
        } else {
            callback(`User with DiscordID ${did} was not found!`, null);
        }
    });
}