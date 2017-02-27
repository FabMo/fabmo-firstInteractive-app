// This is a paperscript with it's own scope ...
// - on a cavas that we will fit to window

var fabmo = new FabMoDashboard();

	var c3 = document.getElementById('canvas3'); // in your HTML this element appears as <canvas id="mycanvas"></canvas>
	//Draw a reference rectangle
	var rectangle = new Rectangle(new Point(50, 50), new Point(250, 200));
	var path3 = new Path.Rectangle(rectangle);
	path3.position = view.center;
	path3.selected = true;

	//Grid drawing function
	//If grid-prexists, it removes it and redraws it
	//Grid lines span only the current viewport
	//    gridGroup = new Group();
var drawGrid = function (cellSize) {
    var cvs3 = c3.getContext('2d');
    cvs3.width = window.innerWidth;
    cvs3.height = window.innerHeight; 
    this.cellSize = Math.round(cvs3.height / 8); //hard-coded for handibot
    var num_rectangles_wide = 6;                 // hard-coded for handibot
    var num_rectangles_tall = 8;
    view.viewSize.width = this.cellSize * num_rectangles_wide;
    view.viewSize.height = this.cellSize * num_rectangles_tall;
//    view.viewSize.width = window.innerWidth;
//    view.viewSize.height = window.innerHeight;
    this.gridColor = '#D0D0D0';
    this.gridGroup; //seems needed, don't get why this error
    var self = this;

    var boundingRect = view.bounds;
//    var num_rectangles_wide = c3.width / this.cellSize;
//    var num_rectangles_tall = c3.height / this.cellSize;
    console.log(this.cellSize, cvs3.width, cvs3.height, num_rectangles_tall, num_rectangles_wide);
    
    this.createGrid = function() {
        gridGroup = new Group(); 

        for (var i = 0; i <= num_rectangles_wide; i++) {
            var correctedLeftBounds = Math.ceil(boundingRect.left / self.cellSize) * self.cellSize;
            //var xPos = correctedLeftBounds + i * self.cellSize;
            var xPos = 10 + i * self.cellSize;
            var topPoint = new Point(xPos, boundingRect.top);
            var bottomPoint = new Point(xPos, boundingRect.bottom);
            var v_gridLine = new Path.Line(topPoint, bottomPoint);
//console.log(num_rectangles_wide, correctedLeftBounds, self.cellSize, topPoint, bottomPoint, view.zoom);
            v_gridLine.strokeColor = self.gridColor;
            v_gridLine.strokeWidth = 1 / view.zoom;
            self.gridGroup.addChild(v_gridLine);
        }
    
        for (i = 0; i <= num_rectangles_tall; i++) {
            var correctedTopBounds = Math.ceil(boundingRect.top / self.cellSize) * self.cellSize;
  console.log(correctedTopBounds);
            var yPos = correctedTopBounds + i * self.cellSize;
            var leftPoint = new Point(boundingRect.left, yPos);
            var rightPoint = new Point(boundingRect.right, yPos);
            var h_gridLine = new Path.Line(leftPoint, rightPoint);
            h_gridLine.strokeColor = self.gridColor;
            h_gridLine.strokeWidth = 1 / view.zoom;
            self.gridGroup.addChild(h_gridLine);
        }
        gridGroup.sendToBack();
        view.update();
    }
    
    this.removeGrid = function() {
        for (var i = 0; i < gridGroup.children.length-1; i++) {
          gridGroup.children[i].remove();
        }
        gridGroup.remove();
    }
    
    if(typeof gridGroup === 'undefined') {
        this.createGrid();
    } else {
        this.removeGrid();
        this.createGrid();
    }
}

function onResize(event) {
	// Whenever the window is resized, recenter the path:
	boundingRect = view.bounds;
	path3.position = view.center;
	gridGroup.position = view.center;
    //drawGrid(25);
}

drawGrid(121);



// Zoom Scroll
//$('.gui-context').bind('mousewheel DOMMouseScroll MozMousePixelScroll', function(event){ 
$('#canvas3').on('mousewheel DOMMouseScroll MozMousePixelScroll', function(event){ 
    if (event.originalEvent.wheelDelta >= 0) {
        if(view.zoom>10) return false;
        view.zoom +=0.1;
    }
    else {
        if(view.zoom<1) return false;
        view.zoom -=0.1;
    }
});
