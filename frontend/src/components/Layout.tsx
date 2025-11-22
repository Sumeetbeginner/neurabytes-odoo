import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  PackageCheck,
  PackageMinus,
  ArrowLeftRight,
  ClipboardList,
  History,
  Warehouse,
  User,
  LogOut,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Receipts', path: '/receipts', icon: PackageCheck },
    { name: 'Deliveries', path: '/deliveries', icon: PackageMinus },
    { name: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { name: 'Adjustments', path: '/adjustments', icon: ClipboardList },
    { name: 'Move History', path: '/moves', icon: History },
    { name: 'Warehouses', path: '/settings/warehouses', icon: Warehouse },
    { name: 'Help', path: '/help', icon: HelpCircle },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 bg-primary-600">
            <h1 className="text-xl font-bold text-white">StockMaster</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
            >
              <User size={18} className="mr-3" />
              Profile
            </Link>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut size={18} className="mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
            {/* Same content as desktop sidebar */}
            <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
              <h1 className="text-xl font-bold text-white">StockMaster</h1>
              <button onClick={() => setSidebarOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                    {user?.firstName[0]}{user?.lastName[0]}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
              >
                <User size={18} className="mr-3" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={18} className="mr-3" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-64">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold">StockMaster</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

