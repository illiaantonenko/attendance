import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
    onScan: (decodedText: string, location?: GeolocationPosition) => void;
    onError?: (error: string) => void;
    requireLocation?: boolean;
}

type CameraFacing = 'environment' | 'user';

export default function QrScanner({ onScan, onError, requireLocation = false }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationSkipped, setLocationSkipped] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [scannerReady, setScannerReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    useEffect(() => {
        // Get location if required
        if (requireLocation && navigator.geolocation && !locationSkipped) {
            setDebugInfo('Запит геолокації...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation(position);
                    setLocationError(null);
                    setDebugInfo(`Геолокація: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                    let errorMessage = 'Не вдалося отримати місцезнаходження';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Доступ до геолокації заборонено';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Геолокація недоступна';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Час очікування вичерпано';
                            break;
                    }
                    setLocationError(errorMessage);
                    setDebugInfo(`Помилка геолокації: ${errorMessage}`);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                }
            );
        } else if (!navigator.geolocation) {
            setLocationError('Геолокація не підтримується браузером');
            setDebugInfo('Браузер не підтримує геолокацію');
        }
    }, [requireLocation, locationSkipped]);

    // Check for multiple cameras
    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            setHasMultipleCameras(devices.length > 1);
        }).catch(() => {
            setHasMultipleCameras(false);
        });
    }, []);

    const startScanner = useCallback(async (facing: CameraFacing) => {
        setDebugInfo(prev => prev + ' | Запуск камери...');
        setCameraError(null);
        
        try {
            // Create scanner instance if not exists
            if (!scannerRef.current) {
                const element = document.getElementById('qr-reader');
                if (!element) {
                    throw new Error('QR reader element not found');
                }
                scannerRef.current = new Html5Qrcode('qr-reader');
            }

            // Stop if already scanning
            if (scannerRef.current.isScanning) {
                try {
                    await scannerRef.current.stop();
                } catch (stopErr) {
                    console.warn('Error stopping scanner:', stopErr);
                }
            }

            // Calculate responsive qrbox size
            const screenWidth = window.innerWidth;
            const qrboxSize = Math.min(screenWidth - 100, 250);

            await scannerRef.current.start(
                { facingMode: facing },
                {
                    fps: 5, // Lower FPS for mobile
                    qrbox: { width: qrboxSize, height: qrboxSize },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    setDebugInfo('QR код знайдено!');
                    setIsScanning(false);
                    try {
                        scannerRef.current?.stop().catch(() => {});
                    } catch {}
                    onScan(decodedText, location || undefined);
                },
                () => {
                    // QR code not found - this is normal, don't do anything
                }
            );
            setIsScanning(true);
            setScannerReady(true);
            setDebugInfo(prev => prev + ' | Камера активна ✓');
        } catch (err: any) {
            console.error('Failed to start scanner:', err);
            const errorMsg = err?.message || String(err) || 'Невідома помилка камери';
            setCameraError(errorMsg);
            setDebugInfo(`Помилка камери: ${errorMsg}`);
            onError?.('Не вдалося запустити камеру: ' + errorMsg);
        }
    }, [location, onScan, onError]);

    useEffect(() => {
        // Don't start scanner if location is required but not available (unless skipped)
        if (requireLocation && !location && !locationSkipped) {
            return;
        }

        startScanner(cameraFacing);

        return () => {
            scannerRef.current?.stop().catch(() => {});
        };
    }, [location, requireLocation, cameraFacing, locationSkipped, startScanner]);

    const switchCamera = useCallback(() => {
        const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
        setCameraFacing(newFacing);
    }, [cameraFacing]);

    if (requireLocation && locationError && !locationSkipped) {
        return (
            <div className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Геолокація недоступна
                </h3>
                <p className="text-slate-500 mb-4">{locationError}</p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                    >
                        Спробувати знову
                    </button>
                    <button
                        onClick={() => setLocationSkipped(true)}
                        className="btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                        Сканувати без геолокації
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                    Без геолокації відмітка може бути відхилена, якщо подія вимагає перевірку місцезнаходження
                </p>
            </div>
        );
    }

    if (requireLocation && !location && !locationSkipped) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">Визначення місцезнаходження...</p>
                <p className="text-xs text-slate-400">Дозвольте доступ до геолокації у браузері</p>
                <button
                    onClick={() => setLocationSkipped(true)}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-500"
                >
                    Пропустити і сканувати без геолокації →
                </button>
            </div>
        );
    }

    if (cameraError) {
        return (
            <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Помилка камери
                </h3>
                <p className="text-slate-500 mb-4">{cameraError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                >
                    Спробувати знову
                </button>
            </div>
        );
    }

    return (
        <div className="qr-scanner-container">
            {/* Camera view */}
            <div id="qr-reader" className="w-full max-w-md mx-auto rounded-xl overflow-hidden"></div>
            
            {/* Camera switch button */}
            {hasMultipleCameras && scannerReady && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={switchCamera}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {cameraFacing === 'environment' ? 'Фронтальна камера' : 'Задня камера'}
                        </span>
                    </button>
                </div>
            )}
            
            {/* Location status */}
            {location && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-sm text-green-600 dark:text-green-400">
                        <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            Місцезнаходження визначено
                        </span>
                    </p>
                </div>
            )}

            {/* Scanning hint */}
            {isScanning && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Наведіть камеру на QR-код для сканування
                    </p>
                </div>
            )}
            
            {/* Location skipped warning */}
            {locationSkipped && !location && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ Сканування без геолокації
                    </p>
                </div>
            )}

            {/* Debug info (hidden by default, show on tap) */}
            {debugInfo && (
                <details className="mt-4 text-xs text-slate-400">
                    <summary className="cursor-pointer">Діагностика</summary>
                    <p className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">{debugInfo}</p>
                </details>
            )}

            <style>{`
                #qr-reader {
                    border: none !important;
                    background: transparent !important;
                }
                #qr-reader video {
                    border-radius: 12px;
                    width: 100% !important;
                }
                #qr-reader__scan_region {
                    background: transparent !important;
                }
                #qr-reader__dashboard,
                #qr-reader__status_span,
                #qr-reader__camera_selection,
                #qr-reader select,
                #html5-qrcode-anchor-scan-type-change {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}

