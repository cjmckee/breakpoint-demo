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
    name: 'The Connection',
    tags: ['interaction', 'coach'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach Gonzalez has a connection. Sort of.',
    dialogue: [
      ['coach_gonzalez', ["Okay. So I have a friend from college, who is the cousin of the girlfriend of the third McEnroe brother."]],
      ['player', ["...the third one?"]],
      ['coach_gonzalez', ["Don't worry about which one. Not all of this is public info. Point is — he can get us a discount on court fees."]],
      ['player', ["Well... how much of a discount?"]],
      ['coach_gonzalez', ["Twelve percent. Maybe thirteen. We're working out the details."]],
      ['coach_gonzalez', ["He owes me from back in the day. I saved his life in a wild-boar-related-incident. You never know about those things."]]
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ["You're not entirely sure any of those people exist, but the court reservation did go through and it was slightly cheaper. You wonder if your life is worth twelve percent on court fees."],
      effects: {
        moodChange: 10,
        energyChange: -10,
        relationshipChanges: { coach_gonzalez: 3 },
      },
    },
  },

  {
    id: 'coach_hangout_tier1',
    name: 'The Ball Machine',
    tags: ['interaction', 'coach'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach brings a specialty ball machine to practice.',
    dialogue: [
      ['coach_gonzalez', ["I'd like to introduce you to someo- something. Come out to the courts."]],
      [null, ["He leads you out to the practice courts, where an oddly shaped box was sitting on the service line. You see a couple tennis balls fire out of it in unpredictable directions."]],
      ['coach_gonzalez', ["This is my nephew. Well- more accurately, I love this machine like a nephew."]],
      [null, ["You see a puff of smoke from the machine, and then it fires a ball directly at the sky. Then another one whizzes past you both. It mutters some complaint about spring break."]],
      ['player', ["Coach, is this your actual nephew?"]],
      ['coach_gonzalez', ["I\'m not going to answer that. We needed the equipment."]],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ["The ball machine fires at unpredictable angles, speeds, and emotional frequencies. It is genuinely excellent practice. Sounds like the machine has school again in two weeks, though."],
      effects: {
        statChanges: { anticipation: 2, return: 1 },
        moodChange: 8,
        energyChange: -15,
        relationshipChanges: { coach_gonzalez: 4 },
      },
    },
  },

  {
    id: 'coach_hangout_tier2',
    name: 'The Coach Hangout',
    tags: ['interaction', 'coach'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach invites you to a gathering of coaches.',
    dialogue: [
      ['coach_gonzalez', ["Tonight. Coach mixer. You're coming."]],
      ['player', ["I'm not a coach."]],
      ['coach_gonzalez', ["You'll be fine. You\'ve coached before."]],
      ['player', ["I haven\'t coach."]],
      ['coach_gonzalez', ["I\'ve already developed a cover identity for you. You\'re the assistant coach for that guy from the country you\'ve never heard of."]],
      ['player', ['What country?']],
      ['coach_gonzalez', ["Well if I\'ve never heard of it, you definitely haven\'t heard of it."]],
      [null, ["You arrive at a dimly lit rec room. There are seven coaches. They are all sitting in a circle sipping diet soda, with a tiny tv in the corner playing early 2000s Wimbledon re-runs. There are two empty chairs."]],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ["The coaches go around the circle naming obscure tennis players from the 1980s. When it comes to your turn, the room gets very quiet. You say 'Yannick Noah' and they all nod approvingly. You survive another night."],
      effects: {
        statChanges: { focus: 2, anticipation: 1 },
        moodChange: 5,
        energyChange: -20,
        relationshipChanges: { coach_gonzalez: 4 },
      },
    },
  },

  {
    id: 'coach_hangout_tier3',
    name: 'The Ultra Lob',
    tags: ['interaction', 'coach'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Coach has something to teach you. Something ancient. Something vertical.',
    dialogue: [
      ['coach_gonzalez', ["Okay. You're ready."]],
      ['player', ["Ready for what?"]],
      ['coach_gonzalez', ["My old mentor — he had a shot. The lob to end all lobs. It goes so high that the opponent forgets what they were doing by the time it comes down."]],
      ['player', ["That doesn't sound legal."]],
      ['coach_gonzalez', ["It's a lob. It's always legal. It's always been legal. It's how our forefathers won matches before you even smelt your first tennis ball can. Now shut up and watch."]],
      [null, ["He hits a lob so high it briefly disappears from view. When it comes down it lands exactly on the baseline. You have many questions. He shows you what you can only describe as a forbidden technique."]],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ["It takes you three hours to learn the Ultra Lob. It goes so high that birds scatter. It is absurd. It is beautiful. It is disgusting. Coach watches with tears in his eyes.'"],
      effects: {
        statChanges: { defensive: 3, slice: 1 },
        moodChange: 15,
        energyChange: -20,
        relationshipChanges: { coach_gonzalez: 5 },
        abilitiesGained: [AbilityName.ULTRA_LOB],
      },
    },
  },

  // ============================================================================
  // JORDAN (RIVAL)
  // ============================================================================

  {
    id: 'jordan_hangout_tier0',
    name: 'Hate Practice',
    tags: ['interaction', 'rival'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan wants you to know something before this starts.',
    dialogue: [
      ['jordan_rival', ["Let me be clear. I hate you."]],
      ['player', ["Normally I start with 'Hello.'"]],
      ['jordan_rival', ["But nobody else wants to practice with me right now. So."]],
      ['player', ["Not a moment of self reflection in that, huh?"]],
      ['jordan_rival', ["Don't make it weird. Just hit the ball."]],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ["You spend an hour hitting with someone who openly despises you. Every ball Jordan sends back has extra pace on it. You're not sure if that's intentional or just how they feel about you. Either way, good practice."],
      effects: {
        statChanges: { return: 1, focus: 1 },
        moodChange: 5,
        energyChange: -15,
        relationshipChanges: { jordan_rival: 3 },
      },
    },
  },

  {
    id: 'jordan_hangout_tier1',
    name: 'Ball Boy Promotion',
    tags: ['interaction', 'rival'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan had an extra slot for a private lesson. You got the other role.',
    dialogue: [
      ['jordan_rival', ["I had one extra slot for a private lesson with Coach Diaz."]],
      ['player', ["Oh nice, I—"]],
      ['jordan_rival', ["You're the ball boy."]],
      ['player', ["...what?"]],
      ['jordan_rival', ["Somebody has to pick them up. Might as well learn something while you're down there."]],
      ['jordan_rival', ["But in return, Coach Diaz offered to give you a private lesson after. It should help."]],
      ['player', ["Well that's... that is about as nice as I could hope. Thanks."]]
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ["You spend an hour picking up balls while Jordan takes a private lesson. It is humbling. It is annoying. The lesson after with Coach Diaz was totally worth it, though."],
      effects: {
        statChanges: { forehand: 2, backhand: 2, volley: 1, speed: 1 },
        moodChange: 3,
        energyChange: -20,
        relationshipChanges: { jordan_rival: 3 },
      },
    },
  },

  {
    id: 'jordan_hangout_tier2',
    name: 'Emergency Doubles',
    tags: ['interaction', 'rival', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan\'s doubles partner went down. You\'re the replacement.',
    dialogue: [
      ['jordan_rival', ["My doubles partner pulled a hamstring. You're filling in. I couldn\'t find anyone else. Don\'t be flattered."]],
      ['player', ["You're... asking me?"]],
      ['jordan_rival', ["I'm telling you. Court 3. Twenty minutes. Don't be late."]],
      [null, ["Jordan is already walking away."]],
    ],
    characters: ['jordan_rival'],
    options: [
      {
        id: 'take_the_lead',
        text: 'Take the Lead',
        emoji: '⚡',
        description: 'Step up and show Jordan you belong at the net',
        outcome: {
          resultText: ["You take charge at the net. Jordan doesn't say anything during the match, which from them is practically a standing ovation. You win in two sets. Afterward, Jordan nods once. A single high five."],
          effects: {
            statChanges: { volley: 2, offensive: 1 },
            moodChange: 12,
            energyChange: -25,
            relationshipChanges: { jordan_rival: 5 },
          },
        },
      },
      {
        id: 'play_support',
        text: 'Play Support',
        emoji: '🛡️',
        description: 'Cover the baseline and let Jordan do their thing',
        outcome: {
          resultText: ["You stay back and cover everything Jordan can't reach, which isn't much. You lose a close match, but Jordan says 'your defense was fine.' From Jordan, that's basically a love letter."],
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
    name: 'Low Ego',
    tags: ['interaction', 'rival'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jordan does something unprecedented.',
    dialogue: [
      [null, ["You find Jordan waiting outside the gym. They look uncomfortable."]],
      ['jordan_rival', ["I need to ask you something and I need you to not be weird about it."]],
      ['player', ["...go ahead."]],
      ['jordan_rival', ["My volleys are bad. You know it. I know it. You know that\'s the last piece I need to make the next level. Can you... help me?"]],
      [null, ["This might be the most difficult sentence Jordan has ever spoken."]],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ["You spend two hours at the net with Jordan. They listen. They don't trash talk. You see them noticeably improve, and you learn a little yourself about keeping a positive mindset. You can handle pressure a little bit better now."],
      effects: {
        statChanges: { volley: 2, focus: 2 },
        moodChange: 15,
        energyChange: -20,
        relationshipChanges: { jordan_rival: 5 },
        abilitiesGained: [AbilityName.LOW_EGO],
      },
    },
  },

  // ============================================================================
  // KEITH
  // ============================================================================

  {
    id: 'keith_hangout_tier0',
    name: 'Recon Mission',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith has a plan to help scout a rival academy.',
    dialogue: [
      ['keith', ["I've been looking into one of the academies we might face this season. They've been pretty close to the top of the standings."]],
      ['keith', ["I snuck into their facility last week! They're an ocean research school, so they have a pretty incredible aquarium in the main building."]],
      ['keith', ['The plan is simple. We sneak back into the facility, make it through the main building, and out behind to the left are the courts. We can watch them practice!']],
      [null, ["You aren't fully sold, but you can't let ", {characterId: 'keith'}, " do this alone. You tag along."]],
      [null, ["You both arrive at the facility and slip in behind two chatting students."]],
      ['keith', ["I'm just going to check out the sunfish exhibit. And they have a seasonal section focused on alligators this month."]],
      ['player', ['And the tennis courts...?']],
      [null, ['But ', {characterId: 'keith'}, ' was already long gone. You notice a sign advertising a whale shark exhibit. They can\'t have that right?']],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["You spend hours in the main building without ever making it to the courts. You realize this might have been ", {characterId: 'keith'}, "'s plan all along. The alligator exhibit was worth the walk, anyway."],
      effects: {
        statChanges: { anticipation: 1, return: 1 },
        moodChange: 15,
        energyChange: -10,
        relationshipChanges: { keith: 3 },
      },
    },
  },

  {
    id: 'keith_hangout_tier1',
    name: 'Dorm Room Grill',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith invites you over for some dawgs.',
    dialogue: [
      ['keith', ["Come over. I'm making hotdogs."]],
      ['player', ["...in your dorm room?"]],
      ['keith', ["I have a system. Just come over."]],
      [null, ["His system is a camping grill balanced on two textbooks next to an open window. The smoke alarm has been covered with a sock."]],
      [null, ["An elaborate array of least four desktop fans all point towards the setup, and ", {characterId: 'keith'}, ' dons a hockey mask to fire it up.']]
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["The hotdogs are incredible. The fire risk is significant and many rules are broken. You sort of lose count after four hotdogs. This is the most relaxed you've felt in weeks."],
      effects: {
        moodChange: 20,
        energyChange: -5,
        relationshipChanges: { keith: 4 },
      },
    },
  },

  {
    id: 'keith_hangout_tier2',
    name: 'The Eleven Samples',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith wants ice cream. He takes this seriously.',
    dialogue: [
      ['keith', ["Look, I need to get out of this slump. Ice cream. Let's go. I know a place."]],
      ['player', ["Sure, sounds—"]],
      ['keith', ["I should warn you. I'm a sampler."]],
      ['player', ["What does that mean?"]],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["Keith samples eleven flavors of ice cream. Eleven. The employee behind the counter glares at him after each one, but he doesn\'t notice. Keith asks detailed questions about the vanilla. After another few minutes, the employee gives you both ice cream for free just to get you out of the store. You feel some shame, but ", {characterId: 'keith'}, " does not."],
      effects: {
        statChanges: { recovery: 1 },
        moodChange: 25,
        energyChange: -5,
        relationshipChanges: { keith: 4 },
      },
    },
  },

  {
    id: 'keith_hangout_tier3',
    name: 'Best Friend Award',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Keith has prepared something. He looks very serious about it.',
    dialogue: [
      [null, ["Keith arrives holding a pink paper bag. He's trying very hard not to smile."]],
      ['keith', ["Okay. It\'s official."]],
      ['player', ["What's official?"]],
      [null, ["He pulls out a small trophy made of cardboard and glitter glue. It says 'BEST FRIEND AWARD' in uneven letters."]],
      ['keith', ["You are hereby my BFF. This is legally binding. I maintain the right to revoke this title at-will. My lawyers will be in touch about the details."]],
    ],
    characters: ['keith'],
    options: [],
    defaultOutcome: {
      resultText: ["You are holding a glitter glue trophy. Keith is beaming. He makes a four minute long speech. You put the trophy on your nightstand. Every relationship you build from now on feels a little warmer."],
      effects: {
        statChanges: { focus: 1, recovery: 1 },
        moodChange: 30,
        energyChange: -5,
        relationshipChanges: { keith: 5 },
        abilitiesGained: [AbilityName.BEST_FRIEND_AWARD],
      },
    },
  },

  // ============================================================================
  // JEN
  // ============================================================================

  {
    id: 'jen_hangout_tier0',
    name: 'Ruthless Conditioning',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen invited you to the park. You thought it was casual. It is not.',
    dialogue: [
      ['jen', ["Let's do a light workout at the park. I had a practice get cancelled but I don\'t want to waste the weather."]],
      ['player', ["That sounds nice—"]],
      ['jen', ["Sprints first. Then agility ladder. Then burpees. Then we run the hill. Then 200 serves. Then 100 volleys. And we finish with sprints again."]],
      ['player', ["You said light."]],
      ['jen', ["This IS light. Don\'t you want to get better? And we'll be running to the park. I hope you brought shoes. Hurry up!"]],
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ["Jen does not mess around. You do sprints, agility drills, burpees, and hill runs. Jen does all of it while maintaining a conversation about racquet tension. You can barely breathe."],
      effects: {
        statChanges: { speed: 1, stamina: 1 },
        moodChange: 5,
        energyChange: -25,
        relationshipChanges: { jen: 3 },
      },
    },
  },

  {
    id: 'jen_hangout_tier1',
    name: 'Volunteer Coaching',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen volunteers coaching kids at the park. She roped you in.',
    dialogue: [
      ['jen', ["I coach kids on Saturday mornings. I had a coach call in sick, so I need you. You're helping."]],
      ['player', ["I don't know how to coach kids."]],
      ['jen', ["You know how to hit a tennis ball. The rest is patience. And thick skin."]],
      ['player', ["Since when do you have patience?"]],
      ['jen', ['For you? Never. These kids are a lot smarter. And better at tennis if you ask me. Even though they\'re middle schoolers.']]
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ["The kids are chaotic. One of them hits a ball into the parking lot. Another has pulled down the pants of at least two other teammates. You barely survive the session, but you're happy to have the experience."],
      effects: {
        statChanges: { forehand: 1, placement: 1 },
        moodChange: 15,
        energyChange: -15,
        relationshipChanges: { jen: 4 },
      },
    },
  },

  {
    id: 'jen_hangout_tier2',
    name: 'Meet the Cats',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen invites you over to meet the cats.',
    dialogue: [
      ['jen', ["Do you want to meet my cats?"]],
      ['player', ["Sure! What are their names?"]],
      ['jen', ["Deuce and Advantage."]],
      ['player', ["...of course they are."]],
      [null, ["You make it to her apartment and immediately notice an entire apartment full of only tennis equipment and cat trees."]],
      ['jen', ["Deuce is orange and very stupid. Advantage is gray and ignores you completely. Make yourself at home."]],
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ["Deuce bites your shoe. Advantage gets cat hair all over your clothes before you leave. You're happy to see a little more of ", {characterId: 'jen'}, ' outside of tennis.'],
      effects: {
        statChanges: { focus: 1 },
        moodChange: 20,
        energyChange: -10,
        relationshipChanges: { jen: 4 },
      },
    },
  },

  {
    id: 'jen_hangout_tier3',
    name: 'Great Mentality',
    tags: ['interaction', 'friend'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Jen challenges you to a practice match. She has something to prove.',
    dialogue: [
      ['jen', ["I've been in a bit of a slump. Practice match. Right now. Full sets."]],
      ['player', ["Uh, sure. I know how you are, so I already brought my racquet."]],
      [null, ["You make it out to the courts and start hitting. You take an early lead. You're playing well. And then—"]],
      ['jen', ["My turn."]],
      [null, ["She doesn't give up. She never gives up. She only seems to play better as time goes on. She storms back from nowhere and wins the match."]],
    ],
    characters: ['jen'],
    options: [],
    defaultOutcome: {
      resultText: ["After the match, you sit on the bench together. 'You had me,' she says. 'Early on. But I never stop believing I can come back. That's not talent. That's a choice.' She's right. Something about her refusal to quit rewired something in your brain. Every match from now on — win or lose — is going to teach you more."],
      effects: {
        statChanges: { focus: 2, anticipation: 1 },
        moodChange: 15,
        energyChange: -20,
        relationshipChanges: { jen: 5 },
        abilitiesGained: [AbilityName.GREAT_MENTALITY],
      },
    },
  },

  // ============================================================================
  // ALEX (ROMANCE)
  // ============================================================================

  {
    id: 'alex_hangout_tier0',
    name: 'Trash TV Bonding',
    tags: ['interaction', 'romance'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Practice, food, and a shared secret — you both watch terrible television.',
    dialogue: [
      ['alex_romance', ["Good practice today. Want to grab food?"]],
      ['player', ["Yeah, I'm starving."]],
      [null, ["You manage to find a local teriyaki shop."]],
      ['alex_romance', ["Did you know that teriyaki is originally Japanese, but modern teriyaki chicken was born in Seattle in the 70s?"]],
      ['alex_romance', ["I had an old teammate from Seattle. They hated playing in the sun. Inddors? Undefeated. They played better in the rain."]],
      ['alex_romance', ["Okay I have to ask. Do you watch Love Lagoon? The one where they-"]],
      ['player', ["Where they make anyone who doesn't find a match jump into the Great Lagoon and swim to shore? ...Season 4 is the best one."]],
      ['alex_romance', ["I KNEW IT. I just love to see them bicker. The swimming is just extra."]],
    ],
    characters: ['alex_romance'],
    options: [],
    defaultOutcome: {
      resultText: ["You spend two hours dissecting the elimination bracket of a reality show on a garbage network. Alex has theories. You have countertheories. You leave feeling like someone finally understands you."],
      effects: {
        statChanges: { speed: 1 },
        moodChange: 15,
        energyChange: -10,
        relationshipChanges: { alex_romance: 3 },
      },
    },
  },

  {
    id: 'alex_hangout_tier1',
    name: 'The Jersey Bet',
    tags: ['interaction', 'romance'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Shopping at the mall. A bet is made. The stakes are fashion.',
    dialogue: [
      [null, ["You meet up for a practice set at the park. After a brief warmup, you start playing and quickly find yourself in a set tiebreak."]],
      ['alex_romance', ["Let's make it interesting. Whoever loses the breaker buys the other a little something after the match."]],
      ['player', ["You're on."]],
      [null, ["You fight through a long rally and just scrape the last shot in. You win. Barely. Alex pretends to be upset but is clearly already planning something."]],
      [null, ["You're sweaty and exhausted, but you still opt to walk to the mall together. You find any excuse to be around ", {characterId: 'alex'}, '.']],
      [null, [{characterId: 'alex'}, " disappears into the sports store and comes back with a jersey from your favorite team. It has 'ALEX' stitched on the back. You stare at it. They grin."]],
      ['alex_romance', ["So you don't forget who bought it. Thanks again for the match earlier."]]
    ],
    characters: ['alex_romance'],
    options: [],
    defaultOutcome: {
      resultText: ["You spend the rest of the afternoon walking through the city togethr in your new jersey. You're starting to think they like you."],
      effects: {
        statChanges: { forehand: 1, focus: 1 },
        moodChange: 20,
        energyChange: -10,
        relationshipChanges: { alex_romance: 5 },
      },
    },
  },

  {
    id: 'alex_hangout_tier2',
    name: 'Heart Strings',
    tags: ['interaction', 'romance'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'Alex offers to string your racquet. The result is... unexpected.',
    dialogue: [
      ['alex_romance', ["Give me your racquet. I'll restring it tonight."]],
      ['player', ["You string racquets?"]],
      ['alex_romance', ["I have many talents. I also whittle."]],
      [null, ["The next morning, you pick up the racquet. The strings form a small but unmistakable heart pattern."]],
      ['player', ["Is this... a heart?"]],
      ['alex_romance', ["It's a structural reinforcement. In the shape of a heart. It's a coincidence."]],
    ],
    characters: ['alex_romance'],
    options: [],
    defaultOutcome: {
      resultText: ["You are not sure how a heart-shaped string pattern is physically possible or whether it's allowed in competition. You don't care. The racquet feels incredible. Every shot has a little extra something."],
      effects: {
        statChanges: { forehand: 1, backhand: 1, placement: 1 },
        moodChange: 25,
        energyChange: -10,
        relationshipChanges: { alex_romance: 8 },
      },
    },
  },

  {
    id: 'alex_hangout_tier3',
    name: 'Love All',
    tags: ['interaction', 'romance'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'A walk through the city. The weather has plans.',
    dialogue: [
      ['alex_romance', ["Walk with me?"]],
      [null, ["You walk through the city together at dusk. It's one of those evenings where everything feels slightly cinematic — the light, the timing, all of it."]],
      ['alex_romance', ["I'm glad we—"]],
      [null, ["It starts raining. Of course it does. Like a scene out of a movie. It doesn't seem to bother either of you."]],
      ['player', ["We should probably—"]],
      ['alex_romance', ["No. Stay. I kinda like it."]],
      [null, ['You walk a little further by the light of the lampposts. The wet pavement seems to give such a warm glow to the night. You turn to ', {characterId: 'alex'}, ' who is looking up at the sky.']],
      [null, ['They grab your hand and turn towards you. For a moment, it feels like everything stopped.']]
    ],
    characters: ['alex_romance'],
    options: [],
    defaultOutcome: {
      resultText: ["You lean in and get a cinematic kiss in the rain. You can't hear or feel the rain anymore, and you lose sense of time for a bit. Somewhere in the distance a car horn honks, which snaps you both out of it and ", {characterId: 'alex'}, " laughs. They makes you really happy. You take a little extra confidence into every game with them by your side."],
      effects: {
        statChanges: { focus: 2, recovery: 1 },
        moodChange: 35,
        energyChange: -10,
        relationshipChanges: { alex_romance: 10 },
        abilitiesGained: [AbilityName.LOVE_ALL],
      },
    },
  },

];
