import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  BellIcon, 
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/store/slices/authSlice';
import { useWeb3 } from '@/hooks/useWeb3';
import { User } from '@/store/slices/authSlice';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { account, connect, disconnect, isConnected } = useWeb3();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleWalletConnect = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search placeholder */}
        <div className="relative flex flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="search"
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search..."
          />
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Wallet connection */}
          <button
            onClick={handleWalletConnect}
            className={`flex items-center gap-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isConnected
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <WalletIcon className="h-5 w-5" />
            <span className="hidden sm:block">
              {isConnected ? account?.slice(0, 6) + '...' + account?.slice(-4) : 'Connect Wallet'}
            </span>
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              {user?.avatar ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.avatar}
                  alt={user.firstName}
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/app/profile')}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left`}
                    >
                      Your profile
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/app/settings')}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left`}
                    >
                      Settings
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header; 