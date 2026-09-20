import { createGameController } from "./modules/Controller.js";
import { displayController } from "./modules/displayController.js";

// Pass the callback into displayController to wait for user to enter name
displayController.init({
    onBeginGame : (typedName) => {
        // This code will run in index.js after being handed back by displayController

        // 1. Initilialise the game controller with the correct name
        const gameController = createGameController(typedName)
        // 2. Pass it into displayController
        displayController.resetGame(gameController)
    }
});