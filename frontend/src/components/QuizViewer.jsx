import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizHistory } from '../api_services/api_services';

function QuizViewer() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    const fetchQuizData = async () => {
        try {
            setLoading(true);
            const data = await getQuizHistory();
            
            // Find the specific quiz and its attempts
            const foundQuiz = data.quizzes?.find(q => q.id.toString() === quizId);
            if (foundQuiz && foundQuiz.attempts && foundQuiz.attempts.length > 0) {
                setQuiz(foundQuiz);
                // Get the latest attempt
                setAttempt(foundQuiz.attempts[0]);
            } else {
                setError('Quiz not found or no attempts available');
            }
        } catch (err) {
            setError('Failed to load quiz data');
            console.error('Error fetching quiz:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading quiz attempt...</p>
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

    if (!quiz || !attempt) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No quiz data available</p>
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

    const { content } = quiz;
    const { answers, score, total_questions } = attempt;
    const questions = content?.questions || [];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Quiz Review</h1>
                            <p className="text-gray-600 mt-2">{quiz.title}</p>
                            <p className="text-sm text-gray-500">From: {quiz.filename}</p>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            ← Back to Profile
                        </button>
                    </div>

                    {/* Score Summary */}
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <h3 className="text-2xl font-bold text-blue-800">{attempt.score}</h3>
                                <p className="text-blue-600">Score</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-blue-800">{attempt.total_questions}</h3>
                                <p className="text-blue-600">Total Questions</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-blue-800">
                                    {((attempt.score / attempt.total_questions) * 100).toFixed(1)}%
                                </h3>
                                <p className="text-blue-600">Percentage</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-blue-800">
                                    {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, '0')}
                                </h3>
                                <p className="text-blue-600">Time Taken</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions and Answers */}
                <div className="space-y-6">
                    {questions.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                            {Object.entries(section).map(([questionId, question]) => {
                                const uniqueId = `${sectionIndex}_${questionId}`;
                                const userAnswer = answers[uniqueId];
                                const isCorrect = userAnswer === question.answer;

                                return (
                                    <div key={uniqueId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                            {question.question}
                                        </h2>

                                        <div className="space-y-3">
                                            {['opt1', 'opt2', 'opt3', 'opt4'].map((optKey) => {
                                                const isUserAnswer = userAnswer === optKey;
                                                const isCorrectAnswer = question.answer === optKey;
                                                
                                                let buttonClass = 'w-full p-4 text-left rounded-lg border-2 transition-all ';
                                                
                                                if (isUserAnswer && isCorrectAnswer) {
                                                    // User selected correct answer
                                                    buttonClass += 'bg-green-50 border-green-500 text-green-700 font-medium';
                                                } else if (isUserAnswer && !isCorrectAnswer) {
                                                    // User selected wrong answer
                                                    buttonClass += 'bg-red-50 border-red-500 text-red-700 font-medium';
                                                } else if (!isUserAnswer && isCorrectAnswer) {
                                                    // Correct answer not selected by user
                                                    buttonClass += 'bg-green-50 border-green-300 text-green-600';
                                                } else {
                                                    // Other options
                                                    buttonClass += 'bg-gray-50 border-gray-200 text-gray-600';
                                                }

                                                return (
                                                    <div key={`${uniqueId}_${optKey}`} className={buttonClass}>
                                                        <div className="flex items-center justify-between">
                                                            <span>{question[optKey]}</span>
                                                            <div className="flex space-x-2">
                                                                {isUserAnswer && (
                                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                                        Your Answer
                                                                    </span>
                                                                )}
                                                                {isCorrectAnswer && (
                                                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                                                        Correct
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Result and Explanation */}
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className={`font-medium mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                {isCorrect 
                                                    ? '✓ Correct Answer!' 
                                                    : `✗ Incorrect - The correct answer was: ${question[question.answer]}`
                                                }
                                            </p>
                                            <p className="text-gray-700 leading-relaxed">
                                                <strong>Explanation:</strong> {question.explanation}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Bottom Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Quiz Completed</h3>
                    <p className="text-gray-600">
                        Completed on {new Date(attempt.completed_at).toLocaleDateString()} at {new Date(attempt.completed_at).toLocaleTimeString()}
                    </p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizViewer;
