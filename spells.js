const spellButton = document.getElementById("spellButton");
const POPUP_TIME = 3000;
let redSpellCount = MAX_SPELL_COUNT, blueSpellCount = MAX_SPELL_COUNT;

spellButton.onclick = () => {

    if(blueSpellCount<0) blueSpellCount = 0;
    if(redSpellCount<0) redSpellCount = 0;

    if( !(currentPlayer === "blue"? blueSpellCount-- : redSpellCount--) ) return;

    allSquares.forEach( square => {
        if(square.firstChild)
            square.firstChild.addEventListener("dblclick", passThroughSpell);
    } )

    spellButton.classList.add("enabled");
    spellButton.classList.add("selected");

    popupDisplay("Double click on a piece to apply spell");
}

function passThroughSpell(e){

    spellButton.classList.remove("enabled");
    allSquares.forEach( square => {
        if(square.firstChild)
            square.firstChild.removeEventListener("dblclick", passThroughSpell);
    } )
    
    let targetPiece = e.target;

    targetPiece.setAttribute("pass-through", true);

    popupDisplay("Spell added!");

}