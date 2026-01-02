<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyEventsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $userGroupIds = $user->groups()->pluck('groups.id')->toArray();
        
        // Get events where the student's groups are enrolled
        $events = Event::with(['teacher.profile', 'category', 'registrations'])
            ->whereHas('groups', function ($query) use ($userGroupIds) {
                $query->whereIn('groups.id', $userGroupIds);
            })
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(function ($event) use ($user) {
                $registration = $event->registrations->firstWhere('user_id', $user->id);
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'event_type' => $event->event_type,
                    'start_time' => $event->start_time,
                    'end_time' => $event->end_time,
                    'location' => $event->location,
                    'teacher' => $event->teacher?->full_name,
                    'category' => $event->category,
                    'is_checked_in' => $registration !== null,
                    'check_in_time' => $registration?->check_in_time,
                ];
            });

        // Separate into upcoming, today, and past
        $now = now();
        $today = $now->toDateString();

        $upcoming = $events->filter(fn($e) => $e['start_time'] > $now);
        $todayEvents = $events->filter(fn($e) => 
            substr($e['start_time'], 0, 10) === $today
        );
        $past = $events->filter(fn($e) => $e['end_time'] < $now);

        // Calculate statistics
        $totalEvents = $events->count();
        $attended = $events->filter(fn($e) => $e['is_checked_in'])->count();
        $attendanceRate = $totalEvents > 0 ? round(($attended / $totalEvents) * 100, 1) : 0;

        return Inertia::render('Events/MyEvents', [
            'upcoming' => $upcoming->values(),
            'today' => $todayEvents->values(),
            'past' => $past->take(20)->values(),
            'stats' => [
                'total' => $totalEvents,
                'attended' => $attended,
                'missed' => $totalEvents - $attended,
                'rate' => $attendanceRate,
            ],
        ]);
    }
}

