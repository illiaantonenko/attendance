import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Safe inline QR Scanner that won't crash the page
function SafeQrScanner({ 
    onScan, 
    onError, 
    onLog 
}: { 
    onScan: (data: string, location?: GeolocationPosition) => void; 
    onError: (error: string) => void;
    onLog: (msg: string) => void;
}) {
    const [status, setStatus] = useState('init');
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const scannerRef = useRef<any>(null);
    const mounted = useRef(true);

    // Get location
    useEffect(() => {
        if (navigator.geolocation) {
            onLog('Запит геолокації...');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation(pos);
                    onLog(`Геолокація: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                },
                (err) => {
                    onLog(`Геолокація недоступна: ${err.message}`);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        onLog('Scanner mounting...');
        
        let Html5Qrcode: any = null;
        
        const initScanner = async () => {
            try {
                onLog('Loading html5-qrcode...');
                setStatus('loading');
                
                // Dynamic import to catch load errors
                const module = await import('html5-qrcode');
                Html5Qrcode = module.Html5Qrcode;
                
                if (!mounted.current) return;
                onLog('Library loaded');
                
                // Check if element exists
                const element = document.getElementById('qr-scanner-view');
                if (!element) {
                    throw new Error('Scanner element not found');
                }
                
                onLog('Creating scanner instance...');
                setStatus('creating');
                scannerRef.current = new Html5Qrcode('qr-scanner-view');
                
                onLog('Requesting camera...');
                setStatus('requesting');
                
                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    { 
                        fps: 15,
                        qrbox: 250,
                        formatsToSupport: [ 0 ], // QR_CODE only
                        experimentalFeatures: {
                            useBarCodeDetectorIfSupported: true // Use native API if available
                        }
                    },
                    (decodedText: string, result: any) => {
                        onLog('✅ QR ЗНАЙДЕНО!');
                        onLog('Дані: ' + decodedText.substring(0, 50));
                        try {
                            scannerRef.current?.stop();
                        } catch {}
                        onScan(decodedText, location || undefined);
                    },
                    (errorMessage: string) => {
                        // Only log occasionally to avoid spam
                        if (Math.random() < 0.01) {
                            onLog('Сканую...');
                        }
                    }
                );
                
                if (!mounted.current) {
                    scannerRef.current?.stop();
                    return;
                }
                
                onLog('Camera started!');
                setStatus('scanning');
                
            } catch (err: any) {
                const msg = err?.message || String(err);
                onLog('ERROR: ' + msg);
                setError(msg);
                setStatus('error');
                onError(msg);
            }
        };
        
        // Delay initialization slightly
        const timer = setTimeout(initScanner, 100);
        
        return () => {
            mounted.current = false;
            clearTimeout(timer);
            try {
                scannerRef.current?.stop();
            } catch {}
        };
    }, []);

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <p className="text-red-600 font-medium mb-2">Помилка камери</p>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                    Спробувати знову
                </button>
            </div>
        );
    }

    return (
        <div className="qr-scanner-container">
            <div className="text-center text-sm text-gray-500 mb-2">
                Статус: {status === 'init' ? 'Ініціалізація...' : 
                        status === 'loading' ? 'Завантаження...' :
                        status === 'creating' ? 'Створення...' :
                        status === 'requesting' ? 'Запит камери...' :
                        status === 'scanning' ? '📷 Скануйте QR-код' : status}
            </div>
            <div 
                id="qr-scanner-view" 
                className="w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-black"
                style={{ minHeight: '280px' }}
            />
            {status === 'scanning' && (
                <>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Наведіть камеру на QR-код
                    </p>
                    <p className={`text-center text-xs mt-1 ${location ? 'text-green-500' : 'text-orange-500'}`}>
                        {location ? '📍 Геолокація визначена' : '⏳ Визначення геолокації...'}
                    </p>
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => {
                                const url = prompt('Введіть URL з QR коду (для тесту):');
                                if (url) {
                                    onLog('Ручний ввід: ' + url.substring(0, 30));
                                    if (location) {
                                        onLog(`З геолокацією: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
                                    } else {
                                        onLog('БЕЗ геолокації!');
                                    }
                                    try { scannerRef.current?.stop(); } catch {}
                                    onScan(url, location || undefined);
                                }
                            }}
                            className="text-xs text-blue-500 underline"
                        >
                            Ввести код вручну
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// Error Boundary to catch crashes
class ScannerErrorBoundary extends Component<
    { children: ReactNode; onError: (error: string) => void },
    { hasError: boolean; error: string }
> {
    constructor(props: { children: ReactNode; onError: (error: string) => void }) {
        super(props);
        this.state = { hasError: false, error: '' };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error: error.message };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Scanner crashed:', error, errorInfo);
        this.props.onError(`Сканер впав: ${error.message}`);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-red-600 mb-4">Помилка сканера: {this.state.error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                    >
                        Перезавантажити
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

interface CheckInResult {
    success: boolean;
    message: string;
    event?: {
        title: string;
        check_in_time: string;
    };
}

export default function CheckIn() {
    const [result, setResult] = useState<CheckInResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showScanner, setShowScanner] = useState(true);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    
    const log = (msg: string) => {
        console.log(msg);
        setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const handleScan = async (scannedData: string, location?: GeolocationPosition) => {
        log('QR відскановано');
        
        try {
            setIsProcessing(true);
            setShowScanner(false);

            // Extract token from URL if scanned data is a URL
            let token = scannedData;
            try {
                const url = new URL(scannedData);
                const urlToken = url.searchParams.get('token');
                if (urlToken) {
                    token = urlToken;
                    log('Токен витягнуто з URL');
                }
            } catch {
                log('Використовую raw дані');
            }

            const payload: Record<string, unknown> = { token };
            
            if (location) {
                payload.location = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                };
                log(`Локація: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
            } else {
                log('Без локації');
            }

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            log(`CSRF: ${csrfToken ? 'є' : 'НЕМАЄ!'}`);
            
            log('Відправка запиту...');
            const response = await fetch('/api/v1/events/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            log(`Відповідь: ${response.status}`);
            
            let data;
            try {
                const text = await response.text();
                log(`Body: ${text.substring(0, 100)}`);
                data = JSON.parse(text);
            } catch (parseError: any) {
                log(`Помилка парсингу: ${parseError?.message}`);
                data = { message: 'Невірний формат відповіді' };
            }

            if (response.ok) {
                log('Успіх!');
                setResult({
                    success: true,
                    message: data.message || 'Відмітка успішно збережена!',
                    event: data.registration ? {
                        title: data.registration.event_title || 'Подія',
                        check_in_time: data.registration.check_in_time || new Date().toISOString(),
                    } : undefined,
                });
            } else {
                log(`Помилка сервера: ${data.message}`);
                setResult({
                    success: false,
                    message: data.message || `Помилка ${response.status}`,
                });
            }
        } catch (error: any) {
            log(`КРИТИЧНА ПОМИЛКА: ${error?.message || error}`);
            setResult({
                success: false,
                message: 'Помилка: ' + (error?.message || 'Невідома помилка'),
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScanner = () => {
        setResult(null);
        setShowScanner(true);
    };

    return (
        <AuthenticatedLayout title="QR Сканер">
            <Head title="QR Сканер" />

            <div className="max-w-2xl mx-auto">
                <div className="card">
                    <div className="card-header text-center">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Відмітка відвідуваності
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Скануйте QR-код для відмітки присутності
                        </p>
                    </div>

                    <div className="card-body">
                        {isProcessing && (
                            <div className="p-8 text-center">
                                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500">Обробка...</p>
                            </div>
                        )}

                        {!isProcessing && result && (
                            <div className="p-6 text-center">
                                {result.success ? (
                                    <>
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-fade-in">
                                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                            {result.message}
                                        </h3>
                                        {result.event && (
                                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {result.event.title}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Час відмітки: {new Date(result.event.check_in_time).toLocaleString('uk')}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-fade-in">
                                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                            Помилка
                                        </h3>
                                        <p className="text-slate-500">{result.message}</p>
                                    </>
                                )}

                                <button
                                    onClick={resetScanner}
                                    className="btn btn-primary mt-6"
                                >
                                    Сканувати знову
                                </button>
                            </div>
                        )}

                        {!isProcessing && !result && showScanner && (
                            <ScannerErrorBoundary onError={(err) => log(`ErrorBoundary: ${err}`)}>
                                <SafeQrScanner
                                    onScan={handleScan}
                                    onError={(error) => {
                                        log(`Scanner error: ${error}`);
                                        setResult({
                                            success: false,
                                            message: 'Помилка сканера: ' + error,
                                        });
                                        setShowScanner(false);
                                    }}
                                    onLog={log}
                                />
                            </ScannerErrorBoundary>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                        Інструкція:
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>Дозвольте доступ до камери та геолокації</li>
                        <li>Наведіть камеру на QR-код викладача</li>
                        <li>Дочекайтесь підтвердження</li>
                    </ol>
                </div>

                {/* Debug Log */}
                {debugLog.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-500">Debug Log:</span>
                            <button 
                                onClick={() => setDebugLog([])}
                                className="text-xs text-red-500"
                            >
                                Очистити
                            </button>
                        </div>
                        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1 max-h-40 overflow-y-auto">
                            {debugLog.map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

