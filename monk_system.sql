-- ============================================================
-- PAGODA MANAGEMENT SYSTEM (MONK_DB)
-- FULL DATABASE SCHEMA & SEED DATA (UNIFIED SYSTEM SQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS monk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monk_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- PART 1: TABLE CREATION (SCHEMAS)
-- ============================================================

-- ១. តារាងសិទ្ធិអ្នកប្រើប្រាស់ (Roles: SuperAdmin, Admin, Monk, Student)
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- ១.៥. តារាងខេត្ត (Provinces)
CREATE TABLE provinces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ១.៦. តារាងស្រុក/ខណ្ឌ (Districts)
CREATE TABLE districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE CASCADE
);

-- ១.៧. តារាងឃុំ/សង្កាត់ (Communes)
CREATE TABLE communes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE CASCADE
);

-- ២. តារាងកុដិ (Kuts)
CREATE TABLE kuts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ៣. តារាងអ្នកប្រើប្រាស់ (Users - សម្រាប់ Login និងផ្ទៀងផ្ទាត់ Email)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_by INT NULL,
    email_verified_at TIMESTAMP NULL,
    verification_token VARCHAR(255) NULL,
    status ENUM(
        'active',
        'inactive',
        'pending'
    ) DEFAULT 'pending',
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

-- ៤. តារាងប្រវត្តិរូបលម្អិត (User Profiles - ព័ត៌មានព្រះសង្ឃ/និស្សិត)
CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    kut_id INT, -- សមាជិកស្ថិតនៅកុដិណា (SuperAdmin អាចអត់មានកុដិ)
    first_name_kh VARCHAR(100) NOT NULL,
    last_name_kh VARCHAR(100) NOT NULL,
    first_name_en VARCHAR(100),
    last_name_en VARCHAR(100),
    phone_number VARCHAR(20),
    chhaya_number VARCHAR(50) UNIQUE, -- លេខឆាយា (សម្រាប់ព្រះសង្ឃ)
    university_year VARCHAR(50), -- ឆ្នាំសិក្សាសាកលវិទ្យាល័យ
    date_of_birth DATE,
    ordained_date DATE, -- ថ្ងៃបួស (សម្រាប់ព្រះសង្ឃ)
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (kut_id) REFERENCES kuts (id) ON DELETE SET NULL
);

-- ៥. តារាងអាសយដ្ឋាន (Addresses - បំបែកទិន្នន័យដើម្បីងាយស្រួលស្វែងរក)
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_type ENUM(
        'birth_place',
        'current_place'
    ) DEFAULT 'birth_place',
    province_id INT NOT NULL,
    district_id INT,
    commune_id INT,
    village VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE RESTRICT,
    FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE SET NULL,
    FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE SET NULL
);

-- ៦. តារាងឯកសារ (Documents - រក្សាទុកឯកសារយោងផ្សេងៗ)
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type ENUM(
        'id_card',
        'chhaya',
        'student_card',
        'other'
    ) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ៧. តារាងកម្មវិធី (Events - កម្មវិធីកម្រិតវត្ត ឬ កម្រិតកុដិ)
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_level ENUM('wat', 'kut') NOT NULL,
    kut_id INT NULL, -- NULL ប្រសិនបើជាកម្មវិធីកម្រិតវត្ត (Wat Event)
    created_by INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    FOREIGN KEY (kut_id) REFERENCES kuts (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

-- ៨. តារាងចាត់តាំង និងវត្តមាន (Event Assignments & Attendance)
CREATE TABLE event_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_by INT NOT NULL, -- អ្នកចាត់តាំង (មេកុដិ ឬ ចៅអធិការ)
    attendance_status ENUM(
        'pending',
        'present',
        'absent',
        'excused'
    ) DEFAULT 'pending',
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE CASCADE
);

-- ៩. តារាងសារ (Messages - សម្រាប់ផ្ញើសារទូទៅ ឬឯកជន)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT FALSE, -- TRUE បើផ្ញើទៅគ្រប់មេកុដិ
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ១០. តារាងអ្នកទទួលសារ (Message Recipients - សម្រាប់សារឯកជន ឬបញ្ជាក់ការអាន)
CREATE TABLE message_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    receiver_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ១១. តារាងរបាយការណ៍ (Reports - មេកុដិរាយការណ៍ទៅចៅអធិការ)
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kut_id INT NOT NULL,
    reported_by INT NOT NULL, -- Admin (មេកុដិ)
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status ENUM(
        'submitted',
        'reviewed',
        'resolved'
    ) DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kut_id) REFERENCES kuts (id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users (id) ON DELETE CASCADE
);

-- ១២. តារាងមាតិកាសាធារណៈ (Public Portals - វីដេអូធម៌ និងរូបភាព)
CREATE TABLE public_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type ENUM(
        'video',
        'photo',
        'announcement'
    ) NOT NULL,
    media_url VARCHAR(255), -- URL វីដេអូ (ឧ. YouTube) ឬ Path រូបភាព
    description TEXT,
    published_by INT NOT NULL, -- SuperAdmin (ចៅអធិការ)
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (published_by) REFERENCES users (id) ON DELETE CASCADE
);
-- ៥.៥. តារាងវត្តមាន (Attendances - គ្រប់គ្រងវត្តមានព្រះសង្ឃ និងនិស្សិត)
CREATE TABLE IF NOT EXISTS attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    kut_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent') NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (kut_id) REFERENCES kuts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- PART 2: SEED DATA (5 RECORDS PER TABLE)
-- ============================================================

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
-- ៨.៥. attendances (user_id → users, kut_id → kuts)
INSERT INTO
    attendances (
        user_id,
        kut_id,
        date,
        status,
        notes
    )
VALUES (
        3,
        1,
        '2026-07-25',
        'present',
        'វត្តមានពេញលេញ'
    ),
    (
        4,
        2,
        '2026-07-25',
        'present',
        'ចូលរួមទាន់ពេលវេលា'
    ),
    (
        5,
        3,
        '2026-07-25',
        'absent',
        'មានច្បាប់ឈឺ'
    ),
    (
        3,
        1,
        '2026-07-26',
        'present',
        'វត្តមាន'
    ),
    (
        4,
        2,
        '2026-07-26',
        'present',
        'វត្តមាន'
    );


SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- END OF SYSTEM SQL
-- ============================================================
