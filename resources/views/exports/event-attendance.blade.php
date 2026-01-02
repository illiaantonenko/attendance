<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Відвідуваність - {{ $event->title }}</title>
    <style>
        * {
            font-family: DejaVu Sans, sans-serif;
        }
        body {
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
        }
        .header h2 {
            margin: 5px 0;
            font-size: 14px;
            font-weight: normal;
            color: #666;
        }
        .info {
            margin-bottom: 20px;
        }
        .info-row {
            margin-bottom: 5px;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #333;
            padding: 6px 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .status-present {
            color: green;
            font-weight: bold;
        }
        .status-absent {
            color: red;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 10px;
            color: #666;
        }
        .stats {
            background-color: #f5f5f5;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .stats-row {
            display: inline-block;
            margin-right: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Звіт про відвідуваність</h1>
        <h2>{{ $event->title }}</h2>
    </div>

    <div class="info">
        <div class="info-row">
            <span class="info-label">Дата:</span>
            {{ $event->start_time->format('d.m.Y') }}
        </div>
        <div class="info-row">
            <span class="info-label">Час:</span>
            {{ $event->start_time->format('H:i') }} - {{ $event->end_time->format('H:i') }}
        </div>
        <div class="info-row">
            <span class="info-label">Викладач:</span>
            {{ $event->teacher?->full_name ?? '-' }}
        </div>
        @if($event->location)
        <div class="info-row">
            <span class="info-label">Місце:</span>
            @if($event->location['building'] ?? null)Корпус {{ $event->location['building'] }}, @endif
            @if($event->location['room'] ?? null)Ауд. {{ $event->location['room'] }}@endif
        </div>
        @endif
    </div>

    <div class="stats">
        <span class="stats-row"><strong>Присутніх:</strong> {{ $registrations->where('status', 'present')->count() }}</span>
        <span class="stats-row"><strong>Відсутніх:</strong> {{ $registrations->where('status', 'absent')->count() }}</span>
        <span class="stats-row"><strong>Відвідуваність:</strong> {{ $attendanceRate }}%</span>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 30px">№</th>
                <th>Прізвище</th>
                <th>Ім'я</th>
                <th>Email</th>
                <th style="width: 80px">Статус</th>
                <th style="width: 70px">Час</th>
            </tr>
        </thead>
        <tbody>
            @foreach($registrations as $index => $registration)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $registration->student->profile?->lastname ?? '-' }}</td>
                <td>{{ $registration->student->profile?->firstname ?? '-' }}</td>
                <td>{{ $registration->student->email }}</td>
                <td class="{{ $registration->status === 'present' ? 'status-present' : 'status-absent' }}">
                    {{ $registration->status === 'present' ? 'Присутній' : 'Відсутній' }}
                </td>
                <td>{{ $registration->check_in_time?->format('H:i') ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Згенеровано: {{ $generatedAt }}
    </div>
</body>
</html>

