import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../services/firebase';

/**
 * Live subscription to a collection.
 *
 * Constraints are typically constructed inline at the call site, so their array
 * identity changes every render. Rather than trying to introspect them (two
 * different `where` clauses serialize identically), callers pass an explicit
 * `key` describing what makes this query unique — resubscription happens when
 * the path or that key changes.
 *
 * @param {string|null} path - slash path, e.g. `users/abc/dailyLogs`
 * @param {Array} constraints - firestore query constraints (where, orderBy, limit)
 * @param {string} key - identity of this particular query, e.g. `week:2026-07-27`
 */
export function useFirestoreCollection(path, constraints = [], key = '') {
  const [state, setState] = useState({
    data: [],
    isLoading: true,
    isFromCache: false,
    error: null,
  });

  useEffect(() => {
    if (!path) {
      setState({ data: [], isLoading: false, isFromCache: false, error: null });
      return undefined;
    }

    setState((s) => ({ ...s, isLoading: true }));

    const unsubscribe = onSnapshot(
      query(collection(db, path), ...constraints),
      (snap) => {
        setState({
          data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          isLoading: false,
          isFromCache: snap.metadata.fromCache,
          error: null,
        });
      },
      (error) => setState({ data: [], isLoading: false, isFromCache: false, error })
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);

  return state;
}
