-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 14, 2025 at 07:47 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `capstone`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `ForecastingData` ()   BEGIN
    -- Variables for configuration
    DECLARE i INT DEFAULT 0;
    DECLARE currentDate DATE;
    DECLARE userId INT;
    DECLARE staffId INT;
    DECLARE productId INT;
    DECLARE quantity INT;
    DECLARE price DECIMAL(10,2);
    DECLARE orderId CHAR(7);
    
    -- Get a valid user and staff ID
    SELECT id INTO userId FROM users WHERE role = 'user' ORDER BY id LIMIT 1;
    SELECT id INTO staffId FROM users WHERE role = 'staff' ORDER BY id LIMIT 1;
    
    -- Start date (90 days ago)
    SET currentDate = DATE_SUB(CURDATE(), INTERVAL 90 DAY);
    
    -- Generate data for each day
    WHILE i < 90 DO
        -- For each product ID 34-40, create sales data with specific patterns
        
        -- Product 34 (GSM Blue 700mL) - Strong upward trend
        SET productId = 34;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Base quantity with upward trend and day-of-week seasonality
        SET quantity = 2 + FLOOR(i/15) + IF(WEEKDAY(currentDate) IN (5,6), 2, 0);
        
        -- Create order
        SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
        INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
        VALUES (orderId, userId, quantity * price, 'paid', 
               DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
               DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
               staffId, NULL);
               
        -- Add order item
        INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
        VALUES (orderId, productId, quantity, price, NULL);
        
        -- Update totals
        UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        
        -- Product 35 (GSM Blue 1L) - Stable with weekly pattern
        SET productId = 35;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Stable base with strong weekend peaks
        SET quantity = 1 + IF(WEEKDAY(currentDate) IN (5,6), 3, 0);
        
        -- Skip some days to create sparse data pattern
        IF RAND() < 0.8 THEN
            -- Create order
            SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
            INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
            VALUES (orderId, userId, quantity * price, 'paid', 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
                   staffId, NULL);
                   
            -- Add order item
            INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
            VALUES (orderId, productId, quantity, price, NULL);
            
            -- Update totals
            UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        END IF;
        
        -- Product 37 (Primera Light 1L) - Declining trend
        SET productId = 37;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Declining trend (higher at start, lower at end)
        SET quantity = 4 - FLOOR(i/30);
        IF quantity < 1 THEN SET quantity = 1; END IF;
        
        -- Skip some days to create sparse data pattern
        IF RAND() < 0.7 THEN
            -- Create order
            SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
            INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
            VALUES (orderId, userId, quantity * price, 'paid', 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
                   staffId, NULL);
                   
            -- Add order item
            INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
            VALUES (orderId, productId, quantity, price, NULL);
            
            -- Update totals
            UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        END IF;
        
        -- Product 38 (GSM Blue Flavors 700mL) - Cyclical pattern (14-day cycle)
        SET productId = 38;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Cyclical pattern with 14-day period
        SET quantity = 1 + FLOOR(2 * SIN(i * 0.448)); -- 0.448 gives ~14 day cycle
        IF quantity < 1 THEN SET quantity = 1; END IF;
        
        -- Skip some days to create sparse data pattern
        IF RAND() < 0.75 THEN
            -- Create order
            SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
            INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
            VALUES (orderId, userId, quantity * price, 'paid', 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
                   staffId, NULL);
                   
            -- Add order item
            INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
            VALUES (orderId, productId, quantity, price, NULL);
            
            -- Update totals
            UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        END IF;
        
        -- Move to next day
        SET currentDate = DATE_ADD(currentDate, INTERVAL 1 DAY);
        SET i = i + 1;
    END WHILE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GenerateForecastingData` ()   BEGIN
    -- Variables for configuration
    DECLARE i INT DEFAULT 0;
    DECLARE currentDate DATE;
    DECLARE userId INT;
    DECLARE staffId INT;
    DECLARE productId INT;
    DECLARE quantity INT;
    DECLARE price DECIMAL(10,2);
    DECLARE orderId CHAR(7);
    
    -- Get a valid user and staff ID
    SELECT id INTO userId FROM users WHERE role = 'user' ORDER BY id LIMIT 1;
    SELECT id INTO staffId FROM users WHERE role = 'staff' ORDER BY id LIMIT 1;
    
    -- Start date (90 days ago)
    SET currentDate = DATE_SUB(CURDATE(), INTERVAL 90 DAY);
    
    -- Generate data for each day
    WHILE i < 90 DO
        -- For each product ID 34-40, create sales data with specific patterns
        
        -- Product 34 (GSM Blue 700mL) - Strong upward trend
        SET productId = 34;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Base quantity with upward trend and day-of-week seasonality
        SET quantity = 2 + FLOOR(i/15) + IF(WEEKDAY(currentDate) IN (5,6), 2, 0);
        
        -- Create order
        SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
        INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
        VALUES (orderId, userId, quantity * price, 'paid', 
               DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
               DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
               staffId, NULL);
               
        -- Add order item
        INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
        VALUES (orderId, productId, quantity, price, NULL);
        
        -- Update totals
        UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        
        -- Product 35 (GSM Blue 1L) - Stable with weekly pattern
        SET productId = 35;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Stable base with strong weekend peaks
        SET quantity = 1 + IF(WEEKDAY(currentDate) IN (5,6), 3, 0);
        
        -- Skip some days to create sparse data pattern
        IF RAND() < 0.8 THEN
            -- Create order
            SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
            INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
            VALUES (orderId, userId, quantity * price, 'paid', 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
                   staffId, NULL);
                   
            -- Add order item
            INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
            VALUES (orderId, productId, quantity, price, NULL);
            
            -- Update totals
            UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        END IF;
        
        -- Product 37 (Primera Light 1L) - Declining trend
        SET productId = 37;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Declining trend (higher at start, lower at end)
        SET quantity = 4 - FLOOR(i/30);
        IF quantity < 1 THEN SET quantity = 1; END IF;
        
        -- Skip some days to create sparse data pattern
        IF RAND() < 0.7 THEN
            -- Create order
            SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
            INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
            VALUES (orderId, userId, quantity * price, 'paid', 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
                   staffId, NULL);
                   
            -- Add order item
            INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
            VALUES (orderId, productId, quantity, price, NULL);
            
            -- Update totals
            UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        END IF;
        
        -- Product 38 (GSM Blue Flavors 700mL) - Cyclical pattern (14-day cycle)
        SET productId = 38;
        SELECT price INTO price FROM products WHERE products_id = productId;
        -- Cyclical pattern with 14-day period
        SET quantity = 1 + FLOOR(2 * SIN(i * 0.448)); -- 0.448 gives ~14 day cycle
        IF quantity < 1 THEN SET quantity = 1; END IF;
        
        -- Skip some days to create sparse data pattern
        IF RAND() < 0.75 THEN
            -- Create order
            SET orderId = LPAD(FLOOR(RAND() * 9999999), 7, '0');
            INSERT INTO orders (order_id, user_id, total_amount, status, created_at, updated_at, accepted_by, customer_name)
            VALUES (orderId, userId, quantity * price, 'paid', 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR), 
                   DATE_ADD(currentDate, INTERVAL FLOOR(RAND() * 24) HOUR),
                   staffId, NULL);
                   
            -- Add order item
            INSERT INTO order_items (order_id, product_id, quantity, price, choice_id)
            VALUES (orderId, productId, quantity, price, NULL);
            
            -- Update totals
            UPDATE orders SET total_amount = quantity * price WHERE order_id = orderId;
        END IF;
        
        -- Move to next day
        SET currentDate = DATE_ADD(currentDate, INTERVAL 1 DAY);
        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `available_discounts`
--

CREATE TABLE `available_discounts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT ((now() + interval 30 day)),
  `used` tinyint(1) DEFAULT '0',
  `order_id` char(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `available_discounts`
--

INSERT INTO `available_discounts` (`id`, `user_id`, `amount`, `created_at`, `expires_at`, `used`, `order_id`) VALUES
(50, 58, 50.00, '2025-05-09 13:35:21', '2025-06-08 13:35:21', 1, '5229682'),
(51, 58, 50.00, '2025-05-19 06:25:15', '2025-06-18 06:25:15', 1, '7576385'),
(52, 58, 100.00, '2025-06-11 12:44:07', '2025-07-11 12:44:07', 1, '4970734'),
(53, 58, 50.00, '2025-06-11 12:49:02', '2025-07-11 12:49:02', 1, '8634793'),
(54, 58, 250.00, '2025-06-11 12:49:16', '2025-07-11 12:49:16', 1, '0479798'),
(55, 58, 50.00, '2025-06-14 00:18:08', '2025-07-14 00:18:08', 0, NULL),
(56, 58, 100.00, '2025-06-14 00:18:10', '2025-07-14 00:18:10', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `choice_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` char(7) NOT NULL,
  `user_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','preparing','ready for pickup','paid','paid using gcash','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `accepted_by` int DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `shared_by` int DEFAULT NULL,
  `shared_with` int DEFAULT NULL,
  `shared_cart_id` varchar(255) DEFAULT NULL,
  `shared_with_id` int DEFAULT NULL,
  `is_shared_cart_owner` tinyint(1) DEFAULT '0',
  `is_physical_order` tinyint(1) DEFAULT '0',
  `customer_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `total_amount`, `status`, `created_at`, `updated_at`, `cancel_reason`, `accepted_by`, `accepted_at`, `shared_by`, `shared_with`, `shared_cart_id`, `shared_with_id`, `is_shared_cart_owner`, `is_physical_order`, `customer_name`) VALUES
('0049544', 56, 378.00, 'paid', '2025-06-07 13:39:44', '2025-06-14 01:20:39', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0062958', 56, 320.50, 'paid', '2025-06-10 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0078361', 56, 60.00, 'paid', '2025-05-19 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0166286', 56, 141.00, 'paid', '2025-06-06 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0181757', 56, 378.00, 'paid', '2025-05-24 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0270665', 58, 189.00, 'cancelled', '2025-06-10 22:06:06', '2025-06-11 12:17:46', 'Changed my mind', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0318801', 56, 209.00, 'paid', '2025-05-21 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0320939', 56, 51.00, 'paid', '2025-05-15 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0355902', 56, 567.00, 'paid', '2025-05-13 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0370997', 56, 1223.00, 'paid', '2025-05-20 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0479798', 58, 0.00, 'preparing', '2025-06-11 12:49:43', '2025-06-11 17:09:58', NULL, 23, '2025-06-12 01:09:58', NULL, NULL, NULL, NULL, 0, 0, NULL),
('0748472', 56, 378.00, 'paid', '2025-05-18 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0881007', 56, 370.00, 'paid', '2025-05-27 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('0907455', 58, 1170.00, 'cancelled', '2025-06-11 21:49:58', '2025-06-11 21:50:03', 'Changed my mind', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1042234', 56, 2554.00, 'paid', '2025-06-01 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1094201', 56, 165.00, 'paid', '2025-05-27 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1251674', 56, 270.00, 'paid', '2025-05-19 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1288891', 58, 3019.00, 'paid', '2025-06-12 10:37:08', '2025-06-12 10:37:36', NULL, 23, '2025-06-12 18:37:19', NULL, NULL, NULL, NULL, 0, 0, NULL),
('1310914', 56, 27.00, 'paid', '2025-05-26 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1419916', 56, 911.00, 'paid', '2025-06-07 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1625405', 56, 477.00, 'paid', '2025-05-17 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1628722', 56, 2528.00, 'paid', '2025-05-18 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1679133', 56, 282.00, 'paid', '2025-06-03 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1749430', 56, 298.50, 'paid', '2025-06-02 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1782065', 56, 611.00, 'paid', '2025-05-24 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('1917367', 56, 55.00, 'paid', '2025-05-13 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2132346', 56, 423.00, 'paid', '2025-06-07 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2165407', 56, 189.00, 'paid', '2025-05-16 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2173189', 58, 617.00, 'paid', '2025-06-12 09:26:02', '2025-06-12 09:31:39', NULL, 23, '2025-06-12 17:26:17', NULL, NULL, NULL, NULL, 0, 0, NULL),
('2225484', 56, 91.00, 'paid', '2025-05-15 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2388558', 56, 378.00, 'paid', '2025-05-21 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2474222', 56, 38.00, 'paid', '2025-06-04 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2477674', 56, 562.00, 'paid', '2025-05-17 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2486554', 56, 423.00, 'paid', '2025-06-03 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2657847', 56, 49.00, 'paid', '2025-06-10 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('2734169', 56, 94.00, 'paid', '2025-05-19 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3049944', 56, 171.00, 'paid', '2025-06-02 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3152531', 56, 189.00, 'paid', '2025-05-24 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3226219', 56, 468.00, 'paid', '2025-05-26 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3464693', 56, 301.00, 'paid', '2025-05-24 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3505083', 56, 586.00, 'paid', '2025-05-23 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3661468', 58, 25.50, 'paid', '2025-06-13 18:46:19', '2025-06-13 22:06:20', NULL, 23, '2025-06-14 02:46:37', NULL, NULL, NULL, NULL, 0, 0, NULL),
('3752935', 56, 378.00, 'paid', '2025-05-15 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3851076', 56, 111.00, 'paid', '2025-05-28 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('3871827', 56, 216.00, 'paid', '2025-06-07 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4023658', 56, 19.00, 'paid', '2025-06-09 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4151897', 58, 140.00, 'preparing', '2025-06-12 08:17:29', '2025-06-13 19:16:18', NULL, 23, '2025-06-12 16:17:41', NULL, NULL, NULL, NULL, 0, 0, NULL),
('4217171', 56, 1291.00, 'paid', '2025-06-03 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4226170', 56, 378.00, 'paid', '2025-05-19 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4234665', 56, 189.00, 'paid', '2025-05-22 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4379664', 56, 282.00, 'paid', '2025-06-10 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4406490', 56, 189.00, 'paid', '2025-05-19 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4429183', 56, 189.00, 'paid', '2025-05-27 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4527232', 58, 1359.00, 'paid', '2025-06-12 08:11:45', '2025-06-13 18:27:17', NULL, 23, '2025-06-12 16:11:56', NULL, NULL, NULL, NULL, 0, 0, NULL),
('4547246', 56, 74.00, 'paid', '2025-06-04 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4562216', 58, 140.00, 'paid', '2025-06-13 18:26:04', '2025-06-13 18:26:35', NULL, 23, '2025-06-14 02:26:14', NULL, NULL, NULL, NULL, 0, 0, NULL),
('4564808', 56, 378.00, 'paid', '2025-06-04 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('4672841', 56, 378.00, 'paid', '2025-05-20 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('5041695', 58, 189.00, 'cancelled', '2025-06-11 12:39:58', '2025-06-11 12:40:02', 'Changed my mind', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('5109806', 56, 1198.00, 'paid', '2025-06-06 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('5120226', 56, 140.00, 'paid', '2025-05-28 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('5219639', 56, 29.50, 'paid', '2025-06-01 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('5385274', 56, 564.00, 'paid', '2025-06-10 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('5682030', 58, 3305.00, 'paid', '2025-06-11 15:29:15', '2025-06-11 15:29:41', NULL, 23, '2025-06-11 23:29:22', NULL, NULL, NULL, NULL, 0, 0, NULL),
('5954237', 56, 378.00, 'paid', '2025-06-02 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6031901', 56, 937.00, 'paid', '2025-05-20 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6069629', 56, 78.50, 'paid', '2025-06-07 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6180488', 56, 567.00, 'paid', '2025-05-20 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6304317', 56, 378.00, 'paid', '2025-06-09 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6464763', 58, 330.00, 'cancelled', '2025-06-10 21:58:25', '2025-06-11 12:17:48', 'Ordered by mistake', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6628013', 56, 59.50, 'paid', '2025-05-17 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6751122', 56, 189.00, 'paid', '2025-06-05 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6780150', 56, 151.75, 'paid', '2025-05-13 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('6837166', 56, 282.00, 'paid', '2025-06-01 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7070479', 56, 189.00, 'paid', '2025-05-17 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7194326', 58, 141.00, 'cancelled', '2025-06-12 08:27:16', '2025-06-12 08:27:29', 'Customer cancelled', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7280722', 56, 141.00, 'paid', '2025-06-03 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7339968', 56, 106.00, 'paid', '2025-05-21 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7687088', 56, 189.00, 'paid', '2025-05-28 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7789578', 56, 542.50, 'paid', '2025-06-08 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7826305', 58, 20.50, 'paid', '2025-06-13 18:36:15', '2025-06-13 18:36:51', NULL, 23, '2025-06-14 02:36:20', NULL, NULL, NULL, NULL, 0, 0, NULL),
('7826652', 56, 72.00, 'paid', '2025-05-21 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7853322', 56, 23.00, 'paid', '2025-05-21 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7872481', 56, 189.00, 'paid', '2025-06-07 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('7966136', 56, 297.00, 'paid', '2025-06-05 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('8135598', 56, 423.00, 'paid', '2025-06-09 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('8176548', 56, 1266.00, 'paid', '2025-06-06 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('8298188', 56, 605.00, 'paid', '2025-05-19 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('8436968', 58, 23.00, 'preparing', '2025-06-11 17:20:10', '2025-06-11 17:20:28', NULL, 23, '2025-06-12 01:20:28', NULL, NULL, NULL, NULL, 0, 0, NULL),
('8448674', 56, 378.00, 'paid', '2025-05-23 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('8510875', 58, 49.00, 'paid', '2025-06-14 01:16:24', '2025-06-14 01:16:53', NULL, 23, '2025-06-14 09:16:36', NULL, NULL, NULL, NULL, 0, 0, NULL),
('8540515', 56, 72.00, 'paid', '2025-05-13 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('8634793', 58, 510.00, 'preparing', '2025-06-11 15:32:15', '2025-06-11 19:32:17', NULL, 23, '2025-06-11 23:32:36', NULL, NULL, NULL, NULL, 0, 0, NULL),
('8653905', 58, 2897.00, 'paid', '2025-06-12 10:36:15', '2025-06-12 10:36:38', NULL, 23, '2025-06-12 18:36:22', NULL, NULL, NULL, NULL, 0, 0, NULL),
('8843835', 58, 189.00, 'cancelled', '2025-06-10 22:27:22', '2025-06-11 12:17:44', 'Ordered by mistake', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9056126', 56, 378.00, 'paid', '2025-05-26 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9099822', 56, 564.00, 'paid', '2025-06-08 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9325414', 56, 378.00, 'paid', '2025-06-03 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9344479', 58, 185.00, 'cancelled', '2025-06-12 08:45:37', '2025-06-12 08:45:48', 'Customer cancelled', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9360203', 58, 17.50, 'paid', '2025-06-10 21:46:41', '2025-06-11 12:41:28', NULL, 23, '2025-06-11 05:47:05', NULL, NULL, NULL, NULL, 0, 0, NULL),
('9396606', 58, 141.00, 'paid', '2025-06-10 21:47:26', '2025-06-10 21:48:11', NULL, 23, '2025-06-11 05:47:36', NULL, NULL, NULL, NULL, 0, 0, NULL),
('9525472', 56, 1252.00, 'paid', '2025-05-22 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9811008', 56, 1218.00, 'paid', '2025-05-25 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9848840', 56, 189.00, 'paid', '2025-05-22 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL),
('9868934', 56, 513.00, 'paid', '2025-06-03 13:39:44', '2025-06-11 13:39:44', NULL, 23, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int NOT NULL,
  `order_id` char(7) DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `choice_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `choice_id`) VALUES
(1576, '9360203', 38, 1, 17.50, NULL),
(1577, '9396606', 34, 1, 141.00, NULL),
(1578, '6464763', 35, 1, 189.00, NULL),
(1579, '6464763', 34, 1, 141.00, NULL),
(1580, '0270665', 35, 1, 189.00, NULL),
(1581, '8843835', 35, 1, 189.00, NULL),
(1582, '5041695', 35, 1, 189.00, NULL),
(1583, '2761636', 35, 2, 189.00, NULL),
(1584, '0479798', 36, 1, 140.00, NULL),
(1585, '3226219', 57, 2, 185.00, NULL),
(1586, '3226219', 73, 1, 98.00, NULL),
(1587, '3049944', 90, 3, 23.00, NULL),
(1588, '3049944', 76, 2, 51.00, NULL),
(1589, '9868934', 56, 3, 142.00, NULL),
(1590, '9868934', 65, 2, 29.75, NULL),
(1591, '9868934', 48, 1, 27.50, NULL),
(1592, '7853322', 63, 1, 23.00, NULL),
(1593, '1625405', 86, 3, 33.00, NULL),
(1594, '1625405', 37, 2, 189.00, NULL),
(1595, '1419916', 73, 3, 98.00, NULL),
(1596, '1419916', 58, 1, 617.00, NULL),
(1597, '5219639', 38, 1, 17.50, NULL),
(1598, '5219639', 80, 1, 12.00, NULL),
(1599, '1042234', 59, 3, 835.00, NULL),
(1600, '1042234', 77, 1, 49.00, NULL),
(1601, '9811008', 86, 3, 33.00, NULL),
(1602, '9811008', 56, 2, 142.00, NULL),
(1603, '9811008', 59, 1, 835.00, NULL),
(1604, '1094201', 54, 3, 55.00, NULL),
(1605, '3851076', 72, 3, 37.00, NULL),
(1606, '2474222', 68, 2, 19.00, NULL),
(1607, '2474222', 51, 2, 0.00, NULL),
(1608, '2225484', 72, 1, 37.00, NULL),
(1609, '2225484', 78, 2, 27.00, NULL),
(1610, '4217171', 74, 1, 93.00, NULL),
(1611, '4217171', 61, 2, 599.00, NULL),
(1612, '4547246', 72, 2, 37.00, NULL),
(1613, '0062958', 73, 3, 98.00, NULL),
(1614, '0062958', 70, 1, 26.50, NULL),
(1615, '1310914', 78, 1, 27.00, NULL),
(1616, '1749430', 65, 2, 29.75, NULL),
(1617, '1749430', 50, 1, 185.00, NULL),
(1618, '1749430', 75, 1, 54.00, NULL),
(1619, '8298188', 36, 3, 140.00, NULL),
(1620, '8298188', 50, 1, 185.00, NULL),
(1621, '5120226', 51, 1, 0.00, NULL),
(1622, '5120226', 36, 1, 140.00, NULL),
(1623, '7789578', 47, 2, 11.75, NULL),
(1624, '7789578', 35, 2, 189.00, NULL),
(1625, '7789578', 34, 1, 141.00, NULL),
(1626, '1251674', 52, 1, 270.00, NULL),
(1627, '1251674', 51, 2, 0.00, NULL),
(1628, '6031901', 57, 2, 185.00, NULL),
(1629, '6031901', 37, 2, 189.00, NULL),
(1630, '6031901', 35, 1, 189.00, NULL),
(1631, '3464693', 31, 1, 301.00, NULL),
(1632, '3464693', 32, 1, 0.00, NULL),
(1633, '2734169', 90, 3, 23.00, NULL),
(1634, '2734169', 87, 1, 25.00, NULL),
(1635, '0318801', 85, 1, 20.00, NULL),
(1636, '0318801', 51, 1, 0.00, NULL),
(1637, '0318801', 37, 1, 189.00, NULL),
(1638, '1782065', 61, 1, 599.00, NULL),
(1639, '1782065', 80, 1, 12.00, NULL),
(1640, '5109806', 61, 2, 599.00, NULL),
(1641, '7966136', 84, 3, 99.00, NULL),
(1642, '2657847', 89, 1, 21.50, NULL),
(1643, '2657847', 64, 1, 27.50, NULL),
(1644, '0320939', 82, 2, 8.00, NULL),
(1645, '0320939', 81, 1, 8.00, NULL),
(1646, '0320939', 78, 1, 27.00, NULL),
(1647, '1628722', 59, 3, 835.00, NULL),
(1648, '1628722', 41, 1, 23.00, NULL),
(1649, '6780150', 36, 1, 140.00, NULL),
(1650, '6780150', 47, 1, 11.75, NULL),
(1651, '0881007', 57, 2, 185.00, NULL),
(1652, '8540515', 62, 3, 16.00, NULL),
(1653, '8540515', 80, 2, 12.00, NULL),
(1654, '4023658', 68, 1, 19.00, NULL),
(1655, '7339968', 70, 3, 26.50, NULL),
(1656, '7339968', 70, 1, 26.50, NULL),
(1657, '7872481', 35, 1, 189.00, NULL),
(1658, '6069629', 47, 2, 11.75, NULL),
(1659, '6069629', 55, 1, 55.00, NULL),
(1660, '7826652', 79, 1, 72.00, NULL),
(1661, '9525472', 75, 1, 54.00, NULL),
(1662, '9525472', 61, 2, 599.00, NULL),
(1663, '3871827', 45, 2, 15.00, NULL),
(1664, '3871827', 74, 1, 93.00, NULL),
(1665, '3871827', 74, 1, 93.00, NULL),
(1666, '2477674', 36, 3, 140.00, NULL),
(1667, '2477674', 56, 1, 142.00, NULL),
(1668, '6628013', 65, 2, 29.75, NULL),
(1669, '6628013', 51, 1, 0.00, NULL),
(1670, '8176548', 33, 1, 649.00, NULL),
(1671, '8176548', 32, 2, 0.00, NULL),
(1672, '8176548', 58, 1, 617.00, NULL),
(1673, '0370997', 61, 2, 599.00, NULL),
(1674, '0370997', 87, 1, 25.00, NULL),
(1675, '6304317', 83, 3, 95.00, NULL),
(1676, '6304317', 74, 1, 93.00, NULL),
(1677, '1917367', 51, 2, 0.00, NULL),
(1678, '1917367', 53, 1, 55.00, NULL),
(1679, '0078361', 85, 3, 20.00, NULL),
(1680, '3505083', 41, 2, 23.00, NULL),
(1681, '3505083', 52, 2, 270.00, NULL),
(1682, '0166286', 34, 1, 141.00, NULL),
(1683, '7280722', 34, 1, 141.00, NULL),
(1684, '6837166', 34, 2, 141.00, NULL),
(1685, '4379664', 34, 2, 141.00, NULL),
(1686, '1679133', 34, 2, 141.00, NULL),
(1687, '2486554', 34, 3, 141.00, NULL),
(1688, '2132346', 34, 3, 141.00, NULL),
(1689, '8135598', 34, 3, 141.00, NULL),
(1690, '5385274', 34, 4, 141.00, NULL),
(1691, '9099822', 34, 4, 141.00, NULL),
(1692, '4429183', 35, 1, 189.00, NULL),
(1693, '5954237', 35, 2, 189.00, NULL),
(1694, '6751122', 35, 1, 189.00, NULL),
(1695, '9325414', 35, 2, 189.00, NULL),
(1696, '3752935', 35, 2, 189.00, NULL),
(1697, '8448674', 35, 2, 189.00, NULL),
(1698, '4564808', 35, 2, 189.00, NULL),
(1699, '7070479', 35, 1, 189.00, NULL),
(1700, '2388558', 35, 2, 189.00, NULL),
(1701, '0181757', 35, 2, 189.00, NULL),
(1702, '0049544', 35, 2, 189.00, NULL),
(1703, '9056126', 35, 2, 189.00, NULL),
(1704, '3152531', 35, 1, 189.00, NULL),
(1705, '7687088', 35, 1, 189.00, NULL),
(1706, '9848840', 35, 1, 189.00, NULL),
(1707, '0355902', 37, 3, 189.00, NULL),
(1708, '6180488', 37, 3, 189.00, NULL),
(1709, '4226170', 37, 2, 189.00, NULL),
(1710, '4672841', 37, 2, 189.00, NULL),
(1711, '0748472', 37, 2, 189.00, NULL),
(1712, '2165407', 37, 1, 189.00, NULL),
(1713, '4406490', 37, 1, 189.00, NULL),
(1714, '4234665', 37, 1, 189.00, NULL),
(1715, '5682030', 75, 10, 54.00, NULL),
(1716, '5682030', 74, 5, 93.00, NULL),
(1717, '5682030', 63, 100, 23.00, NULL),
(1718, '8634793', 85, 20, 20.00, NULL),
(1719, '8634793', 82, 20, 8.00, NULL),
(1720, '8436968', 63, 1, 23.00, NULL),
(1721, '4970734', 50, 3, 185.00, NULL),
(1722, '0907455', 32, 5, 234.00, NULL),
(1723, '4527232', 35, 1, 189.00, NULL),
(1724, '4527232', 32, 5, 234.00, NULL),
(1725, '4151897', 36, 1, 140.00, NULL),
(1726, '7194326', 34, 1, 141.00, NULL),
(1727, '6668658', 45, 1, 15.00, NULL),
(1728, '8148803', 45, 1, 15.00, NULL),
(1729, '9245709', 45, 1, 15.00, NULL),
(1730, '4326455', 45, 1, 15.00, NULL),
(1731, '7853300', 52, 1, 270.00, NULL),
(1732, '5695988', 35, 1, 189.00, NULL),
(1733, '0491522', 35, 1, 189.00, NULL),
(1734, '2252374', 35, 1, 189.00, NULL),
(1735, '6545693', 35, 1, 189.00, NULL),
(1736, '1075232', 45, 1, 15.00, NULL),
(1737, '5813781', 52, 1, 270.00, NULL),
(1738, '0848012', 52, 1, 270.00, NULL),
(1739, '0978768', 52, 1, 270.00, NULL),
(1740, '1414253', 52, 1, 270.00, NULL),
(1741, '3039234', 38, 1, 17.50, NULL),
(1742, '9344479', 57, 1, 185.00, NULL),
(1743, '2173189', 58, 1, 617.00, NULL),
(1744, '8653905', 31, 1, 301.00, NULL),
(1745, '8653905', 33, 4, 649.00, NULL),
(1746, '1288891', 34, 3, 141.00, NULL),
(1747, '1288891', 33, 4, 649.00, NULL),
(1748, '4562216', 36, 1, 140.00, NULL),
(1749, '7826305', 67, 1, 20.50, NULL),
(1750, '3661468', 91, 1, 25.50, NULL),
(1751, '8510875', 77, 1, 49.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_reports`
--

CREATE TABLE `order_reports` (
  `id` int NOT NULL,
  `order_id` char(7) NOT NULL,
  `user_id` int NOT NULL,
  `issue_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','in_progress','resolved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_response` text,
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_reports`
--

INSERT INTO `order_reports` (`id`, `order_id`, `user_id`, `issue_type`, `description`, `status`, `created_at`, `updated_at`, `admin_response`, `resolved_at`) VALUES
(1, '2173189', 58, 'wrong-order', 'zxc', 'pending', '2025-06-12 09:48:07', '2025-06-12 09:48:07', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_reviews`
--

CREATE TABLE `order_reviews` (
  `id` int NOT NULL,
  `order_id` char(7) NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_reviews`
--

INSERT INTO `order_reviews` (`id`, `order_id`, `user_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(1, '2173189', 58, 5, NULL, '2025-06-12 09:48:35', '2025-06-12 09:48:35'),
(2, '8653905', 58, 5, NULL, '2025-06-12 10:36:50', '2025-06-12 10:36:50'),
(3, '1288891', 58, 3, NULL, '2025-06-12 10:37:47', '2025-06-12 10:37:47'),
(4, '4527232', 58, 5, NULL, '2025-06-13 18:36:01', '2025-06-13 18:36:01'),
(5, '4562216', 58, 4, NULL, '2025-06-13 18:36:09', '2025-06-13 18:36:09'),
(6, '3661468', 58, 5, NULL, '2025-06-13 22:14:04', '2025-06-13 22:14:04'),
(7, '7826305', 58, 5, NULL, '2025-06-14 00:17:58', '2025-06-14 00:17:58'),
(8, '8510875', 58, 5, NULL, '2025-06-14 02:09:08', '2025-06-14 02:09:08');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `products_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL,
  `category` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`products_id`, `name`, `description`, `price`, `stock_quantity`, `category`, `image`, `created_at`, `updated_at`) VALUES
(31, 'Alfonso 1 1Liter', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 301.00, 998, 'Beverages', 'https://i.ibb.co/jPyMQ6tH/2bf48b084634.png', '2025-04-01 07:21:29', '2025-06-12 10:36:15'),
(32, 'Alfonso 1 700mL', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 234.00, 994, 'Beverages', 'https://i.ibb.co/wjnnCRK/7928f679733c.png', '2025-04-01 07:22:15', '2025-06-12 08:11:45'),
(33, 'Alfonso 1 1.75Liter', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 649.00, 980, 'Beverages', 'https://i.ibb.co/N2t2GD8s/5da50a598cd4.png', '2025-04-01 07:22:59', '2025-06-12 10:37:08'),
(34, 'GSM Mojito 700mL', 'offers a refreshing blend of gin infused with mint and lime flavors, reminiscent of a traditional Mojito cocktail. It tends to have a crisp and citrusy profile with a hint of herbal notes from the mint.', 141.00, 76, 'Beverages', 'https://i.ibb.co/60Bw2QX7/6a76cc18e196.png', '2025-04-01 07:28:23', '2025-06-12 10:37:08'),
(35, 'GSM Mojito 1L', 'offers a refreshing blend of gin infused with mint and lime flavors, reminiscent of a traditional Mojito cocktail. It tends to have a crisp and citrusy profile with a hint of herbal notes from the mint.', 189.00, 977, 'Beverages', 'https://i.ibb.co/vvP01sRS/00058af3eb33.png', '2025-04-01 07:28:48', '2025-06-12 08:35:52'),
(36, 'Primera Light 750mL', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 140.00, 79, 'Beverages', 'https://i.ibb.co/0pCHgRnP/6b834d85cc3b.png', '2025-04-01 07:34:49', '2025-06-13 18:26:04'),
(37, 'Primera Light 1Liter', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 189.00, 95, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-04-01 07:35:27', '2025-05-09 13:17:45'),
(38, 'Lucky 7 Corned Beef ', 'organic-free corned beef multipack', 17.50, 196, 'Canned Goods', 'https://i.ibb.co/MD9MDJ5q/d66d18901a73.png', '2025-04-01 07:37:33', '2025-06-12 08:43:21'),
(41, 'Lucky 7 Meat Loaf 100g', 'organic-free corned beef multipack', 23.00, 48, 'Canned Goods', 'https://i.ibb.co/tTMm9hg9/bf73f6e95a5d.png', '2025-04-01 07:42:51', '2025-04-24 16:44:33'),
(45, 'Datu Patis ', '#1 fish sauce in the Philippines.', 15.00, 95, 'Condiments', 'https://i.ibb.co/0Ry6CFm6/51d8ce58dd9f.png', '2025-04-01 09:25:10', '2025-06-12 08:36:27'),
(47, 'UFC Ketchup', 'unique blend of fresh spices and select bananas that provide the tamis anghang (sweet and spicy) flavor. ', 11.75, 100, 'Condiments', 'https://i.ibb.co/j9gnXrxH/cecb6672ce73.png', '2025-04-01 09:27:23', '2025-04-09 06:24:47'),
(48, 'Argentina Corned Beef', 'No. 1 corned beef brand that has the food qualities consumer most value', 27.50, 100, 'Canned Goods', 'https://i.ibb.co/W46GfnGB/d19d7b986670.png', '2025-04-01 09:32:37', '2025-04-08 21:09:32'),
(50, 'Primera Light 1Liter', 'a unique 55-proof brandy liqueur masterpiece', 185.00, 17, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-04-01 09:41:56', '2025-06-11 19:20:28'),
(51, 'May Sparkle Red', 'A non-alcoholic beverage from freshly-pressed and carefully-selected Belgium Grapes.', 0.00, 6, 'Beverages', 'https://i.ibb.co/Wv5gFDjr/d75fc84e5138.png', '2025-04-01 09:43:28', '2025-04-01 17:04:28'),
(52, 'Novellino 750mL', 'Novellino Wild Blackberry is a casual wine vinified from choice vitis vinifera grapes in the tradition of fine Italian winemaking', 270.00, 5, 'Beverages', 'https://i.ibb.co/278v021y/05b8707b2772.png', '2025-04-01 09:45:11', '2025-06-12 08:43:06'),
(53, 'The Bar Dry Gin 335mL ', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 6, 'Beverages', 'https://i.ibb.co/jkNpPRn2/4cd7e58417a4.png', '2025-04-01 09:46:37', '2025-04-17 07:31:00'),
(54, 'The Bar Pink 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 58, 'Beverages', 'https://i.ibb.co/hxGrvfmq/a6f137b5983c.png', '2025-04-01 09:47:16', '2025-05-19 06:14:33'),
(55, 'The Bar Lime 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 6, 'Beverages', 'https://i.ibb.co/8gggkGVx/49ad7f791839.png', '2025-04-01 09:47:46', '2025-04-01 17:18:04'),
(56, 'Emperador 750mL', ' brand of cut brandy and brandy produced by Emperador Inc.', 142.00, 50, 'Beverages', 'https://i.ibb.co/mrbVVg4L/daf1bf6947ad.png', '2025-04-01 09:51:17', '2025-04-01 17:18:46'),
(57, 'Emperador 1Liter', ' brand of cut brandy and brandy produced by Emperador Inc.', 185.00, 49, 'Beverages', 'https://i.ibb.co/VckXJTFG/ecd6f3d61a21.png', '2025-04-01 09:52:01', '2025-06-12 08:45:48'),
(58, 'Red Horse Beer per Case', 'beer', 617.00, 79, 'Beverages', 'https://i.ibb.co/F4fd74z2/2843dba65b63.png', '2025-04-01 17:27:22', '2025-06-12 09:26:02'),
(59, 'San Mig Light || Apple per Case', 'flavored beer', 835.00, 52, 'Beverages', 'https://i.ibb.co/dwTNCfJV/b0926c017020.png', '2025-04-08 20:30:05', '2025-04-08 21:03:32'),
(60, 'Ginebra per Case', 'delivers a clean, juniper-forward taste, complemented by subtle hints of citrus and spice', 1554.00, 200, 'Beverages', 'https://i.ibb.co/C3MZ5YvK/0b2cffba62af.png', '2025-04-08 20:59:46', '2025-04-08 20:59:46'),
(61, 'San Miguel Beer per case', 'full-flavored taste complements its pleasant aroma, making it a perfectly balanced beer', 599.00, 29, 'Beverages', 'https://i.ibb.co/FqyQ2D5Z/2b8cb868bbda.png', '2025-04-08 21:03:06', '2025-04-20 17:00:51'),
(62, 'Argentina Meat Loaf', 'made from quality meat that\'s seasoned with the most flavorful yet kid-friendly spices', 16.00, 99, 'Canned Goods', 'https://i.ibb.co/zTRL3z2K/67acda401865.png', '2025-04-08 21:13:02', '2025-04-20 17:03:04'),
(63, 'Wow Ulam', 'brand of canned and fresh processed meat products from Century Pacific Food Inc.', 23.00, 99, 'Canned Goods', 'https://i.ibb.co/nNMdv4zm/8eaa96b1b065.png', '2025-04-08 22:09:14', '2025-06-11 17:20:10'),
(64, 'Century Tuna', 'a leading canned tuna brand in the Philippines, known for its healthy, delicious, and convenient options,', 27.50, 100, 'Canned Goods', 'https://i.ibb.co/FbXNJm1m/c00050cbdeba.png', '2025-04-08 22:14:26', '2025-04-08 22:14:26'),
(65, 'Blue Bay', 'Manamis-namis. Deliciously irresistible. Unmistakably fresh. The sea`s bounty and farm`s harvest make one delightful feast.', 29.75, 200, 'Canned Goods', 'https://i.ibb.co/vxtvqDpM/cc9c981cfeb3.png', '2025-04-08 22:18:53', '2025-04-08 22:18:53'),
(66, '555 Tuna', 'the “Super Ulam Pinoy” because it is rich in calcium for stronger bones, protein for muscle building, lycopene for cancer prevention', 26.00, 49, 'Canned Goods', 'https://i.ibb.co/Y7jbJpZ9/0f06ee53e48d.png', '2025-04-08 22:21:01', '2025-04-20 17:03:16'),
(67, 'CDO Karne Norte', 'a Filipino-style corned beef that has a delicious guisado taste', 20.50, 99, 'Canned Goods', 'https://i.ibb.co/KjNHwTmS/6ef04ff0da58.png', '2025-04-08 22:23:53', '2025-06-13 18:36:15'),
(68, 'Bingo Corned Beef', 'a canned, ready-to-eat corned beef product, specially prepared with beef and savory seasonings, and fortified with zinc and iron', 19.00, 50, 'Canned Goods', 'https://i.ibb.co/BH4TXJBC/d226081191f0.png', '2025-04-08 22:26:27', '2025-04-08 22:26:27'),
(69, 'San Marino', 'has the delicious taste and health benefits of tuna', 32.00, 100, 'Canned Goods', 'https://i.ibb.co/ns3PXZPS/e9feba69ac43.png', '2025-04-08 22:34:10', '2025-04-08 22:34:10'),
(70, 'Fresca Tuna', 'It\'s a great alternative to the usual sardines, giving you more value for your money while staying within your budget.', 26.50, 100, 'Canned Goods', 'https://i.ibb.co/j9QJQfM7/2e963da1932c.png', '2025-04-08 22:37:38', '2025-04-08 22:37:38'),
(71, 'Hunts Pork and Beans', '#1 brand of Pork & Beans in the Philippines. It is made from high quality Great Northern Beans and real pork bits covered in rich, thick, sweet tomato sauce.', 25.00, 50, 'Canned Goods', 'https://i.ibb.co/rGVdMcgd/716c7cd11ed1.png', '2025-04-08 22:39:42', '2025-04-08 22:40:04'),
(72, 'Bear Brand', ' a Nestlé-owned milk brand, particularly popular in the Philippines, offering both sterilized milk and fortified powdered milk drinks, known for providing essential nutrients and supporting overall health and well-being. ', 37.00, 50, 'Milk and Chocolate Drink', 'https://i.ibb.co/1fKNBZTT/b2969e594b9d.png', '2025-04-08 22:52:24', '2025-04-08 22:52:24'),
(73, 'Bear Brand Adult', 'a powdered milk drink specially formulated for adults aged 19-29, designed to provide essential nutrients, including calcium, vitamin D, and B-vitamins, to support energy and immunity, and help close daily nutrition gaps. ', 98.00, 14, 'Milk and Chocolate Drink', 'https://i.ibb.co/3mr1fM35/60153400556e.png', '2025-04-08 22:58:08', '2025-04-20 17:00:51'),
(74, 'Bear Brand Choco', ' a chocolate-flavored powdered milk drink fortified with essential nutrients like iron, zinc, and vitamin C, designed for individuals aged 3 and up to support strong immunity and overall well-being', 93.00, 20, 'Milk and Chocolate Drink', 'https://i.ibb.co/nMPC557v/b9527d3d54b3.png', '2025-04-08 23:00:50', '2025-06-11 16:38:11'),
(75, 'Milo', 'a chocolate-flavored malted beverage powder created by Nestlé, known for its unique choco-malty flavor and often mixed with milk or water to create a nutritious and delicious drink, especially popular among children and those seeking an energy boost. ', 54.00, 5, 'Milk and Chocolate Drink', 'https://i.ibb.co/7NrmLyxz/6d157cac0a1f.png', '2025-04-08 23:05:20', '2025-06-11 15:29:15'),
(76, 'Birch Tree', ' known for its affordable price and high-quality nutrition, with a focus on fortified milk for children and adults. ', 51.00, 22, 'Milk and Chocolate Drink', 'https://i.ibb.co/xK9CjyBV/e407420a9dcb.png', '2025-04-08 23:10:11', '2025-04-20 17:03:16'),
(77, 'Del Monte Ketchup', 'made from real, high-quality tomatoes, naturally contains lycopene, and is guaranteed to have no preservatives, offering a rich tomato flavor and a sweet-sour taste for delicious dips and meals', 49.00, 18, 'Condiments', 'https://i.ibb.co/jmzv3ZM/728ac9940fe7.png', '2025-04-09 06:48:17', '2025-06-14 01:16:24'),
(78, 'Lorins Patis', 'a popular, tangy Filipino fish sauce, ideal as a dipping sauce or cooking ingredient for a wide variety of dishes, including seafood, meat, poultry, vegetables, and Filipino favorites like sinigang and nilaga. ', 27.00, 20, 'Condiments', 'https://i.ibb.co/3yZ5qszC/df3e929a28ec.png', '2025-04-09 07:02:19', '2025-04-09 07:03:39'),
(79, 'Sugar per kg', 'brown and white refined', 72.00, 300, 'Condiments', 'https://i.ibb.co/xK5TGqzf/2eb5e49aefb7.png', '2025-04-09 07:06:43', '2025-04-09 07:12:13'),
(80, 'Salt per kg', 'sea salt', 12.00, 200, 'Condiments', 'https://i.ibb.co/j9LdB8xH/50a57d229f22.png', '2025-04-09 07:08:19', '2025-04-09 07:08:19'),
(81, 'Paminta per Tie', 'whole and ground black pepper', 8.00, 100, 'Condiments', 'https://i.ibb.co/N6RqFRg8/3912cb5cc3e9.png', '2025-04-09 07:10:07', '2025-04-09 07:10:07'),
(82, 'Laurel per Tie', 'is an evergreen plant used to add flavor to dishes. It is used in cuisines all over the world for flavoring especially stews and broths, marinades, meat and fish dishes, gravies, and game.', 8.00, 30, 'Condiments', 'https://i.ibb.co/1Gg3Rqmt/c68fa580806f.png', '2025-04-09 07:11:30', '2025-06-11 15:32:15'),
(83, 'Mafran Banana Catsup', 'formulated from choice spices, natural flavor and aroma of banana', 95.00, 12, 'Condiments', 'https://i.ibb.co/jP5X36rq/dc20ac6e0fce.png', '2025-04-09 07:13:42', '2025-04-09 07:13:42'),
(84, 'Dip Catsup Gallon', 'often used as a dip or a topping for various dishes, characterized by its sweet and tangy flavor', 99.00, 12, 'Condiments', 'https://i.ibb.co/KjDjv9WP/00bb85cf904b.png', '2025-04-09 07:15:01', '2025-04-09 07:15:01'),
(85, '555 Karne Norte', ' a locally manufactured corned beef, known for its quality and affordability, made with selected beef, hashed, and hygienically processed under international standards, ready to eat. ', 20.00, 30, 'Canned Goods', 'https://i.ibb.co/xtWHP4pc/d786693a1768.png', '2025-04-09 07:17:10', '2025-06-11 15:32:15'),
(86, '555 Tausi', 'a popular Filipino canned food featuring fried sardines in a savory-sweet sauce with the distinct flavor of fermented black beans (tausi)', 33.00, 10, 'Canned Goods', 'https://i.ibb.co/B5zmwwY5/47dcc1b0cebc.png', '2025-04-09 07:18:12', '2025-04-09 07:18:12'),
(87, 'Mega Sardines', 'the number one sardines brand in the Philippines, are known for their freshness, caught and canned within 12 hours', 25.00, 1000, 'Canned Goods', 'https://i.ibb.co/G4ZDkXmq/afdc08c9788a.png', '2025-04-09 07:22:00', '2025-04-09 07:22:00'),
(88, 'Ligo Sardines', 'well-known for its excellent taste worldwide', 26.50, 200, 'Canned Goods', 'https://i.ibb.co/hJpmZjDM/09da9c6b37b1.png', '2025-04-09 07:23:47', '2025-04-09 07:23:47'),
(89, 'Lucky 7 Sardines', ' a budget-friendly, canned sardine option in tomato sauce, known for their savory taste and affordability, making them a popular choice for daily meals. ', 21.50, 45, 'Canned Goods', 'https://i.ibb.co/JRzY9m7R/054a358ac5dc.png', '2025-04-09 07:26:01', '2025-04-22 06:34:17'),
(90, 'Atami Sardines', 'A delightful and flavorful seafood choice that combines the natural goodness of sardines', 23.00, 50, 'Canned Goods', 'https://i.ibb.co/sdNR2j4f/0f5b60542f2a.png', '2025-04-09 07:28:21', '2025-04-09 07:28:21'),
(91, 'Master Sardines', 'known for their premium quality, sourced from the depths of the ocean and expertly preserved to retain natural flavors and nutritional goodness, with a focus on a quick catch-to-can process. ', 25.50, 99, 'Canned Goods', 'https://i.ibb.co/ksGrTmWD/8c3590d7e350.png', '2025-04-09 07:31:56', '2025-06-13 18:46:19'),
(92, 'trytry test', 'jm garis', 100.00, 20, 'Beverages', 'https://i.ibb.co/pjrnNm07/59cc32c572c3.jpg', '2025-05-19 07:05:23', '2025-06-11 16:38:19'),
(95, 'trytryzxczxc', 'zxc', 0.00, 0, 'Coffee and Creamer', 'https://i.ibb.co/gbgf00bt/65560c328868.jpg', '2025-06-14 01:53:44', '2025-06-14 01:53:44'),
(96, 'trytryzxczxctry', 'zxcxzcxzczx', 0.00, 0, 'Coffee and Creamer', 'https://i.ibb.co/DH46fpwY/16f540a83f32.jpg', '2025-06-14 02:05:40', '2025-06-14 02:05:40');

-- --------------------------------------------------------

--
-- Table structure for table `product_choices`
--

CREATE TABLE `product_choices` (
  `choice_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_choices`
--

INSERT INTO `product_choices` (`choice_id`, `product_id`, `name`, `price`, `stock`, `image`) VALUES
(31, 92, 'Large (480g)zxc', 70.00, 46, 'https://i.ibb.co/pBF2F0Q5/89e84b090e37.webp'),
(32, 92, '750ml', 90.00, 39, NULL),
(33, 95, 'Large (480g)', 43.00, 40, 'https://i.ibb.co/3m4qpq3D/c34918e1868b.jpg'),
(34, 95, '750ml', 50.00, 21, 'https://i.ibb.co/prhX6DF0/1bbb34d00de0.jpg'),
(35, 96, 'Large (480g)', 43.00, 40, 'https://i.ibb.co/TxfPY88k/89af1b0efc5c.webp');

-- --------------------------------------------------------

--
-- Table structure for table `receipt_settings`
--

CREATE TABLE `receipt_settings` (
  `id` int NOT NULL,
  `storeName` varchar(255) NOT NULL DEFAULT 'JM Garis Store',
  `storeTagline` varchar(255) DEFAULT 'Official Receipt',
  `storeAddress` text,
  `contactNumber` varchar(50) DEFAULT NULL,
  `thankyouMessage` text,
  `footerText` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `receipt_settings`
--

INSERT INTO `receipt_settings` (`id`, `storeName`, `storeTagline`, `storeAddress`, `contactNumber`, `thankyouMessage`, `footerText`, `created_at`, `updated_at`) VALUES
(1, 'JM Garis Store', 'Official Receipt', 'Barcenaga, Naujan City, Oriental Mindoro', 'lanslorence@gmail.com', 'Thank you for your purchase!\nPlease come again', '', '2025-06-13 22:06:01', '2025-06-13 22:21:38');

-- --------------------------------------------------------

--
-- Table structure for table `reward_tiers`
--

CREATE TABLE `reward_tiers` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `points_required` int NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reward_tiers`
--

INSERT INTO `reward_tiers` (`id`, `name`, `points_required`, `discount_amount`, `description`) VALUES
(1, 'Bronze Rewardz', 100, 50.00, '₱50 off your next purchase'),
(2, 'Silver Reward', 200, 100.00, '₱100 off your next purchase'),
(3, 'Gold Reward', 500, 250.00, '₱250 off your next purchase');

-- --------------------------------------------------------

--
-- Table structure for table `shared_carts`
--

CREATE TABLE `shared_carts` (
  `share_id` varchar(36) NOT NULL,
  `owner_id` int NOT NULL,
  `shared_with` int DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','expired','used') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(255) NOT NULL,
  `firstname` varchar(50) NOT NULL,
  `middlename` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) NOT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `civil_status` enum('single','married','widowed','divorced','separated') DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `address` text,
  `birthdate` date DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `otp` varchar(6) DEFAULT NULL,
  `otp_expires` timestamp NULL DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `role` enum('user','admin','staff') DEFAULT 'user',
  `password_reset_otp` varchar(6) DEFAULT NULL,
  `password_reset_otp_expires` datetime DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `firstname`, `middlename`, `lastname`, `gender`, `civil_status`, `phone_number`, `address`, `birthdate`, `email`, `password`, `created_at`, `otp`, `otp_expires`, `email_verified`, `role`, `password_reset_otp`, `password_reset_otp_expires`, `profile_picture`) VALUES
(20, 'adminsiL4ns', '', NULL, '', 'male', 'single', NULL, NULL, NULL, 'admin@gmail.com', '$2b$10$wRo343tSktWutK.ljme.JOtFQj3fCguB9r0QtYLioG4F0//XbD0WS', '2025-02-14 20:30:57', NULL, NULL, 1, 'admin', NULL, NULL, NULL),
(23, 'Helios', 'Kien Eros', NULL, 'Aas', 'male', 'single', '097874547561', 'ilaya calapan', NULL, 'hernandezlanslorence@gmail.com', '$2a$10$FXivDvr6ZEu4/.BoTHD8tOXi6Ji6V3mv8BvVdrS68cQ3hYcmu3j1O', '2025-02-14 21:37:21', NULL, NULL, 1, 'staff', NULL, NULL, NULL),
(56, 'l4nszxcqwe', 'dsa', 'dsa', 'dsadsa', 'female', 'single', '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', '2025-02-16', 'dsdsadasdas@gmail.com', '$2a$10$SSpSYo7VpFS4tolhVjEQ2On47sOeNhXD3eplmpR/wEFNkGooExiC6', '2025-02-16 04:31:13', 'lKiGNV', '2025-02-16 04:41:13', 0, 'user', NULL, NULL, NULL),
(57, 'dsad213213', 'adsad', 'sadsa', '3dsads', 'female', 'single', '3442342', 'dsadas', '2025-02-16', 'lans@gmail.com', '$2a$10$Pd2lZMPCnTMBxylXfT47e.OHqz5AekpbITPS9PFmCKcetRQm.2qb6', '2025-02-16 04:32:19', 'blj3Gv', '2025-02-16 04:42:19', 0, 'user', NULL, NULL, NULL),
(58, 'L4nszxc_09', 'Lans Lorence', 'Navarro', 'Hernandez', 'male', 'single', '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', '2004-07-09', 'lanslorence@gmail.com', '$2a$10$z4qsUgfnimoeNljOb83iy.ZyoesJyUPl6qLsxAo1YN03af72K.g0.', '2025-02-16 06:14:39', NULL, NULL, 1, 'user', 'Px7inM', '2025-03-17 23:50:19', 'https://i.ibb.co/vx30tw6t/9dc4a1b4b580.jpg'),
(60, 'saddsaddasdsa', 'sda', 'fdgd', 'fdgf', 'male', 'married', '3232432', 'dsadsa', '2025-02-26', 'sa@gmail.com', '$2a$10$rtbD7y7bDxqiyrlvtmoYROheqdfqRbI2RSIFQX/DKkj.lly8B474.', '2025-02-25 18:02:55', NULL, NULL, 1, 'staff', NULL, NULL, NULL),
(1000, 'l4nstest optinal', 'lans', NULL, 'hernandez', NULL, NULL, '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', NULL, 'l4nsh3rn4nd3z@gmail.com', '$2a$10$.mxwVsDEB/kVnXpjw3.ieu6cc5uRXSoBu6.m5iHbz3IgvfLqH7wum', '2025-06-13 18:19:20', NULL, NULL, 1, 'user', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_rewards`
--

CREATE TABLE `user_rewards` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` char(7) DEFAULT NULL,
  `points` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_rewards`
--

INSERT INTO `user_rewards` (`id`, `user_id`, `order_id`, `points`, `description`, `created_at`) VALUES
(264, 58, '9396606', 1, 'Earned points from order #9396606', '2025-06-10 21:47:26'),
(265, 58, '6464763', 2000, 'Earned points from order #6464763', '2025-06-10 21:58:25'),
(266, 58, '0270665', 1, 'Earned points from order #0270665', '2025-06-10 22:06:06'),
(267, 58, '8843835', 1, 'Earned points from order #8843835', '2025-06-10 22:27:22'),
(268, 58, '5041695', 1, 'Earned points from order #5041695', '2025-06-11 12:39:58'),
(269, 58, NULL, -200, 'Redeemed for Silver Reward', '2025-06-11 12:44:07'),
(270, 58, NULL, -100, 'Redeemed for Bronze Rewardz', '2025-06-11 12:49:02'),
(271, 58, NULL, -500, 'Redeemed for Gold Reward', '2025-06-11 12:49:16'),
(272, 58, '2761636', 3, 'Earned points from order #2761636', '2025-06-11 12:49:29'),
(273, 56, '3226219', 1, 'Earned points from order #3226219', '2025-06-11 13:39:44'),
(274, 56, '3049944', 1, 'Earned points from order #3049944', '2025-06-11 13:39:44'),
(275, 56, '9868934', 1, 'Earned points from order #9868934', '2025-06-11 13:39:44'),
(276, 56, '7853322', 1, 'Earned points from order #7853322', '2025-06-11 13:39:44'),
(277, 56, '1625405', 1, 'Earned points from order #1625405', '2025-06-11 13:39:44'),
(278, 56, '1419916', 1, 'Earned points from order #1419916', '2025-06-11 13:39:44'),
(279, 56, '5219639', 1, 'Earned points from order #5219639', '2025-06-11 13:39:44'),
(280, 56, '1042234', 1, 'Earned points from order #1042234', '2025-06-11 13:39:44'),
(281, 56, '9811008', 1, 'Earned points from order #9811008', '2025-06-11 13:39:44'),
(282, 56, '1094201', 1, 'Earned points from order #1094201', '2025-06-11 13:39:44'),
(283, 56, '3851076', 1, 'Earned points from order #3851076', '2025-06-11 13:39:44'),
(284, 56, '2474222', 1, 'Earned points from order #2474222', '2025-06-11 13:39:44'),
(285, 56, '2225484', 1, 'Earned points from order #2225484', '2025-06-11 13:39:44'),
(286, 56, '4217171', 1, 'Earned points from order #4217171', '2025-06-11 13:39:44'),
(287, 56, '4547246', 1, 'Earned points from order #4547246', '2025-06-11 13:39:44'),
(288, 56, '0062958', 1, 'Earned points from order #0062958', '2025-06-11 13:39:44'),
(289, 56, '1310914', 1, 'Earned points from order #1310914', '2025-06-11 13:39:44'),
(290, 56, '1749430', 1, 'Earned points from order #1749430', '2025-06-11 13:39:44'),
(291, 56, '8298188', 1, 'Earned points from order #8298188', '2025-06-11 13:39:44'),
(292, 56, '5120226', 1, 'Earned points from order #5120226', '2025-06-11 13:39:44'),
(293, 56, '7789578', 1, 'Earned points from order #7789578', '2025-06-11 13:39:44'),
(294, 56, '1251674', 1, 'Earned points from order #1251674', '2025-06-11 13:39:44'),
(295, 56, '6031901', 1, 'Earned points from order #6031901', '2025-06-11 13:39:44'),
(296, 56, '3464693', 1, 'Earned points from order #3464693', '2025-06-11 13:39:44'),
(297, 56, '2734169', 1, 'Earned points from order #2734169', '2025-06-11 13:39:44'),
(298, 56, '0318801', 1, 'Earned points from order #0318801', '2025-06-11 13:39:44'),
(299, 56, '1782065', 1, 'Earned points from order #1782065', '2025-06-11 13:39:44'),
(300, 56, '5109806', 1, 'Earned points from order #5109806', '2025-06-11 13:39:44'),
(301, 56, '7966136', 1, 'Earned points from order #7966136', '2025-06-11 13:39:44'),
(302, 56, '2657847', 1, 'Earned points from order #2657847', '2025-06-11 13:39:44'),
(303, 56, '0320939', 1, 'Earned points from order #0320939', '2025-06-11 13:39:44'),
(304, 56, '1628722', 1, 'Earned points from order #1628722', '2025-06-11 13:39:44'),
(305, 56, '6780150', 1, 'Earned points from order #6780150', '2025-06-11 13:39:44'),
(306, 56, '0881007', 1, 'Earned points from order #0881007', '2025-06-11 13:39:44'),
(307, 56, '8540515', 1, 'Earned points from order #8540515', '2025-06-11 13:39:44'),
(308, 56, '4023658', 1, 'Earned points from order #4023658', '2025-06-11 13:39:44'),
(309, 56, '7339968', 1, 'Earned points from order #7339968', '2025-06-11 13:39:44'),
(310, 56, '7872481', 1, 'Earned points from order #7872481', '2025-06-11 13:39:44'),
(311, 56, '6069629', 1, 'Earned points from order #6069629', '2025-06-11 13:39:44'),
(312, 56, '7826652', 1, 'Earned points from order #7826652', '2025-06-11 13:39:44'),
(313, 56, '9525472', 1, 'Earned points from order #9525472', '2025-06-11 13:39:44'),
(314, 56, '3871827', 1, 'Earned points from order #3871827', '2025-06-11 13:39:44'),
(315, 56, '2477674', 1, 'Earned points from order #2477674', '2025-06-11 13:39:44'),
(316, 56, '6628013', 1, 'Earned points from order #6628013', '2025-06-11 13:39:44'),
(317, 56, '8176548', 1, 'Earned points from order #8176548', '2025-06-11 13:39:44'),
(318, 56, '0370997', 1, 'Earned points from order #0370997', '2025-06-11 13:39:44'),
(319, 56, '6304317', 1, 'Earned points from order #6304317', '2025-06-11 13:39:44'),
(320, 56, '1917367', 1, 'Earned points from order #1917367', '2025-06-11 13:39:44'),
(321, 56, '0078361', 1, 'Earned points from order #0078361', '2025-06-11 13:39:44'),
(322, 56, '3505083', 1, 'Earned points from order #3505083', '2025-06-11 13:39:44'),
(323, 56, '0166286', 1, 'Earned points from order #0166286', '2025-06-11 13:39:44'),
(324, 56, '7280722', 1, 'Earned points from order #7280722', '2025-06-11 13:39:44'),
(325, 56, '6837166', 1, 'Earned points from order #6837166', '2025-06-11 13:39:44'),
(326, 56, '4379664', 1, 'Earned points from order #4379664', '2025-06-11 13:39:44'),
(327, 56, '1679133', 1, 'Earned points from order #1679133', '2025-06-11 13:39:44'),
(328, 56, '2486554', 1, 'Earned points from order #2486554', '2025-06-11 13:39:44'),
(329, 56, '2132346', 1, 'Earned points from order #2132346', '2025-06-11 13:39:44'),
(330, 56, '8135598', 1, 'Earned points from order #8135598', '2025-06-11 13:39:44'),
(331, 56, '5385274', 1, 'Earned points from order #5385274', '2025-06-11 13:39:44'),
(332, 56, '9099822', 1, 'Earned points from order #9099822', '2025-06-11 13:39:44'),
(333, 56, '4429183', 1, 'Earned points from order #4429183', '2025-06-11 13:39:44'),
(334, 56, '5954237', 1, 'Earned points from order #5954237', '2025-06-11 13:39:44'),
(335, 56, '6751122', 1, 'Earned points from order #6751122', '2025-06-11 13:39:44'),
(336, 56, '9325414', 1, 'Earned points from order #9325414', '2025-06-11 13:39:44'),
(337, 56, '3752935', 1, 'Earned points from order #3752935', '2025-06-11 13:39:44'),
(338, 56, '8448674', 1, 'Earned points from order #8448674', '2025-06-11 13:39:44'),
(339, 56, '4564808', 1, 'Earned points from order #4564808', '2025-06-11 13:39:44'),
(340, 56, '7070479', 1, 'Earned points from order #7070479', '2025-06-11 13:39:44'),
(341, 56, '2388558', 1, 'Earned points from order #2388558', '2025-06-11 13:39:44'),
(342, 56, '0181757', 1, 'Earned points from order #0181757', '2025-06-11 13:39:44'),
(343, 56, '0049544', 1, 'Earned points from order #0049544', '2025-06-11 13:39:44'),
(344, 56, '9056126', 1, 'Earned points from order #9056126', '2025-06-11 13:39:44'),
(345, 56, '3152531', 1, 'Earned points from order #3152531', '2025-06-11 13:39:44'),
(346, 56, '7687088', 1, 'Earned points from order #7687088', '2025-06-11 13:39:44'),
(347, 56, '9848840', 1, 'Earned points from order #9848840', '2025-06-11 13:39:44'),
(348, 56, '0355902', 1, 'Earned points from order #0355902', '2025-06-11 13:39:44'),
(349, 56, '6180488', 1, 'Earned points from order #6180488', '2025-06-11 13:39:44'),
(350, 56, '4226170', 1, 'Earned points from order #4226170', '2025-06-11 13:39:44'),
(351, 56, '4672841', 1, 'Earned points from order #4672841', '2025-06-11 13:39:44'),
(352, 56, '0748472', 1, 'Earned points from order #0748472', '2025-06-11 13:39:44'),
(353, 56, '2165407', 1, 'Earned points from order #2165407', '2025-06-11 13:39:44'),
(354, 56, '4406490', 1, 'Earned points from order #4406490', '2025-06-11 13:39:44'),
(355, 56, '4234665', 1, 'Earned points from order #4234665', '2025-06-11 13:39:44'),
(356, 58, '5682030', 33, 'Earned points from order #5682030', '2025-06-11 15:29:15'),
(357, 58, '8634793', 5, 'Earned points from order #8634793', '2025-06-11 15:32:15'),
(358, 58, '4970734', 4, 'Earned points from order #4970734', '2025-06-11 19:20:28'),
(359, 58, '0907455', 11, 'Earned points from order #0907455', '2025-06-11 21:49:58'),
(360, 58, '4527232', 13, 'Earned points from order #4527232', '2025-06-12 08:11:45'),
(361, 58, '4151897', 1, 'Earned points from order #4151897', '2025-06-12 08:17:29'),
(362, 58, '7194326', 1, 'Earned points from order #7194326', '2025-06-12 08:27:16'),
(363, 58, '7853300', 2, 'Earned points from order #7853300', '2025-06-12 08:33:50'),
(364, 58, '5695988', 1, 'Earned points from order #5695988', '2025-06-12 08:34:12'),
(365, 58, '0491522', 1, 'Earned points from order #0491522', '2025-06-12 08:34:30'),
(366, 58, '2252374', 1, 'Earned points from order #2252374', '2025-06-12 08:35:32'),
(367, 58, '6545693', 1, 'Earned points from order #6545693', '2025-06-12 08:35:52'),
(368, 58, '5813781', 2, 'Earned points from order #5813781', '2025-06-12 08:38:13'),
(369, 58, '0848012', 2, 'Earned points from order #0848012', '2025-06-12 08:38:38'),
(370, 58, '0978768', 2, 'Earned points from order #0978768', '2025-06-12 08:41:07'),
(371, 58, '1414253', 2, 'Earned points from order #1414253', '2025-06-12 08:43:06'),
(372, 58, '9344479', 1, 'Earned points from order #9344479', '2025-06-12 08:45:37'),
(373, 58, '2173189', 6, 'Earned points from order #2173189', '2025-06-12 09:26:02'),
(374, 58, '8653905', 28, 'Earned points from order #8653905', '2025-06-12 10:36:15'),
(375, 58, '1288891', 30, 'Earned points from order #1288891', '2025-06-12 10:37:08'),
(376, 58, '4562216', 1, 'Earned points from order #4562216', '2025-06-13 18:26:04'),
(377, 58, NULL, -100, 'Redeemed for Bronze Rewardz', '2025-06-14 00:18:08'),
(378, 58, NULL, -200, 'Redeemed for Silver Reward', '2025-06-14 00:18:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `available_discounts`
--
ALTER TABLE `available_discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `choice_id` (`choice_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `accepted_by` (`accepted_by`),
  ADD KEY `idx_shared_cart` (`shared_cart_id`),
  ADD KEY `idx_shared_with` (`shared_with_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `order_reports`
--
ALTER TABLE `order_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_reviews`
--
ALTER TABLE `order_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_order_review` (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`products_id`);

--
-- Indexes for table `product_choices`
--
ALTER TABLE `product_choices`
  ADD PRIMARY KEY (`choice_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `receipt_settings`
--
ALTER TABLE `receipt_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reward_tiers`
--
ALTER TABLE `reward_tiers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shared_carts`
--
ALTER TABLE `shared_carts`
  ADD PRIMARY KEY (`share_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `shared_with` (`shared_with`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_rewards`
--
ALTER TABLE `user_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `available_discounts`
--
ALTER TABLE `available_discounts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2491654;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1752;

--
-- AUTO_INCREMENT for table `order_reports`
--
ALTER TABLE `order_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_reviews`
--
ALTER TABLE `order_reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `products_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT for table `product_choices`
--
ALTER TABLE `product_choices`
  MODIFY `choice_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `receipt_settings`
--
ALTER TABLE `receipt_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reward_tiers`
--
ALTER TABLE `reward_tiers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1001;

--
-- AUTO_INCREMENT for table `user_rewards`
--
ALTER TABLE `user_rewards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=379;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `available_discounts`
--
ALTER TABLE `available_discounts`
  ADD CONSTRAINT `available_discounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `available_discounts_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`);

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`products_id`),
  ADD CONSTRAINT `cart_ibfk_3` FOREIGN KEY (`choice_id`) REFERENCES `product_choices` (`choice_id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`products_id`);

--
-- Constraints for table `order_reports`
--
ALTER TABLE `order_reports`
  ADD CONSTRAINT `order_reports_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `order_reports_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_reviews`
--
ALTER TABLE `order_reviews`
  ADD CONSTRAINT `order_reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `order_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `product_choices`
--
ALTER TABLE `product_choices`
  ADD CONSTRAINT `product_choices_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`products_id`);

--
-- Constraints for table `shared_carts`
--
ALTER TABLE `shared_carts`
  ADD CONSTRAINT `shared_carts_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `shared_carts_ibfk_2` FOREIGN KEY (`shared_with`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_rewards`
--
ALTER TABLE `user_rewards`
  ADD CONSTRAINT `user_rewards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
