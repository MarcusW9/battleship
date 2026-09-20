import { createGameController } from "./modules/Controller.js";
import { displayController } from "./modules/displayController.js";


let admiralName = ""

// Pass the callback into displayController to wait for user to enter name
displayController.init({
    onBeginGame : (typedName) => {
        // This code will run in index.js after being handed back by displayController

        // 1. Store the name
        admiralName = typedName
        // 2. Initilialise the game controller with the correct name
        const gameController = createGameController(typedName)
        // 3. Pass it into displayController
        displayController.resetGame(gameController)
    }
});