const axios = require('axios');
const characters = require('../db/characters');
const fleettemplates = require('../db/fleettemplates');
const readfleet = require('./readfleet');
const settings = require('../../settings');

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Create a new wing in the fleet
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {string} wingName - The name for the new wing
 * @returns {Promise<Object>} Created wing information including wing_id
 */
async function createWing(characterId, fleetId, wingName) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                // Create the wing first
                const response = await axios.post(
                    `${ESI_BASE_URL}/fleets/${fleetId}/wings/`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data || !response.data.wing_id) {
                    reject(new Error('Invalid response when creating wing'));
                    return;
                }

                const wingId = response.data.wing_id;

                // Then set its name
                await axios.put(
                    `${ESI_BASE_URL}/fleets/${fleetId}/wings/${wingId}/`,
                    { name: wingName },
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                resolve({
                    wing_id: wingId,
                    name: wingName
                });
            } catch (error) {
                console.error('Error creating wing:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Create a new squad in a wing
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {number} wingId - The wing ID
 * @param {string} squadName - The name for the new squad
 * @returns {Promise<Object>} Created squad information including squad_id
 */
async function createSquad(characterId, fleetId, wingId, squadName) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                // Create the squad first
                const response = await axios.post(
                    `${ESI_BASE_URL}/fleets/${fleetId}/wings/${wingId}/squads/`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                if (!response.data || !response.data.squad_id) {
                    reject(new Error('Invalid response when creating squad'));
                    return;
                }

                const squadId = response.data.squad_id;

                // Then set its name
                await axios.put(
                    `${ESI_BASE_URL}/fleets/${fleetId}/squads/${squadId}/`,
                    { name: squadName },
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                resolve({
                    squad_id: squadId,
                    name: squadName,
                    wing_id: wingId
                });
            } catch (error) {
                console.error('Error creating squad:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Move a fleet member to a new position
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {number} memberId - The member to move
 * @param {Object} position - The new position {role, wingId?, squadId?}
 * @returns {Promise<void>}
 */
async function moveFleetMember(characterId, fleetId, memberId, position) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                await axios.put(
                    `${ESI_BASE_URL}/fleets/${fleetId}/members/${memberId}/`,
                    {
                        role: position.role,
                        wing_id: position.wingId,
                        squad_id: position.squadId
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                resolve();
            } catch (error) {
                console.error('Error moving fleet member:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Reconstruct a fleet from a template
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {string} templateId - The ID of the fleet template to use
 * @returns {Promise<Object>} Reconstructed fleet information
 */
async function reconstructFleetFromTemplate(characterId, templateId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if character is in a fleet and is fleet commander
            const leadershipRole = await readfleet.getFleetLeadershipRole(characterId);
            if (!leadershipRole.isInFleet || !leadershipRole.isFleetCommander) {
                reject(new Error('Character must be a fleet commander to reconstruct fleet'));
                return;
            }

            const fleetId = leadershipRole.fleetId;

            // Get the template from the database
            fleettemplates.getFleetTemplateById({ templateId }, async (err, template) => {
                if (err) {
                    reject(new Error(`Template not found: ${err}`));
                    return;
                }

                try {
                    console.log('Starting fleet reconstruction from template:', template.name);

                    // First apply fleet settings if they exist
                    if (template.template.settings) {
                        await updateFleetSettings(characterId, fleetId, template.template.settings);
                    }

                    // Create wings and squads according to template
                    const wingMap = new Map(); // Store wing_id mappings
                    const squadMap = new Map(); // Store squad_id mappings

                    for (const wing of template.template.wings) {
                        console.log('Creating wing:', wing.name);
                        const createdWing = await createWing(characterId, fleetId, wing.name);
                        wingMap.set(wing.wing_id, createdWing.wing_id);

                        // Create squads in the wing
                        for (const squad of template.template.squads.filter(s => s.wing_id === wing.wing_id)) {
                            console.log('Creating squad:', squad.name, 'in wing:', wing.name);
                            const createdSquad = await createSquad(characterId, fleetId, createdWing.wing_id, squad.name);
                            squadMap.set(squad.squad_id, createdSquad.squad_id);
                        }
                    }

                    // Get the updated fleet structure
                    const updatedFleet = await readfleet.getFullFleetInfo(characterId);
                    console.log('Fleet reconstruction completed');
                    resolve(updatedFleet);
                } catch (error) {
                    console.error('Error during fleet reconstruction:', error);
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Error checking fleet commander status:', error);
            reject(error);
        }
    });
}

/**
 * Update fleet settings
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {Object} settings - Fleet settings to apply
 * @returns {Promise<void>}
 */
async function updateFleetSettings(characterId, fleetId, fleetSettings) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                await axios.put(
                    `${ESI_BASE_URL}/fleets/${fleetId}/`,
                    {
                        is_free_move: fleetSettings.is_free_move,
                        motd: fleetSettings.motd
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                resolve();
            } catch (error) {
                console.error('Error updating fleet settings:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Delete a wing from the fleet
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {number} wingId - The wing ID to delete
 * @returns {Promise<void>}
 */
async function deleteWing(characterId, fleetId, wingId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                await axios.delete(
                    `${ESI_BASE_URL}/fleets/${fleetId}/wings/${wingId}/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Successfully deleted wing ${wingId} from fleet ${fleetId}`);
                resolve();
            } catch (error) {
                console.error('Error deleting wing:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Delete a squad from the fleet
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {number} squadId - The squad ID to delete
 * @returns {Promise<void>}
 */
async function deleteSquad(characterId, fleetId, squadId) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                await axios.delete(
                    `${ESI_BASE_URL}/fleets/${fleetId}/squads/${squadId}/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Successfully deleted squad ${squadId} from fleet ${fleetId}`);
                resolve();
            } catch (error) {
                console.error('Error deleting squad:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Update a wing's name
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {number} wingId - The wing ID to update
 * @param {string} newName - The new name for the wing
 * @returns {Promise<void>}
 */
async function updateWing(characterId, fleetId, wingId, newName) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                await axios.put(
                    `${ESI_BASE_URL}/fleets/${fleetId}/wings/${wingId}/`,
                    { name: newName },
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Successfully updated wing ${wingId} name to "${newName}"`);
                resolve();
            } catch (error) {
                console.error('Error updating wing:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

/**
 * Update a squad's name
 * @param {number} characterId - The EVE character ID of the fleet commander
 * @param {number} fleetId - The fleet ID
 * @param {number} squadId - The squad ID to update
 * @param {string} newName - The new name for the squad
 * @returns {Promise<void>}
 */
async function updateSquad(characterId, fleetId, squadId, newName) {
    return new Promise((resolve, reject) => {
        characters.getCharacterInfo({ characterId }, async (err, character) => {
            if (err) {
                reject(new Error(`Character not found: ${err}`));
                return;
            }

            try {
                await axios.put(
                    `${ESI_BASE_URL}/fleets/${fleetId}/squads/${squadId}/`,
                    { name: newName },
                    {
                        headers: {
                            'Authorization': `Bearer ${character.accessToken}`
                        }
                    }
                );

                console.log(`Successfully updated squad ${squadId} name to "${newName}"`);
                resolve();
            } catch (error) {
                console.error('Error updating squad:', error.response?.data || error.message);
                reject(error);
            }
        });
    });
}

module.exports = {
    createWing,
    createSquad,
    moveFleetMember,
    reconstructFleetFromTemplate,
    updateFleetSettings,
    deleteWing,
    deleteSquad,
    updateWing,
    updateSquad
};
