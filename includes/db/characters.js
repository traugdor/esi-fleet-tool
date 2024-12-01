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
        skills: [{skillID, level}]
        publicInfo: {
            corporation: {...},
            alliance: {...},
            ...other ESI data
        }
*/

exports.getAllCharacters = function(callback) {
    db.getItem('characters').then((characters) => {
        callback(null, characters);
    });
}

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

exports.updateCharacter = function(data, callback) {
    const {characterId, accessToken, refreshToken, expiresAt, characterName, corporationId, corporationName, allianceId, allianceName, characterInfo} = data;
    db.getItem('characters').then((characters) => {
        var character = characters.find(function(character) {
            return (character.characterId == characterId)
        });
        if(character) {
            character.accessToken = accessToken;
            character.refreshToken = refreshToken;
            character.expiresAt = expiresAt;
            character.characterName = characterName;
            character.corporationId = corporationId;
            character.corporationName = corporationName;
            character.allianceId = allianceId;
            character.allianceName = allianceName;
            character.characterInfo = characterInfo;
            db.setItem('characters', characters).then(() => {
                callback(null, character);
            });
        } else {
            callback(`Character with characterId ${characterId} was not found!`, null);
        }
    });
}

/**
 * Save or update character's public information from ESI
 * @param {number} characterId - The character ID
 * @param {Object} publicInfo - The public information from ESI
 * @param {function} callback - Callback function(error, character)
 */
exports.saveCharacterInfo = function(characterId, publicInfo, callback) {
    db.getItem('characters').then((characters) => {
        var character = characters.find(function(character) {
            return (character.characterId == characterId)
        });
        if(character) {
            // Create characterInfo if it doesn't exist
            if (!character.characterInfo) {
                character.characterInfo = {};
            }
            // Save public info
            character.characterInfo.publicInfo = publicInfo;
            // Update basic character data
            if (publicInfo.corporation) {
                character.corporationId = publicInfo.corporation.corporation_id;
                character.corporationName = publicInfo.corporation.name;
            }
            if (publicInfo.alliance) {
                character.allianceId = publicInfo.alliance.alliance_id;
                character.allianceName = publicInfo.alliance.name;
            }
            db.setItem('characters', characters).then(() => {
                callback(null, character);
            });
        } else {
            callback(`Character with characterId ${characterId} was not found!`, null);
        }
    });
};