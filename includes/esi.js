/**
 * Central module for all ESI-related functionality
 */

// Import all ESI modules
const EFT = require('./ESI/EFT');
const public = require('./ESI/public');
const player = require('./ESI/player');
const readfleet = require('./ESI/readfleet');
const writefleet = require('./ESI/writefleet');
const navigation = require('./ESI/navigation');
const skills = require('./ESI/skills');
const translator = require('./ESI/translator');

// Export all modules and their functions
module.exports = {
    // Full module exports for advanced usage
    EFT,
    public,
    player,
    readfleet,
    writefleet,
    navigation,
    skills,
    translator,

    // Player management and authentication
    refreshAccessToken: player.refreshAccessToken,
    checkAndRefreshTokens: player.checkAndRefreshTokens,
    getCharacterOnlineStatus: player.getCharacterOnlineStatus,
    getCharacterShipType: player.getCharacterShipType,
    getActiveImplants: player.getActiveImplants,
    getFullCloneInfo: player.getFullCloneInfo,

    // Public ESI endpoints
    getStatus: public.getStatus,
    getServerStatus: public.getServerStatus,
    getCharacterInfo: public.getCharacterInfo,
    getCorporationInfo: public.getCorporationInfo,
    getAllianceInfo: public.getAllianceInfo,
    getCompleteCharacterInfo: public.getCompleteCharacterInfo,

    // Fleet reading operations
    getFleetInfo: readfleet.getFleetInfo,
    getFleetMembers: readfleet.getFleetMembers,
    getFleetWings: readfleet.getFleetWings,
    getFullFleetInfo: readfleet.getFullFleetInfo,
    getFleetLeadershipRole: readfleet.getFleetLeadershipRole,
    captureFleetStructure: readfleet.captureFleetStructure,

    // Fleet writing operations
    createWing: writefleet.createWing,
    createSquad: writefleet.createSquad,
    moveFleetMember: writefleet.moveFleetMember,
    reconstructFleetFromTemplate: writefleet.reconstructFleetFromTemplate,
    updateFleetSettings: writefleet.updateFleetSettings,
    deleteWing: writefleet.deleteWing,
    deleteSquad: writefleet.deleteSquad,
    updateWing: writefleet.updateWing,
    updateSquad: writefleet.updateSquad,

    // Navigation and location
    getCharacterLocation: navigation.getCharacterLocation,
    getJumpFatigue: navigation.getJumpFatigue,
    setWaypoint: navigation.setWaypoint,

    // Skills and training
    getSkills: skills.getSkills,
    getSkillQueue: skills.getSkillQueue,

    // EFT parsing and fitting
    parseFitting: EFT.parseFitting,
    getFitting: EFT.getFitting,

    // Translation services
    translateIDs: translator.translateIDs,
    translateNames: translator.translateNames
};