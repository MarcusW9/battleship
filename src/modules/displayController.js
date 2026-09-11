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
        })
    }
}