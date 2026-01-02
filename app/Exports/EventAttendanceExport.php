<?php

namespace App\Exports;

use App\Models\Event;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EventAttendanceExport implements FromCollection, WithHeadings, WithTitle, WithStyles, ShouldAutoSize
{
    public function __construct(
        private Event $event
    ) {}

    public function collection()
    {
        $this->event->load(['registrations.student.profile', 'registrations.student.groups']);

        $index = 1;
        return $this->event->registrations->map(function ($registration) use (&$index) {
            $student = $registration->student;
            $profile = $student->profile;

            return [
                $index++,
                $profile?->lastname ?? '-',
                $profile?->firstname ?? '-',
                $student->email,
                $student->groups->first()?->name ?? '-',
                $registration->status === 'present' ? 'Присутній' : 'Відсутній',
                $registration->check_in_time?->format('H:i:s') ?? '-',
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
            'Група',
            'Статус',
            'Час відмітки',
        ];
    }

    public function title(): string
    {
        return 'Відвідуваність';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
