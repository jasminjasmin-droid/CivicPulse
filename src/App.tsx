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
  const { activeTab, isAuthenticated, isAuthLoading, apiUser } = useApp();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState<boolean>(false);

  // Splash Screen Display
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Session verification loading
  if (isAuthLoading) {
    return (
      <DeviceFrame>
        <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-slate-500">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Validating CivicPulse Authentication...
          </p>
        </div>
      </DeviceFrame>
    );
  }

  // Authentication Guard
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const renderActiveScreen = () => {
    // RBAC Protection: Citizen cannot view staff/admin tabs
    const isCitizen = apiUser?.role === 'citizen';

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
        return isCitizen ? <HomeScreen /> : <AuthorityDashboardScreen />;
      case 'analytics':
        return isCitizen ? <HomeScreen /> : <AnalyticsDashboardScreen />;
      case 'super_admin':
        return isCitizen ? <HomeScreen /> : <SuperAdminScreen />;
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
