/**
 * Career/Sponsor Storyline Events
 * Events related to professional career development and sponsorship opportunities
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { TOURNAMENT_OUTFIT, SPONSOR_OUTFIT, HEADBAND, PRO_RACQUET, ENERGY_DRINK, BANANA, LUCKY_SPROUT, ALLROUND_RACQUET, CONTROL_RACQUET, COURT_SHOES, POWER_RACQUET } from '../items';
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
      ['keith', ['It\'s about time! We\'re finally playing our first match!']],
      [null, ['You turn to the board. The posting reads: "Academy Club Team vs Aspen Slopes Academy - Home Match"']],
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
        },
        itemsGained: [LUCKY_SPROUT]
      }
    }
  },

  // ==========================================
  // Team Match #3: Cosmo Comet Space Academy
  // ==========================================

  {
    id: 'third_team_match_scheduled',
    name: 'Third Team Match Announced',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['second_team_match_prematch'],
    },
    skippable: false,
    description: 'Your third team match is announced.',
    dialogue: [
      [null, ['The bulletin board has a new posting. Is this the only way to get news around here?']],
      ['keith', ['Cosmo Comet Space Academy? Those guys give me the heebie-jeebies. Why do they have a tennis team?']],
      ['jen', ['I heard they\'re doing testing on some new tech: ultra low-compression balls. They could even work on the moon!']],
      [null, ['You briefly try to imagine tennis in zero-G. Certainly would be a little easier on the knees.']],
      ['keith', ['That\'s probably why we have to host the match. I don\'t think their home courts are even on this planet.']],
      ['coach_gonzalez', ['They do usually arrive by shuttle. Space shuttle.']],
      ['coach_gonzalez', ['Hey, ', {characterId: 'player'}, ' it looks like you\'ll be up against Martia Estrella. She\'s a young talent, and she loves to get to the net to close out points.']],
      ['jen', ['It should be some good practice! I hope you worked on your sky-high lobs this week.']],
      ['keith', ['That\'s one kind of shot that definitely won\'t work on the moon.']]
    ],
    characters: ['keith', 'jen', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'The next team match is against Cosmo Comet Space Academy. This team is full of brainiacs who like to play the percentages.',
        'Expect a lot of net pressure. And don\'t let them sneak in any of those fancy moon balls.'
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
              opponentId: 'martia_estrella',
              opponentName: 'Martia Estrella',
              opponentStats: {
                technical: {
                  serve: 38,
                  forehand: 40,
                  backhand: 32,
                  volley: 42,
                  overhead: 34,
                  dropShot: 36,
                  slice: 40,
                  return: 38,
                  spin: 38,
                  placement: 42,
                },
                physical: {
                  speed: 48,
                  stamina: 40,
                  strength: 24,
                  agility: 42,
                  recovery: 36,
                },
                mental: {
                  focus: 46,
                  anticipation: 42,
                  shotVariety: 45,
                  offensive: 36,
                  defensive: 42,
                },
              },
              opponentTier: 1,
              opponentDescription: 'An up-and-coming star known for her volleys and court coverage.',
              prematchEventId: 'third_team_match_prematch',
              winEventId: 'third_team_match_win',
              lossEventId: 'third_team_match_loss',
              surface: 'clay',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Cosmo Comet Space Academy',
              matchDescription: 'Your third official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'third_team_match_prematch',
    name: 'Before the Match',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Cosmo Comet team arrives for your third team match.',
    dialogue: [
      [null, ['Your team finishes warming up, but the opponents are nowhere to be seen yet.']],
      [null, ['You notice something breaking up the clouds in the distance, and a dull roar starts from that direction.']],
      ['keith', ['Does that look like a shuttle to you?']],
      ['jen', ['They\'re coming in a little hot, don\'t you think?']],
      [null, ['A humongous aircraft zooms past overhead, and in its wake you can see a large capsule with a parachute hurtling towards you.']],
      [null, ['The large metal pod lands just past the trees in a huge CRASH and smoke starts drifting over the area.']],
      [null, ['Out walks the Cosmo Comet team, seemingly completely unhurt and ready to play.']],
      ['keith', ['They have the budget for that, and we\'re still doing bulletin boards?']],
      ['coach_gonzalez', ['Once you guys start getting research grants from NASA, we can talk. They still only pay my bonus in Taco Barn gift cards.']],
      [null, ['One of the Cosmo players bounces up to you with seemingly endless energy.']],
      ['martia_estrella', ['According to my calculations, you must be my opponent. I hope you\'ve been studying!']],
      ['martia_estrella', ['Did you know some of the top players win over 70% of their points at the net? It\'s all about high percentage shots!']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'martia_estrella'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You take the court. ',{characterId: 'martia_estrella'}, ' spins her racquet. It lands on the wrong side. She doesn\'t say anything. She just spins it again.',
        'It lands on her side and she types something into her calculator watch. She takes the balls to serve. Should you be doing math or something?',
      ],
      effects: {
        moodChange: 5,
        energyChange: 5,
        relationshipChanges: {
          martia_estrella: 5,
        },
      }
    }
  },

  {
    id: 'third_team_match_win',
    name: 'Victory!',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your third team match!',
    dialogue: [
      [null, ['The match point sails by, rocketing through the court for the final shot. You are gassed.']],
      ['martia_estrella', ['Whew! What a match. I forced the tough shots and you found them every time!']],
      ['martia_estrella', ['It\'s only my first year at the academy, and based on the trajectory I\'ve calculated for myself, I\'ll catch you in no time. Great match!']],
      [null, ['You smile and shake her hand. It was a tougher match than you wanted to let on. You can\'t help but feel inspired by her attitude.']],
      ['coach_gonzalez', ['Great win! She\'s been on a tear lately, and hasn\'t been giving up many easy points.']],
      ['jen', ['That was a great test for you, and you passed! These people know all about taking tests...']],
    ],
    characters: ['jen', 'coach_gonzalez', 'martia_estrella'],
    options: [],
    defaultOutcome: {
      resultText: [
        'A win against Cosmo Comet Space Academy! It feels good to take the nerds down a peg. If every match is an exam, you feel like you just passed your midterms.',
        'As you ride back to the academy in the back of the team shuttle, you look up to the sky thinking about two things: zero-G tennis and the inequity of research endowments.'
      ],
      effects: {
        moodChange: 25,
        energyChange: 20,
        relationshipChanges: {
          jen: 2,
          coach_gonzalez: 3,
          martia_estrella: 2,
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
    name: 'A Tough Loss',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_prematch'],
      excludedEvents: ['third_team_match_win']
    },
    skippable: false,
    description: 'You lose your third team match.',
    dialogue: [
      [null, ['You stretch for the last shot and continue the rally one more ball, but ', {characterId: 'martia_estrella'}, ' closes it out at the net.']],
      [null, ['You trudge up to the net, with your opponent still seemingly full of energy.']],
      ['martia_estrella', ['You played great! But I have some homework for you if you want to improve. You need to be able to get up to the net and close out long rallies!']],
      [null, ['You thank her for the advice, and she hands you a stack of papers. Actual homework?']],
      ['martia_estrella', ['I\'ve calculated that we\'ll be facing off again soon! I hope you\'ll be ready!']],
      ['coach_gonzalez', ['It was a tough match. You really did play pretty well. You should finish that homework then.']],
      ['jen', ['I remember playing her in juniors, and even though I won she assigned me some summer reading. Actually, I need to give her that book report...']]
    ],
    characters: ['jen', 'coach_gonzalez', 'martia_estrella'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost your match, but Riverside won overall. ',
        {characterId: 'martia_estrella'}, ' assigned you some homework to do, and she seemed serious.',
        'You can\'t help but wonder what the team budget looks like if they really crashed that space pod.'
      ],
      effects: {
        moodChange: -10,
        energyChange: -20,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 2,
          martia_estrella: 3,
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
  // Team Match #4: Sunset Drive Retirement Home
  // ==========================================

  {
    id: 'fourth_team_match_scheduled',
    name: 'Fourth Team Match Announced',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['third_team_match_prematch'],
    },
    skippable: false,
    description: 'Your fourth team match is announced.',
    dialogue: [
      [null, ['You bring your attention to the bulletin board. Instead of a match schedule, today it looks more like an advert for an old folks home.']],
      ['keith', ['I don\'t get it. Where\'s the lineup?']],
      ['coach_gonzalez', ['This IS the lineup. We\'ve got our toughest match yet: Sunset Drive Retirement Home.']],
      ['coach_gonzalez', ['What they lack in movement and muscle mass, they make up for in experience. LOTS of experience.']],
      ['greg', ['My grandma lives at Sunset Drive... when she told me the tennis there was good, I just thought her mind was starting to go.']],
      ['jen', ['Actually, it looks like that\'s who you\'ll be playing, ', {characterId: 'greg'}, '! ', {characterId: 'player'}, ', it looks like you\'ll be up against ', {characterId: 'reginald_werther'}, '.']],
      ['keith', ['Where are they finding names like this? He must be 100 years old!']],
      ['coach_gonzalez', ['He\'s the 1921 junior Wimbledon champion. His father, Regingigas Werther, is the 1821 junior Wimbledon champion. History is funny.']]
    ],
    characters: ['keith', 'jen', 'greg', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You\'re all ready to go for your next match against Sunset Drive. You definitely shouldn\'t take them lightly, even though every one of them has replacement hips.',
        'You can see ', {characterId: 'keith'}, ' trying to count on his hands how long ago the 1920s were. You choose not to think about it.'
      ],
      effects: {
        moodChange: 5,
        energyChange: 0,
        relationshipChanges: {
          jen: 1,
          greg: 1,
          keith: 1,
          coach_gonzalez: 2,
        },
        scheduledEvents: [
          {
            eventType: 'story_match',
            relativeDays: 2,
            scheduledTimeSlot: 1, // AFTERNOON
            metadata: {
              opponentId: 'reginald_werther',
              opponentName: 'Reginald Werther',
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
              opponentDescription: 'A steady, patient player from Sunset Drive. He won tournaments 100 years before you were born.',
              prematchEventId: 'fourth_team_match_prematch',
              winEventId: 'fourth_team_match_win',
              lossEventId: 'fourth_team_match_loss',
              surface: 'hard',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Sunset Drive Retirement Home',
              matchDescription: 'Your fourth official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'fourth_team_match_prematch',
    name: 'Before the Match',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Sunset Drive Retirement Home team arrives for your fourth team match.',
    dialogue: [
      [null, ['A long, non-descript bus pulls up to the courts. The doors swing open.']],
      [null, ['At first, nothing. Then the oldest people you\'ve ever seen begin to slowly make their way down the ramp.']],
      ['keith', ['Well this is going to be a breeze! These people can barely move.']],
      [null, ['As if on cue, those same players who could barely walk a second ago are now completely decked out in knee braces, elbow sleeves, and goggles.']],
      [null, ['They start to stretch and warm up. They\'re practically bionic at this point and they look surprisingly limber.']],
      ['reginald_werther', ['You must be my opponent. I love to see the younger generation get involved in the sport I love.']],
      ['reginald_werther', ['But I hate seeing them win. So good luck.']],
      ['jen', ['I think our best bet is to drag these matches out as long as possible. Once any match hits their 4pm dinner time, they get hangry.']],
      ['coach_gonzalez', ['Plus, if you manage to drag the match out long enough, they may have to default a court due to natural causes.']]
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'reginald_werther'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You head to the court. ', {characterId: 'reginald_werther'}, ' is already there, reading his novel on the bench.',
        'He takes off his reading goggles and swaps to his playing goggles. At least three generations of Werthers are cheering him on from the stands.',
      ],
      effects: {
        moodChange: 5,
        energyChange: 5,
        relationshipChanges: {
          reginald_werther: 2,
        },
      }
    }
  },

  {
    id: 'fourth_team_match_win',
    name: 'Victory!',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your fourth team match!',
    dialogue: [
      [null, [{characterId: 'reginald_werther'}, ' musters up the last of his strength to dive for the final shot. It passes him for a winner.']],
      [null, ['He looks exhausted, but a genuine smile crosses his face as he walks up to the net.']],
      ['reginald_werther', ['Amazing play out there kid. You make me feel 80 again. I had a blast playing out those rallies!']],
      ['reginald_werther', ['But don\'t think you\'ve seen the last of me or my family. Keep an eye out for my own sons, Reginice, Reginsteel, and Reginrock. They\'re legendary players.']],
      ['coach_gonzalez', ['That was a great win! Their coach requested that we get all these matches done before their 7 pm bedtime, so I appreciate you moving quick.']],
      ['keith', ['Well now we can move down to court 4 where ', {characterId: 'greg'}, ' is down a break to his grandma. Hurry!']]
    ],
    characters: ['keith', 'coach_gonzalez', 'reginald_werther'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You found a way to outlast the Sunset Drive team, as Riverside gets the clean sweep. Still, these old folks put on quite the performance.',
        'You imagine yourself playing in the 75+ division when you get older. Both players huffing and puffing, smashing the ball as hard as they can, only for it to look like oversized ping pong.',
        'We should all be so lucky.'
      ],
      effects: {
        moodChange: 25,
        energyChange: -20,
        relationshipChanges: {
          keith: 3,
          jen: 2,
          coach_gonzalez: 3,
          reginald_werther: 2,
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
    name: 'A Tough Loss',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_prematch'],
      excludedEvents: ['fourth_team_match_win']
    },
    skippable: false,
    description: 'You lose your fourth team match.',
    dialogue: [
      [null, ['You sprint side to side, chasing down slice after slice, but eventually your legs give out and the last shot slides past you.']],
      [null, [{characterId: 'reginald_werther'}, ' meets you at the net. His handshake is firm. He\'s tired but you can tell he has more in the tank.']],
      ['reginald_werther', ['Thanks for putting on a good show, kid. I had a lot of fun. ']],
      ['reginald_werther', ['You should practice with my sons. They\'re about your age, and you could learn a lot from them. Keep an eye out for Reginice, Reginsteel, and Reginrock.']],
      ['jen', ['You had your moments out there. He just found answers every time you pushed.']],
      ['keith', ['It felt like he wasn\'t really moving, and yet everywhere you tried, he was there. His family was also very nice to me.']],
      ['coach_gonzalez', ['You played well enough to win. Today he was just a little better. Learn from it and bring it next time.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'reginald_werther'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost your match, but Riverside manages to win overall.',
        'By the time the final match was ending, most of the Sunset Drive players had fallen asleep. I suppose this is why these matches are scheduled for the afternoon.',
      ],
      effects: {
        moodChange: -10,
        energyChange: -20,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 2,
          reginald_werther: 3,
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
  // Team Match #5: Dobry Pomidor Culinary Institute
  // ==========================================

  {
    id: 'fifth_team_match_scheduled',
    name: 'Fifth Team Match Announced',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fourth_team_match_prematch'],
    },
    skippable: false,
    description: 'Your fifth team match is announced.',
    dialogue: [
      [null, ['A new posting goes up on the bulletin board. It has stains from oil and what seems to be some kind of tomato sauce.']],
      ['jen', ['Dobry Pomidor Culinary Institute. They have a world-renowned cooking program. Their head chef is from somewhere in eastern Europe.']],
      ['jen', ['Their tennis team is ranked second in the division.']],
      ['keith', ['Behind us?']],
      ['jen', ['Behind us. If we can close this out, we\'ll be a lock for playoffs.']],
      ['coach_gonzalez', ['They\'re talented cooks, and it transfers over to their slice skills. This team also has some big servers.']],
      ['sasha', ['I checked their records and they\'ve been handing out lots of bagels and breadsticks to their opponents.']],
      ['keith', ['That\'s so nice of them... I wonder what bread they use?']],
      ['coach_gonzalez', ['Looks like you\'ll be playing their top chef and singles player, ', {characterId: 'olivia_gulp'}, '. She\'s been winning tournaments AND cooking competitions.']],
      ['coach_gonzalez', ['Try to attack on serve return. After she hits a fault, she usually follows it up with a pancake serve.']]
    ],
    characters: ['keith', 'jen', 'sasha', 'coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: [
        'Dobry Pomidor Culinary Institute. They\'re top-notch in the kitchen and on the court. You need to get another win to ensure your team makes the playoffs.',
        {characterId: 'sasha'}, ' is still desperately trying to confirm that ', {characterId: 'keith'}, ' didn\'t think she was talking about real bagels. The result is unclear.'
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
              opponentId: 'olivia_gulp',
              opponentName: 'Olivia Gulp',
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
              opponentDescription: 'A talented chef with a variety of skills on the court. If you can\'t take the heat, you could get burned.',
              prematchEventId: 'fifth_team_match_prematch',
              winEventId: 'fifth_team_match_win',
              lossEventId: 'fifth_team_match_loss',
              surface: 'clay',
              matchFormat: 'best-of-1',
              matchTitle: 'Team Match: Riverside vs Dobry Pomidor Culinary Institute',
              matchDescription: 'Your fifth official team match',
            },
          },
        ],
      }
    }
  },

  {
    id: 'fifth_team_match_prematch',
    name: 'Before the Match',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fifth_team_match_scheduled'],
    },
    skippable: false,
    description: 'The Dobry Pomidor Culinary Institute team arrives for your fifth team match.',
    dialogue: [
      [null, ['A large food truck flies down the street and screeches to a halt outside the courts.']],
      [null, ['All the Dobry Pomidor players hop out of the truck and grab a piping hot meal from their chef. They are ready to go.']],
      ['keith', ['I\'m just now realizing I forgot to eat lunch.']],
      ['jen', ['Consider yourself lucky. Today was sloppy joe day.']],
      ['coach_gonzalez', ['I think once the matches start, I can sneak myself a nice ham and cheese.']],
      ['olivia_gulp', ['You must be my opponent. I had my dessert midterms this morning, so hopefully I can re-focus.']],
      ['olivia_gulp', ['You should try one of these. I made us pastries that are supposed to taste like opening a fresh tennis ball can!']]
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'olivia_gulp'],
    options: [],
    defaultOutcome: {
      resultText: [
        {characterId: 'olivia_gulp'}, ' has a full snack bar set up for changeovers. You\'re starting to get a little hungry.',
        'It\'s surprising and a little offputting how much those pastries taste like tennis ball cans. You like it, though.',
      ],
      effects: {
        moodChange: 5,
        energyChange: 5,
        relationshipChanges: {
          olivia_gulp: 1,
        },
      }
    }
  },

  {
    id: 'fifth_team_match_win',
    name: 'Victory!',
    tags: ['story_match', 'team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fifth_team_match_prematch'],
    },
    skippable: false,
    description: 'You win your fifth team match!',
    dialogue: [
      [null, ['Your final shot clips the line. You pump your fist.']],
      [null, [{characterId: 'olivia_gulp'}, ' watches it land, tilts her head, and then nods slowly.']],
      ['olivia_gulp', ['Good match. You were relentless. I\'m impressed. Also exhausted. That\'s very rare for me.']],
      [null, ['She shakes your hand with a surprisingly firm grip, and a real fire in her eyes.']],
      ['olivia_gulp', ['I\'m going to think about that match for a while. The next time we play, I\'ll serve you up some breadsticks for real!']],
      ['keith', ['I hope she keeps the snack stand open. She has pretty good prices on hot dogs.']],
      ['jen', ['Another big win! You\'ve really been improving. You\'ve been helping the team big time!']],
      ['coach_gonzalez', ['It\'s been a while since I\'ve seen you perform that well all around. I\'ll see if we can bump up the team food budget.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'olivia_gulp'],
    options: [],
    defaultOutcome: {
      resultText: [
        'A well-earned win. You hustled hard and attacked her weaknesses. Riverside closes out the team match a few minutes later. The Dobry Pomidor team lets you join for a cookout after.',
        'You learn at least six different grilling techniques you didn\'t know about until now. You head home with a full belly.'
      ],
      effects: {
        moodChange: 30,
        energyChange: 25,
        relationshipChanges: {
          keith: 3,
          jen: 3,
          coach_gonzalez: 3,
          olivia_gulp: 2,
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
    name: 'A Tough Loss',
    tags: ['team'],
    timeSlotsRequired: 0,
    prerequisites: {
      completedEvents: ['fifth_team_match_prematch'],
      excludedEvents: ['fifth_team_match_win']
    },
    skippable: false,
    description: 'You lose your fifth team match.',
    dialogue: [
      [null, ['The match ends. ', {characterId: 'olivia_gulp'}, ' seemed to get better as the match went on, and you couldn\'t handle the heat.']],
      [null, [{characterId: 'olivia_gulp'}, ' approaches you at the net. She still has a little gas left.']],
      ['olivia_gulp', ['That was a great match! You really pushed me hard, but in the end it was the slices that came out on top!']],
      ['olivia_gulp', ['Not only that, but I\'m a better chef than tennis player. You\'ll have to come out to one of the Dobry Pomidor invitationals and I\'ll get you a plate.']],
      ['coach_gonzalez', ['It was a great effort out there, but you got thoroughly cooked. Fried. Toasted.']],
      ['keith', ['Shredded. Torched.']],
      ['jen', ['Mashed.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'olivia_gulp'],
    options: [],
    defaultOutcome: {
      resultText: [
        'Your performance was a little underbaked, but Riverside still won the team match overall.',
        'All these cooking jokes are starting to make you hungry. You hope the Taco Barn is still open when you get back.',
      ],
      effects: {
        moodChange: -10,
        energyChange: -20,
        relationshipChanges: {
          keith: 2,
          jen: 2,
          coach_gonzalez: 2,
          olivia_gulp: 3,
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

  {
    id: 'equipment_upgrade',
    name: 'Professional Equipment Upgrade',
    tags: ['equipment', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      minMatchesWon: 4,
      minDay: 10,
      completedEvents: ['sponsor_first_offer'],
      completedEventChoices: { sponsor_first_offer: ['accept_immediately', 'negotiate'] },
    },
    skippable: true,
    description: 'Your sponsor offers you access to professional-grade equipment and custom racquet fitting.',
    dialogue: [
      ['sponsor_rep', ['We want to give you the best tools to succeed. We\'re offering you a full professional equipment package - custom-fitted racquet, premium strings, and professional-grade shoes. Our team will work with you to find the perfect setup for your game.']],
    ],
    characters: ['sponsor_rep'],
    options: [
      {
        id: 'power_setup',
        text: 'Power Setup',
        emoji: '💥',
        description: 'Focus on power and aggressive play',
        outcome: {
          resultText: ['You choose a power-oriented setup with a heavier racquet and stiffer strings. The equipment feels powerful in your hands. You start hitting bigger serves and more aggressive groundstrokes, adding a new dimension to your game.'],
          effects: {
            statChanges: { serve: 4, forehand: 3, strength: 2, offensive: 3 },
            moodChange: 25,
            energyChange: -10,
            itemsGained: [POWER_RACQUET, COURT_SHOES],
          },
        },
      },
      {
        id: 'control_setup',
        text: 'Control Setup',
        emoji: '🎯',
        description: 'Emphasize precision and consistency',
        outcome: {
          resultText: ['You opt for a control-oriented setup with a more flexible frame and softer strings. The racquet gives you incredible feel and precision. Your shot placement improves dramatically, and you feel more confident in constructing points.'],
          effects: {
            statChanges: { spin: 3, placement: 3, anticipation: 2, defensive: 3, return: 2 },
            moodChange: 25,
            energyChange: -10,
            itemsGained: [CONTROL_RACQUET, COURT_SHOES],
          },
        },
      },
      {
        id: 'balanced_setup',
        text: 'Balanced Setup',
        emoji: '⚖️',
        description: 'All-around versatility',
        outcome: {
          resultText: ['You choose a balanced setup that doesn\'t sacrifice power or control. The versatile equipment allows you to adapt your game to different opponents and situations. You feel prepared for any challenge.'],
          effects: {
            statChanges: { serve: 2, forehand: 2, backhand: 2, anticipation: 2, offensive: 1, defensive: 1 },
            moodChange: 25,
            energyChange: -10,
            itemsGained: [ALLROUND_RACQUET, COURT_SHOES],
          },
        },
      },
    ],
  },
];
