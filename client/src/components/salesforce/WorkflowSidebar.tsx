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
  Lock,
} from 'lucide-react';
import VoiceCapture from './VoiceCapture';
import type { UserPersona } from './OnboardingOverlay';
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

// The first popular use case ("Connect & Unify") is the only actionable one
const ACTIONABLE_WORKFLOW_ID = 'wf-connect-unify';

interface WorkflowSidebarProps {
  activeWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow) => void;
  persona?: UserPersona;
}

export default function WorkflowSidebar({
  activeWorkflow,
  onSelectWorkflow,
  persona = 'new-configure',
}: WorkflowSidebarProps) {
  const [inputText, setInputText] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleVoiceSubmit = (text: string) => {
    setInputText(text);
    setVoiceOpen(false);
  };

  const showForYou = persona === 'frequent' || persona === 'power';

  return (
    <nav className="sf-workflow-sidebar">
      <div className="sf-workflow-sidebar-body">
        {/* Describe Your Task — always visible for all personas */}
        <div className="sf-workflow-input-group">
          <div className="slds-grid slds-grid_vertical-align-center slds-gap_x-small slds-m-bottom_x-small">
            <Sparkles className="slds-icon-size_small" style={{ color: '#9B8BF4' }} />
            <span className="slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">
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
                <Mic className="slds-icon-size_x-small" />
              </button>
              <button
                className="sf-workflow-input-icon"
                title="Edit"
              >
                <Edit3 className="slds-icon-size_x-small" />
              </button>
            </div>
          </div>
        </div>

        {/* For You — only for Frequent and Power users */}
        {showForYou && (
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
                    <Icon className="slds-icon-size_small" />
                  </div>
                  <div className="sf-workflow-item-text">
                    <span className="sf-workflow-item-label">{wf.title}</span>
                    <span className="sf-workflow-item-desc">{wf.description}</span>
                  </div>
                  <ChevronRight className="slds-icon-size_x-small slds-text-neutral-7 slds-flex-shrink-0 sf-chevron-reveal" />
                </button>
              );
            })}
          </div>
        )}

        {/* Popular Use Cases — always visible, but only Connect & Unify is actionable */}
        <div className="sf-workflow-group">
          <div className="sf-workflow-group-header">
            <span className="sf-workflow-group-title">Popular Use Cases</span>
          </div>
          {popularWorkflows.map((wf) => {
            const Icon = workflowIcons[wf.icon] || Sparkles;
            const isActive = activeWorkflow?.id === wf.id;
            const isActionable = wf.id === ACTIONABLE_WORKFLOW_ID;
            return (
              <button
                key={wf.id}
                className={`sf-workflow-item ${isActive ? 'active' : ''} ${!isActionable ? 'sf-workflow-item--coming-soon' : ''}`}
                onClick={() => { if (isActionable) onSelectWorkflow(wf); }}
              >
                <div className="sf-workflow-item-icon">
                  <Icon className="slds-icon-size_small" />
                </div>
                <div className="sf-workflow-item-text">
                  <span className="sf-workflow-item-label">
                    {wf.title}
                    {!isActionable && (
                      <span className="sf-coming-soon-badge">Coming Soon</span>
                    )}
                  </span>
                  <span className="sf-workflow-item-desc">{wf.description}</span>
                </div>
                {isActionable ? (
                  <ChevronRight className="slds-icon-size_x-small slds-text-neutral-7 slds-flex-shrink-0 sf-chevron-reveal" />
                ) : (
                  <Lock className="slds-icon-size_x-small slds-flex-shrink-0" style={{ color: '#C9C7C5' }} />
                )}
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
