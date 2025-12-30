/**
 * Career/Sponsor Storyline Events
 * Events related to professional career development and sponsorship opportunities
 */

import type { StoryEvent } from '../../types/storyEvents';

export const careerEvents: StoryEvent[] = [
  {
    id: 'sponsor_first_offer',
    name: 'First Sponsorship Offer',
    tags: ['sponsor', 'decision', 'media'],
    timeSlotsRequired: 2,
    prerequisites: {
      minMatchesWon: 3,
      minDay: 15,
    },
    description: 'A local sports equipment company has noticed your recent wins and wants to sponsor you.',
    dialogue: `Company Representative: "We've been watching your progress, and we're impressed. We'd like to offer you a sponsorship deal - free equipment and a small monthly stipend in exchange for wearing our gear and doing some promotional appearances. What do you say?"`,
    characters: ['sponsor_rep'],
    options: [
      {
        id: 'accept_immediately',
        text: 'Accept Immediately',
        emoji: '✅',
        description: 'Take the deal as offered',
        outcome: {
          resultText: 'You eagerly accept the sponsorship deal. The representative is pleased with your enthusiasm and fast decision-making. You receive your first shipment of equipment and a small signing bonus.',
          effects: {
            statBoosts: { serve: 2, forehand: 2 },
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
          stats: { mental: { min: 40 } },
        },
        outcome: {
          resultText: 'You confidently negotiate for better terms. The representative respects your business acumen and agrees to increase the monthly stipend by 25%. You sign a stronger deal and gain respect in the industry.',
          effects: {
            statBoosts: { serve: 3, forehand: 3, focus: 2 },
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
          resultText: 'You politely decline, explaining that you want to focus on your development before taking on sponsorship obligations. The representative understands and says they\'ll check back in a few months. You feel good about staying true to your priorities.',
          effects: {
            statBoosts: { focus: 3 },
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
    description: 'A local sports journalist wants to interview you about your tennis journey.',
    dialogue: `Journalist: "Our readers would love to hear about your story. Can you spare 30 minutes for an interview? We'll focus on your journey, your training, and your goals."`,
    characters: ['journalist'],
    options: [
      {
        id: 'confident_interview',
        text: 'Give Confident Interview',
        emoji: '🎤',
        description: 'Speak openly and confidently',
        prerequisites: {
          stats: { mental: { min: 35 } },
        },
        outcome: {
          resultText: 'You give an articulate and confident interview. The journalist is impressed by your maturity and vision. The article receives positive attention, and you gain some local recognition.',
          effects: {
            statBoosts: { focus: 3, anticipation: 2 },
            moodChange: 25,
            energyChange: -5,
          },
        },
      },
      {
        id: 'humble_interview',
        text: 'Stay Humble',
        emoji: '🙏',
        description: 'Give a modest, down-to-earth interview',
        outcome: {
          resultText: 'You give a humble interview, crediting your coaches, family, and hard work. The journalist appreciates your grounded attitude. Readers connect with your authenticity.',
          effects: {
            statBoosts: { focus: 2 },
            moodChange: 15,
            energyChange: -5,
            relationshipChanges: { coach_martinez: 10 },
          },
        },
      },
      {
        id: 'decline_interview',
        text: 'Decline Interview',
        emoji: '🚫',
        description: 'Avoid media attention for now',
        outcome: {
          resultText: 'You politely decline, saying you prefer to let your tennis do the talking. The journalist seems disappointed but respects your decision. You stay focused on training.',
          effects: {
            statBoosts: { focus: 1 },
            moodChange: 5,
            energyChange: 0,
          },
        },
      },
    ],
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
    description: 'A sports agent approaches you with an offer to represent you professionally.',
    dialogue: `Agent: "I've been following your career. You have real potential, and I'd like to help you reach it. I can handle sponsorships, tournament entries, and career planning. With my connections, I can open doors you didn't know existed. Are you interested?"`,
    characters: ['agent'],
    options: [
      {
        id: 'sign_with_agent',
        text: 'Sign with Agent',
        emoji: '📝',
        description: 'Get professional representation',
        outcome: {
          resultText: 'You sign with the agent, who immediately begins making calls and setting up opportunities. Within days, you have meetings scheduled with better sponsors and invitations to higher-level tournaments. The professional support is invaluable.',
          effects: {
            statBoosts: { anticipation: 3, focus: 2 },
            moodChange: 25,
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
          resultText: 'You ask for some time to think it over. The agent gives you their card and says to call when you\'re ready. You appreciate having control over the decision timeline.',
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
          resultText: 'You politely decline, explaining that you want to maintain control over your career at this stage. The agent understands and wishes you well. You feel empowered by your independence.',
          effects: {
            statBoosts: { focus: 2 },
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
    tags: ['tournament', 'milestone'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesWon: 10,
      stats: { technical: { min: 45 } },
    },
    description: 'You receive an invitation to compete in a regional tournament with stronger competition.',
    dialogue: `Tournament Director: "Based on your recent performances, we'd like to invite you to our regional tournament next month. It's a step up in competition, but we think you're ready for the challenge."`,
    characters: ['tournament_director'],
    options: [],
    defaultOutcome: {
      resultText: 'You accept the invitation with excitement and gratitude. This is the opportunity you\'ve been working toward. You immediately start planning your preparation for the higher level of competition.',
      effects: {
        statBoosts: { focus: 3, anticipation: 2, offensive: 2 },
        moodChange: 30,
        energyChange: -10,
      },
    },
  },
];
