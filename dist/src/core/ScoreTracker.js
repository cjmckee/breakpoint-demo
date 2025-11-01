export class ScoreTracker {
    score;
    constructor(matchFormat = { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: false, tiebreakAt: 6 }) {
        this.score = this.createInitialScore(matchFormat);
    }
    createInitialScore(matchFormat) {
        return {
            sets: [{
                    player: 0,
                    opponent: 0,
                    winner: undefined,
                    isComplete: false,
                }],
            currentGame: {
                server: 0,
                returner: 0,
                advantage: undefined,
                isDeuce: false,
            },
            currentServer: 'player',
            isMatchComplete: false,
            winner: undefined,
            matchFormat,
        };
    }
    addPoint(winner) {
        const currentSet = this.getCurrentSet();
        const pointWinner = this.convertToServerReturner(winner);
        this.addPointToGame(pointWinner);
        if (this.isGameComplete()) {
            const gameWinner = this.getGameWinner();
            const gameWinnerAsPlayer = this.convertFromServerReturner(gameWinner);
            this.addGameToSet(gameWinnerAsPlayer);
            this.score.currentGame = {
                server: 0,
                returner: 0,
                advantage: undefined,
                isDeuce: false,
            };
            this.switchServer();
            if (this.isSetComplete()) {
                const setWinner = this.getSetWinner();
                currentSet.winner = setWinner;
                currentSet.isComplete = true;
                if (this.isMatchComplete()) {
                    this.score.isMatchComplete = true;
                    this.score.winner = this.getMatchWinner();
                }
                else {
                    this.score.sets.push({
                        player: 0,
                        opponent: 0,
                        winner: undefined,
                        isComplete: false,
                    });
                }
            }
        }
    }
    addPointToGame(winner) {
        const game = this.score.currentGame;
        if (winner === 'server') {
            game.server++;
        }
        else {
            game.returner++;
        }
        if (game.server >= 3 && game.returner >= 3) {
            if (game.server === game.returner) {
                game.isDeuce = true;
                game.advantage = undefined;
            }
            else if (game.server === game.returner + 1) {
                game.isDeuce = false;
                game.advantage = 'server';
            }
            else if (game.returner === game.server + 1) {
                game.isDeuce = false;
                game.advantage = 'returner';
            }
        }
        else {
            game.isDeuce = false;
            game.advantage = undefined;
        }
    }
    isGameComplete() {
        const game = this.score.currentGame;
        if ((game.server >= 4 && game.server - game.returner >= 2) ||
            (game.returner >= 4 && game.returner - game.server >= 2)) {
            return true;
        }
        return false;
    }
    getGameWinner() {
        const game = this.score.currentGame;
        if (game.server >= 4 && game.server - game.returner >= 2) {
            return 'server';
        }
        if (game.returner >= 4 && game.returner - game.server >= 2) {
            return 'returner';
        }
        return undefined;
    }
    addGameToSet(winner) {
        const currentSet = this.getCurrentSet();
        if (winner === 'player') {
            currentSet.player++;
        }
        else {
            currentSet.opponent++;
        }
    }
    isSetComplete() {
        const currentSet = this.getCurrentSet();
        const gamesPerSet = this.score.matchFormat.gamesPerSet;
        if ((currentSet.player >= gamesPerSet && currentSet.player - currentSet.opponent >= 2) ||
            (currentSet.opponent >= gamesPerSet && currentSet.opponent - currentSet.player >= 2)) {
            return true;
        }
        if ((currentSet.player === gamesPerSet + 1 && currentSet.opponent >= gamesPerSet - 1) ||
            (currentSet.opponent === gamesPerSet + 1 && currentSet.player >= gamesPerSet - 1)) {
            return true;
        }
        if (this.score.matchFormat.enableTiebreaks &&
            currentSet.player === this.score.matchFormat.tiebreakAt &&
            currentSet.opponent === this.score.matchFormat.tiebreakAt) {
            return (currentSet.player > this.score.matchFormat.tiebreakAt ||
                currentSet.opponent > this.score.matchFormat.tiebreakAt);
        }
        if (!this.score.matchFormat.enableTiebreaks &&
            currentSet.player === gamesPerSet &&
            currentSet.opponent === gamesPerSet) {
            return (currentSet.player > gamesPerSet || currentSet.opponent > gamesPerSet);
        }
        return false;
    }
    getSetWinner() {
        const currentSet = this.getCurrentSet();
        const gamesPerSet = this.score.matchFormat.gamesPerSet;
        if ((currentSet.player >= gamesPerSet && currentSet.player - currentSet.opponent >= 2) ||
            (currentSet.player === gamesPerSet + 1 && currentSet.opponent >= gamesPerSet - 1)) {
            return 'player';
        }
        if ((currentSet.opponent >= gamesPerSet && currentSet.opponent - currentSet.player >= 2) ||
            (currentSet.opponent === gamesPerSet + 1 && currentSet.player >= gamesPerSet - 1)) {
            return 'opponent';
        }
        return undefined;
    }
    isMatchComplete() {
        const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
        const completedSets = this.score.sets.filter(set => set.isComplete);
        const playerSetsWon = completedSets.filter(set => set.winner === 'player').length;
        const opponentSetsWon = completedSets.filter(set => set.winner === 'opponent').length;
        return playerSetsWon >= setsToWin || opponentSetsWon >= setsToWin;
    }
    getMatchWinner() {
        const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
        const completedSets = this.score.sets.filter(set => set.isComplete);
        const playerSetsWon = completedSets.filter(set => set.winner === 'player').length;
        const opponentSetsWon = completedSets.filter(set => set.winner === 'opponent').length;
        if (playerSetsWon >= setsToWin) {
            return 'player';
        }
        if (opponentSetsWon >= setsToWin) {
            return 'opponent';
        }
        return undefined;
    }
    switchServer() {
        this.score.currentServer = this.score.currentServer === 'player' ? 'opponent' : 'player';
    }
    convertToServerReturner(winner) {
        if (this.score.currentServer === winner) {
            return 'server';
        }
        return 'returner';
    }
    convertFromServerReturner(winner) {
        if (winner === 'server') {
            return this.score.currentServer;
        }
        return this.score.currentServer === 'player' ? 'opponent' : 'player';
    }
    getCurrentSet() {
        return this.score.sets[this.score.sets.length - 1];
    }
    getScore() {
        return { ...this.score };
    }
    getCurrentSetGames() {
        const currentSet = this.getCurrentSet();
        return {
            player: currentSet.player,
            opponent: currentSet.opponent,
        };
    }
    getScoreString() {
        const currentSet = this.getCurrentSet();
        const game = this.score.currentGame;
        const pointsToTennis = (points, advantage, isDeuce) => {
            if (isDeuce)
                return 'Deuce';
            if (advantage === 'server')
                return 'Ad';
            if (advantage === 'returner')
                return 'Ad';
            switch (points) {
                case 0: return '0';
                case 1: return '15';
                case 2: return '30';
                case 3: return '40';
                default: return '40';
            }
        };
        const playerGames = currentSet.player;
        const opponentGames = currentSet.opponent;
        const playerIsServer = this.score.currentServer === 'player';
        let playerPoints, opponentPoints;
        if (game.isDeuce) {
            playerPoints = opponentPoints = 'Deuce';
        }
        else if (game.advantage) {
            if ((game.advantage === 'server' && playerIsServer) ||
                (game.advantage === 'returner' && !playerIsServer)) {
                playerPoints = 'Ad';
                opponentPoints = '';
            }
            else {
                playerPoints = '';
                opponentPoints = 'Ad';
            }
        }
        else {
            const playerGamePoints = playerIsServer ? game.server : game.returner;
            const opponentGamePoints = playerIsServer ? game.returner : game.server;
            playerPoints = pointsToTennis(playerGamePoints);
            opponentPoints = pointsToTennis(opponentGamePoints);
        }
        let scoreString = `${playerGames}-${opponentGames}`;
        if (!this.score.isMatchComplete) {
            if (playerPoints === 'Deuce' || opponentPoints === 'Deuce') {
                scoreString += ', Deuce';
            }
            else {
                scoreString += `, ${playerPoints}-${opponentPoints}`;
            }
        }
        return scoreString;
    }
    getScoreSnapshot() {
        return {
            timestamp: Date.now(),
            gameScore: { ...this.score.currentGame },
            setScore: { ...this.getCurrentSet() },
            currentServer: this.score.currentServer,
            momentum: 0,
        };
    }
    isComplete() {
        return this.score.isMatchComplete;
    }
    getWinner() {
        return this.score.winner;
    }
    setInitialServer(server) {
        this.score.currentServer = server;
    }
    getCurrentServer() {
        return this.score.currentServer;
    }
    isKeyMoment() {
        const game = this.score.currentGame;
        const currentSet = this.getCurrentSet();
        if (this.score.currentServer === 'player') {
            if ((game.returner >= 3 && game.server <= 3) ||
                (game.advantage === 'returner')) {
                return true;
            }
        }
        else {
            if ((game.server >= 3 && game.returner <= 3) ||
                (game.advantage === 'server')) {
                return true;
            }
        }
        const gamesPerSet = this.score.matchFormat.gamesPerSet;
        if ((currentSet.player >= gamesPerSet - 1 && currentSet.opponent <= gamesPerSet - 2) ||
            (currentSet.opponent >= gamesPerSet - 1 && currentSet.player <= gamesPerSet - 2)) {
            return true;
        }
        if (this.isSetComplete()) {
            const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
            const completedSets = this.score.sets.filter(set => set.isComplete);
            const playerSetsWon = completedSets.filter(set => set.winner === 'player').length;
            const opponentSetsWon = completedSets.filter(set => set.winner === 'opponent').length;
            if (playerSetsWon === setsToWin - 1 || opponentSetsWon === setsToWin - 1) {
                return true;
            }
        }
        return false;
    }
    getBreakPointFor() {
        const game = this.score.currentGame;
        if (this.score.currentServer === 'player') {
            if ((game.returner === 3 && game.server < 3) ||
                (game.advantage === 'returner')) {
                return 'opponent';
            }
        }
        else {
            if ((game.returner === 3 && game.server < 3) ||
                (game.advantage === 'returner')) {
                return 'player';
            }
        }
        return undefined;
    }
    reset(matchFormat) {
        const format = matchFormat || this.score.matchFormat;
        this.score = this.createInitialScore(format);
    }
}
