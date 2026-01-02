<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Статистика групи - {{ $group->name }}</title>
    <style>
        * {
            font-family: DejaVu Sans, sans-serif;
        }
        body {
            font-size: 11px;
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
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #333;
            padding: 5px 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .rate-high {
            color: green;
            font-weight: bold;
        }
        .rate-medium {
            color: orange;
        }
        .rate-low {
            color: red;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 10px;
            color: #666;
        }
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Статистика відвідуваності</h1>
        <h2>Група: {{ $group->name }}</h2>
        @if($period['start'] && $period['end'])
        <h2>Період: {{ $period['start'] }} - {{ $period['end'] }}</h2>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 30px">№</th>
                <th>Прізвище</th>
                <th>Ім'я</th>
                <th>Email</th>
                <th class="text-center" style="width: 80px">Всього</th>
                <th class="text-center" style="width: 80px">Відвідано</th>
                <th class="text-center" style="width: 80px">Пропущено</th>
                <th class="text-center" style="width: 100px">Відвідуваність</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $index => $item)
            @php
                $rateClass = $item['rate'] >= 80 ? 'rate-high' : ($item['rate'] >= 50 ? 'rate-medium' : 'rate-low');
            @endphp
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $item['student']->profile?->lastname ?? '-' }}</td>
                <td>{{ $item['student']->profile?->firstname ?? '-' }}</td>
                <td>{{ $item['student']->email }}</td>
                <td class="text-center">{{ $item['total_events'] }}</td>
                <td class="text-center">{{ $item['attended'] }}</td>
                <td class="text-center">{{ $item['missed'] }}</td>
                <td class="text-center {{ $rateClass }}">{{ $item['rate'] }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Згенеровано: {{ $generatedAt }}
    </div>
</body>
</html>

