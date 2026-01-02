<?php

namespace App\Services;

use App\Models\Event;
use App\Models\QrToken;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrService
{
    private string $secret;
    private int $ttlMinutes;

    public function __construct()
    {
        $this->secret = config('app.qr_secret', config('app.key'));
        $this->ttlMinutes = (int) config('app.qr_ttl_minutes', 10);
    }

    /**
     * Generate a new QR code for an event
     */
    public function generate(Event $event): array
    {
        $nonce = Str::random(32);
        $expiresAt = now()->addMinutes($this->ttlMinutes);

        // Create JWT payload
        $payload = [
            'event_id' => $event->id,
            'nonce' => $nonce,
            'iat' => now()->timestamp,
            'exp' => $expiresAt->timestamp,
        ];

        // Sign the token
        $token = JWT::encode($payload, $this->secret, 'HS256');

        // Store nonce in Redis for fast lookup and one-time use validation
        $cacheKey = "qr:nonce:{$nonce}";
        Cache::put($cacheKey, [
            'event_id' => $event->id,
            'created_at' => now()->toDateTimeString(),
        ], $expiresAt);

        // Store in database for audit trail
        QrToken::create([
            'event_id' => $event->id,
            'nonce' => $nonce,
            'token_hash' => hash('sha256', $token),
            'expires_at' => $expiresAt,
        ]);

        // Generate QR code image
        $checkInUrl = url("/check-in?token={$token}");
        $qrCode = QrCode::size(300)
            ->format('svg')
            ->generate($checkInUrl);

        return [
            'token' => $token,
            'qr_code' => base64_encode($qrCode),
            'qr_code_url' => $checkInUrl,
            'expires_at' => $expiresAt->toIso8601String(),
            'ttl_seconds' => $this->ttlMinutes * 60,
        ];
    }

    /**
     * Validate a QR token
     *
     * @return array{valid: bool, event_id?: int, error?: string}
     */
    public function validate(string $token): array
    {
        try {
            // Decode and verify JWT
            $payload = JWT::decode($token, new Key($this->secret, 'HS256'));

            $nonce = $payload->nonce;
            $eventId = $payload->event_id;

            // Check if nonce exists in cache (not used yet)
            $cacheKey = "qr:nonce:{$nonce}";
            $cachedData = Cache::get($cacheKey);

            if (!$cachedData) {
                // Check if it was already used in database
                $qrToken = QrToken::where('nonce', $nonce)->first();
                
                if ($qrToken && $qrToken->used) {
                    return [
                        'valid' => false,
                        'error' => 'QR code already used',
                    ];
                }

                return [
                    'valid' => false,
                    'error' => 'QR code expired or invalid',
                ];
            }

            // Verify event_id matches
            if ($cachedData['event_id'] !== $eventId) {
                return [
                    'valid' => false,
                    'error' => 'Invalid QR code',
                ];
            }

            return [
                'valid' => true,
                'event_id' => $eventId,
                'nonce' => $nonce,
            ];

        } catch (\Firebase\JWT\ExpiredException $e) {
            return [
                'valid' => false,
                'error' => 'QR code expired',
            ];
        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => 'Invalid QR code',
            ];
        }
    }

    /**
     * Invalidate a nonce (mark as used)
     */
    public function invalidateNonce(string $nonce, int $userId): void
    {
        // Remove from cache
        $cacheKey = "qr:nonce:{$nonce}";
        Cache::forget($cacheKey);

        // Update database record
        QrToken::where('nonce', $nonce)->update([
            'used' => true,
            'used_at' => now(),
            'used_by' => $userId,
        ]);
    }

    /**
     * Check if event has active QR codes
     */
    public function hasActiveQrCode(Event $event): bool
    {
        return QrToken::where('event_id', $event->id)
            ->where('expires_at', '>', now())
            ->where('used', false)
            ->exists();
    }

    /**
     * Get active QR tokens for event
     */
    public function getActiveTokens(Event $event): \Illuminate\Database\Eloquent\Collection
    {
        return QrToken::where('event_id', $event->id)
            ->where('expires_at', '>', now())
            ->where('used', false)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}

