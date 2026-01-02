import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

interface RegisterForm {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: 'student' | 'teacher';
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'student',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Реєстрація" />

            <div className="card">
                <div className="card-header text-center">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Створення облікового запису
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Заповніть форму для реєстрації
                    </p>
                </div>

                <div className="card-body">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstname" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Ім'я
                                </label>
                                <input
                                    id="firstname"
                                    type="text"
                                    value={data.firstname}
                                    onChange={(e) => setData('firstname', e.target.value)}
                                    className="input"
                                    placeholder="Іван"
                                    autoFocus
                                />
                                {errors.firstname && (
                                    <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="lastname" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Прізвище
                                </label>
                                <input
                                    id="lastname"
                                    type="text"
                                    value={data.lastname}
                                    onChange={(e) => setData('lastname', e.target.value)}
                                    className="input"
                                    placeholder="Петренко"
                                />
                                {errors.lastname && (
                                    <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Роль
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setData('role', 'student')}
                                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                                        data.role === 'student'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="text-2xl mb-1 block">🎓</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Студент</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('role', 'teacher')}
                                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                                        data.role === 'teacher'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="text-2xl mb-1 block">👨‍🏫</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Викладач</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Пароль
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="input"
                                placeholder="Мінімум 8 символів"
                                autoComplete="new-password"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Підтвердження пароля
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="input"
                                placeholder="Повторіть пароль"
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-primary w-full"
                        >
                            {processing ? 'Реєстрація...' : 'Зареєструватися'}
                        </button>
                    </form>
                </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-400">
                Вже маєте обліковий запис?{' '}
                <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                    Увійти
                </Link>
            </p>
        </GuestLayout>
    );
}

