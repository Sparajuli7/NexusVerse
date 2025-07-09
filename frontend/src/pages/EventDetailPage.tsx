import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Mock event data
    setEvent({
      id,
      title: 'Web3 Summit 2024',
      description: 'Join industry leaders for a comprehensive look at the future of Web3 technology. This event will feature keynote speakers, panel discussions, workshops, and networking opportunities.',
      date: '2024-03-15',
      time: '09:00 AM - 06:00 PM',
      location: 'San Francisco Convention Center, 123 Main St, San Francisco, CA 94105',
      type: 'in-person',
      price: 299,
      attendees: 150,
      maxAttendees: 200,
      host: 'NexusVerse',
      category: 'Technology',
      agenda: [
        { time: '09:00 AM', title: 'Registration & Welcome Coffee' },
        { time: '09:30 AM', title: 'Keynote: The Future of Web3' },
        { time: '10:30 AM', title: 'Panel: DeFi Innovation' },
        { time: '12:00 PM', title: 'Lunch & Networking' },
        { time: '01:30 PM', title: 'Workshop: Smart Contract Development' },
        { time: '03:00 PM', title: 'Panel: NFT & Gaming' },
        { time: '04:30 PM', title: 'Networking & Closing Remarks' }
      ],
      speakers: [
        { name: 'Dr. Sarah Chen', title: 'CTO at BlockchainCorp', avatar: '👩‍💼' },
        { name: 'Mike Johnson', title: 'Founder of DeFi Protocol', avatar: '👨‍💼' },
        { name: 'Alex Rodriguez', title: 'Lead Developer at Web3 Labs', avatar: '👨‍💻' }
      ]
    });
  }, [id]);

  if (!event) {
    return <div>Loading...</div>;
  }

  const handleRegister = () => {
    setIsRegistered(!isRegistered);
  };

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-gray-600">{event.category} • Hosted by {event.host}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">${event.price}</p>
              <p className="text-sm text-gray-500">{event.attendees}/{event.maxAttendees} registered</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              <span className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🕒</span>
              <span className="text-sm text-gray-600">{event.time}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📍</span>
              <span className="text-sm text-gray-600">{event.location}</span>
            </div>
          </div>

          <p className="text-gray-700 mb-6">{event.description}</p>

          <button
            onClick={handleRegister}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              isRegistered
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            {isRegistered ? 'Registered' : 'Register for Event'}
          </button>
        </motion.div>

        {/* Agenda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agenda</h2>
          <div className="space-y-4">
            {event.agenda.map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium text-gray-500">{item.time}</div>
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Speakers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Speakers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {event.speakers.map((speaker: any, index: number) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">{speaker.avatar}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{speaker.name}</h3>
                <p className="text-sm text-gray-600">{speaker.title}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Event Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What to Bring</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Business cards for networking</li>
                <li>• Laptop for workshops</li>
                <li>• Questions for speakers</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What's Included</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Full-day conference access</li>
                <li>• Lunch and refreshments</li>
                <li>• Networking opportunities</li>
                <li>• Workshop materials</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EventDetailPage; 