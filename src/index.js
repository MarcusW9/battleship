import { createGameboard } from "./Gameboard.js";
import { displayController } from "./displayController.js";
import { createShip } from "./modules/Ship.js";

// 1. Create the player's gameboard instance
const player1Gameboard = createGameboard();

// 2. Pass it into displayController
displayController.init(player1Gameboard);