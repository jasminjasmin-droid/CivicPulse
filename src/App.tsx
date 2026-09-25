import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DeviceFrame } from './components/common/DeviceFrame';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { RoleSwitcher } from './components/common/RoleSwitcher';
import { DemoSpeedControls } from './components/common/DemoSpeedControls';
import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ReportIssueScreen } from './screens/ReportIssueScreen';
import { TrackScreen } from './screens/TrackScreen';
import { AiAssistantScreen } from './screens/AiAssistantScreen';
import { NearbyIssuesMapScreen } from './screens/NearbyIssuesMapScreen';
import { EmergencyServicesScreen } from './screens/EmergencyServicesScreen';
import { TrustIndexScreen } from './screens/TrustIndexScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AuthorityDashboardScreen } from './screens/authority/AuthorityDashboardScreen';
import { AnalyticsDashboardScreen } from './screens/authority/AnalyticsDashboardScreen';
import { SuperAdminScreen } from './screens/authority/SuperAdminScreen';

const MainAppContent: React.FC = () => {
  const { activeTab, isAuthenticated } = useApp();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState<boolean>(false);

  // Splash Screen Display
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Authentication Guard
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'report':
        return <ReportIssueScreen />;
      case 'track':
        return <TrackScreen />;
      case 'ai':
        return <AiAssistantScreen />;
      case 'nearby':
        return <NearbyIssuesMapScreen />;
      case 'emergency':
        return <EmergencyServicesScreen />;
      case 'trust':
      case 'leaderboard':
        return <TrustIndexScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'authority_dash':
        return <AuthorityDashboardScreen />;
      case 'analytics':
        return <AnalyticsDashboardScreen />;
      case 'super_admin':
        return <SuperAdminScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <DeviceFrame>
      <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Government Official Header */}
        <Header onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)} />

        {/* Demo Fast Mode & Quick Escalation Ticker */}
        <DemoSpeedControls />

        {/* Main Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto">
          {renderActiveScreen()}
        </main>

        {/* MD3 Bottom Navigation */}
        <BottomNav />

        {/* 10-Role RBAC Switcher Modal */}
        <RoleSwitcher
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
        />
      </div>
    </DeviceFrame>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;
