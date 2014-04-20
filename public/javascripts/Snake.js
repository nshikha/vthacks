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

var buildBoard = function(numRows, numCols) {

    $('body').append('<link rel="stylesheet" type="text/css" href="/stylesheets/snake.css">');
    $('body').append('<div id="board"></div>');

    var boardx = 1 + numCols * PIECESIZE;
    var boardy = numRows * PIECESIZE;



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


var startSnake = function(socket) {
    //build board
    PIECESIZE = 20;
    PIECESIZEPX = '20px';

    var x = $(document).width();
    var y = $(document).height();


    var my = 100;
    var mx = 100;

    var numRows = Math.floor((y - my) / PIECESIZE);
    var numCols = Math.floor((x - mx) / PIECESIZE);

    socket.emit('snake::setBoardSize', {width:numCols, height:numRows});
    setupKeyBindings(socket);
    buildBoard(numRows, numCols);

    var pieces = {}; // hash from id to piece

    socket.on('piece::update', function(pieceJSON) {
        //get piece
        console.log(pieceJSON)

        var piece = pieces[pieceJSON.id];
        if (piece) {
            var $oldpiece = $('#piece-'+piece.y+'-'+piece.x);
            $oldpiece.css('background-color', 'white');
            piece.x = pieceJSON.x;
            piece.y = pieceJSON.y;
            piece.type = pieceJSON.type;
        } else {
            piece = pieceJSON;
            pieces[piece.id] = piece;
        }


        var $piece = $('#piece-'+piece.y+'-'+piece.x);
        if (!$piece)
            console.log('THIS IS VERY BAD -> Could not find the piece');
        //change piece's attributes according to the JSON
        if (piece.type === 'food')
            $piece.css('background-color', 'green');
        else
            $piece.css('background-color', 'blue');

    });

    socket.on('piece::disappear', function(pieceJSON) {
        console.log(pieceJSON);
        $('#piece-'+pieceJSON.y+'-'+pieceJSON.x).css('background-color', 'white');
    });

    socket.on('disconnect', function() {
        window.close();
    });

};



