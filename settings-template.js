module.exports = {
    /****************************
     * General Site Settings
     ****************************/
    
    // URL for the background image of the site (leave empty for default)
    backgroundURL: "",

    // The title shown in the browser tab and site header
    siteTitle: "EVE ESI Fleet Tool",

    // Your organization's name (shown in various places throughout the site)
    groupName: "Your Alliance/Corp Name",


    /****************************
     * EVE Online Integration
     ****************************/
    
    // Get these values from https://developers.eveonline.com
    EVEclientID: "",        // Your EVE application's client ID
    EVEsecretKey: "",       // Your EVE application's secret key (keep this private!)
    
    // Your EVE callback URL (must match what's registered on developers.eveonline.com)
    EVEcallbackURL: "http://your-domain.com:port/EVE/sso/",
    
    // Links to your organization's EVE presence
    EVEKillboardLink: "https://zkillboard.com/alliance/YOUR_ALLIANCE_ID/",
    EVEPublicChatChannel: "Your Public Channel",

    // Required EVE permissions (modify only if you know what you're doing)
    scopes: "publicData " +
            "esi-location.read_location.v1 " +
            "esi-location.read_ship_type.v1 " +
            "esi-skills.read_skills.v1 " +
            "esi-skills.read_skillqueue.v1 " +
            "esi-clones.read_clones.v1 " +
            "esi-fleets.read_fleet.v1 " +
            "esi-fleets.write_fleet.v1 " +
            "esi-ui.write_waypoint.v1 " +
            "esi-location.read_online.v1 " +
            "esi-clones.read_implants.v1 " +
            "esi-characters.read_fatigue.v1",


    /****************************
     * Discord Integration
     ****************************/
    
    // Get these values from https://discord.com/developers/applications
    DiscordAppID: "",         // Your Discord application ID
    DiscordClientSecret: "",  // Your Discord client secret (keep this private!)
    DiscordBotToken: "",      // Your Discord bot token (keep this private!)
    
    // The base URL for Discord authentication (DO NOT include /Discord/SSO)
    DiscordCallbackURL: "http://your-domain.com:port",

    // Discord server that users must be a member of
    GuildId: "",  // Right-click server → Copy ID (need Developer Mode enabled)

    // Role(s) required to use the application
    // Example: ["123456789", "987654321"]
    // To get role IDs: Right-click role → Copy ID (need Developer Mode enabled)
    GuildRoles: [],


    /****************************
     * Server Configuration
     ****************************/
    
    // The internal port your application will run on
    port: 8080,  // Make sure this matches the port in your callback URLs, however you can change it if needed

    // The port the websocket server will run on
    websocketPort: 8081 // Make sure this is one port higher than the application port above
}