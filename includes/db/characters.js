const db = require("node-persist");

db.initSync({});

db.getItem('characters').then(function(characters){
    //check to see if characters exists in the db
    if(!characters) {
        var characterarray = [];
        db.setItem('characters', characterarray);
    }
});

/*
    character structure:

    ID
    characterId
    accessToken
    refreshToken
    expiresAt
    characterName
    corporationId
    corporationName
    allianceId
    allianceName
    characterInfo

    characterInfo structure:
        
*/

exports.getCharacterInfo = function(data, callback) {
    const {characterId} = data;
    db.getItem('characters').then((characters) => {
        var character = characters.find(function(character) {
            return (character.characterId == characterId)
        });
        if(character) {
            callback(null, character);
        } else {
            callback(`Character with characterId ${characterId} was not found!`, null);
        }
    });
}

exports.saveNewCharacter = function(data, callback) {
    const {characterId, accessToken, refreshToken, expiresAt, characterName, corporationId, corporationName, allianceId, allianceName, characterInfo} = data;
    //check if character already exists... use characterId as key
    db.getItem('characters').then((characters) => {
        var character = {
            characterId:characterId,
            accessToken:accessToken,
            refreshToken:refreshToken,
            expiresAt:expiresAt,
            characterName:characterName,
            corporationId:corporationId,
            corporationName:corporationName,
            allianceId:allianceId,
            allianceName:allianceName,
            characterInfo:characterInfo
        };
        if (characters.find(function(character) {
            return (character.characterId == characterId)
        })) {
            callback(`Character with characterId ${characterId} already exists!`, null);
        } else {
            characters.push(character);
            db.setItem('characters', characters).then(() => {
                callback(null, character);
            });
        }
    });
}