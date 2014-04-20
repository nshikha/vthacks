var getUID = require('./util').getUID;

var Piece = function(snakeGame, x, y, type) {
    this.id = getUID();
    this.snakeGame = snakeGame;
    this.x = x;
    this.y = y;
    this.type = type;

    var self = this;

    // pieces bookkeeping
    this.snakeGame.pieces.push(this);

    this.JSON = function() {
        return { id: self.id.toString(),
            x: self.x,
            y: self.y , 
            type: self.type};

    };

    this.update = function() {
        // snakeUser's socket is the snake board socket
        self.snakeGame.snakeUser.socket.emit('piece::update', self.JSON());
    };

    this.disappear = function() {
        this.snakeGame.snakeUser.socket.emit('piece::disappear', self.JSON());

        // pieces bookkeeping
        // remove the piece from the pieces array in snakeGame
        var index = self.snakeGame.pieces.indexOf(self);
        self.snakeGame.pieces.splice(index, 1);
    };
};
module.exports = Piece;
