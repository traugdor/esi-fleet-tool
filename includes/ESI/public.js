const axios = require('axios');

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Get public character information
 * @param {string} characterId - EVE character ID
 * @returns {Promise} Character information including corporation and alliance IDs
 */
exports.getCharacterInfo = async function(characterId) {
    try {
        const response = await axios.get(`${ESI_BASE_URL}/characters/${characterId}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching character info:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get corporation information
 * @param {string} corporationId - EVE corporation ID
 * @returns {Promise} Corporation information
 */
exports.getCorporationInfo = async function(corporationId) {
    try {
        const response = await axios.get(`${ESI_BASE_URL}/corporations/${corporationId}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching corporation info:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get alliance information
 * @param {string} allianceId - EVE alliance ID
 * @returns {Promise} Alliance information
 */
exports.getAllianceInfo = async function(allianceId) {
    try {
        const response = await axios.get(`${ESI_BASE_URL}/alliances/${allianceId}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching alliance info:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get complete character public information including corporation and alliance details
 * @param {string} characterId - EVE character ID
 * @returns {Promise} Complete character information including corporation and alliance details
 */
exports.getCompleteCharacterInfo = async function(characterId) {
    try {
        // Get character info first
        const characterInfo = await exports.getCharacterInfo(characterId);
        const result = { ...characterInfo };

        // Get corporation info if available
        if (characterInfo.corporation_id) {
            const corporationInfo = await exports.getCorporationInfo(characterInfo.corporation_id);
            result.corporation = corporationInfo;
        }

        // Get alliance info if available
        if (characterInfo.alliance_id) {
            const allianceInfo = await exports.getAllianceInfo(characterInfo.alliance_id);
            result.alliance = allianceInfo;
        }

        return result;
    } catch (error) {
        console.error('Error fetching complete character info:', error.response?.data || error.message);
        throw error;
    }
}