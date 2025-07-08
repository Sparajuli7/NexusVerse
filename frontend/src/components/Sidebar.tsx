import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { RootState } from '@/store';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: HomeIcon },
  { name: 'Communities', href: '/app/communities', icon: UserGroupIcon },
  { name: 'Events', href: '/app/events', icon: CalendarIcon },
  { name: 'Profile', href: '/app/profile', icon: UserIcon },
  { name: 'Analytics', href: '/app/analytics', icon: ChartBarIcon },
  { name: 'Payments', href: '/app/payments', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
];

const Sidebar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <img
            className="h-8 w-auto"
            src="/logo.svg"
            alt="NexusVerse"
          />
          <span className="ml-2 text-xl font-bold text-gray-900">NexusVerse</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          isActive
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-x-3">
                  {user?.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar}
                      alt={user.firstName}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.firstName?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-6 text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-5 text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user?.subscription === 'premium' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : user?.subscription === 'enterprise'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user?.subscription}
                    </span>
                    {user?.walletAddress && (
                      <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 