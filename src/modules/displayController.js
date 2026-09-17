import { createGameController } from "./Controller.js";
import { createGameboard } from "./Gameboard.js";
import { SHIP_PRESETS, createShip } from "./Ship.js"

const fleetQueue = Object.entries(SHIP_PRESETS).map(([shipType, length]) => ({
        shipType,
        length
    }))

let currentShipIndex = 0;
let currentDirection = "horizontal";

export const displayController = {
        init(gameController) {
   
        const setupScreen = document.querySelector("#setup-screen")
        const startForm = document.querySelector("#start-form")
        const playerInputName = document.querySelector("#player-name")

        const battleScreen = document.querySelector("#battle-screen")

        const headerTitle = document.querySelector("#header-title")
        const headerText = document.querySelector("#header-text")

        
        startForm.addEventListener("submit", (e) => {
        e.preventDefault();

            // 1. Store player name
            const admiralName = playerInputName.value.trim() || "Admiral"

            // 2. Switch screens
            setupScreen.classList.add("hidden");
            battleScreen.classList.remove("hidden")
            headerTitle.classList.add("hidden") 

            // 3. Assign correct name to UI 
            headerText.textContent = `Admiral ${admiralName}, your ships await your orders!`

            // 4. Setup board
            this.setupPlacementPhase(gameController)
        })
    },

    renderBoard(boardElement, gameboard, isPlayerOne = true) {
        boardElement.innerHTML = "";
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell")
                cell.dataset.x = row;
                cell.dataset.y = col;

                const isShip = gameboard.board[row][col]
                const attackStatus = gameboard.getAttackStatus(row, col)

                // Only reveal ship positions if it's the owner viewing their own board
                // On every refresh check: 
                // 1. If it is player one or not (so that not all ships are visible to the player)
                // 2. If the cell has a ship on it in which case it is visible
                if (isPlayerOne && isShip !== null) {
                    cell.classList.add("placed")
                }

                //If it is not player one then it must be player two's board
                if (attackStatus === "miss") {
                    cell.classList.add("miss")
                } else if (attackStatus === "hit") {
                        if (isShip && isShip.isSunk()) { 
                        cell.classList.add("sunk")
                    } else {cell.classList.add("hit")}
                }
                boardElement.appendChild(cell);
            }
        }
    },

    setupPlacementPhase(gameController) {
        const placementBoard = document.querySelector("#placement-board")
        this.renderBoard(placementBoard, gameController.player1Gameboard)
        
        const rotateShipBtn = document.querySelector("#rotate-ship-btn")
        const startBtn = document.querySelector("#start-battle-btn")

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
            
            const currentShipHover = this.getShipCoordinates(
                currentCellRow, 
                currentCellCol,  
                currentShip.length,
                currentDirection)

            const currentHoverValidity = gameController.player1Gameboard.isPlacementValid(
                currentCellRow, 
                currentCellCol,
                currentShip.length,
                currentDirection
            )
            
            for (const coordinates of currentShipHover) {
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
        
            const result = gameController.player1Gameboard.placeShip (
                currentCellRow, 
                currentCellCol, 
                shipInstance, 
                currentDirection 
            )

            if (result.success) { 
                currentShipIndex++ 
                this.renderBoard(placementBoard, gameController.player1Gameboard)

                if (currentShipIndex >= fleetQueue.length) {
                    // 1. Clear rotate button
                    const rotateBtn = document.querySelector("#rotate-ship-btn")
                    rotateBtn.classList.add("hidden")

                    //2. 
                    startBtn.addEventListener("click", () => {
                        this.startBattlePhase(gameController)
                    })
                }
            }
        })

        // Rotating a ship with the button
        rotateShipBtn.addEventListener("click", () => {
            this.rotateShip()
        })
    },

    getShipCoordinates(startingRow, startingCol, length, direction) {
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

    startBattlePhase(gameController) {

        const placementBoard = document.querySelector("#placement-container")
        const combatContainer = document.querySelector("#combat-container")

        // 1. Generate player 2 board (Computer) automatically
        gameController.player2Gameboard.automaticallyPlaceShips()

        // 2. Grab the two battle boards
        const player1BoardElement = document.querySelector("#player-one-board")
        const player2BoardElement = document.querySelector("#player-two-board")

        // 3. Render the boards and generate combat view
        this.renderBoard(player1BoardElement, gameController.player1Gameboard, true)
        this.renderBoard(player2BoardElement, gameController.player2Gameboard, false)
        combatContainer.classList.remove("hidden")

        // 4. Change DOM
        placementBoard.classList.add("hidden")

        this.handlePlayerAttack(gameController)
    },

    handlePlayerAttack(gameController) {
        const player1BoardElement = document.querySelector("#player-one-board");
        const player2BoardElement = document.querySelector("#player-two-board")

        player2BoardElement.addEventListener("click", (e) => {

            // Guard if the target is not a cell
            if (!e.target.classList.contains("cell")) return;

            const targetCellRow = Number(e.target.dataset.x)
            const targetCellCol = Number(e.target.dataset.y)

            // 1. Play human turn
            const playerTurn = gameController.playTurn(targetCellRow, targetCellCol);
            if (!playerTurn.success) return;

            // Render updated computer board
            this.renderBoard(player2BoardElement, gameController.player2Gameboard, false);

            if (playerTurn.status === "win") {
                alert(playerTurn.message);
                return;
            }
            // 2. Play computer turn automatically
            const computerTurn = gameController.automaticComputerMove();

            // Render updated human board
            this.renderBoard(player1BoardElement, gameController.player1Gameboard, true);

            if (computerTurn?.status === "win") {
                alert(computerTurn.message);
            }
        })
    }
}
