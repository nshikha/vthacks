
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();
var _ = require('underscore');

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var PORT = 3000;
var _id_ = 0;
var getUID = function() { return (_id_++).toString(); };

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
                        return "d";
                    } else if (x+y < 0 && x-y >= 0) {
                        return "u";
                    } else if (x+y < 0 && x-y < 0) {
                        return "l";
                    } else {
                        return "r";
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

var SnakeUser = function(snakeGame, socket) {
    this.snakeGame = snakeGame;
    this.socket = socket;
    this.id = getUID();

    // SNAKE PIECES
    this.snakePieces = [new Piece(snakeGame, 3, 5, 'snake'),
                       new Piece(snakeGame, 3, 4, 'snake'),
                       new Piece(snakeGame, 3, 3, 'snake')];


    this.lastDirection = '';
    this.direction = 'r';
    this.alive = true;

    var self = this;

    this.setupSocketBindings = function() {
        _.each(self.snakePieces, function(p) {
            p.update();
        });
        self.socket.on('snake::changeDirection', function(input) {
            if (self.alive) {
                // assert input is one of ['l', 'r', 'u', 'd']
                var oppDirs = {'l':'r', 'r':'l', 'u':'d', 'd': 'u'};
                // NOOP if input makes snake go backwards
                if ((self.lastDirection != input) && (self.lastDirection != oppDirs[input])) {
                    console.log('changing dir to '+input);
                    self.direction = input;
                }
            }
        });

        self.socket.on('snake::setBoardSize', function(wh) {
            self.snakeGame.width = wh.width;
            self.snakeGame.height = wh.height;
        });

        self.socket.on('disconnect', function() {
            // game over
            process.exit(0);
        });
    };

    this.foodLoopIter = function() {
        _.each(self.foodUsers, function(user) {
            var direction = user.getNextDirection();
            if (direction === null)
                return;
            var newx = user.piece.x,
                newy = user.piece.y;
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

            user.piece.x = newx;
            user.piece.y = newy;
            user.piece.update();

        });
    };

    this.snakeLoopIter = function() {
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
        var tail = self.snakePieces[self.snakePieces.length - 1];

        // if it's the end of tail, normal case, jk lol the tail is moving
        var anticipatedPiece = self.snakeGame.getPieceAtCoord(newx, newy);
        if (anticipatedPiece === tail)
            anticipatedPiece = null;

        var newP;
        //added fix for case that you are going to overlap the tail of the snake
        if (anticipatedPiece) {
            if (anticipatedPiece.type === 'snake') {
                // if snake, then snake game over
                console.log('snakehitself');
                self.die();
                return;
            } else {
                // if food is there, then snake gets longer (doesnt get shorter), food isEaten
                console.log('eatingfood\n\n\n\n\n\n\n\n\n\n\n');
                anticipatedPiece.isEaten = true;
                anticipatedPiece.disappear();
            }
        } else {
            //pops tail off in normal case of snake moving.
            self.snakePieces.pop().disappear();
        }

        newP = new Piece(self.snakeGame, newx, newy, 'snake');

        newP.update();
        console.log('move is clear');

        self.snakePieces = [newP].concat(self.snakePieces);
        console.log('moved '+self.direction+' **');
        this.lastDirection = self.direction; //cache last moved direction to avoid collissions.
    };

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

    this.disappear = function() {
        while (self.snakePieces.length > 0) {
            p.disappear();
            var p = self.snakePieces.pop();
        }
    };

};

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

    this.serve = function() {
        self.io = require('socket.io').listen(app);
        self.setupIO();
    };
};

// Routes

app.get('/', function(req, res){
  res.render('index', { title: 'Express' });
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var s = new SnakeGame();
s.serve();
