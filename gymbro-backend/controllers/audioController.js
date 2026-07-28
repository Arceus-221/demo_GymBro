// controllers/audioController.js — Phase 4 §4.4
// Server-proxied Groq-hosted Whisper fallback for low-confidence on-device
// transcriptions. Never called for Gemini — this is a separate provider.

const FormData = require('form-data');
const axios = require('axios');

const MAX_DURATION_SECONDS = 60;

/**
 * Lightweight duration probe using music-metadata (pure JS, no ffprobe binary
 * dependency needed on Render's free tier). Falls back to allowing the file
 * through (duration = 0) if parsing fails, rather than hard-failing a
 * legitimate short clip on a metadata edge case — the multer fileSize limit
 * (5MB) and Groq's own request handling are the backstop in that case.
 */
const probeAudioDuration = async (buffer) => {
  try {
    const mm = require('music-metadata');
    const metadata = await mm.parseBuffer(buffer);
    return metadata.format.duration || 0;
  } catch (e) {
    console.warn('[audioController] duration probe failed, allowing through:', e.message);
    return 0;
  }
};

exports.transcribe = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_AUDIO_FILE',
      message: 'No audio file was provided.',
    });
  }

  try {
    const durationSeconds = await probeAudioDuration(req.file.buffer);
    if (durationSeconds > MAX_DURATION_SECONDS) {
      return res.status(400).json({
        success: false,
        error: 'AUDIO_TOO_LONG',
        message: `Audio exceeds the ${MAX_DURATION_SECONDS}s limit.`,
      });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: 'voice-note.m4a',
      contentType: req.file.mimetype,
    });
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    // No language pinned — GymBro's user base is multilingual/code-switching;
    // let Whisper auto-detect rather than forcing 'en'.

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        timeout: 20000,
      }
    );

    return res.status(200).json({ success: true, data: { transcript: response.data.text } });

  } catch (error) {
    if (error.message === 'UNSUPPORTED_AUDIO_FORMAT') {
      return res.status(400).json({ success: false, error: 'UNSUPPORTED_AUDIO_FORMAT', message: 'Audio format not supported.' });
    }

    const status = error.response?.status;
    if (status >= 500 || error.code === 'ECONNABORTED') {
      return res.status(502).json({
        success: false,
        error: 'AUDIO_TRANSCRIPTION_FAILED',
        message: 'Transcription service is temporarily unavailable.',
      });
    }

    console.error('[audioController] transcribe error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'AUDIO_UNKNOWN_ERROR',
      message: 'Something went wrong transcribing that audio.',
    });
  }
};
