// services/aiProviders/geminiAdapter.js
// gemini-2.0-flash and gemini-2.0-flash-lite were fully shut down by Google
// on June 1, 2026 — this adapter must always target gemini-2.5-flash-lite.
const axios = require('axios');

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const parseJsonDefensively = (rawText) => {
  try {
    return JSON.parse(rawText);
  } catch (e) {
    const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }
};

const call = async (systemPrompt, userPrompt, maxTokens) => {
  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  };

  const response = await axios.post(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const rawText = response.data.candidates[0].content.parts[0].text;
  return parseJsonDefensively(rawText);
};

module.exports = { call };
