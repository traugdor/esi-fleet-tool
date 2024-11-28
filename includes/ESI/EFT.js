const axios = require('axios');
const translator = require('./translator');
const db = require('node-persist');
const cliProgress = require('cli-progress');
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

db.initSync({});

/**
 * Base URL for ESI API
 */
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Base URL for Fuzzworks data dump
 */
const FUZZWORKS_URL = 'https://www.fuzzwork.co.uk/dump/latest/invTypes.csv';

/**
 * Local path for cached CSV file
 */
const CACHE_DIR = path.join(__dirname, '../../cache');
const CSV_PATH = path.join(CACHE_DIR, 'invTypes.csv');

/**
 * Check if the translation table needs to be updated
 * @returns {Promise<boolean>}
 */
async function needsUpdate() {
    try {
        // Check if cache directory exists, create if it doesn't
        try {
            await fsPromises.access(CACHE_DIR);
        } catch {
            await fsPromises.mkdir(CACHE_DIR, { recursive: true });
        }

        // Get the last update timestamp from our database
        const lastUpdate = await db.getItem('itemTranslationLastUpdate') || 0;

        // Check Fuzzworks file timestamp using HEAD request
        const response = await axios.head(FUZZWORKS_URL);
        const remoteLastModified = new Date(response.headers['last-modified']).getTime();

        return lastUpdate < remoteLastModified;
    } catch (error) {
        console.error('Error checking for updates:', error.message);
        // If we can't check, assume we need an update
        return true;
    }
}

/**
 * Download and parse the Fuzzworks CSV file
 * @returns {Promise<Object>} Object mapping item names to their data
 */
async function downloadAndParseCSV() {
    const translations = {};
    
    try {
        // Download the file
        console.log('Downloading Fuzzworks data dump...');
        const response = await axios({
            method: 'get',
            url: FUZZWORKS_URL,
            responseType: 'stream'
        });

        console.log('Saving to disk...');
        // Save the file using proper stream handling
        await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(CSV_PATH);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log('Complete. Parsing data...');
        // Create progress bar
        const bar = new cliProgress.SingleBar({
            format: 'Parsing CSV |{bar}| {percentage}% | {value}/{total} lines processed',
            barCompleteChar: '-',
            barIncompleteChar: '_'
        });

        // First pass: count total lines (excluding header)
        let totalLines = 0;
        const countStream = fs.createReadStream(CSV_PATH).pipe(parse({
            skip_empty_lines: true
        }));
        for await (const _ of countStream) {
            totalLines++;
        }
        totalLines--; // Subtract header line

        console.log(`Found ${totalLines} items in CSV file`);

        // Second pass: parse the data with headers
        const parser = fs.createReadStream(CSV_PATH).pipe(parse({
            columns: true,
            skip_empty_lines: true,
            cast: true, // Automatically convert numbers
            cast_date: false // Don't try to parse dates
        }));

        let processedLines = 0;
        let publishedItems = 0;
        bar.start(totalLines, 0);

        for await (const record of parser) {
            // Only include published items
            if (record.published === 1) {
                translations[record.typeName.toLowerCase()] = {
                    id: record.typeID,
                    data: {
                        name: record.typeName,
                        description: record.description,
                        groupID: record.groupID,
                        mass: record.mass,
                        volume: record.volume,
                        capacity: record.capacity,
                        portionSize: record.portionSize,
                        published: true
                    }
                };
                publishedItems++;
            }
            processedLines++;
            bar.update(processedLines);
        }

        bar.stop();
        
        // Store the last-modified timestamp
        const lastModified = new Date(response.headers['last-modified']).getTime();
        await db.setItem('itemTranslationLastUpdate', lastModified);
        
        console.log(`\nProcessed ${processedLines} items (${publishedItems} published)`);
        console.log(`Next update will check: ${new Date(lastModified).toLocaleString()}`);
        
        return translations;

    } catch (error) {
        console.error('Error processing CSV:', error.message);
        throw error;
    }
}

/**
 * Schedule automatic updates of the translation table
 */
function scheduleUpdates() {
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    async function checkAndUpdate() {
        try {
            console.log('Checking Fuzzworks data timestamp...');
            if (await needsUpdate()) {
                console.log('New Fuzzworks data detected, updating local cache...');
                const translations = await downloadAndParseCSV();
                await db.setItem('itemTranslations', translations);
            } else {
                console.log('Fuzzworks data is up to date');
            }
        } catch (error) {
            console.error('Error in scheduled update:', error.message);
        }
    }

    // Calculate time until next check at 00:00 UTC
    function getNextCheckDelay() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow - now;
    }

    // Schedule initial check
    const initialDelay = getNextCheckDelay();
    console.log(`Next Fuzzworks data check scheduled for: ${new Date(Date.now() + initialDelay).toLocaleString()}`);
    setTimeout(() => {
        checkAndUpdate();
        // After initial check, schedule daily checks at 00:00 UTC
        setInterval(checkAndUpdate, ONE_DAY);
    }, initialDelay);
    
    // Also check immediately on startup
    checkAndUpdate();
}

/**
 * Get type ID for an item name
 * @param {string} itemName - The name of the item
 * @returns {Promise<number>} The type ID of the item
 */
async function getTypeId(itemName) {
    try {
        // Get translations from storage
        const translations = await db.getItem('itemTranslations');
        if (!translations) {
            await checkAndUpdate();
            return getTypeId(itemName); // Try again after update
        }
        
        const normalizedName = itemName.toLowerCase();
        if (translations[normalizedName]) {
            return translations[normalizedName].id;
        }
        
        throw new Error(`Item not found: ${itemName}`);
    } catch (error) {
        console.error('Error getting type ID:', error.message);
        throw error;
    }
}

/**
 * Parse an EFT formatted fitting string
 * @param {string} eftFitting - The EFT formatted fitting string
 * @returns {Object} Parsed fitting information
 */
function parseEFT(eftFitting) {
    const lines = eftFitting.split('\n').map(line => line.trim()).filter(line => line);
    
    // First line contains ship type in brackets [Ship Name, Fit Name]
    const shipMatch = lines[0].match(/\[(.*?)(,.*?)?\]/);
    if (!shipMatch) {
        throw new Error('Invalid EFT format: Missing ship type');
    }
    
    const shipName = shipMatch[1];
    const fitName = shipMatch[2] ? shipMatch[2].substring(1).trim() : '';
    
    const fitting = {
        ship: shipName,
        name: fitName,
        highSlots: [],
        midSlots: [],
        lowSlots: [],
        rigs: [],
        subsystems: [],
        drones: [],
        cargo: []
    };
    
    // Process remaining lines
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip empty lines and comments
        if (!line || line.startsWith('[') || line.startsWith('//')) continue;
        
        // Check for quantity
        const qtyMatch = line.match(/(.*?)\sx(\d+)$/);
        const itemName = qtyMatch ? qtyMatch[1].trim() : line;
        const quantity = qtyMatch ? parseInt(qtyMatch[2]) : 1;
        
        // Categorize by common prefixes
        if (line.includes(' Drone')) {
            fitting.drones.push({ name: itemName, quantity });
        } else if (line.includes(' Rig')) {
            fitting.rigs.push({ name: itemName, quantity });
        } else if (line.includes(' Subsystem')) {
            fitting.subsystems.push({ name: itemName, quantity });
        } else if (line.startsWith('Cargo:')) {
            fitting.cargo.push({ name: itemName.replace('Cargo: ', ''), quantity });
        } else {
            // Determine slot type based on module attributes (will be implemented)
            fitting.modules.push({ name: itemName, quantity });
        }
    }
    
    return fitting;
}

/**
 * Get skill requirements for a type ID
 * @param {number} typeId - The type ID to check
 * @returns {Promise<Array>} Array of skill requirements
 */
async function getSkillRequirements(typeId) {
    try {
        // Get translations from storage
        const translations = await db.getItem('itemTranslations');
        if (!translations) {
            await checkAndUpdate();
            return getSkillRequirements(typeId); // Try again after update
        }
        
        const typeData = translations[translations.find(t => t.id === typeId).name].data;
        const skillReqs = [];
        
        // Check for skill requirements
        if (typeData.requiredSkills) {
            for (const skill of typeData.requiredSkills) {
                skillReqs.push({
                    skillId: skill.type_id,
                    level: skill.level
                });
            }
        }
        
        return skillReqs;
    } catch (error) {
        console.error('Error getting skill requirements:', error.message);
        throw error;
    }
}

/**
 * Get all skill requirements for a fitting
 * @param {string} eftFitting - The EFT formatted fitting string
 * @returns {Promise<Object>} Object containing all required skills and their levels
 */
async function getFittingSkillRequirements(eftFitting) {
    try {
        const fitting = parseEFT(eftFitting);
        const allSkillReqs = new Map(); // Use Map to track highest level required for each skill
        
        // Get ship requirements
        const shipTypeId = await getTypeId(fitting.ship);
        const shipSkills = await getSkillRequirements(shipTypeId);
        
        // Add ship skills to requirements
        for (const req of shipSkills) {
            allSkillReqs.set(req.skillId, Math.max(req.level, allSkillReqs.get(req.skillId) || 0));
        }
        
        // Process all modules
        for (const category of ['modules', 'rigs', 'subsystems']) {
            for (const item of fitting[category]) {
                const typeId = await getTypeId(item.name);
                const skills = await getSkillRequirements(typeId);
                
                for (const req of skills) {
                    allSkillReqs.set(req.skillId, Math.max(req.level, allSkillReqs.get(req.skillId) || 0));
                }
            }
        }
        
        // Convert Map to array and get skill names
        const skillPromises = Array.from(allSkillReqs.entries()).map(async ([skillId, level]) => {
            const skillInfo = await translator.getSkillInfo(skillId);
            return {
                id: skillId,
                name: skillInfo.name,
                level: level
            };
        });
        
        const skills = await Promise.all(skillPromises);
        
        return {
            ship: fitting.ship,
            name: fitting.name,
            requiredSkills: skills.sort((a, b) => a.name.localeCompare(b.name))
        };
    } catch (error) {
        console.error('Error analyzing fitting:', error.message);
        throw error;
    }
}

/**
 * Force an update of the item translation table regardless of schedule
 * @returns {Promise<void>}
 */
async function forceUpdate() {
    try {
        console.log('Forcing Fuzzworks data update...');
        const translations = await downloadAndParseCSV();
        await db.setItem('itemTranslations', translations);
        console.log('Force update complete');
    } catch (error) {
        console.error('Error in force update:', error.message);
        throw error;
    }
}

// Start the update scheduler when the module is loaded
scheduleUpdates();

// Export the module's functions
module.exports = {
    parseEFT,
    getFittingSkillRequirements,
    forceUpdate
};
