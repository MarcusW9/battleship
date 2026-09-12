import { SHIP_PRESETS, createShip } from "./Ship"

const fleetQueue = Object.entries(SHIP_PRESETS).map(([shipType, length]) => ({
        shipType,
        length
    }))

let currentShipIndex = 0;
let currentDirection = "horizontal";

export const displayController = {
        init(player1Gameboard) {
   
        const setupScreen = document.querySelector("#setup-screen")
        const startForm = document.querySelector("#start-form")
        const playerInputName = document.querySelector("#player-name")

        const battleScreen = document.querySelector("#battle-screen")
        const playerTitle = document.querySelector("#player-title")
        
        startForm.addEventListener("submit", (e) => {
        e.preventDefault();

            // 1. Store player name
            const admiralName = playerInputName.value.trim() || "Admiral"

            // 2. Switch screens
            setupScreen.classList.add("hidden");
            battleScreen.classList.remove("hidden")

            // 3. Assign correct name to UI 
            playerTitle.textContent = `Awaiting your orders ${admiralName}`

            // 4. Setup board
            this.setupPlacementPhase(player1Gameboard)
        })
    },

    renderBoard(boardElement, gameboardArray) {
        boardElement.innerHTML = "";
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell")
                cell.dataset.x = row;
                cell.dataset.y = col;

                // On every refresh check the cell does not have a ship on the script board
                if (gameboardArray[row][col] !== null) {
                    cell.classList.add("placed")
                }
                boardElement.appendChild(cell);
            }
        }
    },

    setupPlacementPhase(player1Gameboard) {
        const placementBoard = document.querySelector("#placement-board")
        this.renderBoard(placementBoard, player1Gameboard.board)
        
        const rotateShipBtn = document.querySelector("#rotate-ship-btn")
            
        // 1. Event listener to detect a hover on the board
        placementBoard.addEventListener("mouseover",(e) => {
            
            // Guard for if not a cell
            if (!e.target.classList.contains("cell")) return;
            
            const currentCellRow = Number(e.target.dataset.x)
            const currentCellCol = Number(e.target.dataset.y)

            const currentShip = fleetQueue[currentShipIndex]
            const currentShipHover = this.getShipCoordinaates(
                currentCellRow, 
                currentCellCol, 
                currentDirection, 
                currentShip.length)
        })

         placementBoard.addEventListener('click', (e) => {
        
        // Guard for if not a cell
            if (!e.target.classList.contains("cell")) return;
            if (currentShipIndex >= fleetQueue.length) return;

            const currentShip = fleetQueue[currentShipIndex]
            const shipInstance = createShip(currentShip.shipType)

        // If it works
            const currentCellRow = Number(e.target.dataset.x)
            const currentCellCol = Number(e.target.dataset.y)
        
            const result = player1Gameboard.placeShip (
                currentCellRow, 
                currentCellCol, 
                shipInstance, 
                currentDirection 
            )
            
            if (result.success) { 
                currentShipIndex++ 
                this.renderBoard(placementBoard, player1Gameboard.board)
            }
        })

        // Rotating a ship with the button
        rotateShipBtn.addEventListener('click', () => {
            this.rotateShip()
        })
    },

    getShipCoordinaates(startingRow, startingCol, direction, length) {
        const coordinates = []
        for (let i = 0; i < length; i++) {
            if (direction === "horizontal") {
        // Row stays fixed, Column increases
                coordinates.push({ 
                    row: startingRow, 
                    col: startingCol + i 
                });    
            } else if (direction === "vertical") {
                coordinates.push({
                    row: startingRow + i,
                    col: startingCol
                });
            }
        }
        return coordinates
    },

    rotateShip() {
        return currentDirection = currentDirection === "horizontal" ? "vertical" : "horizontal"
    }
}
