  // global position and tracking (to get in and out of paperScope)
  window.globals = {
    tool_x: 0,
    tool_y: 0,
    tool_z: 0 
    //someFunction: function() { alert(globals.someValue); }
  }

  riTool = new Tool();                       // @th needed this to access keys, related to paperjs??
                                             

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

    var tool_width = 12;                    // hard code size for moment
    var tool_height = 8;
    var tool_prop = tool_height / tool_width;

    var riScale = 0.95;                     // view scale for zoom
    var riUnit = 45;                        // unit value pixels per
    var target_z = .1;                      // fpr DN/UP work
    var last_z = .1;
    var spindle_ON = false;
    var cur_press = .0;
    var cur_width = .0;


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
            point: new Point((20), (45)),
            fillColor: 'black'
        });
        var textItem3 = new PointText({
            content: 'Screen: ',
            point: new Point((20), (15)),
            fillColor: 'black'
        });

        var children = project.activeLayer.children;    // @th** used for ??

        // - Setup for tool Motion
        var circle = new Path.Circle(100,100, 10);      // starting at this location ??
        circle.strokeColor = 'red';
        var leap_circle = new Path.Circle(150,150, 5);  // starting at this location for LEAP ??
        leap_circle.strokeColor = 'green';

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

  // Setting up LEAP      
  var runLeap = false;                     // ?? leap status of type??
  var fingerPos = new Point(150,150);

  function useLeap () {    // Leap loop. Only be called if a controller is available ...
    if (typeof Leap !== "undefined") {
        var leapPathStarted = false;
        Leap.loop(function(frame) {
            var ids = {};
            var hands = frame.hands;
            var pointables = frame.pointables; //pointables returns values for each fingers tracked.
            var posX, posY, posZ;
              for (var i = 0, pointable; pointable = pointables[i++];) {    // We're looping through hand ...
                    if (i===1) {                                            // **just index finger??
                        posX = (pointable.tipPosition[0] * 2) + 150;
                        posY = (pointable.tipPosition[2] * 2) + 150;
                        posZ = (pointable.tipPosition[1] * 0.1) - 20;
                    }      
                    ids[pointable.id] = true;
              }      
              if (frame.hands.length > 0) {
                  fingerPos.x = posX;
                  fingerPos.y = posY;
                  if (!leapPathStarted) {
                    leapPathStarted = true;
                    iniMotion();
                  }

                 console.log('fingerPos> ' + fingerPos.x.toFixed(3) + ', ' + fingerPos.y.toFixed(3));
                  leap_circle.position = (fingerPos);
                  if (runLeap) {
                    ptNew = fingerPos;
                    makeMotion();
                  }
              } else {
                    // just display a little circle
              }
        }) 
    }
  }

    riTool.onKeyDown = function(event) {                // Get Keys
 console.log('gotevent', event.key);
        if (event.key == 's') {
            if (!runLeap) {
                console.log('Leap-ON > ');   
                runLeap = true;
                useLeap();
            } else {
                console.log('Leap-OFF > ');   
                runLeap = false;
                stopMotion();
            }
            return false;   
        }
        if (event.key == 'z') {
            target_z = target_z - .05;
            console.log('Z-Down > ', target_z.toFixed(3));   
        }
        if (event.key == 'x') {
            target_z = target_z + .05;
            console.log('Z-Up > ', target_z.toFixed(3));   
        }
        if (event.key == 'o') {
            if (!spindle_ON) {
                spindle_ON = true;
                fabmo.manualRunGCode("m3");
            } else {
                spindle_ON = false;
                fabmo.manualRunGCode("m5")
            }
        }





    } 

// Handle Motion                                        // #################### MOTION
    function mouseDown(event) {
      iniMotion();
      mouse_DN = true;
    }
    function mouseMove(event) {
      if (!mouse_DN) {return}                           // Figure out if down and dragging ...
      ptNew.x = event.clientX;
      ptNew.y = event.clientY;
      cur_press = -1 * (event.pressure/2);
      cur_width = event.width
//      console.log("pres-", event.pressure)
//      .ondragstart = () => false;  // ** prevent built in drag-drop
      makeMotion();  
    }
    function mouseUp(event) {
      mouse_DN = false;
      stopMotion();
    }


// GENERIC MOTION PLANNING on fly ...

    function iniMotion () {
            seg_ct = 0;                                // If a path exits, deselect it
            ptStart.x = event.clientX;
            ptStart.y = event.clientY;
    console.log('startDown> ' + ptStart.x + ', ' + ptStart.y);
            if (path) {
                path.selected = false;
            }
            path = new Path({
                segments: [ptStart],
                strokeColor: 'black',
                fullySelected: true // ... select so we can see segment points
            });
            ptLast = ptStart;
    }

        function makeMotion () {
                  m_rate = 5;                          // ... some sort of speed scale?  //4
                  var x,y,z;                           // temp var for sturmer manual system
                  var to_x = ptNew.x;
                  var to_y = ptNew.y;
                  
                  v1 = ptNew - ptLast;
                  if (v1.length > 5) {                // Apply LENGTH criterion ... is this when motion starts?? //5
                    ptLast.x = ptNew.x;                // ... learned can't copy because by ref
                    ptLast.y = ptNew.y;
                      path.add(ptNew)
                      pt_ct++;
                console.log('new> ' + ptNew + '  old> ' + ptLast + '  dif> ' + v1.length);
                      if (pt_ct >= m_rate) {
                        console.log('smooth_segCt> ' + seg_ct + ' pts> ' + pt_ct);
                        pt_ct = 0;
                        path.smooth({ type: 'continuous', from: seg_ct, to: (seg_ct + m_rate - 1)});
                        seg_ct += m_rate;
                          // get smoothed moves ... 10 along path??
                          var dist_now = (path.length - len_here);
                          for (i = 0; i < 1; i += 0.1) {
                            smooth_pt = path.getPointAt(len_here + (i * dist_now));

                                x = ((smooth_pt.x - bbox.bounds.left) / riUnit);
                            	y = ((bbox.bounds.bottom - smooth_pt.y) / riUnit);
                            
                            //================================== 
                                if (cur_press < last_z) {last_z -= .01};
                                if (cur_press > last_z) {last_z += .01};
                               
                                z = last_z //cur_press/2 * -1   //target_z;
                   console.log("last--- ",last_z);             
                            //==================================

                              var code = ['G1']
						      if(x != undefined) {code.push('X' + x.toFixed(3));}
						      if(y != undefined) {code.push('Y' + y.toFixed(3));}
						      if(z != undefined) {code.push('Z' + z.toFixed(3));}
						      code.push('F180');
						      console.log(code);
						      fabmo.manualRunGCode(code.join(''))
                          }
                          len_here = path.length;
                      }
                  }
            if(cur_press != undefined) {str_press = cur_press.toFixed(2)} else {str_press = "-"}; 
            textItem1.content = 'Segment count/length: ' + path.segments.length + ' / ' + path.length.toFixed(3) + "    Pressure: " + str_press;
        }

    function stopMotion () {
            var x,y,z;             // ... temp var for Sturmer manual mode
            path.smooth({ type: 'geometric', factor: 0.5, from: seg_ct, to: (seg_ct + pt_ct)});
                            var dist_now = (path.length - len_here);
                            for (i = 0; i < 1; i += 0.1) {
                              smooth_pt = path.getPointAt(len_here + (i * dist_now));

                            	x = ((smooth_pt.x - bbox.bounds.left) / riUnit);
                            	y = ((bbox.bounds.bottom - smooth_pt.y) / riUnit);
                                z = 0.1;                                                    // pull up to

                              var code = ['G1']
						      if(x != undefined) {code.push('X' + x.toFixed(4));}
						      if(y != undefined) {code.push('Y' + y.toFixed(4));}
						      if(z != undefined) {code.push('Z' + z.toFixed(4));}
						      code.push('F180');
						      console.log("stopMotion?");
						      console.log(code);
						      //code.push('F60');
						      fabmo.manualRunGCode(code.join(''))
                            }
                            len_here = path.length;
            if(cur_press != undefined) {str_press = cur_press.toFixed(2)} else {str_press = "-"}; 
            textItem1.content = 'Segment count/length: ' + path.segments.length + ' / ' + path.length.toFixed(3) + "    Pressure: " + str_press;
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


  // riTool.onKeyUp = function(event) {
  //     if (event.key == 'space') {
  //         runLeap = false;
  //         // Prevent the key event from bubbling
  //      console.log('END-space> ');
  //         return false;
  //     }
  // }        

//===========================HOUSEKEEPING ACTION FUNCTIONS

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

    // - ZOOMing with mousewheel
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
      globals.tool_z = status.posz;
      circle.position.x = bbox.bounds.left + (globals.tool_x * riUnit); 
      circle.position.y = bbox.bounds.bottom - (globals.tool_y * riUnit); 
      textItem2.content = 'Tool Location: ' + globals.tool_x.toFixed(2) + ', ' + globals.tool_y.toFixed(2) + ', ' + globals.tool_z.toFixed(2);
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


    //--------------------------DOCUMENT 

    $(document).ready(function() {
        onResize();   
        fabmo.requestStatus(); // Make sure we have start location
        // riCanvas.addEventListener('mousedown', mouseDown);
        // riCanvas.addEventListener('mousemove', mouseMove);
        // riCanvas.addEventListener('mouseup', mouseUp);

        riCanvas.addEventListener('pointerdown', mouseDown);
        riCanvas.addEventListener('pointermove', mouseMove);
        riCanvas.addEventListener('pointerup', mouseUp);


        fabmo.manualEnter({hideKeypad:true, mode:'raw'});

//        start_child = project.activeLayer.children.length;
    console.log("loaded:  ", paper.project, circle.position);
        $(window).focusout(function(){
          console.log("lost focus!")

          fabmo.manualExit(); // hard-code termination ... needed?

        });
        //useLeap();
    });
