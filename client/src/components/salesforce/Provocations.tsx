import { useState, useMemo } from 'react';
import {
  PenTool,
  FileText,
  AppWindow,
  Camera,
  BookOpen,
  Image,
  UserCircle,
  Video,
  Sparkles,
  Mic,
  Edit3,
  Copy,
  Download,
  ChevronRight,
  Check,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentType {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  stepCount: number;
  steps: string[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const documentTypes: DocumentType[] = [
  {
    id: 'write-prompt',
    label: 'Write a Prompt',
    icon: PenTool,
    description: 'Craft an effective AI prompt with clear instructions and context',
    stepCount: 1,
    steps: ['Write your prompt'],
  },
  {
    id: 'product-requirement',
    label: 'Product Requirement',
    icon: FileText,
    description: 'Define product requirements and specifications',
    stepCount: 3,
    steps: ['Define scope', 'Detail requirements', 'Review & finalize'],
  },
  {
    id: 'new-application',
    label: 'New Application',
    icon: AppWindow,
    description: 'Outline a new application concept and architecture',
    stepCount: 4,
    steps: ['Concept', 'Architecture', 'Features', 'Review'],
  },
  {
    id: 'screen-capture',
    label: 'Screen Capture',
    icon: Camera,
    description: 'Annotate and describe screen captures',
    stepCount: 2,
    steps: ['Capture', 'Annotate'],
  },
  {
    id: 'research-paper',
    label: 'Research Paper',
    icon: BookOpen,
    description: 'Structure and draft a research paper',
    stepCount: 4,
    steps: ['Abstract', 'Literature review', 'Methodology', 'Conclusion'],
  },
  {
    id: 'infographic-description',
    label: 'Infographic Description',
    icon: Image,
    description: 'Describe visuals and data for infographic creation',
    stepCount: 2,
    steps: ['Data & narrative', 'Visual layout'],
  },
  {
    id: 'persona-agent',
    label: 'Persona/Agent',
    icon: UserCircle,
    description: 'Design a persona or AI agent character',
    stepCount: 3,
    steps: ['Identity', 'Behavior', 'Review'],
  },
  {
    id: 'ai-video-host',
    label: 'AI Video Host',
    icon: Video,
    description: 'Script and configure an AI video presenter',
    stepCount: 3,
    steps: ['Script', 'Personality', 'Review'],
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: Sparkles,
    description: 'Create a custom document from scratch',
    stepCount: 1,
    steps: ['Create'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function readingTime(words: number): string {
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Provocations() {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const words = useMemo(() => wordCount(content), [content]);

  // Reset to type selection
  const handleBack = () => {
    setSelectedType(null);
    setCurrentStep(0);
    setContent('');
  };

  // Copy text only (no images/base64)
  const handleCopy = async () => {
    const textOnly = content.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, '').trim();
    await navigator.clipboard.writeText(textOnly);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as .txt
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType?.label || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Type selection view ----
  if (!selectedType) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#9B8BF4] to-[#6B5CE7] flex items-center justify-center">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--sf-text-primary)]">
              Provocations
            </h1>
            <p className="text-xs text-[var(--sf-text-tertiary)]">
              Choose a document objective to get started
            </p>
          </div>
        </div>

        {/* Document type chips */}
        <div className="flex flex-wrap gap-2">
          {documentTypes.map((dt) => {
            const Icon = dt.icon;
            return (
              <button
                key={dt.id}
                onClick={() => {
                  setSelectedType(dt);
                  setCurrentStep(0);
                  setContent('');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--sf-border)] bg-white hover:border-[var(--sf-blue)] hover:bg-[#EEF4FF] transition-all group"
              >
                <Icon className="w-4 h-4 text-[var(--sf-text-tertiary)] group-hover:text-[var(--sf-blue)] transition-colors" />
                <span className="text-sm font-medium text-[var(--sf-text-primary)] group-hover:text-[var(--sf-blue)] transition-colors">
                  {dt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Description cards */}
        <div className="grid grid-cols-3 gap-4">
          {documentTypes.map((dt) => {
            const Icon = dt.icon;
            return (
              <button
                key={dt.id}
                onClick={() => {
                  setSelectedType(dt);
                  setCurrentStep(0);
                  setContent('');
                }}
                className="sf-card p-4 text-left hover:border-[var(--sf-blue)] hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-[var(--sf-text-tertiary)] group-hover:text-[var(--sf-blue)]" />
                  <span className="text-sm font-semibold text-[var(--sf-text-primary)]">
                    {dt.label}
                  </span>
                </div>
                <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed">
                  {dt.description}
                </p>
                <div className="mt-3 text-xs text-[var(--sf-text-tertiary)]">
                  {dt.stepCount} step{dt.stepCount !== 1 ? 's' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- Single-page editor view (after type selection) ----
  const TypeIcon = selectedType.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: breadcrumb + step counter */}
      <div className="px-6 py-3 border-b border-[var(--sf-border-light)] bg-white flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={handleBack}
            className="text-[var(--sf-link)] hover:underline font-medium"
          >
            Provocations
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
          <span className="text-[var(--sf-text-primary)] font-semibold flex items-center gap-1.5">
            <TypeIcon className="w-4 h-4" />
            {selectedType.label}
          </span>
        </div>

        {/* Step counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {selectedType.steps.map((stepLabel, i) => {
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;
              return (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <div
                      className={`w-6 h-px ${
                        isCompleted
                          ? 'bg-[var(--sf-blue)]'
                          : 'bg-[var(--sf-border)]'
                      }`}
                    />
                  )}
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--sf-blue)] text-white'
                        : isCompleted
                          ? 'bg-[#EEF4FF] text-[var(--sf-blue)]'
                          : 'bg-[#F3F3F3] text-[var(--sf-text-tertiary)]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                    <span className="hidden sm:inline">{stepLabel}</span>
                  </button>
                </div>
              );
            })}
          </div>
          <span className="text-xs text-[var(--sf-text-tertiary)] border-l border-[var(--sf-border)] pl-3">
            Step {currentStep + 1} of {selectedType.stepCount}
          </span>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* Step heading */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--sf-text-primary)]">
              {selectedType.steps[currentStep]}
            </h2>
            <p className="text-xs text-[var(--sf-text-tertiary)] mt-1">
              {selectedType.description}
            </p>
          </div>

          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Start writing your ${selectedType.label.toLowerCase()}...`}
            className="w-full min-h-[400px] p-4 text-sm text-[var(--sf-text-primary)] leading-relaxed bg-white border border-[var(--sf-border)] rounded-lg focus:border-[var(--sf-blue)] focus:ring-1 focus:ring-[var(--sf-blue)] outline-none resize-y placeholder:text-[var(--sf-text-tertiary)]"
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="px-6 py-2.5 border-t border-[var(--sf-border-light)] bg-white flex items-center justify-between">
        {/* Left: document stats */}
        <div className="flex items-center gap-4 text-xs text-[var(--sf-text-tertiary)]">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span className="font-medium">{selectedType.label}</span>
          </span>
          <span>{words} word{words !== 1 ? 's' : ''}</span>
          <span>{readingTime(words)}</span>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1">
          <button
            className="p-2 rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-primary)] transition-colors"
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-primary)] transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className={`p-2 rounded transition-colors ${
              copied
                ? 'bg-[#EEF4FF] text-[var(--sf-blue)]'
                : 'hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-primary)]'
            }`}
            title="Copy document (text only)"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-primary)] transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
