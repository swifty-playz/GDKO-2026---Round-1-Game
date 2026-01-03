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
let currentScene = SCENES.MENU;
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
	ogX: canvas.width / 2,
	ogY: canvas.height / 2,
	score: 0,
	defense: 2,
	dmgAdd: 5
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
	active: false,
	damage: 30 + player.dmgAdd
};
let lightning = {
	x: player.x,
	y: player.y,
	width: 16 * sizeMult,
	height: 63 * sizeMult,
	yOffset: 63 * sizeMult,
	duration: 60,
	active: false,
	damage: 40 + player.dmgAdd
};
let block = {
	x: player.x,
	y: player.y,
	width: 16 * sizeMult,
	height: 8 * sizeMult,
	duration: 60,
	active: false,
	damage: 20 + player.dmgAdd
};
let enemies = [];
let enemySpawnSystem = {
	timer: 0,
	delay: 360
};
let gun = {
	x: 0,
	y: 0,
	width: 8 * sizeMult,
	height: 4 * sizeMult,
	state: "able",
	active: false,
	cooldown: 90
};
let bullet = {
	x: player.x,
	y: player.y,
	width: 8,
	height: 5,
	speed: 3
};
let sword = {
	x: 0,
	y: 0,
	width: 5 * sizeMult,
	height: 14 * sizeMult,
};
// Buttons
let attackWithMouse = {
	x: 0,
	y: 0,
	cooldown: 60,
	state: "cooldown",
	attack: attacks[0]
};
let startButton = {
	x: canvas.width / 2 - 100,
	y: 200,
	width: 200,
	height: 60,
	text: "START"
};
let controlsButton = {
	x: canvas.width / 2 - 100,
	y: 300,
	width: 200,
	height: 60,
	text: "CONTROLS"
};
let loseMenuButton = {
	x: canvas.width / 2 - 100,
	y: 330,
	width: 200,
	height: 60,
	text: "Menu"
};
let loseReplayButton = {
	x: canvas.width / 2 - 100,
	y: 200,
	width: 200,
	height: 60,
	text: "Replay"
};
let menuButton = {
	x: canvas.width / 2 - 100,
	y: canvas.height - 120,
	width: 200,
	height: 60,
	text: "Menu"
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

	if (currentScene === SCENES.MENU) {
		if (isPointInRect(mouseX, mouseY, startButton)) {
			reset();
			currentScene = SCENES.GAME;
		}
	}
	if (currentScene === SCENES.MENU) {
		if (isPointInRect(mouseX, mouseY, controlsButton)) {
			currentScene = SCENES.CONTROLS;
		}
	}
	if (currentScene === SCENES.CONTROLS) {
		if (isPointInRect(mouseX, mouseY, menuButton)) {
			currentScene = SCENES.MENU;
		}
	}
	if (currentScene === SCENES.GAME) {
		if (attackWithMouse.state === "able") {
			attackWithMouse.x = mouseX;
			attackWithMouse.y = mouseY;
			// Checks and does the attack corresponding to player form
			checkFormAttack();
			//shootFireBall(attackWithMouse.x, attackWithMouse.y);
		}
	}
	if (currentScene === SCENES.LOSE) {
		if (isPointInRect(mouseX, mouseY, loseReplayButton)) {
			reset();
			currentScene = SCENES.GAME;
		}
	}
	if (currentScene === SCENES.LOSE) {
		if (isPointInRect(mouseX, mouseY, loseMenuButton)) {
			currentScene = SCENES.MENU;
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
	ctx.fillStyle = "black";
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
	fireBall.hitEnemies = new Set();
    
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
	lightning.hitEnemies = new Set();
    
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
	block.hitEnemies = new Set();
    
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

function createEnemy(type, x, y) {
	return {
		type: type,

		x: x,
		y: y,
		width: 9 * sizeMult,
		height: 20 * sizeMult,

		speed: type === "shooter" ? 1 : 1,
		health: type === "shooter" ? 20 : 60,
		damage: type === "shooter" ? 5 : 15,
		angle: 0,
		bulletX: x,
		bulletY: y,
		bulletAngle: 0,
		bulletActive: false,

		state: "idle"
	};
}

function spawnEnemies() {
	const scaling = Math.floor(player.score / 50); // every 50 points adds 1 enemy possible
	const amount = Math.floor(Math.random() * scaling) + 1; 

	for (let i = 0; i < amount; i++) {
		const type = Math.random() < 0.5 ? "shooter" : "sword";

		const x = Math.random() * (canvas.width - 50) + 25;
		const y = Math.random() * (canvas.height - 50) + 25;

		enemies.push(createEnemy(type, x, y));
	}
}

function updateEnemySpawner() {
	enemySpawnSystem.timer++;

	if (enemySpawnSystem.timer >= enemySpawnSystem.delay) {
		enemySpawnSystem.timer = 0;
		spawnEnemies();
		player.score = player.score + 10;
	}
}

function updateEnemies() {
	enemies = enemies.filter(enemy => enemy.health > 0);

	for (let enemy of enemies) {
		// Move toward player (simple AI)
		let dx = player.x - enemy.x;
		let dy = player.y - enemy.y;
		let dist = Math.sqrt(dx * dx + dy * dy);

		if (dist !== 0) {
			enemy.x += (dx / dist) * enemy.speed;
			enemy.y += (dy / dist) * enemy.speed;
		}

		// Calculate and store the angle in radians
        	// Math.atan2 takes (y, x) and returns the angle between them
        	enemy.angle = Math.atan2(dy, dx); 

		if (enemy.type === "shooter") {
			if (enemy.state === "idle") {
				shootBullet();
			}
			else if (enemy.state === "shooting") {
				updateBullet();
			}
		}
	}
}

function drawEnemies() {
	for (let enemy of enemies) {
		if (enemy.type === "shooter") {
			ctx.drawImage(images.shooterEnemy, enemy.x, enemy.y, enemy.width, enemy.height);
			//ctx.drawImage(images.gun, enemy.x, enemy.y + 15, gun.width, gun.height);
			drawRotatedWeapon(images.gun, enemy.x + enemy.width / 2, enemy.y + 15, gun.width, gun.height, enemy.angle);
			if (enemy.state === "shooting") {
				drawRotatedWeapon(images.bullet, enemy.bulletX, enemy.bulletY, bullet.width, bullet.height, enemy.bulletAngle);
			}
		} else {
			ctx.drawImage(images.swordEnemy, enemy.x, enemy.y, enemy.width, enemy.height);
			//ctx.drawImage(images.sword, enemy.x, enemy.y, sword.width, sword.height);
			drawRotatedWeapon(images.sword, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, sword.width, sword.height, enemy.angle);
		}
	}
}

function drawRotatedWeapon(img, x, y, width, height, angle) {
	ctx.save();               // Save the current state
	ctx.translate(x, y);      // Move origin to weapon's position
	ctx.rotate(angle);        // Rotate the canvas
    
	// Draw the image centered on the new origin
	ctx.drawImage(img, -width / 2, -height / 2, width, height); 
    
	ctx.restore();            // Restore to previous state
}

function shootBullet() {
	for (let enemy of enemies) {
		if (enemy.type === "shooter") {
			// Sets the bullets starting position
			enemy.bulletX = enemy.x;
			enemy.bulletY = enemy.y;

			// Get the difference
			let bulletDx = player.x - enemy.bulletX;
			let bulletDy = player.y - enemy.bulletY;
			let bulletDistance = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);

			// Normalize and store the direction
			enemy.bulletVx = (bulletDx / bulletDistance) * bullet.speed;
			enemy.bulletVy = (bulletDy / bulletDistance) * bullet.speed;

			enemy.angle = Math.atan2(bulletDx, bulletDy); 

			enemy.state = "shooting";
			enemy.bulletActive = true;
		}
	}
}

function updateBullet() {
	for (let enemy of enemies) {
		if (enemy.type === "shooter") {
			// Move bullet
			enemy.bulletX += enemy.bulletVx;
			enemy.bulletY += enemy.bulletVy;

			if (enemy.bulletX < 0 || enemy.bulletY > canvas.width || enemy.bulletY < 0 || enemy.bulletY > canvas.height) {
				enemy.state = "idle";
				enemy.bulletActive = false;
			}
		}
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
		attackWithMouse.attack = attacks[0];
		console.log(player.form);
	}
	if (pressedKeys.has('2') && attackWithMouse.state === "able") {
		player.form = "electricForm";
		lightning.active = false;
		attackWithMouse.attack = attacks[1];
		console.log(player.form);
	}
	if (pressedKeys.has('3') && attackWithMouse.state === "able") {
		player.form = "materialForm";
		attackWithMouse.attack = attacks[2];
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
	if (
		fireBall.active &&
		rectsOverlap(fireBall, player) &&
		!fireBall.hitEnemies.has(player)
	) {
		player.health -= (fireBall.damage / 10);
		fireBall.hitEnemies.add(player);
	}
	if (
		lightning.active &&
		rectsOverlap(lightning, player) &&
		!lightning.hitEnemies.has(player)
	) {
		player.health -= (lightning.damage / 10);
		lightning.hitEnemies.add(player);
	}
	if (
		block.active &&
		rectsOverlap(block, player) &&
		!block.hitEnemies.has(player)
	) {
		player.health -= (block.damage / 10);
		block.hitEnemies.add(player);
	}

	for (let enemy of enemies) {
		if (
			fireBall.active &&
			rectsOverlap(fireBall, enemy) &&
			!fireBall.hitEnemies.has(enemy)
		) {
			enemy.health -= fireBall.damage;
			fireBall.hitEnemies.add(enemy);
			player.score = player.score + 5;
			player.health = player.health + 3;
		}
	}
	for (let enemy of enemies) {
		if (
			lightning.active &&
			rectsOverlap(lightning, enemy) &&
			!lightning.hitEnemies.has(enemy)
		) {
			enemy.health -= lightning.damage;
			lightning.hitEnemies.add(enemy);
			player.score = player.score + 10;
			player.health = player.health + 3;
		}
	}
	for (let enemy of enemies) {
		if (
			block.active &&
			rectsOverlap(block, enemy) &&
			!block.hitEnemies.has(enemy)
		) {
			enemy.health -= block.damage;
			block.hitEnemies.add(enemy);
			player.score = player.score + 15;
			player.health = player.health + 3;
		}
	}

	for (let enemy of enemies) {
		if (rectsOverlap(player, enemy)) {
			enemy.health = 0;
			player.health = player.health - (enemy.damage - player.defense);
			player.score = player.score + 1;
			player.health = player.health + 3;
		}
	}

	// Player and enemy bullet detection
	for (let enemy of enemies) {
		if (enemy.type !== "shooter") continue;
		if (!enemy.bulletActive) continue;

		const enemyBulletRect = {
			x: enemy.bulletX,
			y: enemy.bulletY,
			width: bullet.width,
			height: bullet.height
		};

		if (rectsOverlap(player, enemyBulletRect)) {
			player.health -= (enemy.damage - player.defense);

			// deactivate bullet so it doesn't hit again
			enemy.bulletActive = false;
			enemy.state = "idle";
		}
	}

	if (player.health <= 0) {
		currentScene = SCENES.LOSE;
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

		// Reset previous changes
		player.speed = 5;

		// Benefit = inc dmg by 10%
		player.dmgAdd = 5
		// Cost = removes defense
		player.defense = 0;
	}
	else if (currentPlanet === "stormPlanet") {
		ctx.drawImage(
			images.stormPlanet,
			planet.x,
			planet.y,
			planet.width,
			planet.height
		);

		// Reset previous changes
		player.dmgAdd = 0;

		// Benefit = inc speed
		player.speed = 7;
		// Cost = dec defense
		player.defense = 1;
	}
	else if (currentPlanet === "greenhousePlanet") {
		ctx.drawImage(
			images.greenhousePlanet,
			planet.x,
			planet.y,
			planet.width,
			planet.height
		);

		// Reset previous changes
		player.dmgAdd = 0;

		// Benefit = inc def
		player.defense = 4;
		// Cost = dec speed
		player.speed = 3;
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
	ctx.strokeStyle = "black";
	ctx.lineWidth = 5;
	ctx.stroke();

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
	
	updateEnemies();
	drawEnemies();

	// Draws the HUD
	drawHUD();

	updateGame();
	updateFireBall();
	updateLightning();
	updateBlock();
	updateAttackCooldown();
	updateEnemySpawner();
}

function drawMenu() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(
		images.greenhousePlanet,
		planet.x,
		planet.y,
		planet.width,
		planet.height
	);

	ctx.fillStyle = "white";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("Elemental Shift", canvas.width / 2, 130);

	drawButton(startButton);
	drawButton(controlsButton);
}

function drawLose() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(
		images.burningPlanet,
		planet.x,
		planet.y,
		planet.width,
		planet.height
	);

	ctx.fillStyle = "white";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("You Lose!", canvas.width / 2, 120);
	ctx.fillText(`Score: ${player.score}`, canvas.width / 2, 170);

	drawButton(loseReplayButton);
	drawButton(loseMenuButton);
}

function drawControls() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(
		images.stormPlanet,
		planet.x,
		planet.y,
		planet.width,
		planet.height
	);

	// Displays "Controls" text
	ctx.fillStyle = "white";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("Controls", canvas.width / 2, 120);

	// Displays the list of controls
	ctx.font = "25px Arial";
	ctx.fillText("WASD for movement", canvas.width / 2, canvas.height / 2 - 75);
	ctx.fillText("Click 1 for fire form to shoot fireball", canvas.width / 2, canvas.height / 2 - 50);
	ctx.fillText("Click 2 for electric form to summon lightning", canvas.width / 2, canvas.height / 2 - 25);
	ctx.fillText("Click 3 for material form to spawn a block", canvas.width / 2, canvas.height / 2);
	ctx.fillText("Click e to change planet to corresponding player form", canvas.width / 2, canvas.height / 2 + 25);
	ctx.fillText("Click anywhere on the screen with your mouse to attack", canvas.width / 2, canvas.height / 2 + 50);
	ctx.fillText("Kill enemies to increase score and HP", canvas.width / 2, canvas.height / 2 + 75);
	ctx.fillText("Go for highest high score!", canvas.width / 2, canvas.height / 2 + 100);

	drawButton(menuButton);
}

function drawHUD() {
	ctx.fillStyle = "white";
	ctx.font = "20px Arial";
	ctx.textAlign = "left";

	ctx.fillText(`Health: ${player.health}`, 25, 15);
	ctx.fillText(`Score: ${player.score}`, canvas.width / 1.25, 15);

	ctx.fillText(`Form: ${player.form}`, 25, canvas.height - 15);
	ctx.fillText(`Attack: ${attackWithMouse.attack}`, canvas.width / 1.3, canvas.height - 15);

	ctx.textAlign = "center";
	ctx.fillText(currentPlanet, canvas.width / 2, canvas.height - 40);

	if (attackWithMouse.state === "able") {
		ctx.fillText("Can attack", canvas.width / 2, 15);
	}
	else {
		ctx.fillText("Can't attack", canvas.width / 2, 15);
	}
}

function reset() {
	player.x = player.ogX;
	player.y = player.ogY;
	player.form = "fireForm";
	player.health = 100;
	player.speed = 5;
	player.score = 0;
	player.defense = 5;
	
	attackWithMouse.cooldownTimer = attackWithMouse.cooldown;
	attackWithMouse.state = "cooldown";
	attackWithMouse.attack = attacks[0];

	currentPlanet = "burningPlanet";

	enemies = [];
	//enemySpawnSystem.timer = enemySpawnSystem.delay;
}

function gameLoop() {
	// Clears canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (currentScene === SCENES.MENU) {
		drawMenu();
	}
	else if (currentScene === SCENES.GAME) {
		drawGame();
	}
	else if (currentScene === SCENES.LOSE) {
		drawLose();
	}
	else if (currentScene === SCENES.CONTROLS) {
		drawControls();
	}

	requestAnimationFrame(gameLoop);
}

loadAssets(() => {
	console.log("All assets loaded!");
	gameLoop();
});