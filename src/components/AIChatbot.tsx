import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const AIChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AI brand assistant. I can help you analyze your brand performance, suggest improvements, and answer questions about your Reddit presence. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sentiment') || lowerMessage.includes('score')) {
      return "Based on your current monitoring data, I can see your brand sentiment trends across all tracked keywords. Your positive sentiment ratio varies by keyword, with some showing strong performance while others may need attention. Would you like me to analyze specific keywords or time periods?";
    }
    
    if (lowerMessage.includes('competitor') || lowerMessage.includes('competition')) {
      return "I can help you understand your competitive position based on mention volume and sentiment analysis. While I don't have direct competitor data, I can analyze how your brand performs relative to industry benchmarks and suggest areas for improvement.";
    }
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('recommendation')) {
      return "Based on your mention analysis, here are some recommendations: 1) Monitor keywords showing negative sentiment trends more closely, 2) Engage with positive mentions to build community, 3) Set up additional keywords to capture more brand conversations. Would you like specific guidance on any of these areas?";
    }
    
    if (lowerMessage.includes('keyword') || lowerMessage.includes('mention')) {
      return "I can see your keyword monitoring setup and mention patterns. Each keyword has different sentiment distributions and mention volumes. Would you like me to analyze performance for specific keywords or suggest new ones to monitor?";
    }
    
    if (lowerMessage.includes('reddit') || lowerMessage.includes('social')) {
      return "Your Reddit monitoring is capturing mentions across various subreddits. I can help you understand which communities are most active in discussing your brand and suggest engagement strategies based on sentiment patterns.";
    }
    
    if (lowerMessage.includes('dashboard') || lowerMessage.includes('data')) {
      return "Your dashboard shows real-time data from your keyword monitoring system. I can help you interpret reputation scores, sentiment trends, and mention patterns. What specific metrics would you like me to explain?";
    }
    
    if (lowerMessage.includes('alert') || lowerMessage.includes('notification')) {
      return "I can help you understand when to pay attention to your mentions. Look for sudden spikes in negative sentiment, unusual mention volumes, or new keywords emerging in conversations about your brand.";
    }
    
    return "I'm here to help you understand your brand monitoring data! I can assist with sentiment analysis, keyword performance, mention trends, and strategic recommendations. What specific aspect of your brand reputation would you like to explore?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "How is my brand performing?",
    "What should I improve?",
    "Analyze my competitors",
    "Show keyword insights"
  ];

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    inputRef.current?.focus();
  };

  return (
    <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg transition-all duration-300 ${isMinimized ? 'h-20' : 'h-[500px]'} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">AI Brand Assistant</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Ask me anything about your brand</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isMinimized ? (
            <Maximize2 className="h-5 w-5 text-gray-500" />
          ) : (
            <Minimize2 className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 max-w-xs lg:max-w-md ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-2xl text-sm leading-relaxed ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 sm:px-6 pb-4 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors duration-200 transform hover:scale-105"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input Section - Now integrated within the card */}
          <div className="p-4 sm:p-6 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your brand performance..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatbot;