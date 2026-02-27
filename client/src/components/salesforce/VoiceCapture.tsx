import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Check, Edit3 } from 'lucide-react';

interface VoiceCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  initialText?: string;
}

export default function VoiceCapture({
  isOpen,
  onClose,
  onSubmit,
  initialText = '',
}: VoiceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [capturedText, setCapturedText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Simulate recording animation
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 3);
    }, 600);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Simulate voice capture after "recording"
  useEffect(() => {
    if (!isRecording) return;
    const timeout = setTimeout(() => {
      setCapturedText(
        'I want to build a new customer segment for high-value enterprise accounts on the West Coast'
      );
      setIsRecording(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [isRecording]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (capturedText.trim()) {
      onSubmit(capturedText.trim());
      setCapturedText('');
      setIsRecording(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="sf-voice-overlay" onClick={onClose}>
      <div className="sf-voice-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sf-voice-header">
          <span className="text-sm font-semibold text-slds-neutral-base">
            Voice Input
          </span>
          <button
            onClick={onClose}
            className="sf-voice-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="sf-voice-body">
          {/* Recording visualizer */}
          <div className="sf-voice-visualizer">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`sf-voice-record-btn ${isRecording ? 'recording' : ''}`}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            {isRecording && (
              <div className="sf-voice-waves">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="sf-voice-wave-bar"
                    style={{
                      height: `${20 + Math.sin((pulsePhase + i) * 1.2) * 16}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-slds-neutral-7 mt-3">
              {isRecording
                ? 'Listening… tap to stop'
                : capturedText
                ? 'Recording complete'
                : 'Tap to start recording'}
            </p>
          </div>

          {/* Captured text area */}
          {capturedText && (
            <div className="sf-voice-result">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slds-neutral-7 uppercase tracking-wide">
                  Captured Text
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="sf-voice-edit-btn"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={capturedText}
                  onChange={(e) => setCapturedText(e.target.value)}
                  className="sf-voice-textarea"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-slds-neutral-base leading-relaxed">
                  {capturedText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {capturedText && (
          <div className="sf-voice-footer">
            <button onClick={onClose} className="sf-voice-cancel-btn">
              Cancel
            </button>
            <button onClick={handleSubmit} className="sf-voice-submit-btn">
              <Check className="w-3.5 h-3.5" />
              <span>Use This Text</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
