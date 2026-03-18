/**
 * Miscellaneous storyline events.
 * Events and interactions that don't fit into the main story structure.
 * 
 * These events should occur randomly throughout the player's journey for flavor and provide stat boosts, relationship changes, abilities, items, and other effects.
 */

import type { StoryEvent } from '../../types/storyEvents'
import { ChallengeManager } from '../../game/ChallengeManager'
import { BANANA, LUCKY_PENNY, MOTIVATIONAL_PLAYLIST, TENNIS_BALL_KEYCHAIN, ENERGY_DRINK, ICE_BATH_VOUCHER, STRAWBERRIES, ORANGE_SLICE } from '../items'
import {
    CHALLENGE_SLICE_SPECIALIST,
    CHALLENGE_TOUCH_ARTIST,
    CHALLENGE_OVERHEAD_AUTHORITY,
    CHALLENGE_NEED_FOR_SPEED,
    CHALLENGE_NET_DOMINATOR,
    CHALLENGE_IRON_RECOVERY,
    CHALLENGE_WINNER_MACHINE,
    CHALLENGE_WALL_CLIMBER,
    CHALLENGE_PRECISION_CUTTER,
    CHALLENGE_ESCAPE_ARTIST,
} from '../challengeTemplates'

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
                        },
                        itemsGained: [LUCKY_PENNY],
                    },
                    challengesAssigned: [
                        ChallengeManager.createFromTemplate(CHALLENGE_SLICE_SPECIALIST, {
                            type: 'story',
                            eventId: 'disc_golf_adventure',
                        }),
                    ],
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
                        itemsGained: [STRAWBERRIES],
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
                },
                itemsGained: [TENNIS_BALL_KEYCHAIN],
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
                },
                itemsGained: [MOTIVATIONAL_PLAYLIST],
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
    },

    {
        id: 'ping_pong_hustler',
        name: 'The Ping Pong Hustler',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 12
        },
        skippable: true,
        description: 'A mysterious old man challenges you to ping pong in the tennis center lobby.',
        dialogue: [
            [null, ['You had a session planned with ', {characterId: 'keith'}, ' in ten minutes, but he\'s nowhere to be seen.']],
            [null, ['An old man in sandals and tube socks waves you over to the ping pong table.']],
            [null, ['He doesn\'t say a word. He just points at the paddle.']],
            [null, ['You pick it up. He serves. You return it casually, but the rally starts to slowly pick up intensity.']],
            [null, ['Soon you find yourself in a furious rally, chasing shots left and right, while the old man just laughs.']],
            [null, ['He takes the ball under the table and makes a huge motion to the right, and the ball looks like it will land easily on your side.']],
            [null, ['But the ball touches the table and bounces what feels like 18 feet to the left instead. You are left stunned.']],
            ['old_man', ['Again.']]
        ],
        characters: ['old_man'],
        options: [
            {
                id: 'play_ping_pong',
                text: 'Keep playing him',
                description: 'You\'re not leaving until you beat this guy.',
                emoji: '🏓',
                outcome: {
                    resultText: [
                        'You play for two hours straight. You win zero games.',
                        'But somewhere around game 22, you feel like you\'ve seen behind the curtain. Your touch shots improve dramatically.',
                        'He leaves without saying goodbye. You never see him again.'
                    ],
                    effects: {
                        energyChange: -15,
                        statChanges: {
                            dropShot: 3,
                            slice: 3,
                            spin: 2
                        },
                    },
                    challengesAssigned: [
                        ChallengeManager.createFromTemplate(CHALLENGE_TOUCH_ARTIST, {
                            type: 'story',
                            eventId: 'ping_pong_hustler',
                        }),
                    ],
                }
            },
            {
                id: 'challenge_doubles',
                text: 'Bring Keith as your doubles partner',
                description: 'Two on one should be fair, right?',
                emoji: '👥',
                outcome: {
                    resultText: [
                        {characterId: 'keith'}, ' finally arrives in full tennis gear.',
                        'The old man beats you both simultaneously. ', {characterId: 'keith'}, ' is in shock.',
                        'But watching his finesse up close teaches you both something about net play.'
                    ],
                    effects: {
                        energyChange: -10,
                        statChanges: {
                            dropShot: 2,
                            volley: 2,
                            slice: 1
                        },
                        relationshipChanges: {
                            keith: 5
                        }
                    }
                }
            }
        ]
    },

    {
        id: 'volleyball_beach_day',
        name: 'Beach Volleyball Day',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 14
        },
        skippable: true,
        description: 'The team heads to the beach to relax and unwind.',
        dialogue: [
            ['jen', ['Beach day! Who\'s ready for some volleyball?']],
            ['keith', ['I bought the biggest net they had at the store!']],
            ['austin', ['Uh, ', {characterId: 'keith'}, ', that\'s a fishing net. And a huge one at that.']],
            [null, ['Fortunately, there are public nets available.']],
            [null, ['You quickly realize that spiking a volleyball is surprisingly similar to hitting an overhead smash.']],
            [null, ['Turns out some of your teammates are pretty good!']]
        ],
        characters: ['jen', 'keith', 'austin'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You spend the afternoon spiking and diving. Your overhead motion feels more natural than ever.',
                {characterId: 'keith'}, ' got sunburned with the fishing net sitting on him. The design is impressive.'
            ],
            effects: {
                energyChange: -20,
                moodChange: 15,
                statChanges: {
                    overhead: 4,
                    strength: 3,
                    agility: 2
                },
                relationshipChanges: {
                    jen: 3,
                    keith: 3,
                    austin: 3
                }
            },
            challengesAssigned: [
                ChallengeManager.createFromTemplate(CHALLENGE_OVERHEAD_AUTHORITY, {
                    type: 'story',
                    eventId: 'volleyball_beach_day',
                }),
            ],
        }
    },

    {
        id: 'chased_by_geese',
        name: 'The Goose Incident',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 8
        },
        skippable: true,
        description: 'You take a shortcut through the park on the wrong side of town.',
        dialogue: [
            [null, ['You finish up some errands before morning practice, and decide to cut through the park.']],
            [null, ['You notice a flock of geese near the path. They notice you too.']],
            [null, ['They\'ve managed to pick up some plastic cutlery. This could get ugly.']],
            [null, ['They begin to charge.']]
        ],
        characters: [],
        options: [
            {
                id: 'sprint_away',
                text: 'Sprint for your life',
                description: 'RUN.',
                emoji: '🏃',
                outcome: {
                    resultText: [
                        'You kick into a gear that you yourself didn\'t know you had.',
                        'You make it to the fence and clear it in one impressive jump. The sound of angry honks hauntingly close behind you.',
                        'You arrive at practice 10 minutes early, drenched in sweat, and refuse to talk about it.'
                    ],
                    effects: {
                        energyChange: -15,
                        statChanges: {
                            speed: 4,
                            agility: 3,
                            recovery: 2
                        },
                    },
                    challengesAssigned: [
                        ChallengeManager.createFromTemplate(CHALLENGE_NEED_FOR_SPEED, {
                            type: 'story',
                            eventId: 'chased_by_geese',
                        }),
                    ],
                }
            },
            {
                id: 'stand_ground',
                text: 'Stand your ground',
                description: 'You are a competitive athlete. You will not be bullied by birds.',
                emoji: '🦆',
                outcome: {
                    resultText: [
                        'You decide to take on the geese head on.',
                        'They are surprisingly intimidating up close. You begin to reconsider your life choices.',
                        'You know what, maybe today we just go around.'
                    ],
                    effects: {
                        energyChange: -5,
                        moodChange: -10,
                        statChanges: {
                            strength: -2,
                            overhead: -2,
                            recovery: -2
                        },
                    }
                }
            }
        ]
    },

    {
        id: 'grocery_cart_racing',
        name: 'Midnight Grocery Run',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 15
        },
        skippable: true,
        description: 'A late-night grocery run takes a competitive turn.',
        dialogue: [
            [null, ['You and ', {characterId: 'keith'}, ' are making a snack run after practice.']],
            ['keith', ['I need bananas. And protein bars. And those little cheese wheels.']],
            [null, ['It\'s midnight and the store is completely empty. ', {characterId: 'keith'}, ' grabs a shopping cart and gets a running start down the cereal aisle.']],
            ['keith', ['RACE ME.']]
        ],
        characters: ['keith'],
        options: [
            {
                id: 'race_keith',
                text: 'Accept the challenge',
                description: 'You grab a cart. It\'s on.',
                emoji: '🛒',
                outcome: {
                    resultText: [
                        'You and ', {characterId: 'keith'}, ' tear through the chips aisle at reckless speeds.',
                        'You powerslide around the frozen foods section. ', {characterId: 'keith'}, ' takes out an entire display of paper towels.',
                        'Security is less than pleased, but they do appreciate the drift you managed around the ice cream freezer.'
                    ],
                    effects: {
                        energyChange: -10,
                        moodChange: 15,
                        statChanges: {
                            speed: 3,
                            agility: 2,
                            shotVariety: 2
                        },
                        relationshipChanges: {
                            keith: 8
                        }
                    },
                    challengesAssigned: [
                        ChallengeManager.createFromTemplate(CHALLENGE_WINNER_MACHINE, {
                            type: 'story',
                            eventId: 'grocery_cart_racing',
                        }),
                    ],
                }
            },
            {
                id: 'shop_normally',
                text: 'Shop like a normal person',
                description: 'You have a reputation to uphold.',
                emoji: '🧺',
                outcome: {
                    resultText: [
                        'You shop responsibly while ', {characterId: 'keith'}, ' laps the store three times.',
                        'You pick up some healthy snacks and watch security tackle him from a distance.',
                        'The checkout clerk gives you a sympathetic look. Not their first time with ', {characterId: 'keith'}, '.'
                    ],
                    effects: {
                        energyChange: 5,
                        statChanges: {
                            recovery: 3,
                            stamina: 1
                        },
                        relationshipChanges: {
                            keith: 2
                        },
                        itemsGained: [BANANA],
                    }
                }
            }
        ]
    },

    {
        id: 'backyard_badminton',
        name: 'Backyard Badminton Tournament',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 18
        },
        skippable: true,
        description: 'Your neighbor is hosting a surprisingly competitive backyard badminton tournament.',
        dialogue: [
            [null, ['Your neighbor has strung up a badminton net between two trees. There are brackets posted on the garage door.']],
            [null, ['There are at least 15 people here. Someone is dressed up as a ref. This is way more serious than you expected.']],
            [null, ['It turns out they\'re looking for another to even out the teams. You might as well hop in.']]
        ],
        characters: [],
        options: [],
        defaultOutcome: {
            resultText: [
                'You and your partner make it to the semifinals before losing to a 12-year-old who clearly does this professionally.',
                'Constant net exchanges and overhead smashes gave your reflexes a real workout.',
                'The kid offered to coach you. You politely declined. You\'ll get your revenge someday.'
            ],
            effects: {
                energyChange: -15,
                moodChange: 5,
                statChanges: {
                    volley: 3,
                    shotVariety: 2,
                    overhead: 2,
                    dropShot: 1
                },
            },
            challengesAssigned: [
                ChallengeManager.createFromTemplate(CHALLENGE_NET_DOMINATOR, {
                    type: 'story',
                    eventId: 'backyard_badminton',
                }),
            ],
        }
    },

    {
        id: 'juggling_lessons',
        name: 'Street Performer Encounter',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'A street performer offers to teach you to juggle.',
        dialogue: [
            [null, ['You\'re headed back to the Academy and see a street performer in the plaza. He\'s juggling five tennis balls while riding a unicycle.']],
            [null, ['He spots your tennis bag and tosses you a ball mid-routine.']],
            ['juggler', ['Good hands, kid. Want to learn? You know being a juggler is a hit with the ladies.']],
        ],
        characters: ['juggler'],
        options: [
            {
                id: 'learn_juggling',
                text: 'Learn to juggle',
                description: 'How hard can it be?',
                emoji: '🤹',
                outcome: {
                    resultText: [
                        'Very hard, it turns out. You spend an hour dropping tennis balls before you get frustrated.',
                        'But by the end, you can keep three balls going for about four seconds. Perhaps four and a half.',
                        'Your hand-eye coordination feels sharper. Your pride does not.'
                    ],
                    effects: {
                        energyChange: -10,
                        statChanges: {
                            volley: 3,
                            dropShot: 2,
                            agility: 1
                        },
                    }
                }
            },
            {
                id: 'watch_and_learn',
                text: 'Just watch the show',
                description: 'Observe the master at work.',
                emoji: '👀',
                outcome: {
                    resultText: [
                        'You sit and are mesmerized by his routine. His hand movements are incredibly precise.',
                        'You start noticing patterns in how he tracks multiple objects. It reminds you of reading an opponent\'s body language.',
                        'You leave a tip and head to practice with fresh eyes. Did he mean that thing about juggling being a hit with the ladies?'
                    ],
                    effects: {
                        energyChange: 5,
                        statChanges: {
                            overhead: 2,
                            slice: 1,
                            volley: 1,
                        },
                    }
                }
            }
        ]
    },

    {
        id: 'keiths_yoga_class',
        name: 'Keith\'s Yoga Disaster',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 12,
            completedEvents: ['club_team_first_practice']
        },
        skippable: true,
        description: 'Keith insists on dragging you to hot yoga. This can only end well.',
        dialogue: [
            ['keith', ['I signed us up for hot yoga! Hope you don\'t mind. It\'s supposed to be amazing for flexibility and recovery.']],
            ['keith', ['It was buy one get one free and I already paid. And ', {characterId: 'jen'}, ' said no.']],
            [null, ['The room is 105 degrees. You are already sweating and the class hasn\'t started.']],
            [null, ['The instructor asks everyone to "find their center." ', {characterId: 'keith'}, ' finds his quickly tumbling to the mat.']]
        ],
        characters: ['keith'],
        options: [],
        defaultOutcome: {
            resultText: [
                'Towards the end, ', {characterId: 'keith'}, ' had to be helped out of a pose by two staff members.',
                'The next morning, everything hurts. But somehow your body feels looser and more responsive.',
                {characterId: 'keith'}, ' has already signed you both up for next week.'
            ],
            effects: {
                energyChange: -20,
                moodChange: 5,
                statChanges: {
                    recovery: 4,
                    agility: 2,
                    strength: 2
                },
                relationshipChanges: {
                    keith: 5
                },
                itemsGained: [ICE_BATH_VOUCHER],
            },
            challengesAssigned: [
                ChallengeManager.createFromTemplate(CHALLENGE_IRON_RECOVERY, {
                    type: 'story',
                    eventId: 'keiths_yoga_class',
                }),
            ],
        }
    },

    {
        id: 'late_for_the_bus',
        name: 'The Bus Chase',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 8
        },
        skippable: true,
        description: 'You overslept and the bus to the Academy is leaving without you.',
        dialogue: [
            [null, ['You were so nervous about oversleeping that you could barely sleep. By the time you woke up, your alarm clock was blaring.']],
            [null, ['You look out the window and see your bus pulling away from the stop.']],
            [null, ['You have exactly zero seconds to get dressed and maybe negative three minutes to catch it.']]
        ],
        characters: [],
        options: [],
        defaultOutcome: {
            resultText: [
                'You throw on mismatched shoes and sprint out the door at top speed.',
                'You chase the bus for three stops. Sweating, panting, crying - you finally make it. The driver opens the door.',
                'You collapse into the first available seat and pass out again. Someone will surely wake you up, right?'
            ],
            effects: {
                energyChange: -20,
                moodChange: -5,
                statChanges: {
                    speed: 4,
                    stamina: 2,
                    recovery: 2
                },
            }
        }
    },

    {
        id: 'rock_climbing_outing',
        name: 'Rock Climbing Day',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 20
        },
        skippable: true,
        description: 'A teammate suggests indoor rock climbing as a fun outing.',
        dialogue: [
            ['mitch', ['There\'s a new climbing gym that just opened downtown. Want to check it out?']],
            [null, ['You arrive to find walls seem to stretch to the sky. This is not the V2 you were promised.']],
            ['mitch', ['I\'ll race you to the top! Loser buys smoothies.']]
        ],
        characters: ['mitch'],
        options: [
            {
                id: 'race_to_top',
                text: 'Race Mitch to the top',
                description: 'You didn\'t come here to lose.',
                emoji: '🧗',
                outcome: {
                    resultText: [
                        'You both scramble up the wall with surprising speed. Reaching overhead, gripping holds, and pushing off with your legs.',
                        {characterId: 'mitch'}, ' beats you by two seconds. You owe him a smoothie.',
                        'Your shoulders are on fire but your overhead reach feels incredible.'
                    ],
                    effects: {
                        energyChange: -20,
                        moodChange: 10,
                        statChanges: {
                            overhead: 3,
                            strength: 3,
                            recovery: 1
                        },
                        relationshipChanges: {
                            mitch: 5
                        }
                    },
                    challengesAssigned: [
                        ChallengeManager.createFromTemplate(CHALLENGE_WALL_CLIMBER, {
                            type: 'story',
                            eventId: 'rock_climbing_outing',
                        }),
                    ],
                }
            },
            {
                id: 'take_it_easy',
                text: 'Take the beginner wall',
                description: 'No shame in starting small.',
                emoji: '🪨',
                outcome: {
                    resultText: [
                        'You spend your time on the easier walls, focusing on technique over speed.',
                        'You work on how to use your body weight efficiently. It translates surprisingly well to court movement.',
                        {characterId: 'mitch'}, ' free-solos the hardest wall. You decide not to compete with that.'
                    ],
                    effects: {
                        energyChange: -10,
                        moodChange: 5,
                        statChanges: {
                            strength: 2,
                            recovery: 2,
                            overhead: 2
                        },
                        relationshipChanges: {
                            mitch: 3
                        }
                    }
                }
            }
        ]
    },

    {
        id: 'kitchen_duty',
        name: 'BBQ Knife Skills',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 16
        },
        skippable: true,
        description: 'You\'ve been volunteered to help prep for the team fundraiser BBQ.',
        dialogue: [
            ['greg', ['We need someone to chop vegetables. You\'re up, rookie.']],
            [null, ['There are just about 400 onions, 200 peppers, and maybe 1000 tomatoes.']],
            [null, [{characterId: 'greg'}, ' hands you a knife.']],
            ['greg', ['Small pieces. Consistent cuts. Just like your backhand.']],
            [null, [{characterId: 'keith'}, ' cuts with the consistency of his backhand as well. Not pretty.']]
        ],
        characters: ['greg', 'keith'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You spend hours doing precise knife work. Thin slices. Delicate cuts. Careful placement.',
                'By the end, your wrist control is noticeably better. The team chef gives you a nod of approval.',
                'Your teammates devour the food in no time at all. You watch an entire day of chopping disappear in what must have been four minutes.'
            ],
            effects: {
                energyChange: -10,
                moodChange: 5,
                statChanges: {
                    dropShot: 3,
                    slice: 3,
                    placement: 1
                },
                relationshipChanges: {
                    greg: 5
                }
            },
            challengesAssigned: [
                ChallengeManager.createFromTemplate(CHALLENGE_PRECISION_CUTTER, {
                    type: 'story',
                    eventId: 'kitchen_duty',
                }),
            ],
        }
    },

    {
        id: 'all_night_gaming',
        name: 'The Gaming Marathon',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'Keith convinces you to stay up all night playing video games.',
        dialogue: [
            ['keith', ['Dude. New tennis video game Backspin X just dropped. We HAVE to play it.']],
            ['keith', ['It\'s so realistic. And it even has guest characters.']],
            ['keith', ['Check this out, it\'s time to take on Federer and Taylor Swift! On the moon!']],
            ['player', ['I don\'t- wait, what? Move over. It looks like we can unlock Lebron.']],
            [null, ['It is now 4 AM. You have been playing for 9 hours. You\'re delirious at this point.']],
            ['keith', ['One more match. Virtual ', {characterId: 'keith'}, ' and his partner Shakira are in the virtual finals!']]
        ],
        characters: ['keith'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You wake up at noon on the floor of the living room.',
                'It\'s hard to remember at this point how long it\'s been since you last saw the sun.',
                'But ', {characterId: 'keith'}, ' finally won a match, even if it was a virtual one.'
            ],
            effects: {
                energyChange: -25,
                moodChange: 10,
                statChanges: {
                    focus: -4,
                    stamina: -2,
                    forehand: -1,
                    anticipation: -2,
                },
                relationshipChanges: {
                    keith: 8
                }
            }
        }
    },

    {
        id: 'spicy_food_challenge',
        name: 'The Spicy Food Challenge',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 14
        },
        skippable: true,
        description: 'A local restaurant is running a spicy wing challenge. Your teammates dare you.',
        dialogue: [
            ['keith', ['It says anyone who finishes the "Inferno Platter" gets their photo on the wall!']],
            ['jen', ['The waiver says "not responsible for hallucinations or episodes of terror." I\'m concerned.']],
            [null, ['The wings arrive. They are glowing and smell like gasoline. That can\'t be normal.']],
            ['keith', ['I\'ll go first! How bad can it b-']],
            [null, [{characterId: 'keith'}, ' cannot finish the sentence. Or the wing.']],
            [null, ['All the color in his face is gone. He looks like a ghost.']]
        ],
        characters: ['keith', 'jen'],
        options: [
            {
                id: 'take_challenge',
                text: 'Take the challenge',
                description: 'You didn\'t come here to be a coward.',
                emoji: '🌶️',
                outcome: {
                    resultText: [
                        'You eat two wings before your vision blurs. You feel like a sailor who\'s gotten lost and can no longer turn back.',
                        'The third burns enough you\'re not sure you\'ll ever taste again. The fourth was hubris. And the fifth was history.',
                        'Your photo is on the wall now. Worth it? You ponder this from the bathroom. For quite a while.'
                    ],
                    effects: {
                        energyChange: -15,
                        moodChange: 5,
                        statChanges: {
                            placement: -3,
                            offensive: -2,
                            focus: -2,
                        },
                        relationshipChanges: {
                            keith: 5,
                            jen: 3
                        }
                    }
                }
            },
            {
                id: 'skip_spicy',
                text: 'Order mild wings instead',
                description: 'Your body is a temple. A cowardly temple.',
                emoji: '🍗',
                outcome: {
                    resultText: [
                        'You order the mild wings and watch the carnage unfold.',
                        {characterId: 'keith'}, ' is crying. ', {characterId: 'jen'}, ' made it through two wings before tapping out.',
                        'You feel fine. You can\'t help but fee like you missed out, though.'
                    ],
                    effects: {
                        energyChange: 5,
                        statChanges: {
                            recovery: 2,
                            dropShot: 1
                        },
                        relationshipChanges: {
                            keith: -2,
                            jen: -2
                        }
                    }
                }
            }
        ]
    },

    {
        id: 'social_media_spiral',
        name: 'The Social Media Spiral',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 12
        },
        skippable: true,
        description: 'You fall down a social media rabbit hole.',
        dialogue: [
            [null, ['You open your phone to check one notification. Just one.']],
            [null, ['Three hours later, you\'ve scrolled through countless videos of cats, trashy reality TV, and a video essay on the slow decline of Penn.']],
            [null, ['The algorithm has also convinced you that your forehand grip is wrong, your stance is wrong, and your entire life is wrong.']]
        ],
        characters: [],
        options: [],
        defaultOutcome: {
            resultText: [
                'At practice the next day, you try to copy a trick shot you saw online. It goes very badly.',
                'You\'re building up a couple of bad habits now chasing trends.',
                'It\'ll take a few sessions to get back to basics. Focus up!',
            ],
            effects: {
                energyChange: 5,
                moodChange: -10,
                statChanges: {
                    forehand: -3,
                    defensive: -2,
                    placement: -2,
                },
            }
        }
    },

    {
        id: 'trampoline_park',
        name: 'Trampoline Park Mishap',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 16
        },
        skippable: true,
        description: 'The team takes a trip to the trampoline park. What could go wrong?',
        dialogue: [
            ['keith', ['This is going to be the best day of my life! My parents never let me on these things.']],
            ['jen', ['Please be careful. ', {characterId: 'keith'}, ' is not exactly known for his balance or coordination.']],
            [null, ['You arrive to find an enormous warehouse full of interconnected trampolines, foam pits, and a concerning lack of adult supervision.']],
            [null, ['You look over to see ', {characterId: 'keith'}, ' is already terrorizing the kid\'s foam pit.']],
        ],
        characters: ['keith', 'jen'],
        options: [
            {
                id: 'go_wild',
                text: 'Go absolutely wild',
                description: 'Flip city. Population: you.',
                emoji: '🤸',
                outcome: {
                    resultText: [
                        'You bounce, flip, and launch yourself with reckless abandon. You attempt a double backflip and land on your face in the foam pit.',
                        'Your stamina is wrecked. But for a brief moment you felt invincible.',
                        {characterId: 'keith'}, ' somehow ended up on the roof. Nobody knows how.'
                    ],
                    effects: {
                        energyChange: -30,
                        moodChange: 20,
                        statChanges: {
                            stamina: -3,
                            offensive: -2,
                            overhead: 2,
                            agility: 2
                        },
                        relationshipChanges: {
                            keith: 5,
                            jen: 3
                        }
                    }
                }
            },
            {
                id: 'controlled_bouncing',
                text: 'Bounce responsibly',
                description: 'Use it as actual training. You\'re fun at parties.',
                emoji: '📋',
                outcome: {
                    resultText: [
                        'You use the trampolines for controlled jumping exercises. Your teammates think you\'re insane.',
                        'But your vertical leap and court coverage improve noticeably.',
                        {characterId: 'jen'}, ' respects the discipline. ', {characterId: 'keith'}, ' throws dodgeballs at you from above.'
                    ],
                    effects: {
                        energyChange: -15,
                        moodChange: 5,
                        statChanges: {
                            speed: 2,
                            overhead: 2,
                            strength: 1
                        },
                        relationshipChanges: {
                            jen: 5
                        }
                    }
                }
            }
        ]
    },

    {
        id: 'terrible_movie_night',
        name: 'Movie Night Brain Rot',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'Keith picks the movie for team movie night. It\'s a disaster.',
        dialogue: [
            ['keith', ['Okay, okay, hear me out. It\'s a tennis-themed knockoff of a hit 90s show. They call it "Sets and the City."']],
            ['jen', ['Please tell me you\'re joking. It has a 4% rating online.']],
            ['keith', ['The other 96% are cowards. It is cinema.']],
        ],
        characters: ['keith', 'jen'],
        options: [],
        defaultOutcome: {
            resultText: [
                'The movie drags on for hours. You\'ve never heard nearly so many tennis-related puns in your life.',
                '4% is starting to feel pretty generous.',
                {characterId: 'keith'}, ' is insufferable. You can\'t wait for the next movie night.'
            ],
            effects: {
                energyChange: 10,
                moodChange: 15,
                statChanges: {
                    anticipation: -3,
                    focus: -2,
                    defensive: -1,
                    strength: 1
                },
                relationshipChanges: {
                    keith: 5,
                    jen: 3
                }
            }
        }
    },

    {
        id: 'overconfidence_streak',
        name: 'The Ego Trip',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 20,
            minMatchesWon: 5
        },
        skippable: true,
        description: 'Your recent wins have gone to your head. Time for a reality check.',
        dialogue: [
            [null, ['You\'ve been winning recently and starting to feel like you own the place.']],
            [null, ['You start giving unsolicited advice to other players.']],
            ['coach_gonzalez', ['Tell you what. Let\'s do some drills against the ball machine. I\'ll set it to "humble."']],
            [null, ['The ball machine fires shots at angles you\'ve never seen. You miss ten in a row.']]
        ],
        characters: ['coach_gonzalez'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You leave practice with your confidence in check and your offensive game plan in shambles.',
                'You were picking up some bad habits and at least now you get a chance to fix them before an opponent takes advantage.',
                {characterId: 'coach_gonzalez'}, ' pats you on the back. Who makes "humble" a setting?'
            ],
            effects: {
                energyChange: -10,
                moodChange: -10,
                statChanges: {
                    offensive: -3,
                    forehand: -2,
                    placement: -1,
                    defensive: 2,
                    slice: 1,
                    dropShot: 1
                },
                relationshipChanges: {
                    coach_gonzalez: 3
                }
            }
        }
    },

    {
        id: 'hammock_nap_gone_wrong',
        name: 'The Hammock Incident',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'You try to relax in a hammock between practice sessions.',
        dialogue: [
            [null, ['You find a hammock strung up between two trees near the courts. Perfect for a quick rest.']],
            [null, ['You climb in carefully. It\'s quite comfortable. The sun is warm and the breeze is nice.']],
            [null, ['Suddenly, you snap awake. Hours have passed. You\'ve missed afternoon practice entirely.']],
            [null, ['Also, you slept at a weird angle and your entire right side is numb.']]
        ],
        characters: [],
        options: [],
        defaultOutcome: {
            resultText: [
                'You roll out of the hammock and fall to the ground. Hard.',
                'Your reaction time is awful. Your stamina felt good from the rest but your muscles are stiff.',
                'On the bright side, you had a dream where you were the guy who invented hot air balloons. That guy has it made.',
                'Although, you think you probably would figure out the landing problem. Seriously, why have they not handled that?'
            ],
            effects: {
                energyChange: 30,
                moodChange: -5,
                statChanges: {
                    anticipation: -3,
                    stamina: -2,
                    speed: -1,
                    recovery: 3
                },
            }
        }
    },

    {
        id: 'escape_room_challenge',
        name: 'Escape Room Showdown',
        tags: ['misc'],
        timeSlotsRequired: 2,
        prerequisites: {
            minSeason: 1,
            minDay: 18,
            completedEvents: ['club_team_first_practice']
        },
        skippable: true,
        description: 'The team takes on an escape room together.',
        dialogue: [
            ['jen', ['I booked us a sports-themed escape room! It\'s called "Escape the Locker Room."']],
            ['keith', ['I\'ve been locked in a locker before. This should be easy.']],
            ['jen', ['I don\'t think that\'s-']],
            ['keith', ['Actually, I can just climb into this one. No worries, folks.']],
            [null, ['The escape room turns out to be way more physical than expected. There are obstacle courses between puzzle stations.']]
        ],
        characters: ['jen', 'keith'],
        options: [
            {
                id: 'speed_run',
                text: 'Speed run the physical challenges',
                description: 'Treat every obstacle like a sprint drill.',
                emoji: '⚡',
                outcome: {
                    resultText: [
                        'You blitz through the crawling sections and sprint between stations like your life depends on it.',
                        'Your team escapes with 2 minutes to spare. ', {characterId: 'keith'}, ' got stuck in a tunnel and had to be pulled out by his ankles.',
                        'Your recovery between intense bursts of stress has never been better.'
                    ],
                    effects: {
                        energyChange: -20,
                        moodChange: 15,
                        statChanges: {
                            speed: 3,
                            recovery: 3,
                            agility: 1
                        },
                        relationshipChanges: {
                            jen: 5,
                            keith: 5
                        },
                        itemsGained: [ENERGY_DRINK],
                    },
                    challengesAssigned: [
                        ChallengeManager.createFromTemplate(CHALLENGE_ESCAPE_ARTIST, {
                            type: 'story',
                            eventId: 'escape_room_challenge',
                        }),
                    ],
                }
            },
            {
                id: 'puzzle_focus',
                text: 'Focus on solving the puzzles',
                description: 'Brains over brawn.',
                emoji: '🧩',
                outcome: {
                    resultText: [
                        'You let ', {characterId: 'jen'}, ' handle the physical bits and focus on cracking the codes.',
                        'Your team escapes with 30 seconds left, mostly because you managed to re-solve all the codes that ', {characterId: 'keith'}, ' said he finished.',
                        'All that concentration made you feel mentally sharp, but it also drained you.'
                    ],
                    effects: {
                        energyChange: -20,
                        moodChange: 10,
                        statChanges: {
                            volley: 2,
                            dropShot: 2,
                            slice: 1,
                            anticipation: 1
                        },
                        relationshipChanges: {
                            jen: 3,
                            keith: 3
                        }
                    }
                }
            }
        ]
    },

    {
        id: 'old_social_media_posts',
        name: 'Old Social Media Posts Resurface',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 10
        },
        skippable: true,
        description: 'Some old social media posts of yours resurface and word spreads around the Academy',
        dialogue: [
            [null, ['You pass some of your teammates outside the Academy lobby and they laugh as you walk past.']],
            ['tommy', ['If it isn\'t our little retirement home league champion!']],
            ['alison', ['You could not get me to post that if you paid me.']],
            ['keith', ['Even I wouldn\'t have the confidence. And that\'s saying something.']],
            [null, ['You can\'t figure out what they\'re talking about, but then you see the bulletin board.']],
            [null, ['Someone pinned up some old posts of yours. You get closer and realize the horror.']],
            [null, ['You were posting positively about pickleball. Your career is over.']]
        ],
        characters: ['tommy', 'alison', 'keith'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You try to laugh it off but this one really hurts. You really thought you had scrubbed the internet of those posts.'
            ],
            effects: {
                energyChange: -10,
                moodChange: -10,
                statChanges: {
                    forehand: -1,
                    backhand: -1,
                    volley: -1
                },
                relationshipChanges: {
                    tommy: 3,
                    alison: 3,
                    keith: 3
                }
            }
        }
    },

    {
        id: 'post_match_carpool',
        name: 'Post-Match Carpool',
        tags: ['misc'],
        timeSlotsRequired: 1,
        prerequisites: {
            minSeason: 1,
            minDay: 12
        },
        skippable: true,
        description: 'An Awkward Carpool',
        dialogue: [
            [null, ['You decided to sneak out to the concession stand after your match and missed the team bus home.']],
            [null, ['You start walking back to the Academy, hoping to catch a ride with someone.']],
            [null, ['After a few minutes of walking, you spot a familiar car pulling up beside you.']],
            ['older_woman', ['Need a ride? Hop in! I\'ve got snacks and drinks, too! Good playing today!']],
            [null, ['You climb in the car and that\'s when you realize in the back of the car is the opponent you just played against.']],
            ['older_woman', ['You played so well against my son! He\'s been practicing a lot. Really good backhand.']],
            ['opponent', ['Mom!']],
            ['older_woman', ['I know, sweetie! I\'m just saying it was so much fun to watch. Here - try some of these orange slices.']]
        ],
        characters: ['older_woman'],
        options: [],
        defaultOutcome: {
            resultText: [
                'You settle in for what is a very awkward car ride. But it definitely beats walking. ',
                'The orange slices are surprisingly refreshing.'
            ],
            effects: {
                energyChange: 10,
                moodChange: 15,
                statChanges: {
                    anticipation: 2,
                    stamina: 2,
                    recovery: 1
                },
                itemsGained: [ORANGE_SLICE],
            }
        }
    }
];
