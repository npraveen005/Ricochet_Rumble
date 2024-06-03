const gameBoard = document.querySelector("#gameBoard");
const playersTurn = document.getElementById("playersTurn");
const ricochetButton = document.querySelector("#ricochet-turn");
const redTime = document.getElementById("red-timer");
const blueTime = document.getElementById("blue-timer");
const restartButton = document.getElementById("restart");
const pauseButton = document.getElementById("pause");
const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const bulletSound = document.createElement("audio");
const clockTick = document.createElement("audio");
const winMusic = document.createElement("audio");
const swapButton = document.getElementById("swap");
const playerHistory = document.getElementById("playerHistory");
const movesButton = document.getElementById("movesButton");
const settingsButton = document.getElementById("settings");
const settingsContainer = document.getElementById("settingsContainer");
const settingsCloseButton = document.querySelector("#settingsContainer #closeButton");
const randomizeCheckBox = document.getElementById("randomizeCheckBox");
const volume = document.getElementById("volume");
const horizontalRadio = document.getElementById("horizontalRadio");
const verticalRadio = document.getElementById("verticalRadio");

const MINUTES = 2, SECONDS = 0;
let moveCount  = 0, redSeconds = SECONDS, blueSeconds = SECONDS, redMinutes = MINUTES, blueMinutes = MINUTES, redTimeoutId, blueTimeoutId;
let redTankCount = 0, blueTankCount = 0, redRicochetCount = 0, blueRicochetCount = 0, redSemiRicochetCount = 0, blueSemiRicochetCount = 0, notPlayable = 0;
var currentPiece, currentPlayer = "blue", bulletDirection = "v-", isGameOver = false, isPaused = false, isSwapChecked = false, cantUndo = false, checking = false, currentPlayerWon = false, opponentSemiRicochetDestroyed = false;
var bulletPath = [],bulletAngle = [], moveHistory = [], a = 0, nthGame, redSwapCount, blueSwapCount, botColour = null;
const BULLET_SPEED = 100, MAX_SWAP_COUNT = 2;
const MAX_RICOCHET_COUNT = 1, MAX_SEMI_RICOCHET_COUNT = 1, MAX_TANK_COUNT = 2, {MAX_TITAN_COUNT, MAX_CANNON_COUNT} = 1, MAX_SPELL_COUNT = 1;
const pauseIcon = `<i class="fa-solid fa-pause"></i>`, playIcon = `<i class="fa-solid fa-play"></i>`;
const blueTankVertical = "./media/blue_tank_vertical.jpg", blueTankHorizontal = "./media/blue_tank_horizontal.jpg",
      redTankVertical = "./media/red_tank_vertical.jpg", redTankHorizontal = "./media/red_tank_horizontal.jpg";

redSwapCount = MAX_SWAP_COUNT, blueSwapCount = MAX_SWAP_COUNT;

bulletSound.src = "./media/bullet_sound.mp3";
clockTick.src = "./media/clock_tick.mp3";
winMusic.src = "./media/win_music.wav";

/* ---------------------------------------For readability------------------------------------------
h+ means the bullet is moving in positive direction horizontally (i.e from left to right)
h- means the bullet is moving in negative direction horizontally (i.e from right to left)
v+ means the bullet is moving in positive direction vertically (i.e from bottom to top)
v- means the bullet is moving in negative direction vertically (i.e from top to bottom)

initially the bullet moves from top to bottom(v-) as it would have been shot from blue cannon which is on top
*/


//starting pieces
let startPieces = [
    '', blueCannon, '', '', '', '', '', '',
    '', blueRicochet, '', "", blueSemiRicochet, '', '', '',
    blueTank, '', '', '', blueTitan, '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    redTitan, '', redSemiRicochet, '', redTank, '', redRicochet, '',
    '', redTank, '', '', redSemiRicochet, '', '', '',
    '', redCannon, '', '', '', '', '', ''
];

//piece positions stored as an object
const piecePosition = {
    blue: {
        tank: [16],
        titan: [29],
        cannon: [1],
        ricochet: [18],
        semiRicochet: [12]
    },

    red: {
        tank: [35],
        titan: [40],
        cannon: [57],
        ricochet: [49],
        semiRicochet: [43]
    }
}

randomizeAndInitializeBoard();

var allSquares = document.querySelectorAll("#gameBoard .square");  // getting allSquares from the board

restartButton.onclick = () => {
    currentPlayer = "blue";
    if(onReplay){
        try{
            replayButton.removeChild(blinkDiv);
            replayButton.appendChild(replayIcon);
        }
        catch{}
        onReplay = false;
    }

    if(randomizeCheckBox.checked){
        do{
            notPlayable = 0;
            randomizeBoard();
            initializeBoard();
            checking = true;
            currentPlayer = "red";
            shoot();
            currentPlayer = "blue";
            shoot();
        }while(notPlayable)
        checking = false;
        notPlayable = 0;
    }
    else {
        initializeBoard();
    }
}

pauseButton.onclick = () => {
    clearTimeout(blueTimeoutId);
    clearTimeout(redTimeoutId);
    if(pauseButton.getAttribute("state") === "pause"){
        allSquares.forEach(square => {
            square.removeEventListener("click", showPossibleMoves);
            square.removeEventListener("click", movePiece);
            if(square.firstChild)square.firstChild.removeEventListener("click", swapRicochet);
            isSwapChecked = false;
            swapButton.classList.remove("enabled");
            ricochetButton.style.visibility = "hidden";

            square.classList.remove("green");
        })
        if(onReplay){
            replayButton.removeChild(blinkDiv);
            replayButton.appendChild(replayIcon);
        }
        isPaused = true;
        clockTick.pause();
        pauseButton.innerHTML = playIcon;
        pauseButton.setAttribute("state", "play");
        
    }
    else{
        if(!onReplay){
            if(currentPlayer === "blue") blueTimer();
            else redTimer();
        }
        else{
            if(currentPlayer === "blue") blueReplayTimer();
            else redReplayTimer();
            replayButton.removeChild(replayButton.firstChild);
            replayButton.appendChild(blinkDiv);
        }
        addSquareEventListener();
        isPaused = false;
        pauseButton.innerHTML = pauseIcon;
        pauseButton.setAttribute("state", "pause");
    }

}

undoButton.onclick = () => {
    if(!undoButton.className.includes("disabled")){
        undo(1);
        if(!cantUndo) {
            undoButton.classList.add("disabled");
            redoButton.classList.remove("disabled");
        }
    }
}

redoButton.onclick = () => {
    if(!redoButton.className.includes("disabled")){
        undo(1);
        if(!cantUndo){
            redoButton.classList.add("disabled");
            undoButton.classList.remove("disabled");
        }
    }
}

swapButton.onclick = () => {
    if(swapButton.className.includes("disabled")) return;
    
    if(isSwapChecked) {
        swapButton.classList.remove("enabled");
        isSwapChecked = false;
        allSquares.forEach( square =>{
            if(square.firstChild && square.firstChild.id !== "titan" && square.firstChild !== currentPiece){
                square.firstChild.removeEventListener("click", swapRicochet);
            }
        } )
        return;
    }

    allSquares.forEach( square =>{
        if(square.firstChild && square.firstChild.id !== "titan" && square.firstChild !== currentPiece){
            swapButton.classList.add("enabled");
            square.firstChild.addEventListener("click", swapRicochet);
        }
    } )
    isSwapChecked = true;
    
}

movesButton.onclick = () => {
    if(playerHistory.style.height == "0px") {
        playerHistory.style.height = "100%";
    }
    else playerHistory.style.height = "0px";
}

settingsButton.onclick = () => {
    settingsContainer.style.visibility = "visible";
    darkDiv.style.visibility = "visible";
}

settingsCloseButton.onclick = () => {
    settingsContainer.style.visibility = "collapse";
    darkDiv.style.visibility = "collapse";
}

//makes random board configurations which are playable
function randomizeAndInitializeBoard(mode='multiplayer', bot){
    
    if(mode==='single'){
        botColour = bot;
        chooseBot.style.visibility = 'collapse';
        settingsContainer.style.visibility = 'collapse';
        darkDiv.style.visibility = 'collapse';
    }
    
    if(randomizeCheckBox.checked){
        do{
            notPlayable = 0;
            randomizeBoard();
            initializeBoard();
            checking = true;
            currentPlayer = "red";
            shoot();
            currentPlayer = "blue";
            shoot();
        }while(notPlayable)
        checking = false;
        notPlayable = 0;
    }
    else {
        initializeBoard();
    }
}

function initializeBoard(){
    while(gameBoard.firstChild) gameBoard.removeChild(gameBoard.firstChild);

    moveHistory = [];
    nthGame = localStorage.length;
    isGameOver = false;

    redTankCount = 0, blueTankCount = 0, redRicochetCount = 0, blueRicochetCount = 0, redSemiRicochetCount = 0, blueSemiRicochetCount = 0, moveCount = 0;
    redSwapCount = MAX_SWAP_COUNT, blueSwapCount = MAX_SWAP_COUNT, isSwapChecked = false, currentPlayerWon = false, opponentSemiRicochetDestroyed = false;
    redSpellCount = MAX_SPELL_COUNT, blueSpellCount = MAX_SPELL_COUNT;

    redSeconds = SECONDS, blueSeconds = SECONDS, redMinutes = MINUTES, blueMinutes = MINUTES;

    winMusic.volume = (volume.value / 100), clockTick.volume = (volume.value / 100), bulletSound.volume = (volume.value / 100);

    //creating places for the pieces
    startPieces.forEach((startPiece, i) => {
        const square = document.createElement("div");
        square.classList.add("square");
        square.innerHTML = startPiece;
        square.setAttribute("square-id", i);
        square.setAttribute("row", Math.floor(i/8) + 1);
        square.setAttribute("column", i%8 + 1);
        if(square.firstChild){
            switch (square.firstChild.id) {
                case "titan":
                    square.firstChild.setAttribute("piece-index", 0);
                    break;
                case "cannon":
                    square.firstChild.setAttribute("piece-index", 0);
                    break;
                case "ricochet":
                    if(square.firstChild.className.includes("blue")) square.firstChild.setAttribute("piece-index", blueRicochetCount++);
                    else if(square.firstChild.className.includes("red")) square.firstChild.setAttribute("piece-index", redRicochetCount++);
                    break;
                case "semiRicochet":
                    if(square.firstChild.className.includes("blue")) square.firstChild.setAttribute("piece-index", blueSemiRicochetCount++);
                    else if(square.firstChild.className.includes("red")) square.firstChild.setAttribute("piece-index", redSemiRicochetCount++);
                    break;
                case "tank":
                    if(square.firstChild.className.includes("blue")){
                        square.firstChild.setAttribute("piece-index", blueTankCount++);
                        square.firstChild.setAttribute("passable-side", "vertical");
                        square.firstChild.style.backgroundImage = `url(${blueTankVertical})`;
                        if(horizontalRadio.checked){
                            square.firstChild.setAttribute("passable-side", "horizontal");
                            square.firstChild.style.backgroundImage = `url(${blueTankHorizontal})`;
                        }
                        else if(verticalRadio.checked){
                            square.firstChild.setAttribute("passable-side", "vertical");
                            square.firstChild.style.backgroundImage = `url(${blueTankVertical})`;
                        }
                    }
                    else if(square.firstChild.className.includes("red")){
                        square.firstChild.setAttribute("piece-index", redTankCount++);
                        if(horizontalRadio.checked){
                            square.firstChild.setAttribute("passable-side", "horizontal");
                            square.firstChild.style.backgroundImage = `url(${redTankHorizontal})`;
                        }
                        else if(verticalRadio.checked){
                            square.firstChild.setAttribute("passable-side", "vertical");
                            square.firstChild.style.backgroundImage = `url(${redTankVertical})`;
                        }
                    }
                    break;
            }
        }
        gameBoard.append(square);
    });

    moveHistory.push(startPieces);

    allSquares = document.querySelectorAll("#gameBoard .square");  // getting allSquares from the board

    //assinging row and column to the places
    allSquares.forEach(square => {
        if(square.firstChild){
            square.firstChild.setAttribute("row", square.getAttribute("row"));
            square.firstChild.setAttribute("column", square.getAttribute("column"));
            piecePosition[square.firstChild.className.slice(0, square.firstChild.className.indexOf(" "))][square.firstChild.id][Number(square.firstChild.getAttribute("piece-index"))] = Number(square.getAttribute("square-id"));
        }
    })
    
    redSeconds = redSeconds.toString().padStart(2, 0);
    redMinutes = redMinutes.toString().padStart(2, 0);
    redTime.textContent = `Red Timer: ${redMinutes}:${redSeconds}`;
    redSeconds = Number(redSeconds);
    redMinutes = Number(redMinutes);

    blueSeconds = blueSeconds.toString().padStart(2, 0);
    blueMinutes = blueMinutes.toString().padStart(2, 0);
    blueTime.textContent = `Blue Timer: ${blueMinutes}:${blueSeconds}`;
    blueSeconds = Number(blueSeconds);
    blueMinutes = Number(blueMinutes);

    undoButton.classList.add("disabled");
    redoButton.classList.add("disabled");
    ricochetButton.style.visibility = "hidden";

    clearInterval(redTimeoutId);
    clearInterval(blueTimeoutId);

    if(!isPaused && botColour !== 'blue') {
        blueTimeoutId = setTimeout(blueTimer, 1000);
        addSquareEventListener();
    }
    else if(botColour === 'blue'){
        blueTimer();
        playMove(botColour);
        shoot();

        currentPlayer = botColour === 'blue'? 'red':'blue';
        setTimeout(addSquareEventListener, (bulletPath.length+1)*BULLET_SPEED);
        clearTimeout(blueTimeoutId);
        redTimer();
    }

    gameBoard.style.backgroundColor = "rgb(66, 66, 220)";
    gameBoard.style.boxShadow = "0px 0px 10px rgb(66, 66, 220, 0.85)";
    playersTurn.style.textShadow = "0px 0px 10px rgba(0, 0, 255, 0.5)";
    playersTurn.innerHTML = `${currentPlayer}'s turn`.toUpperCase(); //displaying who's turn
    playersTurn.style.color = `${currentPlayer}`;
    
    clockTick.pause();
}

function randomizeBoard(){
    startPieces = [
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', ''
    ];
    let availableIndexes = [], temp;
    for(i=0; i<64; i++) availableIndexes.push(i);

    temp = Math.floor(Math.random() * 7) + 0;
    availableIndexes[temp] = -1;
    startPieces[temp] = blueCannon;

    temp = Math.floor(Math.random() * 7) + 56;
    availableIndexes[temp] = -1;
    startPieces[temp] = redCannon;

    for(i=0; i<MAX_RICOCHET_COUNT; i++){
        do{
            temp = Math.floor(Math.random() * 15) + 0;
        }while(!availableIndexes.includes(temp))
        availableIndexes[temp] = -1;
        startPieces[temp] = blueRicochet;
    }

    for(i=0; i<MAX_RICOCHET_COUNT; i++){
        do{
            temp = Math.floor(Math.random() * 15) + 48;
        }while(!availableIndexes.includes(temp))
        availableIndexes[temp] = -1;
        startPieces[temp] = redRicochet;
    }

    for(i=0; i<MAX_SEMI_RICOCHET_COUNT; i++){
        do{
            temp = Math.floor(Math.random() * 15) + 0;
        }while(!availableIndexes.includes(temp))
        availableIndexes[temp] = -1;
        startPieces[temp] = blueSemiRicochet;
    }

    for(i=0; i<MAX_SEMI_RICOCHET_COUNT; i++){
        do{
            temp = Math.floor(Math.random() * 15) + 48;
        }while(!availableIndexes.includes(temp))
        availableIndexes[temp] = -1;
        startPieces[temp] = redSemiRicochet;
    }

    for(i=0; i<MAX_TANK_COUNT; i++){
        do{
            temp = Math.floor(Math.random() * 15) + 0;
        }while(!availableIndexes.includes(temp))
        availableIndexes[temp] = -1;
        startPieces[temp] = blueTank;
    }

    for(i=0; i<MAX_TANK_COUNT; i++){
        do{
            temp = Math.floor(Math.random() * 15) + 48;
        }while(!availableIndexes.includes(temp))
        availableIndexes[temp] = -1;
        startPieces[temp] = redTank;
    }

    do{
        temp = Math.floor(Math.random() * 15) + 0;
    }while(!availableIndexes.includes(temp))
    availableIndexes[temp] = -1;
    startPieces[temp] = blueTitan;

    do{
        temp = Math.floor(Math.random() * 15) + 48;
    }while(!availableIndexes.includes(temp))
    availableIndexes[temp] = -1;
    startPieces[temp] = redTitan;

}

//adding event listener for the squares
function addSquareEventListener(){
    playersTurn.innerHTML = `${currentPlayer}'s turn`.toUpperCase(); //displaying who's turn
    playersTurn.style.color = `${currentPlayer}`;

    if(moveCount){
        undoButton.classList.remove("disabled");
        redoButton.classList.add("disabled");
    }

    if(currentPlayer === "blue"){
        gameBoard.style.backgroundColor = "rgb(66, 66, 220)";
        gameBoard.style.boxShadow = "0px 0px 10px rgb(66, 66, 220, 0.85)";
        playersTurn.style.textShadow = "0px 0px 10px rgba(0, 0, 255, 0.5)";
    }
    else{
        gameBoard.style.backgroundColor = "rgb(255, 73, 73)";
        gameBoard.style.boxShadow = "0px 0px 10px rgb(255, 73, 73, 0.85)";
        playersTurn.style.textShadow = "0px 0px 10px rgba(255, 0, 0, 0.5)";
    }

    allSquares.forEach( square => {
        if(square.firstChild) square.firstChild.setAttribute("pass-through", false);
    } )

    if(botColour !== currentPlayer){
        allSquares.forEach((square) => {
            square.firstChild? square.setAttribute("clickable", true) : square.setAttribute("clickable", false);
            square.removeEventListener("click", showPossibleMoves);
    
            if(square.getAttribute('clickable') === 'true' && square.firstChild.className.includes(currentPlayer)){
                square.addEventListener("click", showPossibleMoves);
            }
        });
    }
    else{
        clearTimeout(blueTimeoutId);
        playMove(botColour);
        
        shoot();
        currentPlayer = botColour === 'blue'? 'red':'blue';
        setTimeout(addSquareEventListener, (bulletPath.length+1)*BULLET_SPEED);
        clearTimeout(redTimeoutId);
        blueTimer();
    }

    playerHistory.innerText = displayHistory();
    
}

// function for displaying the possible moves
function showPossibleMoves(e){
    currentPiece = e.target;
    swapButton.classList.remove("enabled");
    isSwapChecked = false;

    // removing every movePiece eventListener from the boxes
    allSquares.forEach(square => {
        square.classList.remove("green");
        square.removeEventListener("click", movePiece);
        if(square.firstChild) square.firstChild.removeEventListener("click", swapRicochet);
        if(square.firstChild) square.firstChild.classList.remove("selected");
    });
    const row = Number(currentPiece.getAttribute("row"));
    const column = Number(currentPiece.getAttribute("column"));
    
    //storing the possibles boxes a piece can be in an array
    if(currentPiece.id !== "cannon"){
        var possibleSquares = [ [row, column+1], [row, column-1], [row+1, column-1], [row+1, column], [row+1, column+1], [row-1, column-1], [row-1, column], [row-1, column+1] ];
        if(currentPiece.id === "ricochet") {
            ricochetButton.style.visibility = "visible";
            swapButton.style.visibility = "visible";

            if(currentPlayer === "blue"){
                if(!blueSwapCount) swapButton.classList.add("disabled");
                else swapButton.classList.remove("disabled");
            }
            else{
                if(!redSwapCount) swapButton.classList.add("disabled");
                else swapButton.classList.remove("disabled");
            }
        }
        else if(currentPiece.id === "semiRicochet") {
            ricochetButton.style.visibility = "visible";
            swapButton.style.visibility = "visible";

            if(currentPlayer === "blue"){
                if(!blueSwapCount) swapButton.classList.add("disabled");
                else swapButton.classList.remove("disabled");
            }
            else{
                if(!redSwapCount) swapButton.classList.add("disabled");
                else swapButton.classList.remove("disabled");
            }

        }
        else {
            ricochetButton.style.visibility = "hidden";
            // swapButton.style.visibility = "hidden";
            swapButton.classList.add("disabled");
        }
        
    }
    else{ 
        var possibleSquares = [ [row, column+1], [row, column-1] ];
        ricochetButton.style.visibility = "hidden";
        // swapButton.style.visibility = "hidden";
        swapButton.classList.add("disabled");
    }

    //assigning eventListener to all the higlighted pieces
    possibleSquares.forEach( arr => {
        let r = arr[0];
        let c = arr[1];
        if ( r<=8 && r>0 && c<=8 && c>0){
            let possibleSquaresIndex = ((r-1)*8 + c) - 1;
            if( !allSquares[possibleSquaresIndex].firstChild ) {
                allSquares[possibleSquaresIndex].classList.add("green");
                allSquares[possibleSquaresIndex].addEventListener("click", movePiece);
            }
        }
    });

    currentPiece.classList.add("selected");
    
    //turning ricochet and semiRicochet
    if(currentPiece.id === "ricochet"){
        ricochetButton.children[0].onclick = () => {turnRicochet();}
        ricochetButton.children[1].onclick = () =>{turnRicochet();}
    }
    else if(currentPiece.id === "semiRicochet"){
        ricochetButton.children[0].onclick = () => {turnSemiRicochet(ricochetButton.children[0].id);}
        ricochetButton.children[1].onclick = () =>{turnSemiRicochet(ricochetButton.children[1].id);}
    }
    
}

//function to move pieces
function movePiece(e){
    possibleSquaresIndex = e.target.getAttribute("square-id");      // getting the index of the clicked box
    
    // appending the piece to the clicked box and updating the clickable attribute
    currentPiece.parentElement.setAttribute("clickable", false);
    allSquares[possibleSquaresIndex].append(currentPiece);
    currentPiece.setAttribute("row",allSquares[possibleSquaresIndex].getAttribute("row"));
    currentPiece.setAttribute("column",allSquares[possibleSquaresIndex].getAttribute("column"));
    moveCount++;
    allSquares[possibleSquaresIndex].setAttribute("clickable", true);

    // removing the green class and eventlisteners from all the squares
    allSquares.forEach(square => {
        square.classList.remove("green");
        square.removeEventListener("click", movePiece);
        if(square.firstChild) square.firstChild.classList.remove("selected");
    });
    

    allSquares.forEach( square =>{
        if(square.firstChild && square.firstChild.id !== "titan" && square.firstChild !== currentPiece){
            square.firstChild.removeEventListener("click", swapRicochet);
        }
    } )
    
    //stores the history in local storage
    let action = {
        action: "move",
        piece : `${currentPiece.className.slice(0, currentPiece.className.indexOf(" "))} ${currentPiece.id} ${currentPiece.getAttribute("piece-index")}`,
        from: piecePosition[currentPlayer][currentPiece.id][Number(currentPiece.getAttribute("piece-index"))],
        to: Number(possibleSquaresIndex),
        timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
    }
    moveHistory.push(action);
    localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));
    
    piecePosition[currentPlayer][currentPiece.id][Number(currentPiece.getAttribute("piece-index"))] = Number(possibleSquaresIndex);

    shoot();
    currentPlayer = (currentPlayer === "blue")? "red": "blue";

    // alternating timer between the players
    if(currentPlayer === "red" && !isGameOver){
        clearTimeout(blueTimeoutId);
        setTimeout(redTimer, bulletPath.length*BULLET_SPEED);
    }
    else if(currentPlayer === "blue" && !isGameOver){
        clearTimeout(redTimeoutId);
        setTimeout(blueTimer, bulletPath.length*BULLET_SPEED);
    }
    isGameOver = false;

    allSquares.forEach( square => square.removeEventListener("click", showPossibleMoves) ); // avoids the player to select a
    setTimeout(addSquareEventListener, (bulletPath.length+1)*BULLET_SPEED);                     // piece while the bullet is moving

    ricochetButton.style.visibility = "hidden";
    swapButton.classList.remove("enabled");
    isSwapChecked = false;
    swapButton.classList.add("disabled");

    clockTick.pause();
}

//assigns value to the array bulletPath
function shoot(){
    const cannonPosition = piecePosition[currentPlayer].cannon[0];     //storing where the cannon is
    let hit = false;
    bulletPath = [];    //declaring the bulletPath array which stores the boxes the bullet should move
    bulletAngle = [];

    // updating the bulletPath array
    if(currentPlayer === "blue"){
        bulletDirection = "v-";
        for(i=1; cannonPosition+(8*i)<=63; i++){
            
            if(allSquares[cannonPosition+(8*i)].firstChild){
                hit = true;
                if(allSquares[cannonPosition+(8*i)].firstChild.getAttribute("pass-through") === 'true'){
                    hit = false;
                    bulletPath.push(cannonPosition+(8*i));
                    bulletAngle.push(bulletDirection);
                    continue;
                }
                if(allSquares[cannonPosition+(8*i)].firstChild.id === "titan"){
                    isGameOver = true;
                    if(!allSquares[cannonPosition+(8*i)].firstChild.className.includes(currentPlayer)) currentPlayerWon = true;
                    notPlayable += 1;
                    bulletPath.push(cannonPosition+(8*i));
                    bulletAngle.push(bulletDirection);
                    if(!checking) setTimeout( ()=> {gameOver(allSquares[cannonPosition+(8*i)].firstChild.className);} , (bulletPath.length+1)*BULLET_SPEED);
                    break;
                }
                else if( allSquares[cannonPosition+(8*i)].firstChild.id === "tank" ){
                    if(allSquares[cannonPosition+(8*i)].firstChild.getAttribute("passable-side") === "vertical"){
                        hit = false;
                    }
                    else break;
                }
                else if( allSquares[cannonPosition+(8*i)].firstChild.id === "ricochet" ){
                    ricochetReflection(cannonPosition+(8*i));
                    break;
                }
                else if( allSquares[cannonPosition+(8*i)].firstChild.id === "semiRicochet" ){
                    semiRicochetReflection(cannonPosition+(8*i));
                    break;
                }
                else break;
            }
            
            if(!hit){
                bulletPath.push(cannonPosition+(8*i));
                bulletAngle.push(bulletDirection);
            }
        }
    }
    else{
        bulletDirection = "v+";
        for(i=1; cannonPosition-(8*i)>=0; i++){
            
            if(allSquares[cannonPosition-(8*i)].firstChild){
                hit = true;
                if(allSquares[cannonPosition-(8*i)].firstChild.getAttribute("pass-through") === 'true'){
                    hit = false;
                    bulletPath.push(cannonPosition-(8*i));
                    bulletAngle.push(bulletDirection);
                    continue;
                }
                if(allSquares[cannonPosition-(8*i)].firstChild.id === "titan"){
                    isGameOver = true;
                    if(!allSquares[cannonPosition-(8*i)].firstChild.className.includes(currentPlayer)) currentPlayerWon = true;
                    notPlayable += 1;
                    bulletPath.push(cannonPosition-(8*i));
                    bulletAngle.push(bulletDirection);
                    if(!checking) setTimeout( ()=> {gameOver(allSquares[cannonPosition-(8*i)].firstChild.className);} , (bulletPath.length+1)*BULLET_SPEED);
                    break;
                }
                else if( allSquares[cannonPosition-(8*i)].firstChild.id === "tank" ){
                    if(allSquares[cannonPosition-(8*i)].firstChild.getAttribute("passable-side") === "vertical"){
                        hit = false;
                    }
                    else break;
                }
                else if( allSquares[cannonPosition-(8*i)].firstChild.id === "ricochet" ){
                    ricochetReflection(cannonPosition-(8*i));
                    break;
                }
                else if( allSquares[cannonPosition-(8*i)].firstChild.id === "semiRicochet" ){
                    semiRicochetReflection(cannonPosition-(8*i));
                    break;
                }
                else break;
                
            }
            
            if(!hit){
                bulletPath.push(cannonPosition-(8*i));
                bulletAngle.push(bulletDirection);
            }
        }
    }

    if(!checking) bulletSound.play();
    if(bulletPath.length){
        if(!checking) {
            animateBullet();
        }
    }

}

//animates the bullet using the bulletPath array
function animateBullet(){
    const bullet = document.createElement("img");
    let squareAngle = null;

    if(allSquares[bulletPath[a]].firstChild)
        squareAngle = Number(allSquares[bulletPath[a]].firstChild.style.rotate.slice(0, allSquares[bulletPath[a]].firstChild.style.rotate.length-3));
    bullet.src = "./media/bullet.png";
    bullet.style.width = "100%";
    bullet.style.animation = `bulletAnimation ${BULLET_SPEED}ms linear`

    if(allSquares[bulletPath[a]].firstChild) allSquares[bulletPath[a]].firstChild.appendChild(bullet);
    else allSquares[bulletPath[a]].appendChild(bullet);

    switch (bulletAngle[a]){
        case "h+":
            if(squareAngle) bullet.style.rotate = `${90-squareAngle}deg`;
            else bullet.style.rotate = `90deg`;
            break;
        case "h-":
            if(squareAngle) bullet.style.rotate = `${-90-squareAngle}deg`;
            else bullet.style.rotate = `-90deg`;
            break;
        case "v+":
            if(squareAngle) bullet.style.rotate = `${0-squareAngle}deg`;
            else bullet.style.rotate = `0deg`;
            break;
        case "v-":
            if(squareAngle) bullet.style.rotate = `${180-squareAngle}deg`;
            else bullet.style.rotate = `180deg`;
            break;
    }

    allSquares[bulletPath[a]].classList.add("bullet");

    if(a==(bulletPath.length-1)){
        setTimeout( () =>{
            if(allSquares[bulletPath[a]].firstChild.firstChild) allSquares[bulletPath[a]].firstChild.removeChild(bullet);
            else allSquares[bulletPath[a]].removeChild(bullet);
            allSquares[bulletPath[a]].classList.remove("bullet");
            a=0;
        } , BULLET_SPEED);
        return;
    }
    a++;
    if(a<bulletPath.length) setTimeout(() =>{
        if(a>0){
            if(allSquares[bulletPath[a-1]].firstChild.firstChild) allSquares[bulletPath[a-1]].firstChild.removeChild(bullet);
            else allSquares[bulletPath[a-1]].removeChild(bullet);
            allSquares[bulletPath[a-1]].classList.remove("bullet");
        }
        animateBullet();
    }, BULLET_SPEED);
}

//applies the reflection logic for ricochet
function ricochetReflection(ricochetPosition){
    const normal = allSquares[ricochetPosition].firstChild.style.rotate;

    if(bulletDirection == "h+"){
        if(normal == "0deg") deflectDown(ricochetPosition);
        else deflectUp(ricochetPosition);
    }
    else if(bulletDirection == "h-"){
        if(normal == "0deg") deflectUp(ricochetPosition);
        else deflectDown(ricochetPosition);
    }
    else if(bulletDirection == "v+"){
        if(normal == "0deg") deflectLeft(ricochetPosition);
        else deflectRight(ricochetPosition);
    }
    else if(bulletDirection == "v-"){
        if(normal == "0deg") deflectRight(ricochetPosition);
        else deflectLeft(ricochetPosition);
    }
    else{
        bulletPath.push(semiRicochetPosition);
        bulletAngle(bulletDirection);
    }
}

//gameOver function
function gameOver(titanClassName){
    currentPlayer = "blue";
    clockTick.pause();
    winMusic.play();
    if(titanClassName.includes("blue")) window.alert("Red Won");
    else if(titanClassName.includes("red")) window.alert("Blue Won");

    isGameOver = true;
    initializeBoard();

}

//applies the reflection logic for semiRicochet
function semiRicochetReflection(semiRicochetPosition){
    let normal = allSquares[semiRicochetPosition].firstChild.style.rotate;
    
    normal = Number(normal.slice(0, normal.length-3));
    if(normal >= 0) normal = normal % 360;
    else normal = 360 + (normal % 360);

    if(bulletDirection == "h+"){
        if(normal == 0) deflectDown(semiRicochetPosition);
        else if(normal == 90) deflectUp(semiRicochetPosition);
        else destroySemiRicochet(semiRicochetPosition);
    }
    else if(bulletDirection == "h-"){
        if(normal == 270) deflectDown(semiRicochetPosition);
        else if(normal == 180) deflectUp(semiRicochetPosition);
        else destroySemiRicochet(semiRicochetPosition);
    }
    else if(bulletDirection == "v+"){
        if(normal == 0) deflectLeft(semiRicochetPosition);
        else if(normal == 270) deflectRight(semiRicochetPosition);
        else destroySemiRicochet(semiRicochetPosition);
    }
    else if(bulletDirection == "v-"){
        if(normal == 90) deflectLeft(semiRicochetPosition);
        else if(normal == 180) deflectRight(semiRicochetPosition);
        else destroySemiRicochet(semiRicochetPosition);
    }
    else{
        bulletPath.push(semiRicochetPosition);
        bulletAngle(bulletDirection);
    }
}

//turns the ricochet
function turnRicochet(){
    let angle = Number(currentPiece.style.rotate.slice(0, (currentPiece.style.rotate.length-3)));
    const oldAngle = angle;
    if(currentPiece.style.rotate != '90deg'){currentPiece.style.rotate = `90deg`;}
    else currentPiece.style.rotate = `0deg`;
    moveCount++;

    allSquares.forEach(square => {
        square.classList.remove("green");
        square.removeEventListener("click", movePiece);
        if(square.firstChild) square.firstChild.removeEventListener("click", swapRicochet);
        if(square.firstChild) square.firstChild.classList.remove("selected");
    });
    
    //stores the history in local storage
    let action = {
        action: "rotate",
        piece : `${currentPiece.className.slice(0, currentPiece.className.indexOf(" "))} ${currentPiece.id} ${currentPiece.getAttribute("piece-index")}`,
        from: oldAngle,
        to: Number(currentPiece.style.rotate.slice(0, (currentPiece.style.rotate.length-3))),
        timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
    }
    moveHistory.push(action);
    localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));

    shoot();
    currentPlayer = (currentPlayer === "blue")? "red": "blue";

    // alternating timer between the players
    if(currentPlayer === "red" && !isGameOver){
        clearTimeout(blueTimeoutId);
        setTimeout(redTimer, (bulletPath.length+1)*BULLET_SPEED);
    }
    else if(currentPlayer === "blue" && !isGameOver){
        clearTimeout(redTimeoutId);
        setTimeout(blueTimer, (bulletPath.length+1)*BULLET_SPEED);
    }
    isGameOver = false;

    allSquares.forEach( square => square.removeEventListener("click", showPossibleMoves) );

    setTimeout(addSquareEventListener, (bulletPath.length+1)*BULLET_SPEED); 
    ricochetButton.style.visibility = "hidden";
    swapButton.classList.remove("enabled");
    isSwapChecked = false;
    swapButton.classList.add("disabled");

    return;
}

//turns the semiRicochet
function turnSemiRicochet(rotate){
    let angle = Number(currentPiece.style.rotate.slice(0, (currentPiece.style.rotate.length-3)));
    const oldAngle = angle;

    if(rotate === "right") angle += 90;
    else angle -= 90;

    currentPiece.style.rotate = `${angle}deg`;
    moveCount++;

    //stores the history in local storage
    let action = {
        action: "rotate",
        piece : `${currentPiece.className.slice(0, currentPiece.className.indexOf(" "))} ${currentPiece.id} ${currentPiece.getAttribute("piece-index")}`,
        from: oldAngle,
        to: angle,
        timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
    }
    moveHistory.push(action);
    localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));

    allSquares.forEach(square => {
        square.classList.remove("green");
        square.removeEventListener("click", movePiece);
        if(square.firstChild) square.firstChild.removeEventListener("click", swapRicochet);
        if(square.firstChild) square.firstChild.classList.remove("selected");
    });

    shoot();
    currentPlayer = (currentPlayer === "blue")? "red": "blue";

    // alternating timer between the players
    if(currentPlayer === "red" && !isGameOver){
        clearTimeout(blueTimeoutId);
        setTimeout(redTimer, (bulletPath.length+1)*BULLET_SPEED);
    }
    else if(currentPlayer === "blue" && !isGameOver){
        clearTimeout(redTimeoutId);
        setTimeout(blueTimer, (bulletPath.length+1)*BULLET_SPEED);
    }
    isGameOver = false;

    allSquares.forEach( square => square.removeEventListener("click", showPossibleMoves) );

    setTimeout(addSquareEventListener, (bulletPath.length+1)*BULLET_SPEED); 

    ricochetButton.style.visibility = "hidden";
    swapButton.classList.remove("enabled");
    isSwapChecked = false;
    swapButton.classList.add("disabled");

    return;
}

function destroySemiRicochet(semiRicochetPosition, calledFromUndo = false){
    let square = allSquares[semiRicochetPosition];
    notPlayable += 1;

    if(!square.firstChild.className.includes(currentPlayer)) opponentSemiRicochetDestroyed = true;
    else opponentSemiRicochetDestroyed = false;

    piecePosition[square.firstChild.className.slice(0, square.firstChild.className.indexOf(" "))][square.firstChild.id][Number(square.firstChild.getAttribute("piece-index"))] = -1;
    
    if(!calledFromUndo && !checking)setTimeout( () => { square.removeChild(allSquares[semiRicochetPosition].firstChild) }, (bulletPath.length)*BULLET_SPEED );
    else if(calledFromUndo && !checking) square.removeChild(allSquares[semiRicochetPosition].firstChild);

    if(!checking) setTimeout(() => popupDisplay("Semi Ricochet Destroyed!"), (bulletPath.length+1)*BULLET_SPEED);
}

function deflectDown(ricochetPosition){
    let hit = false;
    bulletAngle.push(bulletDirection);
    bulletDirection = "v-";
    bulletPath.push(ricochetPosition);
    for(j=ricochetPosition+8; j<64; j+=8){
        
        if(j>63) return;
        if(allSquares[j].firstChild){
            hit = true;
            if(allSquares[j].firstChild.getAttribute("pass-through") === "true"){
                hit = false;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                continue;
            }
            if(allSquares[j].firstChild.id === "titan") {
                isGameOver = true;
                if(!allSquares[j].firstChild.className.includes(currentPlayer)) currentPlayerWon = true;
                notPlayable += 1;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                if(!checking) setTimeout( ()=> {gameOver(allSquares[j].firstChild.className);} , (bulletPath.length+1)*BULLET_SPEED);
                break;
            }
            else if( allSquares[j].firstChild.id === "tank" ) {
                if(allSquares[j].firstChild.getAttribute("passable-side") === "vertical"){
                    hit = false;
                }
                else break;
            }
            else if( allSquares[j].firstChild.id === "ricochet" ){
                ricochetReflection(j);
                break;
            }
            else if( allSquares[j].firstChild.id === "semiRicochet" ){
                semiRicochetReflection(j);
                break;
            }
            else break;
        }
        if(!hit){
            bulletPath.push(j);
            bulletAngle.push(bulletDirection);
            hit = false;
        }
    }
}

function deflectUp(ricochetPosition){
    let hit = false;
    bulletAngle.push(bulletDirection);
    bulletDirection = "v+";
    bulletPath.push(ricochetPosition);
    for(j=ricochetPosition-8; j>=0; j-=8){
        if(j<0) return;
        if(allSquares[j].firstChild){
            hit = true;
            if(allSquares[j].firstChild.getAttribute("pass-through") === 'true'){
                hit = false;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                continue;
            }
            if(allSquares[j].firstChild.id === "titan") {
                isGameOver = true;
                if(!allSquares[j].firstChild.className.includes(currentPlayer)) currentPlayerWon = true;
                notPlayable += 1;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                if(!checking) setTimeout( ()=> {gameOver(allSquares[j].firstChild.className);} , (bulletPath.length+1)*BULLET_SPEED);
                break;
            }
            else if( allSquares[j].firstChild.id === "tank" ){
                if(allSquares[j].firstChild.getAttribute("passable-side") === "vertical"){
                    hit = false;
                }
                else break;
            }
            else if( allSquares[j].firstChild.id === "ricochet" ){
                ricochetReflection(j);
                break;
            }
            else if( allSquares[j].firstChild.id === "semiRicochet" ){
                semiRicochetReflection(j);
                break;
            }
            else break;
        }
        if(!hit){
            bulletPath.push(j);
            bulletAngle.push(bulletDirection);
        }
    }
}

function deflectRight(ricochetPosition){
    let hit = false;
    bulletAngle.push(bulletDirection);
    bulletDirection = "h+";
    bulletPath.push(ricochetPosition);
    for(j=(ricochetPosition+1); (j%8)!=0; j++){
        if(j>63) return;
        if(allSquares[j].firstChild){
            hit = true;
            if(allSquares[j].firstChild.getAttribute("pass-through") === 'true'){
                hit = false;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                continue;
            }
            if(allSquares[j].firstChild.id === "titan") {
                isGameOver = true;
                if(!allSquares[j].firstChild.className.includes(currentPlayer)) currentPlayerWon = true;
                notPlayable += 1;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                if(!checking) setTimeout( ()=> {gameOver(allSquares[j].firstChild.className);} , (bulletPath.length+1)*BULLET_SPEED);
                break;
            }
            else if( allSquares[j].firstChild.id === "tank" ){
                if(allSquares[j].firstChild.getAttribute("passable-side") === "horizontal"){
                    hit = false;
                }
                else break;
            }
            else if( allSquares[j].firstChild.id === "ricochet" ){
                ricochetReflection(j);
                break;
            }
            else if( allSquares[j].firstChild.id === "semiRicochet" ){
                semiRicochetReflection(j);
                break;
            }
            else break;
        }
        if(!hit){
            bulletPath.push(j);
            bulletAngle.push(bulletDirection);
        }
    }
}

function deflectLeft(ricochetPosition){
    let hit = false;
    bulletAngle.push(bulletDirection);
    bulletDirection = "h-";
    bulletPath.push(ricochetPosition);
    for(j=(ricochetPosition-1); (j%8)!=7; j--){
        if(j<0) return;
        if(allSquares[j].firstChild){
            hit = true;
            if(allSquares[j].firstChild.getAttribute("pass-through") === 'true'){
                hit = false;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                continue;
            }
            if(allSquares[j].firstChild.id === "titan") {
                isGameOver = true;
                if(!allSquares[j].firstChild.className.includes(currentPlayer)) currentPlayerWon = true;
                notPlayable += 1;
                bulletPath.push(j);
                bulletAngle.push(bulletDirection);
                if(!checking) setTimeout( ()=> {gameOver(allSquares[j].firstChild.className);} , (bulletPath.length+1)*BULLET_SPEED);
                break;
            }
            else if( allSquares[j].firstChild.id === "tank" ){
                if(allSquares[j].firstChild.getAttribute("passable-side") === "horizontal"){
                    hit = false;
                }
                else break;
            }
            else if( allSquares[j].firstChild.id === "ricochet" ){
                ricochetReflection(j);
                break;
            }
            else if( allSquares[j].firstChild.id === "semiRicochet" ){
                semiRicochetReflection(j);
                break;
            }
            else break;
        }
        if(!hit){
            bulletPath.push(j);
            bulletAngle.push(bulletDirection);
        }
    }
}

function redTimer(){
    if(redMinutes === 0 && redSeconds === 0){
        clearTimeout(redTimeoutId);
        clearTimeout(blueTimeoutId);
        currentPlayer = "blue";
        clockTick.pause();
        winMusic.play();
        window.alert("Blue won");
        initializeBoard();
        blueMinutes = MINUTES; redMinutes = MINUTES;
        blueSeconds =SECONDS; redSeconds = SECONDS;
        return;
    }
    if(redSeconds) redSeconds--;
    else if( redSeconds % 60 === 0 ){
        redSeconds = 59;
        redMinutes--;
    }
    else if( redMinutes % 60 === 0 ){
        redMinutes = 0;
    }

    if(redMinutes === 0 && redSeconds <= 10){
        clockTick.play();
    }

    redSeconds = redSeconds.toString().padStart(2, 0);
    redMinutes = redMinutes.toString().padStart(2, 0);
    redTime.textContent = `Red Timer: ${redMinutes}:${redSeconds}`;
    redSeconds = Number(redSeconds);
    redMinutes = Number(redMinutes);
    redTimeoutId = setTimeout( redTimer, 1000 );
}

function blueTimer(){
    if(blueMinutes === 0 && blueSeconds === 0){
        clearTimeout(blueTimeoutId);
        clearTimeout(redTimeoutId);
        currentPlayer = "blue";
        clockTick.pause();
        winMusic.play();
        window.alert("Red won");
        initializeBoard();
        blueMinutes = MINUTES; redMinutes = MINUTES;
        blueSeconds =SECONDS; redSeconds = SECONDS;
        return;
    }
    if(blueSeconds) blueSeconds--;
    else if( blueSeconds === 0 ){
        blueSeconds = 59;
        blueMinutes--;
    }
    else if( blueMinutes % 60 === 0 ){
        blueMinutes = 0;
    }

    if(blueMinutes === 0 && blueSeconds <= 10){
        clockTick.play();
    }

    blueSeconds = blueSeconds.toString().padStart(2, 0);
    blueMinutes = blueMinutes.toString().padStart(2, 0);
    blueTime.textContent = `Blue Timer: ${blueMinutes}:${blueSeconds}`;
    blueSeconds = Number(blueSeconds);
    blueMinutes = Number(blueMinutes);
    blueTimeoutId = setTimeout( blueTimer, 1000 );
}

function undo(stepCount){

    let history = JSON.parse(localStorage.getItem(`moveHistory${nthGame}`));
    let previousAction = history[history.length-stepCount];

    if(previousAction.action.includes("move")){
        const targetSquare = allSquares[previousAction.from];
        const currentSquare = allSquares[previousAction.to];
        const targetPiece = currentSquare.firstChild;

        piecePosition[previousAction.piece.split(" ")[0]][previousAction.piece.split(" ")[1]][previousAction.piece.split(" ")[2]] = previousAction.from;

        try
        {
            targetSquare.appendChild(targetPiece);
        }
        catch{
            popupDisplay("Cannot undo!");
            cantUndo = true;
            return;
        }


        let action = {
            action: `undo move`,
            piece: previousAction.piece,
            from: previousAction.to,
            to: previousAction.from,
            timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
        }
        moveHistory.push(action);
        localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));
        playerHistory.textContent = displayHistory();
        cantUndo = false;
    }
    else if(previousAction.action.includes("rotate")){
        const pieceName = previousAction.piece.split(" ");
        const targetPiece = allSquares[piecePosition[pieceName[0]][pieceName[1]][pieceName[2]]].firstChild;
        const previousAngle = previousAction.from;

        targetPiece.style.rotate = `${previousAngle}deg`;

        let action = {
            action: `undo rotate`,
            piece: previousAction.piece,
            from: previousAction.to,
            to: previousAction.from,
            timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
        }
        moveHistory.push(action);
        localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));
        playerHistory.textContent = displayHistory();
        cantUndo = false;
    }

    else if(previousAction.action.includes("swap")){
        const currentSquare = allSquares[previousAction.to];
        const targetSquare = allSquares[previousAction.from];

        let temp = [targetSquare.firstChild, currentSquare.firstChild, 
            targetSquare.firstChild.getAttribute("row"), targetSquare.firstChild.getAttribute("column"),
            currentSquare.firstChild.getAttribute("row"), currentSquare.firstChild.getAttribute("column")
        ];

        currentSquare.firstChild.setAttribute("row", temp[2]);
        currentSquare.firstChild.setAttribute("column", temp[3]);    
        targetSquare.firstChild.setAttribute("row", temp[4]);
        targetSquare.firstChild.setAttribute("column", temp[5]);
        
        targetSquare.appendChild(temp[1]);
        currentSquare.appendChild(temp[0]);
    
        let action = {
            action: "undo swap",
            piece: previousAction.piece,
            from: previousAction.to,
            to: previousAction.from,
            timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
        }
    
        moveHistory.push(action);
        localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));
        playerHistory.textContent = displayHistory();

        cantUndo = false;
        
    }
}

//function for swaping pieces
function swapRicochet(e){
    allSquares.forEach(square => {
        if(square.firstChild) square.firstChild.removeEventListener("click", swapRicochet);
        if(square.firstChild) square.firstChild.classList.remove("selected");
        
    })

    const targetSquare = e.target.parentElement;
    const currentSquare = currentPiece.parentElement;

    let temp = [targetSquare.firstChild, currentSquare.firstChild, 
                targetSquare.firstChild.getAttribute("row"), targetSquare.firstChild.getAttribute("column"),
                currentSquare.firstChild.getAttribute("row"), currentSquare.firstChild.getAttribute("column")
    ];

    currentSquare.firstChild.setAttribute("row", temp[2]);
    currentSquare.firstChild.setAttribute("column", temp[3]);    
    targetSquare.firstChild.setAttribute("row", temp[4]);
    targetSquare.firstChild.setAttribute("column", temp[5]);
    
    targetSquare.appendChild(temp[1]);
    currentSquare.appendChild(temp[0]);

    if(currentPlayer === "blue") blueSwapCount--;
    else redSwapCount--;

    moveCount++;

    let action = {
        action: "swap",
        piece: `${currentPiece.className.slice(0, currentPiece.className.indexOf(" "))} ${currentPiece.id} ${currentPiece.getAttribute("piece-index")}`,
        from: piecePosition[currentPlayer][currentPiece.id][Number(currentPiece.getAttribute("piece-index"))],
        to: Number(temp[1].parentElement.getAttribute("square-id")),
        timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
    }

    moveHistory.push(action);
    localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));
    
    piecePosition[currentPlayer][currentPiece.id][Number(currentPiece.getAttribute("piece-index"))] = Number(temp[1].parentElement.getAttribute("square-id"));
    piecePosition[temp[0].className.split(" ")[0]][temp[0].id][Number(temp[0].getAttribute("piece-index"))] = Number(temp[0].parentElement.getAttribute("square-id"));

    shoot();
    currentPlayer = (currentPlayer === "blue")? "red": "blue";

    // alternating timer between the players
    if(currentPlayer === "red" && !isGameOver){
        clearTimeout(blueTimeoutId);
        setTimeout(redTimer, bulletPath.length*BULLET_SPEED);
    }
    else if(currentPlayer === "blue" && !isGameOver){
        clearTimeout(redTimeoutId);
        setTimeout(blueTimer, bulletPath.length*BULLET_SPEED);
    }
    isGameOver = false;

    allSquares.forEach( square => square.removeEventListener("click", showPossibleMoves) ); // avoids the player to select a
    setTimeout(addSquareEventListener, (bulletPath.length+1)*BULLET_SPEED);                      // piece while the bullet is moving

    allSquares.forEach( square => {
        square.removeEventListener("click", showPossibleMoves);
        square.removeEventListener("click", movePiece);
        square.classList.remove("green");
    } )

    ricochetButton.style.visibility = "hidden";
    swapButton.classList.remove("enabled");
    swapButton.classList.add("disabled");
    clockTick.pause();
    
}

// Displays the game history
function displayHistory(){

    let finalText = "";
    moveHistory.forEach( (move, i) => {
        if(!i) return;
        if(move.action.includes("move")){
            finalText += `Moved ${move.piece} from ${move.from} to ${move.to}\n`;
        }
        else if(move.action.includes("rotate")){
            finalText += `Rotated ${move.piece} from ${move.from}deg to ${move.to}deg\n`;
        }
        else if(move.action.includes("swap")){
            finalText += `Swaped ${move.piece} from ${move.from} to ${move.to}\n`;
        }
    } )

    return finalText;
}

// Creates a pop up box near the corner with the given text
function popupDisplay(text){
    const popupDiv = document.createElement("div");
    
    popupDiv.classList.add("popup");
    popupDiv.innerText = text;
    popupDiv.style.visibility = "visible";
    popupDiv.style.animation = `slideRight ${POPUP_TIME}ms`;
    document.body.append(popupDiv);
    setTimeout( () => {popupDiv.style.visibility = "collapse"; document.body.removeChild(popupDiv);}, POPUP_TIME );
}