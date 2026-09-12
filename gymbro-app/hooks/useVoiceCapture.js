import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useState } from 'react';
import { auth } from '../services/firebase';
import { useUIStore } from '../store/useUIStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://gymbro-api.onrender.com';
const MAX_RECORDING_MS = 60_000; // server re-validates this too (Phase 4 §4.6)

/**
 * Records a short voice note and returns a transcript from the backend's
 * Groq/Whisper proxy. Note this is *only* a transcription step — the caller
 * drops the text into an editable field; nothing is auto-submitted to an AI
 * endpoint from voice alone (Phase 4 §4.1, §4.5).
 *
 * Expo Speech is text-to-speech, not recognition, so there is no on-device
 * STT "attempt 1" here — the server proxy is the single path.
 */
export function useVoiceCapture() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const showError = useUIStore((s) => s.showError);

  const startRecording = useCallback(async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showError('Microphone permission is needed for voice notes');
        return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setTimeout(() => {
        if (recorder.isRecording) recorder.stop().catch(() => {});
      }, MAX_RECORDING_MS);
      return true;
    } catch {
      showError('Couldn’t start recording');
      return false;
    }
  }, [recorder, showError]);

  const stopAndTranscribe = useCallback(async () => {
    setIsRecording(false);
    let uri;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch {
      showError('Couldn’t finish that recording');
      return null;
    }
    if (!uri) return null;

    setIsTranscribing(true);
    try {
      const idToken = await auth.currentUser.getIdToken(false);
      const form = new FormData();
      form.append('audio', { uri, name: 'voice-note.m4a', type: 'audio/m4a' });

      const response = await fetch(`${BASE_URL}/api/audio/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: form,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showError(payload?.message || 'Voice transcription is temporarily unavailable');
        return null;
      }
      return payload?.data?.transcript ?? null;
    } catch {
      showError('Voice transcription failed — check your connection');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [recorder, showError]);

  return { isRecording, isTranscribing, startRecording, stopAndTranscribe };
}
