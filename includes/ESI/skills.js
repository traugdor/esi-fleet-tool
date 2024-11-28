const axios = require('axios');
const characters = require('../db/characters');

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Get all skills for a character and save them to the database
 * @param {number} characterId - The EVE character ID
 * @param {string} accessToken - The character's access token
 * @returns {Promise<Array>} Array of character skills with levels
 */
async function getAndSaveCharacterSkills(characterId, accessToken) {
    return new Promise((resolve, reject) => {
        try {
            // Get character skills from ESI
            axios.get(`${ESI_BASE_URL}/characters/${characterId}/skills/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }).then(response => {
                if (!response.data || !response.data.skills) {
                    reject(new Error('Invalid skill data received from ESI'));
                    return;
                }

                const skills = response.data.skills.map(skill => ({
                    skillId: skill.skill_id,
                    level: skill.trained_skill_level
                }));

                // Get existing character data
                characters.getCharacterInfo({ characterId }, (err, character) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Update character's skills
                    character.characterInfo = character.characterInfo || {};
                    character.characterInfo.skills = skills;

                    // Save updated character data
                    characters.updateCharacter(character, (err, updatedCharacter) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(skills);
                    });
                });
            }).catch(error => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get character skills from database
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Array|null>} Array of character skills with levels or null if not found
 */
async function getCharacterSkills(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, (err, character) => {
            if (err) {
                resolve(null); // Character not found
                return;
            }
            
            if (!character.characterInfo || !character.characterInfo.skills) {
                resolve(null);
                return;
            }

            resolve(character.characterInfo.skills);
        });
    });
}

/**
 * Update character skills in database
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Array>} Updated array of character skills
 */
async function updateCharacterSkills(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const skills = await getAndSaveCharacterSkills(characterId, character.accessToken);
                resolve(skills);
            } catch (error) {
                reject(error);
            }
        });
    });
}

module.exports = {
    getCharacterSkills,
    updateCharacterSkills,
    getAndSaveCharacterSkills
};
