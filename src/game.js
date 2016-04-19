{
  deck: [ {
      color: 'green'
    },{
      color: 'blue'
    }, {
      color: 'yellow'
    }
  ],
  board: [
    'green', 'blue', 'yellow', 'green', 'blue', 'yellow'
  ],
  actionNew: function(engine) {
    engine.player.add('player1');
    engine.player.add('player2');
  },
  actionTurn: function(engine) {
    var card = engine.draw();
    var position = engine.player.location();
    for (position; position < this.board.length; position++) {
      if (this.board[position] == card.color) break;
    }
    engine.player.location(position);
    engine.history(engine.player.current().name + ' drew a ' + card.color);
  },
  actionWin: function(engine) {
    return (engine.player.location() >= this.board.length);
  }
}
