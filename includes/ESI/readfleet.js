const axios = require('axios');
const characters = require('../db/characters');
const fleettemplates = require('../db/fleettemplates');
const uuid = require('uuid');
const settings = require('../../settings');

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Fleet role enumeration
 */
const FleetRole = {
    FLEET_COMMANDER: 'fleet_commander',
    WING_COMMANDER: 'wing_commander',
    SQUAD_COMMANDER: 'squad_commander',
    SQUAD_MEMBER: 'squad_member'
};

/**
 * Get character's fleet information
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object|null>} Fleet information or null if not in fleet
 */
async function getCharacterFleet(characterId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/characters/${characterId}/fleet/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                // If character is not in a fleet, this endpoint returns 404
                if (response.status === 404) {
                    resolve(null);
                    return;
                }

                if (!response.data) {
                    reject(new Error('Invalid fleet data received from ESI'));
                    return;
                }

                resolve(response.data);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    // Character is not in a fleet
                    resolve(null);
                } else {
                    reject(error);
                }
            }
        });
    });
}

/**
 * Get fleet information
 * @param {number} characterId - The EVE character ID of a fleet member
 * @param {number} fleetId - The fleet ID
 * @returns {Promise<Object>} Detailed fleet information
 */
async function getFleetInfo(characterId, fleetId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/fleets/${fleetId}/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data) {
                    reject(new Error('Invalid fleet info received from ESI'));
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
 * Get fleet members
 * @param {number} characterId - The EVE character ID of a fleet member
 * @param {number} fleetId - The fleet ID
 * @returns {Promise<Array>} Array of fleet members
 */
async function getFleetMembers(characterId, fleetId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/fleets/${fleetId}/members/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data) {
                    reject(new Error('Invalid fleet members data received from ESI'));
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
 * Get fleet wings
 * @param {number} characterId - The EVE character ID of a fleet member
 * @param {number} fleetId - The fleet ID
 * @returns {Promise<Array>} Array of fleet wings
 */
async function getFleetWings(characterId, fleetId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                const response = await axios.get(
                    `${ESI_BASE_URL}/fleets/${fleetId}/wings/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data) {
                    reject(new Error('Invalid fleet wings data received from ESI'));
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
 * Check if a character has a leadership role in their fleet
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object>} Object containing leadership role flags
 */
async function getFleetLeadershipRole(characterId) {
    try {
        const characterFleet = await getCharacterFleet(characterId);
        if (!characterFleet) {
            return {
                isInFleet: false,
                isFleetCommander: false,
                isWingCommander: false,
                isSquadCommander: false,
                role: null,
                fleetId: null,
                wingId: null,
                squadId: null
            };
        }

        // Get fleet members to verify leadership roles
        const members = await getFleetMembers(characterId, characterFleet.fleet_id);
        const member = members.find(m => m.character_id === characterId);

        return {
            isInFleet: true,
            isFleetCommander: characterFleet.role === FleetRole.FLEET_COMMANDER,
            isWingCommander: characterFleet.role === FleetRole.WING_COMMANDER,
            isSquadCommander: characterFleet.role === FleetRole.SQUAD_COMMANDER,
            role: characterFleet.role,
            fleetId: characterFleet.fleet_id,
            wingId: characterFleet.wing_id,
            squadId: characterFleet.squad_id,
            memberInfo: member || null
        };
    } catch (error) {
        throw new Error(`Failed to check fleet leadership role: ${error.message}`);
    }
}

/**
 * Get comprehensive fleet information including members and wings
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object|null>} Complete fleet information or null if not in fleet
 */
async function getFullFleetInfo(characterId) {
    try {
        // First check if character is in a fleet
        const characterFleet = await getCharacterFleet(characterId);
        if (!characterFleet) {
            return null;
        }

        // Get all fleet information in parallel
        const [fleetInfo, members, wings, leadershipRole] = await Promise.all([
            getFleetInfo(characterId, characterFleet.fleet_id),
            getFleetMembers(characterId, characterFleet.fleet_id),
            getFleetWings(characterId, characterFleet.fleet_id),
            getFleetLeadershipRole(characterId)
        ]);

        return {
            fleetId: characterFleet.fleet_id,
            role: characterFleet.role,
            squadId: characterFleet.squad_id,
            wingId: characterFleet.wing_id,
            info: fleetInfo,
            members: members,
            wings: wings,
            leadership: leadershipRole
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Captures the current fleet structure and settings if the character is in a leadership position
 * @param {number} characterId - The EVE character ID
 * @returns {Promise<Object|null>} Fleet structure and settings or null if not in leadership
 */
async function captureFleetStructure(characterId) {
    try {
        const leadershipRole = await getFleetLeadershipRole(characterId);
        
        // Only proceed if character has a leadership role
        if (!leadershipRole.isFleetCommander && 
            !leadershipRole.isWingCommander && 
            !leadershipRole.isSquadCommander) {
            console.log('Character does not have a leadership role in the fleet');
            return null;
        }

        const fleetInfo = await getFleetInfo(characterId, leadershipRole.fleetId);
        const wings = await getFleetWings(characterId, leadershipRole.fleetId);

        // Create fleet settings object
        const fleetSettings = {
            isFreeMove: fleetInfo.is_free_move,
            motd: fleetInfo.motd,
            fleetId: leadershipRole.fleetId,
            timestamp: new Date().toISOString()
        };

        // Create wing structure object
        const wingStructure = wings.map(wing => ({
            wingId: wing.id,
            name: wing.name || `Wing ${wing.id}`
        }));

        // Create squad layout object
        const squadLayout = wings.map(wing => ({
            wingId: wing.id,
            squads: wing.squads.map(squad => ({
                squadId: squad.id,
                name: squad.name || `Squad ${squad.id}`
            }))
        }));

        // Print the objects to console
        console.log('Fleet Settings:', JSON.stringify(fleetSettings, null, 2));
        console.log('Wing Structure:', JSON.stringify(wingStructure, null, 2));
        console.log('Squad Layout:', JSON.stringify(squadLayout, null, 2));

        // Save the fleet structure to the database
        let fleetData = {
            fcId: characterId,
            name: fleetInfo.name,
            template: {
                settings: fleetSettings,
                wings: wingStructure,
                squads: squadLayout
            }
        };

        fleetTemplates.saveNewFleetTemplate(fleetData, (err, response) => {
            if (err) {
                console.error('Error saving fleet template:', err);
            } else {
                console.log('Fleet template saved successfully:', response);
            }
        });

        return {
            settings: fleetSettings,
            wings: wingStructure,
            squads: squadLayout
        };
    } catch (error) {
        console.error('Error capturing fleet structure:', error);
        throw error;
    }
}

module.exports = {
    FleetRole,
    getCharacterFleet,
    getFleetInfo,
    getFleetMembers,
    getFleetWings,
    getFleetLeadershipRole,
    getFullFleetInfo,
    captureFleetStructure
};
