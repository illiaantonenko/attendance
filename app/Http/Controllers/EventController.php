<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventRegistration;
use App\Models\Group;
use App\Services\QrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class EventController extends Controller
{
    public function __construct(
        private QrService $qrService
    ) {}

    /**
     * Display a listing of events.
     */
    public function index(Request $request)
    {
        $query = Event::with(['teacher.profile', 'category', 'groups'])
            ->withCount('registrations');

        if ($request->user()->isTeacher()) {
            $query->where('teacher_id', $request->user()->id);
        }

        $events = $query->orderBy('start_time', 'desc')->paginate(20);

        return Inertia::render('Events/Index', [
            'events' => $events,
        ]);
    }

    /**
     * Show the form for creating a new event.
     */
    public function create(Request $request)
    {
        $categories = EventCategory::all();
        $groups = Group::all();

        return Inertia::render('Events/Create', [
            'categories' => $categories,
            'groups' => $groups,
            'defaultStart' => $request->input('start'),
            'defaultEnd' => $request->input('end'),
        ]);
    }

    /**
     * Store a newly created event.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:event_categories,id'],
            'event_type' => ['required', 'in:lecture,seminar,lab,exam'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'location' => ['nullable', 'array'],
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

        if (!empty($validated['group_ids'])) {
            $event->groups()->attach($validated['group_ids']);
        }

        // Clear caches
        $this->clearRelatedCaches($request->user()->id);

        return redirect()->route('events.show', $event)->with('success', 'Подію створено!');
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        $this->authorize('view', $event);

        $event->load([
            'teacher.profile',
            'category',
            'groups.students.profile',
            'registrations.student.profile',
        ]);

        // Generate QR code if needed (show to teacher 2 hours before event)
        $qrCode = null;
        $qrData = null;
        $qrAvailableAt = null;
        
        if ($event->qr_enabled) {
            if ($event->canShowQrCode()) {
                $qrData = $this->qrService->generate($event);
                $qrCode = $qrData['qr_code'] ?? null;
            } elseif (!$event->hasEnded()) {
                // Show when QR will be available
                $qrAvailableAt = $event->start_time->subMinutes(120)->format('d.m.Y H:i');
            }
        }

        // Get all students from event groups
        $allStudents = collect();
        foreach ($event->groups as $group) {
            foreach ($group->students as $student) {
                if (!$allStudents->contains('id', $student->id)) {
                    $allStudents->push([
                        'id' => $student->id,
                        'email' => $student->email,
                        'full_name' => $student->full_name,
                        'profile' => $student->profile,
                        'group_name' => $group->name,
                    ]);
                }
            }
        }

        // Map registrations to student IDs for quick lookup
        $registrationsByStudent = $event->registrations->keyBy('student_id');

        return Inertia::render('Events/Show', [
            'event' => $event,
            'qrCode' => $qrCode,
            'qrAvailableAt' => $qrAvailableAt,
            'allStudents' => $allStudents->values(),
            'registrationsByStudent' => $registrationsByStudent,
            'canManualAttendance' => $event->teacher_id === auth()->id() || auth()->user()->isAdmin(),
        ]);
    }

    /**
     * Show the form for editing the specified event.
     */
    public function edit(Event $event)
    {
        $this->authorize('update', $event);

        $event->load(['groups']);
        $categories = EventCategory::all();
        $groups = Group::all();

        return Inertia::render('Events/Edit', [
            'event' => $event,
            'categories' => $categories,
            'groups' => $groups,
        ]);
    }

    /**
     * Update the specified event.
     */
    public function update(Request $request, Event $event)
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

        if (isset($validated['group_ids'])) {
            $event->groups()->sync($validated['group_ids']);
        }

        // Clear caches
        $this->clearRelatedCaches($request->user()->id);

        return redirect()->route('events.show', $event)->with('success', 'Подію оновлено!');
    }

    /**
     * Remove the specified event.
     */
    public function destroy(Event $event)
    {
        $this->authorize('delete', $event);

        $event->delete();

        // Clear caches
        $this->clearRelatedCaches(auth()->id());

        return redirect()->route('events.index')->with('success', 'Подію видалено!');
    }

    /**
     * Clear related caches when data changes.
     */
    private function clearRelatedCaches(int $userId): void
    {
        Cache::forget("dashboard_data_{$userId}");
        Cache::forget('statistics_data');
    }

    /**
     * Mark student attendance manually.
     */
    public function markAttendance(Request $request, Event $event)
    {
        $this->authorize('update', $event);

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
                'check_in_time' => $validated['status'] === 'present' || $validated['status'] === 'late' 
                    ? now() 
                    : null,
            ]
        );

        // Clear caches
        $this->clearRelatedCaches($request->user()->id);
        Cache::forget("dashboard_data_{$validated['student_id']}");

        return back()->with('success', 'Відмітку оновлено!');
    }

    /**
     * Mark multiple students attendance at once.
     */
    public function markBulkAttendance(Request $request, Event $event)
    {
        $this->authorize('update', $event);

        $validated = $request->validate([
            'attendances' => ['required', 'array'],
            'attendances.*.student_id' => ['required', 'exists:users,id'],
            'attendances.*.status' => ['required', 'in:present,absent,late,excused'],
        ]);

        foreach ($validated['attendances'] as $attendance) {
            EventRegistration::updateOrCreate(
                [
                    'event_id' => $event->id,
                    'student_id' => $attendance['student_id'],
                ],
                [
                    'status' => $attendance['status'],
                    'check_in_time' => in_array($attendance['status'], ['present', 'late']) 
                        ? now() 
                        : null,
                ]
            );
            // Clear student's dashboard cache
            Cache::forget("dashboard_data_{$attendance['student_id']}");
        }

        // Clear teacher/admin caches
        $this->clearRelatedCaches($request->user()->id);

        return back()->with('success', 'Відмітки оновлено!');
    }
}

