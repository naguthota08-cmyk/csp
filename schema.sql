-- ==============================================================================
-- SMART POULTRY PRECISION FARM MANAGEMENT SYSTEM
-- Target Database: MySQL 8.0+
-- Database Name: smart_poultry
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS smart_poultry
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_poultry;

-- Drop existing triggers to allow idempotent execution
DROP TRIGGER IF EXISTS trg_daily_records_after_insert;
DROP TRIGGER IF EXISTS trg_daily_records_after_update;

-- ------------------------------------------------------------------------------
-- 1. Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NULL UNIQUE,
    phone VARCHAR(25) NOT NULL UNIQUE,
    mobile_number VARCHAR(25) GENERATED ALWAYS AS (phone) VIRTUAL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('farmer', 'veterinarian', 'admin') NOT NULL DEFAULT 'farmer',
    mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
    account_status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'pending',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    specialization VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_phone (phone),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: otp_verifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otp_user_lookup (user_id, is_used, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: farms
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    farm_name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NULL,
    address TEXT NULL,
    total_capacity INT NOT NULL DEFAULT 0,
    farm_type VARCHAR(50) NOT NULL DEFAULT 'Broiler',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_farms_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_farms_capacity CHECK (total_capacity >= 0),
    INDEX idx_farms_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: flocks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    bird_type VARCHAR(100) NOT NULL DEFAULT 'Broiler',
    breed VARCHAR(100) NOT NULL,
    initial_bird_count INT NOT NULL,
    current_bird_count INT NOT NULL,
    arrival_date DATE NOT NULL,
    expected_sale_date DATE NULL,
    target_weight_kg DECIMAL(6, 2) NOT NULL DEFAULT 2.00,
    status ENUM('active', 'sold', 'closed') NOT NULL DEFAULT 'active',
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_flocks_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    CONSTRAINT uq_farm_batch UNIQUE (farm_id, batch_number),
    CONSTRAINT chk_initial_bird_count CHECK (initial_bird_count >= 0),
    CONSTRAINT chk_current_bird_count CHECK (current_bird_count >= 0),
    INDEX idx_flocks_farm_status (farm_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: daily_records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flock_id INT NOT NULL,
    record_date DATE NOT NULL,
    opening_birds INT NOT NULL,
    mortality INT NOT NULL DEFAULT 0,
    culls INT NOT NULL DEFAULT 0,
    closing_birds INT NOT NULL,
    average_weight_kg DECIMAL(6, 3) NOT NULL DEFAULT 0.000,
    feed_consumed_kg DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    water_consumed_liters DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    eggs_produced INT NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_daily_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE CASCADE,
    CONSTRAINT uq_flock_record_date UNIQUE (flock_id, record_date),
    CONSTRAINT chk_opening_birds CHECK (opening_birds >= 0),
    CONSTRAINT chk_mortality CHECK (mortality >= 0),
    CONSTRAINT chk_culls CHECK (culls >= 0),
    CONSTRAINT chk_closing_birds CHECK (closing_birds >= 0),
    CONSTRAINT chk_feed_consumed CHECK (feed_consumed_kg >= 0),
    CONSTRAINT chk_water_consumed CHECK (water_consumed_liters >= 0),
    CONSTRAINT chk_daily_eggs CHECK (eggs_produced >= 0),
    INDEX idx_daily_flock_date (flock_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: feed_records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flock_id INT NOT NULL,
    record_date DATE NOT NULL,
    feed_type VARCHAR(100) NOT NULL,
    quantity_kg DECIMAL(8, 2) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(150) NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feed_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE CASCADE,
    CONSTRAINT chk_feed_qty CHECK (quantity_kg >= 0),
    CONSTRAINT chk_feed_cost CHECK (total_cost >= 0),
    INDEX idx_feed_flock_date (flock_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: egg_records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flock_id INT NOT NULL,
    record_date DATE NOT NULL,
    eggs_produced INT NOT NULL DEFAULT 0,
    eggs_sold INT NOT NULL DEFAULT 0,
    damaged_eggs INT NOT NULL DEFAULT 0,
    selling_price_per_egg DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_egg_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE CASCADE,
    CONSTRAINT chk_egg_prod CHECK (eggs_produced >= 0),
    CONSTRAINT chk_egg_sold CHECK (eggs_sold >= 0),
    CONSTRAINT chk_egg_dam CHECK (damaged_eggs >= 0),
    INDEX idx_egg_flock_date (flock_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: environment_records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS environment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    flock_id INT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperature_celsius DECIMAL(5, 2) NOT NULL,
    humidity_percentage DECIMAL(5, 2) NOT NULL,
    ammonia_ppm DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    CONSTRAINT fk_env_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    CONSTRAINT fk_env_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
    CONSTRAINT chk_env_humidity CHECK (humidity_percentage >= 0.00 AND humidity_percentage <= 100.00),
    CONSTRAINT chk_env_ammonia CHECK (ammonia_ppm >= 0.00),
    INDEX idx_env_farm_time (farm_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: expenses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    flock_id INT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
    CONSTRAINT chk_expense_amount CHECK (amount >= 0.00),
    INDEX idx_expense_farm_date (farm_id, expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: sales
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    flock_id INT NULL,
    sale_date DATE NOT NULL,
    product_type ENUM('birds', 'eggs', 'manure', 'other') NOT NULL DEFAULT 'birds',
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    buyer_name VARCHAR(150) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
    CONSTRAINT chk_sales_qty CHECK (quantity >= 0.00),
    CONSTRAINT chk_sales_amount CHECK (total_amount >= 0.00),
    INDEX idx_sales_farm_date (farm_id, sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: tasks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    flock_id INT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
    INDEX idx_tasks_farm_status (farm_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: alerts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    flock_id INT NULL,
    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'danger', 'critical') NOT NULL DEFAULT 'warning',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerts_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    CONSTRAINT fk_alerts_flock FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
    INDEX idx_alerts_farm_unread (farm_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- TRIGGERS: Automatically maintain flock current_bird_count from daily records
-- ------------------------------------------------------------------------------
DELIMITER //

CREATE TRIGGER trg_daily_records_after_insert
AFTER INSERT ON daily_records
FOR EACH ROW
BEGIN
    UPDATE flocks
    SET current_bird_count = GREATEST(0, NEW.closing_birds)
    WHERE id = NEW.flock_id;
END;
//

CREATE TRIGGER trg_daily_records_after_update
AFTER UPDATE ON daily_records
FOR EACH ROW
BEGIN
    UPDATE flocks
    SET current_bird_count = GREATEST(0, NEW.closing_birds)
    WHERE id = NEW.flock_id;
END;
//

DELIMITER ;
