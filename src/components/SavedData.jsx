import React, { useState, useEffect, createContext, useContext } from 'react';
import { FolderOpen, Trash2, MessageCircle, Cpu, Calendar } from 'lucide-react';

// Context để share data giữa components
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [currentChat, setCurrentChat] = useState(null);
  
  const loadChatFromSaved = async (chatData) => {
    try {
      // Save current session
      await window.puter.kv.set('currentChatSession', JSON.stringify(chatData));
      setCurrentChat(chatData);
      
      // Trigger reload in ChatInterface
      window.dispatchEvent(new CustomEvent('loadSavedChat', { detail: chatData }));
    } catch (error) {
      console.error('Lỗi load chat:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ currentChat, setCurrentChat, loadChatFromSaved }}>
      {children}
    </ChatContext.Provider>
  );
};

const SavedData = () => {
  const [savedChats, setSavedChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const { loadChatFromSaved } = useContext(ChatContext) || {};

  useEffect(() => {
    loadSavedChats();
  }, []);

  const loadSavedChats = async () => {
    try {
      const savedChatsData = await window.puter.kv.get('savedChats');
      if (savedChatsData) {
        setSavedChats(JSON.parse(savedChatsData));
      }
    } catch (error) {
      console.error('Lỗi tải chat:', error);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      const filteredChats = savedChats.filter(chat => chat.id !== chatId);
      setSavedChats(filteredChats);
      await window.puter.kv.set('savedChats', JSON.stringify(filteredChats));
    } catch (error) {
      console.error('Lỗi xóa chat:', error);
    }
  };

  const loadChat = async (chat) => {
    try {
      if (loadChatFromSaved) {
        await loadChatFromSaved(chat);
        alert(`Đã tải chat: "${chat.title}". Chuyển sang tab Chat AI để xem!`);
      } else {
        // Fallback method
        await window.puter.kv.set('currentChatSession', JSON.stringify(chat));
        window.location.reload(); // Simple reload to load chat
      }
    } catch (error) {
      console.error('Lỗi tải chat:', error);
      alert('Có lỗi khi tải chat. Vui lòng thử lại!');
    }
  };

  const previewChat = (chat) => {
    setSelectedChat(chat);
  };

  const getModelDisplay = (modelId) => {
    const modelMap = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4.1': 'GPT-4.1',
      'gpt-4.1-mini': 'GPT-4.1 Mini',
      'gpt-4.1-nano': 'GPT-4.1 Nano',
      'claude-sonnet-4': 'Claude Sonnet 4',
      'claude-opus-4': 'Claude Opus 4',
      'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
      'claude': 'Claude 3.7 Sonnet',
      'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
      'google/gemini-pro': 'Gemini Pro',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': 'Llama 3.1 70B',
      'o1': 'o1',
      'o1-mini': 'o1 Mini',
      'o3-mini': 'o3 Mini'
    };
    return modelMap[modelId] || modelId;
  };

  const formatChatPreview = (messages) => {
    if (!messages || messages.length === 0) return 'Không có tin nhắn';
    return messages.slice(0, 3).map(msg => 
      `${msg.role === 'user' ? '👤' : '🤖'} ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
    ).join('\n');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Chat đã lưu ({savedChats.length})</h2>
            <button
              onClick={loadSavedChats}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Làm mới
            </button>
          </div>
          
          <div className="p-6">
            {savedChats.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Chưa có chat nào được lưu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedChats.slice().reverse().map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`p-4 border rounded-lg hover:shadow-md transition duration-200 cursor-pointer ${
                      selectedChat?.id === chat.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => previewChat(chat)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{chat.title}</h3>
                        
                        {/* Chat Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{chat.messages?.length || 0} tin nhắn</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Cpu className="h-4 w-4" />
                            <span>{getModelDisplay(chat.model || 'gpt-4o-mini')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(chat.timestamp).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        {/* Quick Preview */}
                        <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
                          {chat.messages && chat.messages.length > 0 ? 
                            `${chat.messages[0].content.substring(0, 80)}${chat.messages[0].content.length > 80 ? '...' : ''}` 
                            : 'Không có tin nhắn'
                          }
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadChat(chat);
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition duration-200"
                        >
                          Tải
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Preview */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-fit sticky top-6">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800">Preview Chat</h3>
          </div>
          
          <div className="p-6">
            {selectedChat ? (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">{selectedChat.title}</h4>
                
                {/* Chat Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tin nhắn:</span>
                    <span className="font-medium">{selectedChat.messages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model:</span>
                    <span className="font-medium">{getModelDisplay(selectedChat.model || 'gpt-4o-mini')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày tạo:</span>
                    <span className="font-medium">{new Date(selectedChat.timestamp).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Messages Preview */}
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-700 mb-3">Nội dung chat:</h5>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedChat.messages?.slice(0, 6).map((message, index) => (
                      <div key={index} className={`text-sm p-2 rounded ${
                        message.role === 'user' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="font-medium text-xs mb-1">
                          {message.role === 'user' ? '👤 Bạn' : '🤖 AI'}
                          {message.model && ` (${getModelDisplay(message.model)})`}
                        </div>
                        <div className="line-clamp-3">
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {selectedChat.messages?.length > 6 && (
                      <div className="text-center text-gray-500 text-xs">
                        ... và {selectedChat.messages.length - 6} tin nhắn khác
                      </div>
                    )}
                  </div>
                </div>

                {/* Load Button */}
                <button
                  onClick={() => loadChat(selectedChat)}
                  className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
                >
                  Tải chat này
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Chọn một chat để xem preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedData;