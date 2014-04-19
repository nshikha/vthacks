
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

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
            y: self.y };

    };

    this.update = function() {
        self.snakeGame.snakeUser.socket.emit('piece::update', self.JSON());
    };

    this.disappear = function() {
        this.snakeGame.snakeUser.socket.emit('piece::disappear', this.id.toString());

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
    this.piece = new Piece(snakeGame, 5, 5, 'food');
    var self = this;

    this.setupSocketBindings = function(socket) {
        self.socket.on('controller::data', function(input) {
            if (self.piece.isEaten) {
                // user moved eaten food
                console.log('ignoring because eaten');
            } else {
                // move self.piece and update
            }
        });

        self.socket.on('disconnect', function() {
            this.disappear();
            // remove the user from the list of users.
            var index = self.snakeGame.foodUsers.indexOf(user);
            self.snakeGame.foodUsers.splice(index, 1);
        });
    };

    this.disappear = function() {
        while (self.pieces.length > 0) {
            p.disappear();
            var p = self.pieces.pop();
        }
    };
};

var SnakeUser = function(snakeGame, socket) {
    this.snakeGame = snakeGame;
    this.socket = socket;
    this.id = getUID();

    // SNAKE PIECES
    this.snakePieces = [new Piece(snakeGame, 3, 3, 'snake'),
                       new Piece(snakeGame, 4, 3, 'snake'),
                       new Piece(snakeGame, 5, 3, 'snake')];

    this.direction = 'l';
    this.alive = true;

    var self = this;

    this.setupSocketBindings = function(socket) {
        socket.on('snake::changeDirection', function(input) {
            if (self.alive) {
                // assert input is one of ['l', 'r', 'u', 'd']
                var oppDirs = {'l':'r', 'r':'l', 'u':'d', 'd': 'u'};
                // NOOP if input makes snake go backwards
                if (self.direction !== input && self.direction !== oppDirs[input]) {
                    console.log('changing dir to '+input);
                    self.direction = input;
                }
            }
        });

        socket.on('disconnect', function() {
            // game over
            process.exit(0);
        });
    };

    this.snakeLoopIter = function() {
            self.die();
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
        var anticipatedPiece = self.snakeGame.getPieceAtCoord(newx, newy);
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
                anticipatedPiece.isEaten = true;
                newP = anticipatedPiece;
            }
        } else {
            // else (this makes snake shorter)
            self.snakePieces.pop().disappear();
            newP = new Piece(self.snakeGame, newx, newy, 'snake'); // this is a hack #sikkaaaa
            newP.update();
            console.log('move is clear');
        }
        self.snakePieces = [newP].concat(self.snakePieces);
        console.log('moved '+self.direction+' **');
    };

    this.startSnakeLoop = function(delay) {
        self.loopid = setInterval(function() {
            if (self.alive) self.snakeLoopIter();
        }, delay);
    };

    this.die = function () {
        self.alive = false;
        clearInterval(self.loopid);
    }

    this.disappear = function() {
        while (self.snakePieces.length > 0) {
            p.disappear();
            var p = self.snakePieces.pop();
        }
    };

};

var SnakeGame = function(width, height) {

    this.width = width;
    this.height = height;

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
                self.snakeUser.setupSocketBindings(socket);
                self.snakeUser.startSnakeLoop(500);

                /* THIS IS TEMP FOR TESTING
                var user = new User(self, socket);
                self.foodUsers.push(user);
                socket.emit('init', 'food');
                user.setupSocketBindings(socket); */

            } else {
                // create a foodUser and push onto self.foodUsers
                var user = new User(self, socket);
                self.foodUsers.push(user);
                socket.emit('init', 'food');
                user.setupSocketBindings(socket);
            }
            /** examples for reference
            socket.emit('news', { hello: 'world' });
            socket.on('my other event', function (data) {
                console.log(data);
            });
            */
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

var s = new SnakeGame(200, 125);
s.serve();
