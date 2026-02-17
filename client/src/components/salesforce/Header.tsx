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
}: HeaderProps) {
  const timelineData = timelines.find((t) => t.id === currentTimeline);

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
        <button className="sf-icon-btn" title="Setup" onClick={onSetup}>
          <Settings className="w-[18px] h-[18px]" />
        </button>

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
