// Init the canvas element
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

// Total number of steps the game has been running
var steps;
// The list of ship objects
var ships;
// The list of breadcrumbs
var breadcrumbs;
// The viewport object
var viewport;
// The input manager
var input;



// Start the game
initGame();


// Init the game
function initGame() {
	steps = 0;
	ships = new Array();
	breadcrumbs = new Array();

	// Create the input
	input = new Input();

	// Create the viewport
	viewport = new Viewport(document.getElementById("myCanvas").offsetWidth,
							document.getElementById("myCanvas").offsetHeight);
	// Spawn player ship
	new Ship(1000, 1000, 0, 1, "#3FC380", true);

	// Set the canvas to the correct size
	c.setAttribute('width', viewport.width);
	c.setAttribute('height', viewport.height);
}

// Game loop
var FPS = 30;
setInterval(function() {
	steps++;
	update();
	draw();
}, 1000/FPS);

// Main update function
function update() {
	// Update the breadcrumbs
	breadcrumbs.forEach ( function(breadcrumb) {
		breadcrumb.update();
	});

	// Update the ships
	ships.forEach ( function(ship) {
		if (ship.isPlayer) {
			// Center the viewport on the player
			ship.update();
			viewport.focus(ship);
		}
	});

	// Update the keypresses
	input.update();
}

// Main draw function
function draw () {
	// Wipe the screen with black 
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,viewport.width,viewport.height);

	// Draw the breadcrumbs
	breadcrumbs.forEach ( function(breadcrumb) {
		breadcrumb.draw();
	});

	// Draw the ships
	ships.forEach ( function(ship) {
		ship.draw();
	});
}

/**************************************
* Handles the viewport!
***************************************/
function Viewport (width, height) {
	this.x = 0;
	this.y = 0;
	this.width = width;
	this.height = height;

	// Center the viewport on a ship.
	this.focus = function (ship) {
		this.x = ship.x - (viewport.width/2);
		this.y = ship.y - (viewport.height/2);
	};
}

/**************************************
* The ship handles both the player
* and AI ships.
***************************************/
function Ship (x, y, team, size, color, isPlayer) {
	this.x = x;
	this.y = y;
	this.team = team;
	this.size = size;
	this.color = color;
	this.isPlayer = isPlayer;

	this.direction = 0;
	this.speed = 0;

	this.maxSpeed = 10;
	this.minSpeed = 3;

	// Used to center the ship when it is being drawn
	this.center = 0;
	if (this.size > 1) {
		this.center = this.size/2;
	}

	// Add the ship to the list
	ships.push (this);

	// X relative to the viewport
	this.relativeX = function () {
		return this.x - viewport.x - this.center;
	};

	// Y relative to the viewport
	this.relativeY = function () {
		return this.y - viewport.y - this.center;
	};

	// Handles input, firing, death, ect
	this.update = function () {
		// Handle player things
		if (this.isPlayer) {
			if (input.keyboardCheck("W"))
				this.speed += 0.3;

			if (input.keyboardCheck("S"))
				this.speed -= 0.4;

			if (input.keyboardCheck("A"))
				this.direction -= 0.15;

			if (input.keyboardCheck("D"))
				this.direction += 0.15;
		}

		// Clamp speed
		if (this.speed < this.minSpeed) {
			this.speed = this.minSpeed;
		}else if (this.speed > this.maxSpeed) {
			this.speed = this.maxSpeed;
		}

		// Move
		this.x += Math.cos(this.direction)*this.speed;
		this.y += Math.sin(this.direction)*this.speed;

		// Make a breadcrumb trail
		if ( (steps / (3) ) == Math.round(steps / (3) )) {
			new Breadcrumb(this.x, this.y, this.size, "white", 2*30);
		}
	};

	// Draw the ship
	this.draw = function () {
		ctx.fillStyle = this.color;
		ctx.fillRect(Math.round(this.relativeX()), Math.round(this.relativeY()), this.size, this.size);
	};

	// Destroy the ship
	this.destroy = function () {
		ships.splice(ships.indexOf(this), 1);
	};
}

/********************************************************
* Basically just a particle. Used to make a trail of
* breadcrumbs behind ships/missles.
********************************************************/
function Breadcrumb (x, y, size, color, lifetime) {
	this.x = x;
	this.y = y;
	this.size = size;
	this.color = color;

	// Miliseconds the breadcrumb exists
	this.lifetime = lifetime;

	// Used to center the breadcrumb if the size is greater than 1
	this.center = 0;
	if (this.size > 1) {
		this.center = this.size/2;
	}

	// Add the breadcrumb to the list
	breadcrumbs.push(this);

	// X relative to the viewport
	this.relativeX = function () {
		return this.x - viewport.x - this.center;
	};

	// Y relative to the viewport
	this.relativeY = function () {
		return this.y - viewport.y - this.center;
	};

	// Handles each step 
	this.update = function () {
		this.lifetime -= 1;
		if (this.lifetime <= 0) {
			this.destroy();
		}
	};

	// Draws the breadcrumb
	this.draw = function () {
		ctx.fillStyle = this.color;
		ctx.fillRect(Math.round(this.relativeX()), Math.round(this.relativeY()), this.size, this.size);
	};

	// Destroy the breadcrumb
	this.destroy = function () {
		breadcrumbs.splice(breadcrumbs.indexOf(this), 1);
	};
}


/**************************************
* Handles all input for the game.
* This looks really ugly and I sort of dislike it... but it works.
*************************************/
function Input () {
	// Holds most key states.
	this.keyboardEvents = new Array();

	// Holds pressed key states that need to be switched to held or switched off
	this.keyboardPressedList = new Array();

	// Switches keypresses from pressed to held or removes the released flag
	this.update = function() {
		// Go through the list of keys that need attention
		input.keyboardPressedList.forEach ( function(key) {
			if (input.keyboardCheckPressed(key)) {
				// Switch key to held
				input.keyboardEvents.push(key);
				// Remove pressed flag
				input.keyboardEvents.splice(input.keyboardEvents.indexOf(key + "Pressed"), 1);
				// Remove item from "needs attention" list
				input.keyboardPressedList.splice(input.keyboardPressedList.indexOf(key), 1);
			}else if (input.keyboardCheckReleased(key)) {
				// Remove released flag from key
				input.keyboardEvents.splice(input.keyboardEvents.indexOf(key + "Released"), 1);
			}
		});
	}

	// Checks for press event
	this.keyboardCheckPressed = function(key) {
		if (this.keyboardEvents.indexOf(key + "Pressed") != -1)
			return true;
		else
			return false;
	};

	// Checks for released event
	this.keyboardCheckReleased = function(key) {
		if (this.keyboardEvents.indexOf(key + "Released") != -1)
			return true;
		else
			return false;
	};

	// Checks for held event
	this.keyboardCheck = function(key) {
		if (this.keyboardEvents.indexOf(key) != -1)
			return true;
		else
			return false;
	};

	// Converts keycode to character.
	// Any key not listed here won't be tracked.
	this.keyLiteral = function(keyCode) {
		switch (keyCode) {
			case 87:
				return "W";
			break;

			case 65:
				return "A";
			break;

			case 83:
				return "S";
			break;

			case 68:
				return "D";
			break;
		}

		return "unknown";
	};

	// Handles keypressed and keyheld
	document.addEventListener('keydown', function(event) {
		var key =  input.keyLiteral(event.keyCode);
		if (key == "unknown") {
			console.log(event.keyCode);
		}else{
			if (input.keyboardCheckPressed(key)) {
				input.keyboardEvents.push(key);
				input.keyboardEvents.splice(input.keyboardEvents.indexOf(key + "Pressed"), 1);
			}else{
				if (!input.keyboardCheck(key)) {
					input.keyboardEvents.push(key + "Pressed");
					input.keyboardPressedList.push(key);
				}
			}
		}
	});

	// Handles keyreleased
	document.addEventListener('keyup', function(event) {
		var key =  input.keyLiteral(event.keyCode);
		if (key == "unknown") {
			console.log(event.keyCode);
		}else{
			input.keyboardEvents.push(key + "Released");
			input.keyboardPressedList.push(key);

			var index = input.keyboardEvents.indexOf(key + "Pressed");
			if (index != -1)
				input.keyboardEvents.splice(index, 1);

			index = input.keyboardEvents.indexOf(key);

			if (index != -1)
				input.keyboardEvents.splice(index, 1);
		}
	});
}