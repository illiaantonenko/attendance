import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTheme } from '@/contexts/ThemeContext';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

export default function Login() {
    const { isDark } = useTheme();
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Вхід" />

            <div className="card">
                <div className="card-header text-center">
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Вхід в систему
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Введіть дані для входу в обліковий запис
                    </p>
                </div>

                <div className="card-body">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Email адреса
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="input"
                                placeholder="your@email.com"
                                autoComplete="email"
                                autoFocus
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Пароль
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <span className={`ml-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Запам'ятати мене
                                </span>
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                Забули пароль?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-primary w-full"
                        >
                            {processing ? 'Вхід...' : 'Увійти'}
                        </button>
                    </form>
                </div>
            </div>

            <p className={`mt-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Немає облікового запису?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                    Зареєструватися
                </Link>
            </p>
        </GuestLayout>
    );
}

