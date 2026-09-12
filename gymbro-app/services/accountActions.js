import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Firebase refuses to change a password or delete an account on a stale session
 * (auth/requires-recent-login). Both flows below reauthenticate up front with
 * the password the user just typed, so a wrong password surfaces as an error on
 * that field instead of an opaque failure part-way through the operation.
 */
async function reauthenticate(currentPassword) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('No signed-in account.');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return user;
}

export async function changePassword({ currentPassword, newPassword }) {
  const user = await reauthenticate(currentPassword);
  await updatePassword(user, newPassword);
}

/** Subcollections under users/{uid} the client is permitted to delete. */
const OWNED_SUBCOLLECTIONS = ['workoutPlans', 'mealPlans', 'dailyLogs', 'aiConversations'];

async function deleteSubcollection(uid, name) {
  const snapshot = await getDocs(collection(db, 'users', uid, name));
  if (snapshot.empty) return;

  // A Firestore batch caps at 500 writes.
  let batch = writeBatch(db);
  let queued = 0;

  for (const document of snapshot.docs) {
    batch.delete(document.ref);
    queued += 1;
    if (queued === 500) {
      await batch.commit();
      batch = writeBatch(db);
      queued = 0;
    }
  }

  if (queued > 0) await batch.commit();
}

/**
 * Deletes the user's data, then the auth account itself.
 *
 * Known gap: Firestore does not cascade deletes, and firestore.rules denies
 * deletes on aiConversations/{id}/messages (`allow update, delete: if false`),
 * so chat message documents survive as orphans beneath deleted parents. They
 * are unreachable — every rule on that path requires request.auth.uid == uid,
 * and that uid can never authenticate again — but they are not erased. Purging
 * them properly needs the Admin SDK, i.e. a backend endpoint or a scheduled job.
 */
export async function deleteAccount({ currentPassword }) {
  const user = await reauthenticate(currentPassword);
  const { uid } = user;

  for (const name of OWNED_SUBCOLLECTIONS) {
    await deleteSubcollection(uid, name);
  }
  await deleteDoc(doc(db, 'users', uid));

  // Last, because once this resolves the session is gone and no further
  // Firestore write would be permitted by the rules.
  await deleteUser(user);
}

export function signOutUser() {
  return signOut(auth);
}
