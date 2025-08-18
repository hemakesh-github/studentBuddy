import React, { useState, useEffect } from 'react';
import { getUserProfile, getQuizHistory, getDoubtHistory, downloadFile } from '../api_services/api_services';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [quizHistory, setQuizHistory] = useState([]);
    const [doubtHistory, setDoubtHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('quizzes');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [downloadingFiles, setDownloadingFiles] = useState(new Set());

    useEffect(() => {
        fetchProfileData();
        fetchQuizHistory();
        fetchDoubtHistory();
    }, []);

    const handleTabChange = async (tab) => {
        setActiveTab(tab);
    };


    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const profileData = await getUserProfile();
            console.log('Profile Data:', profileData);
            setProfile(profileData);
        } catch (err) {
            setError('Failed to load profile data');
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizHistory = async () => {
        try {
            const quizData = await getQuizHistory();
console.log('Quiz Data:', quizData);
            setQuizHistory(quizData.quizzes || []);
        } catch (err) {
            setError('Failed to load quiz history');
        }
    };

    const fetchDoubtHistory = async () => {
        try {
            const doubtData = await getDoubtHistory();
            setDoubtHistory(doubtData.doubts || []);
            
            // Extract unique subjects from doubts
            const subjects = new Set();
            doubtData.doubts?.forEach(doubt => {
                if (doubt.subjects) {
                    // Handle both string and array subjects
                    if (typeof doubt.subjects === 'string') {
                        doubt.subjects.split(',').forEach(subject => subjects.add(subject.trim()));
                    } else if (Array.isArray(doubt.subjects)) {
                        doubt.subjects.forEach(subject => subjects.add(subject));
                    }
                }
            });
            setAvailableSubjects(['all', ...Array.from(subjects)]);
        } catch (err) {
            setError('Failed to load doubt history');
        }
    };

    const handleDownloadFile = async (quizId, filename) => {
        try {
            setDownloadingFiles(prev => new Set(prev).add(quizId));
            await downloadFile(quizId, filename);
        } catch (err) {
            setError('Failed to download file');
            console.error('Download error:', err);
        } finally {
            setDownloadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(quizId);
                return newSet;
            });
        }
    };

    const viewQuiz = async (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={fetchProfileData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {profile?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-800">{profile?.username}</h1>
                            <p className="text-gray-600">{profile?.email}</p>
                            
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Quizzes</p>
                                <p className="text-2xl font-bold text-gray-800">{profile?.total_quizzes || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Doubts</p>
                                <p className="text-2xl font-bold text-gray-800">{profile?.total_doubts || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => handleTabChange('quizzes')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                                    activeTab === 'quizzes'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Quiz History
                            </button>
                            <button
                                onClick={() => handleTabChange('doubts')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                                    activeTab === 'doubts'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Doubt History
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'quizzes' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz History</h3>
                                {quizHistory.length > 0 ? (
                                    <div className="space-y-4">
                                        {quizHistory.map((quiz) => (
                                            <div key={quiz.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-lg font-medium text-gray-800">{quiz.title}</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => viewQuiz(quiz.id)}
                                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                                                        >
                                                            View Quiz
                                                        </button>
                                                        {quiz.filename && (
                                                            <button
                                                                onClick={() => handleDownloadFile(quiz.id, quiz.filename)}
                                                                disabled={downloadingFiles.has(quiz.id)}
                                                                className={`px-3 py-1 text-sm rounded-lg transition-colors cursor-pointer flex items-center space-x-2 ${
                                                                    downloadingFiles.has(quiz.id)
                                                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                }`}
                                                            >
                                                                {downloadingFiles.has(quiz.id) && (
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                )}
                                                                <span>
                                                                    {downloadingFiles.has(quiz.id) ? 'Downloading...' : 'Download File'}
                                                                </span>
                                                            </button>
                                                        )}
                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(quiz.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* {quiz.attempts && quiz.attempts.length > 0 && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                                                            Attempts ({quiz.total_attempts || quiz.attempts.length}) - Best Score: {quiz.best_score || 'N/A'}%
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {(quiz.attempts || []).slice(0, 3).map((attempt) => (
                                                                <div key={attempt.id} className="flex items-center justify-between text-sm bg-white p-3 rounded border">
                                                
                                                                    <div className="flex items-center space-x-3">
                                                                        <span className="text-gray-500">
                                                                            {formatDate(attempt.completed_at)}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => navigate(`/quiz-viewer/${quiz.id}`)}
                                                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer"
                                                                        >
                                                                            View Quiz
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )} */}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No quizzes found</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'doubts' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Doubt History</h3>
                                    
                                    {/* Subject Filter */}
                                    {availableSubjects.length > 1 && (
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600">Filter by subject:</span>
                                            <select
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {availableSubjects.map(subject => (
                                                    <option key={subject} value={subject}>
                                                        {subject === 'all' ? 'All Subjects' : subject}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                
                                {doubtHistory.length > 0 ? (
                                    <div className="space-y-4">
                                        {doubtHistory
                                            .filter(doubt => {
                                                if (selectedSubject === 'all') return true;
                                                
                                                if (doubt.subjects) {
                                                    // Handle both string and array subjects
                                                    if (typeof doubt.subjects === 'string') {
                                                        return doubt.subjects.split(',').map(s => s.trim()).includes(selectedSubject);
                                                    } else if (Array.isArray(doubt.subjects)) {
                                                        return doubt.subjects.includes(selectedSubject);
                                                    }
                                                }
                                                return false;
                                            })
                                            .map((doubt) => (
                                            <div key={doubt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-medium text-gray-800 mb-2">
                                                            {doubt.question}
                                                        </h4>
                                                        {doubt.subjects && (
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {(typeof doubt.subjects === 'string' 
                                                                    ? doubt.subjects.split(',').map(s => s.trim())
                                                                    : doubt.subjects
                                                                ).map((subject, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                                            selectedSubject === subject 
                                                                                ? 'bg-blue-600 text-white' 
                                                                                : 'bg-blue-100 text-blue-800'
                                                                        }`}
                                                                    >
                                                                        {subject}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 ml-4">
                                                        {formatDate(doubt.created_at)}
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Answer:</h5>
                                                            <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-3">{doubt.answer}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/doubt/${doubt.id}`)}
                                                            className="ml-4 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex-shrink-0 cursor-pointer"
                                                        >
                                                            View Full
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {doubt.context_filename && (
                                                    <div className="mt-2">
                                                        <span className="text-xs text-gray-500">
                                                            📎 Context file: {doubt.context_filename}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-gray-500">
                                            {selectedSubject === 'all' ? 'No doubts found' : `No doubts found for ${selectedSubject}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
