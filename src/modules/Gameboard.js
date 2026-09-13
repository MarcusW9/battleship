import { createShip, SHIP_PRESETS } from "./Ship.js"

const createGameboard = () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    const trackedHits = new Set()
    const ships = []
    

    const isPlacementValid = (row, col, shipLength, direction) => {

        // 1. Guard against invalid ship length
        if (!shipLength || shipLength <= 0 || typeof shipLength !== 'number') return {
            success: false,
            status: 'invalid', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'Invalid ship length of less than 0',
        };

        // 2. Guard against negative starting coordinates
        if (row < 0 || col < 0) return {
            success: false,
            status: 'invalid', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'Out of bounds',   
        };

        // 3. Direction-specific bounds checking
        if (col + shipLength > board[0].length && direction === 'horizontal') return {
            success: false,
            status: 'invalid', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'Out of bounds',   
        };
        
        if (row + shipLength > board.length && direction === 'vertical') return {
            success: false,
            status: 'invalid', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'Out of bounds',   
        };

        // 4. Direction-specific ship overlap checking
    for (let i = 0; i < shipLength; i++) {
            if (direction === 'horizontal' && board[row][col+i] != null) return {
            success: false,
            status: 'invalid', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'The chosen position is overlapping another ship',   
        }; 
            if (direction === 'vertical' && board[row+i][col] != null) return {
            success: false,
            status: 'invalid', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'The chosen position is overlapping another ship',
            };
        }

        return {
            success: true,
            status: 'valid', 
            message: 'The chosen position is valid',
        };
    }


    const placeShip = (row, col, ship, direction) => {

        // 1. Call helper function to check if the placement is valid
        const placementCheck = isPlacementValid(row, col, ship.length, direction)

        if (!placementCheck.success) return placementCheck

        // 2. Place the ship onto the board
        for (let i = 0; i < ship.length; i++) {
            if (direction === 'horizontal') {
                board[row][col+i] = ship
            } else if (direction === 'vertical') {
                board[row+i][col] = ship
            }
        }

        // 3. Log succesful ship placement and add to total ships
        ships.push(ship)
        return {
            success: true,
            status: 'placed', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'Succesful ship placement',   
        }; 
    }

    const automaticallyPlaceShips = () => {

        const generateRandomRow = () => {
                return Math.floor(Math.random()*board[0].length)
            }
        const generateRandomCol = () => {
                return Math.floor(Math.random()*board.length)
            }
        const generateRandomDirection = () => {
                const randomNumber = Math.ceil((Math.random())*100) 
                if (randomNumber > 50) { 
                    return 'horizontal' 
                } else {
                    return 'vertical'
                }
            }
        
        for (const shipType of Object.keys(SHIP_PRESETS)) {
            let didShipPlace = false

            // Loop until a succesful placed object is returned
            while (didShipPlace === false) {
                // Create a new ship of the one we currently are adding 
                // each loop so we don't modify the original 
                const shipTemplate = createShip(shipType)

                // Object is returned with a 'Success : true /false'
                const placeShipReturnObject = placeShip(
                    generateRandomRow(), 
                    generateRandomCol(), 
                    shipTemplate, 
                    generateRandomDirection()
                )
                didShipPlace = placeShipReturnObject.success
            }
        }
    }

    const receiveAttack = (row, col) => {
        // 1. Guard against out of bounds hit
        if (row < 0 || col < 0 || row >= board.length || col >= board[0].length) return { 
                success: false,
                status: 'invalid', 
                message: 'This attack is out of bounds',
                data : { row, col }
            }

        // 2. Guard for if hit already placed on the cell
        if (trackedHits.has(`${row},${col}`)) return { 
                success: false,
                status: 'invalid', 
                message: 'We have already attacked this location',
                data : { row, col }
            }

        // 3. Check for no ship trigger hit and return miss
        if (board[row][col] === null) {
            trackedHits.add(`${row},${col}`)
            return { 
                success: true,
                status: 'miss', 
                message: 'Our attack fired and missed!',
                data : { row, col }
            }
        }
        // 4. Trigger a hit on the coordinate if there is a ship
        board[row][col].hit()
        trackedHits.add(`${row},${col}`)

        // 5. Return sunk if the boat hit is now sunk
        if (board[row][col].isSunk()) {
            return { 
                success: true,
                status: 'sunk', 
                message: 'You have sunk the ship!',
                data : { row, col }
            }
        }
        // Return his if boat is hit but not sunk
        return { 
                success: true,
                status: 'hit', 
                message: 'Your attack hit the ship!',
                data : { row, col }
        }
    }

    const allShipsSunk = () => {
        // 1. Guard if no ships no need to check sunk
        if (ships.length === 0) return false;

        // 2. Guard to prevent an empty board with no ships winning the game
        for (let i = 0; i < ships.length; i++) {

        // 3. isSunk() returns false if the ship is alive and returns false
            if (!ships[i].isSunk()) return false;
        }

        // 4. if all ships are sunk the loop finishes and returns true
        return true
    }
    
    return {
        board,
        isPlacementValid,
        placeShip,
        automaticallyPlaceShips,
        receiveAttack,
        allShipsSunk
    };
};

export { createGameboard } 