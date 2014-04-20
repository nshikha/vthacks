var getUID = require('./util').getUID;
var COLORS = require('./util').COLORS;
var LETTERS = require('./util').ALPHABET;

var Piece = function(snakeGame, x, y, type) {
    this.id = getUID();
    this.snakeGame = snakeGame;
    this.x = x;
    this.y = y;
    this.type = type;

    this.colorA = COLORS[Math.floor((Math.random()*COLORS.length)-1)];
    if (this.type == 'snake')
        this.colorB = null;
    else
        this.colorB = LETTERS[Math.floor((Math.random()*LETTERS.length)-1)];

    var self = this;

    // pieces bookkeeping
    this.snakeGame.pieces.push(this);

    this.JSON = function() {
        return { id: self.id.toString(),
            x: self.x,
            y: self.y , 
            type: self.type, 
            colorA: self.colorA,
            colorB: self.colorB
        };

    };

    this.update = function() {
        // snakeUser's socket is the snake board socket
        if (self.snakeGame.snakeUser)
        self.snakeGame.snakeUser.socket.emit('piece::update', self.JSON());
    };

    this.disappear = function() {
        if (self.snakeGame.snakeUser)
        this.snakeGame.snakeUser.socket.emit('piece::disappear', self.JSON());

        // pieces bookkeeping
        // remove the piece from the pieces array in snakeGame
        var index = self.snakeGame.pieces.indexOf(self);
        self.snakeGame.pieces.splice(index, 1);
    };
};
module.exports = Piece;
