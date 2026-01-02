// Get canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // Makes the images look good, not blurry

console.log("Game started");

// Variables
const SCENES = {
	MENU: "menu",
	GAME: "game",
	LOSE: "lose",
	CONTROLS: "controls"
};
let currentScene = SCENES.GAME;
const ASSETS = {
	fireForm: "assets/player/fireForm.png",
	electricForm: "assets/player/electricForm.png",
	materialForm: "assets/player/materialForm.png"
};
const images = {};
let assetsLoaded = 0;
const totalAssets = Object.keys(ASSETS).length;
let pressedKeys = new Set();
let userInteracted = false;
// Map
let borders = [
	{name: "top", x: 0, y: 0, width: canvas.width, height: 25},

	{name: "left", x: 0, y: 0, width: 25, height: canvas.height},

	{name: "right", x: canvas.width - 25, y: 0, width: 25, height: canvas.height},

	{name: "bottom", x: 0, y: canvas.height - 25, width: canvas.width, height: 25}
];
// Mobs
let player = {
	x: 100,
	y: 100,
	width: 9,
	height: 20,
	speed: 5,
	health: 100,
	form: "fireForm",
	ogX: 100,
	ogY: 100
};
let oldX = player.x;
let oldY = player.y;
let forms = [
	"fireForm", // 0
	"electricForm", // 1
	"materialForm" // 2
];
let attacks = [
	"fireBall", // 0
	"lightningStrike", // 1
	"rockSummon" // 2
];
let fireBall = {
	x: player.x,
	y: player.y,
	width: 8,
	height: 8,
	speed: 1
};
// Buttons
let attackWithMouse = {
	x: 0,
	y: 0,
	cooldown: 60,
	state: "able"
};

// Input listeners (ONCE)
window.addEventListener('keydown', (e) => {
	pressedKeys.add(e.key);
});

window.addEventListener('keyup', (e) => {
	pressedKeys.delete(e.key);
});
canvas.addEventListener("click", (e) => { // Clicking buttons
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;

	if (currentScene === SCENES.GAME) {
		if (attackWithMouse.state === "able") {
			attackWithMouse.x = mouseX;
			attackWithMouse.y = mouseY;
			shootFireBall(attackWithMouse.x, attackWithMouse.y);
		}
	}
});
// Listen for first user interaction
window.addEventListener("click", () => { userInteracted = true; }, { once: true });
window.addEventListener("keydown", () => { userInteracted = true; }, { once: true });

function rectsOverlap(a, b) { // AABB collision detection (Axis-Aligned Bounding Box)
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

function drawButton(button) {
	ctx.fillStyle = "green";
	ctx.fillRect(button.x, button.y, button.width, button.height);

	ctx.fillStyle = "white";
	ctx.font = "30px Arial";
	ctx.textAlign = "center"; // Aligns the text in the center
	ctx.textBaseline = "middle"; // ???
	ctx.fillText(
		button.text,
		button.x + button.width / 2,
		button.y + button.height / 2
	);
}

function isPointInRect(px, py, rect) {
	return (
		px >= rect.x &&
		px <= rect.x + rect.width &&
		py >= rect.y &&
		py <= rect.y + rect.height
	);
}

function loadAssets(onComplete) {
	for (let key in ASSETS) {
		const img = new Image();
		img.src = ASSETS[key];

		img.onload = () => {
			assetsLoaded++;
			if (assetsLoaded === totalAssets) {
				onComplete();
			}
		};

		images[key] = img;
	}
}

function playSound(sound) {
	const s = sound.cloneNode();
	s.volume = sound.volume;
	s.play();
}

function getMousePos(canvas, evt) {
	// Gets the position and size of the canvas relative to the viewport
	var rect = canvas.getBoundingClientRect();

	// Returns mouse pos relative to the canvas
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function updateDirection(object, targetX, targetY) {
	let diffY = targetY - object.y;
	let diffX = targetX - object.x;
	// Math.atan2 returns the angle in radians
	object.angle = Math.atan2(diffY, diffX);
}

function updateAttackCooldown() {
	if (attackWithMouse.state !== "cooldown") return;

	attackWithMouse.cooldownTimer--;

	if (attackWithMouse.cooldownTimer <= 0) {
		attackWithMouse.state = "able";
	}
}

function shootFireBall(mouseX, mouseY) {
	attackWithMouse.state = "attacking";
    
	// Set starting position (e.g., at the player)
	fireBall.x = player.x; 
	fireBall.y = player.y;

	// STEP 1: Get the difference
	let dx = mouseX - fireBall.x;
	let dy = mouseY - fireBall.y;
	let distance = Math.sqrt(dx * dx + dy * dy);

	// STEP 2: Normalize and STORE the direction forever
	// We save these as 'vx' and 'vy' (velocity x and y)
	fireBall.vx = (dx / distance) * fireBall.speed;
	fireBall.vy = (dy / distance) * fireBall.speed;
}


function updateFireBall() {
	if (attackWithMouse.state !== "attacking") return;

	// Simply move the fireball by the stored velocity
	// It will now go in a straight line forever
	fireBall.x += fireBall.vx;
	fireBall.y += fireBall.vy;

	// Optional: Reset if it goes off-screen
	if (fireBall.x < 0 || fireBall.x > canvas.width || 
		fireBall.y < 0 || fireBall.y > canvas.height) {
			attackWithMouse.state = "cooldown";
			attackWithMouse.cooldownTimer = attackWithMouse.cooldown;
	}
}


function updateGame() {
	oldX = player.x;
	oldY = player.y;

	// Input
	if (pressedKeys.has('w')) {
		//console.log("Move up");
		player.y -= player.speed;
		console.log(attackWithMouse.state);
	}
	if (pressedKeys.has('a')) {
		//console.log("Move left");
		player.x -= player.speed;
	}
	if (pressedKeys.has('s')) {
		//console.log("Move down");
		player.y += player.speed;
	}
	if (pressedKeys.has('d')) {
		//console.log("Move right");
		player.x += player.speed;
	}

	// Detection
	for (let border of borders) {
		if (rectsOverlap(player, border)) {
			player.x = oldX;s
			player.y = oldY;
		}
	}
	for (let border of borders) {
		if (rectsOverlap(fireBall, border) && attackWithMouse.state === "attacking") {
			attackWithMouse.state = "cooldown";
			attackWithMouse.cooldownTimer = attackWithMouse.cooldown;
		}
	}
}

function drawGame() {
	// Drawing the white border around the map
	ctx.fillStyle = "white";
	for (let border of borders) {
		ctx.fillRect(
			border.x,
			border.y,
			border.width,
			border.height
		);
	}

	ctx.font = "24px Arial";
	ctx.fillStyle = "white";
	ctx.fillText("Game", 100, 100);

	// Draws the player
	ctx.drawImage(
		images.fireForm,
		player.x,
		player.y,
		player.width,
		player.height
	);

	// Draw temp fire ball
	if (attackWithMouse.state === "attacking") {
		ctx.fillStyle = "red";
		ctx.fillRect(
			fireBall.x,
			fireBall.y,
			fireBall.width,
			fireBall.height
		);
	}
		

	// Draws the HUD (coming soon...)
	//drawHUD();

	updateGame();
	updateFireBall();
	updateAttackCooldown();
}

function gameLoop() {
	// Clears canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (currentScene === SCENES.GAME) {
		drawGame();
	}

	requestAnimationFrame(gameLoop);
}

loadAssets(() => {
	console.log("All assets loaded!");
	gameLoop();
});