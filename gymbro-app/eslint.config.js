// Flat config (ESLint 9+). There was no config file at all before, so
// `npm run lint` failed to start rather than reporting findings.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  {
    // dist/ is build output and .expo/ is local cache — neither is source.
    ignores: ['node_modules/**', 'dist/**', '.expo/**'],
  },
  ...expoConfig,
  {
    rules: {
      // These two come from eslint-plugin-react-hooks v6's React Compiler
      // rules. Both flag real patterns, but ones that predate this config and
      // currently work, so they are warnings rather than build failures — they
      // stay visible without turning a lint run into a refactor.
      //
      // set-state-in-effect (4 sites): useFirestoreDoc and useFirestoreCollection
      // reset their state synchronously when `path` goes null, and edit.jsx and
      // progress/index.jsx seed form state from a snapshot the same way.
      // Resolving it properly means restructuring how those subscriptions derive
      // state, which is not a change to make blind.
      //
      // refs (1 site, app/index.jsx): `useRef(new Animated.Value(0)).current`
      // reads a ref during render. That is the standard React Native animation
      // idiom and the alternatives each shift behaviour slightly.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];
