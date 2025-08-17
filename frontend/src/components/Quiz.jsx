import React, { useContext, useState, useEffect } from 'react';
import { QuizContext } from '../context/QuizContext';
import { submitQuizAttempt, getQuizById } from '../api_services/api_services';
import { getToken } from '../auth/Auth';
import { useNavigate, useParams } from 'react-router-dom';

function Quiz() {
    const navigate = useNavigate();
    const { quizId } = useParams(); // Get quizId from route params
    const { quizQuestions, loading, error, currentQuizId, quizMetadata } = useContext(QuizContext);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showExplanation, setShowExplanation] = useState({});
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [submittingResults, setSubmittingResults] = useState(false);
    const [quizStartTime] = useState(new Date());
    
    // States for viewing existing quiz
    const [viewMode, setViewMode] = useState(false);
    const [viewQuizData, setViewQuizData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState('');

    // Load quiz data if quizId is provided in route
    useEffect(() => {
        if (quizId) {
            setViewMode(true);
            loadQuizData(quizId);
        }
    }, [quizId]);

    const loadQuizData = async (id) => {
        try {
            setViewLoading(true);
            setViewError('');
            const quiz = await getQuizById(id);
            console.log('Loaded quiz data:', quiz);
            console.log('Quiz content:', quiz.content);
            console.log('Quiz content questions:', quiz.content?.questions);
            setViewQuizData(quiz);
        } catch (err) {
            setViewError('Failed to load quiz data');
            console.error('Error loading quiz:', err);
        } finally {
            setViewLoading(false);
        }
    };

    const handleAnswerSelect = (sectionId, questionId, optKey) => {
        const uniqueId = `${sectionId}_${questionId}`;
        setSelectedAnswers(prev => ({
            ...prev,
            [uniqueId]: optKey
        }));
        setShowExplanation(prev => ({
            ...prev,
            [uniqueId]: true
        }));
    };

    console.log("Quiz Questions in Quiz Component:", quizQuestions); // Debugging

    const totalQuestions = quizQuestions ? 
        Object.values(quizQuestions).reduce((acc, section) => acc + Object.keys(section).length, 0) : 0;

    useEffect(() => {
        const correctAnswers = Object.entries(selectedAnswers).filter(([uniqueId, selected]) => {
            const [sectionId, questionId] = uniqueId.split('_');
            return selected === quizQuestions[sectionId][questionId].answer;
        }).length;

        setScore(correctAnswers);

        if (Object.keys(selectedAnswers).length === totalQuestions) {
            setShowScore(true);
        }
    }, [selectedAnswers, quizQuestions, totalQuestions]);

    const handleSubmitQuiz = async () => {
        if (!quizCompleted) {
            setQuizCompleted(true);
            return;
        }

        setSubmittingResults(true);

        try {
            const token = getToken();
            if (!token) {
                alert('Please log in to save your quiz results');
                return;
            }

            // Calculate time taken in seconds
            const timeTaken = Math.floor((new Date() - quizStartTime) / 1000);

            // Prepare quiz attempt data
            const attemptData = {
                quiz_id: currentQuizId || 1, // Use currentQuizId from context, fallback to 1
                answers: selectedAnswers,
                score: score,
                total_questions: totalQuestions,
                time_taken: timeTaken
            };

            await submitQuizAttempt(attemptData);
            setQuizCompleted(true);
            
            // Show success message and navigate home after a delay
            setTimeout(() => {
                navigate('/');
            }, 1500);
            
        } catch (error) {
            console.error('Error saving quiz results:', error);
            setError('Failed to save quiz results. Please try again.');
        } finally {
            setSubmittingResults(false);
        }
    };

    const handleDoneQuiz = async () => {
        if (!quizCompleted) {
            // First, save the results
            await handleSubmitQuiz();
        } else {
            // If already saved, just navigate home
            navigate('/');
        }
    };

    // Handle loading and error states
    if (viewMode) {
        if (viewLoading) return <div className="min-h-screen bg-gray-50 py-8"><div className="max-w-3xl mx-auto px-4 text-center">Loading quiz...</div></div>;
        if (viewError) return <div className="min-h-screen bg-gray-50 py-8"><div className="max-w-3xl mx-auto px-4 text-center text-red-600">{viewError}</div></div>;
        if (!viewQuizData) return <div className="min-h-screen bg-gray-50 py-8"><div className="max-w-3xl mx-auto px-4 text-center">Quiz not found.</div></div>;
    } else {
        if (loading) return <div>Loading...</div>;
        if (error) return <div>{error}</div>;
        if (!quizQuestions || !Object.keys(quizQuestions).length) {
            return (
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <p>No questions available.</p>
                        <div className="mt-4 text-xs text-gray-400">
                            <p>Quiz Questions: {JSON.stringify(quizQuestions)}</p>
                            <p>Current Quiz ID: {currentQuizId}</p>
                            <p>Loading: {loading.toString()}</p>
                            <p>Error: {error}</p>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Render view mode (existing quiz)
    if (viewMode && viewQuizData) {
        console.log('Rendering view mode with data:', viewQuizData);
        
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-gray-800">
                                {viewQuizData.title}
                            </h1>
                            <button
                                onClick={() => navigate('/profile')}
                                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Back to Profile
                            </button>
                        </div>
                        
                        <div className="mb-4 text-sm text-gray-600">
                            Total Questions: {viewQuizData.total_questions || 'Unknown'}
                        </div>
                        
                        <div className="space-y-6">
                            {viewQuizData.content && Array.isArray(viewQuizData.content) ? 
                                viewQuizData.content.map((section, sectionIndex) => (
                                    <div key={sectionIndex} className="border border-gray-200 rounded-lg p-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                            Section {sectionIndex + 1}
                                        </h4>
                                        
                                        {Object.entries(section).map(([questionKey, question], questionIndex) => (
                                            <div key={questionIndex} className="mb-6 last:mb-0">
                                                <div className="mb-3">
                                                    <h5 className="text-md font-medium text-gray-700 mb-2">
                                                        Question {questionIndex + 1}:
                                                    </h5>
                                                    <p className="text-gray-800 mb-3">{question.question}</p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    {['opt1', 'opt2', 'opt3', 'opt4'].map((optKey, optionIndex) => (
                                                        question[optKey] && (
                                                            <div key={optionIndex} className={`p-3 rounded-lg border ${
                                                                optKey === question.answer 
                                                                    ? 'bg-green-50 border-green-300' 
                                                                    : 'bg-gray-50 border-gray-200'
                                                            }`}>
                                                                <div className="flex items-center">
                                                                    <span className="text-sm font-medium text-gray-700 mr-2">
                                                                        {String.fromCharCode(65 + optionIndex)}:
                                                                    </span>
                                                                    <span className="text-gray-800">{question[optKey]}</span>
                                                                    {optKey === question.answer && (
                                                                        <span className="ml-auto text-green-600 text-sm font-medium">
                                                                            ✓ Correct Answer
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                                
                                                {question.explanation && (
                                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                                                        <p className="text-blue-700 text-sm">{question.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))
                                : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No quiz questions found or invalid format.</p>
                                        <div className="mt-4 text-xs text-gray-400">
                                            <pre>{JSON.stringify(viewQuizData, null, 2)}</pre>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Interactive Quiz
          </h1>
          
          {showScore && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
                Quiz Complete!
              </h2>
              <div className="text-center">
                <p className="text-xl text-blue-700">
                  Your Score: {score} / {totalQuestions}
                </p>
                <p className="text-lg text-blue-600 mt-2">
                  {(score / totalQuestions * 100).toFixed(1)}% Correct
                </p>
                
                <div className="mt-6">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingResults}
                    className={`px-8 py-3 rounded-lg font-semibold text-white transition-all
                      ${submittingResults 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : quizCompleted 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } shadow-lg hover:shadow-xl`}
                  >
                    {submittingResults ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving Results...
                      </>
                    ) : quizCompleted ? (
                      '✓ Results Saved to Profile'
                    ) : (
                      'Save Results to Profile'
                    )}
                  </button>
                  
                  {quizCompleted && (
                    <p className="text-sm text-green-600 mt-3">
                      Your quiz results have been saved to your profile with your answers and score!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {Object.entries(quizQuestions).map(([sectionId, section]) => (
            <div key={sectionId} className="mb-8">
              {Object.entries(section).map(([questionId, question]) => {
                const uniqueId = `${sectionId}_${questionId}`;
                return (
                  <div key={uniqueId} 
                       className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      {question.question}
                    </h2>
                    <div className="space-y-3">
                      {['opt1', 'opt2', 'opt3', 'opt4'].map((optKey) => (
                        <button
                          key={`${uniqueId}_${optKey}`}
                          onClick={() => handleAnswerSelect(sectionId, questionId, optKey)}
                          disabled={selectedAnswers[uniqueId]}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all
                            ${selectedAnswers[uniqueId] === optKey 
                              ? optKey === question.answer
                                ? 'bg-green-50 border-green-500 text-green-700 font-medium'
                                : 'bg-red-50 border-red-500 text-red-700 font-medium'
                              : selectedAnswers[uniqueId]
                                ? 'bg-gray-50 border-gray-200 text-gray-500'
                                : 'hover:bg-gray-50 hover:border-blue-300 border-gray-200 text-gray-700'
                            } ${!selectedAnswers[uniqueId] && 'hover:scale-[1.01]'}`}
                        >
                          {question[optKey]}
                        </button>
                      ))}
                    </div>
                    {showExplanation[uniqueId] && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className={`font-medium mb-2 ${
                          selectedAnswers[uniqueId] === question.answer
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {selectedAnswers[uniqueId] === question.answer
                            ? '✓ Correct Answer!'
                            : `✗ Incorrect - The correct answer was: ${question[question.answer]}`}
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Done Button at Bottom */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSubmitQuiz}
              disabled={submittingResults || Object.keys(selectedAnswers).length === 0}
              className={`px-8 py-4 rounded-lg font-semibold text-white transition-all text-lg
                ${submittingResults || Object.keys(selectedAnswers).length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : quizCompleted 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                } shadow-md`}
            >
              {submittingResults ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : quizCompleted ? (
                '✅ Saved'
              ) : (
                'Done'
              )}
            </button>
            
            {Object.keys(selectedAnswers).length === 0 && (
              <p className="text-sm text-gray-500 mt-3">
                Please answer at least one question before finishing the quiz.
              </p>
            )}
            
            {quizCompleted && (
              <p className="text-sm text-green-600 mt-3">
                ✅ Quiz results saved to your profile! Redirecting...
              </p>
            )}
            
            {showScore && (
              <p className="text-sm text-gray-600 mt-3">
                Your final score: {score}/{totalQuestions} ({(score / totalQuestions * 100).toFixed(1)}%)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
    );
}

export default Quiz;