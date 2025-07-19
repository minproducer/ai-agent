import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save, Download, Trash2, MessageCircle, Settings, ChevronDown, History, Cpu, Image, Paperclip } from 'lucide-react';
import ImageUploadComponent from './ImageUploadComponent';
import { useTheme, themeClasses } from './ThemeContext';

const ChatInterface = () => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Danh sách AI models từ Puter.js documentation
  const aiModels = [
    // OpenAI Models
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable GPT-4 model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Faster, cheaper GPT-4o' },
    { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', description: 'Latest GPT-4 iteration' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', description: 'Efficient GPT-4.1' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', description: 'Ultra-fast GPT-4.1' },
    { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', provider: 'OpenAI', description: 'Next-gen preview' },
    { id: 'o1', name: 'o1', provider: 'OpenAI', description: 'Reasoning model' },
    { id: 'o1-mini', name: 'o1 Mini', provider: 'OpenAI', description: 'Efficient reasoning' },
    { id: 'o1-pro', name: 'o1 Pro', provider: 'OpenAI', description: 'Advanced reasoning' },
    { id: 'o3', name: 'o3', provider: 'OpenAI', description: 'Latest reasoning model' },
    { id: 'o3-mini', name: 'o3 Mini', provider: 'OpenAI', description: 'Fast reasoning' },
    { id: 'o4-mini', name: 'o4 Mini', provider: 'OpenAI', description: 'Next-gen reasoning' },
    
    // Claude Models
    { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Latest Claude model' },
    { id: 'claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', description: 'Most capable Claude' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Balanced Claude model' },
    { id: 'claude', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', description: 'Enhanced Claude' },
    
    // Google Models
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast Google model' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Google\'s flagship model' },
    
    // Meta Models
    { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B Turbo', provider: 'Meta', description: 'Large open-source model' },
    { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 11B Vision', provider: 'Meta', description: 'Vision-capable Llama' },
    
    // OpenRouter Models
    { id: 'openrouter:anthropic/claude-sonnet-4', name: 'Claude Sonnet 4 (OpenRouter)', provider: 'OpenRouter', description: 'Claude via OpenRouter' },
    { id: 'openrouter:google/gemini-pro-vision', name: 'Gemini Pro Vision (OpenRouter)', provider: 'OpenRouter', description: 'Vision Gemini via OpenRouter' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
    loadCurrentSession();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      autoSaveChat();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const savedChats = await window.puter.kv.get('savedChats');
      if (savedChats) {
        setChatHistory(JSON.parse(savedChats));
      }
    } catch (error) {
      console.error('Lỗi tải lịch sử chat:', error);
    }
  };

  const loadCurrentSession = async () => {
    try {
      const currentChat = await window.puter.kv.get('currentChatSession');
      if (currentChat) {
        const chatData = JSON.parse(currentChat);
        setMessages(chatData.messages || []);
        setCurrentChatId(chatData.id);
        if (chatData.model) {
          setSelectedModel(chatData.model);
        }
      }
    } catch (error) {
      console.error('Lỗi tải session hiện tại:', error);
    }
  };

  const autoSaveChat = async () => {
    try {
      if (!currentChatId) {
        const newChatId = Date.now();
        setCurrentChatId(newChatId);
      }

      const chatData = {
        id: currentChatId || Date.now(),
        messages: messages,
        model: selectedModel,
        lastUpdated: new Date(),
        title: messages[0]?.content?.substring(0, 50) + '...' || 'Cuộc trò chuyện'
      };

      await window.puter.kv.set('currentChatSession', JSON.stringify(chatData));
      
      if (messages.length % 5 === 0 && messages.length > 0) {
        await saveToHistory(chatData);
      }
    } catch (error) {
      console.error('Lỗi auto-save:', error);
    }
  };

  const saveToHistory = async (chatData) => {
    try {
      const existingChats = await window.puter.kv.get('savedChats');
      const savedChats = existingChats ? JSON.parse(existingChats) : [];
      
      const existingIndex = savedChats.findIndex(chat => chat.id === chatData.id);
      
      if (existingIndex >= 0) {
        savedChats[existingIndex] = { ...chatData, timestamp: new Date() };
      } else {
        savedChats.push({ ...chatData, timestamp: new Date() });
      }
      
      if (savedChats.length > 50) {
        savedChats.splice(0, savedChats.length - 50);
      }
      
      await window.puter.kv.set('savedChats', JSON.stringify(savedChats));
      setChatHistory(savedChats);
    } catch (error) {
      console.error('Lỗi lưu vào lịch sử:', error);
    }
  };

  const loadChatFromHistory = async (chatData) => {
    try {
      // Save current chat first if it has messages
      if (messages.length > 0 && currentChatId) {
        const currentChatData = {
          id: currentChatId,
          messages: messages,
          model: selectedModel,
          timestamp: new Date(),
          title: messages[0]?.content?.substring(0, 50) + '...' || 'Cuộc trò chuyện'
        };
        await saveToHistory(currentChatData);
      }
      
      // Load selected chat
      setMessages(chatData.messages || []);
      setCurrentChatId(chatData.id);
      setSelectedModel(chatData.model || 'gpt-4o-mini');
      setShowChatHistory(false);
      
      // Save as current session
      await window.puter.kv.set('currentChatSession', JSON.stringify(chatData));
    } catch (error) {
      console.error('Lỗi tải chat:', error);
    }
  };

  const startNewChat = async () => {
    try {
      if (messages.length > 0 && currentChatId) {
        const chatData = {
          id: currentChatId,
          messages: messages,
          model: selectedModel,
          timestamp: new Date(),
          title: messages[0]?.content?.substring(0, 50) + '...' || 'Cuộc trò chuyện'
        };
        await saveToHistory(chatData);
      }
      
      await window.puter.kv.del('currentChatSession');
      setMessages([]);
      setCurrentChatId(null);
    } catch (error) {
      console.error('Lỗi tạo chat mới:', error);
    }
  };

  const sendMessage = async (customMessage = null, customResponse = null, imageData = null) => {
    const messageText = customMessage || inputMessage;
    if (!messageText.trim() || isLoading) return;

    const userMessage = { 
      role: 'user', 
      content: messageText, 
      timestamp: new Date(),
      image: imageData ? {
        name: imageData.name,
        url: imageData.previewUrl
      } : null
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (!customMessage) {
      setInputMessage('');
    }
    
    // If we have a custom response (from image analysis), use it
    if (customResponse) {
      const aiMessage = { 
        role: 'assistant', 
        content: customResponse, 
        timestamp: new Date(),
        model: selectedModel
      };
      setMessages(prev => [...prev, aiMessage]);
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Sending to model:', selectedModel);
      const response = await window.puter.ai.chat(messageText, {
        model: selectedModel,
        stream: false
      });
      
      console.log('AI Response:', response);
      console.log('AI Response type:', typeof response);
      
      let aiResponseText = '';
      
      if (typeof response === 'string') {
        aiResponseText = response;
      } else if (response && response.message && response.message.content) {
        if (Array.isArray(response.message.content)) {
          aiResponseText = response.message.content[0]?.text || response.message.content[0];
        } else {
          aiResponseText = response.message.content;
        }
      } else if (response && response.content) {
        aiResponseText = response.content;
      } else if (response && response.message && typeof response.message === 'string') {
        aiResponseText = response.message;
      } else if (response && response.text) {
        aiResponseText = response.text;
      } else if (Array.isArray(response) && response.length > 0) {
        const firstResponse = response[0];
        if (firstResponse && firstResponse.message && firstResponse.message.content) {
          aiResponseText = firstResponse.message.content;
        } else if (firstResponse && firstResponse.content) {
          aiResponseText = firstResponse.content;
        } else if (firstResponse && typeof firstResponse === 'string') {
          aiResponseText = firstResponse;
        }
      } else if (response && typeof response === 'object') {
        console.error('Unhandled response format:', response);
        aiResponseText = `Response from ${selectedModel}: ${JSON.stringify(response, null, 2)}`;
      } else {
        aiResponseText = 'AI đã phản hồi nhưng không thể hiển thị nội dung.';
      }
      
      const aiMessage = { 
        role: 'assistant', 
        content: aiResponseText, 
        timestamp: new Date(),
        model: selectedModel
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Lỗi chat AI:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: `Xin lỗi, đã có lỗi khi sử dụng model ${selectedModel}. Vui lòng thử model khác hoặc thử lại!`, 
        timestamp: new Date(), 
        isError: true 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentChat = async () => {
    if (messages.length === 0) return;

    try {
      const chatData = {
        id: currentChatId || Date.now(),
        title: messages[0]?.content?.substring(0, 50) + '...' || 'Cuộc trò chuyện',
        messages: messages,
        model: selectedModel,
        timestamp: new Date()
      };

      await saveToHistory(chatData);
      alert('Chat đã được lưu vào lịch sử!');
    } catch (error) {
      console.error('Lỗi lưu chat:', error);
      alert('Có lỗi khi lưu chat. Vui lòng thử lại!');
    }
  };

  const exportChat = async () => {
    if (messages.length === 0) return;
    
    const chatText = messages.map(msg => 
      `[${msg.role.toUpperCase()}${msg.model ? ` - ${msg.model}` : ''}]: ${msg.content}`
    ).join('\n\n');
    
    const filename = `chat_${selectedModel}_${new Date().getTime()}.txt`;
    try {
      await window.puter.fs.write(filename, chatText);
      alert(`Chat đã được lưu thành file: ${filename}`);
    } catch (error) {
      console.error('Lỗi xuất chat:', error);
      alert('Có lỗi khi xuất file. Vui lòng thử lại!');
    }
  };

  const clearChat = () => {
    startNewChat();
  };

  const deleteChatFromHistory = async (chatId) => {
    try {
      const filteredChats = chatHistory.filter(chat => chat.id !== chatId);
      setChatHistory(filteredChats);
      await window.puter.kv.set('savedChats', JSON.stringify(filteredChats));
    } catch (error) {
      console.error('Lỗi xóa chat:', error);
    }
  };

  const getModelDisplay = (model) => {
    const modelInfo = aiModels.find(m => m.id === model);
    return modelInfo ? `${modelInfo.name} (${modelInfo.provider})` : model;
  };

  return (
    <div className={`${themeClasses.card} rounded-2xl shadow-lg overflow-hidden`}>
      <div className={`border-b ${themeClasses.border.primary} ${themeClasses.bg.secondary} px-6 py-4`}>
        <div className="flex justify-between items-center mb-3">
          <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Trò chuyện với AI</h2>
          <div className="flex items-center space-x-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={`flex items-center space-x-2 ${themeClasses.bg.accent} ${themeClasses.text.accent} px-3 py-1.5 rounded-lg ${themeClasses.interactive.hover} transition duration-200`}
              >
                <Cpu className="h-4 w-4" />
                <span className="text-sm">{getModelDisplay(selectedModel).split(' (')[0]}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showModelSelector && (
                <div className={`absolute right-0 top-full mt-2 w-80 ${themeClasses.bg.primary} ${themeClasses.border.primary} border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto`}>
                  <div className={`p-3 border-b ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
                    <h3 className={`font-semibold ${themeClasses.text.primary}`}>Chọn AI Model</h3>
                  </div>
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left px-4 py-3 ${themeClasses.interactive.hover} border-b ${themeClasses.border.primary} ${
                        selectedModel === model.id ? `${themeClasses.bg.tertiary} border-l-4 border-l-blue-500` : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`font-medium ${themeClasses.text.primary}`}>{model.name}</div>
                          <div className={`text-sm ${themeClasses.text.secondary}`}>{model.description}</div>
                        </div>
                        <span className={`text-xs ${themeClasses.bg.tertiary} ${themeClasses.text.secondary} px-2 py-1 rounded`}>{model.provider}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Image Upload Button */}
            <button
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition duration-200 ${
                showImageUpload 
                  ? 'bg-orange-500 text-white' 
                  : `${themeClasses.bg.tertiary} ${themeClasses.text.secondary} ${themeClasses.interactive.hover}`
              }`}
            >
              <Image className="h-4 w-4" />
              <span>Ảnh</span>
            </button>
            
            {/* Chat History Button */}
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              className={`flex items-center space-x-2 ${themeClasses.bg.tertiary} ${themeClasses.text.secondary} px-3 py-1.5 rounded-lg ${themeClasses.interactive.hover} transition duration-200`}
            >
              <History className="h-4 w-4" />
              <span>Lịch sử</span>
            </button>
          </div>
        </div>
        
        {/* Current Model Display */}
        <div className={`text-sm ${themeClasses.text.secondary} mb-3`}>
          Đang sử dụng: <span className={`font-medium ${themeClasses.text.accent}`}>{getModelDisplay(selectedModel)}</span>
        </div>
        
        {/* Image Upload Panel */}
        {showImageUpload && (
          <div className="mt-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-semibold ${themeClasses.text.primary}`}>Upload & Phân tích ảnh</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className={`${themeClasses.text.secondary} ${themeClasses.interactive.hover}`}
              >
                ×
              </button>
            </div>
            <ImageUploadComponent 
              selectedModel={selectedModel}
              onSendMessage={sendMessage}
            />
          </div>
        )}
        
        {/* Chat History Panel */}
        {showChatHistory && (
          <div className={`mt-3 p-4 ${themeClasses.bg.tertiary} rounded-lg max-h-64 overflow-y-auto`}>
            <h3 className={`font-semibold ${themeClasses.text.primary} mb-3`}>Lịch sử chat ({chatHistory.length})</h3>
            {chatHistory.length === 0 ? (
              <p className={`${themeClasses.text.secondary} text-sm`}>Chưa có chat nào được lưu</p>
            ) : (
              <div className="space-y-2">
                {chatHistory.slice().reverse().map((chat) => (
                  <div key={chat.id} className={`flex items-center justify-between p-3 ${themeClasses.bg.primary} rounded border ${themeClasses.border.primary} ${themeClasses.interactive.hover} transition duration-200`}>
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => loadChatFromHistory(chat)}
                    >
                      <div className={`font-medium ${themeClasses.text.primary} text-sm truncate`}>{chat.title}</div>
                      <div className={`text-xs ${themeClasses.text.secondary}`}>
                        {chat.messages?.length || 0} tin nhắn • {getModelDisplay(chat.model || 'gpt-4o-mini')} • {new Date(chat.timestamp).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChatFromHistory(chat.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={startNewChat}
            className="flex items-center space-x-2 bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition duration-200"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat mới</span>
          </button>
          <button
            onClick={saveCurrentChat}
            disabled={messages.length === 0}
            className="flex items-center space-x-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            <Save className="h-4 w-4" />
            <span>Lưu</span>
          </button>
          <button
            onClick={exportChat}
            disabled={messages.length === 0}
            className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            <Download className="h-4 w-4" />
            <span>Xuất</span>
          </button>
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            <Trash2 className="h-4 w-4" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      <div className={`h-96 overflow-y-auto p-6 space-y-4 ${themeClasses.bg.primary}`}>
        {messages.length === 0 && (
          <div className={`text-center ${themeClasses.text.secondary} py-12`}>
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Bắt đầu cuộc trò chuyện với AI của bạn!</p>
            <p className="text-xs mt-2">💡 Lịch sử chat được tự động lưu</p>
            <p className="text-xs mt-1">🤖 Model hiện tại: <span className="font-medium">{getModelDisplay(selectedModel)}</span></p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : message.isError
                ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                : `${themeClasses.bg.secondary} ${themeClasses.text.primary}`
            }`}>
              {/* Image preview for user messages with images */}
              {message.image && (
                <div className="mb-2">
                  <img 
                    src={message.image.url} 
                    alt={message.image.name}
                    className="max-w-full h-32 object-cover rounded-lg border"
                  />
                  <p className="text-xs opacity-70 mt-1">📷 {message.image.name}</p>
                </div>
              )}
              
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="flex justify-between items-center mt-2 text-xs opacity-70">
                <span>{new Date(message.timestamp).toLocaleTimeString('vi-VN')}</span>
                {message.model && message.role === 'assistant' && (
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                    {aiModels.find(m => m.id === message.model)?.name || message.model}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className={`${themeClasses.bg.secondary} px-4 py-3 rounded-2xl`}>
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className={`text-sm ${themeClasses.text.secondary}`}>{getModelDisplay(selectedModel).split(' (')[0]} đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`border-t ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4`}>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImageUpload(!showImageUpload)}
            className={`p-2 rounded-lg transition duration-200 ${
              showImageUpload 
                ? 'bg-orange-500 text-white' 
                : `${themeClasses.bg.tertiary} ${themeClasses.text.secondary} ${themeClasses.interactive.hover}`
            }`}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Nhập tin nhắn cho ${getModelDisplay(selectedModel).split(' (')[0]}...`}
            className={`flex-1 border ${themeClasses.border.primary} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${themeClasses.bg.primary} ${themeClasses.text.primary}`}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Gửi</span>
          </button>
        </div>
        
        {showImageUpload && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">💡 Tip: Upload ảnh để phân tích, OCR, hoặc hỏi về nội dung ảnh</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;