/**
 * Tournament storyline events.
 * Events and interactions relating to tournaments.
 */

import type { StoryEvent } from '../../types/storyEvents';

export const tournamentEvents: StoryEvent[] = [
    /** The Riverside Open */

    /**
     * This is the first tournament for the player and will serve as an introduction to some of the other first year players.
     * The player's ratings at this point are still usually quite low, meaning they've already beaten a club player but can't beat the regional competitors.
     * 
     * We should run them through four matches (if they win them all). The first will be against Keith and we will set his ratings quite low so the player will easily win.
     * Then we will slowly increase the ratings of the players and introduce up to 3 new characters. If the player loses one of these matches, we will have the loser's bracket and they will play out the same
     * opponents, but the dialogue will change to reflect that neither player is in contention anymore.
     *
     * If the player proceeds to win all 4 matches, we will crown them the club level champion. We will then have them face off against the regional champion, who will have much higher stats and
     * will likely defeat the player. The player should end this storyline feeling accomplishment if they win, and still boost their relationships with fellow players if they lose. 
     */

    // ==========================================
    // CEREMONY EVENTS
    // ==========================================

    {
        id: 'riverside_open_opening_ceremony',
        tags: ['tournament_ceremony'],
        name: 'Riverside Open Opening Ceremony',
        timeSlotsRequired: 0, // Doesn't consume time - informational event,
        prerequisites: {
            completedEvents: ['riverside_open_prep'],
        },
        skippable: false,
        description: 'The Riverside Open is about to begin!',
        dialogue: [
            [null, ['The sounds of triumphant brass fills the air and you can see balloons and streamers strewn across the courts.']],
            [null, ['A much bigger crowd than you expected. They came all the way out here to see this? The atmosphere is electric. You\'ve never played a match like this before.']],
            ['jen', ['I can\'t believe how many people are here! I think I see my parents!']],
            ['keith', ['This is your moment ', {characterId: 'keith'}, '! Go out there and show them. Show them all!']],
            ['jordan_rival', ['Hey ', {characterId: 'player'}, ', I\'m here to wish you good luck.']],
            ['jordan_rival', ['Not because I like you, but because we\'re on opposite sides of the bracket.']],
            ['jordan_rival', ['I need you to play your best so I can be the one to put you down in the finals. See you there!']],
            ['keith', ['You\'ll both need the luck. I play ', {characterId: 'player'}, ' in round 1. He\'s toast anyway.']],
            ['jordan_rival', ['I don\'t even know who you are.']],
            [null, ['A loudspeaker crackles to life and the announcer booms, "Welcome one and all to the annual Riverside Open! Let\'s get ready to see some tennis!"']],
        ],
        characters: ['jen', 'keith', 'jordan_rival'],
        options: [],
        defaultOutcome: {
            resultText: ['The brackets are released and the courts are assigned. Now is your chance to prove you belong here.'],
            effects: {
                statChanges: {
                    focus: 2,
                    stamina: 2,
                },
                scheduleNextTournamentMatch: true,
            }
        }
    },

    {
        id: 'riverside_open_victory',
        tags: ['tournament_ceremony'],
        name: 'Riverside Open Victory Ceremony',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'You won the Riverside Open!',
        dialogue: [
            [null, ['The crowd erupts as the final point is won. You did it. You actually did it.']],
            ['tournament_director', ['Ladies and gentlemen, please give a warm round of applause to our Riverside Open champion for the Club level, ', {characterId: 'player'}, '!']],
            [null, ['You only just now realize there are different divisions. In fact, you\'ve only managed to win the lowest tier.']],
            [null, ['You step up to the podium to be gifted the trophy. It\'s quite small, but it feels special to you anyway. You see yourself in the reflection.']],
            ['keith', ['You were amazing out there! I learned so much just watching you play. My little sister is not gonna believe this...']],
            ['jen', ['Congratulations! That final match was incredible. You really earned it. I think everyone was hoping for you to take down ', {characterId: 'jordan_rival'}, '.']],
            ['jordan_rival', ['You got lucky this time. It\'s a bad matchup for my beautiful and elegant style of tennis. I\'ll be training hard for our next match.']],
            ['coach_gonzalez', ['I can\'t believe you did it! And against one of my old students as well. You should be proud.']],
            ['coach_gonzalez', ['Now, let\'s go watch some actual tennis. The Regional tier matches are about to start.']],
            [null, ['As the ceremony concludes, you realize this is just the beginning. There are bigger tournaments ahead. The trophy doesn\'t hurt, though.']],
        ],
        characters: ['tournament_director', 'keith', 'jen', 'jordan_rival', 'coach_gonzalez'],
        options: [],
        defaultOutcome: {
            resultText: ['You are the Riverside Open champion for the Club level! Your confidence soars. Remember this feeling as you grow and improve.'],
            effects: {
                statChanges: {
                    focus: 5,
                    anticipation: 3,
                },
                moodChange: 20,
                tierChange: 2,
                relationshipChanges: {
                    keith: 10,
                    jen: 10,
                    jordan_rival: 5,
                    coach_gonzalez: 8,
                }
            }
        }
    },

    {
        id: 'riverside_open_elimination',
        tags: ['tournament_ceremony'],
        name: 'Moved to Consolation Bracket',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'You lost your match and moved to the consolation bracket.',
        dialogue: [
            [null, ['The loss stings. You watch your opponent celebrate as you pack up your bag.']],
            ['coach_gonzalez', ['Hey, chin up. This tournament isn\'t over yet.']],
            ['coach_gonzalez', ['You\'re in the consolation bracket now. You\'re only playing for pride now, but you still have matches to play.']],
            [null, ['You nod slowly. Not the result you wanted, but at least you\'re still playing.']],
            ['coach_gonzalez', ['Some of the best players have fought through their fair share of consolation matches. It builds character.']],
            ['coach_gonzalez', ['Now get some rest. You\'ve got another match coming up.']],
        ],
        characters: ['coach_gonzalez'],
        options: [],
        defaultOutcome: {
            resultText: ['You\'re in the consolation bracket now. Time to refocus and fight back.'],
            effects: {
                moodChange: -10,
                relationshipChanges: {
                    coach_gonzalez: 3,
                }
            }
        }
    },

    // ==========================================
    // ROUND 1: VS KEITH
    // ==========================================

    {
        id: 'riverside_r1_prematch_winner',
        tags: ['tournament_match'],
        name: 'Round 1: Before the Match',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'winner',
            tournamentRound: 0,
        },
        skippable: false,
        description: 'You prepare for your first tournament match against Keith.',
        dialogue: [
            ['keith', ['Hey ', {characterId: 'player'}, '! Looks like we\'re up first.']],
            ['keith', ['I\'ve been looking forward to this. Don\'t hold back, alright?']],
            [null, ['Keith extends his hand for a friendly handshake. His grip is firm but his smile is genuine.']],
            ['keith', ['May the best player win. Let\'s put on a good show!']],
        ],
        characters: ['keith'],
        options: [],
        defaultOutcome: {
            resultText: ['Time to step onto the court for your first tournament match.'],
            effects: {
                moodChange: 3,
            }
        }
    },

    {
        id: 'riverside_r1_prematch_loser',
        tags: ['tournament_match'],
        name: 'Round 1: Consolation Bracket',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'loser',
            tournamentRound: 0,
        },
        skippable: false,
        description: 'You face Keith in the consolation bracket.',
        dialogue: [
            ['keith', ['So we\'re both in the consolation bracket, huh?']],
            ['keith', ['Not quite how I imagined the tournament starting, but hey, we\'re still playing tennis.']],
            [null, ['Keith seems a bit deflated but he\'s putting on a brave face.']],
            ['keith', ['Let\'s make this a good match. We might not be playing for the championship, but we can still play our best.']],
        ],
        characters: ['keith'],
        options: [],
        defaultOutcome: {
            resultText: ['Time to prove yourself in the consolation bracket.'],
            effects: {
                moodChange: 1,
            }
        }
    },

    {
        id: 'riverside_r1_win',
        tags: ['tournament_match'],
        name: 'Round 1: Victory',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'You defeated Keith.',
        dialogue: [
            ['keith', ['Good match, ', {characterId: 'player'}, '! You really had me running out there.']],
            ['keith', ['I tried that backhand slice you showed me in practice, but you were ready for it every time!']],
            [null, [{characterId: 'keith'}, ' is breathing hard but grinning widely. He genuinely seems happy despite the loss.']],
            ['keith', ['Keep playing like that and you\'ll go all the way. I\'ll be cheering for you!']],
        ],
        characters: ['keith'],
        options: [],
        defaultOutcome: {
            resultText: ['You won your first tournament match! ', {characterId: 'keith'}, ' congratulates you warmly.'],
            effects: {
                moodChange: 8,
                relationshipChanges: {
                    keith: 8,
                }
            }
        }
    },

    {
        id: 'riverside_r1_loss',
        tags: ['tournament_match'],
        name: 'Round 1: Defeat',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'Keith defeated you.',
        dialogue: [
            ['keith', ['That was a great match! You really pushed me.']],
            [null, [{characterId: 'keith'}, ' offers his hand to help you up. His enthusiasm is a bit much right now.']],
            ['keith', ['Some of those shots you hit were incredible. I got lucky on a few key points.']],
            ['keith', ['Don\'t beat yourself up. First tournament is always tough. You\'ll get \'em next time!']],
        ],
        characters: ['keith'],
        options: [],
        defaultOutcome: {
            resultText: ['You lost to ', {characterId: 'keith'}, ', but he was gracious in victory.'],
            effects: {
                moodChange: -5,
                relationshipChanges: {
                    keith: 5,
                }
            }
        }
    },

    

    // ==========================================
    // ROUND 2: VS CHRIS
    // ==========================================

    {
        id: 'riverside_r2_prematch_winner',
        tags: ['tournament_match'],
        name: 'Round 2: Before the Match',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'winner',
            tournamentRound: 1,
        },
        skippable: false,
        description: 'You prepare to face Chris in the second round.',
        dialogue: [
            ['chris', ['Wow, we\'re both still in this! I can\'t believe I made the second round.']],
            ['chris', ['I\'ve been watching your matches. You\'ve really improved since I first saw you.']],
            [null, [{'characterId': 'chris'}, ' looks nervous but determined. You can tell he\'s been studying your game.']],
            ['chris', ['I\'m one of the other first years, but I\'m not holding back. This is my journey, too.']],
            ['chris', ['Good luck out there. Let\'s make it a match to remember!']],
        ],
        characters: ['chris'],
        options: [],
        defaultOutcome: {
            resultText: [{'characterId': 'chris'}, ' is a formidable opponent. This will test your resilience.'],
            effects: {
                moodChange: 3,
            }
        }
    },

    {
        id: 'riverside_r2_prematch_loser',
        tags: ['tournament_match'],
        name: 'Round 2: Consolation Bracket',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'loser',
            tournamentRound: 1,
        },
        skippable: false,
        description: 'You face Chris in the consolation bracket.',
        dialogue: [
            ['chris', ['Hey. Rough tournament for both of us, huh?']],
            ['chris', ['I sort of expected to be here, to be honest.']],
            [null, [{'characterId': 'chris'}, ' manages a small smile despite the disappointment.']],
            ['chris', ['Glad to meet you. I\'m one of the other first years. Looks like we both have some training to do.']],
            ['chris', ['Let\'s give it our all anyway. We didn\'t come this far to give up now.']],
        ],
        characters: ['chris'],
        options: [],
        defaultOutcome: {
            resultText: ['You and ', {characterId: 'chris'}, ' will battle it out in the consolation bracket.'],
            effects: {
                moodChange: 2,
            }
        }
    },

    {
        id: 'riverside_r2_win',
        tags: ['tournament_match'],
        name: 'Round 2: Victory',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'You defeated Chris.',
        dialogue: [
            ['chris', ['That was... wow. You were incredible out there.']],
            [null, [{characterId: 'chris'}, ' is catching his breath, but he\'s smiling genuinely.']],
            ['chris', ['I threw everything I had at you and you just kept coming back stronger.']],
            ['chris', ['I\'m not even mad. That was the best match I\'ve played all tournament.']],
            ['chris', ['Go win this whole thing, okay? I want to say I lost to the champion!']],
        ],
        characters: ['chris'],
        options: [],
        defaultOutcome: {
            resultText: [{characterId: 'chris'}, ' played brilliantly, but you found a way to win.'],
            effects: {
                moodChange: 6,
                relationshipChanges: {
                    chris: 5,
                }
            }
        }
    },

    {
        id: 'riverside_r2_loss',
        tags: ['tournament_match'],
        name: 'Round 2: Defeat',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'Chris defeated you.',
        dialogue: [
            ['chris', ['I... I can\'t believe I just did that!']],
            [null, [{characterId: 'chris'}, ' looks shocked at his own victory, then rushes to the net.']],
            ['chris', ['You were amazing. Every time I thought I had you, you pulled off something incredible.']],
            ['chris', ['Looks like I was able to take it this time. But I don\'t think I\'ll be so lucky the next time we play.']]
        ],
        characters: ['chris'],
        options: [],
        defaultOutcome: {
            resultText: [{characterId: 'keith'}, ' edges you out in a close match. You know you can catch him with a little work.'],
            effects: {
                moodChange: -6,
                relationshipChanges: {
                    chris: 4,
                }
            }
        }
    },

    // ==========================================
    // ROUND 3: VS ZACK
    // ==========================================

    {
        id: 'riverside_r3_prematch_winner',
        tags: ['tournament_match'],
        name: 'Round 3: Before the Match',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'winner',
            tournamentRound: 2,
        },
        skippable: false,
        description: 'You prepare to face Zack in the third round',
        dialogue: [
            ['zack', ['You ready for this? I hope you brought your A-game.']],
            ['zack', ['I\'ve been watching your matches. You\'re pretty good. But I\'m on a roll here.']],
            ['zack', ['Just remember, I don\'t plan on losing today. Not to a first year.']],
            ['coach_gonzalez', ['Stay focused out there. ', {characterId: 'zack'}, ' is a defensive menace. Pay attention to consistency.']]
        ],
        characters: ['zack', 'coach_gonzalez'],
        options: [],
        defaultOutcome: {
            resultText: [{characterId: 'zack'}, ' has an attitude but you can tell he can back it up. Prepare for a grind.'],
            effects: {
                moodChange: 5,
                statChanges: {
                    stamina: 3,
                    speed: 1
                }
            }
        }
    },

    {
        id: 'riverside_r3_prematch_loser',
        tags: ['tournament_match'],
        name: 'Round 3: Consolation Bracket',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'loser',
            tournamentRound: 2,
        },
        skippable: false,
        description: 'You face Zack in the consolation bracket.',
        dialogue: [
            ['zack', ['Didn\'t expect to see me in the consolation bracket, did you?']],
            ['zack', ['I had an off day. It happens to everyone.']],
            [null, [{characterId: 'zack'}, ' seems more relaxed here, less pressure without the main trophy on the line.']],
            ['zack', ['But that doesn\'t mean I\'m going easy on you. I still have my pride.']],
        ],
        characters: ['zack'],
        options: [],
        defaultOutcome: {
            resultText: ['Even in the consolation bracket, ', {characterId: 'zack'}, ' seems focused and determined.'],
            effects: {
                moodChange: 2,
            }
        }
    },

    {
        id: 'riverside_r3_win',
        tags: ['tournament_match'],
        name: 'Round 3: Victory',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'You defeated Zack!',
        dialogue: [
            ['zack', ['I can\'t believe I lost to you.']],
            ['zack', ['You played really well. I underestimated you.']],
            ['zack', ['Just wait until next time. I won\'t go easy on you again.']],
            ['coach_gonzalez', ['I can\'t believe it either! ', {characterId: 'zack'}, ' fought and fought.']],
            ['coach_gonzalez', ['Maybe I should be upping the fee for my lessons.']]
        ],
        characters: ['zack', 'coach_gonzalez'],
        options: [],
        defaultOutcome: {
            resultText: ['You defeated ', {characterId: 'zack'}, '! The finals are coming up. You can feel the pressure mounting.'],
            effects: {
                moodChange: 6,
                relationshipChanges: {
                    zack: 8,
                }
            }
        }
    },

    {
        id: 'riverside_r3_loss',
        tags: ['tournament_match'],
        name: 'Round 3: Defeat',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'Zack defeated you.',
        dialogue: [
            ['zack', ['Good match. You made me work for it.']],
            [null, [{characterId: 'zack'}, ' extends his hand. His grip is firm and respectful.']],
            ['zack', ['You\'ve got potential. Real potential. But you need more experience.']],
            ['coach_gonzalez', ['I\'m proud of you for making it this far. Learn from this experience.']],
            ['coach_gonzalez', ['Come on. You have laps to run after that performance.']]
        ],
        characters: ['zack', 'coach_gonzalez'],
        options: [],
        defaultOutcome: {
            resultText: ['Zack was too strong, but you learned so much from facing him.'],
            effects: {
                moodChange: -4,
                relationshipChanges: {
                    zack: 8,
                },
                statChanges: {
                    stamina: 2
                }
            }
        }
    },

    // ==========================================
    // ROUND 4: VS JORDAN
    // ==========================================

    {
        id: 'riverside_r4_prematch_winner',
        tags: ['tournament_match'],
        name: 'Round 4: Before the Match',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'winner',
            tournamentRound: 3,
        },
        skippable: false,
        description: 'You prepare to face Jordan in the championship.',
        dialogue: [
            [null, ['The crowd is massive now. This is the finals. This is everything.']],
            ['jordan_rival', ['Well, well. Looks like we both made it to the finals.']],
            ['jordan_rival', ['I told you I wanted to face you at your best. I hope you brought your A-game.']],
            [null, [{characterId: 'jordan_rival'}, ' is stretching methodically, eyes locked on you. This is personal.']],
            ['jordan_rival', ['No more talk. Let\'s see what you\'ve got on the court.']],
            ['coach_gonzalez', ['This is it, kid. Everything you\'ve trained for. Go out there and leave it all on the court.']],
        ],
        characters: ['jordan_rival', 'coach_gonzalez'],
        options: [],
        defaultOutcome: {
            resultText: [{characterId: 'jordan_rival'}, ' is ready for battle. This won\'t be easy.'],
            effects: {
                moodChange: 2,
                statChanges: {
                    focus: 2,
                    anticipation: 2,
                    offensive: 2,
                }
            }
        }
    },

    {
        id: 'riverside_r4_prematch_loser',
        tags: ['tournament_match'],
        name: 'Round 4: Consolation Bracket',
        timeSlotsRequired: 0,
        prerequisites: {
            activeTournament: 'riverside_open',
            tournamentBracket: 'loser',
            tournamentRound: 3,
        },
        skippable: false,
        description: 'You face Jordan in the consolation bracket.',
        dialogue: [
            ['jordan_rival', ['So we both stumbled already. Didn\'t think I\'d see you here.']],
            ['jordan_rival', ['This isn\'t the matchup I wanted, but at least one of us can salvage something from this tournament.']],
            [null, [{characterId: 'jordan_rival'}, ' looks frustrated but focused. There\'s still pride on the line.']],
            ['jordan_rival', ['Let\'s make this count. I\'m not going down twice.']],
        ],
        characters: ['jordan_rival'],
        options: [],
        defaultOutcome: {
            resultText: [{characterId: 'jordan_rival'}, ' wants redemption. So do you.'],
            effects: {
                moodChange: 1,
            }
        }
    },

    {
        id: 'riverside_r4_win',
        tags: ['tournament_match'],
        name: 'Round 4: Victory',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'You defeated Jordan.',
        dialogue: [
            [null, ['The final point. You can\'t believe it. You actually did it.']],
            ['jordan_rival', ['...']],
            [null, [{characterId: 'jordan_rival'}, ' stands at the net, hand outstretched but eyes looking elsewhere.']],
            ['jordan_rival', ['You played better today. I\'ll give you that.']],
            ['jordan_rival', ['Don\'t get comfortable though. I\'ll be working twice as hard for the next time we meet.']],
            [null, ['There\'s a hint of respect in ', {characterId: 'jordan_rival'}, '\'s voice, even if they won\'t admit it.']],
        ],
        characters: ['jordan_rival'],
        options: [],
        defaultOutcome: {
            resultText: ['You defeated your rival! ', {characterId: 'jordan_rival'}, ' begrudgingly acknowledges your victory.'],
            effects: {
                moodChange: 10,
                relationshipChanges: {
                    jordan_rival: 6,
                },
                statChanges: {
                    volley: 1,
                    overhead: 1,
                    dropShot: 1,
                    slice: 1,
                    return: 1,
                    speed: 1,
                    stamina: 1,
                    agility: 1,
                    recovery: 1,
                    shotVariety: 1,
                },
            }
        }
    },

    {
        id: 'riverside_r4_loss',
        tags: ['tournament_match'],
        name: 'Round 4: Defeat',
        timeSlotsRequired: 0,
        prerequisites: {},
        skippable: false,
        description: 'Jordan defeated you.',
        dialogue: [
            ['jordan_rival', ['Told you I was ready. Better luck next time.']],
            [null, [{characterId: 'keith'}, ' is barely suppressing a victorious grin.']],
            ['jordan_rival', ['You had some good moments out there, I\'ll admit. But when it mattered, I was better.']],
            ['jordan_rival', ['Keep training. Maybe one day you\'ll actually beat me.']],
            [null, ['The competitive fire in ', {characterId: 'jordan_rival'}, '\'s eyes suggests they genuinely want you to improve.']],
        ],
        characters: ['jordan_rival'],
        options: [],
        defaultOutcome: {
            resultText: [{characterId: 'jordan_rival'}, ' defeats you, but there\'s mutual respect forming between rivals.'],
            effects: {
                moodChange: -8,
                relationshipChanges: {
                    jordan_rival: 4,
                },
                statChanges: {
                    volley: 1,
                    slice: 1,
                    return: 1,
                    stamina: 1,
                    shotVariety: 1,
                },
            }
        }
    },
]