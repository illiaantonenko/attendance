<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Group;
use App\Exports\EventAttendanceExport;
use App\Exports\GroupAttendanceExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * Export event attendance to PDF
     */
    public function eventPdf(Event $event)
    {
        $this->authorize('view', $event);
        
        $event->load(['registrations.student.profile', 'teacher.profile', 'groups']);
        
        $pdf = Pdf::loadView('exports.event-attendance', [
            'event' => $event,
            'registrations' => $event->registrations,
            'exportDate' => now()->format('d.m.Y H:i'),
        ]);

        return $pdf->download("attendance-{$event->id}-" . now()->format('Y-m-d') . ".pdf");
    }

    /**
     * Export event attendance to Excel
     */
    public function eventExcel(Event $event)
    {
        $this->authorize('view', $event);
        
        return Excel::download(
            new EventAttendanceExport($event),
            "attendance-{$event->id}-" . now()->format('Y-m-d') . ".xlsx"
        );
    }

    /**
     * Export group attendance summary to PDF
     */
    public function groupPdf(Group $group, Request $request)
    {
        $startDate = $request->get('start_date', now()->subMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $group->load(['students.profile', 'students.registrations' => function ($query) use ($startDate, $endDate) {
            $query->whereHas('event', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_time', [$startDate, $endDate]);
            })->with('event');
        }]);

        $events = Event::whereHas('groups', function ($q) use ($group) {
            $q->where('groups.id', $group->id);
        })->whereBetween('start_time', [$startDate, $endDate])
            ->orderBy('start_time')
            ->get();

        $pdf = Pdf::loadView('exports.group-attendance', [
            'group' => $group,
            'events' => $events,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'exportDate' => now()->format('d.m.Y H:i'),
        ]);

        $pdf->setPaper('a4', 'landscape');

        return $pdf->download("group-{$group->code}-attendance-" . now()->format('Y-m-d') . ".pdf");
    }

    /**
     * Export group attendance summary to Excel
     */
    public function groupExcel(Group $group, Request $request)
    {
        $startDate = $request->get('start_date', now()->subMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        return Excel::download(
            new GroupAttendanceExport($group, $startDate, $endDate),
            "group-{$group->code}-attendance-" . now()->format('Y-m-d') . ".xlsx"
        );
    }

    /**
     * Export statistics summary to PDF
     */
    public function statisticsPdf(Request $request)
    {
        $startDate = $request->get('start_date', now()->subMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $events = Event::with(['registrations', 'groups', 'teacher.profile'])
            ->whereBetween('start_time', [$startDate, $endDate])
            ->orderBy('start_time', 'desc')
            ->get();

        $totalEvents = $events->count();
        $totalRegistrations = $events->sum(fn($e) => $e->registrations->count());
        
        $pdf = Pdf::loadView('exports.statistics', [
            'events' => $events,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalEvents' => $totalEvents,
            'totalRegistrations' => $totalRegistrations,
            'exportDate' => now()->format('d.m.Y H:i'),
        ]);

        return $pdf->download("statistics-" . now()->format('Y-m-d') . ".pdf");
    }
}

