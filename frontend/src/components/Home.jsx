import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../auth/Auth';

function Home() {
    const navigate = useNavigate();

    

    const handleCreateQuiz = () => {
        navigate('/createQuiz');
    };

    const handleDoubtSolving = () => {
        // Placeholder for doubt solving feature
        console.log('Doubt solving feature coming soon!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        Welcome to <span className="text-blue-600">StudentBuddy</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Your AI-powered learning companion that transforms study materials into interactive quizzes and helps solve your doubts.
                    </p>
                </div>

                {/* Main Features Section */}
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 mb-16">
                    {/* Quiz Generation Feature */}
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Quiz Generation</h2>
                        <div className="space-y-4 mb-8 text-gray-500">
                            <p>Upload your study materials and let our AI create comprehensive quizzes instantly.</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Smart question generation from your content</li>
                                <li>Multiple choice questions with explanations</li>
                                <li>Instant feedback on your answers</li>
                                <li>Track your progress and understanding</li>
                            </ul>
                        </div>
                        <button
                            onClick={handleCreateQuiz}
                            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create New Quiz
                        </button>
                    </div>

                    {/* Doubt Solving Feature */}
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Doubt Solving</h2>
                        <div className="space-y-4 mb-8 text-gray-500">
                            <p>Get instant solutions to your academic doubts using our AI assistant.</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Clear explanations for complex concepts</li>
                                <li>Step-by-step problem solving</li>
                                <li>24/7 availability for quick help</li>
                                <li>Support across multiple subjects</li>
                            </ul>
                        </div>
                        <button
                            onClick={handleDoubtSolving}
                            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ask a Doubt (Coming Soon)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;