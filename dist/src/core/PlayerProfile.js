export class PlayerProfile {
    id;
    name;
    stats;
    energy = 100;
    form = 100;
    confidence = 50;
    level = 1;
    experience = 0;
    matchesPlayed = 0;
    matchesWon = 0;
    constructor(id, name, stats) {
        this.id = id;
        this.name = name;
        this.stats = this.createDefaultStats(stats);
    }
    createDefaultStats(overrides) {
        const defaultStats = {
            technical: {
                serve: 25,
                forehand: 25,
                backhand: 25,
                volley: 25,
                overhead: 25,
                drop_shot: 25,
                slice: 25,
                return: 25,
                spin: 25,
                placement: 25,
            },
            physical: {
                speed: 25,
                stamina: 25,
                strength: 25,
                agility: 25,
                recovery: 25,
            },
            mental: {
                focus: 25,
                anticipation: 25,
                shot_variety: 25,
                offensive: 25,
                defensive: 25,
            },
        };
        if (overrides) {
            if (overrides.technical) {
                Object.assign(defaultStats.technical, overrides.technical);
            }
            if (overrides.physical) {
                Object.assign(defaultStats.physical, overrides.physical);
            }
            if (overrides.mental) {
                Object.assign(defaultStats.mental, overrides.mental);
            }
        }
        return defaultStats;
    }
    getStatForShot(shotType) {
        const shotStatMapping = {
            'serve_first': 'serve',
            'serve_second': 'serve',
            'kick_serve': 'serve',
            'forehand': 'forehand',
            'backhand': 'backhand',
            'forehand_power': 'forehand',
            'backhand_power': 'backhand',
            'forehand_approach': 'forehand',
            'backhand_approach': 'backhand',
            'volley_forehand': 'volley',
            'volley_backhand': 'volley',
            'half_volley_forehand': 'volley',
            'half_volley_backhand': 'volley',
            'overhead': 'overhead',
            'defensive_overhead': 'overhead',
            'drop_shot_forehand': 'drop_shot',
            'drop_shot_backhand': 'drop_shot',
            'short_angle_forehand': 'drop_shot',
            'short_angle_backhand': 'drop_shot',
            'angle_shot_forehand': 'placement',
            'angle_shot_backhand': 'placement',
            'slice_forehand': 'slice',
            'slice_backhand': 'slice',
            'defensive_slice_forehand': 'slice',
            'defensive_slice_backhand': 'slice',
            'return_forehand': 'return',
            'return_backhand': 'return',
            'return_forehand_power': 'return',
            'return_backhand_power': 'return',
            'topspin_forehand': 'forehand',
            'topspin_backhand': 'backhand',
            'down_the_line_forehand': 'placement',
            'down_the_line_backhand': 'placement',
            'cross_court_forehand': 'placement',
            'cross_court_backhand': 'placement',
            'lob_forehand': 'placement',
            'lob_backhand': 'placement',
            'passing_shot_forehand': 'placement',
            'passing_shot_backhand': 'placement',
        };
        const statName = shotStatMapping[shotType];
        return this.stats.technical[statName];
    }
    getStat(statName) {
        if (statName in this.stats.technical) {
            return this.stats.technical[statName];
        }
        if (statName in this.stats.physical) {
            return this.stats.physical[statName];
        }
        if (statName in this.stats.mental) {
            return this.stats.mental[statName];
        }
        throw new Error(`Unknown stat name: ${statName}`);
    }
    updateStat(statName, value) {
        const clampedValue = Math.max(0, Math.min(100, value));
        if (statName in this.stats.technical) {
            this.stats.technical[statName] = clampedValue;
        }
        else if (statName in this.stats.physical) {
            this.stats.physical[statName] = clampedValue;
        }
        else if (statName in this.stats.mental) {
            this.stats.mental[statName] = clampedValue;
        }
        else {
            throw new Error(`Unknown stat name: ${statName}`);
        }
    }
    applyStatBoosts(boosts) {
        Object.entries(boosts).forEach(([statName, boost]) => {
            if (boost !== undefined) {
                const currentValue = this.getStat(statName);
                this.updateStat(statName, currentValue + boost);
            }
        });
    }
    get overallRating() {
        const technicalAvg = this.getStatCategoryAverage('technical');
        const physicalAvg = this.getStatCategoryAverage('physical');
        const mentalAvg = this.getStatCategoryAverage('mental');
        return Math.round(technicalAvg * 0.5 +
            physicalAvg * 0.3 +
            mentalAvg * 0.2);
    }
    getStatCategoryAverage(category) {
        const stats = this.stats[category];
        const values = Object.values(stats);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    getCurrentForm() {
        const energyFactor = this.energy / 100;
        const confidenceFactor = this.confidence / 100;
        const baseForm = 0.7 + (energyFactor * confidenceFactor * 0.4);
        return Math.max(0.5, Math.min(1.2, baseForm));
    }
    get playStyle() {
        const offensive = this.stats.mental.offensive;
        const defensive = this.stats.mental.defensive;
        const volley = this.stats.technical.volley;
        const serve = this.stats.technical.serve;
        const consistency = (this.stats.mental.focus + this.stats.mental.anticipation) / 2;
        let type;
        let description;
        if (volley >= 70 && serve >= 65) {
            type = 'serve_volley';
            description = 'Aggressive net player who serves and volleys';
        }
        else if (defensive >= 70 && offensive <= 50) {
            type = 'counterpuncher';
            description = 'Defensive specialist who waits for opportunities';
        }
        else if (offensive >= 70 && defensive <= 50) {
            type = 'aggressive';
            description = 'Attacking player who goes for winners';
        }
        else if (Math.abs(offensive - defensive) <= 15) {
            type = 'all_court';
            description = 'Versatile player comfortable anywhere on court';
        }
        else {
            type = 'defensive';
            description = 'Solid baseline player who focuses on consistency';
        }
        return {
            type,
            aggression: offensive,
            netApproach: volley,
            consistency,
            power: this.stats.physical.strength,
            description,
        };
    }
    get preferredSurface() {
        const serve = this.stats.technical.serve;
        const speed = this.stats.physical.speed;
        const defensive = this.stats.mental.defensive;
        const spin = this.stats.technical.spin;
        if (serve >= 70 && this.stats.technical.volley >= 65) {
            return 'grass';
        }
        if (defensive >= 65 && spin >= 60) {
            return 'clay';
        }
        return 'hard';
    }
    reduceEnergy(amount) {
        this.energy = Math.max(0, this.energy - amount);
    }
    restoreEnergy(amount) {
        this.energy = Math.min(100, this.energy + amount);
    }
    updateConfidence(matchResult, competitiveness) {
        if (matchResult === 'win') {
            this.confidence = Math.min(100, this.confidence + competitiveness * 5);
        }
        else {
            this.confidence = Math.max(0, this.confidence - competitiveness * 3);
        }
    }
    gainExperience(amount) {
        this.experience += amount;
        const newLevel = Math.floor(this.experience / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
        }
    }
    clone() {
        const clone = new PlayerProfile(this.id, this.name, this.stats);
        clone.energy = this.energy;
        clone.form = this.form;
        clone.confidence = this.confidence;
        clone.level = this.level;
        clone.experience = this.experience;
        clone.matchesPlayed = this.matchesPlayed;
        clone.matchesWon = this.matchesWon;
        return clone;
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            stats: this.stats,
            energy: this.energy,
            form: this.form,
            confidence: this.confidence,
            level: this.level,
            experience: this.experience,
            matchesPlayed: this.matchesPlayed,
            matchesWon: this.matchesWon,
        };
    }
    static fromJSON(data) {
        const player = new PlayerProfile(data.id, data.name, data.stats);
        player.energy = data.energy ?? 100;
        player.form = data.form ?? 100;
        player.confidence = data.confidence ?? 50;
        player.level = data.level ?? 1;
        player.experience = data.experience ?? 0;
        player.matchesPlayed = data.matchesPlayed ?? 0;
        player.matchesWon = data.matchesWon ?? 0;
        return player;
    }
    static createOpponent(name, targetRating) {
        const variance = 10;
        const generateStat = () => {
            const base = targetRating + (Math.random() - 0.5) * variance * 2;
            return Math.max(10, Math.min(90, Math.round(base)));
        };
        const stats = {
            technical: {
                serve: generateStat(),
                forehand: generateStat(),
                backhand: generateStat(),
                volley: generateStat(),
                overhead: generateStat(),
                drop_shot: generateStat(),
                slice: generateStat(),
                return: generateStat(),
                spin: generateStat(),
                placement: generateStat(),
            },
            physical: {
                speed: generateStat(),
                stamina: generateStat(),
                strength: generateStat(),
                agility: generateStat(),
                recovery: generateStat(),
            },
            mental: {
                focus: generateStat(),
                anticipation: generateStat(),
                shot_variety: generateStat(),
                offensive: generateStat(),
                defensive: generateStat(),
            },
        };
        return new PlayerProfile(`opponent_${Date.now()}`, name, stats);
    }
}
