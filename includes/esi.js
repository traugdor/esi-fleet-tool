const EFT = require('./ESI/EFT');
const public = require('./ESI/public');
const translator = require('./ESI/translator');
const skills = require('./ESI/skills');

/**
 * EVE Online ESI API Integration
 * Provides access to all ESI-related functionality including:
 * - Public data retrieval (character, corporation, alliance info)
 * - ID translation (locations, skills, ships)
 * - EFT fitting parsing and analysis
 * - Character skills management
 */
module.exports = {
    /**
     * EFT (EVE Fitting Tool) related functions
     * Includes parsing EFT formatted fits and analyzing skill requirements
     */
    EFT,

    /**
     * Public ESI data retrieval functions
     * Access character, corporation, and alliance information
     */
    public,

    /**
     * ESI ID translation utilities
     * Convert numeric IDs to human-readable information
     */
    translator,

    /**
     * Character skills management
     * Get and update character skills
     */
    skills,

    /**
     * Convenience exports of commonly used functions
     */
    // Public data functions
    getCharacterInfo: public.getCharacterInfo,
    getCorporationInfo: public.getCorporationInfo,
    getAllianceInfo: public.getAllianceInfo,
    getCompleteCharacterInfo: public.getCompleteCharacterInfo,

    // Translator functions
    getLocationInfo: translator.getLocationInfo,
    getSkillInfo: translator.getSkillInfo,
    getSkillsInfo: translator.getSkillsInfo,
    getShipInfo: translator.getShipInfo,

    // EFT functions
    parseEFT: EFT.parseEFT,
    getFittingSkillRequirements: EFT.getFittingSkillRequirements,
    forceItemUpdate: EFT.forceUpdate,

    // Skills functions
    getCharacterSkills: skills.getCharacterSkills,
    updateCharacterSkills: skills.updateCharacterSkills
};