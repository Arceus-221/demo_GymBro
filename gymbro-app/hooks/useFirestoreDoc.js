import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../services/firebase';

/**
 * Live subscription to a single document. Exposes isFromCache rather than
 * hiding it (Phase 3 §3.3) so the UI can be honest about stale data.
 *
 * @param {string|null} path - slash path, e.g. `users/abc123`. null skips the subscription.
 */
export function useFirestoreDoc(path) {
  const [state, setState] = useState({
    data: null,
    isLoading: true,
    isFromCache: false,
    error: null,
  });

  useEffect(() => {
    if (!path) {
      setState({ data: null, isLoading: false, isFromCache: false, error: null });
      return undefined;
    }

    setState((s) => ({ ...s, isLoading: true }));

    const unsubscribe = onSnapshot(
      doc(db, path),
      (snap) => {
        setState({
          data: snap.exists() ? { id: snap.id, ...snap.data() } : null,
          isLoading: false,
          isFromCache: snap.metadata.fromCache,
          error: null,
        });
      },
      (error) => setState({ data: null, isLoading: false, isFromCache: false, error })
    );

    return unsubscribe;
  }, [path]);

  return state;
}
