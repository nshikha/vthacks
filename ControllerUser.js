var Piece = require('./Piece');
var getUID = require('./util').getUID;

var User = function(snakeGame, socket) {
    this.snakeGame = snakeGame;
    this.socket = socket;
    this.id = getUID();

    do {
        newPieceX = Math.floor((Math.random()*this.snakeGame.width));
        newPieceY = Math.floor((Math.random()*this.snakeGame.height));
        console.log(newPieceX);
        console.log('********');
    }
    while (this.snakeGame.getPieceAtCoord(newPieceX, newPieceY));

    this.piece = new Piece(snakeGame, newPieceX, newPieceY, 'food');
    this.piece._user = this;
    this.piece.update();

    var self = this;

    this._tmpdir = null; // null is no dir
    this.getNextDirection = function() {
        return self._tmpdir;
    };

    this.advance = function () {
        if (self.piece.isEaten)
            return;
        var direction = self.getNextDirection();
        if (direction === null)
            return;
        var newx = self.piece.x,
            newy = self.piece.y;
        if (direction === 'l')
            newx --;
        if (direction === 'r')
            newx ++;
        if (direction === 'u')
            newy --;
        if (direction === 'd')
            newy ++;
        // if boundary, then NOOP
        if (self.snakeGame.coordOutOfBounds(newx, newy)) {
            console.log('food outofbounds');
            return;
        }

        // get the piece at the anticipated spot
        var anticipatedPiece = self.snakeGame.getPieceAtCoord(newx, newy);
        if (anticipatedPiece) {
            console.log('food cant move there');
            return;
        }

        self.piece.x = newx;
        self.piece.y = newy;
        self.piece.update();
    };

    this.die = function() {
        self.socket.emit('controller::loseGame', null);
        self.snakeGame.deregisterUser(self);
    };

    this.setupSocketBindings = function() {
        self.socket.on('controller::data', function(input) {
            if (self.piece) {
                self._tmpdir = input;
            }
        });
    };
};
module.exports = User;
