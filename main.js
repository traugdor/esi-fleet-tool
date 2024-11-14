//-----------------------------------------------------------------------------
// Dependencies
//-----------------------------------------------------------------------------
const express = require("express");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const settings = require("./settings.js");
const { v4: uuid } = require("uuid");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const favicon = require("serve-favicon");
const path = require("path");

//-----------------------------------------------------------------------------
// Express Configuration
//-----------------------------------------------------------------------------
const app = express();
const port = settings.port || 8080;

// Middleware Setup
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static('public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//-----------------------------------------------------------------------------
// Template Engine Setup
//-----------------------------------------------------------------------------
const handlebars = exphbs.create({ extname: '.hbs' });
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');
handlebars.partialsDir = './views/partials';

// Handlebars Helpers
Handlebars.registerHelper('if2', function(arg1, arg2, options) {
    if(arg1 || arg2){
        return options.fn(this);
    }
    return options.inverse(this);
});

//-----------------------------------------------------------------------------
// Session Configuration
//-----------------------------------------------------------------------------
const sess = {
    name: 'esifleettool.sid',
    genid: function(req) {
        return uuid();
    },
    resave: true,
    saveUninitialized: true,
    store: new FileStore({
        path: './sessions',
        ttl: 14 * 24 * 60 * 60,
        reapInterval: 24 * 60 * 60
    }),
    secret: settings.EVEclientID,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
};

app.use(session(sess));

//-----------------------------------------------------------------------------
// Route Handlers
//-----------------------------------------------------------------------------
// Home Route
app.get('/', (req, res) => {
    const pagedata = {
        group: settings.groupName,
        site: settings.siteTitle,
        loggedIn: req.session.esifleettool?.loggedIn || false,
        fourohfour: false
    };
    
    if(!req.session.esifleettool) {
        req.session.esifleettool = {
            loggedIn: false,
            uuid: uuid()
        };
    }
    
    res.render('home', pagedata);
});

// Authentication Routes
const loginServer = require("./includes/loginServer.js")(app, settings);

// 404 Handler
app.use((req, res) => {
    res.status(404);
    res.render('404', {fourohfour: true, loggedIn: false});
});

//-----------------------------------------------------------------------------
// Server Startup
//-----------------------------------------------------------------------------
app.listen(port, () => console.log(`Listening on port ${port}`));
const sockets = require("./includes/sockets.js")(app);

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