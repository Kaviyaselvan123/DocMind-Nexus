import React, { useState, useEffect } from 'react';
import { UserRole, DocumentDetail } from './types';
import { EnterpriseSidebar } from './components/EnterpriseSidebar';
import { Navbar } from './components/Navbar';
import { AgentMarginChat } from './components/AgentMarginChat';
import { DocumentLibrary } from './components/DocumentLibrary';
import { AuditDashboard } from './components/AuditDashboard';
import { CompliancePanel } from './components/CompliancePanel';
import { DocumentInspectorDrawer } from './components/DocumentInspectorDrawer';
import { UploadModal } from './components/UploadModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'chat' | 'documents' | 'audit' | 'compliance'>('chat');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [complianceCount, setComplianceCount] = useState<number>(0);

  // Document & Telemetry Inspector Drawer State
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [activeInspectorDoc, setActiveInspectorDoc] = useState<DocumentDetail | null>(null);
  const [activeInspectorPayload, setActiveInspectorPayload] = useState<any>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Sync dark mode class with root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchComplianceBadge = async () => {
    try {
      const res = await fetch('/api/audit/compliance/scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setComplianceCount(data.flagged_issues_count || 0);
      }
    } catch (e) {
      // Backend may be starting up
    }
  };

  useEffect(() => {
    fetchComplianceBadge();
  }, []);

  const handleOpenInspector = async (docId: string, rawPayload?: any) => {
    try {
      if (docId) {
        const res = await fetch(`/api/documents/${docId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveInspectorDoc(data);
        }
      } else {
        setActiveInspectorDoc(null);
      }
      setActiveInspectorPayload(rawPayload || null);
      setInspectorOpen(true);
    } catch (e) {
      console.error('Failed to open inspector', e);
    }
  };

  const handleStartNewSession = () => {
    setCurrentTab('chat');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden enterprise-grid bg-[var(--app-bg)] text-[var(--app-text)] font-sans antialiased select-none">
      
      {/* Left Collapsible Enterprise Navigation Rail */}
      <EnterpriseSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        complianceCount={complianceCount}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onNewChat={handleStartNewSession}
      />

      {/* Center Main Stage */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          currentUserRole={currentUserRole}
          setCurrentUserRole={setCurrentUserRole}
          complianceCount={complianceCount}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {currentTab === 'chat' && (
            <AgentMarginChat
              currentUserRole={currentUserRole}
              onOpenArtifact={(docId, payload) => handleOpenInspector(docId, payload)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentLibrary
              currentUserRole={currentUserRole}
              onOpenDocArtifact={(docId) => handleOpenInspector(docId)}
            />
          )}

          {currentTab === 'audit' && (
            <AuditDashboard
              onInspectPayload={(payload) => handleOpenInspector('', payload)}
            />
          )}

          {currentTab === 'compliance' && (
            <CompliancePanel
              onSelectDoc={(docId) => handleOpenInspector(docId)}
              onRefreshBadge={fetchComplianceBadge}
            />
          )}
        </main>

      </div>

      {/* Right Side: Enterprise Document & Telemetry Inspector Drawer */}
      <DocumentInspectorDrawer
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        document={activeInspectorDoc}
        rawPayload={activeInspectorPayload}
      />

      {/* Quick Ingest Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setIsUploadOpen(false);
          fetchComplianceBadge();
        }}
        currentUserRole={currentUserRole}
      />

    </div>
  );
};

export default App;
