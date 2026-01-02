<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    public function index(Request $request)
    {
        // Overall stats
        $totalEvents = Event::count();
        $totalStudents = User::where('role', 'student')->count();
        $totalRegistrations = EventRegistration::count();
        
        // Calculate overall attendance rate
        $totalExpected = 0;
        $events = Event::with('groups.users')->get();
        foreach ($events as $event) {
            foreach ($event->groups as $group) {
                $totalExpected += $group->users()->where('role', 'student')->count();
            }
        }
        
        $attendanceRate = $totalExpected > 0 
            ? round(($totalRegistrations / $totalExpected) * 100, 1) 
            : 0;

        // Attendance by event type
        $attendanceByType = Event::withCount('registrations')
            ->get()
            ->groupBy('event_type')
            ->map(function ($events, $type) {
                return [
                    'type' => $type,
                    'label' => match($type) {
                        'lecture' => 'Лекції',
                        'seminar' => 'Семінари',
                        'lab' => 'Лабораторні',
                        'exam' => 'Іспити',
                        default => $type,
                    },
                    'events' => $events->count(),
                    'registrations' => $events->sum('registrations_count'),
                ];
            })
            ->values();

        // Attendance trend (last 30 days)
        $attendanceTrend = EventRegistration::select(
                DB::raw('DATE(check_in_time) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->where('check_in_time', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top groups by attendance
        $topGroups = Group::withCount(['students', 'events'])
            ->with(['students' => function ($query) {
                $query->withCount('eventRegistrations');
            }])
            ->get()
            ->map(function ($group) {
                $totalRegistrations = $group->students->sum('event_registrations_count');
                $possibleAttendance = $group->students_count * $group->events_count;
                $rate = $possibleAttendance > 0 
                    ? round(($totalRegistrations / $possibleAttendance) * 100, 1) 
                    : 0;
                
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'students_count' => $group->students_count,
                    'events_count' => $group->events_count,
                    'registrations' => $totalRegistrations,
                    'attendance_rate' => $rate,
                ];
            })
            ->sortByDesc('attendance_rate')
            ->values()
            ->take(10);

        // Past events with attendance (only show events that have ended)
        $pastEvents = Event::with(['teacher.profile', 'category', 'groups'])
            ->withCount(['registrations', 'registrations as present_count' => function ($query) {
                $query->where('status', 'present');
            }])
            ->where('end_time', '<', now())
            ->orderBy('start_time', 'desc')
            ->take(10)
            ->get()
            ->map(function ($event) {
                // Calculate expected students from groups
                $expectedStudents = 0;
                foreach ($event->groups as $group) {
                    $expectedStudents += $group->students()->count();
                }
                
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_type' => $event->event_type,
                    'start_time' => $event->start_time,
                    'teacher' => $event->teacher?->full_name,
                    'registrations_count' => $event->present_count,
                    'expected_count' => $expectedStudents,
                    'attendance_rate' => $expectedStudents > 0 
                        ? round(($event->present_count / $expectedStudents) * 100, 1) 
                        : 0,
                ];
            });

        // Upcoming events
        $upcomingEvents = Event::with(['teacher.profile', 'groups'])
            ->where('start_time', '>', now())
            ->orderBy('start_time', 'asc')
            ->take(5)
            ->get()
            ->map(function ($event) {
                $expectedStudents = 0;
                foreach ($event->groups as $group) {
                    $expectedStudents += $group->students()->count();
                }
                
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_type' => $event->event_type,
                    'start_time' => $event->start_time,
                    'teacher' => $event->teacher?->full_name,
                    'expected_count' => $expectedStudents,
                ];
            });

        return Inertia::render('Statistics', [
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
        ]);
    }
}

