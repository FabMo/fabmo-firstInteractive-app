        var fabmo = new FabMoDashboard();
//        var riScope = new PaperScope();
        var path;

        var last_pos_x = 0, last_pos_y = 0;
        var tool_x, tool_y;

        var pos, smooth_pt1, smooth_pt2;
        var err;
        var m_rate;
        var pt_ct = 0, seg_ct = 0, next_ct = 0;
        var len_here = 0;
        var smooth_pt = new Point();

        var tool_width = 6;                      // hard code size for handibot at moment
        var tool_height = 8;
        var tool_prop = tool_height / tool_width;
        var min_margin = 10;

        var riScale = 1;                         // view scale for reach in
        var riUnit = 50;                         // unit value pixels per

        // - Set Starting View of Tool Work Area
        var fullview = new Rectangle();  
        var bbox = new Path.Rectangle([0, 0, tool_width, tool_height]); // sets scale
        bbox.position = view.center;
        bbox.strokeColor = 'lightgrey';

        // - Create Text Info
        var textItem1 = new PointText({
            content: 'Segment count/length: ',
            point: new Point((20), (30)),
//            point: new Point((20/riScale), (30/riScale)),
            fillColor: 'black'
        });
        // textItem1.scale((1/riScale), 1/(-1 * riScale));
        var textItem2 = new PointText({
            content: 'Tool Location: ',
            point: new Point((250), (30)),
//            point: new Point((300/riScale), (30/riScale)),
            fillColor: 'black'
        });
        //  textItem2.scale((1/riScale), 1/(-1 * riScale));
          var anchor2 = new Point((250),(30));
        var textItem3 = new PointText({
            content: 'Screen: ',
            point: new Point((20), (10)),
//            point: new Point((20/riScale), (10/riScale)),
            fillColor: 'black'
        });
        //  textItem3.scale((1/riScale), 1/(-1 * riScale));

        // - Setup for tool Motion
        var circle = new Path.Circle(100,100, 10); //{seem to have to start with loc here}
          circle.strokeColor = 'red';

        //view.center = circle.position;
//        view.scale(riScale,-1 * riScale);

//---------------------------Start Action
        //onResize();



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
                            
                            var dist_now = (path.length - len_here);

                            for (i = 0; i < 1; i += 0.1) {
                              smooth_pt = path.getPointAt(len_here + (i * dist_now));
                              fabmo.livecodeStart((smooth_pt.x * 0.02), (smooth_pt.y * 0.02),(err));
                            }

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
//===========================ACTION FUNCTIONS
//---------------------------drawing
    function onResize () {
//         var newSize = new Size(view.size);
// //        var reSize = new Size(newSize/startSize);
//         bbox.scale(newSize/startSize);
// //        bbox.scale(reSize);
//         bbox.position = view.center;
//         startSize = newSize;
//         console.log("resize,center - " + startSize + ", " + newSize + ", " + view.center);
//         console.log("position, bounds, scaling - " + bbox.position + ", " + bbox.bounds + " ," + bbox.scaling);


  //       if ((view.viewSize.height / view.viewSize.width) < tool_prop) {
  //         defwrk.height = view.viewSize.height - (2 * min_margin);
  //         defwrk.width = defwrk.height / tool_prop; 
  // console.log("za " + defwrk.height +", " + defwrk.width);
  //       } else {
  //         defwrk.width = view.viewSize.width - (2 * min_margin);
  //         defwrk.height = defwrk.width * tool_prop;
  // console.log("zb " + defwrk.height +", " + defwrk.width);
  //       }
  //       //var defwrk = new Rectangle(min_margin,min_margin, bwidth, bheight)
  //       bbox = Path.Rectangle(defwrk);
  // console.log("zdef " + defwrk);
  //       bbox.position = view.center;

        // - Bounding Box Representing Work Area
//        var startSize = new Size(view.size);
        var bwidth, bheight;
//  console.log("startSize - " + startSize);
//        if ((view.viewSize.height / view.viewSize.width) < tool_prop) {
          bheight = view.viewSize.height - (2 * min_margin);
//          bwidth = bheight / tool_prop; 
//  console.log("ab " + bheight +", " + bwidth);
//        } else {
          bwidth = view.viewSize.width - (2 * min_margin);
        defwrk = [min_margin, min_margin, bwidth, bheight];
        bbox.fitBounds(defwrk);
        bbox.position = view.center;
  console.log("ab " +textItem1.position + ", " + textItem2.position + ", " + view.bounds);




    }
//---------------------------fabmo
    fabmo.on('status', function(status) {
      tool_x = status.posx;
      tool_y = status.posy;
      circle.position.x = tool_x * 50; 
      circle.position.y = tool_y * 50; 
      textItem2.content = 'Tool Location: ' + tool_x.toFixed(3) + ', ' + tool_y.toFixed(3);
    });
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
//--------------------------ready!
    $(document).ready(function() {
        onResize();   
        fabmo.requestStatus(); // Make sure we have start location
    //    textItem3.content = 'Screen: ' + riScope.viewSize.size;
    console.log("style - ", paper.project.currentStyle.fillColor);
    });
