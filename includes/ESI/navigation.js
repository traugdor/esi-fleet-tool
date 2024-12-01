const axios = require('axios');
const characters = require('../db/characters');

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Get a character's current location
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Location information including solar_system_id
 */
async function getCharacterLocation(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/location/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Retrieved location for character ${characterId}`);
                resolve(response.data);
            } catch (error) {
                console.error('Error getting character location:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Get a character's jump fatigue information
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Fatigue information including jump_fatigue_expire_date and last_jump_date
 */
async function getJumpFatigue(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/fatigue/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Retrieved jump fatigue for character ${characterId}`);
                resolve(response.data);
            } catch (error) {
                console.error('Error getting jump fatigue:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Set destination waypoint for a character
 * @param {number} characterId - The EVE character ID
 * @param {number} destinationId - The destination ID (station, structure, or solar system ID)
 * @param {Object} options - Waypoint options
 * @param {boolean} [options.addToBeginning=false] - Add waypoint to beginning of route
 * @param {boolean} [options.clearOtherWaypoints=false] - Clear other waypoints
 * @returns {Promise<void>}
 */
async function setWaypoint(characterId, destinationId, options = {}) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                await axios.post(
                    `${ESI_BASE_URL}/ui/autopilot/waypoint/`,
                    null,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        },
                        params: {
                            destination_id: destinationId,
                            add_to_beginning: options.addToBeginning || false,
                            clear_other_waypoints: options.clearOtherWaypoints || false
                        }
                    }
                );

                console.log(`Set waypoint for character ${characterId} to destination ${destinationId}`);
                resolve();
            } catch (error) {
                console.error('Error setting waypoint:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

module.exports = {
    getCharacterLocation,
    getJumpFatigue,
    setWaypoint
};
