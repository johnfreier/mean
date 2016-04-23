var mongodb = require('mongodb');
var express = require('express');
var fs = require('fs');

var status = ['IN_PROGRESS', 'GAME_OVER'];

function Player(name) {
  this.name = name;
  this.location = 0;
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
    if (game.status == status[1]) return;

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
    this.add = function(name) {
      game.players.push(new Player(name));
    },
    this.location = function(position) {
      if (position) game.players[game.turn].location = position;
      return game.players[game.turn].location;
    };
    this.current = function() {
      return game.players[game.turn];
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


// Web API
var app = express();
app.listen(3000);
app.get('/', function(request, response) {

  var id = request.query.id;
  collection.findOne({ '_id': objectId(id) }, function(error, gameObj) {

    var src = fs.readFileSync('src/game.js', 'utf8');
    eval('var rules = ' + src);

    var game = new Game();
    if (gameObj != null) game = gameObj;

    //console.log('game:' + JSON.stringify(game));

    var engine = new Engine(game, rules);

    engine.play();

    if (gameObj == null) {
      collection.insert(game, {w:1}, function(error, result) {
        response.send(JSON.stringify(result));
      });
    } else {
      collection.save(game,{w:1}, function(error, result) {
        response.send(JSON.stringify(game));
      });
    }

  });


});

app.get('/view', function(request, response) {
  var id = request.query.id;
  collection.findOne({ '_id': objectId(id) }, function(error, gameObj) {
    response.send(JSON.stringify(gameObj));
  });
});
