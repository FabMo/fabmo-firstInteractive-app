        var fabmo = new FabMoDashboard();
        var path;

        var last_pos_x = 0, last_pos_y = 0;
        var tool_x, tool_y;

        var pos, smooth_pt1, smooth_pt2;
        var err;
        var m_rate;
        var pt_ct = 0, seg_ct = 0, next_ct = 0;
        var len_here = 0;
        var smooth_pt = new Point();

        var textItem1 = new PointText({
            content: 'Segment count/length: ',
            point: new Point(20, 30),
            fillColor: 'black',
        });
        textItem1.scale(1,-1);
        
        var textItem2 = new PointText({
            content: 'Tool Location: ',
            point: new Point(300, 30),
            fillColor: 'black',
        });
        textItem2.scale(1,-1);

          fabmo.on('status', function(status) {
            tool_x = status.posx;
            tool_y = status.posy;
            circle.position.x = tool_x * 50; 
            circle.position.y = tool_y * 50; 
            textItem2.content = 'Tool Location: ' + tool_x.toFixed(3) + ', ' + tool_y.toFixed(3);
          });

          fabmo.requestStatus();
//          var circle = new Path.Circle((status.posx * 50),(status.posx * 50), 10);
          var circle = new Path.Circle(100,100, 10);
          circle.strokeColor = "red";
          // how to constrain the path of moves to not be at too great an angle
view.center = circle.position;
view.scale(2, -2);



          fabmo.getConfig(function(err, cfg) {
            try {
              if(cfg.machine.envelope) {
                //display.setExtents(cfg.machine.envelope);
                //display.gotoExtents(1000);
              }              
            } catch(e) {
              console.error(e);
            }
          });



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
        }

        // While the user drags the mouse, points are added to the path
        // at the position of the mouse:
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
                            
                            var dist_now = path.length - len_here;

                            for (i = 0; i < 1; i += 0.1) {
                              smooth_pt = path.getPointAt(len_here + (i * dist_now));
                              fabmo.livecodeStart((smooth_pt.x * 0.02), (smooth_pt.y * 0.02),(err));
                            }
                            //console.log("**nextLoc ", to_x, to_y, pt_ct, seg_ct, m_rate);

                            len_here = path.length;
                          }
  
                      }          

            // Update the content of the text item to show how many
            // segments it has:
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
