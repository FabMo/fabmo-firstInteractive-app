  // global position and tracking (to get in and out of paperScope)
  window.globals = {
    tool_x: 0,
    tool_y: 0 
    //someFunction: function() { alert(globals.someValue); }
  }

    var fabmo = new FabMoDashboard();        // seem to need a fabmo inside paperScope
    var path;
    var start_child = 5;                     // count for number of paths to remove on resize
                                             // ... start at 5 a kludge to prevent premature erase
    var last_pos_x = 0, last_pos_y = 0;
    var pos, smooth_pt1, smooth_pt2;

    var err;
    var m_rate;
    var pt_ct = 0, seg_ct = 0, next_ct = 0;
    var len_here = 0;
    var smooth_pt = new Point();

    var tool_width = 6;                      // hard code size for handibot at moment
    var tool_height = 8;
    var tool_prop = tool_height / tool_width;

    var riScale = 0.95;                      // view scale for zoom
    var riUnit = 45;                         // unit value pixels per

        // - Set Starting View of Tool Work Area
        var bbox = new Path.Rectangle([0, 0, tool_width, tool_height]); // sets scale
          var bwidth, bheight;
          bbox.applyMatrix = false;
          bbox.position = view.center;
          bbox.strokeColor = 'lightgrey';
          bbox.strokeScaling = false;
          bbox.strokeWidth = 1;

        // - Create Text Info
        var textItem1 = new PointText({
            content: 'Segment count/length: ',
            point: new Point((20), (30)),
            fillColor: 'black'
        });
        var textItem2 = new PointText({
            content: 'Tool Location: ',
            point: new Point((250), (30)),
            fillColor: 'black'
        });
        var textItem3 = new PointText({
            content: 'Screen: ',
            point: new Point((20), (15)),
            fillColor: 'black'
        });

        // - Setup for tool Motion
        var circle = new Path.Circle(100,100, 10); //{seem to have to start with loc here}
        circle.strokeColor = 'red';

        //view.center = circle.position;

//--------------------------- App Actions

        var children = project.activeLayer.children;
        function onMouseDown(event) {
            // If we produced a path before, deselect it:
            if (path) {
                path.selected = false;
            }
            // Create a new path and set its stroke color to black:
            path = new Path({
                segments: [event.point],
                strokeColor: 'black',
                // Select the path, so we can see its segment points:
                fullySelected: true
            });
        //children = project.activeLayer.children;
        console.log("num children - ", children.length, start_child, children.length - 1);
        }

        // Dragging mouse adds points to path
        function onMouseDrag(event) {
                      pos = event.point;
                      m_rate = event.delta.length;
                      var to_x = pos.x;
                      var to_y = pos.y;
                      if (Math.abs(to_x - last_pos_x) > (m_rate) || Math.abs(to_y - last_pos_y) > (m_rate)) {
                        last_pos_x = to_x;
                        last_pos_y = to_y;
                        path.add(pos)
                        pt_ct++;
  
                          if (pt_ct > 2* m_rate) {
                            pt_ct = 0;
                            path.smooth({ type: 'continuous', from: seg_ct, to: (seg_ct + 7)});
                            seg_ct += 8;
                            
                            var dist_now = (path.length - len_here);
                            for (i = 0; i < 1; i += 0.1) {
                              smooth_pt = path.getPointAt(len_here + (i * dist_now));
//                              console.log(((smooth_pt.x - bbox.bounds.left) / riUnit), ((bbox.bounds.bottom - smooth_pt.y) / riUnit),(err));
                              fabmo.livecodeStart(((smooth_pt.x - bbox.bounds.left) / riUnit), ((bbox.bounds.bottom - smooth_pt.y) / riUnit),(err));
                            }
                            len_here = path.length;
                          }
                      }          
            textItem1.content = 'Segment count/length: ' + path.segments.length + ' / ' + path.length.toFixed(3);
        }

        // When the mouse is released, we simplify the path:
        function onMouseUp(event) {
//            path.smooth({ type: 'geometric', factor: 0.5, from: seg_ct, to: (seg_ct + pt_ct)});
            pt_ct = 0;
            seg_ct = 0;
            len_here = 0;
            var segmentCount = path.segments.length;
            //console.log(path);
            // When the mouse is released, simplify it:
//            path.simplify(10);
//            path.smooth({ type: 'geometric', factor: .5 });
//            path.flatten(.5);

            // Select the path, so we can see its segments:
            path.fullySelected = true;
            var newSegmentCount = path.segments.length;
            var difference = segmentCount - newSegmentCount;
            var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
        }
//===========================ACTION FUNCTIONS
//---------------------------drawing
    function onResize () {
    // - Update Area Bounding Box and Tool Markers ...
      // #1> first decide on X or Y as constraining shape
      if ((view.viewSize.height / view.viewSize.width) < tool_prop) {   // scale by X or Y
        bheight = view.viewSize.height * riScale;
        bwidth = (view.viewSize.height / tool_prop) * riScale;
      } else {
        bheight = view.viewSize.width * riScale;
        bwidth = (view.viewSize.width / tool_prop) * riScale;
      }  
      var lastScale = bbox.scaling.x;              // Get current scale from box transform
      // #2> then resize
      var bsize = new Size(bwidth, bheight);       // Resize, then poistion Box 
      bbox.bounds = bsize;                         
        riUnit = bbox.bounds.height / tool_height;   // Get ratio for Units to screen 
    
      // #3> reposition, small is easy ... just center
console.log("now re-positioning: ", circle.position,  " ; ", bbox.position);
       if (riScale > 1) {
         //.box is resized we now want to move to that it's center is off by dist circle from center
         bbox.position.x = view.center.x - ((globals.tool_x * riUnit) - (bwidth/2)); 
console.log("view, bwidth, tool_x, riUnit; " + view.center.x + "," + bwidth + "," + globals.tool_x + "," + riUnit);
         bbox.position.y = view.center.y + ((globals.tool_y * riUnit) - (bheight/2)); 
         //var re_center = new Point(circle.position - view.center);
       } else {
         bbox.position = view.center;
       }
      
      // #5> now reposition tool circle ... figure where we are
      var startPos = new Point(circle.position);   // Current pos of marker
      // #6> and determine the position units for this new size box
//      riUnit = bbox.bounds.height / tool_height;   // Get ratio for Units to screen 
      // #7> then see how much box was scaled in this change (resize change + zoom change??)
      var scaleUnit = bbox.scaling.x / lastScale;  // Get reposition delta (for mark and path)
      // #8> and compute amount that position needs to change to keep up with box
      var dX = bbox.bounds.left + (globals.tool_x * riUnit) - circle.position.x; 
      var dY = bbox.bounds.bottom - (globals.tool_y * riUnit) - circle.position.y; 
      // #9> POSITION tool circle with this new data
      circle.position += new Point([dX,dY]);
      for (var i = start_child; i < (children.length - 1); i++) {
        children[i].remove();                      // Remove old paths
      }
      if (path){                                   // Update size and loc of current path
        path.scale(scaleUnit, startPos); 
        path.position += new Point ([dX, dY]);
      }
      textItem3.content = 'Screen: ' + view.viewSize.width.toFixed(1) + ', ' + view.viewSize.height.toFixed(1) +
        "         ZOOM: " + riScale.toFixed(2);
    }

    // - Deal with ZOOM by mousewheel
    $('#riCanvas').on('mousewheel DOMMouseScroll MozMousePixelScroll', function(event){ 
        if (event.originalEvent.wheelDelta > 0) {
            if(riScale > 10) return false;
            riScale += 0.1;
        }
        else {
            if(riScale < 0.1) return false;
            riScale -= 0.1;
        }
console.log("wheel = " + event.originalEvent.wheelDelta + "," + riScale)
      onResize();                                  // Update  
    });

//---------------------------fabmo
    fabmo.on('status', function(status) {
      globals.tool_x = status.posx;
      globals.tool_y = status.posy;
      circle.position.x = bbox.bounds.left + (globals.tool_x * riUnit); 
      circle.position.y = bbox.bounds.bottom - (globals.tool_y * riUnit); 
      textItem2.content = 'Tool Location: ' + globals.tool_x.toFixed(3) + ', ' + globals.tool_y.toFixed(3);
    });

    fabmo.getConfig(function(err, cfg) {
      try {
        if(cfg.machine.envelope) {
          console.log(cfg.machine.envelope)
          //display.setExtents(cfg.machine.envelope);
          //display.gotoExtents(1000);
        }              
      } catch(e) {
        console.error(e);
      }
    });

//--------------------------ready!
    $(document).ready(function() {
        onResize();   
        fabmo.requestStatus(); // Make sure we have start location
//        start_child = project.activeLayer.children.length;
    console.log("loaded:  ", paper.project, circle.position);
    });
