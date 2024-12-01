const db = require("node-persist");
const { v4: uuid } = require('uuid');

db.initSync({});

db.getItem('fleets').then(function(fleets){
    //check to see if fleets exists in the db
    if(!fleets) {
        var fleetarray = [];
        db.setItem('fleets', fleetarray);
    }
});

/*
    fleet structure:

    _id            - generated uuid for each fleet
    fcId          - discord ID of fleet commander
    doctrine      - name of doctrine
    fittings      - array of allowed fitting IDs
    date          - date of fleet
    time          - time of fleet
    description   - fleet description
    title         - fleet title
    onDemand      - boolean if fleet is on-demand
    respondedUsers - array of user IDs who responded
    plannedMembers - array of objects containing:
        userId
        roles: [{
            role: string,
            count: number
        }]
        totalCharacters: number
        splitBrain: boolean
*/

/**
 * Save a new fleet to the database
 * @param {*} data {fcId, doctrine, fittings, date, time, description, title, onDemand}
 * @param {*} callback function(error, response) { ... }
 */
exports.saveNewFleet = function(data, callback) {
    const {fcId, doctrine, fittings, date, time, description, title, onDemand} = data;
    
    db.getItem('fleets').then((fleets) => {
        var fleet = {
            _id: uuid(),
            fcId,
            doctrine,
            fittings: Array.isArray(fittings) ? fittings : [],
            date,
            time,
            description,
            title,
            onDemand: onDemand || false,
            respondedUsers: [],
            plannedMembers: []
        };
        
        fleets.push(fleet);
        db.setItem('fleets', fleets).then(() => {
            callback(null, fleet);
        });
    });
}

/**
 * Update an existing fleet in the database
 * @param {*} data {_id, fcId, doctrine, fittings, date, time, description, title, onDemand}
 * @param {*} callback function(error, response) { ... }
 */
exports.updateFleet = function(data, callback) {
    const {_id, fcId, doctrine, fittings, date, time, description, title, onDemand} = data;
    
    if (!_id) {
        return callback("Fleet ID is required for update!", null);
    }
    
    db.getItem('fleets').then((fleets) => {
        var fleet = fleets.find(fleet => fleet._id === _id);
        if (!fleet) {
            callback(`Fleet with ID ${_id} was not found!`, null);
        } else {
            // Update fleet properties, preserving existing values if new ones are blank/undefined
            fleet.fcId = fcId || fleet.fcId;
            fleet.doctrine = doctrine || fleet.doctrine;
            fleet.fittings = Array.isArray(fittings) && fittings.length > 0 ? fittings : fleet.fittings;
            fleet.date = date || fleet.date;
            fleet.time = time || fleet.time;
            fleet.description = description !== undefined ? description : fleet.description;
            fleet.title = title || fleet.title;
            fleet.onDemand = onDemand !== undefined ? onDemand : fleet.onDemand;
            fleet.respondedUsers = fleet.respondedUsers;
            fleet.plannedMembers = fleet.plannedMembers;
            
            db.setItem('fleets', fleets).then(() => {
                callback(null, fleet);
            });
        }
    });
}

/**
 * Add or update a user's response to a fleet
 * @param {*} data {_id, userId, plannedMember}
 * @param {*} callback function(error, response) { ... }
 */
exports.addFleetResponse = function(data, callback) {
    const {_id, userId, plannedMember} = data;
    
    if (!_id || !userId) {
        return callback("Fleet ID and User ID are required!", null);
    }
    
    db.getItem('fleets').then((fleets) => {
        var fleet = fleets.find(fleet => fleet._id === _id);
        if (!fleet) {
            callback(`Fleet with ID ${_id} was not found!`, null);
        } else {
            // Initialize arrays if they don't exist
            fleet.respondedUsers = fleet.respondedUsers || [];
            fleet.plannedMembers = fleet.plannedMembers || [];
            
            // Add user to respondedUsers if not already present
            if (!fleet.respondedUsers.includes(userId)) {
                fleet.respondedUsers.push(userId);
            }
            
            // Update or add plannedMember entry
            const memberIndex = fleet.plannedMembers.findIndex(member => member.userId === userId);
            if (memberIndex !== -1) {
                fleet.plannedMembers[memberIndex] = {
                    userId,
                    ...plannedMember
                };
            } else {
                fleet.plannedMembers.push({
                    userId,
                    ...plannedMember
                });
            }
            
            db.setItem('fleets', fleets).then(() => {
                callback(null, fleet);
            });
        }
    });
}

/**
 * Remove a user's response from a fleet
 * @param {*} data {_id, userId}
 * @param {*} callback function(error, response) { ... }
 */
exports.removeFleetResponse = function(data, callback) {
    const {_id, userId} = data;
    
    if (!_id || !userId) {
        return callback("Fleet ID and User ID are required!", null);
    }
    
    db.getItem('fleets').then((fleets) => {
        var fleet = fleets.find(fleet => fleet._id === _id);
        if (!fleet) {
            callback(`Fleet with ID ${_id} was not found!`, null);
        } else {
            // Remove user from respondedUsers
            fleet.respondedUsers = (fleet.respondedUsers || []).filter(id => id !== userId);
            
            // Remove user from plannedMembers
            fleet.plannedMembers = (fleet.plannedMembers || []).filter(member => member.userId !== userId);
            
            db.setItem('fleets', fleets).then(() => {
                callback(null, fleet);
            });
        }
    });
}

/**
 * Update a user's planned member entry in a fleet
 * @param {*} data {_id, userId, plannedMember}
 * @param {*} callback function(error, response) { ... }
 */
exports.updateFleetMemberPlan = function(data, callback) {
    const {_id, userId, plannedMember} = data;
    
    if (!_id || !userId) {
        return callback("Fleet ID and User ID are required!", null);
    }
    
    db.getItem('fleets').then((fleets) => {
        var fleet = fleets.find(fleet => fleet._id === _id);
        if (!fleet) {
            callback(`Fleet with ID ${_id} was not found!`, null);
        } else {
            // Initialize plannedMembers if it doesn't exist
            fleet.plannedMembers = fleet.plannedMembers || [];
            
            // Update plannedMember entry
            const memberIndex = fleet.plannedMembers.findIndex(member => member.userId === userId);
            if (memberIndex !== -1) {
                fleet.plannedMembers[memberIndex] = {
                    userId,
                    ...plannedMember
                };
                
                db.setItem('fleets', fleets).then(() => {
                    callback(null, fleet);
                });
            } else {
                callback(`User ${userId} is not a planned member of this fleet!`, null);
            }
        }
    });
}

/**
 * Delete a fleet from the database
 * @param {*} data {_id}
 * @param {*} callback function(error, response) { ... }
 */
exports.deleteFleet = function(data, callback) {
    const {_id} = data;
    
    db.getItem('fleets').then((fleets) => {
        var fleetIndex = fleets.findIndex(fleet => fleet._id === _id);
        if (fleetIndex === -1) {
            callback(`Fleet with ID ${_id} was not found!`, null);
        } else {
            var deletedFleet = fleets.splice(fleetIndex, 1)[0];
            db.setItem('fleets', fleets).then(() => {
                callback(null, deletedFleet);
            });
        }
    });
}

/**
 * Get a fleet by its ID
 * @param {*} data {_id}
 * @param {*} callback function(error, response) { ... }
 */
exports.getFleetById = function(data, callback) {
    const {_id} = data;
    
    db.getItem('fleets').then((fleets) => {
        var fleet = fleets.find(fleet => fleet._id === _id);
        if (!fleet) {
            callback(`Fleet with ID ${_id} was not found!`, null);
        } else {
            callback(null, fleet);
        }
    });
}

/**
 * Get all fleets for a specific FC
 * @param {*} data {fcId}
 * @param {*} callback function(error, response) { ... }
 */
exports.getFleetsByFc = function(data, callback) {
    const {fcId} = data;
    
    db.getItem('fleets').then((fleets) => {
        var fcFleets = fleets.filter(fleet => fleet.fcId === fcId);
        callback(null, fcFleets);
    });
}