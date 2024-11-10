const db = require("node-persist");

db.initSync({});

db.getItem('users').then(function(users){
    //check to see if users exists in the db
    if (!users) {
        var userarray = []; //initalize blank array
        db.setItem('users', userarray);
    }
});

/**
 * 
 * @function allUsers
 * @param {*} callback Usage: function(response) { ... }
 */

exports.allUsers = function(callback){
    db.getItem('users').then((users) => {
        callback(users);
    });
}

/**
 * 
 * @param {*} data {_id, type, did, eid, character_info, access_token, refresh_token, username, password}
 * @param {*} callback function(error, response) { ... }
 */

exports.saveNewUser = function(data, callback) {
    const {_id, type, did, eid, character_info, access_token, refresh_token, username, password} = data;
    //first make sure id = 0; If we send an actual id then fail
    if(_id == 0){
        //lookup user first
        db.getItem('users').then((users) => {
            user = users.find(function(user) {
                return (user.type == 1 && user.username == username) || (user.type == 2 && user.did == did)
            });
            if(user) {
                callback(`User of type ${type}, DiscordID ${did} or username ${username} already exists!`, null);
            } else {
                var id = uuid();
                var newuser = {
                    _id:id,
                    type:type,
                    did:did,
                    eid:eid,
                    character_info:character_info,
                    access_token:access_token,
                    refresh_token:refresh_token,
                    username:username,
                    password:password
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
        user = users.find(user => user.type == 2 && user.did == did);
        console.log(user);
        if(!user) {
            callback(`User with DiscordID ${did} was not found!`, null);
        } else 
            callback(null, user); 
    });
}

/**
 * 
 * @param {*} data {eid}
 * @param {*} callback function(error, response) { ... }
 */

exports.getUserByEVEid = function(data, callback){
    const {eid} = data;
    db.getItem('users').then(users => {
        user = users.find(user => user.type == 2 && user.eid == eid);
        if(!user) {
            callback(`User with EVE ID ${eid} was not found!`, null);
        } else 
            callback(null, user); 
    })
}

/**
 * 
 * @param {*} data {username, password}
 * @param {*} callback function(error, response) { ... }
 */

exports.getUserByUsernameAndPassword = function(data, callback) {
    const {username, password} = data;
    db.getItem('users').then(users =>{
        user = users.find(user => user.type == 1 && user.username == username && user.password == password);
        if(!user){
            callback(`User with username ${username} was not found!`, null);
        } else {
            callback(null, user);
        }
    })
}