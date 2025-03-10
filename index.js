const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const resetButton = document.getElementById("reset-btn");

//Object contenant les élements HTML columns
const columns = {
    "S": document.getElementById("col-s"),
    "D": document.getElementById("col-d"),
    "J": document.getElementById("col-j"),
    "K": document.getElementById("col-k")
};

//Stock les touches de base
const keys = Object.keys(columns);
//Stock les élements du jeu sur l'écran actuellement
let elements = [];
let score = 0;
let gameSpeed = 3;
let gameRunning = true;

const hitLineY = gameContainer.clientHeight * 0.85;
const gameDuration = 30000;
let gameStartTime = null;
let lastCreationTime = 0;

//Control des FPS
let lastFrameTime = 0;

//associe son aux touches S D J K
const sounds = {
    "S": new Audio("sound-s.mp3"),
    "D": new Audio("sound-d.mp3"),
    "J": new Audio("sound-j.mp3"),
    "K": new Audio("sound-k.mp3")
};

//Hauteur aléatoire des rectangles
function getRandomHeight() {
    return Math.floor(Math.random() * 60) + 10;
}

// commence et update le timer du jeu
// Finis le jeu quand 30s sont passé
function startGameTimer(time) {
    if (!gameStartTime) {
        gameStartTime = time;
    }
    const elapsedTime = time - gameStartTime;
    const timeLeft = Math.max(0, gameDuration - elapsedTime);

    const secondsLeft = Math.floor(timeLeft / 1000);
    timerDisplay.innerText = `Time Left: ${secondsLeft}s`;

    if (elapsedTime >= gameDuration) {
        gameRunning = false;
        scoreDisplay.innerText = `Game Over! Final Score: ${score}`;
        return;
    }

    requestAnimationFrame(startGameTimer);
}

//crée de nouveau élements à une intervalle random
//prends une touche et vérifie si il peut spawn là
//Si oui nouveau div créé dans la colone 
//Y initial à 0
//Hauteur aléatoire
function createElement() {
    if (!gameRunning) return;

    const randomDelay = Math.random() * 1000 + 500;
    setTimeout(() => {
        let key = keys[Math.floor(Math.random() * 4)];
        let column = columns[key];

        if (canSpawnElement(column)) {
            let element = document.createElement("div");
            element.classList.add("game-element");
            element.dataset.key = key;
            element.style.top = "0px";
            let height = getRandomHeight();
            element.style.height = `${height}px`;

            column.appendChild(element);
            elements.push({ el: element, y: 0, key, hitTime: null, height });
        }

        createElement();
    }, randomDelay);
}

// vérifie si il y a assez d'espace pour spawn un autre rectangle
function canSpawnElement(column) {
    const columnElements = elements.filter(item => item.el.parentElement === column);
    const minDistance = 100;

    for (let element of columnElements) {
        if (element.y < minDistance) {
            return false;
        }
    }

    return true;
}

//update la position de chaque élement
//les fait descendre avec gamespeed comme pixel par frame
//si élément après la ligne il devient rouge, -5 score ppuis disparait après .5s
function updateElements(time) {
    if (!gameRunning) return;

    if (time - lastFrameTime >= 1000 / 60) {
        lastFrameTime = time;

        elements.forEach((item, index) => {
            item.y += gameSpeed;
            item.el.style.transform = `translateY(${item.y}px)`;

            if (item.y > hitLineY + item.height) {
                item.el.style.background = "red";
                if (!item.hitTime) {
                    score -= 5;
                    scoreDisplay.innerText = `Score: ${score}`;
                }
                setTimeout(() => item.el.remove(), 500);
                elements.splice(index, 1);
            }
        });
    }

    requestAnimationFrame(updateElements);
}

// Gère les touches du clavier
// Si quand t'appuies y'a un élement sur la ligne alors il devient vert, joue un son, et + score, sinon -5
function handleKeyPress(event) {
    let key = event.key.toUpperCase();
    if (!keys.includes(key) || !gameRunning) return;

    const columnElements = elements.filter(item => item.key === key);
    
    if (columnElements.length === 0) {
        score -= 5;
        scoreDisplay.innerText = `Score: ${score}`;
        return;
    }

    let closestElement = columnElements.reduce((closest, item) => {
        let distance = Math.abs(item.y - hitLineY);
        return distance < Math.abs(closest.y - hitLineY) ? item : closest;
    }, { y: Infinity });

    if (closestElement.y === Infinity) return;

    let elementBottom = closestElement.y + closestElement.height;
    let elementTop = closestElement.y;
    let center = elementTop + (closestElement.height / 2);
    let distanceFromCenter = Math.abs(center - hitLineY);
    let maxDistance = closestElement.height / 2;
    let accuracy = Math.max(0, 1 - (distanceFromCenter / maxDistance));

    if (elementTop <= hitLineY && elementBottom >= hitLineY) {
        closestElement.el.style.background = "green";
        playSound(key);
        let points = Math.round(10 + accuracy * 10);
        score += points;
        scoreDisplay.innerText = `Score: ${score}`;
        setTimeout(() => closestElement.el.remove(), 200);
        elements = elements.filter(item => item !== closestElement);
    } else {
        score -= 5;
        scoreDisplay.innerText = `Score: ${score}`;
    }
}

// joue le son voulu quand chaque touche est pressée
function playSound(key) {
    if (sounds[key]) {
        sounds[key].currentTime = 0;
        sounds[key].play();
    }
}

//Réinitialise le jeu
// Clear tout
function resetGame() {
    score = 0;
    elements = [];
    gameRunning = true;
    gameStartTime = null;
    lastCreationTime = 0;
    lastFrameTime = 0;
    gameSpeed = 3;

    scoreDisplay.innerText = `Score: ${score}`;
    timerDisplay.innerText = `Time Left: 30s`;

    const allTimeouts = window.setTimeout(() => { }, 0);
    for (let i = 0; i < allTimeouts; i++) {
        window.clearTimeout(i);
    }

    Object.values(columns).forEach(column => {
        column.innerHTML = '';
    });

    requestAnimationFrame(startGameTimer);
    createElement();
    requestAnimationFrame(updateElements);
}

document.addEventListener("keydown", handleKeyPress);
resetButton.addEventListener("click", resetGame);

requestAnimationFrame(startGameTimer);
createElement();
requestAnimationFrame(updateElements);
