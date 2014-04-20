var startController = function(socket) {

  $('body').append('<link rel="stylesheet" type="text/css" href="/stylesheets/controller.css">');
  $('#userCanvas').css('display', 'block');

  document.body.addEventListener('touchmove', function(event) {
    event.preventDefault();
  }, false); 

  var canvas = document.getElementById(config["userCanvas"]);
  var ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var radius = 40; 
  var outerRadius = (canvas.width/2) - 20;

  var dragging = false;
  var position = {x: canvas.width/2, y:canvas.height/2};
  var mouseX = 0;
  var mouseY = 0;
  var dragHoldX = 0;
  var dragHoldY = 0;

  init();

  function init() {
    drawScreen();
    canvas.addEventListener("mousedown", mouseDownListener, false);
    canvas.addEventListener("mouseup", mouseUpListener, false);
    canvas.addEventListener("mousemove", mouseMoveListener, false);
    canvas.addEventListener("touchstart", touchDownListener, false);
    canvas.addEventListener("touchmove", touchMoveListener, false);
    canvas.addEventListener("touchend", touchEndListener, false);

    var timeInterval = 250;
    var lastDirection = null;

    setInterval(function(){
      socket.emit('controller::data', sendDirection());
      var direction = sendDirection();
      if (direction !== lastDirection) {
          socket.emit('controller::data', direction);
          lastDirection = direction;
      }
    }, timeInterval);
  }


  function drawScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawOuterBounds();
    drawCircle(ctx, position.x, position.y, radius);
  }


  function drawOuterBounds() {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(canvas.width/2, canvas.height/2, outerRadius, 0, 2*Math.PI, true);
    ctx.stroke();
  }

  function drawCircle(ctx, cx, cy, radius) {
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#696969';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(75, 77, 70,0.6)';
    ctx.arc(cx, cy, radius, 0, 2*Math.PI, true);
    ctx.fill();
  }


  function touchDownListener(evt) {
    if (event.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      var touchX = touch.pageX;
      var touchY = touch.pageY;
    }
    
    if (hitTest(touchX, touchY, radius)) {
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

    if (hitTest(mouseX, mouseY, radius)) {
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
      dragging = false;
      position.x = canvas.width/2;
      position.y = canvas.height/2;
      drawScreen();
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
    
    posX = touchX - dragHoldX;
    posY = touchY - dragHoldY;
      //clamp x and y positions to prevent object from dragging outside of canvas
    if (!withinBounds(posX, posY, outerRadius)) {
        posX = canvas.width/2;
        posY = canvas.height/2;
        dragging = false;
    }


    position.x = posX;
    position.y = posY;

    drawScreen();
  }

  function mouseMoveListener(evt) {
    if (dragging) {
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
      
      posX = mouseX - dragHoldX;
      posY = mouseY - dragHoldY;
      //clamp x and y positions to prevent object from dragging outside of canvas
      if (!withinBounds(posX, posY, outerRadius)) {
        posX = canvas.width/2;
        posY = canvas.height/2;
        dragging = false;
      }

      position.x = posX;
      position.y = posY;
      drawScreen();
    }

  }

  //translated direction
  function sendDirection() {
    var x = position.x - (canvas.width/2);
    var y = position.y - (canvas.height/2);

    //reversed form usual since +Y points downwards
    function getDirection(x, y){
        if (x === 0 && y === 0)
            return null;
        if (y === 0) {
            if (x > 0) return "r";
            else return "l";
        }

        var ratio = x / y;

        if (-2.0 < ratio && ratio <= -0.5) {
            if (y > 0) return 'dl';
            else return 'ur';
        }
        if (-0.5 < ratio && ratio <= 0.5) {
            if (y > 0) return 'd';
            else return 'u';
        }
        if (0.5 < ratio && ratio <= 2.0) {
            if (y > 0) return 'dr';
            else return 'ul';
        }
        if (2.0 < ratio || ratio <= -2.0) {
            if (x > 0) return 'r';
            else return 'l';
        }
    }

    return getDirection(x, y);
  }

  function withinBounds(px, py, r) {
    var dx = px - canvas.width/2;
    var dy = py - canvas.height/2;
    var diff = (dx*dx + dy*dy) - (r*r);
    return (diff < 0);
  }

  function hitTest(px, py, r) {
    var dx = px - position.x;
    var dy = py - position.y;
    var diff = (dx*dx + dy*dy) - (r*r);
    return (diff < 0);
  }





};
