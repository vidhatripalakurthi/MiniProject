import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart2, History, User, LogOut } from 'lucide-react';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: 'Home', icon: <Home size={20} />, path: '/dashboard' },
        { name: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics' },
        { name: 'History', icon: <History size={20} />, path: '/history' },
        { name: 'Profile', icon: <User size={20} />, path: '/profile' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full transition-all duration-300">
                <div className="p-8">
                    <h1 className="text-2xl font-extrabold text-violet-600 tracking-tight">TrendCast</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                location.pathname === item.path
                                    ? 'bg-violet-50 text-violet-600'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-10">
                {children}
            </main>
        </div>
    );
};

export default Layout;