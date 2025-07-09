import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const CommunityDetailPage: React.FC = () => {
  const { id } = useParams();
  const [community, setCommunity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock community data
    setCommunity({
      id,
      name: 'Web3 Developers',
      description: 'A community for blockchain and Web3 developers to share knowledge and collaborate on projects.',
      memberCount: 1247,
      category: 'Technology',
      isJoined: true,
      image: '🔗',
      tags: ['Blockchain', 'Web3', 'Development'],
      posts: [
        {
          id: '1',
          author: 'Sarah Chen',
          content: 'Just deployed my first smart contract! Any tips for gas optimization?',
          timestamp: '2 hours ago',
          likes: 12,
          comments: 5
        },
        {
          id: '2',
          author: 'Mike Johnson',
          content: 'Great article on Layer 2 scaling solutions. Highly recommend checking it out.',
          timestamp: '1 day ago',
          likes: 8,
          comments: 3
        }
      ],
      events: [
        {
          id: '1',
          title: 'Web3 Workshop',
          date: '2024-03-20',
          attendees: 45
        }
      ]
    });
  }, [id]);

  if (!community) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-3xl">{community.image}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
                <p className="text-gray-600">{community.category}</p>
              </div>
            </div>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
              {community.isJoined ? 'Leave Community' : 'Join Community'}
            </button>
          </div>

          <p className="text-gray-700 mb-4">{community.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {community.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>{community.memberCount.toLocaleString()} members</span>
            <span>Created 2 months ago</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex space-x-8 mb-6">
            {['overview', 'discussions', 'events', 'members'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Discussions</h3>
                <div className="space-y-4">
                  {community.posts.map((post: any) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{post.author}</span>
                        <span className="text-sm text-gray-500">{post.timestamp}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{post.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>👍 {post.likes}</span>
                        <span>💬 {post.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discussions' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Discussions</h3>
              <p className="text-gray-600">Discussion content would go here...</p>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Events</h3>
              <div className="space-y-4">
                {community.events.map((event: any) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.date} • {event.attendees} attendees</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
              <p className="text-gray-600">Member list would go here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityDetailPage; 