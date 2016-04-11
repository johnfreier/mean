var mongodb = require('mongodb');
var express = require('express');
var crypto = require('crypto');
var cookieParser = require('cookie-parser')

var app = express();
var mongoClient = mongodb.MongoClient;
var objectId = require('mongodb').ObjectId;

// Needed for parsing body of request.
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// Need for parsing cookies
app.use(cookieParser());

var collection;
mongoClient.connect('mongodb://localhost:27017/exampleDB', function(error, db) {

  if (error) {
    console.log('Database not found!');
    process.exit(1);
  }

  collection = db.collection('example');

});

app.get('/', function(request, response) {
  response.send('hello');
});

app.get('/create', function(request, response) {
  var date = new Date();
  var user = { username: 'jfreier', password: 'password', token: '', expiration: date.getTime() };
  collection.insert(user, {w:1}, function(error, result) {
    response.send(JSON.stringify(result));
  });
});

app.post('/login', function(request, response) {

  var username = request.body['username'];
  var password = request.body['password'];

  collection.findOne({ username: username, password: password }, function(error, item) {

    if (!item) response.status(403).send('Invalid login!');

    var token = getRandomToken();
    var date = getCurrentExpirationTime()
    collection.update({ '_id': objectId(item._id) },
                      {$set: {token: token, expiration: date }},
                      {w:1}, function(error, result) {

      response.cookie('sessionid', token);
      response.send('token:' + token);

    });

  });
});

app.get('/secure', function(request, response) {
  isLoggedIn(request, function(isSecure) {
    if (isSecure) {
      response.send('secure');
    } else {
      response.send('get out!');
    }
  });
});

app.listen(3000);

function getRandomToken() {
  return crypto.randomBytes(32).toString('hex');
};

function isLoggedIn(request, callback) {
  var isValid = false;
  var token = request.cookies['sessionid'];
  console.log('token:' + token);
  collection.findOne( { token: token }, function(error, response) {
    if (response && response.token) {

      var expirationTime = getCurrentExpirationTime();
      var sessionTime = response.expiration;
      var currentTime = (new Date()).getTime();
      console.log('x:' + (new Date(currentTime)).toString());
      console.log('y:' + (new Date(sessionTime)).toString());
      console.log('x:' + expirationTime + '>' + sessionTime);
      if (currentTime < sessionTime) {
        isValid = true;
        collection.update({ '_id': objectId(response._id) }, {$set: {expiration: expirationTime}});
      }

    }

    console.log('response:' + JSON.stringify(response));

    callback(isValid);

  });
};

function getCurrentExpirationTime() {
  var minutes = 20;
  var date = new Date();
  return date.getTime() + (minutes * 60000);
}
