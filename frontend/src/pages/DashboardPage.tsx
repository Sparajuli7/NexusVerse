import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useWeb3 } from '../hooks/useWeb3';

interface DashboardStats {
  connections: number;
  communities: number;
  events: number;
  tokens: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { account, balance, isConnected } = useWeb3();
  const [stats, setStats] = useState<DashboardStats>({
    connections: 0,
    communities: 0,
    events: 0,
    tokens: 0,
  });

  useEffect(() => {
    // Fetch user stats from API
    const fetchStats = async () => {
      try {
        // Mock data for now
        setStats({
          connections: 24,
          communities: 8,
          events: 12,
          tokens: 1250,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Find Connections',
      description: 'Discover new professionals',
      icon: '🔍',
      color: 'from-blue-500 to-cyan-500',
      href: '/app/connections'
    },
    {
      title: 'Join Community',
      description: 'Explore micro-communities',
      icon: '🏘️',
      color: 'from-green-500 to-emerald-500',
      href: '/app/communities'
    },
    {
      title: 'Host Event',
      description: 'Create an event',
      icon: '🎪',
      color: 'from-purple-500 to-pink-500',
      href: '/app/events/create'
    },
    {
      title: 'Earn Tokens',
      description: 'Complete tasks & earn rewards',
      icon: '🏆',
      color: 'from-yellow-500 to-orange-500',
      href: '/app/rewards'
    }
  ];

  const recentActivities = [
    {
      type: 'connection',
      message: 'Connected with Sarah Chen',
      time: '2 hours ago',
      icon: '🤝'
    },
    {
      type: 'community',
      message: 'Joined "Web3 Developers" community',
      time: '1 day ago',
      icon: '🏘️'
    },
    {
      type: 'event',
      message: 'Registered for "AI in 2024" event',
      time: '2 days ago',
      icon: '🎪'
    },
    {
      type: 'reward',
      message: 'Earned 50 tokens for profile completion',
      time: '3 days ago',
      icon: '🏆'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'User'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening in your network today
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Connections', value: stats.connections, icon: '🤝', color: 'bg-blue-500' },
            { label: 'Communities', value: stats.communities, icon: '🏘️', color: 'bg-green-500' },
            { label: 'Events', value: stats.events, icon: '🎪', color: 'bg-purple-500' },
            { label: 'Tokens', value: stats.tokens, icon: '🏆', color: 'bg-yellow-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Web3 Status */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Wallet Connected</h3>
                <p className="text-purple-100 mb-1">
                  Address: {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
                <p className="text-purple-100">
                  Balance: {parseFloat(balance || '0').toFixed(4)} ETH
                </p>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm text-purple-100 mt-1">Connected</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                  <span className="text-2xl">{action.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Recommendations</h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Suggested Connections</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Based on your skills and interests, we found 5 professionals you might want to connect with.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Suggestions →
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Community Matches</h4>
                <p className="text-sm text-gray-600 mb-3">
                  You might be interested in joining the "AI Ethics" community.
                </p>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                  Explore Community →
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Skill Development</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Consider adding "Blockchain Development" to your skills to increase your match rate.
                </p>
                <button className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                  Update Profile →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 