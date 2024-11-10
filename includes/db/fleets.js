const db = require("node-persist");

db.initSync({});

db.getItem('fleets').then(function(characters){
    //check to see if characters exists in the db
    if(!characters) {
        var fleetarray = [];
        db.setItem('fleets', fleetarray);
    }
});

/*
    fleet structure:

    ID
    FC
    Doctrine
    Allowed fittings
    date
    time
    description
    title
    ?
    on-demand?
    responded users
    planned members
        uid
        roles
            role
            number of each role
        total number of characters planned
        split-brain yes or no




    need functions for:

    remove old fleets
    create fleet
    edit fleet
    delete fleet
    get all fleets
    get all current fleets
    get all planned fleets
    get specific fleet using fleet id
    ?
*/