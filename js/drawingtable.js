function buildGrid(world) {
	var tableMarkup = "";
	var id = 0;

	for (x = 0; x < world.width; x++) {
		tableMarkup += "<tr>";
		for (y = 0; y < world.heigth; y++) {
			var cell = world.getCell(id);
			tableMarkup += 
			'<td id="'+ id +'" class="cell ' + (cell.isDead() ? 'dead' : 'live') + '" ' + (cell.isLive() ? 'style="background-color:black"' : '') + '>&nbsp;</td>';
			id++;
		}
		tableMarkup += "</tr>";	
	}

	$("#drawing-table > tbody").replaceWith(tableMarkup)

};

function buildInformation(world){
	$("#generation").text(world.generation);
	$("#liveCells").text($.grep(world.cells, function(item,index){ 
			return item.dead == false; 
		}).length);
}

$(function() {
	
	// Variable Setup
	var cols = parseInt($("#gridSize").val().split(",")[1]),
	    rows = parseInt($("#gridSize").val().split(",")[0]),
	    curColor = "black",
	    mouseDownState = false,
	    eraseState = false,
	    tracingMode = false,
	    prevColor = "",
	    $el;
	 
	document.world = new World(rows,cols);
	// Inital Build of Table  
	buildGrid(document.world);
	
	// Dropdown for changing Grid Size
	$("#gridSize").change(function() {
		$el = $(this);
		rows = parseInt($el.val().split(",")[0]);
		cols = parseInt($el.val().split(",")[1]);
		
		document.world = new World(rows,cols);
		buildGrid(document.world);
	});
	
	// Clear
	$("#clear").click(function() {	
		$("#generation").text(0);
		$("#liveCells").text(0);
		
		rows = parseInt($("#gridSize").val().split(",")[0]);
		cols = parseInt($("#gridSize").val().split(",")[1]);
		
		document.world = new World(rows,cols);
		buildGrid(document.world);
	});
	
	// Mouse Events
	$("#drawing-table").delegate("td", "mousedown", function() {
		mouseDownState = true;
		$el = $(this);
	    if (eraseState) {
	    	$el.removeAttr("style");
	    } else {
	    	$el.css("background", curColor);
			$el.toggleClass("dead");
			$el.addClass("live");
			var cell = document.world.getCell($el.get(0).id);
			cell.live();
	    }
	}).delegate("td", "mouseenter", function() {
		if (mouseDownState) {
			$el = $(this);
		    if (eraseState) {
		    	$el.removeAttr("style");
		    } else {
		    	$el.css("background", curColor);
				$el.toggleClass("dead");
				$el.addClass("live");
				var cell = document.world.getCell($el.get(0).id);
				cell.live();
		    }
		}
	});
	
	$("html").bind("mouseup", function() {
		mouseDownState = false;
	});
});