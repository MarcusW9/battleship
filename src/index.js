import { createGameController } from "./Controller.js";
import { displayController } from "./displayController.js";

// 1. Initilialise the game controller 
const gameController = createGameController();

// 2. Pass it into displayController
displayController.init(gameController);