var obstacle, target, population;
var popSize = 10;
var lifespan = 300;
var maxforce = 0.5;
var count = 0;
var pops = 1;
var p;
var pause = false;

function setup() {
	createCanvas(800, 600);
	frameRate(60);
	population = new Population();
	obstacle = new Obstacle();
	target = new Target(64);
	p = createP();
}

function draw() {
	background(41);
	p.html('Generation: ' + pops);
	population.run();
	target.show();
	obstacle.show();

	count++;
	if (count == lifespan) {
		population.evaluate();
		population.selection();
		count = 0;
		pops++;
	}
}

function Rocket(dna) {
	this.pos = createVector(width / 2, height - 10);
	this.vel = createVector();
	this.acc = createVector();
	this.col = color(random(255), random(255), random(255));

	if (dna) this.dna = dna;
	else this.dna = new DNA();

	this.gravity = createVector(0, 0.05);
	this.completed = false;
	this.crashed = false;
	this.fitness = 0;

	this.applyForce = function (force) {
		this.acc.add(force);
		//this.acc.add(this.gravity);
	};

	this.calcFitness = function () {
		var d = dist(this.pos.x, this.pos.y, target.x, target.y);
		this.fitness = map(d, 0, width, width, 0);
		if (this.completed) this.fitness *= 100;
		if (this.crashed) this.fitness /= 10;
		if (this.pos.y >= height) this.fitness /= 2;
		if (this.pos.y < 0) this.fitness /= 2;
		if (this.pos.y < obstacle.y) this.fitness *= 3;
	};

	this.update = function () {
		if (target.hit(this.pos)) this.completed = true;
		if (
			this.pos.x < 0 ||
			this.pos.x > width ||
			this.pos.y > height ||
			obstacle.hit(this.pos)
		)
			this.crashed = true;

		if (!this.crashed && !this.completed) {
			this.applyForce(this.dna.genes[count]);
			this.vel.add(this.acc);
			this.pos.add(this.vel);
			this.acc.mult(0);
		}
	};

	this.show = function () {
		push();
		noStroke();
		translate(this.pos.x, this.pos.y);
		rotate(this.vel.heading());
		rotate(PI / 2);
		fill(this.col, 128);
		triangle(0, -10, -7, 10, 7, 10);
		pop();
	};
}

function Population() {
	this.rockets = [];
	this.matingpool = [];

	for (var a = 0; a < popSize; a++) this.rockets[a] = new Rocket();

	this.evaluate = function () {
		var maxfit = 0;
		for (var i = 0; i < popSize; i++) {
			this.rockets[i].calcFitness();
			if (this.rockets[i].fitness > maxfit) maxfit = this.rockets[i].fitness;
		}

		for (var i = 0; i < popSize; i++) this.rockets[i].fitness /= maxfit;

		this.matingpool = [];
		for (var i = 0; i < popSize; i++) {
			var n = this.rockets[i].fitness * 100;
			for (var j = 0; j < n; j++) this.matingpool.push(this.rockets[i]);
		}
	};

	this.selection = function () {
		var newRockets = [];
		for (var i = 0; i < this.rockets.length; i++) {
			var parentA = random(this.matingpool);
			var parentB = random(this.matingpool);
			if (parentA.fitness > parentB.fitness) {
				var child = parentA.dna.crossover(parentB.dna);
			} else {
				var child = parentB.dna.crossover(parentA.dna);
			}
			child.mutation();
			newRockets[i] = new Rocket(child);
		}
		this.rockets = newRockets;
	};

	this.failed = function () {
		for (var i = 0; i < this.rockets.length; i++) {
			if (!this.rockets[i].crashed) return false;
		}
		return true;
	};

	this.run = function () {
		for (var a = 0; a < popSize; a++) {
			this.rockets[a].update();
			this.rockets[a].show();
		}
	};
}

function Obstacle() {
	this.x = width / 4;
	this.y = height / 2;
	this.w = width / 2;
	this.h = height / 30;

	this.hit = function (input) {
		if (
			input.x > this.x &&
			input.x < this.x + this.w &&
			input.y > this.y &&
			input.y < this.y + this.h
		)
			return true;
	};

	this.show = function () {
		noStroke();
		fill(236, 19, 19);
		rect(this.x, this.y, this.w, this.h);
	};
}

function Target(r) {
	this.r = r;
	this.x = width / 2;
	this.y = height / 4;

	this.hit = function (input) {
		var d = dist(input.x, input.y, this.x, this.y);
		if (d < this.r / 2) return true;
	};

	this.show = function () {
		noStroke();
		fill(0, 153, 51);
		ellipse(this.x, this.y, this.r, this.r);
	};
}

function DNA(genes) {
	if (genes) {
		this.genes = genes;
	} else {
		this.genes = [];

		for (var i = 0; i < lifespan; i++) {
			this.genes[i] = p5.Vector.random2D();
			this.genes[i].setMag(maxforce);
		}
	}

	this.crossover = function (partner) {
		var newgenes = [];
		var mid = floor(random(this.genes.length / 2));
		for (var i = 0; i < this.genes.length; i++) {
			var rand = random(this.genes.length);
			if (rand > mid) {
				newgenes[i] = this.genes[i];
			} else {
				newgenes[i] = partner.genes[i];
			}
		}
		return new DNA(newgenes);
	};

	this.mutation = function () {
		for (var i = 0; i < this.genes.length; i++) {
			if (random(1) < 0.001) {
				this.genes[i] = p5.Vector.random2D();
				this.genes[i].setMag(maxforce);
			}
		}
	};
}

function keyPressed() {
	if (keyCode === 13) {
		pause = !pause;
		if (pause) noLoop();
		else loop();
	}
}
