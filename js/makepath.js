  // global position and tracking (to get in and out of paperScope)
  window.globals = {
    tool_x: 0,
    tool_y: 0 
    //someFunction: function() { alert(globals.someValue); }
  }

  riTool = new Tool();                       // @th needed this to access keys, related to paperjs??
                                             // ... not understanding general issues in getting EVENTS

    var fabmo = new FabMoDashboard();        // seem to need a fabmo inside paperScope
    var path;
    var start_child = 5;                     // count for number of paths to remove on resize
                                             // ... start at 5 a kludge to prevent premature erase
    var last_pos_x = 0, last_pos_y = 0;
    var smooth_pt1, smooth_pt2;
    var pos = new Point();

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

    var ptStart = new Point(0,0);
    var ptLast = new Point(0,0);
    var ptNew = new Point(0,0);
    var mouse_DN = false;
    var v1 = new Point(0,0);

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

        var children = project.activeLayer.children;   // @th** used for ?

        // - Setup for tool Motion
        var circle = new Path.Circle(100,100, 10); //{seem to have to start with loc here}
        circle.strokeColor = 'red';

        //view.center = circle.position;

        // // - some stuff ...
        // var aCircle = new Path.Circle({     //circle as tracing marker
        //     center: view.center,
        //     radius: 3,
        //     fillColor: 'red'
        // });
        // var center = new Point(250, 250);   //star as "follow" example object
        // var points = 5;
        // var radius1 = 45;
        // var radius2 = 60;
        // var aStar = new Path.Star(center, points, radius1, radius2);
        // aStar.strokeWidth = 2;
        // aStar.strokeColor = 'black';

//--------------------------- App Actions
//==========================================================================

   var runLeap = false;
  function useLeap () {
    // Leap loop. Only be called if a controller is
    // available, though
      if (typeof Leap !== "undefined")
    {
        path = new Path({
            segments: [circle.point],
            strokeColor: 'black',
            // Select the path, so we can see its segment points:
            fullySelected: true
        });

        var fingerPos = new Point();

//console.log('leap called> ' + runLeap);
        Leap.loop(function(frame) {
console.log('leap called> ' + runLeap);
            var ids = {};
            var hands = frame.hands;
            var pointables = frame.pointables; //pointables returns values for each fingers tracked.
            var posX, posY, posZ;
            //var fingerPos = new Point();
            //console.debug(' initial>' + pointable + ' num> ' + pointables[1])
              for (var i = 0, pointable; pointable = pointables[i++];) {
                    if (i===1) {                                            // **just index??
                        posX = (pointable.tipPosition[0] * 0.5);
                        posY = (pointable.tipPosition[2] * 0.5);
                        posZ = (pointable.tipPosition[1] * 0.1) - 20;
                    }      
                    ids[pointable.id] = true;
              }      
              if (frame.hands.length > 0) {
                  fingerPos.x = posX;
                  fingerPos.y = posY;
                  if (runLeap) {
                    console.log('fingerPos> ' + fingerPos.x.toFixed(3) + ', ' + fingerPos.y.toFixed(3));
                  }
                      pos = fingerPos;
                      m_rate = 5;
//                       m_rate = event.delta.length;
                      var to_x = fingerPos.x;
                      var to_y = fingerPos.y;
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
    //console.log(((smooth_pt.x - bbox.bounds.left) / riUnit), ((bbox.bounds.bottom - smooth_pt.y) / riUnit),(err));
                          fabmo.livecodeStart(((smooth_pt.x - bbox.bounds.left) / riUnit), ((bbox.bounds.bottom - smooth_pt.y) / riUnit),(err));
                        }
                        len_here = path.length;
                      }
                   }
              }             
        }) 
    }
  }


    function mouseDown(event) {
//    $('#riCanvas').mousedown(function(event) {                    // Initialize a motion path
            // If we produced a path before, deselect it:
            ptStart.x = event.clientX;
            ptStart.y = event.clientY;
    console.log('x> ' + ptStart.x + ', ' + ptStart.y);
            if (path) {
                path.selected = false;
            }
            // Create a new path and set its stroke color to black:
            path = new Path({
                segments: [ptStart],
                strokeColor: 'black',
                // Select the path, so we can see its segment points:
                fullySelected: true
            });
            ptLast = ptStart;
            mouse_DN = true;
        //children = project.activeLayer.children;
    //console.log("num children - ", children.length, start_child, children.length - 1);
    }

    function mouseMove(event) {
        
                          // // Get the nearest point from the mouse position to tracing target
                          // var nearestPoint = aStar.getNearestPoint(event.point);
                          // // Move the red circle to the nearest point:
                          // aCircle.position = nearestPoint;
                          // // and make it tool position
                          // pos = aCircle.position;
            if (!mouse_DN) {return}
                                                            // ...figure out if down and dragging ...
                         ptNew.x = event.clientX;
                         ptNew.y = event.clientY;
                         v1 = ptNew - ptLast;
       console.log('new> ' + ptNew + '  old> ' + ptLast + '  dif> ' + v1.length);

                      pos = ptNew;
                      m_rate = 5;
//                       m_rate = event.delta.length;
                      var to_x = ptNew.x;
                      var to_y = ptNew.y;
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
//    $('#riCanvas').mouseup(function(event) {
//        riTool.onMouseUp = function(event) {
        function mouseUp(event) {
            path.smooth({ type: 'geometric', factor: 0.5, from: seg_ct, to: (seg_ct + pt_ct)});
            mouse_DN = false;
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

//$('#riCanvas').keydown(function(event) {
        riTool.onKeyDown = function(event) {                // Get Keys for use with LEAP
        //  $('#riCanvas').on('keydown', function(event) {
    console.dir(event);
            if (event.key == 's') {
                if (!runLeap) {
           console.log('Leap-ON > ');   
                  runLeap = true;
                  useLeap();
                } else {
           console.log('Leap-OFF > ');   
                  runLeap = false;
                }
                useLeap();
                return false;   
            }
        } 
        // riTool.onKeyUp = function(event) {
        //     if (event.key == 'space') {
        //         runLeap = false;
        //         // Prevent the key event from bubbling
        //      console.log('END-space> ');
        //         return false;
        //     }
        // }        
//===========================ACTION FUNCTIONS
//---------------------------drawing
    function onResize () {
    // - Update WorkArea Bounding-Box and Tool Markers ...
      // (complicated by inversion of tool location and handling of various elements)
      if ((view.viewSize.height / view.viewSize.width) < tool_prop) {   // bound by X or Y
        bheight = view.viewSize.height * riScale;
        bwidth = (view.viewSize.height / tool_prop) * riScale;
      } else {
        bheight = view.viewSize.width * riScale;
        bwidth = (view.viewSize.width / tool_prop) * riScale;
      }  
      var lastScale = bbox.scaling.x;              // Get current scale (transform)
      var bsize = new Size(bwidth, bheight);       // Basic RESIZE of B-Box 
      bbox.bounds = bsize;                         
      riUnit = bbox.bounds.height / tool_height;   // Get ratio for Units to screen to REPOSITION B-Box 
      if (riScale > 1) {                           // If smaller (center) vs Zoom out (center on tool)
        bbox.position.x = view.center.x - ((globals.tool_x * riUnit) - (bwidth/2)); 
        bbox.position.y = view.center.y + ((globals.tool_y * riUnit) - (bheight/2)); 
      } else {
        bbox.position = view.center;
      }
      var startPos = new Point(circle.position);   // REPOSITION Tool Marker, from current pos
      var scaleUnit = bbox.scaling.x / lastScale;  // Get reposition delta (for mark and path), based on B-Box
      var dX = bbox.bounds.left + (globals.tool_x * riUnit) - circle.position.x; 
      var dY = bbox.bounds.bottom - (globals.tool_y * riUnit) - circle.position.y; 
      circle.position += new Point([dX,dY]);
      for (var i = start_child; i < (children.length - 1); i++) {
        children[i].remove();                      // Remove old paths
      }
      if (path){                                   // Update size and loc of LAST TOOL PATH
        path.scale(scaleUnit, startPos); 
        path.position += new Point ([dX, dY]);
      }
      textItem3.content = 'Screen: ' + view.viewSize.width.toFixed(1) + ', ' + view.viewSize.height.toFixed(1) +
        "         ZOOM: " + riScale.toFixed(2);
    }

    // - Deal with ZOOM by mousewheel
    $('#riCanvas').on('mousewheel DOMMouseScroll MozMousePixelScroll', function(event) { 
        var zoomScale = 0.1;                       // Smooth scaling a bit
        if (riScale > 1.2) zoomScale = 0.2;
        if (riScale < 0.8) zoomScale = 0.05;
        if (event.originalEvent.wheelDelta > 0) {
            if(riScale > 10) return false;
            riScale += zoomScale;
        }
        else {
            if(riScale < 0.1) return false;
            riScale -= zoomScale;
        }
      onResize();  
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


    // document.addEventListener('mousedown', mouseDown);
    // document.addEventListener('drag', mouseDrag);
    // document.addEventListener('mouseup', mouseUp);

//--------------------------ready!
    $(document).ready(function() {
        onResize();   
        fabmo.requestStatus(); // Make sure we have start location
        riCanvas.addEventListener('mousedown', mouseDown);
        riCanvas.addEventListener('mousemove', mouseMove);
        riCanvas.addEventListener('mouseup', mouseUp);
//        start_child = project.activeLayer.children.length;
    console.log("loaded:  ", paper.project, circle.position);

        $(window).focusout(function(){
          console.log("lost focus!")
          fabmo.livecodeStop();   // hard code a termination ... probably not needed
        });
//        useLeap();
    });
