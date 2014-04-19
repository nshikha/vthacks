var setupKeyBindings = function (socket) {

    var pressup = function(dir) {
    };
    var pressdown = function(dir) {
        socket.emit('snake::changeDirection', dir[0]);
    };

    var bind = function(dir) {
        KeyboardJS.on(dir, function() {pressdown(dir);}, function() {pressup(dir);});
    };

    bind('up');
    bind('right');
    bind('down');
    bind('left');

};

var buildBoard = function() {
    var PIECESIZE = 20;
    var PIECESIZEPX = '20px';

    var x = $(document).width();
    var y = $(document).height();

    var my = 100;
    var mx = 100;

    var numRows = Math.floor((y - my) / PIECESIZE);
    var numCols = Math.floor((x - mx) / PIECESIZE);

    var boardx = 1 + numCols * PIECESIZE;
    var boardy = 1 + numRows * PIECESIZE;



    $('body').append('<link rel="stylesheet" type="text/css" href="/stylesheets/snake.css">');
    $('body').append('<div id="board"></div>');



    var drawRow = function(rowIndex, numPieces) {
        $('#board').append('<div id="row-'+rowIndex+'" class="row"></div>');
        for (var i = 0; i < numPieces; i ++) {
            $('#row-'+rowIndex).append('<div id="piece-'+rowIndex+'-'+i+'" class="piece"></div>');
        }
    };

    for (var i = 0; i < numRows; i ++) {
        drawRow(i, numCols);
    }
    $('.piece').css('width', PIECESIZEPX).css('height', PIECESIZEPX);
    $('#board').css('width', boardx + 'px').css('height', boardy + 'px');


};


var start = function(socket) {
    alert('loaded snake');
    setupKeyBindings(socket);
    buildBoard();
};

socket.on('piece::update', function(pieceJSON) {
    //get piece
    console.log(pieceJSON)
    piece = $('#piece-'+pieceJSON['y']+'-'+pieceJSON['x']);
    if (!piece)
        console.log('THIS IS VERY BAD -> Could not find the piece');
    //change piece's attributes according to the JSON
    piece.css('background-color', 'blue');

});

socket.on('piece::disappear', function(pieceJSON) {
    console.log(pieceJSON);
    $('#piece-'+pieceJSON['y']+'-'+pieceJSON['x']).css('background-color', 'white');
});


