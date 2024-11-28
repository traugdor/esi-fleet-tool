/*
Handler Template:
async function handleCommandName(interaction) {
    try {
        // Get options if any
        const optionValue = interaction.options.getString('optionname');
        
        // Your command logic here
        
        // Reply to the interaction
        await interaction.reply({ 
            content: 'Your response',
            ephemeral: false // true to make response only visible to command user
        });
    } catch (error) {
        console.error('Error in commandName handler:', error);
        await interaction.reply({ 
            content: 'There was an error executing this command.',
            ephemeral: true
        });
    }
}
*/

// Command Handlers
async function handleHello(interaction) {
    try {
        const message = interaction.options.getString('message') || 'Hello!';
        await interaction.reply({ content:   `${message} - I'm the EVE Fleet Tool bot. More features coming soon!`,
                                  ephemeral: false });
    } catch (error) {
        console.error('Error in hello handler:', error);
        await interaction.reply({ 
            content: 'There was an error executing this command.',
            ephemeral: false
        });
    }
}

async function handleSync(interaction, { client, settings, syncBotProfile }) {
    try {
        // Check if user has appropriate role
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRequiredRole = member.roles.cache.some(role => 
            settings.GuildRoles.includes(role.id)
        );

        if (!hasRequiredRole) {
            return await interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: false
            });
        }

        // Defer reply since this might take a moment
        await interaction.deferReply({ ephemeral: true });

        // Perform sync
        const changes = await syncBotProfile();
        
        if (changes.length === 0) {
            await interaction.editReply({ 
                content: 'Bot profile is already in sync with application settings.',
                ephemeral: true 
            });
        } else {
            await interaction.editReply({ 
                content: `Successfully updated bot ${changes.join(' and ')}.`,
                ephemeral: true 
            });
        }
    } catch (error) {
        console.error('Error in sync handler:', error);
        const reply = interaction.deferred 
            ? interaction.editReply.bind(interaction)
            : interaction.reply.bind(interaction);
            
        await reply({ 
            content: 'There was an error syncing the bot profile.',
            ephemeral: true
        });
    }
}

async function handleLink(interaction, { settings }) {
    try {
        const baseUrl = settings.BaseURL || `http://localhost:${settings.port || 3000}`;
        const loginUrl = `${baseUrl}/eve/login/${interaction.user.id}`;
        
        await interaction.reply({
            content: `Click here to link your EVE Online account: ${loginUrl}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in link handler:', error);
        await interaction.reply({ 
            content: 'There was an error generating the EVE Online login link.',
            ephemeral: true
        });
    }
}

const { getCompleteCharacterInfo } = require('../esi');
const { forceItemUpdate } = require('../esi');
const db = require('node-persist');
const eveAuth = require('../eveAuth');

async function handleEVEUPDATED(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        console.log('Force updating Fuzzworks data...');
        await forceItemUpdate();
        
        await interaction.editReply({ 
            content: 'EVE Online item database has been successfully updated!',
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in EVEUPDATED handler:', error);
        await interaction.editReply({ 
            content: 'There was an error updating the EVE Online item database.',
            ephemeral: true
        });
    }
}

// Handler Map
const handlers = {
    hello: handleHello,
    sync: handleSync,
    link: handleLink,
    eveupdated: handleEVEUPDATED
    // Add more handlers here
};

// Main handler function
async function handleCommand(interaction, context) {
    const handler = handlers[interaction.commandName];
    if (handler) {
        await handler(interaction, context);
    } else {
        await interaction.reply({ 
            content: 'Unknown command.',
            ephemeral: true
        });
    }
}

module.exports = {
    handleCommand,
    handlers
};
