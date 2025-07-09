import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'virtual' | 'in-person' | 'hybrid';
  price: number;
  attendees: number;
  maxAttendees: number;
  host: string;
  category: string;
  isRegistered: boolean;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock data for events
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Web3 Summit 2024',
        description: 'Join industry leaders for a comprehensive look at the future of Web3 technology.',
        date: '2024-03-15',
        time: '09:00 AM',
        location: 'San Francisco, CA',
        type: 'in-person',
        price: 299,
        attendees: 150,
        maxAttendees: 200,
        host: 'NexusVerse',
        category: 'Technology',
        isRegistered: false
      },
      {
        id: '2',
        title: 'AI Ethics Workshop',
        description: 'Interactive workshop on responsible AI development and ethical considerations.',
        date: '2024-03-20',
        time: '02:00 PM',
        location: 'Virtual',
        type: 'virtual',
        price: 0,
        attendees: 89,
        maxAttendees: 100,
        host: 'AI Ethics Community',
        category: 'AI',
        isRegistered: true
      },
      {
        id: '3',
        title: 'Startup Networking Mixer',
        description: 'Connect with fellow entrepreneurs and potential investors in a relaxed setting.',
        date: '2024-03-25',
        time: '06:00 PM',
        location: 'New York, NY',
        type: 'in-person',
        price: 50,
        attendees: 45,
        maxAttendees: 60,
        host: 'Startup Founders Community',
        category: 'Business',
        isRegistered: false
      }
    ];

    setEvents(mockEvents);
  }, []);

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.category.toLowerCase() === filter.toLowerCase()
  );

  const handleRegister = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isRegistered: !event.isRegistered }
        : event
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">Discover and join events hosted by our community</p>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex gap-2">
            {['all', 'technology', 'ai', 'business', 'sustainability'].map((category) => (
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

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.type === 'virtual' ? 'bg-blue-100 text-blue-800' :
                    event.type === 'in-person' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">{event.category}</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">📅</span>
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">🕒</span>
                    {event.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">📍</span>
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">👤</span>
                    {event.host}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">
                    {event.attendees}/{event.maxAttendees} attendees
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {event.price === 0 ? 'Free' : `$${event.price}`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/app/events/${event.id}`}
                    className="flex-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium text-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleRegister(event.id)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      event.isRegistered
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {event.isRegistered ? 'Registered' : 'Register'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Event CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Want to host an event?</h2>
          <p className="text-purple-100 mb-6">
            Create and host events to bring your community together
          </p>
          <Link
            to="/app/events/create"
            className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Create Event
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default EventsPage; 