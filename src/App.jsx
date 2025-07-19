import React, { useState, useEffect } from 'react';
import { MessageCircle, Image, FolderOpen } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import SavedData, { ChatProvider } from './components/SavedData';
import AuthButton from './components/AuthButton';
import { usePuter } from './hooks/usePuter';
import { ThemeProvider, ThemeToggle, useTheme, themeClasses } from './components/ThemeContext';

// Custom hook for managing meta tags
const useMetaTags = (metaData) => {
  useEffect(() => {
    // Update title
    if (metaData.title) {
      document.title = metaData.title;
    }

    // Update meta description
    const updateOrCreateMeta = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Basic SEO meta tags
    if (metaData.description) {
      updateOrCreateMeta('description', metaData.description);
    }
    if (metaData.keywords) {
      updateOrCreateMeta('keywords', metaData.keywords);
    }

    // Open Graph meta tags
    if (metaData.title) {
      updateOrCreateMeta('og:title', metaData.title, true);
    }
    if (metaData.description) {
      updateOrCreateMeta('og:description', metaData.description, true);
    }
    if (metaData.image) {
      updateOrCreateMeta('og:image', metaData.image, true);
    }
    if (metaData.url) {
      updateOrCreateMeta('og:url', metaData.url, true);
    }

    // Twitter meta tags
    if (metaData.title) {
      updateOrCreateMeta('twitter:title', metaData.title, true);
    }
    if (metaData.description) {
      updateOrCreateMeta('twitter:description', metaData.description, true);
    }
    if (metaData.image) {
      updateOrCreateMeta('twitter:image', metaData.image, true);
    }

    // Theme color
    if (metaData.themeColor) {
      updateOrCreateMeta('theme-color', metaData.themeColor);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', window.location.href);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', window.location.href);
      document.head.appendChild(canonical);
    }

    // Structured Data
    if (metaData.structuredData) {
      let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
      if (structuredDataScript) {
        structuredDataScript.textContent = JSON.stringify(metaData.structuredData);
      } else {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        structuredDataScript.textContent = JSON.stringify(metaData.structuredData);
        document.head.appendChild(structuredDataScript);
      }
    }
  }, [metaData]);
};

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

  // Dynamic meta content based on active tab and state
  const getMetaContent = () => {
    const baseUrl = window.location.origin;
    const currentUrl = window.location.href;
    
    if (isLoading) {
      return {
        title: 'Đang tải... - Puter AI Assistant',
        description: 'Đang khởi tạo Puter AI Assistant...',
        keywords: 'puter ai, loading, ai assistant',
        url: currentUrl,
        image: `${baseUrl}/og-image.png`,
        themeColor: isDark ? '#1f2937' : '#ffffff'
      };
    }

    if (!user) {
      return {
        title: 'Đăng nhập - Puter AI Assistant',
        description: 'Đăng nhập vào Puter AI Assistant để truy cập 25+ AI models miễn phí với lưu trữ cloud.',
        keywords: 'puter ai, đăng nhập, ai assistant, chat ai, miễn phí',
        url: currentUrl,
        image: `${baseUrl}/og-image.png`,
        themeColor: isDark ? '#1f2937' : '#ffffff'
      };
    }

    switch (activeTab) {
      case 'chat':
        return {
          title: 'Chat AI - Puter AI Assistant',
          description: 'Trò chuyện với 25+ AI models như GPT-4, Claude, Gemini. Tự động lưu lịch sử, hỗ trợ upload file và phân tích ảnh.',
          keywords: 'chat ai, gpt-4, claude, gemini, ai assistant, chatbot, artificial intelligence',
          url: currentUrl,
          image: `${baseUrl}/og-image-chat.png`,
          themeColor: isDark ? '#1f2937' : '#ffffff',
          structuredData: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Puter AI Chat",
            "description": "Chat với 25+ AI models miễn phí",
            "url": currentUrl,
            "applicationCategory": "AI Chat Assistant",
            "featureList": ["GPT-4", "Claude", "Gemini", "25+ AI Models"]
          }
        };
      case 'images':
        return {
          title: 'Tạo Ảnh AI - Puter AI Assistant',
          description: 'Tạo ảnh nghệ thuật với AI sử dụng DALL-E. Miễn phí với Test Mode, chất lượng cao với Production Mode.',
          keywords: 'tạo ảnh ai, dall-e, ai art, image generation, text to image, ai artwork',
          url: currentUrl,
          image: `${baseUrl}/og-image-art.png`,
          themeColor: isDark ? '#1f2937' : '#ffffff',
          structuredData: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Puter AI Image Generator",
            "description": "Tạo ảnh nghệ thuật với AI",
            "url": currentUrl,
            "applicationCategory": "AI Image Generator",
            "featureList": ["DALL-E", "Text to Image", "AI Art Generation"]
          }
        };
      case 'saved':
        return {
          title: 'Dữ Liệu Đã Lưu - Puter AI Assistant',
          description: 'Quản lý và xem lại tất cả cuộc trò chuyện AI đã lưu. Tự động đồng bộ với Puter Cloud.',
          keywords: 'lưu trữ chat, quản lý dữ liệu, puter cloud, backup chat ai',
          url: currentUrl,
          image: `${baseUrl}/og-image.png`,
          themeColor: isDark ? '#1f2937' : '#ffffff'
        };
      default:
        return {
          title: 'Puter AI Assistant - 25+ AI Models Miễn Phí',
          description: 'Trợ lý AI toàn diện với 25+ models, tạo ảnh, chat thông minh và lưu trữ cloud miễn phí.',
          keywords: 'puter ai, ai assistant, gpt-4, claude, gemini, ai models, miễn phí',
          url: currentUrl,
          image: `${baseUrl}/og-image.png`,
          themeColor: isDark ? '#1f2937' : '#ffffff',
          structuredData: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Puter AI Assistant",
            "description": "Trợ lý AI toàn diện với 25+ models, tạo ảnh và lưu trữ cloud miễn phí",
            "url": baseUrl,
            "applicationCategory": "AI Assistant",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Organization",
              "name": "Min Producer",
              "url": "https://minproducer.com"
            },
            "featureList": [
              "25+ AI Models",
              "Chat với GPT-4, Claude, Gemini",
              "Tạo ảnh với DALL-E",
              "Tự động lưu lịch sử",
              "Dark/Light theme",
              "Upload và phân tích file",
              "Đồng bộ cloud miễn phí"
            ]
          }
        };
    }
  };

  const metaContent = getMetaContent();
  useMetaTags(metaContent);

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
  // Set up basic meta tags on app init
  useEffect(() => {
    // Set basic meta tags that don't change
    const setBasicMeta = () => {
      document.documentElement.lang = 'vi';
      
      // Basic meta tags if they don't exist
      const metas = [
        { name: 'robots', content: 'index, follow' },
        { name: 'language', content: 'vi' },
        { name: 'author', content: 'Puter AI Assistant' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Puter AI Assistant' },
        { property: 'twitter:card', content: 'summary_large_image' },
        { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
        { httpEquiv: 'X-Frame-Options', content: 'DENY' },
        { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' }
      ];

      metas.forEach(metaData => {
        const { name, property, httpEquiv, content } = metaData;
        let selector = '';
        
        if (name) selector = `meta[name="${name}"]`;
        if (property) selector = `meta[property="${property}"]`;
        if (httpEquiv) selector = `meta[http-equiv="${httpEquiv}"]`;
        
        if (!document.querySelector(selector)) {
          const meta = document.createElement('meta');
          if (name) meta.setAttribute('name', name);
          if (property) meta.setAttribute('property', property);
          if (httpEquiv) meta.setAttribute('http-equiv', httpEquiv);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      });

      // Add favicon links if they don't exist
      if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/x-icon';
        favicon.href = '/favicon.ico';
        document.head.appendChild(favicon);
      }

      if (!document.querySelector('link[rel="apple-touch-icon"]')) {
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = '/apple-touch-icon.png';
        document.head.appendChild(appleTouchIcon);
      }
    };

    setBasicMeta();
  }, []);

  return (
    <ThemeProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;