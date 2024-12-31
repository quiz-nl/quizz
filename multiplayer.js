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

    const gameRef = firebase.database().ref(`games/${gameCode}`);
    gameRef.set({
        host: gameState.playerName,
        players: {[gameState.playerName]: 0},
        currentQuestion: 0,
        active: true,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log("Game created successfully");
        alert(`Deel deze code met andere spelers: ${gameCode}`);
        showGameInterface();
    }).catch(error => {
        console.error("Error creating game:", error);
        alert("Er ging iets mis bij het maken van de game: " + error.message);
    });
}

function joinGame() {
    const gameCode = prompt('Voer de game code in:').toUpperCase();
    if (gameCode) {
        const gameRef = firebase.database().ref(`games/${gameCode}`);
        gameRef.once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    gameState.teamCode = gameCode;
                    return gameRef.child(`players/${gameState.playerName}`).set(0);
                } else {
                    throw new Error('Game niet gevonden!');
                }
            })
            .then(() => {
                console.log("Successfully joined game");
                showGameInterface();
            })
            .catch(error => {
                console.error("Error joining game:", error);
                alert(error.message);
            });
    }
}

function showGameInterface() {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'multiplayer-info animate__animated animate__fadeIn';
    gameDiv.innerHTML = `
        <h3>🎮 Game Code: ${gameState.teamCode}</h3>
        <div class="game-status">
            <p>Speler: ${gameState.playerName}</p>
            <div id="players-list" class="players-grid"></div>
        </div>
        ${gameState.isHost ? `
            <div class="host-controls">
                <button onclick="startGameForAll()" class="btn">Start Game voor Iedereen</button>
            </div>
        ` : ''}
    `;
    
    document.querySelector('#quiz-container').prepend(gameDiv);
    
    // Luister naar updates
    const gameRef = firebase.database().ref(`games/${gameState.teamCode}`);
    gameRef.on('value', updateGameState);
}

function startGameForAll() {
    if (gameState.isHost) {
        window.dbRef(`games/${gameState.teamCode}`).update({
            gameStarted: true,
            currentQuestion: 0
        });
    }
}

function updateGameState(snapshot) {
    const data = snapshot.val();
    if (!data) return;

    const playersList = document.getElementById('players-list');
    if (playersList && data.players) {
        playersList.innerHTML = Object.entries(data.players)
            .map(([name, score]) => `
                <div class="player-card animate__animated animate__fadeIn">
                    <div class="player-info">
                        <span class="player-name">${name}</span>
                        <span class="player-score">${score} pts</span>
                    </div>
                </div>
            `).join('');
    }
}

// Debug functie
window.testFirebase = function() {
    const testRef = firebase.database().ref('test');
    testRef.set({
        test: 'Dit is een test'
    }).then(() => {
        console.log('Firebase test succesvol');
        alert('Firebase connectie werkt!');
    }).catch(error => {
        console.error('Firebase test mislukt:', error);
        alert('Firebase connectie mislukt: ' + error.message);
    });
}; 
