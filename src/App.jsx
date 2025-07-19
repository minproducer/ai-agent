import React, { useState } from 'react';
import { MessageCircle, Image, FolderOpen } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import SavedData, { ChatProvider } from './components/SavedData';
import AuthButton from './components/AuthButton';
import { usePuter } from './hooks/usePuter';
import { ThemeProvider, ThemeToggle, useTheme, themeClasses } from './components/ThemeContext';

// App content component (inside ThemeProvider)
const AppContent = () => {
  const { user, signIn, signOut, isLoading } = usePuter();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', label: 'Chat AI', icon: MessageCircle, component: ChatInterface },
    { id: 'images', label: 'Tạo Ảnh', icon: Image, component: ImageGenerator },
    { id: 'saved', label: 'Đã Lưu', icon: FolderOpen, component: SavedData }
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.gradient.primary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className={`${themeClasses.text.secondary}`}>Đang khởi tạo Puter AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${themeClasses.gradient.primary} flex items-center justify-center p-4`}>
        <div className={`${themeClasses.card} rounded-2xl shadow-2xl p-8 max-w-md w-full`}>
          {/* Theme Toggle */}
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          
          <div className="text-center mb-8">
            <div className={`w-20 h-20 ${themeClasses.gradient.header} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <MessageCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${themeClasses.text.primary} mb-2`}>Puter AI Assistant</h1>
            <p className={`${themeClasses.text.secondary} mb-4`}>Trí tuệ nhân tạo với lưu trữ cloud miễn phí</p>
            
            {/* Features Preview */}
            <div className={`text-left ${themeClasses.bg.secondary} p-4 rounded-lg mb-6`}>
              <h3 className={`font-semibold ${themeClasses.text.primary} mb-2`}>Tính năng:</h3>
              <ul className={`text-sm ${themeClasses.text.secondary} space-y-1`}>
                <li>✨ 25+ AI models (GPT-4, Claude, Gemini, Llama...)</li>
                <li>💾 Tự động lưu lịch sử chat</li>
                <li>🎨 Tạo ảnh với DALL-E 3</li>
                <li>📁 Upload & phân tích files (PDF, DOC, IMG...)</li>
                <li>🌙 Dark/Light theme</li>
                <li>☁️ Đồng bộ dữ liệu qua cloud</li>
                <li>🆓 Hoàn toàn miễn phí</li>
              </ul>
            </div>
          </div>
          <AuthButton onSignIn={signIn} />
        </div>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className={`min-h-screen ${themeClasses.bg.secondary}`}>
      {/* Header */}
      <header className={`${themeClasses.bg.primary} shadow-lg border-b ${themeClasses.border.primary}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${themeClasses.gradient.header} rounded-full flex items-center justify-center`}>
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${themeClasses.text.primary}`}>Puter AI Assistant</h1>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>25+ AI Models • Auto-save • Dark Mode • Free Forever</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="text-right">
                <span className={`text-sm ${themeClasses.text.secondary}`}>Xin chào, {user.username || 'User'}</span>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>Puter Cloud Account</p>
              </div>
              <AuthButton onSignOut={signOut} isSignedIn />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className={`flex space-x-1 ${themeClasses.bg.tertiary} rounded-xl p-1 mb-6`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition duration-200 ${
                  activeTab === tab.id 
                    ? `${themeClasses.bg.primary} ${themeClasses.text.accent} shadow-md transform scale-105` 
                    : `${themeClasses.text.secondary} ${themeClasses.interactive.hover}`
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.id === 'chat' && (
                  <span className={`${themeClasses.bg.accent} ${themeClasses.text.accent} text-xs px-2 py-1 rounded-full`}>
                    25+ Models
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {ActiveComponent && <ActiveComponent />}
        </div>

        {/* Footer */}
        <footer className={`mt-12 text-center ${themeClasses.text.tertiary} text-sm`}>
          <p>Powered by <a href="https://puter.com" target="_blank" rel="noopener noreferrer" className={`${themeClasses.text.accent} hover:underline`}>Puter.js</a> • User Pays Model • Privacy First</p>
          <p className="mt-1">No API keys required • Infinitely scalable • Open source</p>
        </footer>
      </main>
    </div>
  );
};

// Main App component
function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;