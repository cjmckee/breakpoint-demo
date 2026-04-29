/**
 * Interaction Events
 * Player-initiated threshold story events for key characters.
 * These fire on the first hangout at each relationship tier.
 * They are never randomly rolled — only triggered via hangoutWithCharacter().
 */

import type { StoryEvent } from '../../types/storyEvents';
import { AbilityName } from '../../types/game';

export const interactionEvents: StoryEvent[] = [

  // ============================================================================
  // COACH GONZALEZ
  // ============================================================================

  {
    id: 'coach_hangout_tier0',
    name: 'The Coach Has Notes',
    tags: ['interaction', 'coach'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach Gonzalez sits you down. He has things to cover.',
    dialogue: [
      ['coach_gonzalez', ['Sit down. I have seventeen things to tell you.']],
      ['player', ['...all right.']],
      ['coach_gonzalez', ["I'll start with the most important one. Your footwork in the third set last week—"]],
      [null, ['He opens the clipboard. There are so many diagrams.']],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['You spend the next hour nodding along while Coach Gonzalez covers the clipboard in increasingly ambitious arrows. Some of it sinks in. Most of it is just arrows.'],
      effects: {
        statChanges: { serve: 1, forehand: 1 },
        moodChange: 5,
        energyChange: -15,
        relationshipChanges: { coach_gonzalez: 3 },
      },
    },
  },

  {
    id: 'coach_hangout_tier1',
    name: 'Film Room Frenzy',
    tags: ['interaction', 'coach'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach has booked the film room. He has popcorn. You do not get any of the popcorn.',
    dialogue: [
      ['coach_gonzalez', ['Today we watch tape. Three hours. Maybe four.']],
      ['player', ['Four hours?']],
      ['coach_gonzalez', ["Quiet. It's starting."]],
      [null, ['He dims the lights. He has popcorn. You do not get any of the popcorn.']],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['Coach pauses the footage approximately forty times to yell at the screen. By the end you\'re not sure if you learned tennis or just absorbed his opinions about tennis. Either way, something clicked.'],
      effects: {
        statChanges: { serve: 2, anticipation: 1 },
        moodChange: 8,
        energyChange: -15,
        relationshipChanges: { coach_gonzalez: 4 },
      },
    },
  },

  {
    id: 'coach_hangout_tier2',
    name: 'The Grand Tactical Breakdown',
    tags: ['interaction', 'coach', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach has rented a second whiteboard. There is a decision to make.',
    dialogue: [
      ['coach_gonzalez', ["Today, we solve your game. Completely."]],
      [null, ['He has rented a second whiteboard.']],
      ['player', ['Did you... rent a whiteboard?']],
      ['coach_gonzalez', ['Focus.']],
    ],
    characters: ['coach_gonzalez'],
    options: [
      {
        id: 'serve_focus',
        text: 'Serve Focus',
        emoji: '🎯',
        description: 'Dedicate the session to serve mechanics',
        outcome: {
          resultText: ['You dedicate the session to serve mechanics. Coach draws so many ball trajectories the napkin tears. The serve is now the weapon.'],
          effects: {
            statChanges: { serve: 3, placement: 1 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 4 },
          },
        },
      },
      {
        id: 'return_focus',
        text: 'Return Focus',
        emoji: '👁️',
        description: 'Focus on reading the opponent\'s serve',
        outcome: {
          resultText: ['You focus on reading the opponent\'s serve. Coach makes you close your eyes and "feel the ball coming." It sounds ridiculous. It works.'],
          effects: {
            statChanges: { return: 3, anticipation: 1 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 4 },
          },
        },
      },
    ],
  },

  {
    id: 'coach_hangout_tier3',
    name: 'The Secret Playbook',
    tags: ['interaction', 'coach', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach locks the door. He has a second clipboard inside the first clipboard.',
    dialogue: [
      [null, ['Coach locks the door. Actual lock. Key and everything.']],
      ['coach_gonzalez', ["What I'm about to show you does not leave this room."]],
      ['player', ['...okay.']],
      ['coach_gonzalez', ["I mean it. Not even the other coaches."]],
      [null, ['He opens a second, smaller clipboard from inside the first clipboard. You didn\'t know that was possible. This one has the real diagrams.']],
    ],
    characters: ['coach_gonzalez'],
    options: [
      {
        id: 'power_game',
        text: 'Power Game',
        emoji: '💪',
        description: 'Lean into pace, pressure, and power',
        outcome: {
          resultText: ['You lean into the power. More pace, more pressure, more everything. Coach draws increasingly aggressive arrows. You leave feeling like a different player.'],
          effects: {
            statChanges: { serve: 2, forehand: 2, stamina: 1 },
            moodChange: 15,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 5 },
            abilitiesGained: [AbilityName.GRAND_STRATEGIST],
          },
        },
      },
      {
        id: 'finesse_game',
        text: 'Finesse Game',
        emoji: '🎨',
        description: 'Study angles, spin, and subtle adjustments',
        outcome: {
          resultText: ['You study the subtle stuff. Angles, spins, the tiny adjustments nobody else thinks about. Coach nods slowly, like he\'s been waiting for you to be ready for this.'],
          effects: {
            statChanges: { slice: 2, dropShot: 2, focus: 1 },
            moodChange: 15,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 5 },
            abilitiesGained: [AbilityName.GRAND_STRATEGIST],
          },
        },
      },
    ],
  },

  // ============================================================================
  // JORDAN (RIVAL)
  // ============================================================================

  {
    id: 'jordan_hangout_tier0',
    name: 'Awkward Hallway Chat',
    tags: ['interaction', 'rival'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan is at the water fountain. There is only one water fountain.',
    dialogue: [
      [null, ['Jordan is at the water fountain when you arrive. There is only one water fountain.']],
      ['jordan_rival', ['...']],
      ['player', ['Hey.']],
      ['jordan_rival', ['Your second serve is weak.']],
      ['player', ['...thanks?']],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ["It's not really a conversation. More of a series of statements in the same direction. Still, something about the interaction makes you want to prove them wrong."],
      effects: {
        statChanges: { focus: 1, offensive: 1 },
        moodChange: 5,
        energyChange: -10,
        relationshipChanges: { jordan_rival: 3 },
      },
    },
  },

  {
    id: 'jordan_hangout_tier1',
    name: 'Trash Talk Over Smoothies',
    tags: ['interaction', 'rival'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan suggests a smoothie place. You go. They test you.',
    dialogue: [
      ['jordan_rival', ["This place is overpriced."]],
      ['player', ["You suggested it."]],
      ['jordan_rival', ["I know. I wanted to see if you'd complain."]],
      ['player', ["...did I pass?"]],
      ['jordan_rival', ["Jury's still out."]],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ["Forty-five minutes of roasting each other's game. Somehow the most useful tennis conversation you've had all week. Jordan knows exactly what's wrong with your backhand. Annoyingly."],
      effects: {
        statChanges: { anticipation: 2, focus: 1 },
        moodChange: 8,
        energyChange: -10,
        relationshipChanges: { jordan_rival: 3 },
      },
    },
  },

  {
    id: 'jordan_hangout_tier2',
    name: 'Hit the Wall Together',
    tags: ['interaction', 'rival', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan says practice wall, twenty minutes. You both care a lot.',
    dialogue: [
      ['jordan_rival', ['Practice wall. Twenty minutes.']],
      ['player', ['Is this a challenge?']],
      ['jordan_rival', ["It's a wall. It doesn't care."]],
      [null, ["You both care a lot, actually."]],
    ],
    characters: ['jordan_rival'],
    options: [
      {
        id: 'go_aggressive',
        text: 'Go Aggressive',
        emoji: '⚡',
        description: 'Hammer winners and push the pace',
        outcome: {
          resultText: ["You spend the session hammering winners. Jordan responds by hitting harder. Your arm is going to hate you tomorrow. Neither of you says so."],
          effects: {
            statChanges: { offensive: 2, serve: 1 },
            moodChange: 8,
            energyChange: -25,
            relationshipChanges: { jordan_rival: 4 },
          },
        },
      },
      {
        id: 'stay_defensive',
        text: 'Stay Defensive',
        emoji: '🛡️',
        description: 'Get everything back and test Jordan\'s patience',
        outcome: {
          resultText: ["You focus on getting everything back. Jordan tests your range. You test their patience. Nobody breaks. That's the point."],
          effects: {
            statChanges: { defensive: 2, return: 1 },
            moodChange: 8,
            energyChange: -25,
            relationshipChanges: { jordan_rival: 4 },
          },
        },
      },
    ],
  },

  {
    id: 'jordan_hangout_tier3',
    name: 'The Grudging Fist Bump',
    tags: ['interaction', 'rival'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan knocks on your door at 7am holding their headband.',
    dialogue: [
      [null, ["Jordan knocks on your door at 7am holding their headband."]],
      ['jordan_rival', ['Here.']],
      ['player', ["Is this... your headband?"]],
      ['jordan_rival', ["Don't make it weird."]],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ["You're not entirely sure what just happened. Jordan is already walking away. The headband is real. The rivalry is real. Something shifted."],
      effects: {
        statChanges: { focus: 2, anticipation: 2, offensive: 1, defensive: 1 },
        moodChange: 15,
        energyChange: -15,
        relationshipChanges: { jordan_rival: 5 },
        abilitiesGained: [AbilityName.RIVALS_EDGE],
      },
    },
  },

  // ============================================================================
  // KEITH
  // ============================================================================

  {
    id: 'keith_hangout_tier0',
    name: 'Couch Crash',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith tells you to sit down. You do.',
    dialogue: [
      ['keith', ["You look terrible. Come watch something."]],
      ['player', ["I have training tomorrow."]],
      ['keith', ["I know. Sit down."]],
      [null, ["You do not choose the show."]],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["Three episodes of something Keith describes as 'really good once it gets going.' It does not get going. You feel completely fine about this."],
      effects: {
        moodChange: 15,
        energyChange: -10,
        relationshipChanges: { keith: 3 },
      },
    },
  },

  {
    id: 'keith_hangout_tier1',
    name: 'Bad Movie Marathon',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith\'s lineup tonight is different. The first film has a 14% rating.',
    dialogue: [
      ['keith', ["Okay, tonight's lineup is a bit different."]],
      ['player', ["How different?"]],
      ['keith', ["Trust the process."]],
      [null, ["The first film has a 14% rating. Keith is beaming."]],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["The movies are objectively terrible. You laugh until your ribs hurt. Keith knows every line. You leave feeling like you could play six sets tomorrow."],
      effects: {
        moodChange: 20,
        energyChange: -5,
        relationshipChanges: { keith: 4 },
      },
    },
  },

  {
    id: 'keith_hangout_tier2',
    name: 'The Big Feelings Talk',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith asks if you\'re good. Two hours later, you\'ve said a lot.',
    dialogue: [
      ['keith', ["You good?"]],
      ['player', ["Yeah, I'm fine."]],
      ['keith', ["Uh huh."]],
      [null, ["Two hours later you've said a lot of things you didn't plan on saying."]],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["Keith didn't give advice. He just kept nodding. Somehow that was enough. You feel lighter. Also slightly embarrassed. Mostly lighter."],
      effects: {
        statChanges: { focus: 1 },
        moodChange: 25,
        energyChange: -10,
        relationshipChanges: { keith: 4 },
      },
    },
  },

  {
    id: 'keith_hangout_tier3',
    name: 'BFF Status (Official)',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith arrives with a paper bag. He looks very pleased with himself.',
    dialogue: [
      [null, ["Keith arrives with a paper bag. He looks very pleased with himself."]],
      ['keith', ["Okay so I know this is a little much—"]],
      ['player', ["Are those friendship bracelets?"]],
      ['keith', ["They're performance accessories. Don't make it weird."]],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["You're wearing a friendship bracelet. Keith is wearing a friendship bracelet. He made a third one 'for the bag.' You have no idea what that means. You feel genuinely great."],
      effects: {
        statChanges: { focus: 1, recovery: 1 },
        moodChange: 30,
        energyChange: -10,
        relationshipChanges: { keith: 5 },
        abilitiesGained: [AbilityName.BEST_FRIEND_ENERGY],
      },
    },
  },

  // ============================================================================
  // JEN
  // ============================================================================

  {
    id: 'jen_hangout_tier0',
    name: 'Overpriced Coffee, Great Vibes',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen knows a place. Don\'t look at the prices.',
    dialogue: [
      ['jen', ["This place is my favourite. Don't look at the prices."]],
      ['player', ["Eight dollars for a—"]],
      ['jen', ["Don't."]],
      [null, ["It is a very good latte, actually."]],
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ["An hour disappears. You talked about tennis, then not tennis, then tennis again. The coffee cost an unreasonable amount. You'd go back tomorrow."],
      effects: {
        moodChange: 10,
        energyChange: -10,
        relationshipChanges: { jen: 3 },
      },
    },
  },

  {
    id: 'jen_hangout_tier1',
    name: 'The Backhand Debate',
    tags: ['interaction', 'friend', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen has opinions about the backhand. Strong ones.',
    dialogue: [
      ['jen', ["One-handed backhand. That's the move."]],
      ['player', ["Two-handed is more stable."]],
      ['jen', ["More stable, less elegant."]],
      ['player', ["Elegant doesn't win points."]],
      [null, ["You are both very wrong and very committed."]],
    ],
    characters: ['jen'],
    options: [
      {
        id: 'forehand_focus',
        text: 'Forehand Focus',
        emoji: '🎾',
        description: 'Channel the debate energy into your forehand',
        outcome: {
          resultText: ["You go home fired up about your forehand. Jen sends you a diagram. You didn't ask for it. It's actually really good."],
          effects: {
            statChanges: { forehand: 2 },
            moodChange: 10,
            energyChange: -10,
            relationshipChanges: { jen: 4 },
          },
        },
      },
      {
        id: 'backhand_focus',
        text: 'Backhand Focus',
        emoji: '🔄',
        description: 'Commit to the backhand debate outcome',
        outcome: {
          resultText: ["You commit to the backhand debate outcome. Jen is delighted. She was right, she says. She sends you three diagrams. You didn't ask for any of them."],
          effects: {
            statChanges: { backhand: 2 },
            moodChange: 10,
            energyChange: -10,
            relationshipChanges: { jen: 4 },
          },
        },
      },
    ],
  },

  {
    id: 'jen_hangout_tier2',
    name: 'Napkin Strategy',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen has been thinking about your court positioning. She brought a pen.',
    dialogue: [
      ['jen', ["Okay I had an idea about your court positioning."]],
      ['player', ["Right now?"]],
      ['jen', ["I've been thinking about it all week."]],
      [null, ["She produces a pen from somewhere. The waiter is going to be upset."]],
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ["Jen diagrams an entire tactical system on a paper napkin. It makes complete sense. The waiter asks you to stop using the napkins. You take the napkin with you."],
      effects: {
        statChanges: { placement: 1, anticipation: 1, shotVariety: 1 },
        moodChange: 15,
        energyChange: -15,
        relationshipChanges: { jen: 4 },
      },
    },
  },

  {
    id: 'jen_hangout_tier3',
    name: "Jen's Big Secret",
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen pulls a small jar from her bag. The label says "JG Formula #4."',
    dialogue: [
      ['jen', ["Okay. I'm going to show you something. You can't tell anyone."]],
      ['player', ["...okay?"]],
      [null, ["She pulls a small jar from her bag. The label says 'JG Formula #4.'"]],
      ['jen', ["I've been making this for two years."]],
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ["You don't know what's in it. She won't say. It smells like citrus and determination. Your grip has genuinely never felt better."],
      effects: {
        statChanges: { forehand: 1, backhand: 1, placement: 1 },
        moodChange: 20,
        energyChange: -15,
        relationshipChanges: { jen: 5 },
        abilitiesGained: [AbilityName.TENNIS_NERD],
      },
    },
  },

  // ============================================================================
  // ALEX (ROMANCE)
  // ============================================================================

  {
    id: 'alex_hangout_tier0',
    name: 'Morning Run Together',
    tags: ['interaction', 'romance'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Alex suggests a morning run. It\'s early. Neither of you are fully awake.',
    dialogue: [
      ['alex_romance', ["Hey — I'm doing a run before breakfast. Want to come?"]],
      ['player', ["...what time is it?"]],
      ['alex_romance', ["Early. Bring good shoes."]],
      [null, ["You bring good shoes."]],
    ],
    characters: ['alex_romance'],
    options: [],
    defaultOutcome: {
      resultText: ["Early. Quiet. Neither of you talk much. Halfway through, Alex picks up the pace without saying anything. You keep up without saying anything. That feels like something."],
      effects: {
        statChanges: { speed: 1, stamina: 1 },
        moodChange: 10,
        energyChange: -20,
        relationshipChanges: { alex_romance: 3 },
      },
    },
  },

  {
    id: 'alex_hangout_tier1',
    name: 'The Hitting Session',
    tags: ['interaction', 'romance', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Alex offers a private hitting session. How you approach it matters.',
    dialogue: [
      ['alex_romance', ["I've got the court booked. Just us. No pressure."]],
      [null, ["There is, of course, pressure."]],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'push_hard',
        text: 'Push Hard',
        emoji: '💪',
        description: 'Give your full effort and see how Alex responds',
        outcome: {
          resultText: ["You push hard. Alex pushes back harder. By the end you're both breathing heavy and neither of you is giving an inch. Alex grins. 'Good session.'"],
          effects: {
            statChanges: { agility: 1, return: 2 },
            moodChange: 15,
            energyChange: -25,
            relationshipChanges: { alex_romance: 5 },
          },
        },
      },
      {
        id: 'go_easy',
        text: 'Take It Easy',
        emoji: '😌',
        description: 'Keep it casual — this doesn\'t need to be a battle',
        outcome: {
          resultText: ["You keep it relaxed. Alex keeps it relaxed. It's nice but it's not — something is clearly being avoided. Alex seems a little disappointed without saying so."],
          effects: {
            statChanges: { return: 1 },
            moodChange: 5,
            energyChange: -20,
            relationshipChanges: { alex_romance: -8 },
          },
        },
      },
    ],
  },

  {
    id: 'alex_hangout_tier2',
    name: 'Dinner After Training',
    tags: ['interaction', 'romance', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Alex suggests dinner after a long day. A real conversation is possible here.',
    dialogue: [
      ['alex_romance', ["I know a place. Nothing fancy. But good."]],
      [null, ["You end up talking for two hours. The food is great. That's not really the point."]],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'open_up',
        text: 'Open Up',
        emoji: '💬',
        description: 'Talk about more than just tennis',
        outcome: {
          resultText: ["You tell Alex more than you planned to. They listen in a way that feels like they actually hear it. The conversation runs long. Neither of you wants it to end."],
          effects: {
            statChanges: { recovery: 1, focus: 1 },
            moodChange: 20,
            energyChange: -15,
            relationshipChanges: { alex_romance: 8 },
          },
        },
      },
      {
        id: 'keep_it_light',
        text: 'Keep It Light',
        emoji: '😄',
        description: 'Stick to safe topics — nothing too real',
        outcome: {
          resultText: ["You keep it light. It's fine. Alex is fine. The food is good. On the walk back you get the sense something wasn't said that should have been."],
          effects: {
            moodChange: 8,
            energyChange: -10,
            relationshipChanges: { alex_romance: -5 },
          },
        },
      },
    ],
  },

  {
    id: 'alex_hangout_tier3',
    name: 'Something Real',
    tags: ['interaction', 'romance', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'The moment where it either becomes something or it doesn\'t.',
    dialogue: [
      [null, ["You've been circling this for a while. Maybe Alex has too."]],
      ['alex_romance', ["Can I say something?"]],
      ['player', ["Yeah."]],
      ['alex_romance', ["I think you already know what I'm going to say."]],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'say_it_back',
        text: 'Say it back',
        emoji: '💖',
        description: 'You do know. And you mean it.',
        outcome: {
          resultText: ["You say it back. Alex exhales like they've been holding it for weeks. The court is still there. The training is still there. Everything is still there. It just means more now."],
          effects: {
            statChanges: { focus: 2, recovery: 1 },
            moodChange: 35,
            energyChange: -15,
            relationshipChanges: { alex_romance: 10 },
            abilitiesGained: [AbilityName.COURT_CHEMISTRY],
          },
        },
      },
      {
        id: 'deflect',
        text: 'Deflect',
        emoji: '😶',
        description: 'You\'re not ready. Or you\'re scared. Either way, you pull back.',
        outcome: {
          resultText: ["You don't say it back. You say something else instead — something safe, something vague. Alex nods. The walk back is quiet in the wrong way."],
          effects: {
            moodChange: -5,
            energyChange: -10,
            relationshipChanges: { alex_romance: -15 },
          },
        },
      },
    ],
  },

];
