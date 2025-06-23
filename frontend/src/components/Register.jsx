import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { performRegister } from '../api_services/api_services';

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                email,
                username,
                password,
            };
            console.log(data);
            const response = await performRegister(data);
            console.log(response);
            navigate('/login');
        } catch (err) {
            const errorDetail = err.response?.data?.detail || 'Registration failed';
            setError(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
                    Create Account
                </h1>
                <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
                                             shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="Enter your username"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
                                             shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
                                             shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
                                         shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                         transition-colors duration-200"
                            >
                                Register
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link
                                to="/login"
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md 
                                         shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                         transition-colors duration-200"
                            >
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;