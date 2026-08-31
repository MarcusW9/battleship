const createShip = (length)  => {
    
    let hits = 0;

    const hit = () => {
            hits++
        }

    const isSunk = () => {
        return hits >= length
    }

    return {
        length,
        hit,
        getHits: () => hits,
        isSunk
    }
}

export { createShip } 