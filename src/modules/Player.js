export const createPlayer = (name, isHuman = true) => {
    const playerName = name; 
    let won = false;
    const allMoves = []
    const activeHits = []

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

        const targets = getTargets()
        if (targets.length > 0) {
            const [row, col] = targets[0]
            takeFromAllMoves(row, col)        
            return [row, col]
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

    // Function to check the result of a hit and record
    const recordResult = (row, col, status) => {
        if (status === 'hit') {
            activeHits.push([row, col])
        } else if (status === 'sunk') {
            activeHits.length = 0
        }
    }
   
    const isUntried = (row, col) => allMoves.some(([mr, mc]) => mr === row && mc === col)

    const getTargets = () => {

        // Prioritise lines
        const line = findLineTargets().filter(([r, c]) => isUntried(r, c))
        if (line.length > 0) return line

        // If not prioritise available neighbours
        return activeHits
            .flatMap(([r, c]) => findNeighbourTargets(r, c))
            .filter(([r, c]) => isUntried(r, c))
    }

    const findNeighbourTargets = (row, col) => {
        const neighbours = [[row - 1, col], [row + 1, col], [row, col + 1], [row, col - 1]]
        return neighbours
    }

    const findLineTargets = () => {
        if (activeHits.length < 2) return []
        
        const sameRow = activeHits.every(([r]) => r === activeHits[0][0])
        if (sameRow) {
            const row = activeHits[0][0]
            const cols = activeHits.map(([, c]) => c)
            return [[row, Math.min(...cols) - 1], [row, Math.max(...cols) + 1]]
        }

        const sameCol = activeHits.every(([, c]) => c === activeHits[0][1])
        if (sameCol) {
            const col = activeHits[0][1]
            const rows = activeHits.map(([r, ]) => r)
            return [[Math.min(...rows) - 1, col], [Math.max(...rows) + 1, col]]
        }
        return []
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