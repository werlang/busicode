-- Active: 1719023526548@@localhost@3306@busicode
-- BusiCode Database Schema
-- This schema supports the educational business simulation application

-- Create database (run this separately if needed)
-- CREATE DATABASE busicode_db;
-- USE busicode_db;

-- Classes table (classrooms)
CREATE TABLE classes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    initial_balance DECIMAL(10,2) DEFAULT 0.00,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_students_class (class_id)
);

-- Companies table
CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    initial_budget DECIMAL(10,2) DEFAULT 0.00,
    current_budget DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_companies_class (class_id)
);

-- Company members (junction table for students and companies)
CREATE TABLE company_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    contribution DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_student (company_id, student_id),
    INDEX idx_company_members_company (company_id),
    INDEX idx_company_members_student (student_id)
);

-- Company expenses
CREATE TABLE company_expenses (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_expenses_company (company_id),
    INDEX idx_company_expenses_date (created_at)
);

-- Company revenues
CREATE TABLE company_revenues (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_revenues_company (company_id),
    INDEX idx_company_revenues_date (created_at)
);

-- Products table
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    sales_count INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    launched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_products_company (company_id),
    INDEX idx_products_launched (launched_at)
);

-- Product sales
CREATE TABLE product_sales (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_sales_product (product_id),
    INDEX idx_product_sales_date (sale_date)
);

-- Sample data for testing (optional)
-- INSERT INTO classes (id, name) VALUES 
-- ('class-1', 'Turma A'),
-- ('class-2', 'Turma B');

-- INSERT INTO students (id, name, class_id, initial_balance, current_balance) VALUES
-- ('student-1', 'João Silva', 'class-1', 100.00, 100.00),
-- ('student-2', 'Maria Santos', 'class-1', 100.00, 100.00),
-- ('student-3', 'Pedro Costa', 'class-1', 100.00, 100.00),
-- ('student-4', 'Ana Oliveira', 'class-2', 150.00, 150.00);

-- INSERT INTO companies (id, name, class_id, initial_budget, current_budget) VALUES
-- ('company-1', 'TechStart', 'class-1', 200.00, 200.00),
-- ('company-2', 'EcoSolutions', 'class-2', 150.00, 150.00);

-- INSERT INTO company_members (company_id, student_id, contribution) VALUES
-- ('company-1', 'student-1', 100.00),
-- ('company-1', 'student-2', 100.00),
-- ('company-2', 'student-4', 150.00);
