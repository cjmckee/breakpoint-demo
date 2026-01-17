/**
 * Miscellaneous storyline events.
 * Events and interactions that don't fit into the main story structure.
 * 
 * These events should occur randomly throughout the player's journey for flavor and provide stat boosts, relationship changes, abilities, items, and other effects.
 */

import type { StoryEvent } from '../../types/storyEvents'

export const miscEvents: StoryEvent[] = [
    {
        id: 'disc_golf_adventure',
        name: 'Disc Golf Adventure',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'Some of your teammates invite you to the disc golf course out behind the courts.',
        dialogue: [
            ['sasha', ['Have you ever heard of disc golf? We found some old course behind the courts.']],
            ['greg', ['We asked around and managed to find a few used discs, too!']],
            ['keith', ['It\'s like regular golf, but with frisbees. How bad can it be?']],
        ],
        characters: ['sasha', 'greg', 'keith'],
        options: [
            {
                id: 'join_disc_golf',
                text: 'Join the disc golf game',
                description: 'Have some fun with your teammates!',
                emoji: '🏌️‍♂️',
                outcome: {
                    resultText: [
                        'You decide to join your teammates for a game of disc golf!',
                        'It\'s a fun and relaxing way to spend the afternoon. ', { characterId: 'keith' }, ' stands too close and takes a frisbee to the ankle.'
                    ],
                    effects: {
                        energyChange: -10,
                        statChanges: {
                            slice: 3,
                            shotVariety: 1,
                            placement: 1
                        },
                        relationshipChanges: {
                            sasha: 5,
                            greg: 5,
                            keith: -5
                        }
                    }
                }
            },
            {
                id: 'send_keith',
                text: 'Send Keith to join the game',
                description: 'You encourage Keith to join the game instead.',
                emoji: '🪂',
                outcome: {
                    resultText: [
                        'You suggest that Keith take your place in the game.',
                        'You didn\'t really want to get your tennis shoes dirty. Against all odds, it turns out that ', {characterId: 'keith'}, ' is a natural at disc golf!',
                    ],
                    effects: {
                        energyChange: 0,
                        statChanges: {
                            stamina: 3,
                        },
                        relationshipChanges: {
                            sasha: 2,
                            greg: 2,
                            keith: 10
                        }
                    }
                }
            },
            {
                id: 'decline_disc_golf',
                text: 'Decline the invitation',
                description: 'You have other plans. You need to get back to practice anyway.',
                emoji: '🚫',
                outcome: {
                    resultText: [
                        'You politely decline the invitation.',
                        'You can tell your teammates are a little disappointed.'
                    ],
                    effects: {
                        energyChange: 5,
                        statChanges: {
                            recovery: 3
                        },
                        relationshipChanges: {
                            sasha: -2,
                            greg: -2,
                            keith: -5
                        }
                    }
                }
            }
        ]
    },

    {
        id: 'local_farmers_market',
        name: 'Local Farmers Market',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'You visit the local farmer\'s market to browse some organic options.',
        dialogue: [
            [null, ['What you didn\'t expect was the huge crowd of slow walkers meandering about and blocking your path.']],
            [null, ['Navigating the crowd seems to be a skill of its own. But the stall selling 40% off strawberries closes in 10 minutes.']]
        ],
        characters: [],
        options: [
            {
                id: 'dodge_and_weave_crowd',
                text: 'Dodge and weave through the crowd',
                description: 'You try to navigate through the crowd to reach the stall in time.',
                emoji: '🏃‍♂️',
                outcome: {
                    resultText: [
                        'You expertly weave through the crowd, avoiding slow walkers with ease.',
                        'Old ladies clutching their organic produce glare at you as you zip by.',
                        'You reach the stall just in time to grab the last box of discounted strawberries!'
                    ],
                    effects: {
                        energyChange: -5,
                        statChanges: {
                            speed: 3,
                            agility: 3
                        },
                    }
                }
            },

            {
                id: 'take_it_slow',
                text: 'Take it slow and steady',
                description: 'You decide to take your time and enjoy the atmosphere.',
                emoji: '🚶‍♂️',
                outcome: {
                    resultText: [
                        'You stroll through the market, taking in the sights and smells.',
                        'You arrive at the stall just as they are closing, but the vendor gives you a sympathetic smile and lets you buy a box of strawberries at full price.'
                    ],
                    effects: {
                        energyChange: 10,
                        statChanges: {
                            anticipation: 2,
                            recovery: 2,
                            spin: 1
                        },
                    }
                }
            }
        ]
    },

    {
        id: 'coding_class',
        name: 'Coding Class',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'You attend a coding class to improve your skills.',
        dialogue: [
            [null, ['You wake up in a cold sweat. You\'ve had an inspiration. You\'ve been sent a divine quest to create something amazing: a tennis RPG.']],
            [null, ['It\'s brilliant. Why hasn\'t anyone done this before? You rush to your computer and start typing furiously.']],
            [null, ['You realize in this furious burst of creativity that you actually have no idea how to code a game. Or code at all.']],
            [null, ['The instructor begins with an overview of the day\'s topics. Your eyes glaze over.']]
        ],
        characters: [],
        options: [],
        defaultOutcome: {
            resultText: [
                'You fell asleep during the lecture. Maybe coding isn\'t for you.',
                'Your dreams are filled with pixelated tennis players and epic matches. Could that be you someday?'
            ],
            effects: {
                energyChange: 10,
                statChanges: {
                    focus: -2,
                    anticipation: -1,
                    agility: -1,
                    placement: 3
                },
            }
        }
    },

    {
        id: 'batting_cage_hangout',
        name: 'Batting Cage Hangout',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'You spend some time at the batting cage to work on your swing.',
        dialogue: [
            [null, ['You step up to the plate, bat in hand, and take a deep breath.']],
            [null, ['The first pitch comes in fast, and you swing as hard as you can.']],
            [null, ['You miss completely, stumbling forward as the ball whizzes by.']],
            [null, ['You can feel the eyes of the other patrons on you. You turn to bunt. You whiff.']]
        ],
        characters: [],
        options: [],
        defaultOutcome: {
            resultText: [
                'You spend the next hour swinging and missing, but you can feel yourself getting better.',
                'By the end of your session, you\'ve hit a few balls and gained some confidence.'
            ],
            effects: {
                energyChange: 5,
                statChanges: {
                    forehand: 1,
                    backhand: 1,
                    slice: 1,
                    return: 1,
                },
            }
        }
    },

    {
        id: 'attend_football_game',
        name: 'Attend Football Game',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'You attend a local football game to relax and enjoy the atmosphere.',
        dialogue: [
            [null, ['You arrive at the stadium and find your seat. The energy in the air is electric.']],
            [null, ['The game begins, and you find yourself getting caught up in the excitement.']],
            [null, ['You cheer for your team, feeling a sense of camaraderie with the other fans.']],
            ['keith', ['You want anything from the concession stand? They sell a bucket of hotdogs now. It\'s exactly what it sounds like.']],
            ['jen', ['I\'m still looking around for the merch table. #10 is just so cute! I hope they have a jersey in my size.']],
            [null, ['As the game progresses, you can\'t help but analyze the players\' techniques. And how cute #10 is.']]
        ],
        characters: ['keith', 'jen'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You leave the game feeling inspired and motivated to improve your own skills.',
                'You had a great time with ', {characterId: 'keith'}, ' and ', {characterId: 'jen'}, '. It\'s fun to see them off the court.'
            ],
            effects: {
                energyChange: -10,
                moodChange: 5,
                statChanges: {
                    offensive: 1,
                    defensive: 1,
                    speed: 1,
                    agility: 1
                },
                relationshipChanges: {
                    keith: 2,
                    jen: 2
                }
            }
        }
    },

    {
        id: 'team_hotpot_dinner',
        name: 'Team Hotpot Dinner',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'You go out for a hotpot dinner with the team to bond and relax.',
        dialogue: [
            [null, ['The smell of spicy broth fills the air as you gather around the table.']],
            [null, ['The atmosphere is warm and friendly, and you\'re happy to get to share this meal with your teammates.']],
            ['keith', ['I love hotpot! Sharing is caring. Excuse me! Fork please!.']],
            ['jen', ['I hope they have enough soy sauce. It makes all the difference! We\'re going to need a LOT of it.']],
            [null, ['As you enjoy the meal, you can\'t help but feel grateful for your team.']]
        ],
        characters: ['keith', 'jen'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You leave the dinner feeling closer to your teammates and more motivated to work together.',
                'The food was delicious, and ', {characterId: 'keith'}, ' made such a mess, you decided to leave an extra tip.'
            ],
            effects: {
                energyChange: 15,
                moodChange: 10,
                statChanges: {
                    stamina: 2,
                    recovery: 2
                },
                relationshipChanges: {
                    keith: 5,
                    jen: 5,
                }
            }
        }
    },

    {
        id: 'club_team_keith_story',
        name: 'To Keith or Not to Keith',
        tags: ['team', 'friend'],
        timeSlotsRequired: 0,
        prerequisites: {
            completedEvents: ['club_team_first_practice']
        },
        skippable: true,
        description: 'Keith pulls you aside after Academy team practice.',
        dialogue: [
            ['keith', ['Pssst. ', {characterId: 'player'}, '. Come over here. Yes. Behind the bleachers.']],
            ['player', ['You can propose to me out here, ', {characterId: 'keith'}, '.']],
            [null, [{characterId: 'keith'}, ' pulls you behind the bleachers. You bonk your head. Probably deserved for that.']],
            ['keith', ['Okay, look. I don\'t think I belong on this team. In fact, I definitely don\'t belong on this team.']],
            ['player', ['You didn\'t play that bad...']],
            ['keith', ['No. I mean there was another ', {characterId: 'keith'}, ' during tryouts. I killed him.']],
            ['keith', ['Okay, not really. But seriously, during the tryouts I noticed there was another player who was way better than me, with the same name!']],
            ['keith', ['I wanted to wish him luck, so I chatted with him outside the bathroom. I offered to hold his tryout number for him.']],
            ['keith', ['The coach came by at that exact moment and marked attendance, and now I\'m on the team. I haven\'t told anyone.']],
            ['player', ['Wow, that\'s quite the story. I don\'t think I believe you. What happened to this other ', {characterId: 'keith'}, '?']],
            ['keith', ['When he found out he didn\'t make the team, he transferred academies!']],
            ['player', ['So he\'s nowhere to be found, either? Hard to believe a story like that, ', {characterId: 'keith'}, '.']],
        ],
        characters: ['keith'],
        options: [],
        defaultOutcome: {
            resultText: [
                {characterId: 'keith'}, ' is not very good, but is he so bad that he\'s actually a fake ', {characterId: 'keith'}, '?',
                'Actually, you find that more believable than him making the team. But he\'s a good friend, and you decide to support him anyway.'
            ],
            effects: {
                moodChange: 10,
                energyChange: 10,
                relationshipChanges: {
                    keith: 5
                },
                statChanges: {
                    focus: -4,
                    agility: 2,
                    speed: 2,
                    anticipation: -1,
                    recovery: 2
                }
            }
        }
    }
];
