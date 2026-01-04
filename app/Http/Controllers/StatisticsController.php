<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    public function index(Request $request)
    {
        // Cache statistics for 5 minutes to reduce database load
        $stats = Cache::remember('statistics_data', 300, function () {
            return $this->calculateStatistics();
        });

        return Inertia::render('Statistics', $stats);
    }

    private function calculateStatistics(): array
    {
        // Overall stats - optimized with single queries
        $totalEvents = Event::count();
        $totalStudents = User::where('role', 'student')->count();
        $totalRegistrations = EventRegistration::where('status', 'present')->count();
        
        // Calculate expected attendance using raw SQL for efficiency
        $totalExpected = DB::table('event_group')
            ->join('group_user', 'event_group.group_id', '=', 'group_user.group_id')
            ->join('users', 'group_user.user_id', '=', 'users.id')
            ->where('users.role', 'student')
            ->count();
        
        $attendanceRate = $totalExpected > 0 
            ? round(($totalRegistrations / $totalExpected) * 100, 1) 
            : 0;

        // Attendance by event type - optimized with aggregation
        $attendanceByType = DB::table('events')
            ->leftJoin('event_registrations', 'events.id', '=', 'event_registrations.event_id')
            ->select(
                'events.event_type as type',
                DB::raw('COUNT(DISTINCT events.id) as events'),
                DB::raw('COUNT(event_registrations.id) as registrations')
            )
            ->groupBy('events.event_type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->type,
                    'label' => match($item->type) {
                        'lecture' => 'Лекції',
                        'seminar' => 'Семінари',
                        'lab' => 'Лабораторні',
                        'exam' => 'Іспити',
                        default => $item->type,
                    },
                    'events' => $item->events,
                    'registrations' => $item->registrations,
                ];
            });

        // Attendance trend (last 30 days) - already optimized
        $attendanceTrend = EventRegistration::select(
                DB::raw('DATE(check_in_time) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->where('check_in_time', '>=', now()->subDays(30))
            ->whereNotNull('check_in_time')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top groups - optimized with subqueries
        $topGroups = DB::table('groups')
            ->leftJoin('group_user', 'groups.id', '=', 'group_user.group_id')
            ->leftJoin('users', function ($join) {
                $join->on('group_user.user_id', '=', 'users.id')
                     ->where('users.role', '=', 'student');
            })
            ->leftJoin('event_registrations', 'users.id', '=', 'event_registrations.student_id')
            ->leftJoin('event_group', 'groups.id', '=', 'event_group.group_id')
            ->select(
                'groups.id',
                'groups.name',
                DB::raw('COUNT(DISTINCT users.id) as students_count'),
                DB::raw('COUNT(DISTINCT event_group.event_id) as events_count'),
                DB::raw('COUNT(DISTINCT event_registrations.id) as registrations')
            )
            ->groupBy('groups.id', 'groups.name')
            ->having('students_count', '>', 0)
            ->orderByDesc('registrations')
            ->limit(10)
            ->get()
            ->map(function ($group) {
                $possibleAttendance = $group->students_count * $group->events_count;
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'students_count' => $group->students_count,
                    'events_count' => $group->events_count,
                    'registrations' => $group->registrations,
                    'attendance_rate' => $possibleAttendance > 0 
                        ? round(($group->registrations / $possibleAttendance) * 100, 1) 
                        : 0,
                ];
            });

        // Past events - preload student counts
        $pastEvents = Event::select('events.*')
            ->with(['teacher:id,role', 'teacher.profile:user_id,firstname,lastname'])
            ->withCount(['registrations as present_count' => function ($query) {
                $query->where('status', 'present');
            }])
            ->addSelect([
                'expected_students' => DB::table('event_group')
                    ->join('group_user', 'event_group.group_id', '=', 'group_user.group_id')
                    ->join('users', 'group_user.user_id', '=', 'users.id')
                    ->whereColumn('event_group.event_id', 'events.id')
                    ->where('users.role', 'student')
                    ->selectRaw('COUNT(DISTINCT users.id)')
            ])
            ->where('end_time', '<', now())
            ->orderBy('start_time', 'desc')
            ->take(10)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_type' => $event->event_type,
                    'start_time' => $event->start_time,
                    'teacher' => $event->teacher?->full_name,
                    'registrations_count' => $event->present_count,
                    'expected_count' => $event->expected_students ?? 0,
                    'attendance_rate' => ($event->expected_students ?? 0) > 0 
                        ? round(($event->present_count / $event->expected_students) * 100, 1) 
                        : 0,
                ];
            });

        // Upcoming events - preload student counts
        $upcomingEvents = Event::select('events.*')
            ->with(['teacher:id,role', 'teacher.profile:user_id,firstname,lastname'])
            ->addSelect([
                'expected_students' => DB::table('event_group')
                    ->join('group_user', 'event_group.group_id', '=', 'group_user.group_id')
                    ->join('users', 'group_user.user_id', '=', 'users.id')
                    ->whereColumn('event_group.event_id', 'events.id')
                    ->where('users.role', 'student')
                    ->selectRaw('COUNT(DISTINCT users.id)')
            ])
            ->where('start_time', '>', now())
            ->orderBy('start_time', 'asc')
            ->take(5)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_type' => $event->event_type,
                    'start_time' => $event->start_time,
                    'teacher' => $event->teacher?->full_name,
                    'expected_count' => $event->expected_students ?? 0,
                ];
            });

        return [
            'stats' => [
                'totalEvents' => $totalEvents,
                'totalStudents' => $totalStudents,
                'totalRegistrations' => $totalRegistrations,
                'attendanceRate' => $attendanceRate,
            ],
            'attendanceByType' => $attendanceByType,
            'attendanceTrend' => $attendanceTrend,
            'topGroups' => $topGroups,
            'pastEvents' => $pastEvents,
            'upcomingEvents' => $upcomingEvents,
        ];
    }
}

