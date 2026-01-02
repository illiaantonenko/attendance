import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface QrScannerProps {
    onScan: (decodedText: string, location?: GeolocationPosition) => void;
    onError?: (error: string) => void;
    requireLocation?: boolean;
}

export default function QrScanner({ onScan, onError, requireLocation = false }: QrScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

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

    useEffect(() => {
        // Don't start scanner if location is required but not available
        if (requireLocation && !location) {
            return;
        }

        // Initialize scanner
        scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                showTorchButtonIfSupported: true,
            },
            false
        );

        scannerRef.current.render(
            (decodedText) => {
                setIsScanning(false);
                // Stop scanning after successful read
                scannerRef.current?.clear();
                onScan(decodedText, location || undefined);
            },
            (errorMessage) => {
                // QR code not found - this is normal, just continue scanning
                if (!errorMessage.includes('No QR code found')) {
                    console.warn('QR Scan error:', errorMessage);
                }
            }
        );

        setIsScanning(true);

        return () => {
            scannerRef.current?.clear().catch(() => {});
        };
    }, [location, requireLocation, onScan]);

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
            <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
            
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

            {isScanning && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">
                        Наведіть камеру на QR-код для сканування
                    </p>
                </div>
            )}

            <style>{`
                #qr-reader {
                    border: none !important;
                }
                #qr-reader video {
                    border-radius: 12px;
                }
                #qr-reader__scan_region {
                    background: transparent !important;
                }
                #qr-reader__dashboard {
                    padding: 1rem !important;
                }
                #qr-reader__dashboard_section_swaplink {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}

