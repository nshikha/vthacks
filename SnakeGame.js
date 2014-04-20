var SnakeUser = require('./SnakeUser');
var User = require('./ControllerUser');

var SnakeGame = function(width, height) {

    this.width;
    this.height;

    this.pieces = []; //automatically kept consistent by the Piece class

    // When snakeUser is null, the game has not yet started and is waiting for a snake to connect.
    this.snakeUser = null;
    this.foodUsers = [];

    var self = this;

    this.hasStarted = function() {
        return self.snakeUser !== null;
    };
    
    this.coordOutOfBounds = function(x, y) {
        return (x < 0) || (x >= self.width) ||
                   (y < 0) || (y >= self.height);
    };
    this.getPieceAtCoord = function(x, y) {
        var p;
        for (var i = 0; i < self.pieces.length; i ++) {
            p = self.pieces[i];
            if ((p.x === x) && (p.y === y))
                return p;
        }
        return null;
    };

    this.setupIO = function() {
        self.io.sockets.on('connection', function (socket) {
            if (!self.hasStarted()) {
                // create a snakeUser and bind to self.snakeUser
                self.snakeUser = new SnakeUser(self, socket, true);
                socket.emit('init', 'snake');

                self.snakeUser.setupSocketBindings();
                self.snakeUser.startSnakeLoop(200);
            } else {
                // create a foodUser and push onto self.foodUsers
                var user = new User(self, socket);
                self.foodUsers.push(user);
                socket.emit('init', 'food');
                user.setupSocketBindings();
            }
        });
    };

    this.serve = function(app) {
        self.io = require('socket.io').listen(app);
        self.setupIO();
    };
};
module.exports = SnakeGame;
