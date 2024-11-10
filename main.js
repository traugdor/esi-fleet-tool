const express = require("express");
const exphbs = require("express-handlebars");
const settings = require("./settings.js");
const db = require("./includes/db.js");
const { forEach } = require("lodash");

const app = express();
const port = settings.port || 8080;

//parsing middleware
app.use(express.urlencoded({extended: true}));

//parse application/json
app.use(express.json());

//static files
app.use(express.static('public'));

//setup handlebars
const handlebars = exphbs.create({ extname: '.hbs',});
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

//const routes = require('./server/routes/user');
//app.use('/', routes);

/*
    TODO:
    Get a discord bot in here
    Setup callbacks for Discord Auth SSO
    Setup callbacks for EVE Auth SSO
    Store some unique information in the browser cookies to identify the user.
    Install websockets
        establish lines of communication
            login flow
            data flow for modals or popups?
            maybe something else idk yet
        build client-side package to handle all websocket communications
        figure out how to keep track of which websocket is for each open connection in case multiple FCs are connected at once to avoid cross-talk
           ^^^ we had trouble with this last time.... -_-
*/

app.listen(port, () => console.log(`Listening on port ${port}`));