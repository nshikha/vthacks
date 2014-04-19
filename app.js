
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
var getUID = function() { return _id_++; };

var Piece = function(x, y) {
    this.id = getUID();
    this.x = x;
    this.y = y;
};
var User = function(socket) {
    this.socket = socket;
};
var SnakeGame = function(width, height) {

    this.width = width;
    this.height = height;

    this.snakePieces = [ new Piece(3,3), new Piece(4,3), new Piece(5,3) ];

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
            } else {
                // create a foodUser and push onto self.foodUsers
            }
            /** examples for reference
            socket.emit('news', { hello: 'world' });
            socket.on('my other event', function (data) {
                console.log(data);
            });
            */
        });
    };

    this.serve = function(port) {
        self.io = require('socket.io').listen(port);
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
s.serve(3001);
