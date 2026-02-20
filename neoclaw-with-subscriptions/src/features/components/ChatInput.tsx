import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '@/features/theme';
import { transcribeAudio } from '@/lib/utils/transcribe';

/* ── Helpers ── */

/** Pick the best supported MIME type for audio recording */
function getAudioMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

/* ── Styled components ── */

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.surface};
`;

const TextInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  font-family: ${theme.fontFamily};
  color: ${theme.colors.textPrimary};
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: ${theme.colors.textMuted};
  }

  &:focus {
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    background: ${theme.colors.background};
    color: ${theme.colors.textMuted};
  }
`;

const IconButton = styled.button<{ $variant?: 'primary' | 'muted' | 'danger' }>`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;

  ${(p) =>
    p.$variant === 'muted'
      ? css`
          background-color: ${theme.colors.textMuted};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.textSecondary};
          }
        `
      : p.$variant === 'danger'
        ? css`
            background-color: ${theme.colors.textMuted};
            &:hover:not(:disabled) {
              background-color: ${theme.colors.error};
            }
          `
        : css`
            background-color: ${theme.colors.primary};
            &:hover:not(:disabled) {
              background-color: ${theme.colors.primaryHover};
            }
          `}

  &:disabled {
    background-color: ${theme.colors.border};
    cursor: not-allowed;
  }
`;

const RecordingBar = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  min-width: 0;
`;

const WaveformCanvas = styled.canvas`
  flex: 1;
  height: 32px;
  min-width: 0;
`;

const RecordingTimer = styled.span`
  font-size: 13px;
  font-family: ${theme.fontFamily};
  color: ${theme.colors.primary};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
  flex-shrink: 0;
`;

const AudioPreviewPlayer = styled.audio`
  flex: 1;
  height: 36px;
  min-width: 0;

  &::-webkit-media-controls-panel {
    background: ${theme.colors.background};
  }
`;

/* ── SVG icons ── */

const MicIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="12" rx="3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

/* ── Component ── */

const StopIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

interface ChatInputProps {
  onSend: (text: string, audioDataUrl?: string) => void;
  onAbort?: () => void;
  disabled: boolean;
}

interface PendingAudio {
  objectUrl: string;
  blob: Blob;
  mimeType: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onAbort, disabled }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopModeRef = useRef<'preview' | 'transcribe'>('preview');

  // Waveform refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (!disabled && !isTranscribing) {
      inputRef.current?.focus();
    }
  }, [disabled, isTranscribing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      clearTimer();
      stopWaveform();
      if (pendingAudio) URL.revokeObjectURL(pendingAudio.objectUrl);
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopMediaTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const stopWaveform = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const WAVEFORM_BARS = 80;

  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Compute RMS amplitude for this frame
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      const amplitude = Math.min(1, rms * 4); // amplify for visibility

      // Push to scrolling history (newest on right)
      const history = waveformHistoryRef.current;
      history.push(amplitude);
      if (history.length > WAVEFORM_BARS) {
        history.shift();
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const gap = 2;
      const barWidth = Math.max(2, (w - (WAVEFORM_BARS - 1) * gap) / WAVEFORM_BARS);
      const totalBarWidth = barWidth + gap;

      // Draw from left (oldest) to right (newest)
      const startX = w - history.length * totalBarWidth;

      for (let i = 0; i < history.length; i++) {
        const barHeight = Math.max(2, history[i] * h * 0.85);
        const x = startX + i * totalBarWidth;
        const y = (h - barHeight) / 2;

        // Fade in: older bars are more transparent
        const progress = i / (history.length - 1 || 1);
        const alpha = 0.25 + 0.75 * progress;
        ctx.fillStyle = `rgba(67, 24, 255, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1);
        ctx.fill();
      }
    };

    draw();
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio analyser for waveform
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      stopModeRef.current = 'preview';
      waveformHistoryRef.current = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearTimer();
        stopMediaTracks();
        stopWaveform();
        setIsRecording(false);
        setRecordingSeconds(0);

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) return;

        const resolvedMimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: resolvedMimeType });

        if (stopModeRef.current === 'preview') {
          // Show audio preview for replay
          const objectUrl = URL.createObjectURL(audioBlob);
          setPendingAudio({ objectUrl, blob: audioBlob, mimeType: resolvedMimeType });
        } else {
          // Transcribe immediately
          doTranscribe(audioBlob, resolvedMimeType);
        }
      };

      recorder.onerror = () => {
        console.warn('[NeoClaw] MediaRecorder error');
        clearTimer();
        stopMediaTracks();
        stopWaveform();
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      // Collect data every second for a responsive stop
      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start a visual timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.warn('[NeoClaw] Microphone access denied or unavailable:', err);
    }
  }, []);

  // Start drawing waveform when canvas mounts during recording
  const waveformCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node;
      if (node && analyserRef.current) {
        const rect = node.getBoundingClientRect();
        node.width = rect.width;
        node.height = rect.height;
        drawWaveform();
      }
    },
    [drawWaveform],
  );

  /** Shared transcription logic */
  const doTranscribe = useCallback(async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const transcribedText = await transcribeAudio(blob, mimeType);
      if (transcribedText) {
        setText((prev) => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + transcribedText;
        });
      }
    } catch (err) {
      console.error('[NeoClaw] Transcription failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const stopRecorder = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /** ✓ during recording → stop & transcribe immediately */
  const confirmRecording = useCallback(() => {
    stopModeRef.current = 'transcribe';
    stopRecorder();
  }, [stopRecorder]);

  /** ✕ during recording → stop & show preview */
  const previewRecording = useCallback(() => {
    stopModeRef.current = 'preview';
    stopRecorder();
  }, [stopRecorder]);

  /** Discard the previewed audio */
  const discardPreview = useCallback(() => {
    if (pendingAudio) {
      URL.revokeObjectURL(pendingAudio.objectUrl);
      setPendingAudio(null);
    }
  }, [pendingAudio]);

  /** Transcribe the previewed audio */
  const confirmPreview = useCallback(() => {
    if (!pendingAudio) return;
    const { blob, mimeType, objectUrl } = pendingAudio;
    URL.revokeObjectURL(objectUrl);
    setPendingAudio(null);
    doTranscribe(blob, mimeType);
  }, [pendingAudio, doTranscribe]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const canSend = text.trim();
  const inputDisabled = disabled || isTranscribing;

  // ── Recording state ──
  if (isRecording) {
    return (
      <InputContainer>
        <IconButton $variant="muted" onClick={previewRecording} aria-label="Stop and preview">
          <CloseIcon />
        </IconButton>
        <RecordingBar>
          <WaveformCanvas ref={waveformCanvasRef} />
          <RecordingTimer>{formatTime(recordingSeconds)}</RecordingTimer>
        </RecordingBar>
        <IconButton onClick={confirmRecording} aria-label="Stop and transcribe">
          <CheckIcon />
        </IconButton>
      </InputContainer>
    );
  }

  // ── Audio preview state (replay before transcribing) ──
  if (pendingAudio) {
    return (
      <InputContainer>
        <IconButton $variant="muted" onClick={discardPreview} aria-label="Discard recording">
          <TrashIcon />
        </IconButton>
        <AudioPreviewPlayer controls preload="metadata" src={pendingAudio.objectUrl} />
        <IconButton onClick={confirmPreview} aria-label="Transcribe recording">
          <CheckIcon />
        </IconButton>
      </InputContainer>
    );
  }

  // ── Default / transcribing state (text input) ──
  return (
    <InputContainer>
      <TextInput
        ref={inputRef}
        type="text"
        placeholder={
          isTranscribing
            ? 'Transcribing...'
            : disabled
              ? 'Waiting for response...'
              : 'Type a message...'
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={inputDisabled}
        aria-label="Chat message input"
      />
      {disabled && onAbort ? (
        <IconButton
          onClick={onAbort}
          $variant="danger"
          aria-label="Stop generating"
        >
          <StopIcon />
        </IconButton>
      ) : (
        <>
          <IconButton
            onClick={startRecording}
            disabled={inputDisabled}
            aria-label="Start voice input"
          >
            <MicIcon />
          </IconButton>
          <IconButton
            onClick={handleSend}
            disabled={inputDisabled || !canSend}
            aria-label="Send message"
          >
            <SendIcon />
          </IconButton>
        </>
      )}
    </InputContainer>
  );
};

export default ChatInput;
