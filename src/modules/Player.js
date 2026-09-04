export const createPlayer = (name, isHuman = true) => {
    const playerName = name; 
    let won = false;
    const isHuman = false;
    const allMoves = []

    const attack = (gameboard, row, col) => {
        return gameboard.receiveAttack(row, col)
    }

    const generateAllMoves = (row = 10, col = 10) => {
        for (let i = 0; i< row; i++) {
            for (let x = 0; x < col; x ++) {
                allMoves.push([i, x])
            }
        }
    }

    if (isHuman === false) {
        generateAllMoves()
    }

    const movePicker = () => {
         return Math.floor(Math.random()*allMoves.length)
    }

    const computerMove = () => {
        const randomIndex = movePicker();
        const lastIndex = allMoves.length - 1;

        [allMoves[randomIndex], allMoves[lastIndex]] = [allMoves[lastIndex], allMoves[randomIndex]]
        return allMoves.pop()
    }

    return { 
        playerName,
        attack,
        computerMove,
        get hasWon() { return won },
        set hasWon(value) { won = value }
    }
}