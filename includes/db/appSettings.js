const db = require("node-persist");

db.initSync({});

db.getItem('appSettings').then(function(settings){
    //check to see if settings exists in the db
    if(!settings) {
        var settings = {
            guildid:null, 
            allowedRoles:[]
        };
        db.setItem('appSettings', settings);
    }
})

/**
 * 
 * @param {*} callback function(guildid) { ... }
 */

exports.getAllowedGuild = function(callback){
    db.getItem('appSettings').then(settings => {
        callback(settings.guildid);
    })
}

/**
 * Returns a code. 1 = success; 2 = override failed to validate
 * 
 * @param {*} data {guildid, override}
 * @param {*} callback function(error, code) { ... }
 */

exports.setAllowedGuild = function(data, callback) {
    const{guildid, override} = data;
    db.getItem('appSettings').then(settings => {
        //find a way to calculate an override so that this cannot be executed without one from the UI  <<--- important
        if(override) {
            settings.guildid = guildid;
            db.setItem('appSettings', settings).then(() => { callback(null, 1) }); // 1 = success
        } else {
            callback(null, 2); //2 = needs override!
        }
    })
}

/**
 * 
 * @param {*} callback function(roles) { ... }
 */

exports.getAllowedRoles = function(callback) {
    db.getItem('appSettings').then(settings =>{
        callback(settings.allowedRoles);
    })
}

/**
 * Returns a code. 1 = success; 2 = override failed to validate
 * 
 * @param {*} data {roles, override}
 * @param {*} callback function(error, code) { ... }
 */

exports.setAllowedRoles = function (data, callback) {
    const{roles, override} = data;
    db.getItem('appSettings').then(settings => {
        //find a way to calculate an override so that this cannot be executed without one from the UI  <<--- important
        if(override) {
            if(roles instanceof Array){
                //replace
                settings.allowedRoles = roles;
                db.setItem('appSettings', settings).then(() => { callback(null, 1) }); // 1 = success
            } else {
                callback("Error: roles needs to be an array.", -1); //error roles needs to be array
            }
        } else {
            callback (null, 2); // 2 = needs override!
        }
    })
}