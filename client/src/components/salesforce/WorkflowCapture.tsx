import { useState, useRef, useCallback, useEffect } from 'react';
import { toSvg } from 'html-to-image';
import JSZip from 'jszip';
import {
  Camera,
  X,
  Download,
  Trash2,
  Mic,
  MicOff,
  StickyNote,
  ChevronUp,
  ChevronDown,
  Image,
  FileText,
  MessageSquare,
  Square,
  CircleStop,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CaptureStep {
  id: string;
  svgDataUrl: string;
  note: string;
  timestamp: number;
  label: string; // auto-generated: "Step 1", "Step 2", etc.
}

interface WorkflowCaptureProps {
  /** Whether the capture mode is active */
  active: boolean;
  /** Callback to deactivate capture mode */
  onDeactivate: () => void;
  /** Ref to the element to capture (typically the <main> content area) */
  captureTargetRef: React.RefObject<HTMLElement | null>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkflowCapture({
  active,
  onDeactivate,
  captureTargetRef,
}: WorkflowCaptureProps) {
  const [steps, setSteps] = useState<CaptureStep[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);

  // Notes overlay
  const [notesOpen, setNotesOpen] = useState(true);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const recognitionRef = useRef<any>(null);
  const wantRecordingRef = useRef(false);
  // Refs to avoid stale closures in recognition callbacks
  const currentNoteRef = useRef(currentNote);
  const selectedStepIdRef = useRef(selectedStepId);
  useEffect(() => { currentNoteRef.current = currentNote; }, [currentNote]);
  useEffect(() => { selectedStepIdRef.current = selectedStepId; }, [selectedStepId]);

  // Export
  const [exporting, setExporting] = useState(false);

  // Preview
  const [previewStepId, setPreviewStepId] = useState<string | null>(null);

  // Pulse animation for voice
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setPulsePhase((p) => (p + 1) % 3), 500);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Clean up speech recognition on unmount or deactivation
  useEffect(() => {
    return () => {
      wantRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  // Clear voice error after 5s
  useEffect(() => {
    if (!voiceError) return;
    const t = setTimeout(() => setVoiceError(null), 5000);
    return () => clearTimeout(t);
  }, [voiceError]);

  // ------- Capture -------

  const takeCapture = useCallback(async () => {
    const el = captureTargetRef.current;
    if (!el || capturing) return;

    setCapturing(true);
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 200);

    try {
      const dataUrl = await toSvg(el, {
        backgroundColor: '#F3F3F3',
        cacheBust: true,
      });

      const stepNum = steps.length + 1;
      const newStep: CaptureStep = {
        id: `step-${Date.now()}`,
        svgDataUrl: dataUrl,
        note: '',
        label: `Step ${stepNum}`,
        timestamp: Date.now(),
      };

      setSteps((prev) => [...prev, newStep]);
      setSelectedStepId(newStep.id);
      setCurrentNote('');
    } catch (err) {
      console.error('Capture failed:', err);
    }

    setCapturing(false);
  }, [captureTargetRef, capturing, steps.length]);

  // ------- Notes -------

  const updateStepNote = useCallback((stepId: string, note: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, note } : s))
    );
  }, []);

  const handleNoteChange = useCallback((value: string) => {
    setCurrentNote(value);
    currentNoteRef.current = value;
    if (selectedStepIdRef.current) {
      updateStepNote(selectedStepIdRef.current, value);
    }
  }, [updateStepNote]);

  const selectStep = (stepId: string) => {
    setSelectedStepId(stepId);
    const step = steps.find((s) => s.id === stepId);
    setCurrentNote(step?.note || '');
  };

  const deleteStep = (stepId: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== stepId);
      // Re-label
      return filtered.map((s, i) => ({ ...s, label: `Step ${i + 1}` }));
    });
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
      setCurrentNote('');
    }
  };

  // ------- Voice -------

  const stopVoice = useCallback(() => {
    wantRecordingRef.current = false;
    setIsRecording(false);
    setInterimText('');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Speech recognition not supported in this browser. Use Chrome, Edge, or Safari.');
      return;
    }

    if (!selectedStepIdRef.current) {
      setVoiceError('Select a step first, then use voice to add notes.');
      return;
    }

    // Request mic permission explicitly first
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then((stream) => {
        // Permission granted — stop the stream (we only needed permission, SpeechRecognition manages its own audio)
        stream.getTracks().forEach((t) => t.stop());

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }

          if (finalTranscript && selectedStepIdRef.current) {
            const existing = currentNoteRef.current ? currentNoteRef.current + ' ' : '';
            const newNote = existing + finalTranscript.trim();
            handleNoteChange(newNote);
          }

          setInterimText(interim);
        };

        recognition.onerror = (event: any) => {
          const err = event.error;
          if (err === 'no-speech' || err === 'aborted') return;
          if (err === 'not-allowed') {
            setVoiceError('Microphone access denied. Check browser permissions.');
          } else if (err === 'network') {
            setVoiceError('Speech recognition requires a network connection in this browser.');
          } else {
            setVoiceError(`Voice error: ${err}`);
          }
          stopVoice();
        };

        recognition.onend = () => {
          setInterimText('');
          // Auto-restart if we still want to be recording (browsers stop after silence)
          if (wantRecordingRef.current) {
            try {
              recognition.start();
            } catch {
              stopVoice();
            }
          } else {
            setIsRecording(false);
          }
        };

        recognitionRef.current = recognition;
        wantRecordingRef.current = true;
        setIsRecording(true);
        setVoiceError(null);
        recognition.start();
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setVoiceError('Microphone access denied. Allow microphone in browser settings.');
        } else if (err.name === 'NotFoundError') {
          setVoiceError('No microphone found. Connect a microphone and try again.');
        } else {
          setVoiceError(`Microphone error: ${err.message || err.name}`);
        }
      });
  }, [stopVoice, handleNoteChange]);

  const toggleVoice = useCallback(() => {
    if (isRecording) {
      stopVoice();
    } else {
      startVoice();
    }
  }, [isRecording, stopVoice, startVoice]);

  // ------- Export -------

  const exportWorkflow = useCallback(async () => {
    if (steps.length === 0) return;
    setExporting(true);

    try {
      const zip = new JSZip();

      // Add each SVG
      for (const step of steps) {
        // Extract raw SVG from data URL
        const svgContent = decodeURIComponent(
          step.svgDataUrl.replace('data:image/svg+xml;charset=utf-8,', '')
        );
        zip.file(`${step.label.replace(/\s+/g, '-').toLowerCase()}.svg`, svgContent);
      }

      // Build a summary markdown
      let md = '# Workflow Capture\n\n';
      md += `**Date:** ${new Date().toLocaleDateString()}\n`;
      md += `**Steps:** ${steps.length}\n\n`;
      md += '---\n\n';

      for (const step of steps) {
        md += `## ${step.label}\n\n`;
        md += `**File:** ${step.label.replace(/\s+/g, '-').toLowerCase()}.svg\n\n`;
        if (step.note) {
          md += `**Notes:** ${step.note}\n\n`;
        } else {
          md += `*No notes*\n\n`;
        }
        md += '---\n\n';
      }

      zip.file('workflow-notes.md', md);

      // Build a Figma-importable HTML page with all steps inline
      let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Workflow Capture</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 40px; }
  .step { background: white; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
  .step-header { padding: 16px 24px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
  .step-label { font-size: 18px; font-weight: 600; color: #1a1a1a; }
  .step-note { padding: 16px 24px; font-size: 14px; color: #444; line-height: 1.6; border-bottom: 1px solid #eee; background: #fafafa; }
  .step-note:empty { display: none; }
  .step-image { padding: 16px; }
  .step-image img { width: 100%; border: 1px solid #e5e5e5; border-radius: 8px; }
  h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 8px; }
  .meta { color: #888; font-size: 14px; margin-bottom: 32px; }
</style>
</head><body>
<h1>Workflow Capture</h1>
<p class="meta">${new Date().toLocaleDateString()} &mdash; ${steps.length} step${steps.length !== 1 ? 's' : ''}</p>
`;

      for (const step of steps) {
        html += `<div class="step">
  <div class="step-header"><span class="step-label">${step.label}</span></div>
  ${step.note ? `<div class="step-note">${step.note}</div>` : ''}
  <div class="step-image"><img src="${step.svgDataUrl}" alt="${step.label}" /></div>
</div>\n`;
      }

      html += '</body></html>';
      zip.file('workflow-preview.html', html);

      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflow-capture-${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }

    setExporting(false);
  }, [steps]);

  // ------- Reset -------

  const resetCapture = () => {
    if (steps.length > 0 && !confirm('Discard all captured steps?')) return;
    setSteps([]);
    setSelectedStepId(null);
    setCurrentNote('');
    onDeactivate();
  };

  if (!active) return null;

  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const previewStep = steps.find((s) => s.id === previewStepId);

  return (
    <>
      {/* Flash effect on capture */}
      {flashVisible && (
        <div className="wfc-flash" />
      )}

      {/* ========== Floating capture button — top left ========== */}
      <div className="wfc-capture-bar">
        <div className="wfc-capture-bar-inner">
          {/* Recording indicator */}
          <div className="wfc-rec-dot" />
          <span className="wfc-label">Workflow Capture</span>

          <div className="wfc-divider" />

          {/* Step counter */}
          <span className="wfc-step-count">
            {steps.length} step{steps.length !== 1 ? 's' : ''}
          </span>

          <div className="wfc-divider" />

          {/* Capture button */}
          <button
            onClick={takeCapture}
            disabled={capturing}
            className="wfc-capture-btn"
            title="Capture current screen (Ctrl+Shift+C)"
          >
            <Camera className="w-4 h-4" />
            {capturing ? 'Capturing...' : 'Capture'}
          </button>

          {/* Toggle notes */}
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="wfc-tool-btn"
            title={notesOpen ? 'Hide notes panel' : 'Show notes panel'}
          >
            <StickyNote className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            onClick={exportWorkflow}
            disabled={steps.length === 0 || exporting}
            className="wfc-tool-btn wfc-export-btn"
            title="Export as ZIP (SVGs + notes)"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Stop / close */}
          <button
            onClick={resetCapture}
            className="wfc-tool-btn wfc-stop-btn"
            title="Stop capture"
          >
            <Square className="w-3.5 h-3.5" />
            Done
          </button>
        </div>
      </div>

      {/* ========== Notes overlay — bottom of screen ========== */}
      {notesOpen && (
        <div className="wfc-notes-panel">
          {/* Collapse handle */}
          <div
            className="wfc-notes-handle"
            onClick={() => setNotesOpen(false)}
          >
            <GripVertical className="w-4 h-4" style={{ color: '#999' }} />
            <span className="wfc-notes-title">Spare Notes</span>
            <span className="wfc-notes-subtitle">
              {steps.length} step{steps.length !== 1 ? 's' : ''} captured
            </span>
            <ChevronDown className="w-4 h-4" style={{ color: '#999', marginLeft: 'auto' }} />
          </div>

          <div className="wfc-notes-body">
            {/* Step thumbnails strip */}
            {steps.length > 0 && (
              <div className="wfc-thumbs-strip">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => selectStep(step.id)}
                    className={`wfc-thumb ${selectedStepId === step.id ? 'selected' : ''}`}
                  >
                    <div className="wfc-thumb-img">
                      <img src={step.svgDataUrl} alt={step.label} />
                    </div>
                    <div className="wfc-thumb-footer">
                      <span className="wfc-thumb-label">{step.label}</span>
                      <div className="wfc-thumb-actions">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewStepId(step.id); }}
                          className="wfc-thumb-action"
                          title="Preview"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
                          className="wfc-thumb-action wfc-thumb-delete"
                          title="Delete step"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {step.note && (
                      <div className="wfc-thumb-has-note">
                        <MessageSquare className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Note editor */}
            <div className="wfc-note-editor">
              {selectedStepId ? (
                <>
                  <div className="wfc-note-editor-header">
                    <FileText className="w-4 h-4" style={{ color: '#4285F4' }} />
                    <span className="wfc-note-editor-label">
                      Notes for {selectedStep?.label || 'step'}
                    </span>
                    <button
                      onClick={toggleVoice}
                      className={`wfc-voice-btn ${isRecording ? 'recording' : ''}`}
                      title={isRecording ? 'Stop recording' : 'Voice note'}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span className="wfc-voice-label">Stop</span>
                          <span className="wfc-voice-pulse" />
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span className="wfc-voice-label">Voice</span>
                        </>
                      )}
                    </button>
                  </div>
                  {interimText && (
                    <div className="wfc-interim-text">
                      <Mic className="w-3 h-3" style={{ color: '#EA4335', flexShrink: 0 }} />
                      <span>{interimText}</span>
                    </div>
                  )}
                  {voiceError && (
                    <div className="wfc-voice-error">
                      {voiceError}
                    </div>
                  )}
                  <textarea
                    value={currentNote}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    placeholder="Add annotations for this step... describe the user action, expected behavior, or design feedback"
                    className="wfc-note-textarea"
                    rows={3}
                  />
                </>
              ) : (
                <div className="wfc-note-empty">
                  {steps.length === 0
                    ? 'Capture your first screen to start annotating'
                    : 'Select a step above to add notes'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== Step preview modal ========== */}
      {previewStep && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setPreviewStepId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: '3%', left: '3%', right: '3%', bottom: '3%',
              background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column',
              overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid #e5e5e5',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Image className="w-5 h-5" style={{ color: '#4285F4' }} />
                <span className="slds-text-size_medium slds-font-weight_semibold">
                  {previewStep.label}
                </span>
                {previewStep.note && (
                  <span className="slds-text-size_small slds-text-neutral-7" style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    — {previewStep.note}
                  </span>
                )}
              </div>
              <button onClick={() => setPreviewStepId(null)} className="sf-action-btn">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
              <img
                src={previewStep.svgDataUrl}
                alt={previewStep.label}
                style={{ maxWidth: '100%', maxHeight: '100%', border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcut listener */}
      <KeyboardShortcuts onCapture={takeCapture} active={active} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts sub-component
// ---------------------------------------------------------------------------

function KeyboardShortcuts({
  onCapture,
  active,
}: {
  onCapture: () => void;
  active: boolean;
}) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+C = capture
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        onCapture();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onCapture]);

  return null;
}
