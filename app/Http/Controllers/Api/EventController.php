<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EventController extends Controller
{
    /**
     * Display a listing of events
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::query()
            ->with(['teacher.profile', 'category', 'groups'])
            ->withCount('registrations');

        // Filter by published status for non-admin users
        if (!$request->user()->isAdmin()) {
            $query->published();
        }

        // Filter by teacher for teacher role
        if ($request->user()->isTeacher() && !$request->boolean('all')) {
            $query->byTeacher($request->user()->id);
        }

        // Filter by group for students
        if ($request->user()->isStudent()) {
            $groupIds = $request->user()->groups()->pluck('groups.id');
            $query->whereHas('groups', function ($q) use ($groupIds) {
                $q->whereIn('groups.id', $groupIds);
            });
        }

        // Date filters
        if ($request->has('from_date')) {
            $query->where('start_time', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('end_time', '<=', $request->to_date);
        }

        // Category filter
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Pagination
        $events = $query->orderBy('start_time', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json($events);
    }

    /**
     * Store a newly created event
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Event::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:event_categories,id'],
            'event_type' => ['required', 'in:lecture,seminar,lab,exam'],
            'start_time' => ['required', 'date', 'after:now'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'location' => ['nullable', 'array'],
            'location.lat' => ['required_with:location', 'numeric', 'between:-90,90'],
            'location.lng' => ['required_with:location', 'numeric', 'between:-180,180'],
            'location.building' => ['nullable', 'string', 'max:100'],
            'location.room' => ['nullable', 'string', 'max:50'],
            'allowed_radius' => ['nullable', 'integer', 'min:10', 'max:5000'],
            'qr_enabled' => ['boolean'],
            'geolocation_required' => ['boolean'],
            'group_ids' => ['array'],
            'group_ids.*' => ['exists:groups,id'],
        ]);

        $event = Event::create([
            'teacher_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
            'event_type' => $validated['event_type'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'location' => $validated['location'] ?? null,
            'allowed_radius' => $validated['allowed_radius'] ?? 100,
            'qr_enabled' => $validated['qr_enabled'] ?? true,
            'geolocation_required' => $validated['geolocation_required'] ?? false,
            'published' => false,
        ]);

        // Attach groups
        if (!empty($validated['group_ids'])) {
            $event->groups()->attach($validated['group_ids']);
        }

        return response()->json([
            'message' => __('events.created'),
            'event' => $event->load(['teacher.profile', 'category', 'groups']),
        ], 201);
    }

    /**
     * Display the specified event
     */
    public function show(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $event->load([
            'teacher.profile',
            'category',
            'groups',
            'registrations.student.profile',
        ]);

        return response()->json($event);
    }

    /**
     * Update the specified event
     */
    public function update(Request $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:event_categories,id'],
            'event_type' => ['sometimes', 'in:lecture,seminar,lab,exam'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['sometimes', 'date', 'after:start_time'],
            'location' => ['nullable', 'array'],
            'allowed_radius' => ['nullable', 'integer', 'min:10', 'max:5000'],
            'qr_enabled' => ['boolean'],
            'geolocation_required' => ['boolean'],
            'published' => ['boolean'],
            'group_ids' => ['array'],
            'group_ids.*' => ['exists:groups,id'],
        ]);

        $event->update($validated);

        // Sync groups if provided
        if (isset($validated['group_ids'])) {
            $event->groups()->sync($validated['group_ids']);
        }

        return response()->json([
            'message' => __('events.updated'),
            'event' => $event->fresh(['teacher.profile', 'category', 'groups']),
        ]);
    }

    /**
     * Remove the specified event
     */
    public function destroy(Event $event): JsonResponse
    {
        $this->authorize('delete', $event);

        $event->delete();

        return response()->json([
            'message' => __('events.deleted'),
        ]);
    }

    /**
     * Get attendance for an event
     */
    public function attendance(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $registrations = $event->registrations()
            ->with('student.profile')
            ->get();

        return response()->json([
            'event_id' => $event->id,
            'total' => $registrations->count(),
            'present' => $registrations->where('status', 'present')->count(),
            'absent' => $registrations->where('status', 'absent')->count(),
            'registrations' => $registrations,
        ]);
    }
}

