import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <MobileMenu open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} />
        
        {/* Main content area */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 