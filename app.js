/**
 * Module dependencies.
 */

var express = require('express');
var MongoStore = require('connect-mongo')(express);
var flash = require('express-flash');
var less = require('less-middleware');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');

var app = express();

/**
 * Load controllers.
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');

/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.log('✗ MongoDB Connection Error. Please make sure MongoDB is running.'.red);
});


/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var week = (day * 7);
var month = (day * 30);

app.locals.cacheBuster = Date.now();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/lightbox'));

app.use(express.compress());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(express.session({
  secret: 'your secret code',
  store: new MongoStore({
    db: mongoose.connection.db,
    auto_reconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(flash());
app.use(less({ src: __dirname + '/public', compress: true }));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));
app.use(function(req, res) {
  res.render('404', { status: 404 });
});
app.use(express.errorHandler());

/**
 * Application routes.
 */

app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);

app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);


app.get('/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_photos'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});
