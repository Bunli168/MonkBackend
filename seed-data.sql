-- ============================================================
-- SEED DATA — 5 records per table
-- Pagoda Management System
-- ============================================================

-- ១. roles
INSERT INTO
    roles (name, description)
VALUES (
        'SuperAdmin',
        'ចៅអធិការ — គ្រប់គ្រងប្រព័ន្ធទាំងអស់'
    ),
    (
        'Admin',
        'មេកុដិ — គ្រប់គ្រងកុដិ'
    ),
    (
        'Monk',
        'ព្រះសង្ឃ — សមាជិកកុដិ'
    ),
    (
        'Student',
        'និស្សិត — សិក្ខាកាម'
    ),
    (
        'Guest',
        'ភ្ញៀវវត្ត — មិនទាន់បញ្ជាក់អត្តសញ្ញាណ'
    );

-- ១.៥. provinces
INSERT INTO
    provinces (name, name_en)
VALUES ('ភ្នំពេញ', 'Phnom Penh'),
    ('សៀមរាប', 'Siem Reap'),
    ('កំពង់ចាម', 'Kampong Cham'),
    ('បាត់ដំបង', 'Battambang'),
    ('តាកែវ', 'Takeo');

-- ១.៦. districts
INSERT INTO
    districts (province_id, name, name_en)
VALUES (1, 'ចំការមន', 'Chamkar Mon'),
    (1, 'ដូនពេញ', 'Doun Penh'),
    (2, 'អង្គរធំ', 'Angkor Thom'),
    (3, 'ស្ទឹងត្រង់', 'Stueng Trang'),
    (4, 'ឯកភ្នំ', 'Ek Phnom');

-- ១.៧. communes
INSERT INTO
    communes (district_id, name, name_en)
VALUES (1, 'ទន្លេបាសាក់', 'Tonle Bassac'),
    (2, 'ផ្សារថ្មី', 'Psar Thmei'),
    (3, 'ស្រុកថ្ម', 'Srok Thmei'),
    (4, 'ព្រែកប្រហុក', 'Prey Phreah'),
    (5, 'ស្លក', 'Slork');

-- ២. kuts
INSERT INTO
    kuts (name, description)
VALUES (
        'កុដិ អ',
        'កុដិទី១ ជាកុដិសម្រាប់ព្រះសង្ឃជំទង់'
    ),
    (
        'កុដិ ខ',
        'កុដិទី២ ជាកុដិសម្រាប់ព្រះសង្ឃចំណាស់'
    ),
    (
        'កុដិ គ',
        'កុដិទី៣ ជាកុដិសម្រាប់និស្សិតសង្ឃ'
    ),
    (
        'កុដិ ឃ',
        'កុដិទី៤ ជាកុដិសម្រាប់ព្រះសង្ឃអន្ដសប្ត'
    ),
    (
        'កុដិ ង',
        'កុដិទី៥ ជាកុដិខ្នាតតូចដាច់ដោយឡែក'
    );

-- ៣. users  (role_id references roles, created_by references users for admin-student relationship)
INSERT INTO
    users (
        email,
        password,
        role_id,
        created_by,
        email_verified_at,
        status
    )
VALUES (
        'superadmin@pagoda.kh',
        '$2b$10$hashedpassword1',
        1,
        NULL,
        NOW(),
        'active'
    ),
    (
        'admin.kuta@pagoda.kh',
        '$2b$10$hashedpassword2',
        2,
        1,
        NOW(),
        'active'
    ),
    (
        'monk.sophal@pagoda.kh',
        '$2b$10$hashedpassword3',
        3,
        2,
        NOW(),
        'active'
    ),
    (
        'monk.dara@pagoda.kh',
        '$2b$10$hashedpassword4',
        3,
        2,
        NULL,
        'pending'
    ),
    (
        'student.ratana@pagoda.kh',
        '$2b$10$hashedpassword5',
        4,
        2,
        NOW(),
        'active'
    );

-- ៤. user_profiles  (user_id → users, kut_id → kuts)
INSERT INTO
    user_profiles (
        user_id,
        kut_id,
        first_name_kh,
        last_name_kh,
        first_name_en,
        last_name_en,
        phone_number,
        chhaya_number,
        university_year,
        date_of_birth,
        ordained_date
    )
VALUES (
        1,
        NULL,
        'ធារ៉ា',
        'ស៊ិន',
        'Dara',
        'Sin',
        '012000001',
        NULL,
        NULL,
        '1970-03-15',
        NULL
    ),
    (
        2,
        1,
        'សុភ័ព',
        'ខេម',
        'Sophap',
        'Khem',
        '012000002',
        NULL,
        NULL,
        '1985-06-20',
        NULL
    ),
    (
        3,
        1,
        'សុផល',
        'ណូ',
        'Sophal',
        'Nou',
        '012000003',
        'CH-0011',
        'ឆ្នាំ១',
        '1998-09-10',
        '2015-04-01'
    ),
    (
        4,
        2,
        'ដារ៉ា',
        'ប៊ុន',
        'Dara',
        'Bun',
        '012000004',
        'CH-0022',
        'ឆ្នាំ២',
        '2000-01-25',
        '2018-07-15'
    ),
    (
        5,
        3,
        'រតនា',
        'ជា',
        'Ratana',
        'Chea',
        '012000005',
        NULL,
        'ឆ្នាំ៣',
        '2003-11-05',
        NULL
    );

-- ៥. addresses  (user_id → users, province_id → provinces, district_id → districts, commune_id → communes)
INSERT INTO
    addresses (
        user_id,
        address_type,
        province_id,
        district_id,
        commune_id,
        village
    )
VALUES (
        1,
        'birth_place',
        1,
        1,
        1,
        'ភូមិថ្មី'
    ),
    (
        2,
        'birth_place',
        2,
        3,
        3,
        'ភូមិស្រព'
    ),
    (
        3,
        'current_place',
        1,
        2,
        2,
        'ភូមិចាស់'
    ),
    (
        4,
        'birth_place',
        3,
        4,
        4,
        'ភូមិចំការ'
    ),
    (
        5,
        'current_place',
        4,
        5,
        5,
        'ភូមិថ្មី'
    );

-- ៦. documents  (user_id → users)
INSERT INTO
    documents (
        user_id,
        document_type,
        file_path
    )
VALUES (
        1,
        'id_card',
        'uploads/docs/user1_id_card.pdf'
    ),
    (
        2,
        'id_card',
        'uploads/docs/user2_id_card.pdf'
    ),
    (
        3,
        'chhaya',
        'uploads/docs/user3_chhaya.pdf'
    ),
    (
        4,
        'chhaya',
        'uploads/docs/user4_chhaya.pdf'
    ),
    (
        5,
        'student_card',
        'uploads/docs/user5_student_card.pdf'
    );

-- ៧. events  (kut_id → kuts, created_by → users)
INSERT INTO
    events (
        title,
        description,
        event_level,
        kut_id,
        created_by,
        start_date,
        end_date
    )
VALUES (
        'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
        'ពិធីប្រចាំឆ្នាំសម្រាប់ជូនទាន',
        'wat',
        NULL,
        1,
        '2026-09-25 07:00:00',
        '2026-09-27 18:00:00'
    ),
    (
        'ការសូត្រធម៌ប្រចាំខែ',
        'សូត្រធម៌ប្រចាំខែតុលា',
        'kut',
        1,
        2,
        '2026-10-01 06:00:00',
        '2026-10-01 09:00:00'
    ),
    (
        'ពិធីភ្ជាប់សីល',
        'ការភ្ជាប់សីល ៨ ប្រការ',
        'kut',
        2,
        2,
        '2026-10-15 05:30:00',
        '2026-10-15 08:00:00'
    ),
    (
        'ពិធីបុណ្យកឋិន',
        'ពិធីបុណ្យបញ្ចប់វស្សា',
        'wat',
        NULL,
        1,
        '2026-11-01 07:00:00',
        '2026-11-01 17:00:00'
    ),
    (
        'ចែករំលែកចំណេះដឹងធម៌',
        'សិក្ខាសាលាសម្រាប់ព្រះសង្ឃ និងជន',
        'kut',
        3,
        2,
        '2026-11-20 08:00:00',
        '2026-11-20 12:00:00'
    );

-- ៨. event_attendees  (event_id → events, user_id → users, assigned_by → users)
INSERT INTO
    event_attendees (
        event_id,
        user_id,
        assigned_by,
        attendance_status
    )
VALUES (1, 3, 1, 'present'),
    (1, 4, 1, 'absent'),
    (2, 3, 2, 'present'),
    (3, 4, 2, 'excused'),
    (4, 5, 1, 'pending');

-- ៩. messages  (sender_id → users)
INSERT INTO
    messages (
        sender_id,
        subject,
        body,
        is_broadcast
    )
VALUES (
        1,
        'សូមស្វាគមន៍',
        'សូមស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងវត្ត',
        TRUE
    ),
    (
        1,
        'ការជូនដំណឹងពិធី',
        'ពិធីបុណ្យភ្ជុំបិណ្ឌ នឹងប្រព្រឹត្តទៅ ២៥ កញ្ញា',
        FALSE
    ),
    (
        2,
        'របាយការណ៍ប្រចាំខែ',
        'សូមមើលរបាយការណ៍ប្រចាំខែ',
        FALSE
    ),
    (
        3,
        'សំណួរអំពីកម្មវិធី',
        'តើការបណ្ដុះបណ្ដាលនៅថ្ងៃណា?',
        FALSE
    ),
    (
        1,
        'ប្រកាសសៀវភៅវិន័យ',
        'ប្រកាសសៀវភៅវិន័យប្រចាំឆ្នាំ ២០២៦',
        TRUE
    );

-- ១០. message_recipients  (message_id → messages, receiver_id → users)
INSERT INTO
    message_recipients (
        message_id,
        receiver_id,
        is_read,
        read_at
    )
VALUES (1, 2, TRUE, NOW()),
    (1, 3, FALSE, NULL),
    (2, 3, TRUE, NOW()),
    (3, 1, TRUE, NOW()),
    (4, 2, FALSE, NULL);

-- ១១. reports  (kut_id → kuts, reported_by → users)
INSERT INTO
    reports (
        kut_id,
        reported_by,
        title,
        content,
        status
    )
VALUES (
        1,
        2,
        'របាយការណ៍ខែតុលា',
        'ព្រះសង្ឃទាំង ១០ អង្គ ចូលរួមយ៉ាងសកម្ម',
        'submitted'
    ),
    (
        2,
        2,
        'របាយការណ៍ខែវិច្ឆិកា',
        'ការអភិវឌ្ឍន៍ធម៌ជំហានល្អ',
        'reviewed'
    ),
    (
        1,
        2,
        'របាយការណ៍ខែធ្នូ',
        'ប្រព័ន្ធការអប់រំព្រះធម៌ដំណើរការប្រក្រតី',
        'resolved'
    ),
    (
        3,
        2,
        'របាយការណ៍ខែមករា',
        'និស្សិតជំទង់ចូលរួមសិក្ខាសាលា',
        'submitted'
    ),
    (
        4,
        2,
        'របាយការណ៍ខែកុម្ភៈ',
        'ពិធីបំពេញតម្រូវការផ្នែកសីលធម៌',
        'submitted'
    );

-- ១២. public_contents  (published_by → users)
INSERT INTO
    public_contents (
        title,
        content_type,
        media_url,
        description,
        published_by,
        is_published
    )
VALUES (
        'ធម្មទេសនា — ព្រះត្រៃបិដក',
        'video',
        'https://youtube.com/watch?v=abc123',
        'ការបង្រៀនធម៌ស៊ីជម្រៅ',
        1,
        TRUE
    ),
    (
        'រូបភាពពិធីភ្ជាប់សីល',
        'photo',
        'uploads/media/sil_ceremony.jpg',
        'រូបភាពពីពិធីភ្ជាប់សីល ២០២៦',
        1,
        TRUE
    ),
    (
        'ប្រកាសសំខាន់ — ២០២៦',
        'announcement',
        NULL,
        'ការប្រកាសផ្លូវការ',
        1,
        TRUE
    ),
    (
        'ធម្មទេសនា — ហ្វូមមន',
        'video',
        'https://youtube.com/watch?v=def456',
        'ព្រះបន្ទូលបញ្ជ្រាបចិត្ត',
        1,
        TRUE
    ),
    (
        'កម្រងរូបភាពពិធីបុណ្យ',
        'photo',
        'uploads/media/gallery_2026.jpg',
        'ការប្រជុំប្រចាំឆ្នាំ ២០២៦',
        1,
        TRUE
    );