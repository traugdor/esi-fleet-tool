const { SlashCommandBuilder } = require('discord.js');

/*
Command Template:
{
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description')
        .addStringOption(option =>
            option.setName('parameter')
                .setDescription('Parameter description')
                .setRequired(true/false))
        // Add more options as needed
}

Available option types:
.addStringOption()
.addIntegerOption()
.addBooleanOption()
.addUserOption()
.addChannelOption()
.addRoleOption()
.addMentionableOption()
.addNumberOption()
.addAttachmentOption()
*/

const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('hello')
            .setDescription('Say hello to the bot')
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('The message to echo back')
                    .setRequired(false))
    },
    {
        data: new SlashCommandBuilder()
            .setName('sync')
            .setDescription('Sync bot profile with Discord Developer Portal settings')
            .setDefaultMemberPermissions('0') // Restrict to users with ADMINISTRATOR permission by default
    },
    {
        data: new SlashCommandBuilder()
            .setName('link')
            .setDescription('Link your Discord account to your EVE Online account')
    }
    // Add more commands here
];

module.exports = commands;
