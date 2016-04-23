var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , session = require('express-session')
  , SteamStrategy = require('passport-steam').Strategy
  , request = require('request')
  , MarketPriceManager = require('steam-market-manager');

//Steam market manager instance(CS:GO)
var market = new MarketPriceManager({
	"appID": 730,
	"backpacktf" : "5718ca93866747306e3c5997",
	"cache": 3600
});


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Steam profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the SteamStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: 'D941280574F18C89CC197A47510871E6'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Steam profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Steam account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({
    secret: 'your secret',
    name: 'name of session id',
    resave: true,
    saveUninitialized: true}));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

/*
app.get('/account-json', ensureAuthenticated, function(req, res){
  var SteamInventoryURL =  'http://steamcommunity.com/profiles/' + req.user.id + '/inventory/json/730/2';
  //console.log(SteamInventoryURL);
  request({
  	url: SteamInventoryURL,
  	json: true
  }, function (error, response, body) {
  	if (!error && response.statusCode === 200) {
  		//console.log(body);
  		res.render('account-json', {user: req.user, json: JSON.stringify(body, null, 2)});
  	} else { 
  		res.redirect('/');
  	} 
  });

  //res.render('account-json', { user: req.user });

  //console.log(req.user);
}); */

app.get('/account-json', ensureAuthenticated, function(req, res){
	market.getAllItems({}, function(err) {
		if( err) {
			console.log('Error', err);
			return;
		}
		market.getInventory({
			'steamid': req.user.id,
			'contextID': 2,
			'getWithPrices': true,
			'tradableOnly': true,
		}, function(err, inventory) {
			if( err) {
				console.log('Error: ', err);
				return;
			}
			//inventory.forEach(function (item) {});
			res.render('account-json', {items: inventory})
			//console.log('Inventory: ', inventory); //  An array containing CEconItem objects for the user's inventory items
		});
	});
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// GET /auth/steam
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Steam authentication will involve redirecting
//   the user to steamcommunity.com.  After authenticating, Steam will redirect the
//   user back to this application at /auth/steam/return
app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });

// GET /auth/steam/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });

app.listen(3000);

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

// http://steamcommunity.com/profiles/<PROFILEID>/inventory/json/753/1 76561198052424084