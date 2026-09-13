import { createGameboard } from "./Gameboard";
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

    renderBoard(boardElement, gameboardArray, isPlayerOne = true) {
        boardElement.innerHTML = "";
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell")
                cell.dataset.x = row;
                cell.dataset.y = col;

                // Only reveal ship positions if it's the owner viewing their own board
                // On every refresh check: 
                // 1. If it is player one or not (so that not all ships are visible to the player)
                // 2. If the cell has a ship on it in which case it is visible
                if (isPlayerOne && gameboardArray[row][col] !== null) {
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

        placementBoard.addEventListener("mouseleave", (e) => {
            this.clearHover(placementBoard)
        })
            
        // 1. Event listener to detect a hover on the board
        placementBoard.addEventListener("mouseover",(e) => {
            
            // Guard for if not a cell
            if (!e.target.classList.contains("cell")) return;
            // Guard for it all ships already placed
            if (currentShipIndex >= fleetQueue.length) return

            // Clear from any previous hovers 
            this.clearHover(placementBoard)
            
            const currentCellRow = Number(e.target.dataset.x)
            const currentCellCol = Number(e.target.dataset.y)

            const currentShip = fleetQueue[currentShipIndex]
            
            const currentShipHover = this.getShipCoordinaates(
                currentCellRow, 
                currentCellCol, 
                currentDirection, 
                currentShip.length)

            const currentHoverValidity = player1Gameboard.isPlacementValid(
                currentCellRow, 
                currentCellCol,
                currentShip.length,
                currentDirection
            )
            
            for (const coordinates of this.getShipCoordinaates(
                currentCellRow, 
                currentCellCol,
                currentShip.length,
                currentDirection
            )) {
                // 1. Target the cell in this loop
                const targetCell = document.querySelector(`[data-x="${coordinates.row}"][data-y="${coordinates.col}"]`)

                if (!targetCell) continue

                // 2. If valid add the class
                if (currentHoverValidity.success) {
                    targetCell.classList.add("valid-placement")
                } else if (!currentHoverValidity.success) {
                    targetCell.classList.add("invalid-placement")
                }
            }
        })

         placementBoard.addEventListener("click", (e) => {
        
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

                if (currentShipIndex >= fleetQueue.length) {
                    this.startBattlePhase(player1Gameboard)
                }
            }
        })

        // Rotating a ship with the button
        rotateShipBtn.addEventListener("click", () => {
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

    clearHover(boardElement) {
        boardElement.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove("valid-placement", "invalid-placement")
        })
    },

    rotateShip() {
        return currentDirection = currentDirection === "horizontal" ? "vertical" : "horizontal"
    },

    startBattlePhase(player1Gameboard) {

        // 1. Clear the rotate button
        const rotateBtn = document.querySelector("#rotate-ship-btn")
        rotateBtn.classList.add("hidden")


        // 2. Generate player 2 board (Computer) automatically
        const player2Gameboard = createGameboard()
        player2Gameboard.automaticallyPlaceShips()

        // 3. Grab the two battle boards
        const player1BoardElement = document.querySelector("#player-one-board")
        const player2BoardElement = document.querySelector("#player-two-board")

        // 4. Render the boards
        this.renderBoard(player1BoardElement, player1Gameboard.board, true)
        this.renderBoard(player2BoardElement, player2Gameboard.board, false)
    }
}
