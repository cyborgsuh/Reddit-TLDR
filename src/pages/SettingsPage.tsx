import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  Settings, 
  Key, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  X,
  Hash,
  Clock,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  User,
  Bell,
  Shield,
  Palette,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useKeywordManagement } from '../hooks/useKeywordManagement';

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // API Key Management
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'not_set' | 'valid' | 'invalid' | 'testing'>('not_set');
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [deletingApiKey, setDeletingApiKey] = useState(false);

  // Keyword Management
  const { keywords, loading: keywordsLoading, addKeyword, removeKeyword, toggleKeyword, updateFrequency, triggerManualSearch } = useKeywordManagement();
  const [newKeyword, setNewKeyword] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [showAddKeyword, setShowAddKeyword] = useState(false);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);

  // Account Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoadingApiKey(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-gemini-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasKey) {
          setApiKey(data.apiKey || '');
          setApiKeyStatus(data.status || 'valid');
        }
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setLoadingApiKey(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;

    setSavingApiKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-gemini-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeyStatus(data.status);
        alert('API key saved successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      alert(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  const deleteApiKey = async () => {
    if (!confirm('Are you sure you want to delete your API key? This will disable AI features.')) {
      return;
    }

    setDeletingApiKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-gemini-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setApiKey('');
        setApiKeyStatus('not_set');
        alert('API key deleted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete API key');
    } finally {
      setDeletingApiKey(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;

    setAddingKeyword(true);
    try {
      const success = await addKeyword(newKeyword.trim());
      if (success) {
        setNewKeyword('');
        setShowAddKeyword(false);
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleRemoveKeyword = async (keywordId: string) => {
    if (!confirm('Are you sure you want to remove this keyword? All associated data will be deleted.')) {
      return;
    }

    await removeKeyword(keywordId);
  };

  const handleManualSearch = async () => {
    try {
      await triggerManualSearch();
      alert('Manual search triggered! Check the Mentions page for new results.');
    } catch (error) {
      console.error('Error triggering manual search:', error);
      alert('Failed to trigger manual search. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getApiKeyStatusIcon = () => {
    switch (apiKeyStatus) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-5 w-5 text-orange-500 animate-spin" />;
      default:
        return <Key className="h-5 w-5 text-gray-400" />;
    }
  };

  const getApiKeyStatusText = () => {
    switch (apiKeyStatus) {
      case 'valid':
        return 'Valid API key';
      case 'invalid':
        return 'Invalid API key';
      case 'testing':
        return 'Testing API key...';
      default:
        return 'No API key set';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <Navigation />
      
      {/* Main Content */}
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <span>Settings</span>
                    <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 animate-pulse mt-1 sm:mt-0" />
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Manage your account, API keys, and monitoring preferences
                  </p>
                </div>
                
                <div className="text-left lg:text-right">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Account: {user?.email}</span>
                    <span className="sm:hidden">User: {user?.email?.split('@')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-8">
            
            {/* API Configuration */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
                  <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Configuration</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Google Gemini API Key
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        disabled={loadingApiKey}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getApiKeyStatusIcon()}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getApiKeyStatusText()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Get your API key from{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={saveApiKey}
                    disabled={!apiKey.trim() || savingApiKey || loadingApiKey}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {savingApiKey ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{savingApiKey ? 'Saving...' : 'Save API Key'}</span>
                  </button>

                  {apiKeyStatus !== 'not_set' && (
                    <button
                      onClick={deleteApiKey}
                      disabled={deletingApiKey}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {deletingApiKey ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span>{deletingApiKey ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Keyword Monitoring */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                    <Hash className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyword Monitoring</h2>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleManualSearch}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Search Now</span>
                  </button>
                  
                  <button
                    onClick={() => setShowAddKeyword(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Keyword</span>
                  </button>
                </div>
              </div>

              {/* Add Keyword Modal */}
              {showAddKeyword && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Keyword</h3>
                    <button
                      onClick={() => setShowAddKeyword(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Enter keyword to monitor"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    />
                    <button
                      onClick={handleAddKeyword}
                      disabled={!newKeyword.trim() || addingKeyword}
                      className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {addingKeyword ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              {/* Keywords List */}
              <div className="space-y-3">
                {keywordsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">Loading keywords...</p>
                  </div>
                ) : keywords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No keywords configured yet.</p>
                    <p className="text-sm mt-2">Add keywords to start monitoring your brand mentions.</p>
                  </div>
                ) : (
                  keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {keyword.keyword}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                            {keyword.total_mentions_found} mentions
                          </span>
                          {keyword.is_active ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Last searched: {keyword.last_searched_at ? new Date(keyword.last_searched_at).toLocaleString() : 'Never'} • 
                          Frequency: Every {keyword.search_frequency_hours} hours
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleKeyword(keyword.id, !keyword.is_active)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          {keyword.is_active ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleRemoveKeyword(keyword.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl">
                  <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts for new mentions and sentiment changes</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className="p-2"
                  >
                    {emailNotifications ? (
                      <ToggleRight className="h-6 w-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Real-time browser notifications for urgent alerts</p>
                  </div>
                  <button
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className="p-2"
                  >
                    {pushNotifications ? (
                      <ToggleRight className="h-6 w-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Weekly Reports</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Summary of your brand performance and trends</p>
                  </div>
                  <button
                    onClick={() => setWeeklyReports(!weeklyReports)}
                    className="p-2"
                  >
                    {weeklyReports ? (
                      <ToggleRight className="h-6 w-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Security</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword || changingPassword}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {changingPassword ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-400">Danger Zone</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-red-900 dark:text-red-400">Delete Account</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">Permanently delete your account and all associated data</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        // Handle account deletion
                        alert('Account deletion is not implemented yet.');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;