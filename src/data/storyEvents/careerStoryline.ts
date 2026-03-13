/**
 * Career/Sponsor Storyline Events
 * Events related to professional career development and sponsorship opportunities
 */

import type { StoryEvent } from '../../types/storyEvents';

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
      minDay: 3,
      completedEvents: ['making_connections']
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
      }
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
        }
      }
    },
  },

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
              matchFormat: 'best-of-3',
              matchTitle: 'Team Match: Academy vs Aspen Slopes',
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
      [null, ['The Academy ends up winning the overall team match, as well. It\'s a great start to the season!']],
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
        }
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
      [null, ['Despite your loss, the Academy manages to win overall. Something to ease the sting.']],
    ],
    characters: ['keith', 'jen', 'coach_gonzalez', 'chet_vale'],
    options: [],
    defaultOutcome: {
      resultText: [
        'You lost your match, but the Academy won overall. There\'s still some room to improve.',
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
          },
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
            statChanges: { serve: 3, forehand: 3, focus: 2 },
            moodChange: 30,
            energyChange: -10,
          },
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
            statChanges: { focus: 3 },
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
      ['journalist', ['Our audience absolutely loves your story. What can you tell us about', {characterId: 'jordan_rival'}, '?']],
      ['player', ['I- Oh? What?']],
      ['journalist', [{characterId: 'jordan_rival'}, 'has been one of the hottest prospects in tennis, both figuratively and literally.']],
      ['journalist', ['How did you two meet? Is there a story behind your rivalry? What does he smell like?']],
    ],
    characters: ['journalist'],
    options: [],
    defaultOutcome: {
      resultText: ['You give your best effort during the interview, but ultimately you\'re still confused. Everyone seems to know', {characterId: 'jordan_rival'}, 'except you.'],
      effects: {
        statChanges: { stamina: 2, focus: 1 },
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
            statChanges: { anticipation: 3, focus: 2 },
            moodChange: 10,
            energyChange: -10,
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
            statChanges: { focus: 2 },
            moodChange: 15,
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
        statChanges: { focus: 3, anticipation: 2, offensive: 2 },
        moodChange: 30,
        energyChange: -10,
      },
    },
  },
];
