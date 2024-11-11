const express = require("express");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const settings = require("./settings.js");
const { v4: uuid } = require("uuid");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const cookieParser = require("cookie-parser");

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

handlebars.partialsDir = './views/partials';

var sess = {
    genid: function(req) {
        return uuid();
    },
    title: settings.siteTitle,
    resave: true,
    saveUninitialized: true,
    store: new FileStore(),
    secret: settings.EVEclientID,
    cookie: {}
};

app.use(session(sess));
app.use(cookieParser());

app.get('/login', function(req, res){
    res.render('login');
});
app.get('/', (req, res) => res.render('home'))
app.use( (req, res) => {
    console.log("404")
    res.status(404);
    res.render('404', {404:true})
});

app.get('/Discord/SSO', (req, res) => {
    var state = req.state;
    var msg = "";
    if (state == 'bot'){
        res.send("Done. Added to discord")
    }
})

Handlebars.registerHelper('if2', function(arg1, arg2, options) {
    if(arg1 || arg2){
        return options.fn(this);
    }
    return options.inverse(this);
})

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
const sockets = require("./includes/sockets.js")(app);