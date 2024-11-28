const axios = require('axios');

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Get system, constellation, and region information for a location ID
 * @param {number} locationId - EVE location ID
 * @returns {Promise} Location information including system, constellation, and region names
 */
exports.getLocationInfo = async function(locationId) {
    try {
        // First determine if this is a station, structure, or solar system
        let systemId;
        let locationName;
        
        // Check if it's a station
        try {
            const stationResponse = await axios.get(`${ESI_BASE_URL}/universe/stations/${locationId}/`);
            locationName = stationResponse.data.name;
            systemId = stationResponse.data.system_id;
        } catch (error) {
            // Not a station, try structure
            try {
                const structureResponse = await axios.get(`${ESI_BASE_URL}/universe/structures/${locationId}/`);
                locationName = structureResponse.data.name;
                systemId = structureResponse.data.solar_system_id;
            } catch (error) {
                // Must be a solar system
                systemId = locationId;
            }
        }

        // Get solar system info
        const systemResponse = await axios.get(`${ESI_BASE_URL}/universe/systems/${systemId}/`);
        const systemInfo = systemResponse.data;

        // Get constellation info
        const constellationResponse = await axios.get(`${ESI_BASE_URL}/universe/constellations/${systemInfo.constellation_id}/`);
        const constellationInfo = constellationResponse.data;

        // Get region info
        const regionResponse = await axios.get(`${ESI_BASE_URL}/universe/regions/${constellationInfo.region_id}/`);
        const regionInfo = regionResponse.data;

        return {
            id: locationId,
            name: locationName || systemInfo.name,
            type: locationName ? 'station/structure' : 'solar_system',
            system: {
                id: systemInfo.system_id,
                name: systemInfo.name,
                security_status: systemInfo.security_status
            },
            constellation: {
                id: constellationInfo.constellation_id,
                name: constellationInfo.name
            },
            region: {
                id: regionInfo.region_id,
                name: regionInfo.name
            }
        };
    } catch (error) {
        console.error('Error fetching location info:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get information about a specific skill
 * @param {number} skillId - EVE skill type ID
 * @returns {Promise} Skill information including name and description
 */
exports.getSkillInfo = async function(skillId) {
    try {
        const response = await axios.get(`${ESI_BASE_URL}/universe/types/${skillId}/`);
        return {
            id: skillId,
            name: response.data.name,
            description: response.data.description,
            group_id: response.data.group_id
        };
    } catch (error) {
        console.error('Error fetching skill info:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get information about multiple skills at once
 * @param {Array<number>} skillIds - Array of EVE skill type IDs
 * @returns {Promise} Object mapping skill IDs to their information
 */
exports.getSkillsInfo = async function(skillIds) {
    try {
        const promises = skillIds.map(skillId => exports.getSkillInfo(skillId));
        const results = await Promise.all(promises);
        
        // Convert array of results to an object keyed by skill ID
        return results.reduce((acc, skill) => {
            acc[skill.id] = skill;
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching skills info:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get information about a ship type
 * @param {number} shipTypeId - EVE ship type ID
 * @returns {Promise} Ship information including name and description
 */
exports.getShipInfo = async function(shipTypeId) {
    try {
        const response = await axios.get(`${ESI_BASE_URL}/universe/types/${shipTypeId}/`);
        return {
            id: shipTypeId,
            name: response.data.name,
            description: response.data.description,
            group_id: response.data.group_id
        };
    } catch (error) {
        console.error('Error fetching ship info:', error.response?.data || error.message);
        throw error;
    }
}
