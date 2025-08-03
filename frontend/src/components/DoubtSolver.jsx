import React, { useState } from 'react';
import { solveDoubt } from '../api_services/api_services';

const SUBJECT_OPTIONS = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "English", "History", "Geography", "Economics"
];

function DoubtSolver() {
    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([]); // {role: 'user'|'ai', content: string}
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdf, setPdf] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [customSubject, setCustomSubject] = useState('');
    const [clarification, setClarification] = useState('');

    const handleSubjectSelect = (subject) => {
        if (subjects.includes(subject)) {
            setSubjects(subjects.filter(s => s !== subject));
        } else {
            setSubjects([...subjects, subject]);
        }
    };

    const handleCustomSubjectAdd = (e) => {
        e.preventDefault();
        const trimmed = customSubject.trim();
        if (trimmed && !subjects.includes(trimmed)) {
            setSubjects([...subjects, trimmed]);
        }
        setCustomSubject('');
    };

    const handleCustomSubjectInput = (e) => setCustomSubject(e.target.value);
    const handleCustomSubjectKeyDown = (e) => {
        if (e.key === 'Enter') handleCustomSubjectAdd(e);
    };

    const handlePdfChange = (e) => setPdf(e.target.files[0]);
    const handleRemovePdf = () => setPdf(null);

    // Initial question submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await solveDoubt({
                question,
                pdf,
                subjects,
                conversation: [] // No history for first question
            });
            if (data.answer) {
                setConversation([
                    { role: 'user', content: question },
                    { role: 'ai', content: data.answer }
                ]);
            } else {
                setError(data.error || 'No answer received');
            }
        } catch (err) {
            setError('Failed to get answer');
        }
        setLoading(false);
    };

    // Clarification/chat submit
    const handleClarify = async (e) => {
        e.preventDefault();
        if (!clarification.trim()) return;
        setLoading(true);
        setError('');
        try {
            const newConversation = [
                ...conversation,
                { role: 'user', content: clarification }
            ];
            const data = await solveDoubt({
                question,
                pdf,
                subjects,
                conversation: newConversation
            });
            if (data.answer) {
                setConversation([
                    ...newConversation,
                    { role: 'ai', content: data.answer }
                ]);
                setClarification('');
            } else {
                setError(data.error || 'No answer received');
            }
        } catch (err) {
            setError('Failed to get clarification');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-100 mx-auto">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-90 h-100">
                    <div className="px-6 py-8 sm:p-10">
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                                AI Doubt Solving
                            </h1>
                            <p className="text-gray-500 mb-8">
                                Get instant solutions to your academic doubts using our AI assistant.
                            </p>
                        </div>
                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                            {/* Subject Multi-Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Subject(s) <span className="text-gray-400">(optional)</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {SUBJECT_OPTIONS.map(subject => (
                                        <button
                                            type="button"
                                            key={subject}
                                            onClick={() => handleSubjectSelect(subject)}
                                            className={`px-3 py-1 rounded-full border text-sm transition
                                                ${subjects.includes(subject)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}
                                            `}
                                        >
                                            {subject}
                                            {subjects.includes(subject) && (
                                                <span className="ml-1 text-xs">&#10003;</span>
                                            )}
                                        </button>
                                    ))}
                                    {/* Custom subject input */}
                                    <input
                                        type="text"
                                        value={customSubject}
                                        onChange={handleCustomSubjectInput}
                                        onKeyDown={handleCustomSubjectKeyDown}
                                        placeholder="Add other subject"
                                        className="px-3 py-1 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 h-40"
                                        style={{ minWidth: 120, height:"35vh" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCustomSubjectAdd}
                                        className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-sm hover:bg-blue-200 transition"
                                        disabled={!customSubject.trim()}
                                    >
                                        Add
                                    </button>
                                </div>
                                {subjects.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {subjects.map(subject => (
                                            <span key={subject} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                {subject}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubjectSelect(subject)}
                                                    className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* PDF Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Upload Context PDF <span className="text-gray-400">(optional)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 transition">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-sm">Choose PDF</span>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfChange}
                                            className="sr-only"
                                        />
                                    </label>
                                    {pdf && (
                                        <span className="flex items-center bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs">
                                            {pdf.name}
                                            <button
                                                type="button"
                                                onClick={handleRemovePdf}
                                                className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                                                title="Remove"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <textarea
                                className="w-full border rounded p-2"
                                rows={4}
                                placeholder="Type your academic doubt here..."
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                disabled={conversation.length > 0}
                            />

                            <button
                                type="submit"
                                disabled={loading || !question || conversation.length > 0}
                                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent 
                                    text-base font-medium rounded-md text-white bg-blue-600 
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'} 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                    transition-colors duration-200`}
                            >
                                {loading ? 'Solving...' : 'Solve Doubt'}
                            </button>
                        </form>

                        {/* Chat Conversation */}
                        {conversation.length > 0 && (
                            <div className="mt-6">
                                <div className="space-y-4 max-h-80 overflow-y-auto">
                                    {conversation.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleClarify} className="mt-4 flex gap-2">
                                    <input
                                        className="flex-1 border rounded p-2"
                                        placeholder="Type a clarification or follow-up..."
                                        value={clarification}
                                        onChange={e => setClarification(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !clarification.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
                                    >
                                        {loading ? "..." : "Send"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoubtSolver;