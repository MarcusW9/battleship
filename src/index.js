import { createGameboard } from "./Gameboard.js";
import { displayController } from "./displayController.js";
import { createShip } from "./modules/Ship.js";

// 1. Initilialise the game controller 
const gameController = createGameController();

// 2. Pass it into displayController
displayController.init(gameController);