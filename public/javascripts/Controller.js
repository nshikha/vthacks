

var start = function(socket) {

  $('body').append('<link rel="stylesheet" type="text/css" href="/stylesheets/controller.css">');
  $('#userCanvas').css('display', 'block');

  var timeInterval = 250;
  setInterval(function(){
    socket.emit('position', sendDirection()); 
  }, timeInterval);

  document.body.addEventListener('touchmove', function(event) {
    event.preventDefault();
  }, false); 

  var canvas = document.getElementById(config["userCanvas"]);
  var ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var radius = 40; 
  var time

  var dragging;
  var mouseX;
  var mouseY;
  var dragHoldX;
  var dragHoldY;
  var position = {x: canvas.width/2, y:canvas.height/2}

  init();

  function init() {
    drawScreen();
    canvas.addEventListener("mousedown", mouseDownListener, false);
    canvas.addEventListener("mouseup", mouseUpListener, false);
    canvas.addEventListener("mousemove", mouseMoveListener, false);
    canvas.addEventListener("touchstart", touchDownListener, false);
    canvas.addEventListener("touchmove", touchMoveListener, false);
    canvas.addEventListener("touchend", touchEndListener, false);
  }

  function drawScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircle(ctx, position.x, position.y, radius);
  }

  function drawCircle(ctx, cx, cy, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2*Math.PI, true);
    ctx.fill();
  }


  function touchDownListener(evt) {
    if (event.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      var touchX = touch.pageX;
      var touchY = touch.pageY;
    }
    
    if (hitTest(touchX, touchY)) {
      dragging = true;
      dragHoldX = touchX - position.x;
      dragHoldY = touchY - position.y;
    }
  } 


  function mouseDownListener(evt) {
    //getting mouse position correctly, being mindful of resizing that may have occured in the browser:
    var bRect = canvas.getBoundingClientRect();
    var mouseX = (evt.clientX - bRect.left)*(canvas.width/bRect.width);
    var mouseY = (evt.clientY - bRect.top)*(canvas.height/bRect.height);

    if (hitTest(mouseX, mouseY)) {
      dragging = true;
      dragHoldX = mouseX - position.x;
      dragHoldY = mouseY - position.y;
    }

  }

  function touchEndListener(evt) {
    if (dragging) {
      dragging = false;
      position.x = canvas.width/2;
      position.y = canvas.height/2;
      drawScreen();
    }
  }
  
  function mouseUpListener(evt) {
    if (dragging) {
      dragging = false;
      position.x = canvas.width/2;
      position.y = canvas.height/2;
      drawScreen();
    }
  }


  function touchMoveListener(evt) {
    var posX;
    var posY;
    var minX = radius;
    var maxX = canvas.width - radius;
    var minY = radius;
    var maxY = canvas.height - radius;
    //getting mouse position correctly 
    if (event.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      var touchX = touch.pageX;
      var touchY = touch.pageY;
    }
    
    //clamp x and y positions to prevent object from dragging outside of canvas
    posX = touchX - dragHoldX;
    posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
    posY = touchY - dragHoldY;
    posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);

    position.x = posX;
    position.y = posY;

    //setPositions(posX, posY);
    drawScreen();
  }

  function mouseMoveListener(evt) {
    var posX;
    var posY;
    var minX = radius;
    var maxX = canvas.width - radius;
    var minY = radius;
    var maxY = canvas.height - radius;
    //getting mouse position correctly 
    var bRect = canvas.getBoundingClientRect();
    mouseX = (evt.clientX - bRect.left)*(canvas.width/bRect.width);
    mouseY = (evt.clientY - bRect.top)*(canvas.height/bRect.height);
    
    //clamp x and y positions to prevent object from dragging outside of canvas
    posX = mouseX - dragHoldX;
    posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
    posY = mouseY - dragHoldY;
    posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);

    position.x = posX;
    position.y = posY;
    //setPositions(posX, posY);

    drawScreen();
  }

  //translated direction
  function sendDirection() {
    var x = position.x - (canvas.width/2);
    var y = position.y - (canvas.height/2);
    return [x,y];
  }

  function getDirection(x, y){
    if ( x + y > 0 && x-y > 0) {
      return "up";
    }
    else if (x+y < 0 and x-y > 0) {
      return "down";
    }
    else if (x+y < 0 and x-y < 0) {
      return "left";
    }
    else {
      return "right";
    }
  }
  
  function hitTest(px, py) {
    var dx = px - position.x;
    var dy = py - position.y;
    var diff = (dx*dx + dy*dy) - (radius*radius);
    return (diff < 0);
  }





};
