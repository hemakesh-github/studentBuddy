import React, { useState, useRef, useEffect } from 'react';
import { solveDoubt, getDoubtHistory, getDoubtById } from '../api_services/api_services';
import { useParams } from 'react-router-dom';

const SUBJECT_OPTIONS = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "English", "History", "Geography", "Economics"
];

function DoubtSolver() {
    const { doubtId } = useParams();
    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([]);
    const [doubtLoaded, setDoubtLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // const [pdf, setPdf] = useState(null); // Commented out PDF functionality
    const [selectedSubject, setSelectedSubject] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [customSubject, setCustomSubject] = useState('');
    // const [showSettings, setShowSettings] = useState(false); // Removed settings toggle
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation, loading]);

    // Load doubt if doubtId is present
    useEffect(() => {
        const loadDoubt = async () => {
            if (!doubtId) return;
            try {
                const found = await getDoubtById(doubtId);
                if (found) {
                    setConversation(found.conversation_history || []);
                    setQuestion('');
                    setSubjects(found.subjects && typeof found.subjects === 'string' ? found.subjects.split(',').map(s => s.trim()) : found.subjects || []);
                }
            } catch (err) {
                // ignore
            }
        };
        loadDoubt();
    }, [doubtId]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [question]);

    const handleSubjectSelect = (subject) => {
        setSubjects(prev => 
            prev.includes(subject) 
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const handleCustomSubjectAdd = (e) => {
        e.preventDefault();
        const trimmed = customSubject.trim();
        if (trimmed && !subjects.includes(trimmed)) {
            setSubjects(prev => [...prev, trimmed]);
            setCustomSubject('');
        }
    };

    const handleCustomSubjectInput = (e) => setCustomSubject(e.target.value);
    
    const handleCustomSubjectKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCustomSubjectAdd(e);
        }
    };

    // Commented out PDF handlers
    // const handlePdfChange = (e) => setPdf(e.target.files[0]);
    // const handleRemovePdf = () => setPdf(null);

    // Image handlers
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }

            setImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    // Convert image to base64
    const convertImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim() || loading) return;
        
        setLoading(true);
        setError('');
        
        const userMessage = { role: 'user', content: question.trim() };
        const currentConversation = [...conversation, userMessage];
        setConversation(currentConversation);
        
        const currentQuestion = question.trim();
        setQuestion('');
        setIsFirstMessage(false);

        try {
            const data = await solveDoubt({
                question: currentQuestion,
                // pdf, // Commented out PDF
                image, // Add image to the request
                subjects,
                conversation: conversation
            });
            
            if (data?.answer) {
                setConversation(prev => [...prev, { role: 'ai', content: data.answer }]);
            } else {
                setError(data?.error || 'No answer received');
                setConversation(conversation);
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Failed to get answer. Please try again.');
            // Remove the user message if error
            setConversation(conversation);
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        setConversation([]);
        setQuestion('');
        setError('');
        setIsFirstMessage(true);
        // setPdf(null); // Commented out PDF
        setImage(null);
        setImagePreview(null);
        setSubjects([]);
    };

    const clearError = () => setError('');

    return (
        <div className="min-h-[92vh] bg-gradient-to-b from-blue-50 to-white flex flex-col">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">AI Doubt Solver</h1>
                                <p className="text-sm text-gray-500">Your intelligent study companion</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={startNewChat}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50"
                            >
                                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                New Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subject Selection Panel - Always Visible */}
            <div className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-200">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <label className="font-medium text-gray-700">
                                Select Subject(s) <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {SUBJECT_OPTIONS.map(subject => (
                                <button
                                    type="button"
                                    key={subject}
                                    onClick={() => handleSubjectSelect(subject)}
                                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                        subjects.includes(subject)
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                                    }`}
                                >
                                    {subject}
                                    {subjects.includes(subject) && (
                                        <span className="ml-2">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Custom Subject */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customSubject}
                                onChange={handleCustomSubjectInput}
                                onKeyDown={handleCustomSubjectKeyDown}
                                placeholder="Add custom subject"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={handleCustomSubjectAdd}
                                disabled={!customSubject.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Add
                            </button>
                        </div>

                        {/* Selected Subjects */}
                        {subjects.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {subjects.map((subject, index) => (
                                    <span key={`${subject}-${index}`} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {subject}
                                        <button
                                            type="button"
                                            onClick={() => handleSubjectSelect(subject)}
                                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Commented out PDF Upload Section */}
            {/* 
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <label className="font-medium text-gray-700">
                        Upload Context PDF <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                </div>
                
                <div className="space-y-3">
                    <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                        <div className="text-center">
                            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm text-gray-600">Click to upload PDF</span>
                        </div>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handlePdfChange}
                            className="sr-only"
                        />
                    </label>
                    
                    {pdf && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="flex-1 text-sm text-blue-800">{pdf.name}</span>
                            <button
                                type="button"
                                onClick={handleRemovePdf}
                                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            */}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-b border-red-200">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                            <button
                                onClick={clearError}
                                className="text-red-500 hover:text-red-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-6xl mx-auto h-full flex flex-col">
                    {conversation.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center max-w-md">
                                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Ask me anything!</h2>
                                <p className="text-gray-500 mb-6">I'm here to help solve your academic doubts with detailed explanations and step-by-step solutions.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto px-4 py-6">
                            <div className="space-y-6">
                                {conversation.map((msg, idx) => (
                                    <div key={`msg-${idx}`} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-3 max-w-4xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                msg.role === 'user' 
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                                            }`}>
                                                {msg.role === 'user' ? (
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className={`px-4 py-3 rounded-2xl ${
                                                msg.role === 'user' 
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
                                                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                                            }`}>
                                                <div className="whitespace-pre-wrap break-words leading-relaxed">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-3 max-w-4xl">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                            </div>
                                            <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                    <span className="ml-2 text-gray-500 text-sm">Thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    {/* Image Upload Section */}
                    <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">📎 Attach Image (Optional)</span>
                            {image && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="text-red-500 hover:text-red-700 transition-colors text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        
                        {!image ? (
                            <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                                <div className="text-center">
                                    <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">Click to upload image</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={loading}
                                />
                            </label>
                        ) : (
                            <div className="flex items-center gap-3">
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-16 h-16 object-cover rounded-lg border"
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 font-medium">{image.name}</p>
                                    <p className="text-xs text-gray-500">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legacy Image Preview - Remove this section */}
                    {/* {imagePreview && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Attached Image:</span>
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="max-w-xs max-h-32 object-contain rounded-lg border"
                            />
                        </div>
                    )} */}
                    
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                rows={1}
                                placeholder="Ask your academic doubt here... (Press Enter to send, Shift+Enter for new line)"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                style={{
                                    minHeight: '52px',
                                    maxHeight: '120px'
                                }}
                                disabled={loading}
                                maxLength={1000}
                            />
                            
                            {/* Character count */}
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                {question.length}/1000
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading || !question.trim()}
                            className={`px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
                                loading || !question.trim()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                            }`}
                        >
                            {loading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default DoubtSolver;