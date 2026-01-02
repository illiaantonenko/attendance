<?php

namespace App\Exports;

use App\Models\Group;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GroupStatisticsExport implements FromCollection, WithHeadings, WithTitle, WithStyles, ShouldAutoSize
{
    public function __construct(
        private Group $group,
        private ?string $startDate = null,
        private ?string $endDate = null
    ) {}

    public function collection()
    {
        $this->group->load(['students.profile', 'events']);

        $index = 1;
        return $this->group->students->map(function ($student) use (&$index) {
            $totalEvents = $this->group->events->count();
            $attended = $student->eventRegistrations()
                ->whereIn('event_id', $this->group->events->pluck('id'))
                ->where('status', 'present')
                ->count();
            
            $rate = $totalEvents > 0 ? round(($attended / $totalEvents) * 100, 1) : 0;

            return [
                $index++,
                $student->profile?->lastname ?? '-',
                $student->profile?->firstname ?? '-',
                $student->email,
                $totalEvents,
                $attended,
                $totalEvents - $attended,
                $rate . '%',
            ];
        });
    }

    public function headings(): array
    {
        return [
            '№',
            'Прізвище',
            'Ім\'я',
            'Email',
            'Всього занять',
            'Відвідано',
            'Пропущено',
            'Відвідуваність',
        ];
    }

    public function title(): string
    {
        return $this->group->name;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

