const QueryString = require("qs");
const { v4: uuid } = require("uuid");

module.exports = function(app, settings) {

    app.get('/login', (req, res) => {
        var redirectURI = QueryString.stringify({redirect_uri: settings.DiscordCallbackURL + '/Discord/SSO'});
        var clientID = QueryString.stringify({client_id: settings.DiscordAppID});
        var scopes = QueryString.stringify({scope: "identify guilds guilds.members.read messages.read guilds.members.read"});
        var state = QueryString.stringify({state: req.session.esifleettool.uuid});
        //console.log(redirectURI, clientID, scopes);
        res.redirect('https://discord.com/oauth2/authorize?' + clientID + '&response_type=code&' 
            + redirectURI + '&' + scopes + '&' + state);
    });
    
    app.get('/Discord/SSO', (req, res) => {
        var apiEndpoint = 'https://discord.com/api/oauth2/token';
        var clientID = settings.DiscordAppID;
        var clientSecret = settings.DiscordClientSecret;
        var redirectURI = settings.DiscordCallbackURL + '/Discord/SSO';
        var state = req.query.state;
        var code = req.query.code;
        console.log(state, code);
        if(code) {
            const data = new URLSearchParams();
            data.append('client_id', clientID);
            data.append('client_secret', clientSecret);
            data.append('grant_type', 'authorization_code');
            data.append('redirect_uri', redirectURI);
            data.append('scope', 'identify');
            data.append('code', code);
            fetch(apiEndpoint, {
                method: 'POST',
                body: data
            })
            .then(tokenresponse => tokenresponse.json())
            .then(oauthData => {
                // Store the access token in session
                req.session.esifleettool = {
                    title: settings.siteTitle,
                    DiscordUserId: '',
                    EVEUserId: '',
                    hello: 'Hello!',
                    uuid: uuid(),
                    loggedIn: false,
                    discordToken: oauthData.access_token
                };
                
                // Get user information
                return fetch('https://discord.com/api/users/@me', {
                    headers: {
                        Authorization: `Bearer ${oauthData.access_token}`
                    }
                });
            })
            .then(userResponse => userResponse.json())
            .then(userData => {
                // Store user data
                req.session.esifleettool.discordUser = userData;
                
                // Get user's guilds
                return fetch('https://discord.com/api/users/@me/guilds', {
                    headers: {
                        Authorization: `Bearer ${req.session.esifleettool.discordToken}`
                    }
                });
            })
            .then(guildsResponse => guildsResponse.json())
            .then(guildsData => {
                // Check if user is in the required guild
                const targetGuild = guildsData.find(guild => guild.id === settings.GuildId);
                
                if (!targetGuild) {
                    throw new Error('User not in required guild');
                }
                
                // Get user's roles in the guild
                return fetch(`https://discord.com/api/users/@me/guilds/${settings.GuildId}/member`, {
                    headers: {
                        Authorization: `Bearer ${req.session.esifleettool.discordToken}`
                    }
                });
            })
            .then(memberResponse => memberResponse.json())
            .then(memberData => {
                // Check if user has any of the required roles
                const hasRequiredRole = memberData.roles.some(role => 
                    settings.GuildRoles.includes(role)
                );
                
                if (!hasRequiredRole) {
                    throw new Error('User does not have required role');
                }
                
                // Set session data
                req.session.esifleettool.loggedIn = true;
                req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
                
                // Save session before redirect
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        throw new Error('Failed to save session');
                    }
                    res.redirect('/');
                });
            })
            .catch(error => {
                console.error('Authentication error:', error);
                req.session.destroy((err) => {
                    if (err) console.error('Session destruction error:', err);
                    res.redirect('/?error=' + encodeURIComponent(error.message));
                });
            });
        } else {
            req.session.destroy((err) =>{
                console.log(err);
                res.send("Not authorized to use application!");
            })
        }
    });

    // Middleware to check if user is logged in
    const requireLogin = (req, res, next) => {
        if (!req.session.esifleettool?.loggedIn) {
            // Store the requested URL to redirect back after login
            req.session.returnTo = req.originalUrl;
            return res.redirect('/login');
        }
        next();
    };

    // Export the middleware so it can be used in other files
    app.locals.requireLogin = requireLogin;

    app.get('/logout', (req, res) => {
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            
            // Clear the session cookie
            res.clearCookie('connect.sid');
            
            // Clear our custom cookie if it exists
            res.clearCookie('esifleettool');
            
            // Redirect to home page
            res.redirect('/');
        });
    });
}