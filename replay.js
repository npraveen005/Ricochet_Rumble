const replayButton = document.getElementById("replay");
const replayMenu = document.getElementById("replayMenuContainer");
const blinkDiv = document.createElement("div");
const darkDiv = document.getElementById("darkDiv");
const replayCloseButton = document.querySelector("#replayMenuContainer #closeButton");

const replayIcon = replayButton.firstChild;
let blueTimeStamps = [], redTimeStamps = [], redActions = [], blueActions = [];
let isBlueDone = false, isRedDone = false, onReplay = false;

blinkDiv.classList.add("blink");

replayButton.onclick = () => { 
    blueTimeStamps = [], redTimeStamps = [], redActions = [], blueActions = [];
    isRedDone = false, isBlueDone = false;

    replayMenu.style.visibility = "visible";
    darkDiv.style.visibility = "visible";
};

replayCloseButton.onclick = () => {
    replayMenu.style.visibility = "collapse";
    darkDiv.style.visibility = "collapse";
    onReplay = false;

    initializeBoard();

    try{
        replayButton.removeChild(blinkDiv);
        replayButton.appendChild(replayIcon);
    }
    catch{}
}

function replay(gameNumber){

    if(gameNumber > localStorage.length){
        window.alert("No replay available!");
        onReplay = false;
        return;
    }

    onReplay = true;

    replayMenu.style.visibility = "collapse";
    darkDiv.style.visibility = "collapse";

    replayButton.removeChild(replayButton.firstChild);
    replayButton.appendChild(blinkDiv);

    const history = JSON.parse(localStorage.getItem(`moveHistory${localStorage.length - gameNumber}`));
    let currentStartPiece = startPieces;
    startPieces = history[0];
    initializeBoard();
    startPieces = currentStartPiece;
    clearTimeout(blueTimeoutId);
    clearTimeout(redTimeoutId);

    allSquares.forEach( square => {
        square.removeEventListener("click", addEventListener);
        square.removeEventListener("click", showPossibleMoves);
        square.removeEventListener("click", movePiece);
        if(square.firstChild) square.firstChild.removeEventListener("click", swapRicochet);
    } )

    history.forEach( (move, i) => {
        if(!i) return;
        if(move.piece.split(" ")[0] === "blue") { 
            if(move.action.includes("undo")){
                redActions.push(move);
                redTimeStamps.push(move.timeStamp);
            }
            else{
                blueActions.push(move);
                blueTimeStamps.push(move.timeStamp);
            }
        }
        else if(move.piece.split(" ")[0] === "red") { 
            if(move.action.includes("undo")){
                blueActions.push(move);
                blueTimeStamps.push(move.timeStamp);
            }
            else{
                redActions.push(move);
                redTimeStamps.push(move.timeStamp);
            }
        }
    } );

    blueReplayTimer();
}

function takeAction(move){
    switch(move.action.split(" ")[move.action.split(" ").length-1]){
        case "move":
            allSquares[move.to].appendChild(allSquares[move.from].firstChild);
            piecePosition[move.piece.split(" ")[0]][move.piece.split(" ")[1]][move.piece.split(" ")[2]] = move.to;
            if(!move.action.includes("undo")) shoot();
            if(move.piece.split(" ")[0] === "blue"){
                clearTimeout(blueTimeoutId);
                currentPlayer = "red";
                setTimeout(() => { redReplayTimer(); alternatePlayers(); }, (bulletPath.length+1)*BULLET_SPEED);
            }
            else {
                clearTimeout(redTimeoutId);
                currentPlayer = "blue";
                setTimeout(() => {blueReplayTimer(); alternatePlayers()}, (bulletPath.length+1)*BULLET_SPEED);
            }

            break;
        
        case "rotate":
            const targetPiece = document.querySelector(`[class='${move.piece.split(" ")[0]} pieces'][id='${move.piece.split(" ")[1]}'][piece-index='${move.piece.split(" ")[2]}']`);
            targetPiece.style.rotate = `${move.to}deg`;
            if(!move.action.includes("undo")) shoot();
            if(move.piece.split(" ")[0] === "blue"){
                clearTimeout(blueTimeoutId);
                currentPlayer = "red";
                setTimeout(() => { redReplayTimer(); alternatePlayers(); }, (bulletPath.length+1)*BULLET_SPEED);
            }
            else {
                clearTimeout(redTimeoutId);
                currentPlayer = "blue";
                setTimeout(() => {blueReplayTimer(); alternatePlayers()}, (bulletPath.length+1)*BULLET_SPEED);
            }

            break;
        
        case "swap":
            const currentSquare = allSquares[move.from];
            const targetSquare = allSquares[move.to];
    
            let temp = [targetSquare.firstChild, currentSquare.firstChild, 
                targetSquare.firstChild.getAttribute("row"), targetSquare.firstChild.getAttribute("column"),
                currentSquare.firstChild.getAttribute("row"), currentSquare.firstChild.getAttribute("column")
            ];
    
            currentSquare.firstChild.setAttribute("row", temp[2]);
            currentSquare.firstChild.setAttribute("column", temp[3]);    
            targetSquare.firstChild.setAttribute("row", temp[4]);
            targetSquare.firstChild.setAttribute("column", temp[5]);
            
            piecePosition[temp[0].className.split(" ")[0]][temp[0].id][Number(temp[0].getAttribute("piece-index"))] = move.from;
            piecePosition[temp[1].className.split(" ")[0]][temp[1].id][Number(temp[1].getAttribute("piece-index"))] = move.to;

            targetSquare.appendChild(temp[1]);
            currentSquare.appendChild(temp[0]);
            if(!move.action.includes("undo")) shoot();

            if(move.piece.split(" ")[0] === "blue"){
                clearTimeout(blueTimeoutId);
                currentPlayer = "red";
                setTimeout(() => { redReplayTimer(); alternatePlayers(); }, (bulletPath.length+1)*BULLET_SPEED);
            }
            else {
                clearTimeout(redTimeoutId);
                currentPlayer = "blue";
                setTimeout(() => {blueReplayTimer(); alternatePlayers()}, (bulletPath.length+1)*BULLET_SPEED);
            }

            break;
            

    }
}

function redReplayTimer(){
    onReplay = !(isBlueDone && isRedDone)
    if(!onReplay){
        replayButton.removeChild(blinkDiv);
        replayButton.appendChild(replayIcon);
    }
    if(isRedDone) return;
    if(!redTimeStamps.length) return;
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

    if( redTimeStamps.includes(`${redMinutes}:${redSeconds}`) ){
        takeAction(redActions[redTimeStamps.indexOf(`${redMinutes}:${redSeconds}`)]);
        if(redTimeStamps.indexOf(`${redMinutes}:${redSeconds}`) === redTimeStamps.length-1) isRedDone = true;
        return;
    }

    redTimeoutId = setTimeout( redReplayTimer, 1000 );
}

function blueReplayTimer(){
    onReplay = !(isBlueDone && isRedDone);
    if(!onReplay){
        replayButton.removeChild(blinkDiv);
        replayButton.appendChild(replayIcon);
    }
    if(isBlueDone) return;
    if(!blueTimeStamps.length) return;
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

    if( blueTimeStamps.includes(`${blueMinutes}:${blueSeconds}`) ){
        takeAction(blueActions[blueTimeStamps.indexOf(`${blueMinutes}:${blueSeconds}`)]);
        if(blueTimeStamps.indexOf(`${blueMinutes}:${blueSeconds}`) === blueTimeStamps.length-1) isBlueDone = true;
        return;
    }

    blueTimeoutId = setTimeout( blueReplayTimer, 1000 );
}

function alternatePlayers(){
    if(currentPlayer === "blue"){
        playersTurn.textContent = `BLUE'S TURN`;
        playersTurn.style.color = "blue";
        gameBoard.style.backgroundColor = "rgb(66, 66, 220)";
        gameBoard.style.boxShadow = "0px 0px 10px rgb(66, 66, 220, 0.85)";
        playersTurn.style.textShadow = "0px 0px 10px rgba(0, 0, 255, 0.5)";
    }
    else{
        playersTurn.textContent = `RED'S TURN`;
        playersTurn.style.color = "red";
        gameBoard.style.backgroundColor = "rgb(255, 73, 73)";
        gameBoard.style.boxShadow = "0px 0px 10px rgb(255, 73, 73, 0.85)";
        playersTurn.style.textShadow = "0px 0px 10px rgba(255, 0, 0, 0.5)";
    }
}