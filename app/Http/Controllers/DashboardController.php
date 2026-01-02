<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get upcoming events based on user role
        $eventsQuery = Event::with(['teacher.profile', 'category'])
            ->where('start_time', '>=', now())
            ->orderBy('start_time')
            ->limit(5);

        if ($user->isTeacher()) {
            $eventsQuery->where('teacher_id', $user->id);
        } elseif ($user->isStudent()) {
            $groupIds = $user->groups()->pluck('groups.id');
            $eventsQuery->published()
                ->where(function ($q) use ($groupIds) {
                    $q->whereHas('groups', function ($gq) use ($groupIds) {
                        $gq->whereIn('groups.id', $groupIds);
                    })->orWhereDoesntHave('groups');
                });
        }

        $upcomingEvents = $eventsQuery->get();

        // Calculate stats
        $statsQuery = Event::query();
        if ($user->isTeacher()) {
            $statsQuery->where('teacher_id', $user->id);
        }

        $totalEvents = $statsQuery->count();
        $todayEvents = (clone $statsQuery)
            ->whereDate('start_time', today())
            ->count();

        // Calculate attendance rate (simplified)
        $attendanceRate = 0;
        if ($user->isStudent()) {
            $registrations = $user->eventRegistrations()->count();
            $present = $user->eventRegistrations()->where('status', 'present')->count();
            $attendanceRate = $registrations > 0 ? round(($present / $registrations) * 100) : 0;
        }

        return Inertia::render('Dashboard', [
            'upcomingEvents' => $upcomingEvents,
            'stats' => [
                'totalEvents' => $totalEvents,
                'todayEvents' => $todayEvents,
                'attendanceRate' => $attendanceRate,
            ],
        ]);
    }
}

