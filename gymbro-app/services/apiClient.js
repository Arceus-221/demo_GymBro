// services/apiClient.js
// Reusable helper for all backend AI calls (Path B). See Phase 1 §3I and
// Phase 5 §1.2 for full rationale.
import auth from '@react-native-firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://gymbro-api.onrender.com';

export const callBackend = async (endpoint, body) => {
  const idToken = await auth().currentUser.getIdToken(/* forceRefresh */ false);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Backend request failed');
  }

  return response.json();
};

/**
 * Fire-and-forget wake ping — gets Render's container spinning up in the
 * background before the user reaches a screen that actually needs it.
 * Errors are swallowed; a failed wake ping is not user-facing.
 */
export const wakeBackend = () => {
  fetch(`${BASE_URL}/health`).catch(() => {
    // Intentionally silent — this is opportunistic, not required for correctness
  });
};
