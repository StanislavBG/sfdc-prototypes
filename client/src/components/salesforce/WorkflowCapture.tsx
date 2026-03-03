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
  const [pulsePhase, setPulsePhase] = useState(0);
  const recognitionRef = useRef<any>(null);

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

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

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

  const handleNoteChange = (value: string) => {
    setCurrentNote(value);
    if (selectedStepId) {
      updateStepNote(selectedStepId, value);
    }
  };

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

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: simulate
      if (isRecording) {
        setIsRecording(false);
        return;
      }
      setIsRecording(true);
      setTimeout(() => {
        const simulated = 'User navigates to the main dashboard and checks the data streams status.';
        if (selectedStepId) {
          const existing = currentNote ? currentNote + ' ' : '';
          handleNoteChange(existing + simulated);
        }
        setIsRecording(false);
      }, 2500);
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (selectedStepId) {
        const existing = currentNote ? currentNote + ' ' : '';
        handleNoteChange(existing + transcript);
      }
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

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
