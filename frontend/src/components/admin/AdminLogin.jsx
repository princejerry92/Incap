import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockClosedIcon, ArrowPathIcon, ShieldCheckIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Username, 2: Password
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

    const handleInitLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/auth/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (data.success) {
                setGeneratedPassword(data.password);
                setStep(2);
            } else {
                setError(data.detail || 'Failed to initiate login');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('adminToken', data.access_token);
                navigate('/admin/dashboard');
            } else {
                setError(data.detail || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Hide after 2 seconds
        } catch (err) {
            setError('Failed to copy password to clipboard');
            setTimeout(() => setError(''), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-sm border-2 border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md relative overflow-hidden">
                {/* Neumorphism effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200/50 to-gray-300/50 rounded-3xl"></div>
                <div className="absolute inset-0 bg-white/50 shadow-inner rounded-3xl"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
                            <ShieldCheckIcon className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h2>
                        <p className="text-sm text-gray-600">Secure access to admin panel</p>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center justify-center mb-6">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <UserIcon className="h-6 w-6" />
                        </div>
                        <div className={`w-12 h-0.5 mx-2 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <LockClosedIcon className="h-6 w-6" />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 text-center text-sm shadow-sm">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleInitLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400"
                                        placeholder="Enter your admin username"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {loading ? (
                                    <>
                                        <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <div className="ml-2 w-0 group-hover:w-4 transition-all duration-300 overflow-hidden">&rarr;</div>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {/* Generated password display */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-4 shadow-inner">
                                <div className="flex items-center justify-center mb-2">
                                    <LockClosedIcon className="h-5 w-5 text-gray-600 mr-2" />
                                    <p className="text-sm font-medium text-gray-700">Your disposable password:</p>
                                </div>
                                <div className="bg-white/70 border border-gray-300 rounded-lg p-3 shadow-sm flex items-center justify-between">
                                    <span className="font-mono text-lg font-bold text-gray-800 flex-1 text-center">
                                        {generatedPassword}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyPassword}
                                        className="ml-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 hover:shadow-sm"
                                        title="Copy password to clipboard"
                                    >
                                        {copied ? (
                                            <CheckIcon className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-2">Copy this password to login</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="block w-full pl-10 pr-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400"
                                            placeholder="Enter the generated password"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                >
                                    {loading ? (
                                        <>
                                            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                                            Logging in...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-center text-blue-600 hover:text-blue-800 font-medium py-2 rounded-xl hover:bg-blue-50 transition-colors duration-200"
                            >
                                ← Back to Username
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
