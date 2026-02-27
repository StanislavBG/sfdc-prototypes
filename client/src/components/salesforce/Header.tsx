import { useState, useRef, useEffect } from 'react';
import {
  Clock,
  ChevronDown,
  Settings,
  Smile,
  Pencil,
  Grid3X3,
  X,
  ExternalLink,
  Zap,
  Download,
  Clipboard,
  Diamond,
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { timelines } from './TimeMachine';

interface HeaderProps {
  appName: string;
  currentApp: string;
  currentTimeline: string;
  onOpenTimeMachine: () => void;
  onSelectSearchResult: (id: string) => void;
  onSetup?: () => void;
  onOpenAppLauncher?: () => void;
  onOpenDataCloudSetup?: () => void;
  onExportSvg?: () => void;
  onExportHtml?: () => void;
  onOpenBSChart?: () => void;
}

// Figma logo SVG icon
function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 57" className={className} fill="currentColor">
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" />
      <path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" />
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  );
}

// Salesforce cloud logo SVG
function SalesforceLogo() {
  return (
    <svg viewBox="0 0 48 32" style={{ height: '28px', width: '40px' }} fill="white">
      <path d="M20 4.8c1.9-2 4.5-3.2 7.4-3.2 3.9 0 7.3 2.2 9 5.4 1.4-.6 3-.9 4.6-.9 6.2 0 11.2 5 11.2 11.2S47.2 28.5 41 28.5c-.8 0-1.6-.1-2.4-.2-1.5 2.3-4.1 3.8-7 3.8-1.5 0-2.9-.4-4.1-1.1-1.5 2.7-4.4 4.5-7.7 4.5-3.1 0-5.8-1.6-7.3-4-.9.2-1.8.4-2.7.4-5.8 0-10.5-4.7-10.5-10.5 0-3.8 2-7.2 5.1-9-.5-1.2-.8-2.5-.8-3.9C3.6 3.7 7.3 0 11.9 0c3.2 0 6 1.8 7.4 4.5l.7.3z" />
    </svg>
  );
}

export default function Header({
  appName,
  currentTimeline,
  onOpenTimeMachine,
  onSelectSearchResult,
  onSetup,
  onOpenAppLauncher,
  onOpenDataCloudSetup,
  onExportSvg,
  onExportHtml,
  onOpenBSChart,
}: HeaderProps) {
  const timelineData = timelines.find((t) => t.id === currentTimeline);
  const [setupMenuOpen, setSetupMenuOpen] = useState(false);
  const setupMenuRef = useRef<HTMLDivElement>(null);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!setupMenuOpen && !toolsMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (setupMenuOpen && setupMenuRef.current && !setupMenuRef.current.contains(e.target as Node)) {
        setSetupMenuOpen(false);
      }
      if (toolsMenuOpen && toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setupMenuOpen, toolsMenuOpen]);

  return (
    <div className="sf-header-row1">
      {/* Left: App Launcher + Time Machine trigger + Logo + App Name */}
      <div className="slds-grid slds-grid_vertical-align-center slds-gap_x-small slds-shrink-none">
        <button
          className="sf-icon-btn"
          onClick={onOpenAppLauncher}
          title="App Launcher"
        >
          <Grid3X3 className="slds-square_x-small" />
        </button>
        <button
          className="sf-icon-btn"
          onClick={onOpenTimeMachine}
          title="Time Machine"
        >
          <Clock className="slds-square_x-small" />
        </button>
        <SalesforceLogo />
        <div className="sf-header-divider" />
        <span className="slds-text-white slds-text-size_medium slds-font-weight_semibold slds-nowrap">
          {appName}
        </span>
        <button
          onClick={onOpenTimeMachine}
          className="sf-timeline-badge"
        >
          {timelineData?.label || 'Today'}
          <ChevronDown className="slds-icon-size_xx-small" />
        </button>
      </div>

      {/* Center: Search (pushed to center with flex) */}
      <div className="slds-col slds-grid slds-grid_align-center">
        <GlobalSearch onSelectResult={onSelectSearchResult} />
      </div>

      {/* Right: Utility icons */}
      <div className="slds-grid slds-grid_vertical-align-center slds-gap_xxx-small slds-shrink-none">

        {/* Global tools dropdown (BS Chart + Figma) — replaces Smile/Star/Bell/Help */}
        <div className="slds-pos-relative" ref={toolsMenuRef}>
          <button
            className="sf-icon-btn"
            title="Global Tools"
            onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
          >
            <Smile className="slds-icon-size_medium" />
          </button>

          {toolsMenuOpen && (
            <div className="sf-dropdown" style={{ width: '260px' }}>
              <div className="sf-dropdown-header">
                <span className="slds-text-size_small slds-font-weight_semibold" style={{ color: 'var(--slds-g-color-neutral-base)' }}>Global Tools</span>
                <button
                  onClick={() => setToolsMenuOpen(false)}
                  className="sf-dropdown-close"
                >
                  <X className="slds-icon-size_x-small" />
                </button>
              </div>
              <div className="slds-p-vertical_xx-small">
                {/* BS Chart */}
                <button
                  onClick={() => { setToolsMenuOpen(false); onOpenBSChart?.(); }}
                  className="sf-dropdown-item"
                >
                  <div className="slds-square_large slds-border-radius_medium slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ background: '#F59E0B' }}>
                    <Diamond className="slds-icon-size_small slds-text-white" />
                  </div>
                  <div className="slds-col" style={{ textAlign: 'left' }}>
                    <span className="slds-text-size_small slds-font-weight_medium" style={{ color: 'var(--slds-g-color-neutral-base)', display: 'block' }}>BS Chart</span>
                    <span className="slds-text-size_xx-small" style={{ color: 'var(--slds-g-color-neutral-7)' }}>Create diagrams & flowcharts</span>
                  </div>
                </button>
                {/* Figma export */}
                <button
                  onClick={() => { setToolsMenuOpen(false); onExportSvg?.(); }}
                  className="sf-dropdown-item"
                >
                  <div className="slds-square_large slds-border-radius_medium slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ background: '#1e1e1e' }}>
                    <FigmaIcon className="slds-icon-size_small slds-text-white" />
                  </div>
                  <div className="slds-col" style={{ textAlign: 'left' }}>
                    <span className="slds-text-size_small slds-font-weight_medium" style={{ color: 'var(--slds-g-color-neutral-base)', display: 'block' }}>Export SVG</span>
                    <span className="slds-text-size_xx-small" style={{ color: 'var(--slds-g-color-neutral-7)' }}>Download editable vectors</span>
                  </div>
                </button>
                <button
                  onClick={() => { setToolsMenuOpen(false); onExportHtml?.(); }}
                  className="sf-dropdown-item"
                >
                  <div className="slds-square_large slds-border-radius_medium slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ background: '#1e1e1e' }}>
                    <Clipboard className="slds-icon-size_small slds-text-white" />
                  </div>
                  <div className="slds-col" style={{ textAlign: 'left' }}>
                    <span className="slds-text-size_small slds-font-weight_medium" style={{ color: 'var(--slds-g-color-neutral-base)', display: 'block' }}>Copy HTML for Figma</span>
                    <span className="slds-text-size_xx-small" style={{ color: 'var(--slds-g-color-neutral-7)' }}>Paste into html.to.design</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Setup gear with dropdown */}
        <div className="slds-pos-relative" ref={setupMenuRef}>
          <button
            className="sf-icon-btn"
            title="Setup"
            onClick={() => setSetupMenuOpen(!setupMenuOpen)}
          >
            <Settings className="slds-icon-size_medium" />
          </button>

          {setupMenuOpen && (
            <div className="sf-dropdown" style={{ width: '280px' }}>
              {/* Dropdown header */}
              <div className="sf-dropdown-header">
                <span className="slds-text-size_small slds-font-weight_semibold" style={{ color: 'var(--slds-g-color-neutral-base)' }}>Setup Menu</span>
                <button
                  onClick={() => setSetupMenuOpen(false)}
                  className="sf-dropdown-close"
                >
                  <X className="slds-icon-size_x-small" />
                </button>
              </div>
              {/* Menu items */}
              <div className="slds-p-vertical_xx-small">
                <button
                  onClick={() => {
                    setSetupMenuOpen(false);
                    onOpenDataCloudSetup?.();
                  }}
                  className="sf-dropdown-item sf-dropdown-item-highlight"
                >
                  <div className="slds-square_large slds-border-radius_medium slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ background: '#5A3E9E' }}>
                    <Zap className="slds-icon-size_small slds-text-white" />
                  </div>
                  <span className="slds-text-size_small slds-font-weight_medium slds-col" style={{ color: 'var(--slds-g-color-neutral-base)', textAlign: 'left' }}>Data Cloud Setup</span>
                  <ExternalLink className="slds-icon-size_x-small" style={{ color: 'var(--slds-g-color-neutral-7)' }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <button
          className="sf-user-avatar"
          title="User"
        >
          U
        </button>

        <button className="sf-icon-btn" title="Edit Page">
          <Pencil className="slds-icon-size_small" />
        </button>
      </div>
    </div>
  );
}
