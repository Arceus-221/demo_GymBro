/** Firebase Auth error codes -> copy a person can act on. */
const AUTH_ERROR_COPY = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'That email is already registered — try signing in.',
  'auth/weak-password': 'Password needs to be at least 6 characters.',
  'auth/network-request-failed': 'Network problem — check your connection.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/operation-not-allowed':
    'Email/password sign-in isn’t enabled on this Firebase project yet.',
};

export function authErrorMessage(error) {
  return AUTH_ERROR_COPY[error?.code] || 'Something went wrong — please try again.';
}
