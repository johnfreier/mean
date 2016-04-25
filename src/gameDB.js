var mongodb = require('mongodb');
var express = require('express');
var fs = require('fs');
var crypto = require('crypto');

var status = ['IN_PROGRESS', 'GAME_OVER'];

function Player(name, properties) {
  this.name = name;
  this.location = 0;
  this.properties = properties;
  this.turn = 0;
};

function Game() {
  this.turn = 0;
  this.turns = 0;
  this.deck = [];
  this.history = [];
  this.players = [];
  this.status = status[0];
};

function Engine(game, rules) {

  var self = this;

  this.play = function() {

    // Check the status of the game and make sure its in progress.
    if (game.status == status[1]) return;

    // If the game turns are 0 then its a new game.
    if (game.turns == 0) {
      rules.actionNew(this);
      game.history.push('Starting new game.');
    }

    game.history.push(this.player.current().name + ' turn.');
    rules.actionTurn(this);

    if (rules.actionWin(this)) {
      game.history.push(this.player.current().name + ' has won the game.');
      game.status = status[1];
    }

    game.turn = (game.turn + 1 >= game.players.length) ? 0 : game.turn + 1;
    game.turns++;

  };

  this.history = function(str) {
    game.history.push(str);
  };

  this.draw = function() {
    if (game.deck.length <= 0) {
      this.shuffle();
    };
    var result = game.deck[game.deck.length - 1];
    game.deck.pop();

    return result;
  };

  this.shuffle = function() {

    // Build the deck from the rules.
    var rulesDeck = [];
    rules.deck.forEach(function(cardType) {
      var amount = (cardType.amount) ? cardType.amount : 1;
      for (var x = 0; x < amount; x++) {
        rulesDeck.push(cardType.card);
      }
    });

    // Final suffled deck.
    var shuffleDeck = [];
    while(rulesDeck.length > 0) {
      var randomCard = Math.floor(Math.random() * (rulesDeck.length));
      shuffleDeck.push(rulesDeck[randomCard]);
      rulesDeck.splice(randomCard, 1);
    }

    game.deck = shuffleDeck;

  };

  this.player = new function() {
    this.add = function(name, properties) {
      game.players.push(new Player(name, properties));
    },
    this.location = function(position) {
      if (position) game.players[game.turn].location = position;
      return game.players[game.turn].location;
    };
    this.current = function() {
      return game.players[game.turn];
    };
    this.next = function() {
      var next = (game.turn + 1 >= game.players.length) ? 0 : game.turn + 1;
      return game.players[next];
    };
  };

};

// Database
var mongoClient = mongodb.MongoClient;
var objectId = require('mongodb').ObjectId;
var collection;
mongoClient.connect('mongodb://localhost:27017/gameDB', function(error, db) {
  if (error) {
    console.log('Database not found!');
    process.exit(1);
  }

  collection = db.collection('games');

});

var gscript = 'src/game.js';

// Web API
var app = express();
app.listen(3000);
app.get('/', function(request, response) {
  var id = request.query.id;
  var turn = request.query.turn;

  if (!id && !turn) {
    response.send('Invalid URL');
  }

  collection.findOne({ '_id': objectId(id) }, function(error, game) {

    var src = fs.readFileSync(gscript, 'utf8');
    eval('var rules = ' + src);

    var engine = new Engine(game, rules);

    // Check to make sure the turn id matches with the games turn.
    if (game.turns > 0 && engine.player.current().turn != turn) {
      response.send('Invalid turn id!');
      return;
    }

    // Take a turn
    engine.play();

    // Set the next players turn id.
    engine.player.current().turn = getRandomToken();

    collection.save(game,{w:1}, function(error, result) {
      var json = addNextURL(game);
      console.log('Notification Message:' + json.next);

      var html = buildTurnPage(game);
      html += 'Turn complete, you will be notified when it is your turn again.';
      html += '<a href="' + json.next + '">' + json.next + '</a>';
      response.send(html);
    });

  });

});

app.get('/new', function(request, response) {

    var src = fs.readFileSync(gscript, 'utf8');
    eval('var rules = ' + src);

    var game = new Game();

    var engine = new Engine(game, rules);

    // Take a turn
    engine.play();

    // Set the next players turn id.
    engine.player.current().turn = getRandomToken();

    collection.insert(game, {w:1}, function(error, result) {
      var json = addNextURL(game);
      console.log('Notification Message:' + json.next);
      response.send(json.next);
    });

});

app.get('/rest', function(request, response) {

  var id = request.query.id;
  var turn = request.query.turn;
  collection.findOne({ '_id': objectId(id) }, function(error, gameObj) {

    // View game object only.
    if (id && gameObj && !turn) {
        response.send(JSON.stringify(gameObj));
        return;
    }

    var src = fs.readFileSync(gscript, 'utf8');
    eval('var rules = ' + src);

    var game = (gameObj) ? gameObj : new Game();

    var engine = new Engine(game, rules);

    // Check to make sure the turn id matches with the games turn.
    if (game.turns > 0 && engine.player.current().turn != turn) {
      response.send('Invalid turn id!');
      return;
    }

    // Take a turn
    engine.play();

    // Set the next players turn id.
    engine.player.current().turn = getRandomToken();

    if (gameObj == null) {
      collection.insert(game, {w:1}, function(error, result) {
        //var json = addNextURL(result.ops[0]);
        var json = addNextURL(game);
        console.log('Message:' + json.next);
        response.send(JSON.stringify(json));
      });
    } else {
      collection.save(game,{w:1}, function(error, result) {
        var json = addNextURL(game);
        console.log('Message:' + json.next);
        response.send(JSON.stringify(json));
      })
    }

  });


});

app.get('/view', function(request, response) {
  var id = request.query.id;
  collection.findOne({ '_id': objectId(id) }, function(error, gameObj) {
    response.send(JSON.stringify(gameObj));
  });
});

// Generate a random number.
function getRandomToken() {
  return crypto.randomBytes(12).toString('hex');
};

function addNextURL(game) {
  console.log('game:' + JSON.stringify(game.turn));
  var turnId = game.players[game.turn].turn;
  var gameId = game._id;
  var url = 'http://localhost:3000/?id=' + gameId + '&turn=' + turnId;
  game.next = url;
  return game;
};

function buildTurnPage(game) {
  var html = '<ul>';
  game.history.forEach(function(history) {
    html += '<li>' + history + '</li>';
  });
  html += '</ul>';
  return html;
}
