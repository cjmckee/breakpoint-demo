/**
 * Career/Sponsor Storyline Events
 * Events related to professional career development and sponsorship opportunities
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { TOURNAMENT_OUTFIT, SPONSOR_OUTFIT, HEADBAND, PRO_RACQUET, ENERGY_DRINK, BANANA, LUCKY_SPROUT } from '../items';
import { CHALLENGE_TEAM_SPIRIT, CHALLENGE_SPONSOR_WORTHY } from '../challengeTemplates';
import { TimeSlot } from '../../types/game';

export const careerEvents: StoryEvent[] = [

  /** Team Storyline */

  /**
   * This will cover the player joining their Academy team at the Club level. It is the lowest tier, and they will have keith, jen, plus some other first years on the team.
   * The team will take part in matches against other schools or clubs, and we will use it as an opportunity for the player to get extra matches, plus introduce other characters and locations.
   * 
   * We will expect the player to be quite low rated, and this storyline may take place before the Riverside open. 
   */

  {
    id: 'club_team_intro',
    name: 'Joining the Club Team',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['abilities_basics'],
    },
    skippable: false,
    description: 'You find out about the Academy team.',
    dialogue: [
      [null, ['It\'s a quiet, rainy day at the Academy. You finally get a moment to yourself between all the training sessions.']],
      [null, ['...and then you hear it. A sort of dull roar. But it\'s getting louder. And coming towards you?']],
      ['keith', ['AAAAAAHHHHHHHHHHHHHHH!!! I made it! I made it! I made it! I made i-']],
      [null, [{characterId: 'keith'}, ' loses his balance and falls into the grass. He keeps enough momentum to take it like a slip and slide all the way up to where you\'re standing.']],
      ['keith', ['I made it.']],
      [null, [{characterId: 'jen'}, ' runs along behind him, notably staying on her feet.']],
      ['jen', ['Really, we all made it. The Academy team. They just released the rosters!']],
      ['jen', ['They put us in the lowest division. We really have to earn everything here, huh? Let\'s hose him off.']],
    ],
    characters: ['keith', 'jen'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You find out about the Academy team. It\'s an honor to be chosen. ',
        'Even though you know nothing about it. Or who even picks these things.'
      ],
      effects: {
        moodChange: 10,
        energyChange: -5,
        relationshipChanges: {
          keith: 2,
          jen: 2,
        },
        statChanges: {
          forehand: 1,
          backhand: 1,
          serve: 1,
          slice: 1,
          volley: 1,
        }
      },
      challengesAssigned: [
        ChallengeManager.createFromTemplate(CHALLENGE_TEAM_SPIRIT, {
          type: 'story',
          eventId: 'club_team_intro',
        }),
      ],
    }
  },

  {
    id: 'club_team_first_practice',
    name: 'First Team Practice',
    tags: ['team'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['club_team_intro', 'rival_first_encounter'],
      minDay: 5,
    },
    skippable: false,
    description: 'Your first practice with the Academy team. Try to play nice.',
    dialogue: [
      [null, ['You arrive early at the facility, but no one from your team is here yet. You hear some huge shots echoing from the furthest and dingiest looking practice court, hidden far from the entrance.']],
      [null, ['You decide to check it out, and you turn the corner to see one solitary player and an older coach smashing explosive shots against one another.']],
      [null, ['It sounds like gunfire. The player is really covering a lot of court, and the coach is definitely not. They seem to be having fun. They are still pushing each other around.']],
      ['jordan_rival', ['You know I beat this chump in juniors. When we were 14 I double bagelled him.']],
      ['jordan_rival', ['He\'s not even good. He stole my spotlight. And now he\'s some big champion and I\'m stuck with you on this pathetic club team.']],
      ['jordan_rival', ['You know how embarrassing that is for me? I\'ll make sure the coaches know what a mistake they made putting me on this team. And putting YOU on this team.']],
      [null, ['Some of your other teammates start to arrive, so you head back to the practice courts. You can\'t help but wonder who that was.']],
      ['coach_gonzalez', ['Alright, everyone, let\'s get started. ', {characterId: 'keith'}, '? I cannot believe you are on this team, buddy. ']],
      ['keith', ['Thanks, coach. Me either.']],
      ['jen', ['I\'m starting to think they got him mixed up with another ', {characterId: 'keith'}, '.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You finish your first practice with the Academy team. ', {characterId: 'jen'}, ' really had a strong showing and beat up on most of your team.',
        'You try to focus on staying loose and adapting to the faster pace of play. These players are a bit better than you\'ve played against before.'
      ],
      effects: {
        moodChange: 5,
        energyChange: -25,
        relationshipChanges: {
          keith: 1,
          jen: 2,
          jordan_rival: 2,
        },
        statChanges: {
          return: 2,
          spin: 2,
          placement: 1,
          offensive: 1,
          defensive: 1
        },
      },
    },
  },

  // ==========================================
  // Team Match #1: Aspen Slopes Academy
  // ==========================================

  {
    id: 'first_team_match_scheduled',
    name: 'First Team Match Announced',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['club_team_first_practice'],
      minDay: 7,
    },
    skippable: false,
    description: 'Your first team match is announced.',
    dialogue: [
      [null, ['After practice wraps up, the floodlights go dim and you find everyone huddled around a single bulletin board.']],
      ['keith', ['It\'s about time! I can finally snap my ten match losing streak. ', {characterId: 'greg'}, ' has been giving me the business.']],
      [null, [{characterId: 'greg'}, ' seemed unaware they were counting those matches. You turn to the board. The posting reads: "Academy Club Team vs Aspen Slopes Academy - Home Match"']],
      ['jen', ['Aspen Slopes? They\'re a combo skiing and tennis academy further up the mountains. Notoriously snobby.']],
      ['coach_gonzalez', ['They practice at a higher altitude than we do, which gives them an advantage when it comes to endurance.']],
      ['coach_gonzalez', ['You can check the lineup as well. ', {characterId: 'player'}, ', you\'ll be playing in the four spot. Kid\'s name is ', {characterId: 'chet_vale'}, '.']],
      ['keith', ['I don\'t like him already. That\'s like the son of an oil baron kind of name.']],
      ['jen', ['Come on, ', {characterId: 'keith'}, '. No need to judge a book by its cover.']],
      ['coach_gonzalez', ['Oh yeah, he\'s the son of an oil baron. Even among the Aspen Slopes kids, no one likes him. The only crowd you\'ll have to contend with is his butler.']],
      ['coach_gonzalez', ['He has a surprising work ethic to snob ratio, though. He\'s quite quick, so you\'re going to have to show some consistency. It\'ll be a good test.']]
    ],
    characters: ['keith', 'jen', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You get a chance to show your stuff in the first team match. You\'ll be facing Chet Vale from Aspen Slopes Academy. Good luck!',
      ],
      effects: {
        moodChange: 10,
        energyChange: 0,
        relationshipChanges: {
          keith: 1,
          jen: 1,
          coach_gonzalez: 2,
        },
        scheduledEvents: [
          {
            eventType: 'story_match',
            relativeDays: 2,
            scheduledTimeSlot: 1, // AFTERNOON
            metadata: {
              opponentId: 'chet_vale',
              opponentName: 'Chet Vale',
              opponentStats: {
                technical: {
                  serve: 22,
                  forehand: 25,
                  backhand: 20,
                  volley: 15,
                  overhead: 18,
                  dropShot: 12,
                  slice: 18,
                  return: 24,
                  spin: 20,
                  placement: 22,
                },
                physical: {
                  speed: 45,
                  stamina: 35,
                  strength: 18,
                  agility: 42,
                  recovery: 30,
                },
                mental: {
                  focus: 25,
                  anticipation: 30,
                  shotVariety: 20,
                  offensive: 22,
                  defensive: 35,
                },
              },
              opponentTier: 1,
              opponentDescription: 'A speedy but inexperienced player from Aspen Slopes Academy',
              prematchEventId: 'first_team_match_prematch',
              winEventId: 'first_team_match_win',
              lossEventId: 'first_team_match_loss',
              surface: 'hard',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Aspen Slopes',
              matchDescription: 'Your first official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'first_team_match_prematch',
    name: 'Before the Match',
    tags: ['story_match','team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['first_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Aspen Slopes team arrives for your first team match.',
    dialogue: [
      [null, ['The Aspen Slopes team bus pulls up to the Academy courts. They file out in matching white and blue jackets.']],
      ['keith', ['They look... cold.']],
      ['jen', ['They train on a mountain, ', {characterId: 'keith'}, '. And just think about the altitude.']],
      [null, ['You spot your opponent warming up on the far court. He has the latest shoes, the latest racquet, and a coach who looks... expensive.']],
      ['chet_vale', ['You must be my matchup. I would say it\'s a pleasure, but I\'m not in the business of lying.']],
      [null, ['He walks over and extends a hand. His handshake is brief and cold. He does that thing where he tries to crush your hand.']],
      ['chet_vale', ['Are these the courts you use? We get ours resurfaced monthly. They\'re always pristine.']],
      [null, ['His laugh is from a higher tax bracket than anyone you know.']],
      ['coach_gonzalez', ['He\'s fast, but he\'s not half as polished as that gorgeous and expensive-looking racquet he has. Take him down!']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'chet_vale'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You head to the courts for your first team match. Your other teammates take their respective courts.',
        'You feel some team pride for this Academy for one of the first times you remember.'
      ],
      effects: {
        moodChange: 5,
        energyChange: -5,
        relationshipChanges: {
          chet_vale: 2,
        },
      }
    }
  },

  {
    id: 'first_team_match_win',
    name: 'Victory!',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['first_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your first team match!',
    dialogue: [
      [null, ['The final shot lands in. ', {characterId: 'chet_vale'}, ' flies by at top speed and nearly crashes into the stands chasing it down.']],
      ['chet_vale', ['You must have cheated! This court is terrible!']],
      [null, [{characterId: 'chet_vale'}, ' trudges to the net, both surprised and out of breath.']],
      ['chet_vale', ['My father will be hearing of this. Consider yourself banned from every mountain in the north half of this county.']],
      [null, ['Your teammates cheer you on from the sidelines.']],
      ['keith', ['I have no idea how you pulled it off! I think I had the score backwards.']],
      ['jen', ['Not bad at all! You were able to close out the big points, and didn\'t give up.']],
      ['coach_gonzalez', ['Good match. You didn\'t give up free points and you made him work. That wins matches at this level.']],
      [null, ['Riverside ends up winning the overall team match, as well. It\'s a great start to the season!']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'chet_vale'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You\'ve won your first team match! The feeling of helping your team come out on top is something special.',
        'I hope you don\'t plan on skiing anytime soon.'
      ],
      effects: {
        moodChange: 25,
        energyChange: -10,
        relationshipChanges: {
          keith: 3,
          jen: 2,
          coach_gonzalez: 3,
          chet_vale: -5,
        },
        statChanges: {
          speed: 2,
          stamina: 1,
          agility: 1,
          volley: 2
        },
        itemsGained: [ENERGY_DRINK],
      }
    }
  },

  {
    id: 'first_team_match_loss',
    name: 'A Tough Loss',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['first_team_match_prematch'],
      excludedEvents: ['first_team_match_win']
    },
    skippable: false,
    description: 'You lose your first team match.',
    dialogue: [
      [null, ['The final point sails past you. You\'ve lost.']],
      [null, [{characterId: 'chet_vale'}, ' glides up to the net, somehow still full of energy. He shakes your hand coldly.']],
      ['chet_vale', ['I expected this outcome. I\'ve been running at my father\'s country club my whole life. It was easy to wear you down.']],
      [null, ['Your teammates still cheer, looking supportive despite the loss.']],
      ['jen', ['It happens. He was really quick out there. Not bad for a first match!']],
      ['keith', ['Yeah, no shame in losing man. You looked really good in the points I was watching.']],
      ['coach_gonzalez', ['You still competed all the way through, and today it wasn\'t enough. But it\'s just one match.']],
      [null, ['Despite your loss, Riverside manages to win overall. Something to ease the sting.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'chet_vale'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost your match, but Riverside won overall. There\'s still some room to improve.',
        {characterId: 'chet_vale'}, ' is somehow already skiing back to the team bus.'
      ],
      effects: {
        moodChange: -10,
        energyChange: -15,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 1,
          chet_vale: 3,
        },
        statChanges: {
          speed: 1,
          agility: 1,
          defensive: 1,
        }
      }
    }
  },

  // ==========================================
  // Team Match #2: Azalea Forest Tennis Club
  // ==========================================

  {
    id: 'second_team_match_scheduled',
    name: 'Second Team Match Announced',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['first_team_match_prematch'],
    },
    skippable: false,
    description: 'Your second team match is announced.',
    dialogue: [
      [null, ['The team gathers up after practice around the single bulletin board.']],
      [null, ['A new match has been scheduled against the Azalea Forest Tennis Club.']],
      ['jen', ['Azalea Forest doesn\'t come out to the city very often. They like to stay off-grid.']],
      ['greg', ['I heard they have all-grass courts.']],
      ['coach_gonzalez', ['This will be a tough match. Azalea Forest has dominated the academy gardening circuit for decades.']],
      ['coach_gonzalez', [{characterId: 'player'}, ' , you\'ll be playing the four again, taking on ', {characterId: 'richard_soil'}, '.']],
      ['jen', ['Good luck. I played him last year and it felt like my feet were rooted to the ground.']],
      ['greg', ['You\'re all lucky. They put me against Redwood Arbor. He just transferred in from San Francisco Botany Tech.']]
    ],
    characters: ['jen', 'greg', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'A second team match is a second opportunity to show your improvement. Expect this to be a bit tougher!'
      ],
      effects: {
        moodChange: 10,
        energyChange: 5,
        relationshipChanges: {
          jen: 2,
          greg: 2,
          coach_gonzalez: 2
        },
        scheduledEvents: [
          {
            eventType: 'story_match',
            relativeDays: 2,
            scheduledTimeSlot: 1, // AFTERNOON
            metadata: {
              opponentId: 'richard_soil', 
              opponentName: 'Rich Soil',
              opponentStats: {
                technical: {
                  serve: 38,
                  forehand: 42,
                  backhand: 36,
                  volley: 42,
                  overhead: 32,
                  dropShot: 31,
                  slice: 41,
                  return: 40,
                  spin: 38,
                  placement: 41,
                },
                physical: {
                  speed: 41,
                  stamina: 40,
                  strength: 40,
                  agility: 36,
                  recovery: 30,
                },
                mental: {
                  focus: 36,
                  anticipation: 33,
                  shotVariety: 28,
                  offensive: 40,
                  defensive: 28,
                },
              },
              opponentTier: 1,
              opponentDescription: 'A pretty strong well-rounded player from Azalea Forest',
              prematchEventId: 'second_team_match_prematch',
              winEventId: 'second_team_match_win',
              lossEventId: 'second_team_match_loss',
              surface: 'grass',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Azalea Forest',
              matchDescription: 'Your second official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'second_team_match_prematch',
    name: 'Before the Match',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['second_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Azalea Forest team arrives for your second team match.',
    dialogue: [
      [null, ['The Azalea Forest players emerge from the trees, seemingly a little wary of the sunlight.']],
      ['keith', ['...were they there the whole time?']],
      [null, ['It\'s not clear. You try to focus on the task at hand.']],
      ['jen', ['Just remember, we\'re playing on grass, so we should aim to hit more volleys and get up in the court.']],
      [null, ['A long shadow appears on the ground behind you and you turn around with a jump.']],
      ['richard_soil', ['You must be my opponent. The name\'s Rich. I hope you\'ve done your homework. I\'ve done extensive research into our environment here.']],
      ['richard_soil', ['These courts aren\'t even using Perennial Ryegrass. You mongrels are using Bermuda. ']],
    ],
    characters: ['keith', 'jen', 'richard_soil'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You head out onto the court for your second team match. You\'re getting a little better at this.',
        'Actually, you can kinda see what ', {characterId: 'rich'}, ' was saying about the grass.'
      ],
      effects: {
        moodChange: 5,
        energyChange: -10,
        relationshipChanges: {
          richard_soil: 2
        },
      }
    }
  },

  {
    id: 'second_team_match_win',
    name: 'Victory!',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['second_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your second team match!',
    dialogue: [
      [null, ['You breathe a sigh of relief as ', {characterId: 'richard_soil'}, '\'s last shot flies over your head.']],
      ['richard_soil', ['You should fire your landscaping guy. Plus the net is too high anyway, so this match shouldn\'t count.']],
      [null, ['You exchange a quick handshake and head back to your cheering teammates.']],
      ['jen', ['Amazing job out there! You had to try a few different things before you found what worked.']],
      [null, ['After a few seconds, you finally think of something witty to say to ', {characterId: 'richard_soil'}, '.']],
      [null, ['You turn around only to see he\'s completely disappeared. Dispersed into the shadows.']],
      [null, ['Oh, actually he was just in the bathroom. The moment has passed anyway.']],
      ['coach_gonzalez', ['Another great performance! Keep it up and you just might keep moving up the lineup.']],
      [null, ['Riverside sweeps the team match, winning all the courts. Great showing!']]
    ],
    characters: ['richard_soil', 'jen', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'Another team match win! You feel yourself gaining some confidence and becoming a more trusted member of the team. ',
        'You find a small plant on the ground with your name on the tag. Someone left it for you.',
      ],
      effects: {
        moodChange: 20,
        energyChange: -20,
        relationshipChanges: {
          keith: 3,
          jen: 2,
          coach_gonzalez: 3,
          richard_soil: -5
        },
        statChanges: {
          backhand: 1,
          slice: 2,
          agility: 2,
          shotVariety: 1
        },
        itemsGained: [LUCKY_SPROUT]
      }
    }
  },

  {
    id: 'second_team_match_loss',
    name: 'A Tough Loss',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['second_team_match_prematch'],
      excludedEvents: ['second_team_match_win']
    },
    skippable: false,
    description: 'You lose your second team match',
    dialogue: [
      [null, ['The final shot scrapes the line and spins past you. You lose.']],
      [null, ['You feel like you can hardly walk, and yet ', {characterId: 'richard_soil'}, ' awaits you at the net - full of energy.']],
      ['richard_soil', ['If it makes you feel better, you play great for city folk. Come find me if you want to escape it all.']],
      [null, ['Your teammates are still supportive, and you join them in rooting for your team in the other matches.']],
      ['jen', ['You know we\'ll always cheer for you either way!']],
      ['coach_gonzalez', ['I know it\'s hard to look past the plant jokes, but this is really a growth moment for you.']],
      [null, ['Your other teammates manage to come back in a long tiebreak, and Riverside wins the match overall. ']]
    ],
    characters: ['richard_soil', 'jen', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost your match, but Riverside won overall. You still find some moments to learn from.',
        'You find a small plant on the ground with your name on the tag. Someone left it for you.'
      ],
      effects: {
        moodChange: -10,
        energyChange: -20,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 2,
          richard_soil: 1
        },
        statChanges: {
          volley: 1,
          overhead: 1,
          serve: 2,
        }
      }
    }
  },

  // ==========================================
  // Team Match #3: Millbrook Mime Academy
  // ==========================================

  {
    id: 'third_team_match_scheduled',
    name: 'Third Team Match Announced [AI-gen]', // TODO: Complete this event
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['second_team_match_prematch'],
    },
    skippable: false,
    description: 'Your third team match is announced.',
    dialogue: [
      [null, ['The bulletin board has a new posting. You can tell something is unusual because nobody is talking about it. Like, at all.']],
      ['keith', ['I tried to read it out loud and nothing came out of my mouth. Something is wrong.']],
      ['jen', ['Millbrook Mime Academy. They\'re a performing arts school. Apparently they added a tennis program six years ago and haven\'t said a single word about it.']],
      ['coach_gonzalez', ['They are genuinely excellent tennis players. But they never speak. Not in warm-ups. Not during points. Not during changeovers. The silence is absolutely going to get to you.']],
      ['coach_gonzalez', [{characterId: 'player'}, ', your opponent is ', {characterId: 'marcel_blanc'}, '. He placed second in juniors last year and never once called his shots in or out. Judges hated it. He won anyway.']],
      ['keith', ['What do you even say to someone who refuses to speak? How do you trash talk? How do I make him feel bad??']],
      ['jen', ['Keith. Maybe just... don\'t.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'A team match against Millbrook Mime Academy. Absolutely nobody at the Academy seems to know how to feel about this.',
        'You decide you\'ll be totally fine with the silence. You\'re a calm, focused person.',
      ],
      effects: {
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 1,
          keith: 1,
          coach_gonzalez: 1,
        },
        scheduledEvents: [
          {
            eventType: 'story_match',
            relativeDays: 2,
            scheduledTimeSlot: 1, // AFTERNOON
            metadata: {
              opponentId: 'marcel_blanc',
              opponentName: 'Marcel Blanc',
              opponentStats: {
                technical: {
                  serve: 38,
                  forehand: 40,
                  backhand: 38,
                  volley: 32,
                  overhead: 34,
                  dropShot: 36,
                  slice: 40,
                  return: 38,
                  spin: 38,
                  placement: 42,
                },
                physical: {
                  speed: 38,
                  stamina: 40,
                  strength: 34,
                  agility: 42,
                  recovery: 36,
                },
                mental: {
                  focus: 46,
                  anticipation: 42,
                  shotVariety: 38,
                  offensive: 36,
                  defensive: 40,
                },
              },
              opponentTier: 1,
              opponentDescription: 'A eerily silent and highly focused player from Millbrook Mime Academy',
              prematchEventId: 'third_team_match_prematch',
              winEventId: 'third_team_match_win',
              lossEventId: 'third_team_match_loss',
              surface: 'clay',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Millbrook Mime Academy',
              matchDescription: 'Your third official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'third_team_match_prematch',
    name: 'Before the Match [AI-gen]', // TODO: Complete this event
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Millbrook Mime Academy team arrives for your third team match.',
    dialogue: [
      [null, ['The Millbrook bus pulls up. The doors open. Nobody gets off.']],
      [null, ['After about ninety seconds of silence, players begin stepping off one by one. They don\'t look around. They don\'t acknowledge your team. They walk directly to their assigned courts.']],
      ['keith', ['I said hello to three of them. Not one reacted. Is this legal?']],
      [null, ['You hear a single slow clap from the far end of the court. You turn to see your opponent.']],
      ['marcel_blanc', ['...']],
      [null, [{characterId: 'marcel_blanc'}, ' tilts his head and raises one eyebrow. He points to the court, then back to you, then mimes an elaborate swing ending with the universal gesture for "you\'re done."']],
      ['jen', ['He just mimed your entire defeat. That was very detailed.']],
      ['keith', ['I\'m going to talk to him THE ENTIRE MATCH. I feel called to do this.']],
      ['coach_gonzalez', ['Please do not do that, ', {characterId: 'keith'}, '. ', {characterId: 'player'}, ', he\'s going to try to get in your head. Ignore it. Play your game.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'marcel_blanc'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You take the court. ',{characterId: 'marcel_blanc'}, ' spins his racquet. It lands on the wrong side. He doesn\'t say anything. He just spins it again.',
        'You\'re already a little rattled.',
      ],
      effects: {
        moodChange: -5,
        energyChange: -5,
        relationshipChanges: {
          marcel_blanc: 1,
        },
      }
    }
  },

  {
    id: 'third_team_match_win',
    name: 'Victory! [AI-gen]', // TODO: Complete this event
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your third team match!',
    dialogue: [
      [null, ['The match point sails by ', {characterId: 'marcel_blanc'}, '. He freezes. You hold your breath.']],
      [null, ['Slowly, he walks to the net. He extends his hand. When you shake it, he nods once, deeply. Then he performs a brief but unmistakably sincere mime of removing his hat and bowing.']],
      ['keith', ['He BOWED. He MIMED a bow! I need to lie down.']],
      ['jen', ['That\'s actually the highest compliment in mime culture. I think you\'ve earned his respect.']],
      [null, [{characterId: 'marcel_blanc'}, ' turns and walks back to his side. He pauses, turns back, and mimes shooting you a finger gun. Then he\'s gone.']],
      ['coach_gonzalez', ['You stayed calm and let your game do the talking. Fitting, considering the circumstances.']],
      [null, ['Riverside wins the overall team match. Even ', {characterId: 'keith'}, '\'s court, which raises several questions.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'marcel_blanc'],
    options: [],
    defaultOutcome: {
      resultText: [
        'A win against Millbrook Mime Academy. You feel you have earned something today, but you couldn\'t quite say what.',
        'Keith claims he broke through to one of their players by the end of the match. No one believes him.',
      ],
      effects: {
        moodChange: 25,
        energyChange: -20,
        relationshipChanges: {
          keith: 3,
          jen: 2,
          coach_gonzalez: 3,
          marcel_blanc: 2,
        },
        statChanges: {
          focus: 3,
          anticipation: 2,
          placement: 2,
        },
        itemsGained: [BANANA],
      }
    }
  },

  {
    id: 'third_team_match_loss',
    name: 'A Tough Loss [AI-gen]', // TODO: Complete this event
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_prematch'],
      excludedEvents: ['third_team_match_win']
    },
    skippable: false,
    description: 'You lose your third team match.',
    dialogue: [
      [null, ['Your last shot clips the net and drops into your side of the court. ', {characterId: 'marcel_blanc'}, ' doesn\'t react.']],
      [null, ['He walks to the net with the same expression he\'s had the entire match, which is no expression. He shakes your hand. He mimes applause. It\'s deeply unsettling.']],
      ['keith', ['He\'s been doing a mime of your entire match for the last ten minutes. It\'s remarkably accurate and I don\'t like it.']],
      ['jen', ['He\'s really good. You competed hard. This wasn\'t your day.']],
      ['coach_gonzalez', ['You let the silence get to you early. Next time, just focus on the ball. The ball makes noise.']],
      [null, ['Riverside still wins the team match overall. The scoreboard stays quiet. Everything stays quiet.']],
      ['keith', ['I asked one of their players if they needed directions to the bus. He just mimed a car driving away. So I think they\'re fine.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'marcel_blanc'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost your match, but Riverside won overall. ',
        {characterId: 'marcel_blanc'}, ' has already departed without a word. Or any sound at all. The bus didn\'t even honk.'
      ],
      effects: {
        moodChange: -10,
        energyChange: -20,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 2,
          marcel_blanc: 3,
        },
        statChanges: {
          focus: 2,
          defensive: 2,
          anticipation: 1,
        }
      }
    }
  },

  // ==========================================
  // Team Match #4: Portside Maritime Academy
  // ==========================================

  {
    id: 'fourth_team_match_scheduled',
    name: 'Fourth Team Match Announced [AI-gen]', // TODO: Complete this event
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_prematch'],
    },
    skippable: false,
    description: 'Your fourth team match is announced.',
    dialogue: [
      [null, ['The bulletin board has a new match posted. You read it twice to make sure you haven\'t misunderstood.']],
      ['keith', ['"Portside Maritime Academy." Do they... do they have courts on a boat?']],
      ['jen', ['No, they have a naval curriculum that includes tennis. They believe racquet sports build spatial awareness for navigation.']],
      ['greg', ['I heard their courts are painted with latitude lines.']],
      ['coach_gonzalez', ['They use a lot of cross-court angles and they communicate exclusively in nautical terms. It will sound like gibberish but don\'t be fooled - they\'re extremely well-coached.']],
      ['coach_gonzalez', [{characterId: 'player'}, ', you\'ve got ', {characterId: 'captain_wade'}, '. He\'s their top singles player. Very consistent from the baseline, plays like he\'s got all day and the tide is with him.']],
      ['keith', ['What does that even MEAN though.']],
      ['coach_gonzalez', ['I don\'t know. But he wins.']],
    ],
    characters: ['keith', 'jen', 'greg', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'Portside Maritime Academy. You look up what a "fathom" is. You\'re not sure it helps.',
      ],
      effects: {
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 1,
          greg: 1,
          coach_gonzalez: 2,
        },
        scheduledEvents: [
          {
            eventType: 'story_match',
            relativeDays: 2,
            scheduledTimeSlot: 1, // AFTERNOON
            metadata: {
              opponentId: 'captain_wade',
              opponentName: 'Captain Wade Heron',
              opponentStats: {
                technical: {
                  serve: 46,
                  forehand: 50,
                  backhand: 44,
                  volley: 44,
                  overhead: 42,
                  dropShot: 40,
                  slice: 48,
                  return: 48,
                  spin: 46,
                  placement: 51,
                },
                physical: {
                  speed: 46,
                  stamina: 51,
                  strength: 46,
                  agility: 44,
                  recovery: 46,
                },
                mental: {
                  focus: 48,
                  anticipation: 51,
                  shotVariety: 44,
                  offensive: 46,
                  defensive: 48,
                },
              },
              opponentTier: 1,
              opponentDescription: 'A steady, patient player from Portside Maritime Academy who communicates entirely in nautical jargon',
              prematchEventId: 'fourth_team_match_prematch',
              winEventId: 'fourth_team_match_win',
              lossEventId: 'fourth_team_match_loss',
              surface: 'hard',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Portside Maritime',
              matchDescription: 'Your fourth official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'fourth_team_match_prematch',
    name: 'Before the Match [AI-gen]', // TODO: Complete this event
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Portside Maritime Academy team arrives for your fourth team match.',
    dialogue: [
      [null, ['The Portside team arrives in matching navy-and-white uniforms. They walk in single file. There is unnecessary precision to all of this.']],
      ['captain_wade', ['Permission to take court four, Coach?']],
      [null, ['He\'s talking to their own coach, who responds: "Permission granted, Captain."']],
      ['keith', ['He called himself Captain. His name is Captain. They call him Captain. Is he actually a captain?']],
      ['jen', ['He runs the tennis program AND the school\'s sailing club. So. Sort of.']],
      ['captain_wade', ['Ah. You must be my port-side adversary today. Good winds to you.']],
      [null, ['He looks you up and down like he\'s assessing sea conditions.']],
      ['captain_wade', ['I\'ve reviewed your stats. Your starboard game is strong, but I\'ll be cutting off your windward lane and forcing you aft. Nothing personal. Just navigation.']],
      ['keith', ['I understood "your" and "just." The rest is noise.']],
      ['coach_gonzalez', ['He means he\'s going to push you back and wide to your backhand side. Keep your feet moving or he\'ll have you on the ropes. ...Or the ropes. Whatever they say.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'captain_wade'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You head to the court. ', {characterId: 'captain_wade'}, ' is already there, checking the net tension with practiced precision.',
        'He checks it twice. You\'re not sure why, but it starts to seem reasonable.',
      ],
      effects: {
        moodChange: -5,
        energyChange: -5,
        relationshipChanges: {
          captain_wade: 2,
        },
      }
    }
  },

  {
    id: 'fourth_team_match_win',
    name: 'Victory! [AI-gen]', // TODO: Complete this event
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your fourth team match!',
    dialogue: [
      ['captain_wade', ['Man overboard! ...Figuratively. That is to say, I have lost this match.']],
      [null, [{characterId: 'captain_wade'}, ' approaches the net with a measured hand shake. He\'s clearly not used to this particular outcome.']],
      ['captain_wade', ['You cut off my windward lane before I could establish it. I should have tacked earlier. Well sailed.']],
      ['keith', ['He said "well sailed"! You didn\'t even sail anything!']],
      ['jen', ['I think it\'s the highest compliment he gives.']],
      ['captain_wade', ['Your anchor point on the forehand side became impossible to navigate around after the fifth game. I\'ll chart this for future expeditions.']],
      [null, ['He pulls out a small notebook and actually writes something down. You wonder if this is how he reviews all his matches.']],
      ['coach_gonzalez', ['You stayed disciplined and kept him guessing. Really strong performance today.']],
      [null, ['Riverside wins the overall team match. Keith wins his court, which he announces to everyone still on the premises.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'captain_wade'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You\'ve navigated to victory. ', {characterId: 'captain_wade'}, ' files a small chart in his notebook and shakes your hand one final time before the team departs.',
        'He sends you a very formal handwritten note the next day. It references your "port-side forehand trajectory" three times.',
      ],
      effects: {
        moodChange: 25,
        energyChange: -20,
        relationshipChanges: {
          keith: 3,
          jen: 2,
          coach_gonzalez: 3,
          captain_wade: 2,
        },
        statChanges: {
          placement: 3,
          anticipation: 2,
          stamina: 2,
        },
        itemsGained: [HEADBAND],
      }
    }
  },

  {
    id: 'fourth_team_match_loss',
    name: 'A Tough Loss [AI-gen]', // TODO: Complete this event
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_prematch'],
      excludedEvents: ['fourth_team_match_win']
    },
    skippable: false,
    description: 'You lose your fourth team match.',
    dialogue: [
      ['captain_wade', ['Land ho. Match point. Well competed.']],
      [null, [{characterId: 'captain_wade'}, ' meets you at the net. His handshake is firm. He\'s already got the notebook out.']],
      ['captain_wade', ['You overcomplicated your approach in the second set. You tried to find the deep water when the coast was right in front of you.']],
      [null, ['You nod like you understood that.']],
      ['jen', ['You had your moments out there. He just found answers every time you pushed.']],
      ['keith', ['He kept saying things that sounded like directions and I still can\'t figure out if it was trash talk or not.']],
      ['coach_gonzalez', ['You played well enough to win. Today he was just a little better. Learn from it and bring it next time.']],
      [null, ['Riverside wins the team match overall. ', {characterId: 'captain_wade'}, ' charts that too, presumably.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'captain_wade'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost your match, but Riverside won overall.',
        'You find yourself briefly wondering what a "windward lane" is. You look it up. It doesn\'t help as much as you hoped.',
      ],
      effects: {
        moodChange: -10,
        energyChange: -20,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 2,
          captain_wade: 3,
        },
        statChanges: {
          placement: 2,
          defensive: 2,
          anticipation: 1,
        }
      }
    }
  },

  // ==========================================
  // Team Match #5: Sunridge Napping Institute
  // ==========================================

  {
    id: 'fifth_team_match_scheduled',
    name: 'Fifth Team Match Announced [AI-gen]', // TODO: Complete this event
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_prematch'],
    },
    skippable: false,
    description: 'Your fifth team match is announced.',
    dialogue: [
      [null, ['A new posting goes up on the bulletin board. There is already a piece of paper attached to it that reads "wake us up if this is important."']],
      ['jen', ['Sunridge Napping Institute. They\'re a sleep science research school. Their tennis team is ranked second in the division.']],
      ['keith', ['Behind us??']],
      ['jen', ['Behind us.']],
      ['greg', ['I heard they do all their tactical preparation during REM sleep. Allegedly their coach just reads match footage out loud while they nap.']],
      ['coach_gonzalez', ['Don\'t underestimate them. They have an incredible ability to conserve energy during long points. You won\'t be able to wear them down. They\'re immune to it.']],
      ['coach_gonzalez', [{characterId: 'player'}, ', your opponent is ', {characterId: 'dozy_mcdonnell'}, '. He\'s won three consecutive matches this season and reportedly fell briefly asleep during a changeover in two of them.']],
      ['keith', ['That CANNOT be real.']],
      ['coach_gonzalez', ['He woke up and won both matches. I don\'t know what to tell you.']],
    ],
    characters: ['keith', 'jen', 'greg', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'Sunridge Napping Institute. You try to look up their recent results. Their team website hasn\'t been updated in several months.',
        'The last entry says "good naps had by all." Then there\'s nothing.',
      ],
      effects: {
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 1,
          greg: 1,
          coach_gonzalez: 2,
        },
        scheduledEvents: [
          {
            eventType: 'story_match',
            relativeDays: 2,
            scheduledTimeSlot: 1, // AFTERNOON
            metadata: {
              opponentId: 'dozy_mcdonnell',
              opponentName: 'Dozy McDonnell',
              opponentStats: {
                technical: {
                  serve: 48,
                  forehand: 53,
                  backhand: 46,
                  volley: 44,
                  overhead: 42,
                  dropShot: 46,
                  slice: 51,
                  return: 51,
                  spin: 48,
                  placement: 51,
                },
                physical: {
                  speed: 44,
                  stamina: 59,
                  strength: 44,
                  agility: 46,
                  recovery: 62,
                },
                mental: {
                  focus: 51,
                  anticipation: 53,
                  shotVariety: 46,
                  offensive: 46,
                  defensive: 55,
                },
              },
              opponentTier: 1,
              opponentDescription: 'A deceptively relaxed player from Sunridge Napping Institute with extraordinary stamina and recovery',
              prematchEventId: 'fifth_team_match_prematch',
              winEventId: 'fifth_team_match_win',
              lossEventId: 'fifth_team_match_loss',
              surface: 'clay',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Sunridge Napping Institute',
              matchDescription: 'Your fifth official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'fifth_team_match_prematch',
    name: 'Before the Match [AI-gen]', // TODO: Complete this event
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fifth_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Sunridge Napping Institute team arrives for your fifth team match.',
    dialogue: [
      [null, ['The Sunridge minivan pulls up to the courts. Nothing happens for a moment. Then, very slowly, the side door slides open.']],
      [null, ['The Sunridge players step out one by one, each carrying a small travel pillow. Two of them are already wearing eye masks on their foreheads. One appears to still be asleep.']],
      ['keith', ['Is he sleepwalking to court? He\'s sleepwalking to court.']],
      ['jen', ['Apparently they nap on all road trips. It\'s part of their pre-match routine.']],
      [null, ['A figure ambles over to you. He has the eyes of someone who just woke up and the posture of someone who might go back to sleep.']],
      ['dozy_mcdonnell', ['Oh. You\'re my match. Great. ', '*yawns*', ' Sorry, just finishing a dream. Good one too.']],
      ['dozy_mcdonnell', ['Don\'t worry about me. I\'ll be fully awake by the third game. Probably. I had a lot of chamomile last night.']],
      [null, ['He does a slow neck roll, closes his eyes for four full seconds, then opens them again. He looks... ready?']],
      ['coach_gonzalez', ['DO NOT fall for it. The sleepiness is either real and completely irrelevant, or fake and extremely manipulative. Either way you need to play your best tennis.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'dozy_mcdonnell'],
    options: [],
    defaultOutcome: {
      resultText: [
        {characterId: 'dozy_mcdonnell'}, ' yawns one more time, tucks his travel pillow under his arm, and ambles to the baseline.',
        'You feel weirdly sleepy just watching him.',
      ],
      effects: {
        moodChange: -5,
        energyChange: -5,
        relationshipChanges: {
          dozy_mcdonnell: 1,
        },
      }
    }
  },

  {
    id: 'fifth_team_match_win',
    name: 'Victory! [AI-gen]', // TODO: Complete this event
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fifth_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your fifth team match!',
    dialogue: [
      [null, ['Your final shot clips the line. You pump your fist.']],
      [null, [{characterId: 'dozy_mcdonnell'}, ' watches it land, tilts his head, and then nods slowly.']],
      ['dozy_mcdonnell', ['Huh. Good match. You were relentless. I\'m impressed. Also exhausted. That\'s very rare for me.']],
      [null, ['He shakes your hand with a surprisingly firm grip.']],
      ['dozy_mcdonnell', ['I\'m going to think about that backhand winner while I fall asleep tonight. That\'s the highest praise I give.']],
      ['keith', ['He looks half asleep RIGHT NOW and he just played the best tennis I\'ve ever seen. I have so many questions about human biology.']],
      ['jen', ['You really pushed the pace early before he could settle in. Really smart game plan.']],
      ['coach_gonzalez', ['That was a mature performance. You identified his strength and played around it. That\'s the mark of a real competitor.']],
      [null, ['Riverside wins the team match! ', {characterId: 'dozy_mcdonnell'}, ' is already asleep in the back of the minivan before it even leaves the parking lot.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'dozy_mcdonnell'],
    options: [],
    defaultOutcome: {
      resultText: [
        'A well-earned win. You out-hustled one of the most relaxed humans you\'ve ever met.',
        'Jen says that counts double.',
      ],
      effects: {
        moodChange: 30,
        energyChange: -25,
        relationshipChanges: {
          keith: 3,
          jen: 3,
          coach_gonzalez: 3,
          dozy_mcdonnell: 2,
        },
        statChanges: {
          stamina: 3,
          offensive: 2,
          speed: 2,
          recovery: 2,
        },
        itemsGained: [ENERGY_DRINK],
      }
    }
  },

  {
    id: 'fifth_team_match_loss',
    name: 'A Tough Loss [AI-gen]', // TODO: Complete this event
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fifth_team_match_prematch'],
      excludedEvents: ['fifth_team_match_win']
    },
    skippable: false,
    description: 'You lose your fifth team match.',
    dialogue: [
      [null, ['The match ends. ', {characterId: 'dozy_mcdonnell'}, ' seemed to grow more alert as the match went on, which felt deeply unfair.']],
      ['dozy_mcdonnell', ['Good match. You pushed me further than most. I was actually awake for the whole thing, which is... unusual.']],
      [null, ['He pats you on the shoulder on the way to the net. Genuinely kind.']],
      ['dozy_mcdonnell', ['Rest more before your matches. I mean this professionally. Sleep is the original performance enhancer.']],
      [null, ['He gives you a business card. It just reads "Sleep Well." with a phone number. No name. No logo.']],
      ['jen', ['You competed really hard out there. He just had an answer for everything.']],
      ['keith', ['I still cannot believe you lost to a guy who looked like he was about to ask for a bedtime story.']],
      ['coach_gonzalez', ['That recovery stat of his is no joke. You need to sharpen up your ability to put points away early. Don\'t let him settle.']],
      [null, ['Riverside wins the team match overall. ', {characterId: 'dozy_mcdonnell'}, ' is asleep before the handshake line finishes.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'dozy_mcdonnell'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost to Dozy McDonnell. Riverside still won the team match overall.',
        'You go to bed earlier than usual that night. The business card is on your nightstand.',
      ],
      effects: {
        moodChange: -10,
        energyChange: -20,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 2,
          dozy_mcdonnell: 3,
        },
        statChanges: {
          stamina: 2,
          recovery: 3,
          offensive: 1,
        }
      }
    }
  },

  /** Sponsor Events */

  /**
   * This storyline covers the player's journey through sponsorship opportunities and media interactions. As they improve in tier,
   * they will be presented with more choices for sponsorships and media responses. The "media" in this case is the coaches and other players at the
   * Academy, as well as fans who in this world follow academy tennis. It is expected that teammates, rivals, coaches, and fans will all have 
   * opinions on the player's choices and may influence their career path.
   */
  {
    id: 'sponsor_first_offer',
    name: 'First Sponsorship Offer',
    tags: ['sponsor', 'decision', 'media'],
    timeSlotsRequired: 2,
    prerequisites: {
      minMatchesWon: 3,
      minDay: 15,
    },
    skippable: true,
    description: 'A local sports equipment company has noticed your recent wins and wants to sponsor you.',
    dialogue: [
      ['sponsor_rep', ['We\'ve been watching your progress, and we\'re impressed. We\'d like to offer you a sponsorship deal - free equipment and a small monthly stipend in exchange for wearing our gear and doing some promotional appearances. What do you say?']],
    ],
    characters: ['sponsor_rep'],
    options: [
      {
        id: 'accept_immediately',
        text: 'Accept Immediately',
        emoji: '✅',
        description: 'Take the deal as offered',
        outcome: {
          resultText: ['You eagerly accept the sponsorship deal. The representative is pleased that you ask no questions. You receive your first shipment of equipment and a small signing bonus.'],
          effects: {
            statChanges: { serve: 2, forehand: 2 },
            moodChange: 20,
            energyChange: -5,
            itemsGained: [TOURNAMENT_OUTFIT, HEADBAND],
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_SPONSOR_WORTHY, {
              type: 'story',
              eventId: 'sponsor_first_offer',
            }),
          ],
        },
      },
      {
        id: 'negotiate',
        text: 'Negotiate Terms',
        emoji: '💼',
        description: 'Try to get a better deal',
        prerequisites: {
          stats: { anticipation: { min: 30 } },
        },
        outcome: {
          resultText: ['You confidently negotiate for better terms. The representative respects your business acumen and agrees to increase the monthly stipend by 10%. You were just bluffing, but it seems like it worked.'],
          effects: {
            statChanges: { serve: 3, forehand: 3, strength: 2 },
            moodChange: 30,
            energyChange: -10,
            itemsGained: [SPONSOR_OUTFIT, PRO_RACQUET],
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_SPONSOR_WORTHY, {
              type: 'story',
              eventId: 'sponsor_first_offer',
            }),
          ],
        },
      },
      {
        id: 'decline_politely',
        text: 'Decline Politely',
        emoji: '🤝',
        description: 'Turn down the offer to focus on development',
        outcome: {
          resultText: ['You politely decline, explaining that you want to focus on your development before taking on sponsorship obligations. The representative seems to take it well. Maybe too well... I hope they come back soon.'],
          effects: {
            statChanges: { recovery: 2, shotVariety: 1 },
            moodChange: 10,
            energyChange: 0,
          },
        },
      },
    ],
  },

  {
    id: 'media_interview',
    name: 'First Media Interview',
    tags: ['media', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesWon: 5,
      minDay: 20,
    },
    skippable: true,
    description: 'A local sports journalist wants to interview you about your tennis journey.',
    dialogue: [
      ['journalist', ['Our audience absolutely loves your story. What can you tell us about ', {characterId: 'jordan_rival'}, '?']],
      ['player', ['I- Oh? What?']],
      ['journalist', [{characterId: 'jordan_rival'}, ' has been one of the hottest prospects in tennis, both figuratively and literally.']],
      ['journalist', ['How did you two meet? Is there a story behind your rivalry? What does he smell like?']],
    ],
    characters: ['journalist'],
    options: [],
    defaultOutcome: {
      resultText: ['You give your best effort during the interview, but ultimately you\'re still confused. Everyone seems to know ', {characterId: 'jordan_rival'}, ' except you.'],
      effects: {
        statChanges: { stamina: 2, overhead: 1 },
        moodChange: -5,
        energyChange: -5,
      }
    }
  },

  {
    id: 'agent_approach',
    name: 'Agent Wants to Represent You',
    tags: ['agent', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      minMatchesWon: 8,
      minDay: 30,
      completedEvents: ['sponsor_first_offer'],
    },
    skippable: true,
    description: 'A sports agent approaches you with an offer to represent you professionally.',
    dialogue: [
      ['agent', ['I\'ve been following your career. You have real potential, and I\'d like to help you reach it. I can handle sponsorships, tournament entries, and career planning.']],
      ['agent', ['With my connections, I can open doors you didn\'t know existed. You won\'t even have to bother with', {characterId: 'coach_gonzalez'}, 'ever again. Are you interested?']],
    ],
    characters: ['agent'],
    options: [
      {
        id: 'sign_with_agent',
        text: 'Sign with Agent',
        emoji: '📝',
        description: 'Get professional representation',
        outcome: {
          resultText: ['You sign with the agent, who immediately begins making calls and setting up opportunities. But you didn\'t sell out, right?'],
          effects: {
            statChanges: { anticipation: 3, slice: 1, dropShot: 1, forehand: 1, backhand: 1, serve: 1 },
            moodChange: 10,
            energyChange: -10,
            relationshipChanges: {
              coach_gonzalez: -25,
              agent: 10,
            }
          },
        },
      },
      {
        id: 'wait_and_see',
        text: 'Ask for Time to Think',
        emoji: '⏳',
        description: 'Not ready to commit yet',
        outcome: {
          resultText: ['You ask for some time to think it over. They are clearly not happy, but they are giving you the opportunity to consider your options. You aren\'t sure if this window will stay open.'],
          effects: {
            moodChange: 5,
            energyChange: 0,
          },
        },
      },
      {
        id: 'stay_independent',
        text: 'Stay Independent',
        emoji: '💪',
        description: 'Handle your own career for now',
        outcome: {
          resultText: ['You politely decline, explaining that you want to maintain control over your career at this stage. Plus you can\'t help but feel like you owe', {characterId: 'coach_gonzalez'}, 'something for all their support.'],
          effects: {
            statChanges: { recovery: 2, focus: -3, anticipation: -1 },
            moodChange: -15,
            energyChange: 0,
          },
        },
      },
    ],
  },

  {
    id: 'tournament_invitation',
    name: 'Regional Tournament Invitation',
    tags: ['milestone'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesWon: 10,
      stats: { forehand: { min: 45 }, backhand: { min: 40 }, serve: { min: 50 } },
    },
    skippable: false,
    description: 'You receive an invitation to compete in a regional tournament with stronger competition.',
    dialogue: [
      ['tournament_director', ['Based on your recent performances, we\'d like to invite you to our regional tournament next month. It\'s a step up in competition, but we think you\'re ready for the challenge.']],
    ],
    characters: ['tournament_director'],
    options: [],
    defaultOutcome: {
      resultText: ['You accept the invitation with excitement and gratitude. This is the opportunity you\'ve been working toward. But are you ready?'],
      effects: {
        statChanges: { focus: 1, volley: 2, anticipation: 2, offensive: 2 },
        moodChange: 30,
        energyChange: -10,
      },
    },
  },
];
