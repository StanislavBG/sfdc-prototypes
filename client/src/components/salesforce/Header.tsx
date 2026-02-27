import { useState, useRef, useEffect } from 'react';
import {
  Clock,
  ChevronDown,
  Star,
  Bell,
  CircleHelp,
  Settings,
  Smile,
  Pencil,
  Grid3X3,
  X,
  ExternalLink,
  Zap,
  Download,
  Clipboard,
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
}

// Salesforce cloud logo SVG
function SalesforceLogo() {
  return (
    <svg viewBox="0 0 48 32" className="h-7 w-10" fill="white">
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
}: HeaderProps) {
  const timelineData = timelines.find((t) => t.id === currentTimeline);
  const [setupMenuOpen, setSetupMenuOpen] = useState(false);
  const setupMenuRef = useRef<HTMLDivElement>(null);
  const [figmaMenuOpen, setFigmaMenuOpen] = useState(false);
  const figmaMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!setupMenuOpen && !figmaMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (setupMenuOpen && setupMenuRef.current && !setupMenuRef.current.contains(e.target as Node)) {
        setSetupMenuOpen(false);
      }
      if (figmaMenuOpen && figmaMenuRef.current && !figmaMenuRef.current.contains(e.target as Node)) {
        setFigmaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setupMenuOpen, figmaMenuOpen]);

  return (
    <div className="sf-header-row1 flex items-center px-4">
      {/* Left: App Launcher + Time Machine trigger + Logo + App Name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="sf-icon-btn"
          onClick={onOpenAppLauncher}
          title="App Launcher"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        <button
          className="sf-icon-btn"
          onClick={onOpenTimeMachine}
          title="Time Machine"
        >
          <Clock className="w-5 h-5" />
        </button>
        <SalesforceLogo />
        <div className="w-px h-5 bg-white/20 mx-1" />
        <span className="text-white text-sm font-semibold whitespace-nowrap">
          {appName}
        </span>
        <button
          onClick={onOpenTimeMachine}
          className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 transition-colors"
        >
          {timelineData?.label || 'Today'}
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Center: Search (pushed to center with flex) */}
      <div className="flex-1 flex justify-center">
        <GlobalSearch onSelectResult={onSelectSearchResult} />
      </div>

      {/* Right: Utility icons */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button className="sf-icon-btn" title="Agentforce">
          <Smile className="w-[18px] h-[18px]" />
        </button>
        <button className="sf-icon-btn" title="Favorites">
          <Star className="w-[18px] h-[18px]" />
        </button>
        <button className="sf-icon-btn" title="Notifications">
          <Bell className="w-[18px] h-[18px]" />
        </button>
        <button className="sf-icon-btn" title="Help">
          <CircleHelp className="w-[18px] h-[18px]" />
        </button>

        {/* Figma export dropdown */}
        <div className="relative" ref={figmaMenuRef}>
          <button
            className="sf-icon-btn"
            title="Export to Figma"
            onClick={() => setFigmaMenuOpen(!figmaMenuOpen)}
          >
            <svg viewBox="0 0 38 57" className="w-[14px] h-[18px]" fill="currentColor">
              <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
              <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" />
              <path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" />
              <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
              <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
            </svg>
          </button>

          {figmaMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-[260px] bg-white rounded-lg shadow-xl border border-slds-border-1 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slds-border-1">
                <span className="text-sm font-semibold text-slds-neutral-base">Export to Figma</span>
                <button
                  onClick={() => setFigmaMenuOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slds-neutral-2 text-slds-neutral-7"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setFigmaMenuOpen(false); onExportSvg?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slds-neutral-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-slds-neutral-7" />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-slds-neutral-base block">Download as SVG</span>
                    <span className="text-[10px] text-slds-neutral-7">Editable vectors in Figma</span>
                  </div>
                </button>
                <button
                  onClick={() => { setFigmaMenuOpen(false); onExportHtml?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slds-neutral-2 transition-colors"
                >
                  <Clipboard className="w-4 h-4 text-slds-neutral-7" />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-slds-neutral-base block">Copy HTML for Figma Plugin</span>
                    <span className="text-[10px] text-slds-neutral-7">Paste into html.to.design</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Setup gear with dropdown */}
        <div className="relative" ref={setupMenuRef}>
          <button
            className="sf-icon-btn"
            title="Setup"
            onClick={() => setSetupMenuOpen(!setupMenuOpen)}
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          {setupMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-[280px] bg-white rounded-lg shadow-xl border border-slds-border-1 z-50">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slds-border-1">
                <span className="text-sm font-semibold text-slds-neutral-base">Setup Menu</span>
                <button
                  onClick={() => setSetupMenuOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slds-neutral-2 text-slds-neutral-7"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setSetupMenuOpen(false);
                    onOpenDataCloudSetup?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slds-neutral-2 transition-colors border-2 border-transparent hover:border-slds-brand rounded-lg mx-0"
                >
                  <div className="w-8 h-8 rounded bg-[#5A3E9E] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slds-neutral-base flex-1 text-left">Data Cloud Setup</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slds-neutral-7" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <button
          className="w-7 h-7 rounded-full bg-[#FF8C00] flex items-center justify-center text-white text-xs font-bold ml-1 flex-shrink-0"
          title="User"
        >
          U
        </button>

        <button className="sf-icon-btn" title="Edit Page">
          <Pencil className="w-[16px] h-[16px]" />
        </button>
      </div>
    </div>
  );
}
