var SnakeUser = require('./SnakeUser');
var User = require('./ControllerUser');
var _ = require('underscore');

var SnakeGame = function(width, height) {

    this.width;
    this.height;

    this.boardSocket;

    this.pieces = []; //automatically kept consistent by the Piece class

    // When snakeUser is null, the game has not yet started and is waiting for a snake to connect.
    this.snakeUsers = [];
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
        var snakeUser = new SnakeUser(self, socket);
        self.snakeUsers.push(snakeUser);
        snakeUser.setupSocketBindings();

        socket.on('disconnect', function() {
            self.deregisterSnake(snakeUser);
        });
    };

    this.setupIO = function() {
        self.io.sockets.on('connection', function (socket) {
            if (!self.boardSocket) {
                self.boardSocket = socket;
                socket.emit('init', 'board');
                socket.on('disconnect', function() {
                    delete self.boardSocket;
                });
            } else {
                socket.emit('init', 'controller::snake');
                self.startSnakeWithSocket(socket);
                /* Later maybe allow people to join as food.
                // create a foodUser and push onto self.foodUsers
                var user = new User(self, socket);
                self.foodUsers.push(user);
                user.setupSocketBindings();

                socket.on('disconnect', function() {
                    user.piece.disappear();
                    self.deregisterUser(user);
                });
                */
            }
        });
    };

    this.deregisterUser = function(user) {
        // remove the user from the list of users.
        var index = self.foodUsers.indexOf(user);
        if (index !== -1)
            self.foodUsers.splice(index, 1);
        else
            console.log('uh oh user wasnt found was it already deregistered?');
    }

    this.deregisterSnake = function(snakeUser) {
        var index = self.snakeUsers.indexOf(snakeUser);
        if (index !== -1)
            self.snakeUsers.splice(index, 1);
        else
            console.log('uh oh snake wasnt found was it already deregistered?');
    };

    this.foodLoopIter = function() {
        _.each(self.foodUsers, function(user) {
            user.advance();
        });
    };

    this.snakeLoopIter = function() {
        var snakeUsers = this.snakeUsers;
        _.each(snakeUsers, function(snakeUser) {
            snakeUser.advance();
        });
    };

    this.startSnakeLoop = function(delay) {
        self.loopid = setInterval(function() {
            self.snakeLoopIter();
        }, delay);

        self.foodloopid = setInterval(function() {
            self.foodLoopIter();
        }, delay / 3 * 2);
    };

    this.serve = function(app) {
        self.io = require('socket.io').listen(app);
        self.setupIO();
        self.startSnakeLoop(200);
    };
};
module.exports = SnakeGame;
