const db = require("node-persist");

db.initSync({});

db.getItem('characters').then(function(characters){
    //check to see if characters exists in the db
    if(!characters) {
        var characterarray = [];
        db.setItem('characters', characterarray);
    }
});

