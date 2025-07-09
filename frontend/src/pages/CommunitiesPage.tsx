import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  isJoined: boolean;
  image: string;
  tags: string[];
}

const CommunitiesPage: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data for communities
    const mockCommunities: Community[] = [
      {
        id: '1',
        name: 'Web3 Developers',
        description: 'A community for blockchain and Web3 developers to share knowledge and collaborate on projects.',
        memberCount: 1247,
        category: 'Technology',
        isJoined: true,
        image: '🔗',
        tags: ['Blockchain', 'Web3', 'Development']
      },
      {
        id: '2',
        name: 'AI Ethics',
        description: 'Discussing the ethical implications of artificial intelligence and responsible AI development.',
        memberCount: 892,
        category: 'AI',
        isJoined: false,
        image: '🤖',
        tags: ['AI', 'Ethics', 'Responsible Tech']
      },
      {
        id: '3',
        name: 'Sustainable Tech',
        description: 'Exploring technology solutions for environmental sustainability and climate action.',
        memberCount: 567,
        category: 'Sustainability',
        isJoined: false,
        image: '🌱',
        tags: ['Sustainability', 'Climate', 'Green Tech']
      },
      {
        id: '4',
        name: 'Startup Founders',
        description: 'Connect with fellow entrepreneurs and share insights on building successful startups.',
        memberCount: 2341,
        category: 'Business',
        isJoined: true,
        image: '🚀',
        tags: ['Startups', 'Entrepreneurship', 'Business']
      },
      {
        id: '5',
        name: 'Remote Work',
        description: 'Tips, tools, and strategies for effective remote work and distributed teams.',
        memberCount: 1567,
        category: 'Work',
        isJoined: false,
        image: '🏠',
        tags: ['Remote Work', 'Productivity', 'Work-Life Balance']
      },
      {
        id: '6',
        name: 'Data Science',
        description: 'Advanced discussions on data science, machine learning, and analytics.',
        memberCount: 987,
        category: 'Technology',
        isJoined: false,
        image: '📊',
        tags: ['Data Science', 'ML', 'Analytics']
      }
    ];

    setCommunities(mockCommunities);
  }, []);

  const filteredCommunities = communities.filter(community => {
    const matchesFilter = filter === 'all' || community.category.toLowerCase() === filter.toLowerCase();
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = ['all', 'technology', 'ai', 'sustainability', 'business', 'work'];

  const handleJoinCommunity = (communityId: string) => {
    setCommunities(prev => prev.map(community => 
      community.id === communityId 
        ? { ...community, isJoined: !community.isJoined }
        : community
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Communities</h1>
          <p className="text-gray-600">Discover and join micro-communities that match your interests</p>
        </motion.div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === category
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community, index) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{community.image}</span>
                  </div>
                  <span className="text-sm text-gray-500">{community.category}</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{community.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{community.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {community.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {community.memberCount.toLocaleString()} members
                  </span>
                  <div className="flex gap-2">
                    <Link
                      to={`/app/communities/${community.id}`}
                      className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleJoinCommunity(community.id)}
                      className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                        community.isJoined
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      {community.isJoined ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Community CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Can't find the right community?</h2>
          <p className="text-purple-100 mb-6">
            Create your own micro-community and bring together like-minded professionals
          </p>
          <Link
            to="/app/communities/create"
            className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Create Community
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default CommunitiesPage; 