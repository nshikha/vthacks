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
    this.piece.update();

    var self = this;

    this._tmpdir = null; // null is no dir
    this.getNextDirection = function() {
        return self._tmpdir;
    };

    this.setupSocketBindings = function() {
        self.socket.on('controller::data', function(input) {
            if (self.piece.isEaten) {
                // user moved eaten food
                console.log('ignoring because eaten');
            } else {
                console.log('controller');
                console.log(input);
                // move self.piece and update
                var dx = input[0];
                var dy = input[1];


                //reversed form usual since +Y points downwards
                function getDirection(x, y){
                    if (x === 0 && y === 0)
                        return null;
                    if ( x + y >= 0 && x-y >= 0) {
                        return "r";
                    } else if (x+y < 0 && x-y >= 0) {
                        return "u";
                    } else if (x+y < 0 && x-y < 0) {
                        return "l";
                    } else {
                        return "d";
                    }
                }
                self._tmpdir = getDirection(dx, dy);
            }
        });

        self.socket.on('disconnect', function() {
            self.disappear();
            // remove the user from the list of users.
            var index = self.snakeGame.foodUsers.indexOf(self);
            self.snakeGame.foodUsers.splice(index, 1);
        });
    };

    this.disappear = function() {
        if (!self.piece.eaten)
            self.piece.disappear();
    };
};
module.exports = User;
