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

var start = function(socket) {
    alert('loaded snake');
    setupKeyBindings(socket);

};
