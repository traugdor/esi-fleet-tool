const axios = require('axios');
const characters = require('../db/characters');
const settings = require('../../settings');

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Get current ship information for a character
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Ship information including type, name, and location
 */
async function getShipInfo(characterId) {
    return new Promise((resolve, reject) => {
        // Get character's access token from database
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                // Get current ship information
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/ship/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data) {
                    reject(new Error('Invalid ship data received from ESI'));
                    return;
                }

                resolve(response.data);
            } catch (error) {
                reject(error);
            }
        });
    });
}

/**
 * Get detailed information about a specific ship type
 * @param {number} shipTypeId - The ship type ID
 * @returns {Promise<Object>} Detailed ship type information
 */
async function getShipType(shipTypeId) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(
                `${ESI_BASE_URL}/universe/types/${shipTypeId}/`
            );

            if (!response.data) {
                reject(new Error('Invalid ship type data received from ESI'));
                return;
            }

            resolve(response.data);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get current ship fitting for a character
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Ship fitting information including modules
 */
async function getShipFittings(characterId) {
    return new Promise((resolve, reject) => {
        // Get character's access token from database
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                // Get current ship fitting
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/fittings/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data) {
                    reject(new Error('Invalid fitting data received from ESI'));
                    return;
                }

                resolve(response.data);
            } catch (error) {
                reject(error);
            }
        });
    });
}

/**
 * Get ship icon URLs
 * @param {number} shipTypeId - The ship type ID
 * @returns {Promise<Object>} Object containing different size icon URLs
 */
async function getShipIcon(shipTypeId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Get ship type information which includes icon IDs
            const typeInfo = await getShipType(shipTypeId);
            
            // Construct icon URLs
            const iconUrls = {
                px64: `https://images.evetech.net/types/${shipTypeId}/icon?size=64`,
                px128: `https://images.evetech.net/types/${shipTypeId}/icon?size=128`,
                px256: `https://images.evetech.net/types/${shipTypeId}/render?size=256`,
                px512: `https://images.evetech.net/types/${shipTypeId}/render?size=512`
            };

            resolve(iconUrls);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get comprehensive ship information including type, fitting, and icons
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Complete ship information
 */
async function getFullShipInfo(characterId) {
    try {
        const shipInfo = await getShipInfo(characterId);
        const [typeInfo, fitting, icons] = await Promise.all([
            getShipType(shipInfo.ship_type_id),
            getShipFittings(characterId),
            getShipIcon(shipInfo.ship_type_id)
        ]);

        return {
            shipInfo,
            typeInfo,
            fitting,
            icons
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Get a character's jump clones
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Array>} Array of jump clone information
 */
async function getJumpClones(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/clones/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data) {
                    reject(new Error('Invalid clone data received from ESI'));
                    return;
                }

                resolve(response.data);
            } catch (error) {
                reject(error);
            }
        });
    });
}

/**
 * Get a character's active implants
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Array>} Array of active implant type IDs
 */
async function getActiveImplants(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/implants/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data) {
                    reject(new Error('Invalid implant data received from ESI'));
                    return;
                }

                resolve(response.data);
            } catch (error) {
                reject(error);
            }
        });
    });
}

/**
 * Get detailed information about a character's clone state
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Complete clone state information
 */
async function getFullCloneInfo(characterId) {
    try {
        const [clones, implants] = await Promise.all([
            getJumpClones(characterId),
            getActiveImplants(characterId)
        ]);

        return {
            clones,
            implants
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Get a character's online status
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Online status information including last_login and last_logout
 */
async function getCharacterOnlineStatus(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/online/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Retrieved online status for character ${characterId}`);
                resolve(response.data);
            } catch (error) {
                console.error('Error getting character online status:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Get a character's current ship type
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Ship type information including ship_type_id
 */
async function getCharacterShipType(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/ship/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Retrieved ship type for character ${characterId}`);
                resolve(response.data);
            } catch (error) {
                console.error('Error getting character ship type:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Refresh an access token using the refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} New access token and expiry
 */
async function refreshAccessToken(refreshToken) {
    try {
        const response = await axios.post('https://login.eveonline.com/v2/oauth/token', 
            new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${settings.EVEclientID}:${settings.EVEsecretKey}`).toString('base64')}`
            }
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresAt: new Date(Date.now() + (response.data.expires_in * 1000))
        };
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}

/**
 * Check and refresh tokens for all characters if needed
 */
async function checkAndRefreshTokens() {
    try {
        // Get all characters from database
        characters.getAllCharacters((err, chars) => {
            if (err) console.error('Error getting characters:', err);
            if(chars) {
                const oneHourFromNow = new Date(Date.now() + (60 * 60 * 1000));

                for (const character of chars) {
                    try {
                        const expiresAt = new Date(character.expiresAt);
                        
                        // Check if token expires in less than an hour
                        if (expiresAt < oneHourFromNow) {
                            console.log(`Refreshing token for character ${character.characterName} (${character.characterId})`);
                            
                            // Refresh the token
                            refreshAccessToken(character.refreshToken)
                            .then((newTokens) => {
                                // Update character in database
                                character.accessToken = newTokens.accessToken;
                                character.refreshToken = newTokens.refreshToken;
                                character.expiresAt = newTokens.expiresAt;
                                characters.updateCharacter(character, (err, updatedChar) => {
                                    if (err) console.error(`Error updating character ${character.characterName}:`, err);
                                    else console.log(`Successfully updated character ${character.characterName}`);
                                });

                                console.log(`Successfully refreshed token for ${character.characterName}`);
                            })
                            .catch((error) => {
                                console.error(`Error refreshing token for character ${character.characterName}:`, error);
                                // Continue with next character even if one fails
                                return;
                            });
                        }
                    } catch (error) {
                        console.error(`Error refreshing token for character ${character.characterName}:`, error);
                        // Continue with next character even if one fails
                        continue;
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in checkAndRefreshTokens:', error);
    }
}

// Start the token refresh check interval when the module is loaded
setInterval(checkAndRefreshTokens, 60 * 60 * 1000); // Run every hour
// Also run it immediately on startup
checkAndRefreshTokens();

module.exports = {
    // Ship-related functions
    getShipInfo,
    getShipType,
    getShipFittings,
    getShipIcon,
    getFullShipInfo,

    // Clone-related functions
    getJumpClones,
    getActiveImplants,
    getFullCloneInfo,

    // Character-related functions
    getCharacterOnlineStatus,
    getCharacterShipType,

    // Token refresh functions
    refreshAccessToken,
    checkAndRefreshTokens
};
