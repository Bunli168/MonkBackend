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