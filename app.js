
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

var Piece = function(snakeGame, x, y) {
    this.id = getUID();
    this.snakeGame = snakeGame;
    this.x = x;
    this.y = y;

    var self = this;

    this.update = function() {
        this.snakeGame.socket.emit('piece::update', this.id.toString());
    };
    this.disappear = function() {
        this.snakeGame.socket.emit('piece::disappear', this.id.toString());
    };
};

var User = function(snakeGame, socket) {
    this.snakeGame = snakeGame;
    this.socket = socket;
    this.id = getUID();
    this.pieces = [];
    var self = this;

    this.setupSocketBindings = function(socket) {
        self.socket.on('controller::data', function(input) {
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
    this.pieces = [];
    var self = this;
    this.direction = 'r';

    this.setupSocketBindings = function(socket) {
        self.socket.on('snake::changeDirection', function(input) {
            // assert input in ['l', 'r', 'u', 'd']
            self.direction = input;
        });

        self.socket.on('disconnect', function() {
            // game over
            process.exit(0);
        });
    };

    this.disappear = function() {
        while (self.pieces.length > 0) {
            p.disappear();
            var p = self.pieces.pop();
        }
    };

};

var SnakeGame = function(width, height) {

    this.width = width;
    this.height = height;

    this.snakePieces = [new Piece(this, 3,3), new Piece(this, 4,3), new Piece(this, 5,3)];

    // When snakeUser is null, the game has not yet started and is waiting for a snake to connect.
    this.snakeUser = null;
    this.foodUsers = [];

    var self = this;

    this.hasStarted = function() {
        return self.snakeUser !== null;
    };

    this.setupIO = function() {
        self.io.sockets.on('connection', function (socket) {
            if (!self.hasStarted()) {
                // create a snakeUser and bind to self.snakeUser
                self.snakeUser = new SnakeUser(self, socket, true);
                socket.emit('init', 'snake');
            } else {
                // create a foodUser and push onto self.foodUsers
                var user = new User(self, socket);
                self.foodUsers.push();
                socket.emit('init', 'food');
            }
            user.setupSocketBindings();
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
