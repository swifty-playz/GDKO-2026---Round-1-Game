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
	materialForm: "assets/player/materialForm.png",
	fireBall: "assets/attacks/fireBall.png",
	lightningStrike: "assets/attacks/lightningStrike.png",
	block: "assets/attacks/block.png",
	shooterEnemy: "assets/enemy/shooterEnemy.png",
	swordEnemy: "assets/enemy/swordEnemy.png",
	gun: "assets/weapons/gun.png",
	bullet: "assets/attacks/bullet.png",
	sword: "assets/weapons/sword.png",
	burningPlanet: "assets/planets/burningPlanet.png",
	stormPlanet: "assets/planets/stormPlanet.png",
	greenhousePlanet: "assets/planets/greenhousePlanet.png"
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
let sizeMult = 2;
let planetMult = 6;
let currentPlanet = "burningPlanet";
let planet = {
	x: canvas.width / 2 - 192,
	y: canvas.height / 2 - 192,
	width: 64 * planetMult,
	height: 64 * planetMult
};
let planets = [
	"burningPlanet", // 0
	"stormPlanet", // 1
	"greenhousePlanet" // 2
];
let arcBorder = {
	x: planet.x + 192,
	y: planet.y + 192,
	radius: planet.width / 2,
	startAngle: 0, 
	endAngle: 2 * Math.PI // 2 * PI radians
};
// Mobs
let player = {
	x: canvas.width / 2,
	y: canvas.height / 2,
	width: 9 * sizeMult,
	height: 20 * sizeMult,
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
	width: 16 * sizeMult,
	height: 16 * sizeMult,
	speed: 2,
	active: false
};
let lightning = {
	x: player.x,
	y: player.y,
	width: 16 * sizeMult,
	height: 63 * sizeMult,
	yOffset: 63 * sizeMult,
	duration: 60,
	active: false
};
let block = {
	x: player.x,
	y: player.y,
	width: 16 * sizeMult,
	height: 8 * sizeMult,
	duration: 60,
	active: false
};
let bullet = {
	x: player.x,
	y: player.y,
	width: 8 * sizeMult,
	height: 5 * sizeMult,
	duration: 60,
	active: false
};
let sword = {
	x: player.x,
	y: player.y,
	width: 5 * sizeMult,
	height: 14 * sizeMult,
	duration: 60,
	active: false
};
// Buttons
let attackWithMouse = {
	x: 0,
	y: 0,
	cooldown: 60,
	state: "able",
	attack: attacks[0]
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
			// Checks and does the attack corresponding to player form
			checkFormAttack();
			//shootFireBall(attackWithMouse.x, attackWithMouse.y);
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
	fireBall.active = true;
    
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
			fireBall.active = false;
	}
}

function checkFormAttack() {
	if (player.form === forms[0]) { // 0
		shootFireBall(attackWithMouse.x, attackWithMouse.y);
		attackWithMouse.attack = attacks[0];
		console.log("Fireball attack!");
	}
	else if (player.form === forms[1]) { // 1
		attackWithMouse.attack = attacks[1];
		lightning.active = true;
		lightning.timer = lightning.duration;
		summonLightning(attackWithMouse.x, attackWithMouse.y);
		console.log("Electric attack!");
	}
	else if (player.form === forms[2]) { // 2
		attackWithMouse.attack = attacks[2];
		block.active = true;
		block.timer = block.duration;
		spawnBlock(attackWithMouse.x, attackWithMouse.y);
		console.log("Material attack!");
	}
}

function summonLightning(mouseX, mouseY) {
	attackWithMouse.state = "attacking";
    
	lightning.x = mouseX; 
	lightning.y = mouseY;
}

function updateLightning() {
	//console.log(lightning.active);
	if (!lightning.active) return;

	lightning.timer--;
	attackWithMouse.state = "attacking";
	//console.log(lightning.timer);

	if (lightning.timer <= 0) {
		attackWithMouse.state = "cooldown";
		attackWithMouse.cooldownTimer = attackWithMouse.cooldown;
		lightning.active = false;
		//console.log("we are here tho right?");
	}
}

function spawnBlock(mouseX, mouseY) {
	attackWithMouse.state = "attacking";
    
	block.x = mouseX; 
	block.y = mouseY;
}

function updateBlock() {
	if (!block.active) return;

	block.timer--;
	attackWithMouse.state = "attacking";

	if (block.timer <= 0) {
		attackWithMouse.state = "cooldown";
		attackWithMouse.cooldownTimer = attackWithMouse.cooldown;
		block.active = false;
	}
}

function updateGame() {
	oldX = player.x;
	oldY = player.y;

	// Input
	if (pressedKeys.has('w')) {
		//console.log("Move up");
		player.y -= player.speed;
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
	if (pressedKeys.has('1') && attackWithMouse.state === "able") {
		player.form = "fireForm";
		console.log(player.form);
	}
	if (pressedKeys.has('2') && attackWithMouse.state === "able") {
		player.form = "electricForm";
		lightning.active = false;
		console.log(player.form);
	}
	if (pressedKeys.has('3') && attackWithMouse.state === "able") {
		player.form = "materialForm";
		console.log(player.form);
	}
	if (pressedKeys.has('e')) {
		console.log("Switching planet");
		if (player.form === "fireForm") {
			currentPlanet = "burningPlanet";
		}
		else if (player.form === "electricForm") {
			currentPlanet = "stormPlanet";
		}
		else if (player.form === "materialForm") {
			currentPlanet = "greenhousePlanet";
		}
	}

	// Detection
	for (let border of borders) {
		if (rectsOverlap(player, border)) {
			player.x = oldX;
			player.y = oldY;
		}
	}
	for (let border of borders) {
		if (rectsOverlap(fireBall, border) && attackWithMouse.state === "attacking") {
			attackWithMouse.state = "cooldown";
			attackWithMouse.cooldownTimer = attackWithMouse.cooldown;
			fireBall.active = false;
		}
	}
	// arcBorder collision detection
	const playerCenterX = player.x + player.width / 2;
	const playerCenterY = player.y + player.height / 2;
	const dx = playerCenterX - arcBorder.x;
	const dy = playerCenterY - arcBorder.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	if (distance > arcBorder.radius) {
		player.x = oldX;
		player.y = oldY;
	}
	// Attacks
	if (rectsOverlap(player, lightning) && lightning.active) {
		player.health = player.health - 10;
		
	}
	if (rectsOverlap(player, fireBall) && fireBall.active) {
		player.health = player.health - 10;
	}
	if (rectsOverlap(player, block) && block.active) {
		player.health = player.health - 10;
	}
}

function drawGame() {
	// Drawing the white border around the map
	ctx.fillStyle = "gray";
	for (let border of borders) {
		ctx.fillRect(
			border.x,
			border.y,
			border.width,
			border.height
		);
	}

	// Draw planet
	if (currentPlanet === "burningPlanet") {
		ctx.drawImage(
			images.burningPlanet,
			planet.x,
			planet.y,
			planet.width,
			planet.height
		);
	}
	else if (currentPlanet === "stormPlanet") {
		ctx.drawImage(
			images.stormPlanet,
			planet.x,
			planet.y,
			planet.width,
			planet.height
		);
	}
	else if (currentPlanet === "greenhousePlanet") {
		ctx.drawImage(
			images.greenhousePlanet,
			planet.x,
			planet.y,
			planet.width,
			planet.height
		);
	}

	// Draw circle
	ctx.beginPath();
	ctx.arc(
		arcBorder.x,
		arcBorder.y,
		arcBorder.radius,
		arcBorder.startAngle,
		arcBorder.endAngle
	);
	ctx.strokeStyle = "blue";
	ctx.lineWidth = 10;
	ctx.stroke();

	ctx.font = "24px Arial";
	ctx.fillStyle = "white";
	ctx.fillText(player.health, 100, 100);

	// Draws the player
	if (player.form === forms[0]) {
		ctx.drawImage(
			images.fireForm,
			player.x,
			player.y,
			player.width,
			player.height
		);
	}
	else if (player.form === forms[1]) {
		ctx.drawImage(
			images.electricForm,
			player.x,
			player.y,
			player.width,
			player.height
		);
	}
	else if (player.form === forms[2]) {
		ctx.drawImage(
			images.materialForm,
			player.x,
			player.y,
			player.width,
			player.height
		);
	}
	
	// Draw temp fire ball
	if (attackWithMouse.state === "attacking") {
		if (attackWithMouse.attack === attacks[0]) {
			ctx.drawImage(
				images.fireBall,
				fireBall.x,
				fireBall.y,
				fireBall.width,
				fireBall.height
			);
		}
		else if (attackWithMouse.attack === attacks[1]) {
			ctx.drawImage(
				images.lightningStrike,
				lightning.x,
				lightning.y - lightning.yOffset,
				lightning.width,
				lightning.height
			);
		}
		else if (attackWithMouse.attack === attacks[2]) {
			ctx.drawImage(
				images.block,
				block.x,
				block.y,
				block.width,
				block.height
			);
		}
	}
		

	// Draws the HUD (coming soon...)
	//drawHUD();

	updateGame();
	updateFireBall();
	updateLightning();
	updateBlock();
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