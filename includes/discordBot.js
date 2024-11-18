const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const commands = require('./discord/commands.js');
const { handleCommand } = require('./discord/handlers.js');

module.exports = function(app, settings) {
    const client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
        ]
    });

    // Function to sync bot profile with application settings
    async function syncBotProfile() {
        try {
            const application = await client.application.fetch();
            let changes = [];
            
            // Update the bot's username if it doesn't match
            if (client.user.username !== application.name) {
                await client.user.setUsername(application.name);
                changes.push(`username to "${application.name}"`);
            }

            // Update the bot's avatar if it exists and doesn't match
            if (application.iconURL() && client.user.avatarURL() !== application.iconURL()) {
                const icon = await fetch(application.iconURL()).then(res => res.arrayBuffer());
                await client.user.setAvatar(Buffer.from(icon));
                changes.push('avatar');
            }

            return changes;
        } catch (error) {
            console.error('Error syncing bot profile:', error);
            throw error;
        }
    }

    // Bot ready event
    client.once(Events.ClientReady, async c => {
        console.log(`Discord bot ready! Logged in as ${c.user.tag}`);
        
        try {
            // Initial sync of bot profile
            await syncBotProfile();

            // Register commands
            const rest = new REST().setToken(settings.DiscordBotToken);
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(settings.DiscordAppID, settings.GuildId),
                { body: commands.map(command => command.data.toJSON()) },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error during bot initialization:', error);
        }
    });

    // Interaction handler for slash commands
    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;
        await handleCommand(interaction, { 
            client, 
            settings,
            syncBotProfile // Pass the function directly
        });
    });

    // Error handling
    client.on(Events.Error, error => {
        console.error('Discord client error:', error);
    });

    // Login to Discord
    client.login(settings.DiscordBotToken)
        .catch(error => console.error('Failed to login to Discord:', error));

    // Add the client and sync function to app.locals so they can be accessed from other parts of the application
    app.locals.discordBot = client;
    app.locals.syncBotProfile = syncBotProfile;

    return client;
}
