// Get canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // Makes the images look good, not blurry

console.log("Game started");

// Constants
const SCENES = {
	MENU: "menu",
	GAME: "game",
	LOSE: "lose",
	WIN: "win",
	CONTROLS: "controls"
};
const ASSETS = {
	player: "assets/player/player.png",
	enemy: "assets/enemy/enemy.png",
	candyCane: "assets/collectibles/candyCane.png",
	stocking: "assets/collectibles/stocking.png",
	santaHat: "assets/collectibles/santaHat.png",
	christmasTree: "assets/collectibles/christmasTree.png",
	cookies: "assets/collectibles/cookies.png",
	milk: "assets/collectibles/milk.png",
	map: "assets/map/blankMap.png",
	bellHUD: "assets/hud/bellHUD.png",
	healthHUD: "assets/hud/health.png",
	house: "assets/map/house.png",
	tree: "assets/map/tree.png",
	bgImg: "assets/hud/backgroundImg.png"
};
const images = {};

const bell = new Audio("assets/sfx/bell.mp3");
bell.volume = 0.7;
const winMusic = new Audio("assets/music/winMusic.wav");
winMusic.volume = 0.7;
const jumpScareSFX = new Audio("assets/sfx/jumpScare.ogg");
jumpScareSFX.volume = 0.7;
const loseSFX = new Audio("assets/sfx/lose.m4a");
loseSFX.volume = 0.7;
const menuMusic = new Audio ("assets/music/menuMusic.mp3");
menuMusic.loop = true;
menuMusic.volume = 0.15;
const gameMusic = new Audio ("assets/sfx/ambience.flac");
gameMusic.loop = true;
gameMusic.volume = 1.0;
const pickup = new Audio ("assets/sfx/pickup.wav");
pickup.volume = 0.7;

const collectibleSpawns = [
	{x: 685, y: 65},
	{x: 210, y: 50},
	{x: 65, y: 190},
	{x: 130, y: 445},
	{x: 95, y: 680},
	{x: 330, y: 615},
	{x: 495, y: 620},
	{x: 715, y: 685},
	{x: 670, y: 480},
	{x: 595, y: 315},
	{x: 285, y: 255},
	{x: 590, y: 255},
	{x: 700, y: 185}
];


// GLOBAL variables
let pressedKeys = new Set();
let player = {
	x: 345,
	y: 415,
	width: 8,
	height: 26,
	speed: 2,
	health: 5,
	items: 0,
	spawnX: 345,
	spawnY: 415
};
let block = {
		x: 100,
		y: 100,
		width: 50,
		height: 50
};
let oldX = player.x;
let oldY = player.y;
let collectibles = [
	{name: "candyCane", x: 250, y: 250, width: 10, height: 10, collected: false},

	{name: "stocking", x: 350, y: 350, width: 10, height: 10, collected: false},

	{name: "santaHat", x: 270, y: 250, width: 10, height: 10, collected: false},

	{name: "christmasTree", x: 290, y: 250, width: 10, height: 10, collected: false},

	{name: "cookies", x: 310, y: 250, width: 10, height: 10, collected: false},

	{name: "milk", x: 330, y: 250, width: 10, height: 10, collected: false}
];
let enemies = [
	{name: "enemy", ogX: 0, ogY: 0, x: 0, y: 0, width: 8, height: 26, speed: 0.5, baseSpeed: 0.5}, // spawns top left

	{name: "enemy", ogX: canvas.width, ogY: 0, x: canvas.width, y: 0, width: 8, height: 26, speed: 0.5, baseSpeed: 0.5}, // spawns top right

	{name: "enemy", ogX: 0, ogY: canvas.height, x: 0, y: canvas.height, width: 8, height: 26, speed: 0.5, baseSpeed: 0.5}, // spawns bottom left

	{name: "enemy", ogX: canvas.width, ogY: canvas.height, x: canvas.width, y: canvas.height, width: 8, height: 26, speed: 0.5, baseSpeed: 0.5} // spawns bottom right
];
let jumpScare = {
	active: false,
	alpha: 0, // transparency (0-1)
	duration: 30 // how long the scare lasts in frames (~0.5 sec at 60fps)
};
let currentScene = SCENES.MENU;
let startButton = {
	x: canvas.width / 2 - 100,
	y: 200,
	width: 200,
	height: 60,
	text: "START"
};
let pulse = {
	active: false, 
	radiusNorm: 30, 
	duration: 120,
	pulseActive: 200,
	cooldown: 600,
	able: true,
	onCooldown: false
};
let controlsButton = {
	x: canvas.width / 2 - 100,
	y: 300,
	width: 200,
	height: 60,
	text: "CONTROLS"
};
let menuButton = {
	x: canvas.width / 2 - 100,
	y: canvas.height - 100,
	width: 200,
	height: 60,
	text: "Menu"
};
let assetsLoaded = 0;
const totalAssets = Object.keys(ASSETS).length;
let currentMusic = null;
let userInteracted = false;
let map = {
	name: "map",
	x: 0,
	y: 0,
	width: 384 * 2, // Image size doubled
	height: 384 * 2
};
let borders = [
	{name: "top", x: 0, y: 0, width: map.width, height: 25},

	{name: "left", x: 0, y: 0, width: 25, height: map.height},

	{name: "right", x: map.width - 25, y: 0, width: 25, height: map.height},

	{name: "bottom", x: 0, y: map.height - 25, width: map.width, height: 25}
];
let bellHUD = {
	x: 20,
	y: 123,
	width: 15,
	height: 24
};
let healthHUD = {
	x: 20,
	y: 70,
	width: 11,
	height: 11
};
let returnMenuButton = {
	x: 20,
	y: 20,
	width: 100,
	height: 30,
	text: "Menu"
};
let winMenuButton = {
	x: canvas.width / 2 - 100,
	y: 330,
	width: 200,
	height: 60,
	text: "Menu"
};

let winReplayButton = {
	x: canvas.width / 2 - 100,
	y: 200,
	width: 200,
	height: 60,
	text: "Replay"
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
let screenShake = {
	active: false,
	timer: 0,
	magnitude: 6,
	offsetX: 0,
	offsetY: 0
};
let cameraZoom = 2;
let camX = canvas.width / 2 - player.x * cameraZoom;
let camY = canvas.height / 2 - player.y * cameraZoom;
let houses = [
	{name: "house", x: 310, y: 650, width: 56, height: 54},

	{name: "house", x: 355, y: 155, width: 56, height: 54},

	{name: "house", x: 655, y: 95, width: 56, height: 54},

	{name: "house", x: 105, y: 380, width: 56, height: 54},

	{name: "house", x: 615, y: 400, width: 56, height: 54},

	{name: "house", x: 635, y: 675, width: 56, height: 54},

	{name: "house", x: 90, y: 100, width: 56, height: 54}
];
let trees = [
	{name: "tree", x: 75, y: 240, width: 42, height: 78},

	{name: "tree", x: 125, y: 655, width: 42, height: 78},

	{name: "tree", x: 435, y: 575, width: 42, height: 78},

	{name: "tree", x: 570, y: 75, width: 42, height: 78},

	{name: "tree", x: 640, y: 550, width: 42, height: 78},

	{name: "tree", x: 550, y: 440, width: 42, height: 78},

	{name: "tree", x: 260, y: 50, width: 42, height: 78}
];
let bgImg = {
	x: 0,
	y: 0,
	width: 738,
	height: 738
};

// Input listeners (ONCE)
window.addEventListener('keydown', (e) => {
	pressedKeys.add(e.key);
});

window.addEventListener('keyup', (e) => {
	pressedKeys.delete(e.key);
});
canvas.addEventListener("click", (e) => {
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
		if (isPointInRect(mouseX, mouseY, returnMenuButton)) {
			currentScene = SCENES.MENU;
		}
	}
	if (currentScene === SCENES.WIN) {
		if (isPointInRect(mouseX, mouseY, winReplayButton)) {
			reset();
			currentScene = SCENES.GAME;
		}
	}
	if (currentScene === SCENES.WIN) {
		if (isPointInRect(mouseX, mouseY, winMenuButton)) {
			currentScene = SCENES.MENU;
		}
	}
	if (currentScene === SCENES.LOSE) {
		if (isPointInRect(mouseX, mouseY, loseMenuButton)) {
			currentScene = SCENES.MENU;
		}
	}
	if (currentScene === SCENES.LOSE) {
		if (isPointInRect(mouseX, mouseY, loseReplayButton)) {
			reset();
			currentScene = SCENES.GAME;
		}
	}
});
// Listen for first user interaction
window.addEventListener("click", () => { userInteracted = true; }, { once: true });
window.addEventListener("keydown", () => { userInteracted = true; }, { once: true });

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
	if (pressedKeys.has(' ') && !pulse.active && pulse.able) {
		//console.log("Pulse!");
		pulse.active = true;
		pulse.able = false
		pulse.radiusNorm = pulse.pulseActive;
		pulse.timer = pulse.duration;
		playSound(bell);
	}

	// Detection
	if (rectsOverlap(player, block)) {
		player.x = oldX;
		player.y = oldY;
	}
	for (let item of collectibles) {
		if (!item.collected && rectsOverlap(player, item)) {
			playSound(pickup);
			item.collected = true;
			player.items = player.items + 1;
			
			for (let enemy of enemies) {
				enemy.speed = enemy.baseSpeed + (player.items * 0.03);
			}
			
			console.log(`Collected: ${item.name}`);
			win();
		}
	}
	for (let enemy of enemies) {
		if (rectsOverlap(player, enemy)) {
			enemy.x = enemy.ogX;
			enemy.y = enemy.ogY;
			player.health -= 1;
			jumpScare.active = true;
			jumpScare.alpha = 1;
			jumpScare.timer = jumpScare.duration;
			screenShake.active = true;
			screenShake.timer = 35;
			playSound(jumpScareSFX);
		}
	}
	for (let border of borders) {
		if (rectsOverlap(player, border)) {
			player.x = oldX;
			player.y = oldY;
		}
	}
	for (let house of houses) {
		if (rectsOverlap(player, house)) {
			player.x = oldX;
			player.y = oldY;
		}
	}
	for (let tree of trees) {
		if (rectsOverlap(player, tree)) {
			player.x = oldX;
			player.y = oldY;
		}
	}
}

function rectsOverlap(a, b) { // AABB collision detection (Axis-Aligned Bounding Box)
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

function updateEnemy(enemy) {
	let dx = player.x - enemy.x;
	let dy = player.y - enemy.y;

	let distance = Math.sqrt(dx * dx + dy * dy);

	// Prevent divide by zero
	if (distance === 0) return;

	dx /= distance;
	dy /= distance;

	enemy.x += dx * enemy.speed;
	enemy.y += dy * enemy.speed;
}

function updateJumpScare() {
	if (!jumpScare.active) return;

	jumpScare.timer--;

	// Fade out
	jumpScare.alpha = jumpScare.timer / jumpScare.duration;

	if (jumpScare.timer <= 0) {
		jumpScare.active = false;
		jumpScare.alpha = 0;
		loss()
	}
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

function drawMenu() {
	//ctx.fillStyle = "black";
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(
		images.bgImg,
		bgImg.x,
		bgImg.y,
		bgImg.width,
		bgImg.height
	);

	ctx.fillStyle = "white";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("Holly Jolly Hunt", canvas.width / 2, 120);

	drawButton(startButton);
	drawButton(controlsButton);
}

function drawGame() {
	// Save the current state (no translation)
	ctx.save();
	
	// Sets the camra properties
	//cameraZoom = 2;
	//camX = canvas.width / 2 - player.x * cameraZoom;
	//camY = canvas.height / 2 - player.y * cameraZoom;
	cameraZoom = 3;
	camX = canvas.width / 2 - player.x * cameraZoom + screenShake.offsetX;
	camY = canvas.height / 2 - player.y * cameraZoom + screenShake.offsetY;

	// Moves and scales the camera
	ctx.translate(camX, camY);
	ctx.scale(cameraZoom, cameraZoom);

	// Drawing the map
	ctx.drawImage(
		images.map,
		map.x,
		map.y,
		map.width,
		map.height
	);
	for (let house of houses) {
		ctx.drawImage(
			images[house.name],
			house.x,
			house.y,
			house.width,
			house.height
		)
	}
	for (let tree of trees) {
		ctx.drawImage(
			images[tree.name],
			tree.x,
			tree.y,
			tree.width,
			tree.height
		)
	}
	
		
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

	// Drawing collectibles
	ctx.fillStyle = "green";
	for (let item of collectibles) {
		if (!item.collected) {
			//ctx.fillRect(item.x, item.y, item.width, item.height);
			ctx.drawImage(
				images[item.name],
				item.x,
				item.y,
				item.width,
				item.height
			);
		}
	}

	// Random block for collision
	//ctx.fillStyle = "yellow";
	//ctx.fillRect(block.x, block.y, block.width, block.height);

	// Random text
	//ctx.fillStyle = "blue";
	//ctx.font = "20px Arial";
	//ctx.fillText(player.health, 50, 50);

	// Jumpscare
	if (jumpScare.active) {
		ctx.fillStyle = `rgba(255, 0, 0, ${jumpScare.alpha})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	// Drawing the enemies
	//ctx.fillStyle = "orange";
	//ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
	for (let enemy of enemies) {
		ctx.drawImage(
			images[enemy.name],
			enemy.x,
			enemy.y,
			enemy.width,
			enemy.height
		);
	}

	// Drawing the player
	//ctx.fillStyle = "red";
	//ctx.fillRect(player.x, player.y, player.width, player.height);
	ctx.drawImage(
		images.player,
		player.x,
		player.y,
		player.width,
		player.height
	);

	// Pulse activation
	drawLighting();

	// Restore the state so UI/HUD elements stay fixed to the screen
	ctx.restore();

	// Draws the HUD
	drawHUD();

	for (let enemy of enemies) {
		updateEnemy(enemy);
	}
	updateJumpScare();
	updateScreenShake();
	updateLighting();
	updateCooldown();
}

function drawLose() {
	//ctx.fillStyle = "black";
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(
		images.bgImg,
		bgImg.x,
		bgImg.y,
		bgImg.width,
		bgImg.height
	);

	ctx.fillStyle = "white";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("LOSER", canvas.width / 2, 120);

	drawButton(loseReplayButton);
	drawButton(loseMenuButton);
}

function loss() {
	if (player.health <= 0) {
		currentScene = SCENES.LOSE;
		playSound(loseSFX);
	}
}

function drawLighting() {
	// Create the lighting overlay
	ctx.beginPath();
	ctx.fillStyle = "rgba(0, 0, 0, 0.975)"; // Semi transparent black for darkness effect
	
	// Add the full-screen rectangle to the path
	ctx.rect(0, 0, canvas.width, canvas.height);
	
	// Add the circle around the player to the SAME path
	ctx.arc(
		player.x + player.width / 2,
		player.y + player.height / 2,
		pulse.radiusNorm,
		0,
		Math.PI * 2,
	);

	// Fill using the evenodd rule to cut out the overlap
	ctx.fill("evenodd");
}

function updateLighting() {
	if (!pulse.active) return;

	pulse.timer--;
	for (let enemy of enemies) {
		enemy.speed = 0;
	}

	if (pulse.timer <= 0) {
		for (let enemy of enemies) {
			enemy.speed = 0.5;
		}
		pulse.active = false;
		pulse.radiusNorm = 30;
		pulse.onCooldown = true;
		pulse.timerCooldown = pulse.cooldown;
		//console.log("Pulse finished");
		//console.log("Cooldown has began");
	}
}

function updateCooldown() {
	if (!pulse.onCooldown) return;

	pulse.timerCooldown--;

	if (pulse.timerCooldown <= 0) {
		pulse.able = true;
		pulse.onCooldown = false;
		//console.log("Cooldown ended");
	}
}

function drawWin() {
	//ctx.fillStyle = "black";
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(
		images.bgImg,
		bgImg.x,
		bgImg.y,
		bgImg.width,
		bgImg.height
	);

	ctx.fillStyle = "white";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("WINNER", canvas.width / 2, 120);

	drawButton(winReplayButton);
	drawButton(winMenuButton);
}

function win() {
	if (player.items === collectibles.length) {
		currentScene = SCENES.WIN;
		playSound(winMusic);
	}
}

function drawControls() {
	//ctx.fillStyle = "black";
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(
		images.bgImg,
		bgImg.x,
		bgImg.y,
		bgImg.width,
		bgImg.height
	);

	// Displays "Controls" text
	ctx.fillStyle = "white";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("Controls", canvas.width / 2, 120);

	// Displays the list of controls
	ctx.font = "25px Arial";
	ctx.fillText("WASD for movement", canvas.width / 2, 250);
	ctx.fillText("Space for bell pulse ability", canvas.width / 2, 290);
	ctx.fillText("Explore the map to find the collectibles", canvas.width / 2, 330);
	ctx.fillText("Beware of the evil elfs trying to stop you", canvas.width / 2, 370);

	drawButton(menuButton);
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

function drawHUD() {
	// Displays menu button
	drawButton(returnMenuButton);

	// Displays health
	ctx.drawImage(
		images.healthHUD,
		healthHUD.x,
		healthHUD.y,
		healthHUD.width * 3,
		healthHUD.height * 3
	);
	ctx.fillStyle = "blue";
	ctx.font = "25px Arial";
	ctx.fillText(`Health: ${player.health}`, 120, 89);

	// Displays pulse ability
	ctx.drawImage(
		images.bellHUD,
		bellHUD.x,
		bellHUD.y,
		bellHUD.width * 2,
		bellHUD.height * 2
	);
	// Cooldown timer
	if (!pulse.active && pulse.able) { //(!pulse.timerCooldown) {
		ctx.fillText("Pulse available", 154, 150);
	}
	else if (pulse.active === true && pulse.able === false) {
		ctx.fillText("Pulse in use", 137, 150);
	}
	else if (pulse.timerCooldown) {
		ctx.fillText(`Cooldown: ${Math.round(pulse.timerCooldown / 100)}`, 138, 150);
	}

	//ctx.fillText(player.x, 500, 500);
	//ctx.fillText(player.y, 550, 500);

	// Displays the amount of items left
	ctx.fillText(`Items left: ${collectibles.length - player.items}`, 85, 215);
}

function playSound(sound) {
	const s = sound.cloneNode();
	s.volume = sound.volume;
	s.play();
}

function updateMusic() {
    if (!userInteracted) return; // don't try to play until the user interacts

    if (currentScene === SCENES.MENU || currentScene === SCENES.CONTROLS) {
        if (currentMusic !== menuMusic) {
            if (currentMusic) currentMusic.pause();
            menuMusic.currentTime = 0;
            menuMusic.play().catch(e => {}); // safely catch the promise rejection
            currentMusic = menuMusic;
        }
    } else if (currentScene === SCENES.GAME) {
        if (currentMusic !== gameMusic) {
            if (currentMusic) currentMusic.pause();
            gameMusic.currentTime = 0;
            gameMusic.play().catch(e => {});
            currentMusic = gameMusic;
        }
    } else {
        if (currentMusic) {
            currentMusic.pause();
            currentMusic = null;
        }
    }
}

function reset() {
	player.x = player.spawnX;
	player.y = player.spawnY;
	player.items = 0;
	player.health = 5;

	shuffleArray(collectibleSpawns);

	collectibles.forEach((item, i) => {
		item.collected = false;
		item.x = collectibleSpawns[i].x;
		item.y = collectibleSpawns[i].y;
	});

	for (let enemy of enemies) {
		enemy.x = enemy.ogX;
		enemy.y = enemy.ogY;
		enemy.speed = enemy.baseSpeed;
	}
}


function updateScreenShake() {
	if (!screenShake.active) {
		screenShake.offsetX = 0;
		screenShake.offsetY = 0;
		return;
	}

	screenShake.timer--;

	screenShake.offsetX = (Math.random() * 2 - 1) * screenShake.magnitude;
	screenShake.offsetY = (Math.random() * 2 - 1) * screenShake.magnitude;

	if (screenShake.timer <= 0) {
		screenShake.active = false;
		screenShake.offsetX = 0;
		screenShake.offsetY = 0;
	}
}

function shuffleArray(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

function gameLoop() {
	// Clears canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	updateMusic();

	if (currentScene === SCENES.MENU) {
		drawMenu();
	}
	else if (currentScene === SCENES.GAME) {
		updateGame();
		drawGame();
	}
	else if (currentScene === SCENES.LOSE) {
		drawLose();
	}
	else if (currentScene === SCENES.WIN) {
		drawWin();
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