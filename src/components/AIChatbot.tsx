import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Minimize2, Maximize2, Hash, ChevronDown } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';
import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface UserKeyword {
  id: string;
  keyword: string;
  total_mentions_found: number;
  last_searched_at: string | null;
  is_active: boolean;
}

interface RedditMention {
  id: string;
  content: string;
  sentiment: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  mentioned_at: string;
  url: string;
  tags: string[];
}

const AIChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm BrandSage, your AI brand assistant. I can help you analyze your brand performance and provide insights based on your Reddit monitoring data. Let me know which keyword you'd like to discuss, or ask me anything about your brand reputation!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordMentions, setKeywordMentions] = useState<RedditMention[]>([]);
  const [showKeywordSelector, setShowKeywordSelector] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [loadingMentions, setLoadingMentions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<any>(null);
  const streamingMessageRef = useRef<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Improved scroll detection
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 100; // pixels from bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
      
      setIsAtBottom(atBottom);
      
      // Only set userHasScrolled if they scroll up significantly
      if (!atBottom && scrollHeight - scrollTop - clientHeight > threshold) {
        setUserHasScrolled(true);
      } else if (atBottom) {
        setUserHasScrolled(false);
      }
    }
  };

  const scrollToBottom = () => {
    // Only auto-scroll if user is at bottom or hasn't manually scrolled
    if (messagesEndRef.current && (isAtBottom || !userHasScrolled)) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [messages]);

  // Load user's saved API key and keywords on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoadingApiKey(false);
          return;
        }

        // Load API key
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-gemini-key`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.hasKey && data.apiKey && data.status === 'valid') {
            setApiKey(data.apiKey);
            initializeChat(data.apiKey);
          }
        }

        // Load user keywords
        await loadUserKeywords();
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoadingApiKey(false);
      }
    };

    loadUserData();
  }, []);

  const loadUserKeywords = async () => {
    try {
      setLoadingKeywords(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: keywords, error } = await supabase
        .from('keyword_searches')
        .select('id, keyword, total_mentions_found, last_searched_at, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('total_mentions_found', { ascending: false });

      if (error) {
        console.error('Error loading keywords:', error);
        return;
      }

      setUserKeywords(keywords || []);
    } catch (error) {
      console.error('Error loading user keywords:', error);
    } finally {
      setLoadingKeywords(false);
    }
  };

  const loadKeywordMentions = async (keyword: string) => {
    try {
      setLoadingMentions(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get recent mentions for the selected keyword (last 50 mentions)
      const { data: mentions, error } = await supabase
        .from('user_mentions')
        .select('id, content, sentiment, author, subreddit, score, num_comments, mentioned_at, url, tags')
        .eq('user_id', user.id)
        .eq('keyword', keyword)
        .order('mentioned_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading mentions:', error);
        return;
      }

      setKeywordMentions(mentions || []);
    } catch (error) {
      console.error('Error loading keyword mentions:', error);
    } finally {
      setLoadingMentions(false);
    }
  };

  const handleKeywordSelect = async (keyword: string) => {
    setSelectedKeyword(keyword);
    setShowKeywordSelector(false);
    await loadKeywordMentions(keyword);
    
    // Add a system message about keyword selection
    const systemMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Great! I've loaded the data for "${keyword}". I now have access to your recent Reddit mentions, sentiment analysis, and engagement metrics for this keyword. What would you like to know about your "${keyword}" brand performance?`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const initializeChat = (key: string) => {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const chatHistory: ChatHistory[] = [
        {
          role: "user",
          parts: [{ text: `
            **[ROLE & GOAL]**
            You are BrandSage, an exceptionally knowledgeable and passionate AI expert on brand reputation management and social media analytics. Your primary goal is to be the ultimate companion for brand managers, marketers, and business owners looking to understand and improve their online presence. Your purpose is to enrich their understanding of brand sentiment, reputation management, and social media strategy.

            **[PERSONA & TONE]**
            - Professional & Insightful
            - Data-driven but approachable
            - Strategic thinking with practical advice
            - Encouraging and constructive
            - Use marketing and analytics terminology naturally

            **[INTERACTION GUIDELINES & CONSTRAINTS]**
            - Ask clarifying questions for better recommendations
            - Use formatting (bold, lists) for clarity
            - Focus on actionable insights and strategies
            - Acknowledge when data interpretation may vary
            - If you don't have specific data, provide general best practices
            - Always consider both short-term and long-term brand impact
            - When provided with Reddit data, analyze it thoroughly and provide specific insights
            - Reference specific mentions, sentiment patterns, and engagement metrics when available

            **[EXPERTISE AREAS]**
            - Brand sentiment analysis and interpretation
            - Social media reputation management
            - Reddit community engagement strategies
            - Crisis communication and damage control
            - Competitive analysis and benchmarking
            - Content strategy for brand building
            - Influencer and community relations
            - Data-driven decision making for brands
          `}],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I'm BrandSage, your AI expert for brand reputation and social media analytics. I'm here to help you understand your brand's online presence, interpret sentiment data, and develop strategies to enhance your reputation. What aspect of your brand performance would you like to explore today?" }],
        },
      ];

      chatRef.current = model.startChat({
        history: chatHistory,
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const buildContextualPrompt = (userMessage: string): string => {
    let contextualPrompt = userMessage;

    if (selectedKeyword && keywordMentions.length > 0) {
      // Build comprehensive context from Reddit data
      const sentimentBreakdown = keywordMentions.reduce((acc, mention) => {
        acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const avgScore = keywordMentions.reduce((sum, mention) => sum + mention.score, 0) / keywordMentions.length;
      const totalComments = keywordMentions.reduce((sum, mention) => sum + mention.num_comments, 0);
      
      const topSubreddits = keywordMentions.reduce((acc, mention) => {
        if (mention.subreddit) {
          acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const sortedSubreddits = Object.entries(topSubreddits)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      // Sample recent mentions for analysis
      const recentMentions = keywordMentions.slice(0, 10).map(mention => ({
        content: mention.content.substring(0, 200) + (mention.content.length > 200 ? '...' : ''),
        sentiment: mention.sentiment,
        subreddit: mention.subreddit,
        score: mention.score,
        author: mention.author
      }));

      contextualPrompt = `
**CONTEXT: Brand Analysis for "${selectedKeyword}"**

**Current Data Overview:**
- Total Recent Mentions: ${keywordMentions.length}
- Sentiment Breakdown: ${Object.entries(sentimentBreakdown).map(([sentiment, count]) => `${sentiment}: ${count}`).join(', ')}
- Average Engagement Score: ${avgScore.toFixed(1)}
- Total Comments Generated: ${totalComments}
- Top Subreddits: ${sortedSubreddits.map(([sub, count]) => `r/${sub} (${count})`).join(', ')}

**Recent Mention Samples:**
${recentMentions.map((mention, index) => `
${index + 1}. [${mention.sentiment.toUpperCase()}] r/${mention.subreddit} (Score: ${mention.score})
   Author: ${mention.author}
   Content: "${mention.content}"
`).join('')}

**User Question:** ${userMessage}

Please analyze this data and provide specific, actionable insights based on the actual Reddit mentions and engagement patterns shown above. Reference specific trends, sentiment patterns, and community behaviors you observe in the data.
`;
    }

    return contextualPrompt;
  };

  const generateBotResponse = async (userMessage: string): Promise<void> => {
    if (!apiKey || !chatRef.current) {
      // Fallback to static responses if no API key
      const fallbackResponse = getFallbackResponse(userMessage);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      return;
    }

    try {
      // Add a placeholder message for streaming
      const streamingMessageId = (Date.now() + 1).toString();
      const streamingMessage: Message = {
        id: streamingMessageId,
        type: 'bot',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, streamingMessage]);
      streamingMessageRef.current = '';

      // Build contextual prompt with Reddit data
      const contextualPrompt = buildContextualPrompt(userMessage);

      // Send message and get streaming response
      const result = await chatRef.current.sendMessageStream(contextualPrompt);
      
      // Stream the response with word-by-word animation
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        streamingMessageRef.current += chunkText;
        
        // Update the streaming message with accumulated text
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: streamingMessageRef.current }
            : msg
        ));

        // Add delay for streaming effect
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback to static response on error
      const fallbackResponse = "I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment, or check that your Gemini API key is properly configured in Settings.";
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => {
        // Remove the streaming message and add error message
        const filtered = prev.filter(msg => !msg.isStreaming);
        return [...filtered, errorMessage];
      });
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('keyword') && userKeywords.length > 0) {
      return `I can see you have ${userKeywords.length} active keywords being monitored: ${userKeywords.map(k => k.keyword).join(', ')}. Please select a specific keyword using the keyword selector above so I can provide detailed analysis of your Reddit mentions and sentiment data.`;
    }
    
    if (lowerMessage.includes('sentiment') || lowerMessage.includes('score')) {
      return selectedKeyword 
        ? `Based on your "${selectedKeyword}" monitoring data, I can analyze sentiment trends across your tracked mentions. ${keywordMentions.length > 0 ? `You have ${keywordMentions.length} recent mentions to analyze.` : 'Please ensure you have recent mentions for this keyword.'}`
        : "To provide sentiment analysis, please select a keyword first so I can access your specific mention data.";
    }
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('recommendation')) {
      return selectedKeyword
        ? `For your "${selectedKeyword}" keyword, I can provide specific recommendations based on your Reddit mention patterns and sentiment analysis. ${keywordMentions.length > 0 ? 'Let me analyze your recent mentions to suggest improvements.' : 'You may need more recent mentions to get detailed recommendations.'}`
        : "To provide targeted recommendations, please select a keyword first so I can analyze your specific brand performance data.";
    }
    
    return userKeywords.length > 0 
      ? `I'm here to help analyze your brand performance! You have ${userKeywords.length} keywords being monitored. Please select a keyword using the selector above, and I'll provide detailed insights based on your Reddit mentions and sentiment data.`
      : "I'm here to help with brand analysis! It looks like you don't have any keywords set up for monitoring yet. You can add keywords in the Settings page to start tracking your brand mentions.";
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

    await generateBotResponse(inputValue);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "Analyze sentiment trends",
    "Show top performing posts",
    "Identify engagement opportunities",
    "Compare keyword performance"
  ];

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    inputRef.current?.focus();
  };

  if (loadingApiKey) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="boxes mb-4">
            <div className="box"></div>
            <div className="box"></div>
            <div className="box"></div>
            <div className="box"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading AI assistant...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-[500px] flex items-center justify-center">
        <div className="text-center p-8">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Assistant Unavailable</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            To use the AI assistant, please configure your Gemini API key in Settings.
          </p>
          <button
            onClick={() => window.location.href = '/settings'}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg transition-all duration-300 ${isMinimized ? 'h-20' : 'h-[500px]'} flex flex-col w-full`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">BrandSage AI</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Your brand reputation expert</p>
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
          {/* Keyword Selector */}
          {userKeywords.length > 0 && (
            <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowKeywordSelector(!showKeywordSelector)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedKeyword ? `Selected: ${selectedKeyword}` : 'Select a keyword for analysis'}
                    </span>
                    {selectedKeyword && keywordMentions.length > 0 && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">
                        {keywordMentions.length} mentions loaded
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showKeywordSelector ? 'rotate-180' : ''}`} />
                </button>

                {showKeywordSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                    {userKeywords.map((keyword) => (
                      <button
                        key={keyword.id}
                        onClick={() => handleKeywordSelect(keyword.keyword)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{keyword.keyword}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {keyword.total_mentions_found} mentions • {keyword.last_searched_at ? new Date(keyword.last_searched_at).toLocaleDateString() : 'Never searched'}
                            </div>
                          </div>
                          {selectedKeyword === keyword.keyword && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading indicator for mentions */}
          {loadingMentions && (
            <div className="px-4 sm:px-6 pt-2 flex-shrink-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="boxes-small">
                  <div className="box"></div>
                  <div className="box"></div>
                  <div className="box"></div>
                  <div className="box"></div>
                </div>
                <span>Loading Reddit data for {selectedKeyword}...</span>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 w-full ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
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
                <div className={`flex-1 w-full ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-2xl text-sm leading-relaxed max-w-full ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {message.type === 'bot' ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <div>{message.content}</div>
                    )}
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

          {/* Input Section */}
          <div className="p-4 sm:p-6 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedKeyword ? `Ask about "${selectedKeyword}" performance...` : "Ask about your brand performance..."}
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