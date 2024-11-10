const db = require("node-persist");
const { v4: uuid } = require("uuid");
const users = require("./db/users.js");
const characters = require("./db/characters.js");
const settings = require("./db/settings.js");
const fleets = require("./db/fleets.js");

module.exports = {

    users,
    characters,
    settings,
    fleets

}