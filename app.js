
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

var PORT = parseInt(process.argv[2]) || 3000;


// Routes

app.get('/', function(req, res){
  res.render('index', { title: 'Express' });
});

app.listen(PORT, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var SnakeGame = require('./SnakeGame');
var s = new SnakeGame();
s.serve(app);

