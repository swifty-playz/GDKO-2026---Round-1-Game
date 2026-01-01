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
let pressedKeys = new Set();
let userInteracted = false;
let borders = [
	{name: "top", x: 0, y: 0, width: canvas.width, height: 25},

	{name: "left", x: 0, y: 0, width: 25, height: canvas.height},

	{name: "right", x: canvas.width - 25, y: 0, width: 25, height: canvas.height},

	{name: "bottom", x: 0, y: canvas.height - 25, width: canvas.width, height: 25}
];
let currentScene = SCENES.GAME;

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
}

function gameLoop() {
	// Clears canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (currentScene === SCENES.GAME) {
		drawGame();
	}

	requestAnimationFrame(gameLoop);
}

gameLoop();