# For my own future reference 

# Battleship Project Notes

## How to setup via terminal commands the file structure

### File Creation
- Create modules: `touch src/modules/Gameboard.js`
- Create multiple files: `touch tests/gameboard.test.js tests/ship.test.js`
- Create nested directory + file: `mkdir -p src/modules && touch src/modules/Gameboard.js`
 
### Cleanup & Safe Deletion
- Check directory contents: `ls -la path/to/folder`
- Target specific folder for deletion: `rm -rf src/tests`

### Running Tests
- Run all Jest tests: `npx jest`
- Run single test file: `npx jest tests/gameboard.test.js`

---

## Import / Export Path Cheat Sheet

From `tests/gameboard.test.js` to `src/modules/Gameboard.js`:
```js
import Gameboard from '../src/modules/Gameboard.js';