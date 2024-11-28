const crypto = require('crypto');
const axios = require('axios');
const qs = require('qs');
const db = require('./db.js');
const jwt = require('jsonwebtoken');
const { getCompleteCharacterInfo } = require('./ESI/public');
const { getAndSaveCharacterSkills } = require('./ESI/skills');
const characters = require('./db/characters');

module.exports = async function(app, settings) {

    // Store state tokens temporarily
    const stateTokens = new Map();

    // Explicitly bypass Discord auth for EVE SSO routes
    const bypassAuth = (req, res, next) => next();

    // Render the EVE login page with Discord ID - no auth required
    app.get('/eve/login/:discordId', bypassAuth, (req, res) => {
        const { discordId } = req.params;
        res.render('eve-login', { 
            discordId,
            layout: 'eve',
            site: settings.siteTitle,
            group: settings.groupName
        });
    });

    // Handle EVE SSO callback - no auth required
    app.get('/eve/auth/:discordId', bypassAuth, async (req, res) => {
        const { discordId } = req.params;
        
        // Generate a random state token
        const state = crypto.randomBytes(16).toString('hex');
        stateTokens.set(state, discordId);

        // Build the authorization URL with scopes
        const authURL = new URL('https://login.eveonline.com/v2/oauth/authorize');
        authURL.searchParams.append('response_type', 'code');
        authURL.searchParams.append('redirect_uri', settings.EVEcallbackURL);
        authURL.searchParams.append('client_id', settings.EVEclientID);
        authURL.searchParams.append('state', state);
        authURL.searchParams.append('scope', settings.scopes);

        // Redirect to EVE SSO
        res.redirect(authURL.toString());
    });

    //helper function to get access token from EVE SSO
    function getAccessToken(code, callback) { 
        const data = qs.stringify({
            grant_type: 'authorization_code',
            client_id: settings.EVEclientID,
            client_secret: settings.EVEsecretKey,
            redirect_uri: settings.EVEcallbackURL,
            code: code
        });

        const config = {
            method: 'post',
            url: 'https://login.eveonline.com/v2/oauth/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: data
        };
        
        axios(config)
        .then(function (response) {
            return callback(null, response.data);
        })
        .catch(function (error) {
            console.log("error in getAccessToken: ", error);
            return callback(error, null);
        });
    }

    // EVE SSO callback URL - no auth required
    app.get('/EVE/sso', bypassAuth, (req, res) => {
        const { state, code } = req.query;

        //get discordId from stateTokens.get(state)
        const discordId = stateTokens.get(state);

        //todo: get access token from EVE SSO
        getAccessToken(code, (error, response) => {
            if (error) {
                console.log("Error in app.get('/EVE/sso'): ", error);
                res.redirect('/eve/login/' + discordId);
            } else {
                const accessToken = response.access_token; //is a JWT?
                const refreshToken = response.refresh_token;
                //decode jwt to get accountID
                const jwtContent = jwt.decode(accessToken);
                //get character info from EVE API
                //we only get the character ID, not the Account ID
                const characterId = jwtContent.sub.split(':').slice(-1)[0];

                //get user info from database
                db.users.getUserByDiscordid({did:discordId}, (error, user) => {
                    if (error) {
                        console.log("Error in db.users.getUserByDiscordid: ", error);
                        res.redirect('/eve/login/' + discordId);
                    } else {
                        //check if character id is already in user.character_info
                        if (user.character_info.includes(characterId)) {
                            res.render('eve-login-success', { 
                                discordId,
                                layout: 'eve',
                                site: settings.siteTitle,
                                group: settings.groupName,
                                name: jwtContent.name,
                                picture: `https://images.evetech.net/characters/${characterId}/portrait?size=128`,
                                message: 'Character already added!'
                            });
                        } else {
                            //add character id to user.character_info
                            user.character_info.push(characterId);
                            db.users.updateUser(user, (error, user) => {
                                if (error) {
                                    console.log("Error in db.users.updateUser: ", error);
                                    res.redirect('/eve/login/' + discordId);
                                } else {
                                    // Save the character with auth info first
                                    const characterData = {
                                        characterId: characterId,
                                        accessToken: accessToken,
                                        refreshToken: refreshToken,
                                        expiresAt: Math.floor(Date.now() / 1000) + response.expires_in,
                                        characterName: jwtContent.name,
                                        corporationId: '',  // Will be updated by public info
                                        corporationName: '',
                                        allianceId: '',
                                        allianceName: '',
                                        characterInfo: {}
                                    };

                                    characters.saveNewCharacter(characterData, (error, savedChar) => {
                                        if (error) {
                                            console.log("Error saving new character:", error);
                                        }
                                        
                                        // Then get and save additional character info from ESI
                                        getCompleteCharacterInfo(characterId)
                                            .then(characterInfo => {
                                                characters.saveCharacterInfo(characterId, characterInfo, (error) => {
                                                    if (error) {
                                                        console.log("Error saving character info:", error);
                                                    }
                                                    getAndSaveCharacterSkills(characterId, accessToken)
                                                        .then(skills => {
                                                            // Render success page
                                                            res.render('eve-login-success', { 
                                                                discordId,
                                                                layout: 'eve',
                                                                site: settings.siteTitle,
                                                                group: settings.groupName,
                                                                name: jwtContent.name,
                                                                picture: `https://images.evetech.net/characters/${characterId}/portrait?size=128`,
                                                                message: 'Character added successfully!'
                                                            });
                                                        })
                                                        .catch(error => {
                                                            console.log("Error getting character skills:", error);
                                                        });
                                                });
                                            })
                                            .catch(error => {
                                                console.log("Error getting character info from ESI:", error);
                                                // Continue with success response even if ESI fetch fails
                                                res.render('eve-login-success', { 
                                                    discordId,
                                                    layout: 'eve',
                                                    site: settings.siteTitle,
                                                    group: settings.groupName,
                                                    name: jwtContent.name,
                                                    picture: `https://images.evetech.net/characters/${characterId}/portrait?size=128`,
                                                    message: `Error adding character. <br><hr><br>${error}`
                                                });
                                            });
                                    });
                                }
                            });
                        }
                    }
                });
            } 
        });
    });

    
};