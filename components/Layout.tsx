import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sprout, TrendingUp, RefreshCw, PlusCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/market', label: 'Market', icon: TrendingUp },
    { path: '/planner', label: 'Rotation', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <Sprout className="fill-green-600 text-white" /> AgroSmart
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                    ? 'bg-green-50 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
             );
          })}
        </nav>
        <div className="p-4">
            <Link to="/add-crop" className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors shadow-sm">
                <PlusCircle size={20} /> Add Crop
            </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white p-4 sticky top-0 z-20 border-b border-gray-200 flex justify-between items-center">
         <h1 className="text-xl font-bold text-green-600 flex items-center gap-2">
            <Sprout className="fill-green-600 text-white" /> AgroSmart
         </h1>
         <Link to="/add-crop" className="text-green-600">
            <PlusCircle size={24} />
         </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20 pb-safe">
        {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
            <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 text-xs ${
                isActive ? 'text-green-600 font-medium' : 'text-gray-500'
                }`}
            >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
            </Link>
            );
        })}
      </nav>
    </div>
  );
};

export default Layout;