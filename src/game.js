{
  deck: [ {
      card: {
        color: 'green'
      },
      amount: 6
    },{
      card: {
        color: 'blue'
      },
      amount: 6
    }, {
      card: {
        color: 'yellow'
      },
      amount: 6
    }, {
      card: {
        color: 'red'
      },
      amount: 6
    }, {
      card: {
        color: 'purple'
      },
      amount: 6
    }, {
      card: {
        color: 'orange'
      },
      amount: 6
    },{
      card: {
        color: 'double green'
      },
      amount: 3
    },{
      card: {
        color: 'double blue'
      },
      amount: 4
    }, {
      card: {
        color: 'double yellow'
      },
      amount: 4
    }, {
      card: {
        color: 'double red'
      },
      amount: 4
    }, {
      card: {
        color: 'double purple'
      },
      amount: 4
    }, {
      card: {
        color: 'double orange'
      },
      amount: 3
    }, {
      card: {
        color: 'gingerbread',
        special: true
      },
      amount: 1
    }, {
      card: {
        color: 'peppermint forest',
        special: true
      },
      amount: 1
    }, {
      card: {
        color: 'gumdrop',
        special: true
      },
      amount: 1
    }, {
      card: {
        color: 'peanut',
        special: true
      },
      amount: 1
    }, {
      card: {
        color: 'lollypop',
        special: true
      },
      amount: 1
    }, {
      card: {
        color: 'ice cream',
        special: true
      },
      amount: 1
    }
  ],
  board: [
    'red','purple','yellow','blue','orange','green',
    'red','purple','gingerbread','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green', 'peppermint forest',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','gumdrop','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','peanut', 'green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','lollypop', 'blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'ice cream','red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red','purple','yellow','blue','orange','green',
    'red'
  ],
  bonus: [
      { position: 4, move: 58, description: 'rainbow trail' },
      { position: 34, move: 44, description: 'gumdrop pass' },
      { position: 45, description: 'licorice red' },
      { position: 85, description: 'licorice blue' },
      { position: 116, description: 'licorice  yellow' }
  ],
  player: {
    isSticky: false
  },
  actionNew: function(engine) {
    engine.player.add('player1', this.player);
    engine.player.add('player2', this.player);
  },
  actionTurn: function(engine) {

    var card = engine.draw();
    var color = card.color;
    var double = (color.indexOf('double') > -1) ? 2 : 1;
    var position = engine.player.location();
    var isSticky = false;
    var self = this;

    // remove the double and get just he color
    color = color.replace('double ', '');
    engine.history(engine.player.current().name + ' drew a ' + card.color);

    // Handle sticky spaces
    if (engine.player.current().properties.isSticky) {
      engine.history(engine.player.current().name + ' is stuck and loses a turn.');
      engine.player.current().properties.isSticky = false;
      return;
    }

    // Handle Special Cards
    if (card.special) position = 0;

    // Move the players position
    for(var move = 1; move <= double; move++) {
      position++;
      for (position; position < this.board.length; position++) {
        if (this.board[position] == color) break;
      }
    }

    // Check for ladders
    this.bonus.forEach(function(ladder){
      if (ladder.move) {
        if (position == ladder.position) {
          position = ladder.move;
          engine.history(engine.player.current().name + ' landed on ' + ladder.description);
        }
      }
    });

    // Ladded on a sticky spot.
    this.bonus.forEach(function(sticky){
      if (!sticky.move) {
        if (position == sticky.position) {
          engine.history(engine.player.current().name + ' is stuck on ' + sticky.description);
          engine.player.current().properties.isSticky = true;
        }
      }
    });

    // Set the players position
    engine.player.location(position);

  },
  actionWin: function(engine) {
    return (engine.player.location() >= this.board.length);
  }
}
