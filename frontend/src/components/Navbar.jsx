import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../auth/Auth';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isLoggedIn = !!getToken();

    const handleBack = () => {
        navigate(-1);
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-6">
                        <h1
                            onClick={() => navigate('/')}
                            className="text-xl font-bold text-blue-600 cursor-pointer"
                        >
                            StudentBuddy
                        </h1>
                        
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Home Button */}
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center px-3 py-2 border border-transparent 
                                       text-sm font-medium rounded-md text-blue-700 bg-blue-100 
                                       hover:bg-blue-200 focus:outline-none focus:ring-2 
                                       focus:ring-offset-2 focus:ring-blue-500 transition"
                        >
                            <svg
                                className="h-5 w-5 mr-1"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6" />
                            </svg>
                            Home
                        </button>
                        {location.pathname !== '/' && (
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center px-3 py-2 border border-transparent 
                                         text-sm font-medium rounded-md text-gray-700 bg-gray-100 
                                         hover:bg-gray-200 focus:outline-none focus:ring-2 
                                         focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg 
                                    className="h-5 w-5 mr-1" 
                                    fill="none" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>
                        )}

                        {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-transparent 
                                         text-sm font-medium rounded-md text-white bg-red-600 
                                         hover:bg-red-700 focus:outline-none focus:ring-2 
                                         focus:ring-offset-2 focus:ring-red-500"
                            >
                                <svg 
                                    className="h-5 w-5 mr-1" 
                                    fill="none" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="inline-flex items-center px-4 py-2 border border-transparent 
                                         text-sm font-medium rounded-md text-white bg-blue-600 
                                         hover:bg-blue-700 focus:outline-none focus:ring-2 
                                         focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg 
                                    className="h-5 w-5 mr-1" 
                                    fill="none" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                                                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />

                                </svg>
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;