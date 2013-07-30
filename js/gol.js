function loadKernel(id){
	var kernelElement = document.getElementById(id);
	var kernelSource = kernelElement.text;
	
	if (kernelElement.src != "") {
		var mHttpReq = new XMLHttpRequest();
		mHttpReq.open("GET", kernelElement.src, false);
		mHttpReq.send(null);
		kernelSource = mHttpReq.responseText;
	}
	
	return kernelSource;
}

Array.prototype.each = function(callback) {
  var i = 0;
  while (i < this.length) {
    callback.call(this, this[i]);
    i++;
  }
  return this;
};

function World(width, heigth) {
  this.width = width;
  this.heigth = heigth;
  this.generation=0;
  this.running=false;
  this.intervalId =0;
  
  this.size =width * heigth;
  var i = 0;
  var x, y;

  this.cells = [];
  while(i < this.size) {
    x = Math.floor(i / width);
    y = i - (x * width);
    this.cells.push(new Cell(this,x,y,i));
	i++;
  }
}

World.prototype.getCell = function(index) {
  return this.cells[index];
}

World.prototype.start = function(){
	this.generation=0;
	this.running = true;
	//this.run();
	
	var self = this;
	this.intervalId = setInterval(function() { 
		self.run(); 
		},1000);
}

World.prototype.startParallel = function(){
	this.generation=0;
	this.running = true;
	
	var self = this;
	this.intervalId = setInterval(function() { 
		self.runInParallel(); 
		},1000);
}

World.prototype.stop = function(){
	this.running = false;
	clearInterval(this.intervalId);
}

World.prototype.build = function(){
	buildGrid(this);
	buildInformation(this);
}

World.prototype.run = function(){
	//var intervalId =0;
	//while(this.generation<10000){
		var affectedCells =[];
		
		this.cells.each(function(cell){
			var neighborsLiving = cell.neighborsLiving().length;
			//var newCell = $.extend(true, {}, cell); // Clone object
			if (cell.isLive() && neighborsLiving < 2) //Qualquer célula viva com menos de dois vizinhos vivos morre de solidão.
				affectedCells.push(cell);
			else if (cell.isLive() && neighborsLiving > 3) //Qualquer célula viva com mais de três vizinhos vivos morre de superpopulação.
				affectedCells.push(cell);
			else if (cell.isDead() && neighborsLiving == 3) //Qualquer célula morta com exatamente três vizinhos vivos se torna uma célula viva.
				affectedCells.push(cell);
			//else if(cell.isLive() && (neighborsLiving == 2 || neighborsLiving == 3)) //Qualquer célula viva com dois ou três vizinhos vivos continua no mesmo estado para a próxima geração.
			//newCells.push(newCell);
		});
		
		this.generation++;
		//this.cells = newCells;
		affectedCells.each(function(cell){
			cell.toggle();
		});
		
		this.build();
	//}
	//clearInterval(intervalId);
}

World.prototype.runInParallel = function(){

	try {
		// First check if the WebCL extension is installed at all
		if (window.WebCL == undefined) {
			alert("Unfortunately your system does not support WebCL. " +
			"Make sure that you have both the OpenCL driver " +
			"and the WebCL browser extension installed.");
			return false;
		}
		
		var vectorIn = new Uint32Array(this.size);
		for ( var i=0; i<this.size; i++) {
			vectorIn[i] = this.cells[i].isDead() ? 0:1;
		}
		
		// Setup WebCL context using the default device of the first available platform
		var platforms = WebCL.getPlatformIDs();
		var ctx = WebCL.createContextFromType ([WebCL.CL_CONTEXT_PLATFORM, platforms[0]],
		WebCL.CL_DEVICE_TYPE_DEFAULT);
		
		// Reserve buffers
		var bufSize = this.size * 4; // size in bytes
		var bufIn = ctx.createBuffer (WebCL.CL_MEM_READ_ONLY, bufSize);
		var bufOut = ctx.createBuffer (WebCL.CL_MEM_WRITE_ONLY, bufSize);
		
		// Create and build program for the first device
		var kernelSrc = loadKernel("clgameOfLife");
		var program = ctx.createProgramWithSource(kernelSrc);
		var devices = ctx.getContextInfo(WebCL.CL_CONTEXT_DEVICES);
		try {
			program.buildProgram ([devices[0]], "");
		} catch(e) {
			alert ("Failed to build WebCL program. Error "
			+ program.getProgramBuildInfo (devices[0], WebCL.CL_PROGRAM_BUILD_STATUS)
			+ ": " + program.getProgramBuildInfo (devices[0], WebCL.CL_PROGRAM_BUILD_LOG));
		throw e;
		}
		
		// Create kernel and set arguments
		var kernel = program.createKernel ("clGol");
		kernel.setKernelArg (0, bufIn);
		kernel.setKernelArg (1, bufOut);
		kernel.setKernelArg (2, this.width, WebCL.types.UINT);
		kernel.setKernelArg (3, this.size, WebCL.types.UINT);
		
		// Create command queue using the first available device
		var cmdQueue = ctx.createCommandQueue (devices[0], 0);
		
		// Write the buffer to OpenCL device memory
		cmdQueue.enqueueWriteBuffer (bufIn, false, 0, bufSize, vectorIn, []);
		
		// Init ND-range
		var localWS = [8];
		var globalWS = [Math.ceil (this.size / localWS) * localWS];
		
		// Execute (enqueue) kernel
		cmdQueue.enqueueNDRangeKernel(kernel, globalWS.length, [], globalWS, localWS, []);
		
		// Read the result buffer from OpenCL device
		outBuffer = new Uint32Array(this.size);
		cmdQueue.enqueueReadBuffer (bufOut, false, 0, bufSize, outBuffer, []);
		cmdQueue.finish (); //Finish all the operations
		
		for ( var i=0; i<this.size; i++) {
			if (outBuffer[i] != vectorIn[i]){
				this.cells[i].toggle();
			}
		}
	}
	catch(e) {
		alert("ERROR:" + e.message);
		//throw e;
	}
		//var affectedCells =[];
		
		this.generation++;

		/*affectedCells.each(function(cell){
			cell.toggle();
		});*/
		
	this.build();
}

function Cell(world, x,y,index) {
  this.world = world;
  this.x = x;
  this.y = y;
  this.dead = true;
  this.index = index;
}

Cell.prototype.neighbors = function() {
	var found = [];
	var size = this.world.width;
	
	var top = this.world.getCell(this.index-size); // TOP
	if (top)
		found.push(top); 
	
	var topLeft = this.world.getCell((this.index-size)-1); //TOP LEFT
	if (topLeft && (topLeft.x < this.x && topLeft.y < this.y))
		found.push(topLeft);
		
	var topRight = this.world.getCell((this.index-size)+1); //TOP RIGHT
	if (topRight && (topRight.x < this.x && topRight.y > this.y))
		found.push(topRight);
	
	var right = this.world.getCell(this.index+1); //RIGHT
	if (right && right.x == this.x)
		found.push(right);
		
	var left = this.world.getCell(this.index-1); //LEFT
	if (left && left.x == this.x)
		found.push(left);
	
	var bottom = this.world.getCell(this.index+size); // BOTTOM
	if (bottom)
		found.push(bottom); 
	
	var bottomLeft = this.world.getCell((this.index+size)-1); // BOTTOM LEFT 
	if (bottomLeft && (bottomLeft.x > this.x && bottomLeft.y < this.y))
		found.push(bottomLeft);
	
	var bottomRight = this.world.getCell((this.index+size)+1); //BOTTOM RIGHT
	if (bottomRight && (bottomRight.x > this.x && bottomRight.y > this.y))
		found.push(bottomRight);
	
	return found;
}

Cell.prototype.neighborsLiving = function(){
	//return $(this.neighbors(), ".cell.live");
	return $.grep(this.neighbors(), function(item,index){ 
		return item.dead == false; 
	});
}

Cell.prototype.neighborsDead = function(){
	//return $(this.neighbors(), ".cell.dead");
	return $.grep(this.neighbors(), function(item,index){ 
		return item.dead == true; 
	});
}

Cell.prototype.die = function() {
  return this.dead = true;
}

Cell.prototype.isDead = function() {
  return this.dead;
}

Cell.prototype.live = function() {
  return this.dead = false;
}

Cell.prototype.isLive = function() {
  return !this.isDead();
}

Cell.prototype.toggle = function() {
  this.dead = !this.dead;
  return this.dead;
}

