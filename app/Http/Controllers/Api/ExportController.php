<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Group;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\EventAttendanceExport;

class ExportController extends Controller
{
    public function __construct(
        private ExportService $exportService
    ) {}

    /**
     * Export event attendance
     */
    public function event(Request $request, Event $event)
    {
        $this->authorize('view', $event);

        $format = $request->get('format', 'pdf');

        if ($format === 'xlsx') {
            return Excel::download(
                new EventAttendanceExport($event),
                "attendance-{$event->id}.xlsx"
            );
        }

        // PDF export
        $pdf = $this->exportService->exportEventToPdf($event);
        
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"attendance-{$event->id}.pdf\"",
        ]);
    }

    /**
     * Export group statistics
     */
    public function group(Request $request, Group $group)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $format = $request->get('format', 'pdf');

        if ($format === 'xlsx') {
            return Excel::download(
                new \App\Exports\GroupStatisticsExport($group, $startDate, $endDate),
                "group-stats-{$group->id}.xlsx"
            );
        }

        // PDF export
        $pdf = $this->exportService->exportGroupStatsToPdf($group, $startDate, $endDate);
        
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"group-stats-{$group->id}.pdf\"",
        ]);
    }
}

