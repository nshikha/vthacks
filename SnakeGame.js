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

                self.startSnakeLoop(200);
            } else {
                // create a foodUser and push onto self.foodUsers
                var user = new User(self, socket);
                self.foodUsers.push(user);
                socket.emit('init', 'food');
                user.setupSocketBindings();

                socket.on('disconnect', function() {
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

    this.foodLoopIter = function() {
        _.each(self.foodUsers, function(user) {
            user.advance();
        });
    };

    this.snakeLoopIter = function() {
        var snakeUser = this.snakeUser;
        snakeUser.advance();
    };

    this.alive = true;
    this.startSnakeLoop = function(delay) {
        self.loopid = setInterval(function() {
            if (self.alive) self.snakeLoopIter();
        }, delay);

        self.foodloopid = setInterval(function() {
            if (self.alive) self.foodLoopIter();
        }, delay);
    };

    this.die = function () {
        self.alive = false;
        clearInterval(self.loopid);
        clearInterval(self.foodloopid);
    }

    this.serve = function(app) {
        self.io = require('socket.io').listen(app);
        self.setupIO();
    };
};
module.exports = SnakeGame;
