const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const resetButton = document.getElementById("reset-btn");

const columns = {
    "S": document.getElementById("col-s"),
    "D": document.getElementById("col-d"),
    "J": document.getElementById("col-j"),
    "K": document.getElementById("col-k")
};

const keys = Object.keys(columns); // ["S", "D", "J", "K"]
let elements = [];
let score = 0;
let gameSpeed = 3;
let gameRunning = true;

const hitLineY = gameContainer.clientHeight * 0.85; // Adjusted hit line position
const gameDuration = 30000; // Game duration in milliseconds (30 seconds)
let gameStartTime = null; // Start time of the game
let lastCreationTime = 0; // Time tracker for element creation

// Game Loop Control
let lastFrameTime = 0; // Track the last frame time to control frame rate

function startGameTimer(time) {
    if (!gameStartTime) {
        gameStartTime = time;
    }
    const elapsedTime = time - gameStartTime;
    const timeLeft = Math.max(0, gameDuration - elapsedTime); // Ensure time left is not negative

    // Update the timer display
    const secondsLeft = Math.floor(timeLeft / 1000); // Convert to seconds
    timerDisplay.innerText = `Time Left: ${secondsLeft}s`;

    // End the game after the set duration
    if (elapsedTime >= gameDuration) {
        gameRunning = false;
        scoreDisplay.innerText = `Game Over! Final Score: ${score}`;
        return; // Exit early to stop the game
    }

    requestAnimationFrame(startGameTimer); // Keep running the timer
}

function createElement() {
    if (!gameRunning) return;

    // Random delay between element creations
    const randomDelay = Math.random() * 1000 + 500; // Between 500ms and 1500ms
    setTimeout(() => {
        let key = keys[Math.floor(Math.random() * 4)]; // Randomly pick a column key
        let column = columns[key];

        // Check if a new element can be created without overlapping
        if (canSpawnElement(column)) {
            let element = document.createElement("div");
            element.classList.add("game-element");
            element.dataset.key = key;
            element.style.top = "0px";
            column.appendChild(element);

            elements.push({ el: element, y: 0, key, hitTime: null });
        }

        // Create the next element after a random delay
        createElement();
    }, randomDelay);
}

function canSpawnElement(column) {
    const columnElements = elements.filter(item => item.el.parentElement === column);
    const minDistance = 100; // Minimum distance between elements

    // Check if any existing element is too close to the top
    for (let element of columnElements) {
        if (element.y < minDistance) {
            return false; // There is already an element too close to the top
        }
    }

    return true;
}

function updateElements(time) {
    if (!gameRunning) return;

    // Control update rate based on time
    if (time - lastFrameTime >= 1000 / 60) { // Target 60 FPS
        lastFrameTime = time;

        elements.forEach((item, index) => {
            item.y += gameSpeed;
            item.el.style.transform = `translateY(${item.y}px)`;

            // Remove if missed
            if (item.y > hitLineY + 50) {
                item.el.style.backgroundColor = "red"; // Missed
                if (!item.hitTime) {
                    score -= 5; // Penalize for missing
                }
                setTimeout(() => item.el.remove(), 500);
                elements.splice(index, 1);
            }
        });
    }

    requestAnimationFrame(updateElements); // Recursive call to update elements
}

function handleKeyPress(event) {
    let key = event.key.toUpperCase();
    if (!keys.includes(key)) return; // Ignore unassigned keys

    // Find the closest rectangle in the correct column
    let closestElement = elements
        .filter(item => item.key === key)
        .reduce((closest, item) => {
            let distance = Math.abs(item.y - hitLineY);
            return distance < Math.abs(closest.y - hitLineY) ? item : closest;
        }, { y: Infinity });

    if (closestElement.y === Infinity) return; // No element found

    let elementBottom = closestElement.y + 80; // Bottom of rectangle
    let elementTop = closestElement.y; // Top of rectangle

    // If any part of the rectangle overlaps with the hit line, it's valid
    if (elementTop <= hitLineY && elementBottom >= hitLineY) {
        closestElement.el.style.backgroundColor = "green";
        playSound();
        score += 10;
        scoreDisplay.innerText = `Score: ${score}`;
        setTimeout(() => closestElement.el.remove(), 200);
        elements = elements.filter(item => item !== closestElement);
    }
}

function playSound() {
    let audio = new Audio("valid.mp3");
    audio.play();
}

function resetGame() {
    // Reset variables
    score = 0;
    elements = [];
    gameRunning = true;
    gameStartTime = null;
    lastCreationTime = 0;
    lastFrameTime = 0; // Reset frame time tracker
    gameSpeed = 3;  // Ensure gameSpeed is reset to its initial value

    // Clear the score and timer
    scoreDisplay.innerText = `Score: ${score}`;
    timerDisplay.innerText = `Time Left: 30s`;

    // Clear all game elements from the columns
    Object.values(columns).forEach(column => {
        column.innerHTML = ''; // Remove all children (game elements)
    });

    // Start the game loop again
    requestAnimationFrame(startGameTimer);
    createElement(); // Start creating elements
    requestAnimationFrame(updateElements);
}

document.addEventListener("keydown", handleKeyPress);
resetButton.addEventListener("click", resetGame); // Add event listener for the reset button

// Start the game loop initially
requestAnimationFrame(startGameTimer);
createElement(); // Start the creation of elements
requestAnimationFrame(updateElements);
