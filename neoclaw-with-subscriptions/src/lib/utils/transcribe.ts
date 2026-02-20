const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribe an audio Blob to text using OpenAI's Whisper API.
 *
 * @param audioBlob  The recorded audio blob (webm, ogg, mp4, etc.)
 * @param mimeType   The MIME type of the blob (used to pick a file extension)
 * @returns The transcribed text
 */
export async function transcribeAudio(
  audioBlob: Blob,
  mimeType: string,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'VITE_OPENAI_API_KEY is not set. Add it to your .env file.',
    );
  }

  const extension = extensionFromMime(mimeType);

  const formData = new FormData();
  formData.append('file', audioBlob, `recording.${extension}`);
  formData.append('model', 'gpt-4o-mini-transcribe');

  const response = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Whisper API error (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as { text: string };
  return data.text.trim();
}

/** Map common audio MIME types to file extensions Whisper accepts. */
function extensionFromMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  return 'webm'; // safe default
}
