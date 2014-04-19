

var start = function(socket) {

  $('body').append('<link rel="stylesheet" type="text/css" href="/stylesheets/controller.css">');


  document.body.addEventListener('touchmove', function(event) {
    event.preventDefault();
  }, false); 

  var canvas = document.getElementById(config["userCanvas"]);
  var ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var radius = 40; 

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
    canvas.addEventListener("touchstart", mouseDownListener, false);
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

  function mouseDownListener(evt) {
    //getting mouse position correctly, being mindful of resizing that may have occured in the browser:
    var bRect = canvas.getBoundingClientRect();
    mouseX = (evt.clientX - bRect.left)*(canvas.width/bRect.width);
    mouseY = (evt.clientY - bRect.top)*(canvas.height/bRect.height);

    if (hitTest(mouseX, mouseY)) {
      dragging = true;
      dragHoldX = mouseX - position.x;
      dragHoldY = mouseY - position.y;
    }
    
    if (dragging) {
      window.addEventListener("mousemove", mouseMoveListener, false);
      window.addEventListener("touchmove", mouseMoveListener, false);
    }
    canvas.removeEventListener("mousedown", mouseDownListener, false);
    canvas.removeEventListener("touchstart", mouseDownListener, false);
    window.addEventListener("mouseup", mouseUpListener, false);
    window.addEventListener("touchend", mouseUpListener, false);
    
    //code below prevents the mouse down from having an effect on the main browser window
    if (evt.preventDefault) {
      evt.preventDefault();
    } //standard
    else if (evt.returnValue) {
      evt.returnValue = false;
    } //older IE
    return false;
  }
  
  function mouseUpListener(evt) {
    canvas.addEventListener("mousedown", mouseDownListener, false);
    canvas.addEventListener("touchstart", mouseDownListener, false);
    window.removeEventListener("mouseup", mouseUpListener, false);
    window.removeEventListener("touchend", mouseDownListener, false);
    if (dragging) {
      dragging = false;
      position.x = canvas.width/2;
      position.y = canvas.height/2;
      drawScreen();
      window.removeEventListener("mousemove", mouseMoveListener, false);
      window.removeEventListener("touchmove", mouseMoveListener, false);
    }
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

  function setPositions(posX, posY) {
    circleX = position.x
    circleY = position.y
    var x = posX - circleX;
    var y = posY - circleY;
    position.x = posX;
    position.y = posY;
    //horizontal
    if ((x+y)*(x-y) > 0) {
      position.x = 0;
    }
    //vertical
    else {
      position.y = 0;
    }

  }
  
  function hitTest(px, py) {
    var dx = px - position.x;
    var dy = py - position.y;
    return (dx*dx + dy*dy < radius*radius);
  }





};
