import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoubtHistory } from '../api_services/api_services';

function DoubtViewer() {
    const { doubtId } = useParams();
    const navigate = useNavigate();
    const [doubt, setDoubt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDoubtData();
    }, [doubtId]);

    const fetchDoubtData = async () => {
        try {
            setLoading(true);
            const data = await getDoubtHistory();
            
            // Find the specific doubt
            const foundDoubt = data.doubts?.find(d => d.id.toString() === doubtId);
            if (foundDoubt) {
                setDoubt(foundDoubt);
            } else {
                setError('Doubt not found');
            }
        } catch (err) {
            setError('Failed to load doubt data');
            console.error('Error fetching doubt:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading doubt...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    if (!doubt) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No doubt data available</p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    const subjects = doubt.subjects ? 
        (typeof doubt.subjects === 'string' ? doubt.subjects.split(',').map(s => s.trim()) : doubt.subjects) : 
        [];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Doubt Review</h1>
                        <button
                            onClick={() => navigate('/profile')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Back to Profile
                        </button>
                    </div>

                    {/* Subjects */}
                    {subjects.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Subjects:</h3>
                            <div className="flex flex-wrap gap-2">
                                {subjects.map((subject, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                    >
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    <p className="text-sm text-gray-500 mb-6">
                        Asked on: {new Date(doubt.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>

                    {/* Question */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Question:</h2>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="text-gray-700 leading-relaxed">{doubt.question}</p>
                        </div>
                    </div>

                    {/* Answer */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Answer:</h2>
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                            <div className="prose max-w-none">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{doubt.answer}</p>
                            </div>
                        </div>
                    </div>

                    {/* Context File */}
                    {doubt.context_filename && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Context File:</h3>
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-gray-600 text-sm">{doubt.context_filename}</span>
                            </div>
                        </div>
                    )}

                    {/* Conversation History */}
                    {doubt.conversation_history && Array.isArray(doubt.conversation_history) && doubt.conversation_history.length > 2 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Conversation History:</h2>
                            <div className="space-y-4">
                                {doubt.conversation_history.map((message, index) => (
                                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-3xl p-4 rounded-lg ${
                                            message.role === 'user' 
                                                ? 'bg-blue-100 text-blue-900 ml-12' 
                                                : 'bg-gray-100 text-gray-900 mr-12'
                                        }`}>
                                            <div className="flex items-center mb-2">
                                                <span className="text-xs font-medium uppercase tracking-wide">
                                                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DoubtViewer;
