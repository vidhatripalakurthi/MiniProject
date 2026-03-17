import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import loginImage from '../assets/login-illustration.png'; 

const Auth = () => {
    const [view, setView] = useState('login'); 
    const [formData, setFormData] = useState({ name: '', email: '', password: '', business_type: '', otp: '', new_password: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            if (view === 'login') {
                const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
                localStorage.setItem('token', res.data.token);
                navigate('/dashboard'); 
            } 
            else if (view === 'signup') {
                await api.post('/auth/register', { 
                    name: formData.name, email: formData.email, password: formData.password, business_type: formData.business_type 
                });
                setMessage('Registration successful! Please log in.');
                setView('login');
            }
            else if (view === 'forgot') {
                await api.post('/auth/forgot-password', { email: formData.email });
                setMessage('OTP sent to your email.');
                setView('reset');
            }
            else if (view === 'reset') {
                await api.post('/auth/reset-password', { 
                    email: formData.email, otp: formData.otp, new_password: formData.new_password 
                });
                setMessage('Password reset successful! Please log in.');
                setView('login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex font-sans text-gray-800 bg-white">
            
            {/* Left Side - Switched to Violet palette to match image */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-10 lg:px-16 xl:px-24 bg-gray-50/50">
                
                <div className="w-full max-w-md bg-white p-9 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100">
                    
                    <div className="text-center mb-7">
                        <h1 className="text-4xl font-extrabold text-violet-600 tracking-tight mb-2">TrendCast</h1>
                        <p className="text-sm text-gray-500 font-medium">Intelligent Demand Forecasting.</p>
                    </div>

                    <h2 className="text-2xl font-bold mb-1.5 text-gray-950 text-center">
                        {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create an Account' : view === 'forgot' ? 'Reset Password' : 'Enter OTP'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6 text-center">
                        {view === 'login' ? 'Enter your details to access your dashboard.' : view === 'signup' ? 'Sign up to start forecasting.' : 'Follow the steps to secure your account.'}
                    </p>

                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium text-center">{error}</div>}
                    {message && <div className="mb-4 p-3 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-medium text-center">{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {view === 'signup' && (
                            <>
                                <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-colors text-sm" />
                                <input type="text" name="business_type" placeholder="Business Type (e.g. Retail)" onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-colors text-sm" />
                            </>
                        )}
                        
                        {(view === 'login' || view === 'signup' || view === 'forgot' || view === 'reset') && (
                            <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-colors text-sm" />
                        )}

                        {(view === 'login' || view === 'signup') && (
                            <input type="password" name="password" placeholder="Password" onChange={handleChange} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-colors text-sm" />
                        )}

                        {view === 'reset' && (
                            <>
                                <input type="text" name="otp" placeholder="6-digit OTP" onChange={handleChange} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-colors text-sm" />
                                <input type="password" name="new_password" placeholder="New Password" onChange={handleChange} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-colors text-sm" />
                            </>
                        )}

                        <button type="submit" className="w-full bg-violet-600 text-white font-semibold py-3 rounded-lg hover:bg-violet-700 shadow-md hover:shadow-lg focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 transition-all duration-200 mt-4 text-sm">
                            {view === 'login' ? 'Sign In' : view === 'signup' ? 'Register' : view === 'forgot' ? 'Send OTP' : 'Reset Password'}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-sm text-gray-600 flex flex-col items-center space-y-1.5">
                        {view === 'login' && (
                            <>
                                <p>Don't have an account? <button onClick={() => setView('signup')} className="text-violet-600 hover:text-violet-800 font-semibold transition-colors">Sign up</button></p>
                                <button onClick={() => setView('forgot')} className="text-gray-500 hover:text-violet-600 font-medium transition-colors">Forgot Password?</button>
                            </>
                        )}
                        {view === 'signup' && (
                            <p>Already have an account? <button onClick={() => setView('login')} className="text-violet-600 hover:text-violet-800 font-semibold transition-colors">Log in</button></p>
                        )}
                        {(view === 'forgot' || view === 'reset') && (
                            <button onClick={() => setView('login')} className="text-gray-500 hover:text-violet-600 font-medium transition-colors">← Back to Login</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side - Custom Illustration, now Full Bleed */}
            <div className="hidden lg:block lg:w-1/2 relative bg-[#f4f0ff] overflow-hidden">
                <img 
                    src={loginImage} 
                    alt="Demand Forecasting Illustration" 
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
            </div>

        </div>
    );
};

export default Auth;