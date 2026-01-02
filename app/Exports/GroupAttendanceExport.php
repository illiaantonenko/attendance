<?php

namespace App\Exports;

use App\Models\Event;
use App\Models\Group;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GroupAttendanceExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private $events;
    private $students;

    public function __construct(
        private Group $group,
        private string $startDate,
        private string $endDate
    ) {
        $this->events = Event::whereHas('groups', function ($q) use ($group) {
            $q->where('groups.id', $group->id);
        })->whereBetween('start_time', [$startDate, $endDate])
            ->orderBy('start_time')
            ->get();

        $this->students = $group->students()->with('profile', 'registrations')->get();
    }

    public function collection()
    {
        return $this->students;
    }

    public function headings(): array
    {
        $headings = ['№', 'Прізвище', 'Ім\'я'];
        
        foreach ($this->events as $event) {
            $headings[] = $event->start_time->format('d.m');
        }
        
        $headings[] = 'Всього';
        $headings[] = '%';
        
        return $headings;
    }

    public function map($student): array
    {
        static $index = 0;
        $index++;

        $row = [
            $index,
            $student->profile?->lastname ?? '-',
            $student->profile?->firstname ?? '-',
        ];

        $attendedCount = 0;
        foreach ($this->events as $event) {
            $registration = $student->registrations->firstWhere('event_id', $event->id);
            if ($registration && $registration->check_in_time) {
                $row[] = '+';
                $attendedCount++;
            } else {
                $row[] = '-';
            }
        }

        $totalEvents = $this->events->count();
        $percentage = $totalEvents > 0 ? round(($attendedCount / $totalEvents) * 100) : 0;

        $row[] = "{$attendedCount}/{$totalEvents}";
        $row[] = "{$percentage}%";

        return $row;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function title(): string
    {
        return "Група {$this->group->name}";
    }
}

