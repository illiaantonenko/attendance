<?php

namespace App\Http\Controllers\Api;

use App\Events\AttendanceRegistered;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Services\GeolocationService;
use App\Services\QrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    public function __construct(
        private QrService $qrService,
        private GeolocationService $geolocationService
    ) {}

    /**
     * Process check-in via QR code
     */
    public function checkIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'location' => ['nullable', 'array'],
            'location.lat' => ['required_with:location', 'numeric', 'between:-90,90'],
            'location.lng' => ['required_with:location', 'numeric', 'between:-180,180'],
        ]);

        $user = $request->user();

        // Only students can check in
        if (!$user->isStudent()) {
            return response()->json([
                'message' => __('check_in.students_only'),
            ], 403);
        }

        // Validate QR token
        $tokenResult = $this->qrService->validate($validated['token']);

        if (!$tokenResult['valid']) {
            return response()->json([
                'message' => $tokenResult['error'],
            ], 400);
        }

        $eventId = $tokenResult['event_id'];
        $nonce = $tokenResult['nonce'];

        // Get event
        $event = Event::with('groups')->find($eventId);

        if (!$event) {
            return response()->json([
                'message' => __('events.not_found'),
            ], 404);
        }

        // Check if event is active (time window)
        if ($event->isTooEarly()) {
            return response()->json([
                'message' => __('check_in.too_early'),
                'event_starts' => $event->start_time->toIso8601String(),
            ], 400);
        }

        if ($event->hasEnded()) {
            return response()->json([
                'message' => __('check_in.event_ended'),
            ], 400);
        }

        // Check if student is in one of the event's groups
        $studentGroupIds = $user->groups()->pluck('groups.id');
        $eventGroupIds = $event->groups()->pluck('groups.id');

        if ($eventGroupIds->isNotEmpty() && $studentGroupIds->intersect($eventGroupIds)->isEmpty()) {
            return response()->json([
                'message' => __('check_in.not_enrolled'),
            ], 403);
        }

        // Check geolocation if required
        if ($event->geolocation_required) {
            if (!isset($validated['location'])) {
                return response()->json([
                    'message' => __('check_in.location_required'),
                ], 400);
            }

            $eventLocation = $event->location;
            if (!$eventLocation || !isset($eventLocation['lat']) || !isset($eventLocation['lng'])) {
                return response()->json([
                    'message' => __('check_in.event_location_not_set'),
                ], 400);
            }

            $distanceInfo = $this->geolocationService->getDistanceInfo(
                $validated['location'],
                $eventLocation,
                $event->allowed_radius
            );

            if (!$distanceInfo['is_within_radius']) {
                return response()->json([
                    'message' => __('check_in.too_far', [
                        'distance' => $this->geolocationService->formatDistance($distanceInfo['distance_meters']),
                        'allowed' => $this->geolocationService->formatDistance($event->allowed_radius),
                    ]),
                    'distance' => $distanceInfo,
                ], 400);
            }
        }

        // Check for existing registration
        $existingRegistration = EventRegistration::where('event_id', $event->id)
            ->where('student_id', $user->id)
            ->first();

        if ($existingRegistration && $existingRegistration->hasCheckedIn()) {
            return response()->json([
                'message' => __('check_in.already_checked_in'),
                'check_in_time' => $existingRegistration->check_in_time->toIso8601String(),
            ], 409);
        }

        // Create or update registration
        $registration = EventRegistration::updateOrCreate(
            [
                'event_id' => $event->id,
                'student_id' => $user->id,
            ],
            [
                'status' => EventRegistration::STATUS_PRESENT,
                'check_in_time' => now(),
                'check_in_location' => $validated['location'] ?? null,
                'device_info' => $request->userAgent(),
            ]
        );

        // Invalidate the QR nonce (one-time use)
        $this->qrService->invalidateNonce($nonce, $user->id);

        // Broadcast attendance event for real-time updates
        try {
            event(new AttendanceRegistered($registration));
        } catch (\Exception $e) {
            \Log::error('Broadcast failed', [
                'registration_id' => $registration->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => __('check_in.success'),
            'registration' => [
                'id' => $registration->id,
                'event_id' => $registration->event_id,
                'event_title' => $event->title,
                'status' => $registration->status,
                'check_in_time' => $registration->check_in_time->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Manual check-in by teacher
     */
    public function manualCheckIn(Request $request, Event $event): JsonResponse
    {
        // Authorization - only teacher who owns the event or admin
        if (!$request->user()->isAdmin() && $event->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => __('auth.forbidden'),
            ], 403);
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'status' => ['required', 'in:present,absent,late,excused'],
        ]);

        $registration = EventRegistration::updateOrCreate(
            [
                'event_id' => $event->id,
                'student_id' => $validated['student_id'],
            ],
            [
                'status' => $validated['status'],
                'check_in_time' => $validated['status'] === 'present' ? now() : null,
            ]
        );

        return response()->json([
            'message' => __('check_in.manual_success'),
            'registration' => $registration->load('student.profile'),
        ]);
    }

    /**
     * Get check-in status for current user
     */
    public function status(Request $request, Event $event): JsonResponse
    {
        $registration = EventRegistration::where('event_id', $event->id)
            ->where('student_id', $request->user()->id)
            ->first();

        if (!$registration) {
            return response()->json([
                'checked_in' => false,
                'event_id' => $event->id,
            ]);
        }

        return response()->json([
            'checked_in' => $registration->hasCheckedIn(),
            'status' => $registration->status,
            'check_in_time' => $registration->check_in_time?->toIso8601String(),
            'event_id' => $event->id,
        ]);
    }
}

