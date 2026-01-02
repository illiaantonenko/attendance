<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventRegistration;
use App\Models\Group;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin
        $admin = User::create([
            'email' => 'admin@attendance.local',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'moderated' => true,
            'email_verified_at' => now(),
        ]);
        Profile::create([
            'user_id' => $admin->id,
            'firstname' => 'Адміністратор',
            'lastname' => 'Системи',
        ]);

        // Create teachers
        $teachers = [];
        $teacherData = [
            ['firstname' => 'Олександр', 'lastname' => 'Петренко', 'email' => 'teacher1@attendance.local'],
            ['firstname' => 'Марія', 'lastname' => 'Коваленко', 'email' => 'teacher2@attendance.local'],
            ['firstname' => 'Сергій', 'lastname' => 'Іваненко', 'email' => 'teacher3@attendance.local'],
        ];

        foreach ($teacherData as $data) {
            $teacher = User::create([
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'moderated' => true,
                'email_verified_at' => now(),
            ]);
            Profile::create([
                'user_id' => $teacher->id,
                'firstname' => $data['firstname'],
                'lastname' => $data['lastname'],
            ]);
            $teachers[] = $teacher;
        }

        // Create groups
        $groups = [
            Group::create(['name' => 'КН-21', 'code' => 'КН-21', 'year' => 4, 'specialty' => 'Комп\'ютерні науки']),
            Group::create(['name' => 'КН-22', 'code' => 'КН-22', 'year' => 3, 'specialty' => 'Комп\'ютерні науки']),
            Group::create(['name' => 'ІПЗ-21', 'code' => 'ІПЗ-21', 'year' => 4, 'specialty' => 'Інженерія ПЗ']),
            Group::create(['name' => 'ІПЗ-22', 'code' => 'ІПЗ-22', 'year' => 3, 'specialty' => 'Інженерія ПЗ']),
            Group::create(['name' => 'КІ-23', 'code' => 'КІ-23', 'year' => 2, 'specialty' => 'Комп\'ютерна інженерія']),
        ];

        // Student names for realistic data
        $firstNames = ['Іван', 'Олена', 'Андрій', 'Наталія', 'Дмитро', 'Юлія', 'Олексій', 'Катерина', 
                       'Максим', 'Анна', 'Сергій', 'Марія', 'Віталій', 'Ольга', 'Богдан', 'Тетяна',
                       'Артем', 'Вікторія', 'Павло', 'Софія', 'Денис', 'Дарина', 'Роман', 'Аліна'];
        $lastNames = ['Шевченко', 'Бондаренко', 'Мельник', 'Кравченко', 'Ткаченко', 'Гриценко', 
                      'Савченко', 'Морозенко', 'Петренко', 'Коваленко', 'Іваненко', 'Сидоренко',
                      'Павленко', 'Кузьменко', 'Левченко', 'Олійник', 'Лисенко', 'Марченко'];

        // Create demo student with known credentials
        $demoStudent = User::create([
            'email' => 'student@attendance.local',
            'password' => Hash::make('password'),
            'role' => 'student',
            'moderated' => true,
            'email_verified_at' => now(),
        ]);
        Profile::create([
            'user_id' => $demoStudent->id,
            'firstname' => 'Демо',
            'lastname' => 'Студент',
        ]);
        $demoStudent->groups()->attach($groups[0]->id);

        $allStudents = [$demoStudent];

        // Create students for each group (8-12 per group)
        $studentCounter = 2;
        foreach ($groups as $groupIndex => $group) {
            $studentsPerGroup = rand(8, 12);
            
            for ($i = 0; $i < $studentsPerGroup; $i++) {
                $firstName = $firstNames[array_rand($firstNames)];
                $lastName = $lastNames[array_rand($lastNames)];
                
                $student = User::create([
                    'email' => 'student' . $studentCounter . '@attendance.local',
                    'password' => Hash::make('password'),
                    'role' => 'student',
                    'moderated' => true,
                    'email_verified_at' => now(),
                ]);
                Profile::create([
                    'user_id' => $student->id,
                    'firstname' => $firstName,
                    'lastname' => $lastName,
                ]);
                $student->groups()->attach($group->id);
                $allStudents[] = $student;
                $studentCounter++;
            }
        }

        // Create event categories
        $categories = [
            EventCategory::create(['name' => 'Програмування', 'color' => '#3B82F6', 'text_color' => '#FFFFFF']),
            EventCategory::create(['name' => 'Бази даних', 'color' => '#10B981', 'text_color' => '#FFFFFF']),
            EventCategory::create(['name' => 'Веб-технології', 'color' => '#8B5CF6', 'text_color' => '#FFFFFF']),
            EventCategory::create(['name' => 'Мережі', 'color' => '#F59E0B', 'text_color' => '#FFFFFF']),
            EventCategory::create(['name' => 'Математика', 'color' => '#EF4444', 'text_color' => '#FFFFFF']),
        ];

        // Event titles
        $eventTitles = [
            'lecture' => [
                'Основи програмування',
                'ООП: Принципи SOLID',
                'Бази даних: Нормалізація',
                'Комп\'ютерні мережі',
                'Алгоритми та структури даних',
                'Системний аналіз',
                'Операційні системи',
                'Дискретна математика',
            ],
            'seminar' => [
                'Практикум з Python',
                'SQL запити',
                'HTML/CSS основи',
                'Налаштування мереж',
                'Розбір алгоритмів',
            ],
            'lab' => [
                'Лабораторна: Цикли',
                'Лабораторна: JOIN запити',
                'Лабораторна: REST API',
                'Лабораторна: TCP/IP',
                'Лабораторна: Сортування',
            ],
            'exam' => [
                'Модульна контрольна №1',
                'Модульна контрольна №2',
                'Підсумковий тест',
            ],
        ];

        $eventTypes = ['lecture', 'lecture', 'seminar', 'lab', 'lab']; // More lectures and labs
        
        // Create events for past 30 days and next 14 days
        for ($day = -30; $day <= 14; $day++) {
            $date = now()->addDays($day)->startOfDay();
            
            // Skip weekends
            if ($date->isWeekend()) {
                continue;
            }

            // Create 3-5 events per day
            $numEvents = rand(3, 5);
            $hours = [8, 10, 12, 14, 16];
            shuffle($hours);

            for ($e = 0; $e < $numEvents; $e++) {
                $startHour = $hours[$e];
                $startTime = $date->copy()->setHour($startHour)->setMinute(0)->setSecond(0);
                $endTime = $startTime->copy()->addHour()->addMinutes(30);

                $eventType = $eventTypes[array_rand($eventTypes)];
                $titles = $eventTitles[$eventType];
                
                // Assign 1-2 groups per event
                $eventGroups = collect($groups)->random(rand(1, 2));
                
                $event = Event::create([
                    'teacher_id' => $teachers[array_rand($teachers)]->id,
                    'category_id' => $categories[array_rand($categories)]->id,
                    'title' => $titles[array_rand($titles)],
                    'description' => 'Заняття з курсу. ' . fake()->sentence(),
                    'event_type' => $eventType,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'location' => [
                        'lat' => 49.5883 + (rand(-10, 10) / 10000),
                        'lng' => 34.5514 + (rand(-10, 10) / 10000),
                        'building' => (string) rand(1, 5),
                        'room' => (string) rand(100, 500),
                    ],
                    'allowed_radius' => 100,
                    'qr_enabled' => true,
                    'geolocation_required' => rand(0, 1),
                    'published' => true,
                ]);

                $event->groups()->attach($eventGroups->pluck('id'));

                // Create registrations for past events
                if ($day < 0) {
                    // Get students from assigned groups
                    $eventGroupIds = $eventGroups->pluck('id')->toArray();
                    $eligibleStudents = collect($allStudents)->filter(function ($student) use ($eventGroupIds) {
                        return $student->groups->whereIn('id', $eventGroupIds)->isNotEmpty();
                    });

                    // Attendance rate varies: 70-95% for most events
                    $attendanceRate = rand(70, 95) / 100;

                    foreach ($eligibleStudents as $student) {
                        $isPresent = (rand(1, 100) / 100) <= $attendanceRate;
                        
                        EventRegistration::create([
                            'event_id' => $event->id,
                            'student_id' => $student->id,
                            'status' => $isPresent ? 'present' : 'absent',
                            'check_in_time' => $isPresent ? $startTime->copy()->addMinutes(rand(0, 15)) : null,
                            'check_in_location' => $isPresent ? [
                                'lat' => 49.5883 + (rand(-5, 5) / 10000),
                                'lng' => 34.5514 + (rand(-5, 5) / 10000),
                            ] : null,
                        ]);
                    }
                }
            }
        }

        // Summary
        $totalStudents = count($allStudents);
        $totalEvents = Event::count();
        $totalRegistrations = EventRegistration::count();
        $presentCount = EventRegistration::where('status', 'present')->count();

        $this->command->info('');
        $this->command->info('✅ Demo data seeded successfully!');
        $this->command->info('');
        $this->command->info("📊 Statistics:");
        $this->command->info("   Groups: " . count($groups));
        $this->command->info("   Students: {$totalStudents}");
        $this->command->info("   Teachers: " . count($teachers));
        $this->command->info("   Events: {$totalEvents}");
        $this->command->info("   Registrations: {$totalRegistrations}");
        $this->command->info("   Attendance rate: " . ($totalRegistrations > 0 ? round(($presentCount / $totalRegistrations) * 100, 1) : 0) . "%");
        $this->command->info('');
        $this->command->info('👤 Demo accounts:');
        $this->command->table(
            ['Email', 'Password', 'Role'],
            [
                ['admin@attendance.local', 'password', 'Admin'],
                ['teacher1@attendance.local', 'password', 'Teacher'],
                ['student@attendance.local', 'password', 'Student'],
            ]
        );
    }
}
