import { useState } from 'react';
import {
  Mic,
  Edit3,
  Sparkles,
  Users,
  Fingerprint,
  BarChart3,
  Zap,
  Calculator,
  Database,
  UserSearch,
  ChevronRight,
} from 'lucide-react';
import VoiceCapture from './VoiceCapture';
import {
  currentUser,
  forYouWorkflows,
  popularWorkflows,
  type Workflow,
} from '@/lib/mock-data';

const workflowIcons: Record<string, React.ElementType> = {
  Users,
  Fingerprint,
  BarChart3,
  Zap,
  Calculator,
  Database,
  UserSearch,
};

interface WorkflowSidebarProps {
  activeWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow) => void;
}

export default function WorkflowSidebar({
  activeWorkflow,
  onSelectWorkflow,
}: WorkflowSidebarProps) {
  const [inputText, setInputText] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleVoiceSubmit = (text: string) => {
    setInputText(text);
    setVoiceOpen(false);
  };

  return (
    <nav className="sf-workflow-sidebar">
      <div className="sf-workflow-sidebar-body">
        {/* Question + Input group */}
        <div className="sf-workflow-input-group">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#9B8BF4]" />
            <span className="text-xs font-semibold text-slds-neutral-base">
              What are you working on today?
            </span>
          </div>
          <div className="sf-workflow-input-wrap">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your task…"
              className="sf-workflow-input"
            />
            <div className="sf-workflow-input-actions">
              <button
                onClick={() => setVoiceOpen(true)}
                className="sf-workflow-input-icon"
                title="Voice input"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                className="sf-workflow-input-icon"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* For You group */}
        <div className="sf-workflow-group">
          <div className="sf-workflow-group-header">
            <span className="sf-workflow-group-title">For You</span>
            <span className="sf-workflow-group-subtitle">
              Based on your role as {currentUser.title}
            </span>
          </div>
          {forYouWorkflows.map((wf) => {
            const Icon = workflowIcons[wf.icon] || Sparkles;
            const isActive = activeWorkflow?.id === wf.id;
            return (
              <button
                key={wf.id}
                className={`sf-workflow-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectWorkflow(wf)}
              >
                <div className="sf-workflow-item-icon">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="sf-workflow-item-text">
                  <span className="sf-workflow-item-label">{wf.title}</span>
                  <span className="sf-workflow-item-desc">{wf.description}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slds-neutral-7 flex-shrink-0 opacity-0 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>

        {/* Popular Use Cases group */}
        <div className="sf-workflow-group">
          <div className="sf-workflow-group-header">
            <span className="sf-workflow-group-title">Popular Use Cases</span>
          </div>
          {popularWorkflows.map((wf) => {
            const Icon = workflowIcons[wf.icon] || Sparkles;
            const isActive = activeWorkflow?.id === wf.id;
            return (
              <button
                key={wf.id}
                className={`sf-workflow-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectWorkflow(wf)}
              >
                <div className="sf-workflow-item-icon">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="sf-workflow-item-text">
                  <span className="sf-workflow-item-label">{wf.title}</span>
                  <span className="sf-workflow-item-desc">{wf.description}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slds-neutral-7 flex-shrink-0 opacity-0 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Capture modal */}
      <VoiceCapture
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSubmit={handleVoiceSubmit}
        initialText={inputText}
      />
    </nav>
  );
}
