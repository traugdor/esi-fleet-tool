const db = require("node-persist");
const { v4: uuid } = require('uuid');

db.initSync({});

db.getItem('fleettemplates').then(function(fleettemplates){
    //check to see if characters exists in the db
    if(!fleettemplates) {
        var fleettemplatesarray = [];
        db.setItem('fleettemplates', fleettemplatesarray);
    }
});

/**
 * Save a new fleet template to the database
 * @param {*} data {fcId, name, template}
 * @param {*} callback function(error, response) { ... }
 */
exports.saveNewFleetTemplate = function(data, callback) {
    const {fcId, name, template} = data;
    
    db.getItem('fleettemplates').then((fleettemplates) => {
        var fleettemplate = {
            _id: uuid(),
            fcId,
            name,
            template
        };

        fleettemplates.forEach((fleettemplate) => {
            if (fleettemplate.name === name) {
                return callback(`Fleet template with name ${name} already exists!`, null);
            }
        });
        
        fleettemplates.push(fleettemplate);
        db.setItem('fleettemplates', fleettemplates).then(() => {
            callback(null, fleettemplate);
        });
    });
}

/**
 * Get a fleet template by its ID
 * @param {*} data {templateId}
 * @param {*} callback function(error, response) { ... }
 */

exports.getFleetTemplateById = function(data, callback) {
    const { templateId } = data;
    
    db.getItem('fleettemplates').then((fleettemplates) => {
        var fleettemplate = fleettemplates.find(fleettemplate => fleettemplate._id === templateId);
        if (!fleettemplate) {
            callback(`Fleet template with ID ${templateId} was not found!`, null);
        } else {
            callback(null, fleettemplate);
        }
    });
}