/**
 * Welcome Events
 * Initial story events that introduce the player to the game world
 */

import type { StoryEvent } from '../../types/storyEvents';
import { TimeSlot, type StoryMatchMetadata } from '../../types/game';
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
        revealEncyclopediaSections: ['tennis-terms', 'stats-guide', 'scoring'], // Unlock the encyclopedia tabs
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
          jen: 2,
          keith: 2,
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
        relationshipChanges: {
          jen: 2,
          keith: 2,
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
      ['jen', ['We\'re in the lowest tier. The "Club" tier. They don\'t see us as competitive players yet.']],
      ['jen', ['But we can show them! And the first opportunity will be in the Riverside Open in a few weeks!']],
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
        moodChange: 2,
        relationshipChanges: {
          jen: 2,
          keith: 2,
        },
      },
    },
  },

    {
    id: 'match_play_basics',
    name: 'Match Play Basics',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['player_tier_intro'],
    },
    skippable: false,
    description: 'Match Play at the Academy.',
    dialogue: [
      [null, ['You are heading out on a morning run when you hear a familiar voice from the side courts.']],
      ['jen', ['Come on, ', {characterId: 'keith'}, '! You haven\'t even won a single point yet.']],
      ['keith', ['You know I warm up slow. Just give me... another set...']],
      ['jen', [{characterId: 'player'}, '! Have you played a match yet? It\'s easy.']],
      [null, ['She motions for you to join them. ', {characterId: 'keith'}, ' is gasping for air but manages to wave.']],
      ['jen', ['Look - it\'s easy. Most points will just zip by. You won\'t even have to think. Pure instinct.']],
      ['jen', ['But on Key Moments, like break points and match points, you need to consider your options and pick the one that best suits your style.']],
      ['keith', ['It also takes your opponent\'s stats into account - sometimes you have to try different options to see what works!']],
      ['jen', ['Don\'t forget! Many of the Key Moment options have effects beyond winning or losing the point. Choose wisely!']],
      ['jen', ['Lastly, you can open the settings menu in the bottom right and view the Encyclopedia to learn more about the basics of tennis. Don\'t be afraid to pull it up if you\'re looking for some guidance.']]
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['You sub in for a couple games to get a feel for the courts. You don\'t look so bad. ', {characterId: 'keith'}, ' decides he wants to challenge you to see what you\'re made of.'],
      effects: {
        statChanges: {
            serve: 1,
            return: 1,
        },
        moodChange: 5,
        relationshipChanges: {
          jen: 2,
          keith: 2,
        },
        revealEncyclopediaSections: ['surface-guide'],
        scheduledEvents: [
          {
            eventType: 'story_match',
            relativeDays: 0,
            scheduledTimeSlot: TimeSlot.MORNING,
            metadata: {
              opponentId: 'keith',
              opponentName: 'Keith',
              opponentStats: {
                core: { serve: 20, forehand: 18, backhand: 20, return: 22, slice: 25 },
                technical: { volley: 15, overhead: 18, dropShot: 20, spin: 15, placement: 18 },
                physical: { speed: 25, stamina: 20, strength: 18, agility: 22, recovery: 20 },
                mental: { focus: 15, anticipation: 18, shotVariety: 15, offensive: 15, defensive: 20 },
              },
              opponentTier: 1,
              opponentDescription: 'A friendly but struggling player.',
              winEventId: 'tutorial_keith_win',
              lossEventId: 'tutorial_keith_loss',
              surface: 'hard',
              matchFormat: 'best-of-1',
              matchTitle: 'Practice Match vs Keith',
              matchDescription: 'A casual practice match with Keith to get some match experience.',
              countsForMilestones: false,
            } as StoryMatchMetadata,
          },
          {
            eventType: 'story_match',
            relativeDays: 0,
            scheduledTimeSlot: TimeSlot.AFTERNOON,
            metadata: {
              opponentId: 'jen',
              opponentName: 'Jen',
              opponentStats: {
                core: { serve: 28, forehand: 30, backhand: 26, return: 30, slice: 25 },
                technical: { volley: 22, overhead: 25, dropShot: 28, spin: 24, placement: 26 },
                physical: { speed: 35, stamina: 28, strength: 25, agility: 32, recovery: 30 },
                mental: { focus: 28, anticipation: 32, shotVariety: 30, offensive: 32, defensive: 28 },
              },
              opponentTier: 1,
              opponentDescription: 'An athletic player who takes her tennis seriously. She won\'t go easy on you.',
              winEventId: 'tutorial_jen_win',
              lossEventId: 'tutorial_jen_loss',
              surface: 'hard',
              matchFormat: 'best-of-1',
              matchTitle: 'Practice Match vs Jen',
              matchDescription: 'A more competitive practice match with Jen. She just wiped the floor with Keith.',
              countsForMilestones: false,
            } as StoryMatchMetadata,
          },
        ],
      },
    },
  },

  {
    id: 'tutorial_keith_win',
    name: 'Practice Match Victory',
    tags: ['tutorial'],
    timeSlotsRequired: 0,
    prerequisites: { completedEvents: ['match_play_basics'] },
    skippable: false,
    description: 'You won against Keith!',
    dialogue: [
      ['keith', ['Wow, you\'re actually really good at this! I mean... I was going easy on you. Mostly.']],
      ['jen', ['Told you! ', {characterId: 'player'}, ' has already picked up a few things. That was a fun match!']],
      ['jen', ['Now you know the basics. Keep practicing and eventually try to win the Riverside Open!']],
      ['jen', ['Well, beating ', {characterId: 'keith'}, ' is one thing. But I\'m a little bit better. Let\'s play!']]
    ],
    characters: ['keith', 'jen'],
    options: [],
    defaultOutcome: {
      resultText: ['You feel more confident after that win. Maybe tennis isn\'t so hard after all. However, you feel like you\'re about to face a much tougher challenge.'],
      effects: { moodChange: 10, energyChange: 50 },
    },
  },

  {
    id: 'tutorial_keith_loss',
    name: 'Practice Match Defeat',
    tags: ['tutorial'],
    timeSlotsRequired: 0,
    prerequisites: { completedEvents: ['match_play_basics'] },
    skippable: false,
    description: 'You lost to Keith.',
    dialogue: [
      ['keith', ['Ha! I actually won a point! Multiple points! Is this a dream?']],
      ['jen', ['Hey, it\'s just practice. You\'ll get better. Everyone starts somewhere. Most people don\'t start losing to ', {characterId: 'keith'}, ', though.']],
      ['jen', ['Keep at it and you\'ll improve fast. Promise!']],
      ['jen', ['Besides, you kept me sitting too long. It\'s my turn!']]
    ],
    characters: ['keith', 'jen'],
    options: [],
    defaultOutcome: {
      resultText: ['The loss stings, but you learned something. There\'s room to improve. ', {characterId: 'jen'}, ' is getting ready to play, and you know this will be an even tougher challenge.'],
      effects: { moodChange: -5, energyChange: 50 },
    },
  },

  {
    id: 'tutorial_jen_win',
    name: 'Practice Match Victory',
    tags: ['tutorial'],
    timeSlotsRequired: 0,
    prerequisites: { completedEvents: ['match_play_basics'] },
    skippable: false,
    description: 'You won against Jen!',
    dialogue: [
      ['jen', ['Not bad! You\'re really improving fast. You\'re already better than when you got here.']],
      ['jen', ['Keep this up and you\'ll be ready for real competition soon.']],
      ['keith', ['That was incredible! I\'ve been trying for weeks and still haven\'t been able to take a set from ', {characterId: 'jen'}, '.']],
      ['jen', ['Just know that some of the other players at the Academy, even at the Club level are much better than I am.']],
      ['jen', ['It\'s going to be important to train your skills before you jump into practice matches if you want to win.']],
      ['jen', ['You can preview your opponent\'s stats before starting the match, so be careful about challenging players that have much stronger stats!']]
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['You pull off the win! Your confidence is growing. ', {characterId: 'jen'}, ' warns you about the strong players at the Academy, even at the Club tier. Make sure you do your training!'],
      effects: { moodChange: 15, energyChange: 50, relationshipChanges: { jen: 5 } },
    },
  },

  {
    id: 'tutorial_jen_loss',
    name: 'Practice Match Defeat',
    tags: ['tutorial'],
    timeSlotsRequired: 0,
    prerequisites: { completedEvents: ['match_play_basics'] },
    skippable: false,
    description: 'You lost to Jen.',
    dialogue: [
      ['jen', ['Good effort! Don\'t feel too bad. You\'ve got the skills, just need more practice.']],
      ['jen', ['Don\'t get discouraged. Everyone improves at their own pace.']],
      ['keith', ['Yeah, don\'t sweat it. I\'ve been losing to ', {characterId: 'jen'}, ' for weeks.']],
      ['jen', ['Just know that some of the other players at the Academy, even at the Club level are much better than I am.']],
      ['jen', ['It\'s going to be important to train your skills before you jump into practice matches if you want to win.']],
      ['jen', ['You can preview your opponent\'s stats before starting the match, so be careful about challenging players that have much stronger stats!']]
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['A tough loss to a stronger player. ', {characterId: 'jen'}, ' warns you about the strong players at the Academy, even at the Club tier. Make sure you do your training!'],
      effects: { moodChange: 5, energyChange: 25, relationshipChanges: { jen: 3 } },
    },
  },

    {
    id: 'training_session_intro',
    name: 'Training Session Introduction',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['match_play_basics'],
    },
    skippable: false,
    description: 'You learn about the training sessions available at the academy.',
    dialogue: [
      ['jen', ['Hey! I found out more about the training sessions here at the academy. They have specialized programs for each player tier!']],
      ['keith', ['Really? That sounds awesome! I hope I get into a good program.']],
      ['jen', ['It seems like as you increase your tier, you gain access to better training session tiers as well.']],
      ['jen', ['They put us in the lowest tier with the other Club players. In order to make it to the Regional level, we have to perform well at the Riverside Open tournament!']],
      ['keith', ['I can\'t wait to start training! I\'m going to push myself to the limit. My limit isn\'t that high, so it should be quick.']],
      ['jen', ['We\'re still at the bottom right now. We\'re going to have to do the best we can to prepare for the Riverside Open with these Bronze-level sessions.']],
    ],
    characters: ['jen', 'keith'],
    options: [],
    defaultOutcome: {
      resultText: ['Right now you only have access to Bronze training sessions. You\'ll have access to a bit more variety as more content is added to the demo over time.'],
      effects: {
        statChanges: {},
        moodChange: 2,
        relationshipChanges: {
          jen: 2,
          keith: 2,
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
      ['keith', ['But making the wrong choices can hurt those relationships. I tried to offer ', {characterId: 'jen'}, ' some advice on her serve this morning.']],
      ['keith', ['I saw a big -15 appear over her head! She can be so sensitive sometimes. I brought my double faults down to 20 per match using those tips.']],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ['It seems like building relationships will be key to your success at the academy. '],
      effects: {
        statChanges: {},
        relationshipChanges: {
          keith: 5,
        },
      },
    },
  },

  {
    id: 'shop_basics',
    name: 'Exp Shop Basics',
    tags: ['intro'],
    timeSlotsRequired: 0, // Doesn't consume time - informational event
    prerequisites: {
      completedEvents: ['training_session_intro'],
    },
    skippable: false,
    description: 'You learn about the experience shop system at the academy.',
    dialogue: [
      ['keith', ['You will never guess what I found. Did you know there\'s a shop hidden deep inside the Academy?']],
      ['keith', ['They were selling items and equipment, but they wouldn\'t take my money. It\'s some kind of special vendor!']],
      ['player', ['Special vendor? What are you talking about?']],
      ['keith', ['That\'s right. They wouldn\'t let me pay in money. They were asking for the only currency that matters around here: tennis experience.']],
      ['keith', ['In addition to items and equipment, they were selling stat improvement bundles! I don\'t know how that even works!']],
      ['keith', ['You can gain experience by playing in matches and completing challenges. Then you can spend those exp points on stats and items!']],
      ['keith', ['New items will become available each morning, so make sure you check the shop daily!']],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ['You eagerly await your first chance to check out the shop. How do you even spend experience anyway?'],
      effects: {
        statChanges: {},
        energyChange: 0,
        relationshipChanges: {
          keith: 1,
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
      // This event is scheduled for day 33 (after all 5 team matches), do not require stats
      completedEvents: ['abilities_basics', 'relationship_basics'],
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
        scheduledEvents: [{
          relativeDays: 3,  // Prep fires on day 33, ceremony on day 36
          scheduledTimeSlot: TimeSlot.MORNING,
          eventType: 'story' as const,
          metadata: { storyEventId: 'riverside_open_opening_ceremony' },
        }],
      },
    },
  }
];
