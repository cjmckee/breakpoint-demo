/**
 * Welcome Events
 * Initial story events that introduce the player to the game world
 */

import type { StoryEvent } from '../../types/storyEvents';
import { BEGINNER_RACQUET, RUNNING_SHOES } from '../items';

export const welcomeEvents: StoryEvent[] = [
  /** Welcome to Riverside Tennis Academy */

  /** 
   * This is the start of the journey and will cover some simple intro events leading the player up to their first tournament.
   * Introduces some main characters: Jordan (Rival), Jen (Friend), Keith (Friend)
   * The players discover more about the academy culture, characters, and mechanics: training sessions, matches, abilities, player tiers, and more.
   * 
   * The first tournament won't take place until the player reaches appropriate stats and has completed a few other storyline events. 
   */

  {
    id: 'welcome_to_tennis_rpg',
    name: 'A New Beginning',
    tags: ['intro', 'coach'],
    timeSlotsRequired: 0, // Doesn't consume time - happens during character creation
    prerequisites: {
      minDay: 1,
      maxDay: 1,
      excludedEvents: [],
    },
    skippable: false,
    description: 'You arrive at the tennis academy for the first time, ready to begin your journey.',
    dialogue: [
      [null, ['You stand at the entrance of the Riverside Tennis Academy, your tennis bag slung over your shoulder. The sound of balls being struck echoes across the pristine courts. This is it - the beginning of your professional tennis journey.']],
      ['jordan_rival', ['Are you lost? This is THE Riverside Tennis Academy. Twisted Knee Pickleball Academy is on the other side of the parking lot.']],
      ['player', ['It\'s my first day at Riverside. I\'m here to train. You guys do Padel too?']],
      ['jordan_rival', ['I hope you know what you\'re getting into. This place is no joke. We\'ve got players from all over the country, and countries you\'ve never even heard of.']],
      ['jordan_rival', ['Just remember, everyone here is gunning for you. Well, that\'s actually not quite true. It\'s just me gunning for you.']],
      ['player', ['What?']],
      ['jordan_rival', ['And soon, everyone at this academy will know my name...']],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: [`You feel a mixture of excitement and nerves as you head to your room. It's only been a few weeks since you received that unexpected acceptance letter. If you want to make it in the tennis world, this is just the start. Also, who even was that guy?`],
      effects: {
        statChanges: {},
        moodChange: 20, // Excitement about the new beginning
        energyChange: 0,
        relationshipChanges: {
          jordan_rival: -10, // Jordan being jordan
        },
        itemsGained: [BEGINNER_RACQUET, RUNNING_SHOES],
      },
    },
  },

  {
    id: 'making_connections',
    name: 'Making Connections',
    tags: ['intro', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['welcome_to_tennis_rpg'],
    },
    skippable: false,
    description: 'You run into some other new players on your way to the practice courts.',
    dialogue: [
      [null, ['You rush to the practice courts already running a few minutes late. Coach is not going to be happy. You turn the corner and-']],
      [null, ['WHAM! You collide with another player and end up sprawled across the ground. They hardly seem to notice you hit them.']],
      ['jen', ['Hey, watch where you\'re going! Are you okay?']],
      ['jen', ['I\'m ', {characterId: 'jen'}, ' by the way. You know you\'re in the wrong parking lot for pickleball.']],
      ['keith', ['That looked like it hurt. You must be new at the Academy as well. My name\'s ', {characterId: 'keith'}, '. Nice to meet you.']],
      ['keith', ['We\'re still trying to find the mixed doubles facility. We may run into you at the food hall later. I hear for rookie week we get chicken patties.']],
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['It\'s nice to finally meet some of the other rookies. You wonder how they found out about the Academy.'],
      effects: {
        statChanges: {},
        moodChange: 10,
        energyChange: 0,
        relationshipChanges: {
          jen: 5,
          keith: 5,
        },
      },
    },
  },

  {
    id: 'food_hall_gossip',
    name: 'Food Hall Gossip',
    tags: ['intro', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['making_connections'],
    },
    skippable: false,
    description: 'You overhear some chatter while waiting in line for food.',
    dialogue: [
      [null, ['As you wait in line for your food, you can\'t help but overhear snippets of conversation from the other players around you.']],
      ['jen', ['You know I heard they separate up all the players based on skill level. Some of the best players at the Academy don\'t even associate with the lower tiers.']],
      ['keith', ['No way! I hope I get to play against them someday. I still have a long way to go before I can move up.']],
      ['jen', ['You can only get to the higher tiers by winning matches and proving yourself. When you\'re good enough, the system will recognize you.']],
      ['keith', ['I heard the upper tiers are an elite and exclusive community. They don\'t let just anyone in.']],
      ['keith', ['Winning matches isn\'t enough to get you invited. You have to take someone else\'s spot from them.']],
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['You feel more connected to your fellow players, but you can\'t help but feel a little anxious about the road ahead. What will it take to be promoted to the Academy\'s upper echelons?'],
      effects: {
        statChanges: {},
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 5,
          keith: 5,
        },
      },
    },
  },

  {
    id: 'player_tier_intro',
    name: 'Player Tier Introduction',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['food_hall_gossip'],
    },
    skippable: false,
    description: 'You hear more about the player tiers at the academy.',
    dialogue: [
      ['jen', ['Hey! I learned more about the player tiers. Apparently it impacts your entire status here at the academy!']],
      ['jen', ['It gives you access to better training facilities, better opponents, and most of all - they get to eat at the good cafeteria!']],
      ['keith', ['They haven\'t even told us what the tiers are yet. I wonder how we find out.']],
      ['jen', ['It sounds like we\'re going to have to earn it, and the first opportunity will be in the Riverside Open in a few weeks!']],
      ['keith', ['I can\'t wait to show these chumps what I can do! I\'ll be at the top of this academy in no time. I can hear the crowds now... ', {characterId: 'keith'},'! ', {characterId: 'keith'}, '! ', {characterId: 'keith'}, '!']],
      [null, [{characterId: 'keith'}, ' starts his own chant and you can see the glimmer in his eyes. You\'re starting to believe in him too.']],
      ['jen', ['Don\'t listen to him. Last week I saw him lose to his little sister, and she\'s only eight! She cares more about that blue dog tv show than tennis right now.']],
      ['keith', ['Oh you just have to bring that up. I was just having an off day! She\'s a pusher anyway. No one wants to play respectable tennis nowadays...']]
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['It seems you\'re going to have to prove yourself to move up at the Academy. Also how good is ', {characterId: 'keith'}, '\'s little sister...?'],
      effects: {
        statChanges: {},
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 5,
          keith: 5,
        },
      },
    },
  },

  {
    id: 'training_session_intro',
    name: 'Training Session Introduction',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['player_tier_intro'],
    },
    skippable: false,
    description: 'You learn about the training sessions available at the academy.',
    dialogue: [
      ['jen', ['Hey! I found out more about the training sessions here at the academy. They have specialized programs for each player tier!']],
      ['keith', ['Really? That sounds awesome! I hope I get into a good program.']],
      ['jen', ['It seems like as you increase your tier, you gain access to better training session tiers as well.']],
      ['jen', ['But they won\'t always be available, so you will still always have access to lower tier training sessions.']],
      ['keith', ['I can\'t wait to start training! I\'m going to push myself to the limit.']],
      ['jen', ['We\'re still at the bottom right now. We\'re going to have to do the best we can to prepare for the Riverside Open with the sessions we have.']],
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['Right now you only have access to Bronze training sessions. More training sessions will become available as you progress.'],
      effects: {
        statChanges: {},
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 5,
          keith: 5,
        },
      },
    },
  },

  {
    id: 'relationship_basics',
    name: 'Relationship Basics',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['training_session_intro'],
    },
    skippable: false,
    description: 'You learn about the importance of relationships in the academy.',
    dialogue: [
      ['keith', ['Hey! I found out more about how relationships work here at the academy.']],
      ['keith', ['Building relationships with other players can give you various benefits, like training bonuses and support during matches.']],
      ['keith', ['Interacting with other players, participating in events, and making choices that align with their personalities can help.']],
      ['keith', ['But making the wrong choices can hurt those relationships. I tried to offer ', {characterId: 'jen'}, 'some advice on her serve this morning.']],
      ['keith', ['I saw a big -15 appear over her head! She can be so sensitive sometimes. I brought my double faults down to 20 per match using those tips.']],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ['It seems like building relationships will be key to your success at the academy. '],
      effects: {
        statChanges: {},
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          keith: 5,
        },
      },
    },
  },

  {
    id: 'abilities_basics',
    name: 'Abilities Basics',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['training_session_intro'],
    },
    skippable: false,
    description: 'You learn about the abilities system at the academy.',
    dialogue: [
      ['keith', ['Hey! I found out more about the abilities system here at the academy.']],
      ['keith', ['Each player can unlock unique abilities that enhance their match play. I heard there are abilities for serving, volleying, and even for mental focus.']],
      ['keith', ['These abilities can be upgraded and customized as you progress. One way to get them is through training sessions, but I\'m not sure how yet.']],
      ['keith', ['I can\'t wait to see what abilities I can unlock!']],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ['It seems like the abilities system will add a new layer of strategy to your matches.'],
      effects: {
        statChanges: {},
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          keith: 5,
        },
      },
    },
  },

  {
    id: 'riverside_open_prep',
    name: 'Riverside Open Preparation',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['abilities_basics', 'relationship_basics'],
      minMatchesWon: 1,
      minDay: 15,
      stats: {
        serve: {
          min: 30
        },
        forehand: {
          min: 30
        },
        backhand: {
          min: 30
        },
        focus: {
          min: 30
        }
      }
    },
    skippable: false,
    description: 'The Riverside Open is just around the corner.',
    dialogue: [
      ['jen', ['I can\'t wait for the Riverside Open! It\'s going to be so exciting. I hope you\'ve been training as hard as I have.']],
      ['jen', ['I feel like I can maybe even win some matches!']],
      ['jen', ['But seeing the competition around here, even in the lowest tiers, has me pretty worried.']],
      ['jen', ['Only one way to find out where we stand in the ranks of the Academy!']]
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ['You commit to doing your best for the Riverside Open. The first real step in your tennis journey begins there.'],
      effects: {
        statChanges: {},
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 5,
        },
      },
    },
  }
];
