var start = function(socket) {
  
  var obj = document.getElementById('test');
  obj.addEventListener('touchmove', function(event) {
    alert("hi");
    // If there's exactly one finger inside this element
    if (event.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      // Place element where the finger is
      obj.style.left = touch.pageX + '20px';
      obj.style.top = touch.pageY + '20px';
    }
  }, false); 

  obj.addEventListener("click", function(event) {
      alert("hi");
      obj.style.left += '20px';
      obj.style.top += '20px';
  }, false); 


  var canvas = document.getElementById(config["userCanvas"]);
  var ctx = canvas.getContext("2d");
  var width = canvas.width;

  var canvasX = canvas.width/2;
  var canvasY = canvas.height/2;
  var radius = 60; 

  function drawCircle(ctx, cx, cy, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2*Math.PI, true);
    ctx.fill();
  }


  function isWithinCircle(px, py) {
    var dx = px - cx;
    dx = dx * dx;
    var dy = py - cy;
    dy = dy * dy;
    var dist = Math.sqrt(dx + dy);
    return (dist < radius);
  }

  drawCircle(ctx, canvasX, canvasY, radius);
  
  canvas.addEventListener('touchmove', function(event) {
    event.preventDefault();
    for (var i = 0; i < event.targetTouches.length; i++) {
      var touch = event.targetTouches[i];
      var px = touch.pageX;
      var py = touch.pageY;
      drawCircle(ctx, px, py, radius);
      if (isWithinCircle(px, py)) {
        var left = cx - radius/2;
        var top = cy - radius/2;
        ctx.clearRect(0, 0, canvasX*2, canvasY*2);
        drawCircle(ctx, px, py, radius);
      }
    }
  }, false);  


};
