// Multiplayer functionaliteit
const socket = io(); // Zorg dat je Socket.IO hebt toegevoegd aan je HTML

const teamState = {
    teamId: null,
    teamNaam: '',
    spelers: [],
    isLeider: false
};

function maakTeam() {
    const teamNaam = prompt('Voer een teamnaam in:');
    if (teamNaam) {
        socket.emit('maakTeam', { teamNaam });
        teamState.teamNaam = teamNaam;
        teamState.isLeider = true;
    }
}

function deelneemTeam() {
    const teamCode = prompt('Voer de team code in:');
    if (teamCode) {
        const spelerNaam = prompt('Voer je naam in:');
        socket.emit('deelneemTeam', { teamCode, spelerNaam });
    }
}

socket.on('teamUpdate', (teamData) => {
    teamState.teamId = teamData.teamId;
    teamState.spelers = teamData.spelers;
    updateTeamWeergave();
});

socket.on('antwoordUpdate', (data) => {
    if (data.teamId === teamState.teamId) {
        updateTeamScore(data.score);
        toonTeamAntwoord(data.speler, data.correct);
    }
});

function updateTeamWeergave() {
    const teamDisplay = document.getElementById('team-display');
    teamDisplay.innerHTML = `
        <div class="team-info">
            <h3>Team: ${teamState.teamNaam}</h3>
            <p>Code: ${teamState.teamId}</p>
            <div class="spelers-lijst">
                ${teamState.spelers.map(speler => 
                    `<div class="speler">${speler.naam} (${speler.score})</div>`
                ).join('')}
            </div>
        </div>
    `;
}

const gameState = {
    teamCode: null,
    playerName: '',
    isHost: false
};

function startMultiplayer() {
    const playerName = prompt('Je naam:');
    if (playerName) {
        gameState.playerName = playerName;
        const choice = confirm('Wil je een nieuwe game starten? (OK voor nieuwe game, Cancel om deel te nemen)');
        
        if (choice) {
            createGame();
        } else {
            joinGame();
        }
    }
}

function createGame() {
    const gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    gameState.teamCode = gameCode;
    gameState.isHost = true;

    const gameRef = window.dbRef(`games/${gameCode}`);
    gameRef.set({
        host: gameState.playerName,
        players: {[gameState.playerName]: 0},
        currentQuestion: 0,
        active: true
    }).then(() => {
        alert(`Deel deze code met andere spelers: ${gameCode}`);
        showGameInterface();
    }).catch(error => {
        console.error("Error creating game:", error);
        alert("Er ging iets mis bij het maken van de game.");
    });
}

function joinGame() {
    const gameCode = prompt('Voer de game code in:').toUpperCase();
    if (gameCode) {
        window.dbOnValue(window.dbRef(window.db, `games/${gameCode}`), (snapshot) => {
            if (snapshot.exists()) {
                gameState.teamCode = gameCode;
                window.dbSet(window.dbRef(window.db, `games/${gameCode}/players/${gameState.playerName}`), 0);
                showGameInterface();
            } else {
                alert('Game niet gevonden!');
            }
        });
    }
}

function showGameInterface() {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'multiplayer-info';
    gameDiv.innerHTML = `
        <h3>Game Code: ${gameState.teamCode}</h3>
        <div id="players-list"></div>
    `;
    document.querySelector('#quiz-container').prepend(gameDiv);
    
    // Luister naar updates
    window.dbOnValue(window.dbRef(window.db, `games/${gameState.teamCode}`), updateGameState);
}

function updateGameState(snapshot) {
    const data = snapshot.val();
    const playersList = document.getElementById('players-list');
    if (playersList && data.players) {
        playersList.innerHTML = Object.entries(data.players)
            .map(([name, score]) => `
                <div class="player-card">
                    ${name}: ${score} punten
                </div>
            `).join('');
    }
} 
