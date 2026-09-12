// constants/quotes.js — loading-screen copy.
//
// Deliberately unattributed gym aphorisms rather than quotes credited to real
// people: attributed fitness quotes are misattributed more often than not, and
// shipping a wrong credit is worse than shipping no credit.

export const MOTIVATIONAL_QUOTES = [
  'The only bad workout is the one that didn’t happen.',
  'Discipline beats motivation. Show up anyway.',
  'You don’t have to be extreme. Just consistent.',
  'Progress is built one rep past comfortable.',
  'The weight doesn’t care how you feel today.',
  'Small sessions still count. Zero sessions don’t.',
  'Train for the body you want in a year, not tomorrow.',
  'Rest is part of the programme, not a break from it.',
  'Strong is built in the reps nobody watches.',
  'Every set is a vote for the person you’re becoming.',
  'You can’t out-train a plan you never follow.',
  'Start where you are. Use what you have.',
];

/** One quote per app launch — call once and hold it, or it reshuffles on render. */
export function randomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}
