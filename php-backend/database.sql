-- ==============================================================================
-- Products REST API - MySQL Database Schema & Seed Data
-- ==============================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS my_database
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE my_database;

-- 2. Create Products Table
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insert Initial Seed Products
INSERT INTO products (name, description, price) VALUES
('Ultra-Wide 4K Studio Monitor 34"', 'Curved IPS display with HDR600, 99% DCI-P3 color gamut, and Thunderbolt 4 hub.', 899.99),
('Ergonomic Wireless Mechanical Keyboard', 'Low-profile mechanical switches, wireless multi-device pairing, and aluminum chassis.', 149.50),
('Precision Studio Mouse', 'Darkfield laser sensor with 8000 DPI, hyper-fast scroll wheel, and ergonomic thumb rest.', 99.00),
('Active Noise-Cancelling Studio Headphones', 'Custom 40mm beryllium drivers, spatial audio support, and 30-hour battery life.', 349.99),
('Thunderbolt 4 Quad-Display Dock', 'Dual 4K@120Hz output, 100W Power Delivery, Gigabit Ethernet, and SD UHS-II slot.', 229.00),
('Desk-Mounted Articulated Microphone Boom Arm', 'Internal spring cable-management system with 360-degree silent rotation.', 79.99),
('Studio Pro Condenser Microphone', 'Large diaphragm cardioid condenser with integrated pop filter and shockmount.', 199.95),
('Ergonomic Mesh Task Chair', 'Breathable elastomeric mesh with dynamic lumbar support and 4D armrests.', 599.00),
('Smart Motorized Standing Desk 60x30', 'Dual-motor electric height adjustment with 4 memory presets and cable tray.', 649.50),
('Color-Calibrated LED Light Bar', 'Anti-glare monitor light bar with wireless rotary dial and ambient backlight.', 65.00),
('Portable SSD 2TB Rugged NVMe', 'Up to 2000 MB/s read/write speeds with IP65 water and dust resistance.', 179.99),
('4K 60FPS Ultra HD Webcam', 'Sony STARVIS sensor with autofocus, dual beamforming microphones, and privacy shutter.', 129.95);
