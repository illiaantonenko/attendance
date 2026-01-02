<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Group;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;

class ExportService
{
    /**
     * Export event attendance to PDF
     */
    public function exportEventToPdf(Event $event): string
    {
        $event->load(['registrations.student.profile', 'groups', 'teacher.profile', 'category']);
        
        $data = [
            'event' => $event,
            'registrations' => $event->registrations,
            'attendanceRate' => $this->calculateAttendanceRate($event),
            'generatedAt' => now()->format('d.m.Y H:i'),
        ];

        $pdf = Pdf::loadView('exports.event-attendance', $data);
        $pdf->setPaper('a4', 'portrait');
        
        return $pdf->output();
    }

    /**
     * Export event attendance to Excel array
     */
    public function exportEventToExcel(Event $event): array
    {
        $event->load(['registrations.student.profile', 'groups']);

        $headers = [
            '№',
            'Прізвище',
            'Ім\'я',
            'Email',
            'Група',
            'Статус',
            'Час відмітки',
        ];

        $rows = [];
        $index = 1;

        foreach ($event->registrations as $registration) {
            $student = $registration->student;
            $profile = $student->profile;
            
            $rows[] = [
                $index++,
                $profile?->lastname ?? '-',
                $profile?->firstname ?? '-',
                $student->email,
                $student->groups->first()?->name ?? '-',
                $registration->status === 'present' ? 'Присутній' : 'Відсутній',
                $registration->check_in_time?->format('H:i:s') ?? '-',
            ];
        }

        return [
            'title' => $event->title,
            'date' => $event->start_time->format('d.m.Y'),
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    /**
     * Export group statistics to PDF
     */
    public function exportGroupStatsToPdf(Group $group, ?string $startDate = null, ?string $endDate = null): string
    {
        $group->load(['students.profile', 'events.registrations']);

        $students = $group->students->map(function ($student) use ($group) {
            $totalEvents = $group->events->count();
            $attended = $student->eventRegistrations()
                ->whereIn('event_id', $group->events->pluck('id'))
                ->count();
            
            return [
                'student' => $student,
                'total_events' => $totalEvents,
                'attended' => $attended,
                'missed' => $totalEvents - $attended,
                'rate' => $totalEvents > 0 ? round(($attended / $totalEvents) * 100, 1) : 0,
            ];
        });

        $data = [
            'group' => $group,
            'students' => $students,
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'generatedAt' => now()->format('d.m.Y H:i'),
        ];

        $pdf = Pdf::loadView('exports.group-statistics', $data);
        $pdf->setPaper('a4', 'landscape');
        
        return $pdf->output();
    }

    /**
     * Calculate attendance rate for event
     */
    private function calculateAttendanceRate(Event $event): float
    {
        $expectedStudents = 0;
        foreach ($event->groups as $group) {
            $expectedStudents += $group->students()->count();
        }

        if ($expectedStudents === 0) {
            return 0;
        }

        $attended = $event->registrations->where('status', 'present')->count();
        return round(($attended / $expectedStudents) * 100, 1);
    }
}

