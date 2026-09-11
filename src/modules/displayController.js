import { SHIP_PRESETS } from "./Ship"

const fleetQueue = Object.entries(SHIP_PRESETS).map(([shipType, length]) => ({
        shipType,
        length
    }))

let currentShipIndex = 0;
let currentDirection = "horizontal";

export const displayController = {
        init() {
   
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
            this.setupPlacementPhase()
        })
    },

    renderBoard(boardElement) {
        boardElement.innerHTML = "";
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell")
                cell.dataset.x = row;
                cell.dataset.y = col;
                boardElement.appendChild(cell);
            }
        }
    },

    setupPlacementPhase() {
        const placementBoard = document.querySelector("#placement-board")
        this.renderBoard(placementBoard)
            
        // 1. Event listener to detect a hover on the board
        placementBoard.addEventListener("mouseover",(e) => {
            
            // Guard for if not a cell
            if (!e.target.classList.contains("cell")) return;
            
            const currentCellRow = Number(e.target.dataset.x)
            const currentCellCol = Number(e.target.dataset.y)

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
    }
}
