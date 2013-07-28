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
  
  var size =width * heigth;
  var i = 0;
  var x, y;

  this.cells = [];
  while(i < size) {
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

$("#drawing-table").ready(function(){
	$("#start").click(function() {
		document.world.start();
	});
	
	$("#stop").click(function() {
		document.world.stop();
	});
});
