module.exports={
    
    // Enter your settings below
    
    backgroundURL: "",
    siteTitle: "EVE ESI Fleet Tool",
    
    // EVE SSO settings. Make sure they match the settings you have listed at developers.eveonline.com
    // clientID - your application client ID Number
    // secretKey - your application client secret key. Do not share this!!
    // callbackURL - change domain.com to match your domain name
    // scopes - T
    EVEclientID: "",
    EVEsecretKey: "",
    EVEcallbackURL: "",
    scopes: "publicData esi-location.read_location.v1 esi-location.read_ship_type.v1 esi-skills.read_skills.v1 esi-skills.read_skillqueue.v1 esi-clones.read_clones.v1 esi-fleets.read_fleet.v1 esi-fleets.write_fleet.v1 esi-ui.write_waypoint.v1 esi-location.read_online.v1 esi-clones.read_implants.v1 esi-characters.read_fatigue.v1",

    // Discord SSO Settings. Make sure they match the setting you have listed at discord.com/developers
    // SiteURL              - URL:ExternalPort that site runs under.
    // DiscordAppID         - The application or client id of your discord bot
    // DiscordClientSecret  - The secret key for OAuth2 login flow
    SiteURL: "",
    DiscordAppID: "",
    DiscordClientSecret: "",

    // users must be in this server in order to authenticate
    GuildId: "",

    // users must be in one of these roles in order to authenticate. use a comma separated list. put roles in "quotes"
    GuildRoles: [],

    //internal server port
    port: 8080
}