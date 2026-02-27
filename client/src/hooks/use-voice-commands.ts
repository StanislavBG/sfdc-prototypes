import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChartNode } from './use-bs-charts';

// ─── Web Speech API types ─────────────────────────────────────────────
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// ─── Voice Command Types ──────────────────────────────────────────────
export type VoiceCommand =
  | { action: 'add'; elementType: ChartNode['type']; label?: string }
  | { action: 'label'; name: string }
  | { action: 'move-direction'; target: string; direction: 'up' | 'down' | 'left' | 'right'; amount: number }
  | { action: 'move-relative'; target: string; position: 'above' | 'below' | 'left-of' | 'right-of'; relativeTo: string }
  | { action: 'connect'; from: string; to: string }
  | { action: 'delete'; target: string }
  | { action: 'select'; target: string }
  | { action: 'set-color'; target: string | null; color: string }
  | { action: 'add-row'; text: string }
  | { action: 'duplicate'; target: string }
  | { action: 'set-property'; target: string | null; property: string; value: string }
  | { action: 'unknown'; raw: string };

export interface VoiceLogEntry {
  id: number;
  timestamp: number;
  transcript: string;
  command: VoiceCommand;
  success: boolean;
}

// ─── Color Name Map ───────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  blue: '#1B96FF',
  red: '#E11D48',
  green: '#2E844A',
  purple: '#8B5CF6',
  orange: '#EA580C',
  yellow: '#F59E0B',
  teal: '#0B827C',
  gray: '#6B7280',
  grey: '#6B7280',
  black: '#1e293b',
  slate: '#54698D',
  pink: '#EC4899',
  white: '#ffffff',
};

// ─── Command Parser ───────────────────────────────────────────────────
export function parseVoiceCommand(raw: string): VoiceCommand {
  const text = raw.toLowerCase().trim();

  // ── Add element ──
  // "add data table", "add a diamond called foo", "add process named bar"
  const addMatch = text.match(
    /^add\s+(?:a\s+)?(?:new\s+)?(data\s*table|table|diamond|decision|process|text\s*label|label)(?:\s+(?:called|named|labeled)\s+(.+))?$/
  );
  if (addMatch) {
    const rawType = addMatch[1].replace(/\s+/g, '');
    let elementType: ChartNode['type'];
    if (rawType === 'datatable' || rawType === 'table') elementType = 'data-table';
    else if (rawType === 'diamond' || rawType === 'decision') elementType = 'diamond';
    else if (rawType === 'process') elementType = 'process';
    else elementType = 'text-label';
    return { action: 'add', elementType, label: addMatch[2]?.trim() };
  }

  // ── Label / Name ──
  // "label it Account DLO", "name it Source Data", "call it My Widget"
  const labelMatch = text.match(/^(?:label|name|call|rename)\s+(?:it|this|that|selected)\s+(.+)$/);
  if (labelMatch) {
    return { action: 'label', name: labelMatch[1].trim() };
  }

  // ── Move relative to another component ──
  // "move Account above Contact", "move foo to the right of bar"
  const moveRelMatch = text.match(
    /^move\s+(.+?)\s+(?:to\s+the\s+)?(above|below|left\s+of|right\s+of|over|under)\s+(.+)$/
  );
  if (moveRelMatch) {
    const target = moveRelMatch[1].trim();
    const rawPos = moveRelMatch[2].replace(/\s+/g, '-');
    const relativeTo = moveRelMatch[3].trim();
    const posMap: Record<string, 'above' | 'below' | 'left-of' | 'right-of'> = {
      above: 'above', over: 'above', below: 'below', under: 'below',
      'left-of': 'left-of', 'right-of': 'right-of',
    };
    return { action: 'move-relative', target, position: posMap[rawPos] || 'above', relativeTo };
  }

  // ── Move directional ──
  // "move Account up", "move foo left by 100", "move it down"
  const moveDirMatch = text.match(
    /^move\s+(.+?)\s+(up|down|left|right)(?:\s+(?:by\s+)?(\d+))?$/
  );
  if (moveDirMatch) {
    const target = moveDirMatch[1].trim();
    const direction = moveDirMatch[2] as 'up' | 'down' | 'left' | 'right';
    const amount = moveDirMatch[3] ? parseInt(moveDirMatch[3]) : 60;
    return { action: 'move-direction', target, direction, amount };
  }

  // ── Connect ──
  // "connect Account to Contact", "link foo to bar"
  const connectMatch = text.match(/^(?:connect|link|draw\s+(?:a\s+)?(?:line|arrow)\s+from)\s+(.+?)\s+to\s+(.+)$/);
  if (connectMatch) {
    return { action: 'connect', from: connectMatch[1].trim(), to: connectMatch[2].trim() };
  }

  // ── Delete ──
  // "delete Account", "remove foo"
  const deleteMatch = text.match(/^(?:delete|remove|destroy)\s+(.+)$/);
  if (deleteMatch) {
    return { action: 'delete', target: deleteMatch[1].trim() };
  }

  // ── Select ──
  // "select Account", "pick foo"
  const selectMatch = text.match(/^(?:select|pick|focus|click)\s+(.+)$/);
  if (selectMatch) {
    return { action: 'select', target: selectMatch[1].trim() };
  }

  // ── Set color ──
  // "color it blue", "make Account red", "set color to green", "color blue"
  const colorMatch = text.match(
    /^(?:(?:set|change)\s+)?(?:the\s+)?(?:color(?:\s+of)?|make|paint)\s+(?:(?:it|this|that|selected)\s+)?(.+?)?\s*(?:to\s+)?(\w+)$/
  );
  if (colorMatch) {
    const lastWord = colorMatch[2]?.toLowerCase();
    if (lastWord && COLOR_MAP[lastWord]) {
      const target = colorMatch[1]?.trim() || null;
      // If target is a color name itself (e.g., "color blue"), treat as no target
      if (target && COLOR_MAP[target.toLowerCase()]) {
        return { action: 'set-color', target: null, color: COLOR_MAP[target.toLowerCase()] };
      }
      return { action: 'set-color', target, color: COLOR_MAP[lastWord] };
    }
  }

  // ── Add row ──
  // "add row first name", "add field email"
  const rowMatch = text.match(/^add\s+(?:a\s+)?(?:row|field|column)\s+(.+)$/);
  if (rowMatch) {
    return { action: 'add-row', text: rowMatch[1].trim() };
  }

  // ── Duplicate ──
  // "duplicate Account", "copy foo"
  const dupMatch = text.match(/^(?:duplicate|copy|clone)\s+(.+)$/);
  if (dupMatch) {
    return { action: 'duplicate', target: dupMatch[1].trim() };
  }

  // ── Set property ──
  // "set label of Account to New Name", "set font size to 16"
  const propMatch = text.match(/^set\s+(.+?)\s+(?:of\s+(.+?)\s+)?to\s+(.+)$/);
  if (propMatch) {
    return { action: 'set-property', property: propMatch[1].trim(), target: propMatch[2]?.trim() || null, value: propMatch[3].trim() };
  }

  return { action: 'unknown', raw };
}

// ─── Speech Recognition Hook ─────────────────────────────────────────
export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<VoiceLogEntry[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const logIdRef = useRef(0);
  const onCommandRef = useRef<((cmd: VoiceCommand, raw: string) => boolean) | null>(null);
  const restartingRef = useRef(false);

  // Check support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const addLogEntry = useCallback((transcript: string, command: VoiceCommand, success: boolean) => {
    setLog((prev) => [
      { id: ++logIdRef.current, timestamp: Date.now(), transcript, command, success },
      ...prev,
    ].slice(0, 50)); // Keep last 50 entries
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      restartingRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          if (transcript) {
            const command = parseVoiceCommand(transcript);
            const success = onCommandRef.current ? onCommandRef.current(command, transcript) : false;
            addLogEntry(transcript, command, success);
          }
          setInterimTranscript('');
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if we should still be listening (browser stops after silence)
      if (restartingRef.current) return;
      if (isListening || recognitionRef.current === recognition) {
        try {
          restartingRef.current = true;
          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    };

    try {
      recognition.start();
    } catch (err) {
      setError('Failed to start voice recognition');
    }
  }, [addLogEntry, isListening]);

  const stop = useCallback(() => {
    restartingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const setOnCommand = useCallback((handler: (cmd: VoiceCommand, raw: string) => boolean) => {
    onCommandRef.current = handler;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    interimTranscript,
    error,
    log,
    start,
    stop,
    setOnCommand,
    clearLog: useCallback(() => setLog([]), []),
  };
}
