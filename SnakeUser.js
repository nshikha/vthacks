var Piece = require('./Piece');
var getUID = require('./util').getUID;
var _ = require('underscore');

var SnakeUser = function(snakeGame, socket) {
    this.snakeGame = snakeGame;
    this.socket = socket;
    this.id = getUID();

    // SNAKE PIECES TODO make them not fall on top of each other when multiple people connect
    this.snakePieces = [new Piece(snakeGame, 3, 5, 'snake'),
                       new Piece(snakeGame, 3, 4, 'snake'),
                       new Piece(snakeGame, 3, 3, 'snake')];
    this.snakePieces[1].colorA = this.snakePieces[0].colorA;
    this.snakePieces[2].colorA = this.snakePieces[0].colorA;


    this.lastDirection = '';
    this.direction = 'r';

    var self = this;

    this.setupSocketBindings = function() {
        _.each(self.snakePieces, function(p) {
            p.update();
        });

        // TODO mod controller to emit this
        self.socket.on('snake::changeDirection', function(input) {
            // assert input is one of ['l', 'r', 'u', 'd']
            if (input === null)
                return;
            if ('l r u d'.split(' ').indexOf(input) === -1) {
                console.log('Illegal input');
                console.log(input);
                return;
            }
            var oppDirs = {'l':'r', 'r':'l', 'u':'d', 'd': 'u'};
            // NOOP if input makes snake go backwards
            if ((self.lastDirection != input) && (self.lastDirection != oppDirs[input])) {
                console.log('changing dir to '+input);
                self.direction = input;
            }
        });

        socket.on('disconnect', function() {
            self.disappear();
        });
    };

    this.advance = function () {
        var head = self.snakePieces[0];
        var newx = head.x, newy = head.y;
        if (self.direction === 'l')
            newx --;
        if (self.direction === 'r')
            newx ++;
        if (self.direction === 'u')
            newy --;
        if (self.direction === 'd')
            newy ++;

        // if boundary, then snake game over
        if (self.snakeGame.coordOutOfBounds(newx, newy)) {
            console.log('outofbounds');
            self.die();
            return;
        }

        // get the piece at the anticipated spot
        // TODO worry about someone elses snake tail
        var tail = self.snakePieces[self.snakePieces.length - 1];

        // if it's the end of tail, normal case, jk lol the tail is moving
        var anticipatedPiece = self.snakeGame.getPieceAtCoord(newx, newy);
        if (anticipatedPiece === tail)
            anticipatedPiece = null;

        var newP;
        if (anticipatedPiece) {
            if (anticipatedPiece.type === 'snake') {
                // if snake, then snake game over
                console.log('snakehitself');
                self.die();
                return;
            } else {
                // if food is there, then snake gets longer (doesnt get shorter), food isEaten
                console.log('eatingfood');
                anticipatedPiece.disappear();
                self.socket.emit('snake::ateFood', null);
                anticipatedPiece._user.die();
            }
        } else {
            //pops tail off in normal case of snake moving.
            self.snakePieces.pop().disappear();
        }

        newP = new Piece(self.snakeGame, newx, newy, 'snake');
        newP.colorA = head.colorA;

        newP.update();
        console.log('move is clear');

        self.snakePieces = [newP].concat(self.snakePieces);
        console.log('moved '+self.direction+' **');
        this.lastDirection = self.direction; //cache last moved direction to avoid collissions.
    };

    this.die = function() {
        self.socket.emit('snake::loseGame', null);
        self.disappear();
        self.snakeGame.deregisterSnake(self);
        self.snakeGame.startSnakeWithSocket(self.socket);
    };

    this.disappear = function() {
        while (self.snakePieces.length > 0) {
            var p = self.snakePieces.pop();
            p.disappear();
        }
    };

};
module.exports = SnakeUser;
