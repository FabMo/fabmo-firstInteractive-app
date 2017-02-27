function dist(a,b) {
  return Math.sqrt((b.x-a.x)*(b.x-a.x) + (b.y-a.y)*(b.y-a.y))
}

function midpoint(a,b) {
  return {
    x: a.x + (b.x - a.x)/2.0,
    y: a.y + (b.y - a.y)/2.0
  }
}

function Grid(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
}
    // // Touch Events
    // canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    // canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    // canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    
    // // Mouse Events
    // canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    // canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    // canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    // canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
    // canvas.addEventListener('mousewheel', this.onMouseWheel.bind(this));

    // // Focus events
    // canvas.addEventListener('blur', this.onBlur.bind(this));
    // canvas.addEventListener('focus', this.onFocus.bind(this));

    // requestAnimationFrame(this.draw.bind(this));




  Grid.prototype.onTouchMove = function(evt) {
    if(evt.touches.length === 1) {
      touch = evt.touches[0];
      pos = this.getTouchPos(touch);
      if(this.dragging) {
        this.handleDrag(pos)
      }
      this.lastPos = pos;
    } else if(evt.touches.length === 2) {
      a = this.getTouchPos(evt.touches[0]);
      b = this.getTouchPos(evt.touches[1]);
      c = dist(a,b);
      if(this.pinch_dist !== null) {
        var factor = (1 + (c-this.pinch_dist)/250.0);
        this.handleScale(this.pinch_center, factor);
      }
      this.pinch_center = this.mouseToActual(midpoint(a,b));
      this.pinch_dist = c;
    }
    evt.preventDefault();
    requestAnimationFrame(this.draw.bind(this));
  }


  Grid.prototype.onMouseDown = function(evt) {
    this.dragging = true;
    this.lastPos = this.getMousePos(evt);
    this.mouseDownPos = this.lastPos;
    evt.preventDefault();
  }

  Grid.prototype.onMouseMove = function(evt) {
    var mousePos = this.getMousePos(evt);
    if(this.dragging) {
//      this.handleDrag(mousePos);
//      this.snapPos = null;

          this.doConfirm({ text : 'Move the tool?'}, 
            function() {
              event = {}
              event.pos = this.mouseToActual(mousePos);
              event.snapPos = snap2d(event.pos, this.grid.minor);
              this.emit('click', event);
            }.bind(this)
          );
 


    } else {
      this.snapPos = mousePos;
    }
    this.lastPos = mousePos;
    evt.preventDefault();
    requestAnimationFrame(this.draw.bind(this));
  }

  Grid.prototype.onMouseUp = function(evt) {
    var mousePos = this.getMousePos(evt);
    if(dist(mousePos, this.mouseDownPos) < CLICK_DETECT_DIST) {
      if(dist(this.getToolPosition(), this.mouseToActual(mousePos)) < 0.2) {
          this.goto(this.getToolPosition(), 1000);
      }
      else {
          this.doConfirm({ text : 'Move the tool?'}, 
            function() {
              event = {}
              event.pos = this.mouseToActual(mousePos);
              event.snapPos = snap2d(event.pos, this.grid.minor);
              this.emit('click', event);
            }.bind(this)
          );
     }
    }
      this.dragging = false;
      this.snapPos = null;
      evt.preventDefault();
      requestAnimationFrame(this.draw.bind(this));
  }


  Grid.prototype.getMousePos = function(evt) {
    var rect = this.canvas.getBoundingClientRect();
      return {
        x: (evt.clientX - rect.left),
        y: (evt.clientY - rect.top)
      };      
  }

  Grid.prototype.getTouchPos = function(touch) {
    var rect = this.canvas.getBoundingClientRect();
      return {
        x: (touch.clientX - rect.left),
        y: (touch.clientY - rect.top)
      };          
  }

  Grid.prototype.handleDrag = function(pos) {
    this.offset.x -= (this.lastPos.x - pos.x)/this.scale;
    this.offset.y += (this.lastPos.y - pos.y)/this.scale;
  }




    
    // Time
    var t0 = new Date().getTime();
    //var tf = t0 + duration;


  Grid.prototype._drawOrigin = function() {
    var w = this.canvas.width;
    var h = this.canvas.height;

    // Setup style
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.originColor;

    // Vertical
    x0 = Math.round(this.scale*this.offset.x);
    x0 -= 0.5//(x0 % 2)/2.0;

    this.ctx.moveTo(x0, 0);
    this.ctx.lineTo(x0, h);

    // Horizontal
    y0 = Math.round(h-(this.scale*this.offset.y));
    y0 -= 0.5//(y0 % 2)/2.0;
    this.ctx.moveTo(0, y0);
    this.ctx.lineTo(w, y0);

    // Commit!
    this.ctx.stroke();

  }


  Grid.prototype.getToolPosition = function() {
    return this.toolPos || {x:0,y:0};
  }

  Grid.prototype.setToolPosition = function(x,y) {
    this.toolPos = {'x' : x, 'y' : y};
    requestAnimationFrame(this.draw.bind(this));
  }

