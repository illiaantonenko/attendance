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
    const [isScanning, setIsScanning] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [scannerReady, setScannerReady] = useState(false);

    useEffect(() => {
        // Get location if required
        if (requireLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation(position);
                    setLocationError(null);
                },
                (error) => {
                    let errorMessage = 'Не вдалося отримати місцезнаходження';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Доступ до геолокації заборонено. Дозвольте доступ в налаштуваннях браузера.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Інформація про місцезнаходження недоступна.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Час очікування геолокації вичерпано.';
                            break;
                    }
                    setLocationError(errorMessage);
                    onError?.(errorMessage);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        }
    }, [requireLocation, onError]);

    // Check for multiple cameras
    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            setHasMultipleCameras(devices.length > 1);
        }).catch(() => {
            setHasMultipleCameras(false);
        });
    }, []);

    const startScanner = useCallback(async (facing: CameraFacing) => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode('qr-reader');
        }

        // Stop if already scanning
        if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
        }

        try {
            await scannerRef.current.start(
                { facingMode: facing },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    setIsScanning(false);
                    scannerRef.current?.stop().catch(() => {});
                    onScan(decodedText, location || undefined);
                },
                () => {
                    // QR code not found - this is normal
                }
            );
            setIsScanning(true);
            setScannerReady(true);
        } catch (err) {
            console.error('Failed to start scanner:', err);
            onError?.('Не вдалося запустити камеру');
        }
    }, [location, onScan, onError]);

    useEffect(() => {
        // Don't start scanner if location is required but not available
        if (requireLocation && !location) {
            return;
        }

        startScanner(cameraFacing);

        return () => {
            scannerRef.current?.stop().catch(() => {});
        };
    }, [location, requireLocation, cameraFacing]);

    const switchCamera = useCallback(() => {
        const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
        setCameraFacing(newFacing);
    }, [cameraFacing]);

    if (requireLocation && locationError) {
        return (
            <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Потрібен доступ до геолокації
                </h3>
                <p className="text-slate-500 mb-4">{locationError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                >
                    Спробувати знову
                </button>
            </div>
        );
    }

    if (requireLocation && !location) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Визначення місцезнаходження...</p>
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

