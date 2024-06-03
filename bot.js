const chooseBot = document.getElementById("chooseBot");
const botButton = document.getElementById("botButton");

botButton.onclick = () => {
    if(botButton.getAttribute("state") === "single"){
        chooseBot.style.visibility = "visible";
        settingsContainer.style.visibility = 'collapse';
        botButton.innerHTML = "Back to default mode";
        botButton.setAttribute("state", "multiplayer");
    }
    else{
        chooseBot.style.visibility = 'collapse';
        settingsContainer.style.visibility = 'collapse';
        darkDiv.style.visibility = 'collapse';
        botButton.setAttribute("state", "single");
        botButton.innerHTML = "Play with bot";
        botColour = null;
    }
}

function playMove(player){
    if( !playOffense(player) ){
        playDefense(player);
    }
}

function playOffense(player){
    let pieces = document.querySelectorAll(`.${player}`), possibleMoves = [];

    for(l=0; l<pieces.length; l++){
        let piece = pieces[l];
        checking = true;
        possibleMoves = [];

        const row = Number(piece.getAttribute("row"));
        const column = Number(piece.getAttribute("column"));

        if(piece.id === "semiRicochet"){
            let angle = Number(piece.style.rotate.slice(0, (piece.style.rotate.length-3)));
            const oldAngle = angle;
        
            angle += 90;
            piece.style.rotate = `${angle}deg`;
            shoot();

            if(currentPlayerWon || opponentSemiRicochetDestroyed){
                checking = false;
                currentPlayerWon = false, opponentSemiRicochetDestroyed = false;
                return true;
            }
            else{
                piece.style.rotate = `${oldAngle}deg`;
            }

            angle -= 90;
            piece.style.rotate = `${angle}deg`;
            shoot();
            if(currentPlayerWon || opponentSemiRicochetDestroyed){
                checking = false;
                currentPlayerWon = false, opponentSemiRicochetDestroyed = false;

                let action = {
                    action: "rotate",
                    piece : `${piece.className.slice(0, piece.className.indexOf(" "))} ${piece.id} ${piece.getAttribute("piece-index")}`,
                    from: oldAngle,
                    to: angle,
                    timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
                }
                moveHistory.push(action);
                localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));

                return true;
            }
            else{
                piece.style.rotate = `${oldAngle}deg`;
            }
        }
        else if(piece.id === "ricochet"){
            let angle = Number(piece.style.rotate.slice(0, (piece.style.rotate.length-3)));
            const oldAngle = angle;
        
            if(oldAngle === 0) piece.style.rotate = `90deg`;
            else piece.style.rotate = `0deg`;
            shoot();

            if(currentPlayerWon || opponentSemiRicochetDestroyed){
                checking = false;
                currentPlayerWon = false, opponentSemiRicochetDestroyed = false;

                let action = {
                    action: "rotate",
                    piece : `${piece.className.slice(0, piece.className.indexOf(" "))} ${piece.id} ${piece.getAttribute("piece-index")}`,
                    from: oldAngle,
                    to: angle,
                    timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
                }
                moveHistory.push(action);
                localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));

                return true;
            }
            else{
                piece.style.rotate = `${oldAngle}deg`;
            }
        }
        
        if(piece.id === "cannon"){
            var possibleRowsAndColumns = [ [row, column+1], [row, column-1] ];
        }
        else{
            var possibleRowsAndColumns = [ [row, column+1], [row, column-1], [row+1, column-1], [row+1, column], [row+1, column+1], [row-1, column-1], [row-1, column], [row-1, column+1] ];
        }

        possibleRowsAndColumns.forEach( arr => {
            let r = arr[0];
            let c = arr[1];
            if ( r<=8 && r>0 && c<=8 && c>0){
                let possibleSquaresIndex = ((r-1)*8 + c) - 1;
                if( !allSquares[possibleSquaresIndex].firstChild ) {
                    possibleMoves.push(possibleSquaresIndex);
                }
            }
        });
        
        for(k=0; k<possibleMoves.length; k++){
            let position = possibleMoves[k];

            allSquares[position].appendChild(piece);
            piecePosition[player][piece.id][Number(piece.getAttribute("piece-index"))] = position;

            shoot();
            if(currentPlayerWon || opponentSemiRicochetDestroyed){
                checking = false;
                currentPlayerWon = false, opponentSemiRicochetDestroyed = false;
                piece.setAttribute("row",allSquares[position].getAttribute("row"));
                piece.setAttribute("column",allSquares[position].getAttribute("column"));

                let action = {
                    action: "move",
                    piece : `${piece.className.slice(0, piece.className.indexOf(" "))} ${piece.id} ${piece.getAttribute("piece-index")}`,
                    from: ( (row-1)*8 + column ) - 1,
                    to: position,
                    timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
                }
                moveHistory.push(action);
                localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));

                return true;
            }
            else{
                allSquares[( (row-1)*8 + column ) - 1].appendChild(piece);
                piecePosition[player][piece.id][Number(piece.getAttribute("piece-index"))] = ( (row-1)*8 + column ) - 1;
            }
        }

    }

    return false;

}

function playDefense(player){
    let pieces = document.querySelectorAll(`.${player}`), possibleMoves = [], piece, row, column, randomPositionIndex;

    piece = pieces[Math.floor( Math.random() * (pieces.length - 1) )];
    if( piece.id === "ricochet" ){
        if(Math.random() < 0.7){
            let angle = Number(piece.style.rotate.slice(0, (piece.style.rotate.length-3)));
            const oldAngle = angle;
        
            if(oldAngle === 0) piece.style.rotate = `90deg`;
            else piece.style.rotate = `0deg`;
            checking = true;
            shoot();
            if(notPlayable){
                piece.style.rotate = `${oldAngle}deg`;
                checking =  false;
            }else{
                
                let action = {
                    action: "rotate",
                    piece : `${piece.className.slice(0, piece.className.indexOf(" "))} ${piece.id} ${piece.getAttribute("piece-index")}`,
                    from: oldAngle,
                    to: angle,
                    timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
                }
                moveHistory.push(action);
                localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));
                
                return;
            }

        }
    }
    else if( piece.id === "semiRicochet" ){
        if(Math.random() < 0.7){
            let angle = Number(piece.style.rotate.slice(0, (piece.style.rotate.length-3)));
            const oldAngle = angle;
        
            angle += 90;
            piece.style.rotate = `${angle}deg`;
            checking = true;
            shoot();
            if(notPlayable){
                piece.style.rotate = `${oldAngle}deg`;
                checking =  false;
            }else{

                let action = {
                    action: "rotate",
                    piece : `${piece.className.slice(0, piece.className.indexOf(" "))} ${piece.id} ${piece.getAttribute("piece-index")}`,
                    from: oldAngle,
                    to: angle,
                    timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
                }
                moveHistory.push(action);
                localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));

                return;
            }
        }
    }

    do{
        let randomPieceIndex = Math.floor( Math.random() * (pieces.length - 1) );
        pieces = document.querySelectorAll(`.${player}`);
        possibleMoves = [];
        piece = pieces[randomPieceIndex];
    
        row = Number(piece.getAttribute("row"));
        column = Number(piece.getAttribute("column"));
    
        if(piece.id === "cannon"){
            var possibleRowsAndColumns = [ [row, column+1], [row, column-1] ];
        }
        else{
            var possibleRowsAndColumns = [ [row, column+1], [row, column-1], [row+1, column-1], [row+1, column], [row+1, column+1], [row-1, column-1], [row-1, column], [row-1, column+1] ];
        }
    
        possibleRowsAndColumns.forEach( arr => {
            let r = arr[0];
            let c = arr[1];
            if ( r<=8 && r>0 && c<=8 && c>0){
                let possibleSquaresIndex = ((r-1)*8 + c) - 1;
                if( !allSquares[possibleSquaresIndex].firstChild ) {
                    possibleMoves.push(possibleSquaresIndex);
                }
            }
        });
    }while(!possibleMoves.length)


    do{
        allSquares[((row-1)*8 + column) - 1].appendChild(piece);
        piecePosition[player][piece.id][Number(piece.getAttribute("piece-index"))] = ( (row-1)*8 + column ) - 1;

        notPlayable = 0;
        randomPositionIndex = Math.floor(Math.random() * (possibleMoves.length - 1));
        allSquares[possibleMoves[randomPositionIndex]].appendChild(piece);
        piecePosition[player][piece.id][Number(piece.getAttribute("piece-index"))] = possibleMoves[randomPositionIndex];

        checking = true;
        currentPlayer = botColour === 'blue'? 'red': 'blue';
        shoot();
        currentPlayer = botColour;
        shoot();
    }while(notPlayable)
    
    piece.setAttribute("row",allSquares[possibleMoves[randomPositionIndex]].getAttribute("row"));
    piece.setAttribute("column",allSquares[possibleMoves[randomPositionIndex]].getAttribute("column"));

    let action = {
        action: "move",
        piece : `${piece.className.slice(0, piece.className.indexOf(" "))} ${piece.id} ${piece.getAttribute("piece-index")}`,
        from: ( (row-1)*8 + column ) - 1,
        to: piecePosition[player][piece.id][Number(piece.getAttribute("piece-index"))],
        timeStamp: currentPlayer === "blue"? `${blueMinutes}:${blueSeconds}` : `${redMinutes}:${redSeconds}`
    }
    moveHistory.push(action);
    localStorage.setItem(`moveHistory${nthGame}`, JSON.stringify(moveHistory));

    checking = false;
    notPlayable = 0;
}