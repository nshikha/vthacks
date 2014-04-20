var SnakeUser = require('./SnakeUser');
var User = require('./ControllerUser');
var _ = require('underscore');

var SnakeGame = function(width, height) {

    this.width;
    this.height;

    this.pieces = []; //automatically kept consistent by the Piece class

    // When snakeUser is null, the game has not yet started and is waiting for a snake to connect.
    this.snakeUser = null;
    this.foodUsers = [];

    var self = this;


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

    this.startSnakeWithSocket = function(socket) {
        self.snakeUser = new SnakeUser(self, socket, true);
        self.snakeUser.setupSocketBindings();
    };

    this.setupIO = function() {
        self.io.sockets.on('connection', function (socket) {
            if (self.snakeUser === null) {
                // create a snakeUser and bind to self.snakeUser
                socket.emit('init', 'snake');
                self.startSnakeWithSocket(socket);

                socket.on('disconnect', function() {
                    if (self.snakeUser)
                        self.snakeUser.disappear();
                    self.deregisterSnake();
                });

            } else {
                // create a foodUser and push onto self.foodUsers
                var user = new User(self, socket);
                self.foodUsers.push(user);
                socket.emit('init', 'food');
                user.setupSocketBindings();

                socket.on('disconnect', function() {
                    user.piece.disappear();
                    self.deregisterUser(user);
                });
            }
        });
    };

    this.deregisterUser = function(user) {
        // remove the user from the list of users.
        var index = self.foodUsers.indexOf(user);
        if (index !== -1)
            self.foodUsers.splice(index, 1);
    }

    this.deregisterSnake = function() {
        if (self.snakeUser) {
            self.snakeUser = null;
        }
    };

    this.foodLoopIter = function() {
        _.each(self.foodUsers, function(user) {
            user.advance();
        });
    };

    this.snakeLoopIter = function() {
        var snakeUser = this.snakeUser;
        if (snakeUser)
            snakeUser.advance();
    };

    this.startSnakeLoop = function(delay) {
        self.loopid = setInterval(function() {
            self.snakeLoopIter();
        }, delay);

        self.foodloopid = setInterval(function() {
            self.foodLoopIter();
        }, delay / 3 * 2);
    };

    // not used right now
    this.die = function () {
        clearInterval(self.loopid);
        clearInterval(self.foodloopid);
    }

    this.serve = function(app) {
        self.io = require('socket.io').listen(app);
        self.setupIO();
        self.startSnakeLoop(200);
    };
};
module.exports = SnakeGame;
