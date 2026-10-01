export const createPlayer = (name, isHuman = true) => {
    const playerName = name; 
    let won = false;
    const allMoves = []
    const targetQueue = []

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

        // 1. Guard against if human player, no need to run this
        if (isHuman === true) return null 

        // 2. Hijack if found a hit
        if (targetQueue.length > 0) {
            return targetQueue.pop()
        }

        const randomIndex = movePicker();
        const lastIndex = allMoves.length - 1;

        // Swap-and-pop a random move (Fisher-Yates shuffle algorithm) 
        [allMoves[randomIndex], allMoves[lastIndex]] = [allMoves[lastIndex], allMoves[randomIndex]] // Tuple swap pattern
        return allMoves.pop()
    }

    // Function to accept an index and then remove it from the all moves
    const takeFromAllMoves = (row, col) => { 
        const index = allMoves.findIndex(([r, c]) =>  r === row && c === col)
        if (index === -1) return false

        const lastIndex = allMoves.length - 1;
        [allMoves[index], allMoves[lastIndex]] = [allMoves[lastIndex], allMoves[index]];
        allMoves.pop();
        return true
    }

    // Function to check the result of a hit and generate hunter attacks from it 
    const recordResult = (row, col, status) => {
    if (status === 'hit') {
        const neighbours = findTargets(row, col)
        for (const [r, c] of neighbours) {
            if (takeFromAllMoves(r, c)) {
                targetQueue.push([r, c])
                } 
            } 
        } else if (status === 'sunk') {
            targetQueue.length = 0
        }
    }

    const findTargets = (row, col) => {
        const neighbours = [[row - 1, col], [row + 1, col], [row, col + 1], [row, col - 1]]
        return neighbours
    }

    return { 
        playerName,
        attack,
        computerMove,
        recordResult,
        get isHuman() { return isHuman },
        get hasWon() { return won },
        set hasWon(value) { won = value }
    }
}