<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $cacheKey = "dashboard_data_{$user->id}";

        // Cache dashboard data for 2 minutes per user
        $data = Cache::remember($cacheKey, 120, function () use ($user) {
            return $this->getDashboardData($user);
        });

        return Inertia::render('Dashboard', $data);
    }

    private function getDashboardData($user): array
    {
        // Optimized query: select only needed columns, eager load efficiently
        $eventsQuery = Event::select([
                'id', 'title', 'event_type', 'start_time', 'end_time', 
                'teacher_id', 'category_id', 'location', 'published'
            ])
            ->with([
                'teacher:id,role',
                'teacher.profile:user_id,firstname,lastname',
                'category:id,name,color'
            ])
            ->where('start_time', '>=', now())
            ->orderBy('start_time')
            ->limit(5);

        if ($user->isTeacher()) {
            $eventsQuery->where('teacher_id', $user->id);
        } elseif ($user->isStudent()) {
            // Cache group IDs to avoid repeated queries
            $groupIds = $user->groups()->pluck('groups.id');
            $eventsQuery->published()
                ->where(function ($q) use ($groupIds) {
                    $q->whereHas('groups', function ($gq) use ($groupIds) {
                        $gq->whereIn('groups.id', $groupIds);
                    })->orWhereDoesntHave('groups');
                });
        }

        $upcomingEvents = $eventsQuery->get();

        // Calculate stats with efficient counting
        $totalEvents = $user->isTeacher() 
            ? Event::where('teacher_id', $user->id)->count()
            : Event::count();
            
        $todayEvents = $user->isTeacher()
            ? Event::where('teacher_id', $user->id)->whereDate('start_time', today())->count()
            : Event::whereDate('start_time', today())->count();

        // Calculate attendance rate for students
        $attendanceRate = 0;
        if ($user->isStudent()) {
            $stats = $user->eventRegistrations()
                ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present')
                ->first();
            
            $attendanceRate = $stats->total > 0 
                ? round(($stats->present / $stats->total) * 100) 
                : 0;
        }

        return [
            'upcomingEvents' => $upcomingEvents,
            'stats' => [
                'totalEvents' => $totalEvents,
                'todayEvents' => $todayEvents,
                'attendanceRate' => $attendanceRate,
            ],
        ];
    }
}

