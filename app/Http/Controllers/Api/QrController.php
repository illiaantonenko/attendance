<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\QrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QrController extends Controller
{
    public function __construct(
        private QrService $qrService
    ) {}

    /**
     * Generate QR code for an event
     */
    public function generate(Request $request, Event $event): JsonResponse
    {
        // Check authorization - only teacher who owns the event or admin
        if (!$request->user()->isAdmin() && $event->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => __('auth.forbidden'),
            ], 403);
        }

        // Check if event allows QR codes
        if (!$event->qr_enabled) {
            return response()->json([
                'message' => __('events.qr_disabled'),
            ], 400);
        }

        // Check if event is not too far in the future (max 24 hours)
        if ($event->start_time->diffInHours(now()) > 24) {
            return response()->json([
                'message' => __('events.qr_too_early'),
            ], 400);
        }

        // Check if event has not ended
        if ($event->hasEnded()) {
            return response()->json([
                'message' => __('events.ended'),
            ], 400);
        }

        $qrData = $this->qrService->generate($event);

        return response()->json([
            'message' => __('events.qr_generated'),
            'data' => $qrData,
        ], 201);
    }

    /**
     * Get active QR tokens for an event
     */
    public function active(Request $request, Event $event): JsonResponse
    {
        // Check authorization
        if (!$request->user()->isAdmin() && $event->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => __('auth.forbidden'),
            ], 403);
        }

        $tokens = $this->qrService->getActiveTokens($event);

        return response()->json([
            'event_id' => $event->id,
            'active_tokens' => $tokens->map(fn($token) => [
                'id' => $token->id,
                'expires_at' => $token->expires_at->toIso8601String(),
                'remaining_seconds' => max(0, now()->diffInSeconds($token->expires_at, false)),
            ]),
        ]);
    }

    /**
     * Validate QR token (without check-in)
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $result = $this->qrService->validate($validated['token']);

        if (!$result['valid']) {
            return response()->json([
                'valid' => false,
                'message' => $result['error'],
            ], 400);
        }

        $event = Event::find($result['event_id']);

        return response()->json([
            'valid' => true,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'start_time' => $event->start_time->toIso8601String(),
                'end_time' => $event->end_time->toIso8601String(),
                'location' => $event->location,
                'geolocation_required' => $event->geolocation_required,
                'allowed_radius' => $event->allowed_radius,
            ],
        ]);
    }
}

