const createShip = (type, customLength)  => {

    // Refer to presets for length if null / invalid fallback to customLength
    const length = SHIP_PRESETS[type] ?? customLength

    // 1. Guard against ship length of 0 or less
    if (length <= 0) {
        throw new Error(`Invalid ship length (${length}). Must be between 1 and 5.`)
    }

    // 2. Guard against ship length greater than 3
    if (length > 5) {
        throw new Error(`Invalid ship length (${length}). Must be between 1 and 5.`)
    }
    
    let hits = 0;

    const hit = () => {
            hits++
        }

    const isSunk = () => {
        return hits >= length
    }

    return {
        length,
        type,
        hit,
        getHits: () => hits,
        isSunk
    }
}

const SHIP_PRESETS = {
    Destroyer: 2,
    Submarine: 3,
    Cruiser: 3,
    Battleship: 4,
    Carrier: 5
}

export { createShip, SHIP_PRESETS } 