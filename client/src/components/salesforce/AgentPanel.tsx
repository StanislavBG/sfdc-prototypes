import { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  MessageSquare,
  Pin,
  Send,
  Sparkles,
} from 'lucide-react';

const suggestedPrompts = [
  'Create a new market segment.',
  'Filter the market segment list.',
  'Export the market segment data.',
];

interface AgentPanelProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function AgentPanel({ isMinimized, onToggleMinimize }: AgentPanelProps) {
  const [inputValue, setInputValue] = useState('');

  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="sf-agent-collapsed"
        title="Expand Agentforce"
      >
        <ChevronRight className="w-4 h-4 text-[var(--sf-text-tertiary)]" />
      </button>
    );
  }

  return (
    <div className="sf-agent-panel">
      {/* Collapse handle */}
      <button
        onClick={onToggleMinimize}
        className="sf-agent-collapse-btn"
        title="Collapse panel"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Header */}
      <div className="sf-agent-header">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0176D3]" />
          <button className="flex items-center gap-1 text-sm font-semibold text-[var(--sf-text-primary)] hover:text-[var(--sf-blue)]">
            Search Agent
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="sf-agent-icon-btn" title="Info">
            <Info className="w-4 h-4" />
          </button>
          <button className="sf-agent-icon-btn" title="New conversation">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="sf-agent-icon-btn" title="Pin panel">
            <Pin className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body — scrollable middle area */}
      <div className="sf-agent-body">
        {/* Astro illustration */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="sf-agent-astro">
            {/* Stylised Astro mascot placeholder */}
            <svg viewBox="0 0 120 120" className="w-[100px] h-[100px]">
              {/* Background circle with mountains */}
              <circle cx="60" cy="60" r="58" fill="url(#astroGrad)" />
              {/* Mountains */}
              <polygon points="10,90 35,50 60,90" fill="#6B5CE7" opacity="0.6" />
              <polygon points="40,90 70,40 100,90" fill="#8B7CF7" opacity="0.5" />
              <polygon points="70,90 95,55 120,90" fill="#6B5CE7" opacity="0.4" />
              {/* Astro body */}
              <ellipse cx="60" cy="72" rx="18" ry="20" fill="white" />
              {/* Astro head */}
              <circle cx="60" cy="48" r="16" fill="white" />
              {/* Visor / sunglasses */}
              <rect x="46" y="43" width="28" height="8" rx="4" fill="#032D60" />
              {/* Smile */}
              <path d="M52 55 Q60 62 68 55" stroke="#032D60" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Salesforce cloud on chest */}
              <path d="M54 68 Q54 64 58 64 Q58 62 61 62 Q64 62 64 64 Q66 64 66 67 Q66 69 63 69 L56 69 Q54 69 54 68Z" fill="#0176D3" />
              {/* Arms */}
              <path d="M42 70 Q36 62 40 56" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M78 70 Q84 62 80 56" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Stars */}
              <circle cx="25" cy="30" r="2" fill="white" opacity="0.8" />
              <circle cx="95" cy="25" r="1.5" fill="white" opacity="0.6" />
              <circle cx="88" cy="38" r="1" fill="white" opacity="0.5" />
              <defs>
                <radialGradient id="astroGrad" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="#9B8BF4" />
                  <stop offset="100%" stopColor="#6B5CE7" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Welcome text */}
        <div className="text-center px-4 pb-5">
          <h3 className="text-base font-semibold text-[var(--sf-text-primary)] mb-1">
            Let's chat!
          </h3>
          <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed">
            I'm your Agentforce AI assistant. I can help you search records, create segments,
            analyze data, and more.
          </p>
        </div>

        {/* Suggested prompts */}
        <div className="px-4 pb-4 space-y-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              className="sf-agent-prompt-card"
              onClick={() => setInputValue(prompt)}
            >
              <span className="text-xs text-[var(--sf-text-secondary)] leading-snug flex-1 text-left">
                {prompt}
              </span>
              <Send className="w-3.5 h-3.5 text-[var(--sf-blue)] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Footer — input area */}
      <div className="sf-agent-footer">
        <div className="relative">
          <input
            type="text"
            placeholder="Describe your task or ask a question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="sf-agent-input"
          />
          <button
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center transition-colors ${
              inputValue
                ? 'bg-[var(--sf-blue)] text-white'
                : 'text-[var(--sf-text-tertiary)]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
