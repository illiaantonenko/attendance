import React, { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/contexts/ThemeContext';

export default function GuestLayout({ children }: PropsWithChildren) {
    const { toggleTheme, isDark } = useTheme();

    return (
        <div 
            className="min-h-screen transition-colors duration-300" 
            style={{ background: isDark ? 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' : 'linear-gradient(to bottom right, #f1f5f9, #f8fafc, #ffffff)' }}
        >
            {/* Background Pattern */}
            <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI5M2YiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzIiBjeT0iMyIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] ${isDark ? 'opacity-40' : 'opacity-5'}`}></div>

            <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
                {/* Theme Toggle - integrated with logo */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 rounded-full transition-all duration-300 ${
                            isDark 
                                ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-lg shadow-slate-900/50' 
                                : 'bg-white text-slate-600 hover:bg-slate-100 shadow-md'
                        }`}
                        aria-label="Змінити тему"
                    >
                        {isDark ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Logo */}
                <Link href="/" className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            Attendance
                        </span>
                    </div>
                </Link>

                {/* Main Content */}
                <div className="w-full max-w-md animate-fade-in">
                    {children}
                </div>

                {/* Footer */}
                <div className={`mt-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <p>© 2025 Attendance System. Магістерський проект.</p>
                </div>
            </div>
        </div>
    );
}

