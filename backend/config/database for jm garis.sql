-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 14, 2025 at 06:43 PM
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
(68, 1014, 5.00, '2025-10-07 08:45:12', '2025-11-06 08:45:12', 1, '0440898');

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

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `user_id`, `product_id`, `quantity`, `created_at`, `choice_id`) VALUES
(2491925, 1014, 31, 1, '2025-10-09 18:05:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_tiers`
--

CREATE TABLE `loyalty_tiers` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `min_spend` decimal(10,2) NOT NULL,
  `max_spend` decimal(10,2) DEFAULT NULL,
  `bonus_percentage` decimal(5,2) NOT NULL,
  `has_free_product` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loyalty_tiers`
--

INSERT INTO `loyalty_tiers` (`id`, `name`, `min_spend`, `max_spend`, `bonus_percentage`, `has_free_product`, `created_at`) VALUES
(1, 'Bronzezxc', 2.00, 150300.00, 10.00, 0, '2025-06-30 13:50:00'),
(2, 'Silver', 16000.00, 20000.00, 10.00, 0, '2025-06-30 13:50:00'),
(3, 'Gold', 100000.00, NULL, 15.00, 1, '2025-06-30 13:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `custom_id` varchar(255) DEFAULT NULL,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error','order') DEFAULT 'info',
  `icon` varchar(50) DEFAULT 'fas fa-bell',
  `is_read` tinyint(1) DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `related_order_id` char(7) DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `custom_id`, `user_id`, `title`, `message`, `type`, `icon`, `is_read`, `is_deleted`, `created_at`, `updated_at`, `related_order_id`, `action_url`) VALUES
(62, 'order-0619440-pending', 1014, 'Order Update', 'Order #0619440 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-09-15 02:28:34', '2025-09-16 08:41:54', '0619440', '/order-details/0619440'),
(63, 'order-0619440-cancelled', 1014, 'Order Update', 'Order #0619440 status updated to cancelled.', 'order', 'fas fa-bell', 1, 0, '2025-09-15 02:28:50', '2025-09-16 08:41:54', '0619440', '/order-details/0619440'),
(66, 'order-5587250-pending', 1014, 'Order Update', 'Order #5587250 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-09-16 05:50:43', '2025-09-16 08:41:54', '5587250', '/order-details/5587250'),
(67, 'order-5587250-ready for pickup', 1014, 'Order Update', 'Order #5587250 is ready for pickup!', 'order', 'fas fa-check-circle', 1, 0, '2025-09-16 05:51:43', '2025-09-16 08:41:54', '5587250', '/order-details/5587250'),
(69, 'order-5587250-paid', 1014, 'Order Update', 'Order #5587250 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 1, 0, '2025-09-16 05:53:43', '2025-09-16 08:41:54', '5587250', '/order-details/5587250'),
(70, 'order-8329578-paid', 1014, 'Order Update', 'Order #8329578 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 1, 0, '2025-09-16 05:55:31', '2025-09-16 08:41:54', '8329578', '/order-details/8329578'),
(73, 'order-8329578-ready for pickup', 1014, 'Order Update', 'Order #8329578 is ready for pickup!', 'order', 'fas fa-check-circle', 1, 0, '2025-09-16 05:58:31', '2025-09-16 08:41:54', '8329578', '/order-details/8329578'),
(90, 'order-6393957-pending', 1014, 'Order Update', 'Order #6393957 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-09-16 08:26:28', '2025-09-16 08:41:54', '6393957', '/order-details/6393957'),
(91, 'order-PO00002-ready for pickup', 1016, 'Order Update', 'Order #PO00002 is ready for pickup!', 'order', 'fas fa-check-circle', 0, 0, '2025-09-16 08:28:57', '2025-09-16 08:28:57', 'PO00002', '/order-details/PO00002'),
(92, 'order-PO00001-paid', 1016, 'Order Update', 'Order #PO00001 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-09-16 08:28:57', '2025-09-16 08:28:57', 'PO00001', '/order-details/PO00001'),
(93, 'order-6393957-preparing', 1014, 'Order Update', 'Order #6393957 is now being prepared.', 'order', 'fas fa-utensils', 1, 0, '2025-09-16 08:29:29', '2025-09-16 08:41:54', '6393957', '/order-details/6393957'),
(94, 'order-6393957-paid', 1014, 'Order Update', 'Order #6393957 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 1, 0, '2025-09-16 08:30:29', '2025-09-16 08:41:54', '6393957', '/order-details/6393957'),
(98, 'order-PO00007-paid', 1016, 'Order Update', 'Order #PO00007 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-07 08:27:32', '2025-10-07 08:27:32', 'PO00007', '/order-details/PO00007'),
(99, 'order-PO00006-paid', 1016, 'Order Update', 'Order #PO00006 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-07 08:27:32', '2025-10-07 08:27:32', 'PO00006', '/order-details/PO00006'),
(100, 'order-9248589-pending', 1014, 'Order Update', 'Order #9248589 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 08:44:09', '2025-10-07 08:44:09', '9248589', '/order-details/9248589'),
(101, 'order-9248589-paid', 1014, 'Order Update', 'Order #9248589 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-07 08:45:05', '2025-10-07 08:45:05', '9248589', '/order-details/9248589'),
(103, 'order-0440898-pending', 1014, 'Order Update', 'Order #0440898 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 08:45:22', '2025-10-07 08:45:22', '0440898', '/order-details/0440898'),
(104, 'order-0440898-paid', 1014, 'Order Update', 'Order #0440898 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-07 08:46:31', '2025-10-07 08:46:31', '0440898', '/order-details/0440898'),
(117, 'order-2145910-pending', 1014, 'Order Update', 'Order #2145910 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 21:58:41', '2025-10-07 21:58:41', '2145910', '/order-details/2145910'),
(118, 'order-1411356-pending', 1014, 'Order Update', 'Order #1411356 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 21:59:00', '2025-10-07 21:59:00', '1411356', '/order-details/1411356'),
(124, 'order-1448515-pending', 1014, 'Order Update', 'Order #1448515 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 22:07:59', '2025-10-07 22:07:59', '1448515', '/order-details/1448515'),
(132, 'order-1448515-preparing', 1014, 'Order Update', 'Order #1448515 is now being prepared.', 'order', 'fas fa-utensils', 0, 0, '2025-10-07 22:18:51', '2025-10-07 22:18:51', '1448515', '/order-details/1448515'),
(171, 'order-PO00041-paid', 1016, 'Order Update', 'Order #PO00041 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00041', '/order-details/PO00041'),
(172, 'order-PO00040-paid', 1016, 'Order Update', 'Order #PO00040 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00040', '/order-details/PO00040'),
(173, 'order-PO00039-paid', 1016, 'Order Update', 'Order #PO00039 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00039', '/order-details/PO00039'),
(174, 'order-PO00038-paid', 1016, 'Order Update', 'Order #PO00038 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00038', '/order-details/PO00038'),
(175, 'order-PO00037-paid', 1016, 'Order Update', 'Order #PO00037 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00037', '/order-details/PO00037'),
(176, 'order-PO00036-paid', 1016, 'Order Update', 'Order #PO00036 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00036', '/order-details/PO00036'),
(177, 'order-PO00035-paid', 1016, 'Order Update', 'Order #PO00035 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00035', '/order-details/PO00035'),
(178, 'order-PO00034-paid', 1016, 'Order Update', 'Order #PO00034 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00034', '/order-details/PO00034'),
(179, 'order-PO00033-paid', 1016, 'Order Update', 'Order #PO00033 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:28:49', '2025-10-08 16:28:49', 'PO00033', '/order-details/PO00033'),
(180, 'order-1448515-ready for pickup', 1014, 'Order Update', 'Order #1448515 is ready for pickup!', 'order', 'fas fa-check-circle', 0, 0, '2025-10-08 16:29:24', '2025-10-08 16:29:24', '1448515', '/order-details/1448515'),
(181, 'order-1411356-preparing', 1014, 'Order Update', 'Order #1411356 is now being prepared.', 'order', 'fas fa-utensils', 0, 0, '2025-10-08 16:29:24', '2025-10-08 16:29:24', '1411356', '/order-details/1411356'),
(183, 'order-1448515-paid', 1014, 'Order Update', 'Order #1448515 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 16:30:24', '2025-10-08 16:30:24', '1448515', '/order-details/1448515'),
(304, 'order-1411356-paid', 1014, 'Order Update', 'Order #1411356 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 17:10:53', '2025-10-08 17:10:53', '1411356', '/order-details/1411356'),
(311, 'order-2145910-ready for pickup', 1014, 'Order Update', 'Order #2145910 is ready for pickup!', 'order', 'fas fa-check-circle', 0, 0, '2025-10-08 17:12:53', '2025-10-08 17:12:53', '2145910', '/order-details/2145910'),
(314, 'order-2145910-paid', 1014, 'Order Update', 'Order #2145910 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 17:13:53', '2025-10-08 17:13:53', '2145910', '/order-details/2145910'),
(405, 'order-1967882-pending', 1014, 'Order Update', 'Order #1967882 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-08 18:05:58', '2025-10-08 18:05:58', '1967882', '/order-details/1967882'),
(425, 'order-8731696-pending', 1014, 'Order Update', 'Order #8731696 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-08 18:38:39', '2025-10-08 18:38:39', '8731696', '/order-details/8731696'),
(426, 'order-8731696-ready for pickup', 1014, 'Order Update', 'Order #8731696 is ready for pickup!', 'order', 'fas fa-check-circle', 0, 0, '2025-10-09 18:34:22', '2025-10-09 18:34:22', '8731696', '/order-details/8731696'),
(427, 'order-8731696-paid', 1014, 'Order Update', 'Order #8731696 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-09 18:35:22', '2025-10-09 18:35:22', '8731696', '/order-details/8731696');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` char(7) NOT NULL,
  `user_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `accepted_by` int DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `cash_amount` decimal(10,2) DEFAULT NULL,
  `change_amount` decimal(10,2) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `is_physical_order` tinyint(1) DEFAULT '0',
  `packaging_preference` enum('eco','plastic') DEFAULT 'eco',
  `payment_intent_id` varchar(255) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'cash'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `total_amount`, `status`, `payment_status`, `created_at`, `updated_at`, `cancel_reason`, `accepted_by`, `accepted_at`, `cash_amount`, `change_amount`, `customer_name`, `is_physical_order`, `packaging_preference`, `payment_intent_id`, `payment_method`) VALUES
('0619440', 1014, 301.00, 'cancelled', 'pending', '2025-09-15 02:28:34', '2025-09-15 02:28:46', 'Changed my mind', NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('5587250', 1014, 234.00, 'paid', 'pending', '2025-09-16 05:50:43', '2025-09-16 05:53:20', NULL, 1016, '2025-09-16 13:50:58', 4000.00, 3766.00, NULL, 0, 'eco', NULL, 'cash'),
('6393957', 1014, 50.00, 'paid', 'pending', '2025-09-16 08:26:28', '2025-09-16 08:29:56', NULL, 1016, '2025-09-16 16:29:21', 50.00, 0.00, NULL, 0, 'eco', NULL, 'cash'),
('8329578', 1014, 649.00, 'paid', 'pending', '2025-09-16 05:54:37', '2025-09-16 06:02:39', NULL, 1016, '2025-09-16 13:54:45', 1000.00, 351.00, NULL, 0, 'eco', NULL, 'hatid'),
('PO00001', 1016, 936.00, 'paid', 'pending', '2025-09-16 05:51:25', '2025-09-16 05:52:46', NULL, 1016, '2025-09-16 13:51:25', 1000.00, 64.00, 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00002', 1016, 843.00, 'paid', 'pending', '2025-09-16 06:29:43', '2025-10-07 08:07:16', NULL, 1016, '2025-09-16 14:29:43', 1000.00, 157.00, 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00003', 1016, 255.00, 'paid', 'pending', '2025-09-16 08:44:48', '2025-10-02 02:57:00', NULL, 1016, '2025-09-16 16:44:48', 300.00, 45.00, 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00004', 1016, 72.00, 'paid', 'pending', '2025-10-01 07:04:58', '2025-10-01 07:05:09', NULL, 1016, '2025-10-01 15:04:58', 100.00, 28.00, 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00005', 1016, 95.00, 'paid', 'pending', '2025-10-01 07:10:23', '2025-10-01 07:10:42', NULL, 1016, '2025-10-01 15:10:23', 95.00, 0.00, 'Walk-in Customer', 1, 'eco', NULL, 'cash');

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
(4262, '0619440', 31, 1, 301.00, NULL),
(4263, '5587250', 32, 1, 234.00, NULL),
(4264, 'PO00001', 32, 4, 234.00, NULL),
(4265, '8329578', 33, 1, 649.00, NULL),
(4266, 'PO00002', 72, 1, 843.00, 104),
(4267, '6393957', 178, 1, 50.00, 264),
(4268, 'PO00003', 72, 1, 255.00, 99),
(4269, 'PO00004', 79, 1, 72.00, NULL),
(4270, 'PO00005', 83, 1, 95.00, NULL);

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

-- --------------------------------------------------------

--
-- Table structure for table `payment_intents`
--

CREATE TABLE `payment_intents` (
  `id` int NOT NULL,
  `order_id` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reference_number` varchar(255) DEFAULT NULL,
  `gcash_reference` varchar(255) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `order_data` text,
  `user_id` int DEFAULT NULL,
  `payment_type` varchar(20) DEFAULT 'full_payment',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `remaining_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment_intents`
--

INSERT INTO `payment_intents` (`id`, `order_id`, `amount`, `status`, `created_at`, `updated_at`, `reference_number`, `gcash_reference`, `verified_at`, `paid_at`, `order_data`, `user_id`, `payment_type`, `total_amount`, `remaining_amount`) VALUES
(67, NULL, 301.00, 'pending', '2025-10-09 18:05:40', '2025-10-09 18:05:40', 'zHSYBn5', 'zHSYBn5', NULL, NULL, '{\"items\":[{\"id\":2491925,\"product_id\":31,\"quantity\":1,\"price\":301,\"choice_id\":null}],\"discountId\":\"\",\"packagingPreference\":\"eco\",\"paymentMethod\":\"gcash\"}', 1014, 'full_payment', 301.00, NULL),
(68, NULL, 301.00, 'pending', '2025-10-09 18:06:36', '2025-10-09 18:06:36', 'mvdhxJP', 'mvdhxJP', NULL, NULL, '{\"items\":[{\"id\":2491925,\"product_id\":31,\"quantity\":1,\"price\":301,\"choice_id\":null}],\"discountId\":\"\",\"packagingPreference\":\"eco\",\"paymentMethod\":\"gcash\"}', 1014, 'full_payment', 301.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payment_settings`
--

CREATE TABLE `payment_settings` (
  `id` int NOT NULL,
  `gcash_enabled` tinyint(1) DEFAULT '1',
  `downpayment_enabled` tinyint(1) DEFAULT '1',
  `downpayment_percentage` decimal(5,2) DEFAULT '25.00',
  `min_order_amount` decimal(10,2) DEFAULT '500.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment_settings`
--

INSERT INTO `payment_settings` (`id`, `gcash_enabled`, `downpayment_enabled`, `downpayment_percentage`, `min_order_amount`, `created_at`, `updated_at`, `updated_by`) VALUES
(1, 1, 0, 30.00, 500.00, '2025-09-09 17:29:41', '2025-10-09 18:05:13', 20);

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
(31, 'Alfonso 1 1Liter', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 301.00, 896, 'Beverages', 'https://i.ibb.co/jPyMQ6tH/2bf48b084634.png', '2025-03-31 23:21:29', '2025-10-08 17:33:32'),
(32, 'Alfonso 1 700mL', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 234.00, 930, 'Beverages', 'https://i.ibb.co/wjnnCRK/7928f679733c.png', '2025-03-31 23:22:15', '2025-10-08 18:38:39'),
(33, 'Alfonso 1 1.75Liter', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 649.00, 927, 'Beverages', 'https://i.ibb.co/N2t2GD8s/5da50a598cd4.png', '2025-03-31 23:22:59', '2025-10-08 18:38:39'),
(34, 'GSM Mojito', 'offers a refreshing blend of gin infused with mint and lime flavors, reminiscent of a traditional Mojito cocktail. It tends to have a crisp and citrusy profile with a hint of herbal notes from the mint.', 0.00, 72, 'Beverages', 'https://i.ibb.co/60Bw2QX7/6a76cc18e196.png', '2025-03-31 23:28:23', '2025-07-03 18:59:39'),
(36, 'Primera Light 750mL', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 140.00, 72, 'Beverages', 'https://i.ibb.co/0pCHgRnP/6b834d85cc3b.png', '2025-03-31 23:34:49', '2025-08-07 00:31:09'),
(37, 'Primera Light 1Liter', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 189.00, 91, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-03-31 23:35:27', '2025-10-07 14:19:16'),
(38, 'Lucky 7 Corned Beef ', 'organic-free corned beef multipack', 0.00, 196, 'Canned Goods', 'https://i.ibb.co/MD9MDJ5q/d66d18901a73.png', '2025-03-31 23:37:33', '2025-07-03 18:36:10'),
(41, 'Lucky 7 Meat Loaf 150g', 'organic-free corned beef multipack', 22.50, 50, 'Canned Goods', 'https://i.ibb.co/tTMm9hg9/bf73f6e95a5d.png', '2025-03-31 23:42:51', '2025-07-03 18:32:12'),
(45, 'Datu Patis ', '#1 fish sauce in the Philippines.', 0.00, 95, 'Condiments', 'https://i.ibb.co/0Ry6CFm6/51d8ce58dd9f.png', '2025-04-01 01:25:10', '2025-07-03 18:55:44'),
(47, 'UFC Ketchup', 'unique blend of fresh spices and select bananas that provide the tamis anghang (sweet and spicy) flavor. ', 0.00, 100, 'Condiments', 'https://i.ibb.co/j9gnXrxH/cecb6672ce73.png', '2025-04-01 01:27:23', '2025-07-03 18:55:01'),
(48, 'Argentina Corned Beef', 'No. 1 corned beef brand that has the food qualities consumer most value', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/W46GfnGB/d19d7b986670.png', '2025-04-01 01:32:37', '2025-07-03 18:28:05'),
(50, 'Primera Light 1Liter', 'a unique 55-proof brandy liqueur masterpiece', 185.00, 15, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-04-01 01:41:56', '2025-08-07 02:33:00'),
(51, 'May Sparkle Red', 'A non-alcoholic beverage from freshly-pressed and carefully-selected Belgium Grapes.', 0.00, 6, 'Beverages', 'https://i.ibb.co/Wv5gFDjr/d75fc84e5138.png', '2025-04-01 01:43:28', '2025-04-01 09:04:28'),
(52, 'Novellino 750mL', 'Novellino Wild Blackberry is a casual wine vinified from choice vitis vinifera grapes in the tradition of fine Italian winemaking', 270.00, 6, 'Beverages', 'https://i.ibb.co/278v021y/05b8707b2772.png', '2025-04-01 01:45:11', '2025-09-16 05:38:45'),
(53, 'The Bar Dry Gin 335mL ', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 6, 'Beverages', 'https://i.ibb.co/jkNpPRn2/4cd7e58417a4.png', '2025-04-01 01:46:37', '2025-04-16 23:31:00'),
(54, 'The Bar Pink 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 58, 'Beverages', 'https://i.ibb.co/hxGrvfmq/a6f137b5983c.png', '2025-04-01 01:47:16', '2025-05-18 22:14:33'),
(55, 'The Bar Lime 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 6, 'Beverages', 'https://i.ibb.co/8gggkGVx/49ad7f791839.png', '2025-04-01 01:47:46', '2025-08-07 00:31:29'),
(56, 'Emperador 750mL', ' brand of cut brandy and brandy produced by Emperador Inc.', 142.00, 50, 'Beverages', 'https://i.ibb.co/mrbVVg4L/daf1bf6947ad.png', '2025-04-01 01:51:17', '2025-04-01 09:18:46'),
(57, 'Emperador 1Liter', ' brand of cut brandy and brandy produced by Emperador Inc.', 185.00, 46, 'Beverages', 'https://i.ibb.co/VckXJTFG/ecd6f3d61a21.png', '2025-04-01 01:52:01', '2025-08-07 00:31:33'),
(58, 'Red Horse Beer per Case', 'beer', 617.00, 79, 'Beverages', 'https://i.ibb.co/F4fd74z2/2843dba65b63.png', '2025-04-01 09:27:22', '2025-08-07 00:31:26'),
(59, 'San Mig Light || Apple per Case', 'flavored beer', 0.00, 52, 'Beverages', 'https://i.ibb.co/dwTNCfJV/b0926c017020.png', '2025-04-08 12:30:05', '2025-07-03 19:07:55'),
(60, 'Ginebra per Case', 'delivers a clean, juniper-forward taste, complemented by subtle hints of citrus and spice', 1554.00, 199, 'Beverages', 'https://i.ibb.co/C3MZ5YvK/0b2cffba62af.png', '2025-04-08 12:59:46', '2025-08-05 14:35:20'),
(61, 'San Miguel Beer per case', 'full-flavored taste complements its pleasant aroma, making it a perfectly balanced beer', 599.00, 29, 'Beverages', 'https://i.ibb.co/FqyQ2D5Z/2b8cb868bbda.png', '2025-04-08 13:03:06', '2025-04-20 09:00:51'),
(62, 'Argentina Meat Loaf', 'made from quality meat that\'s seasoned with the most flavorful yet kid-friendly spices', 0.00, 99, 'Canned Goods', 'https://i.ibb.co/zTRL3z2K/67acda401865.png', '2025-04-08 13:13:02', '2025-07-03 18:33:38'),
(63, 'Wow Ulam', 'brand of canned and fresh processed meat products from Century Pacific Food Inc.', 23.00, 99, 'Canned Goods', 'https://i.ibb.co/nNMdv4zm/8eaa96b1b065.png', '2025-04-08 14:09:14', '2025-06-11 09:20:10'),
(64, 'Century Tuna', 'a leading canned tuna brand in the Philippines, known for its healthy, delicious, and convenient options,', 0.00, 150, 'Canned Goods', 'https://i.ibb.co/FbXNJm1m/c00050cbdeba.png', '2025-04-08 14:14:26', '2025-07-03 18:41:53'),
(65, 'Blue Bay', 'Manamis-namis. Deliciously irresistible. Unmistakably fresh. The sea`s bounty and farm`s harvest make one delightful feast.', 0.00, 199, 'Canned Goods', 'https://i.ibb.co/vxtvqDpM/cc9c981cfeb3.png', '2025-04-08 14:18:53', '2025-07-03 18:39:02'),
(66, '555 Tuna', 'the “Super Ulam Pinoy” because it is rich in calcium for stronger bones, protein for muscle building, lycopene for cancer prevention', 26.00, 49, 'Canned Goods', 'https://i.ibb.co/Y7jbJpZ9/0f06ee53e48d.png', '2025-04-08 14:21:01', '2025-04-20 09:03:16'),
(67, 'CDO Karne Norte', 'a Filipino-style corned beef that has a delicious guisado taste', 0.00, 99, 'Canned Goods', 'https://i.ibb.co/KjNHwTmS/6ef04ff0da58.png', '2025-04-08 14:23:53', '2025-07-03 18:37:55'),
(68, 'Bingo Corned Beef', 'a canned, ready-to-eat corned beef product, specially prepared with beef and savory seasonings, and fortified with zinc and iron', 0.00, 50, 'Canned Goods', 'https://i.ibb.co/BH4TXJBC/d226081191f0.png', '2025-04-08 14:26:27', '2025-07-03 18:30:03'),
(69, 'San Marino', 'has the delicious taste and health benefits of tuna', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/ns3PXZPS/e9feba69ac43.png', '2025-04-08 14:34:10', '2025-07-03 18:34:52'),
(70, 'Fresca Tuna', 'It\'s a great alternative to the usual sardines, giving you more value for your money while staying within your budget.', 26.50, 100, 'Canned Goods', 'https://i.ibb.co/j9QJQfM7/2e963da1932c.png', '2025-04-08 14:37:38', '2025-04-08 14:37:38'),
(71, 'Hunts Pork and Beans', '#1 brand of Pork & Beans in the Philippines. It is made from high quality Great Northern Beans and real pork bits covered in rich, thick, sweet tomato sauce.', 0.00, 50, 'Canned Goods', 'https://i.ibb.co/rGVdMcgd/716c7cd11ed1.png', '2025-04-08 14:39:42', '2025-07-03 18:31:15'),
(72, 'Bear Brand', ' a Nestlé-owned milk brand, particularly popular in the Philippines, offering both sterilized milk and fortified powdered milk drinks, known for providing essential nutrients and supporting overall health and well-being. ', 0.00, 150, 'Milk and Chocolate Drink', 'https://i.ibb.co/1fKNBZTT/b2969e594b9d.png', '2025-04-08 14:52:24', '2025-06-27 06:11:21'),
(73, 'Bear Brand Adult', 'a powdered milk drink specially formulated for adults aged 19-29, designed to provide essential nutrients, including calcium, vitamin D, and B-vitamins, to support energy and immunity, and help close daily nutrition gaps. ', 0.00, 14, 'Milk and Chocolate Drink', 'https://i.ibb.co/3mr1fM35/60153400556e.png', '2025-04-08 14:58:08', '2025-06-27 06:14:57'),
(74, 'Bear Brand Choco', ' a chocolate-flavored powdered milk drink fortified with essential nutrients like iron, zinc, and vitamin C, designed for individuals aged 3 and up to support strong immunity and overall well-being', 0.00, 1221, 'Milk and Chocolate Drink', 'https://i.ibb.co/nMPC557v/b9527d3d54b3.png', '2025-04-08 15:00:50', '2025-06-27 06:12:26'),
(75, 'Milo', 'a chocolate-flavored malted beverage powder created by Nestlé, known for its unique choco-malty flavor and often mixed with milk or water to create a nutritious and delicious drink, especially popular among children and those seeking an energy boost. ', 0.00, 42547, 'Milk and Chocolate Drink', 'https://i.ibb.co/7NrmLyxz/6d157cac0a1f.png', '2025-04-08 15:05:20', '2025-06-27 06:24:28'),
(76, 'Birch Tree', ' known for its affordable price and high-quality nutrition, with a focus on fortified milk for children and adults. ', 0.00, 22, 'Milk and Chocolate Drink', 'https://i.ibb.co/xK9CjyBV/e407420a9dcb.png', '2025-04-08 15:10:11', '2025-06-27 06:31:05'),
(77, 'Del Monte Ketchup', 'made from real, high-quality tomatoes, naturally contains lycopene, and is guaranteed to have no preservatives, offering a rich tomato flavor and a sweet-sour taste for delicious dips and meals', 49.00, 18, 'Condiments', 'https://i.ibb.co/jmzv3ZM/728ac9940fe7.png', '2025-04-08 22:48:17', '2025-06-13 17:16:24'),
(78, 'Lorins Patis', 'a popular, tangy Filipino fish sauce, ideal as a dipping sauce or cooking ingredient for a wide variety of dishes, including seafood, meat, poultry, vegetables, and Filipino favorites like sinigang and nilaga. ', 0.00, 20, 'Condiments', 'https://i.ibb.co/3yZ5qszC/df3e929a28ec.png', '2025-04-08 23:02:19', '2025-07-03 18:56:23'),
(79, 'Sugar per kg', 'brown and white refined', 72.00, 299, 'Condiments', 'https://i.ibb.co/xK5TGqzf/2eb5e49aefb7.png', '2025-04-08 23:06:43', '2025-10-01 07:04:58'),
(80, 'Salt per kg', 'sea salt', 12.00, 200, 'Condiments', 'https://i.ibb.co/j9LdB8xH/50a57d229f22.png', '2025-04-08 23:08:19', '2025-04-08 23:08:19'),
(81, 'Paminta per Tie', 'whole and ground black pepper', 8.00, 100, 'Condiments', 'https://i.ibb.co/N6RqFRg8/3912cb5cc3e9.png', '2025-04-08 23:10:07', '2025-04-08 23:10:07'),
(82, 'Laurel per Tie', 'is an evergreen plant used to add flavor to dishes. It is used in cuisines all over the world for flavoring especially stews and broths, marinades, meat and fish dishes, gravies, and game.', 8.00, 30, 'Condiments', 'https://i.ibb.co/1Gg3Rqmt/c68fa580806f.png', '2025-04-08 23:11:30', '2025-06-11 07:32:15'),
(83, 'Mafran Banana Catsup', 'formulated from choice spices, natural flavor and aroma of banana', 95.00, 11, 'Condiments', 'https://i.ibb.co/jP5X36rq/dc20ac6e0fce.png', '2025-04-08 23:13:42', '2025-10-01 07:10:23'),
(84, 'Dip Catsup Gallon', 'often used as a dip or a topping for various dishes, characterized by its sweet and tangy flavor', 99.00, 7, 'Condiments', 'https://i.ibb.co/KjDjv9WP/00bb85cf904b.png', '2025-04-08 23:15:01', '2025-09-10 09:08:10'),
(85, '555 Karne Norte', ' a locally manufactured corned beef, known for its quality and affordability, made with selected beef, hashed, and hygienically processed under international standards, ready to eat. ', 0.00, 30, 'Canned Goods', 'https://i.ibb.co/xtWHP4pc/d786693a1768.png', '2025-04-08 23:17:10', '2025-07-03 18:45:04'),
(86, '555 Tausi', 'a popular Filipino canned food featuring fried sardines in a savory-sweet sauce with the distinct flavor of fermented black beans (tausi)', 33.00, 10, 'Canned Goods', 'https://i.ibb.co/B5zmwwY5/47dcc1b0cebc.png', '2025-04-08 23:18:12', '2025-04-08 23:18:12'),
(89, 'Lucky 7 Sardines', ' a budget-friendly, canned sardine option in tomato sauce, known for their savory taste and affordability, making them a popular choice for daily meals. ', 0.00, 45, 'Canned Goods', 'https://i.ibb.co/JRzY9m7R/054a358ac5dc.png', '2025-04-08 23:26:01', '2025-07-03 18:49:40'),
(90, 'Atami Sardines', 'A delightful and flavorful seafood choice that combines the natural goodness of sardines', 0.00, 50, 'Canned Goods', 'https://i.ibb.co/sdNR2j4f/0f5b60542f2a.png', '2025-04-08 23:28:21', '2025-07-03 18:51:53'),
(91, 'Master Sardines', 'known for their premium quality, sourced from the depths of the ocean and expertly preserved to retain natural flavors and nutritional goodness, with a focus on a quick catch-to-can process. ', 0.00, 99, 'Canned Goods', 'https://i.ibb.co/ksGrTmWD/8c3590d7e350.png', '2025-04-08 23:31:56', '2025-07-03 18:51:12'),
(92, 'trytry test', 'jm garis', 100.00, 20, 'Beverages', 'https://i.ibb.co/pjrnNm07/59cc32c572c3.jpg', '2025-05-18 23:05:23', '2025-06-11 08:38:19'),
(97, 'Saba Mackarel', 'Saba mackerel, also known as Japanese mackerel or blue mackerel, is a flavorful and oily fish, particularly prized in Japanese cuisine', 0.00, 120, 'Canned Goods', 'https://i.ibb.co/ZRkbT3RJ/0e0921a17a8a.png', '2025-06-18 12:49:21', '2025-06-18 15:20:57'),
(98, 'Mega Mackarel', '155g, Mega Mackerel is a canned mackerel product known for its big, flavorful chunks and versatility in Filipino dishes.', 33.00, 24, 'Canned Goods', 'https://i.ibb.co/6cB1crnb/dd7ac057568c.png', '2025-06-18 12:51:19', '2025-07-03 18:45:54'),
(99, 'Saba Sardines Large', 'Saba sardines are a popular brand of canned sardines known for their firm, meaty texture and distinct flavor, particularly in the Philippines. ', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/rfs5Z80w/b381e12b66d0.png', '2025-06-18 12:53:45', '2025-06-19 01:30:25'),
(100, 'Saba Squid', 'Saba squid, specifically referring to products like \"Saba Squid in Soy Sauce\" or \"Saba Squid Sisig,\" is a Filipino delicacy featuring tender squid pieces cooked and preserved in a savory sauce, often with soy sauce and chili. ', 0.00, 70, 'Canned Goods', 'https://i.ibb.co/0jfpC22s/6b0257b01d55.png', '2025-06-18 12:56:21', '2025-06-19 01:30:44'),
(101, 'Mega Squid', 'A mega squid, as depicted in The Future is Wild, is a large, terrestrial, omnivorous animal, standing 4 meters tall and weighing 8 tonnes, with a body structure that is a mix of squid and terrestrial animal features', 0.00, 30, 'Canned Goods', 'https://i.ibb.co/CsXsKJQT/bb0835eb7714.png', '2025-06-18 12:58:29', '2025-06-18 15:25:50'),
(102, 'Rosebowl Sardines', 'They are a classic and well-regarded brand, often described as a favorite among many generations. The sardines are packed in a flavorful tomato sauce, and some varieties include a spicy chili kick', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/MyCtkwpC/da06407e203a.png', '2025-06-18 13:01:09', '2025-06-19 01:28:34'),
(103, 'MaLing', 'Maling is a brand of canned luncheon meat, often made with pork, that is popular in Asia, particularly in the Philippines and other Southeast Asian countries. It\'s known for its savory and slightly salty flavor, smooth texture, and versatility in various dishes. ', 0.00, 48, 'Canned Goods', 'https://i.ibb.co/SzRjMZP/499e0e083344.png', '2025-06-18 13:03:03', '2025-06-19 01:31:03'),
(104, 'TigaBunga Squid', 'Tiga Bunga is a brand known for its canned squid in natural ink', 0.00, 62, 'Canned Goods', 'https://i.ibb.co/hNbLLDr/0afd5347f839.png', '2025-06-18 13:05:07', '2025-06-19 01:37:51'),
(105, 'Reno Liver Spread', 'Reno Liver Spread is a Filipino canned liver spread, typically made from a mixture of pureed pork liver, poultry meat, cereals, vegetable oil, and spices.', 0.00, 160, 'Canned Goods', 'https://i.ibb.co/ZRds181S/2d7e7dcbc1ad.png', '2025-06-18 13:11:53', '2025-06-19 01:29:20'),
(106, 'Philips Sausage', 'Philips is a well-known food brand in the Philippines, recognized for its canned goods, particularly its Vienna sausage. Philips Vienna Sausage is known for its quality and affordable price, making it a popular choice for Filipino families.', 26.00, 30, 'Canned Goods', 'https://i.ibb.co/1fXgkHCY/93501a584679.png', '2025-06-18 13:13:30', '2025-06-18 13:13:30'),
(107, 'Koolers per Box', 'Koolers is a brand of juice drinks known for their fruity and refreshing flavors, often marketed as a fun and healthy way to start the day', 0.00, 200, 'Beverages', 'https://i.ibb.co/zhdYJH9K/9cd95abc48cc.png', '2025-06-18 13:18:31', '2025-06-19 01:38:09'),
(108, 'Wilkins 7 Liter', 'a brand of purified drinking water, recognized for its quality and safety.', 88.00, 12, 'Beverages', 'https://i.ibb.co/yn8NpYs2/67e034629cb9.png', '2025-06-18 13:20:07', '2025-06-18 13:20:07'),
(109, 'Refresh Mineral 350mL (sold per case)', 'a brand of bottled water known for its natural, clean taste, sourced directly from springs, and its eco-friendly packaging', 150.00, 20, 'Beverages', 'https://i.ibb.co/F13xwP6/641c5d6df4ec.png', '2025-06-18 13:21:40', '2025-06-18 13:21:40'),
(110, 'Cobra (per case)', 'Cobra is an energy drink, primarily available in the Philippines, known for its orange flavor and ability to provide an energy boost', 207.00, 20, 'Beverages', 'https://i.ibb.co/n8ZzykdX/79aa8145fe83.png', '2025-06-18 13:24:11', '2025-06-18 13:24:11'),
(111, 'Sting (per case)', 'Sting is a carbonated energy drink, produced by PepsiCo Vietnam, designed to provide a boost of energy and focus.', 200.00, 30, 'Beverages', 'https://i.ibb.co/DfwDcqLh/ad3f161a5e26.png', '2025-06-18 13:25:06', '2025-06-18 13:25:06'),
(112, 'Mountain Dew (per case)', 'Mountain Dew is a citrus-flavored, caffeinated soft drink known for its unique, tangy taste and vibrant, slightly neon green color. It\'s a popular choice for those seeking a refreshing, energizing beverage, often enjoyed during activities or with meals.', 192.00, 100, 'Beverages', 'https://i.ibb.co/YBRdJfsP/d62cc77c8cd9.png', '2025-06-18 13:25:58', '2025-07-03 09:57:03'),
(113, 'Coke/Royal/Sprite Mismo (per case)', 'Coke, Royal, and Sprite, all from The Coca-Cola Company, are popular carbonated soft drinks.', 0.00, 200, 'Beverages', 'https://i.ibb.co/ksMvMh8H/eccf0110a173.png', '2025-06-18 13:28:32', '2025-06-18 13:31:28'),
(114, '1.5L Coke/Royal/Sprite (per case)', 'Coke, Royal, and Sprite, all from The Coca-Cola Company, are popular carbonated soft drinks.', 0.00, 30, 'Beverages', 'https://i.ibb.co/Y7W1c1pc/5ca33bf6a13a.png', '2025-06-18 13:31:03', '2025-06-19 01:38:30'),
(115, 'Rebisco Crackers', 'Rebisco Crackers are a classic Filipino snack known for their light, crispy texture and subtle, slightly salty taste. ', 58.00, 10, 'Biscuits', 'https://i.ibb.co/dsfRcZN6/130d3bde1284.png', '2025-06-18 14:31:05', '2025-06-18 14:31:05'),
(116, 'Flavored Rebisco Crackers', 'Rebisco offers a variety of flavored cracker sandwiches with creamy fillings. Popular flavors include chocolate, strawberry, cream, and butter, often sold in packs of 10. Some also feature peanut butter or pastillas fillings. Rebisco also offers whole wheat crackers and other flavored options like honey butter. ', 0.00, 90, 'Biscuits', 'https://i.ibb.co/9k7PNJ5m/4a91171d5a1d.png', '2025-06-18 14:34:03', '2025-06-19 01:38:48'),
(117, 'Frootees', 'Frootees are a line of flavored shortcake cookies, marketed as a nutritious and filling snack for kids. They are known for being high in Vitamin C and Zinc, which are believed to boost the immune system and potentially improve focus.', 58.00, 150, 'Biscuits', 'https://i.ibb.co/yBPRRSdC/ab0f7e9ac462.png', '2025-06-18 14:38:31', '2025-06-18 14:38:31'),
(118, 'Rebisco Extreme', 'Rebisco Extreme is a chocolate-flavored biscuit that features a combination of chocolate crackers, a chocolate filling, a chocolate coating, and chocolate sprinkles', 58.00, 150, 'Biscuits', 'https://i.ibb.co/S73MB8X3/41a3498b084b.png', '2025-06-18 14:39:14', '2025-06-18 14:39:14'),
(119, 'Hansel Crackers', '12 pieces of creamy, sweet-salty plain crackers perfect for sharing with the family! Best paired with coffee, juice, spreads and toppings to cap off a long day with your loved ones!', 58.00, 150, 'Biscuits', 'https://i.ibb.co/TD3tB6wp/ee0a6c972314.png', '2025-06-18 14:40:24', '2025-06-18 14:40:24'),
(120, 'Flavored Hansel', 'Hansel sandwiches are soft, salty-sweet biscuit sandwiches with a creamy filling, available in a variety of flavors. They are known for their distinct aroma and are a popular Filipino snack. The \"Flavor Bunch\" variety includes Mocha, Milk, Chocolate, Butter, and Milky Strawberry flavors. ', 0.00, 750, 'Biscuits', 'https://i.ibb.co/bMM1N0hJ/e97cce0da8f0.png', '2025-06-18 14:44:52', '2025-06-19 01:39:05'),
(121, 'Combi', 'Combi biscuits, specifically the Rebisco Combi Triple Choco, are a snack consisting of a chocolate cream filling sandwiched between a crunchy chocolate cracker and a chocolate wafer.', 62.00, 60, 'Biscuits', 'https://i.ibb.co/1JjyTthp/80e642aa710b.png', '2025-06-18 14:45:46', '2025-06-18 14:45:46'),
(122, 'Choco Mucho (per box)', 'Choco Mucho biscuits are bite-sized treats known for their combination of rolled wafer, caramel, rice crispies, and creamy chocolate. ', 0.00, 50, 'Biscuits', 'https://i.ibb.co/67LSfJWD/6addd661a002.png', '2025-06-18 14:48:20', '2025-06-18 15:29:31'),
(123, 'Wafertime Rich Cream', 'Wafertime Rich Cream biscuits are flat wafer sandwiches with a rich, creamy filling. Rebisco\'s Wafertime Rich Cream in particular, features a deliciously rich chocolate filling abundantly present in every bite. ', 70.00, 20, 'Biscuits', 'https://i.ibb.co/G3ftYQdJ/3ee6834bd091.png', '2025-06-18 14:50:17', '2025-06-18 14:50:17'),
(124, 'Super Thin ', 'Super thin biscuits are light, crispy, and delicate crackers, often described as having the texture of a chip. They are known for their thinness and satisfying crunch, often paired with a subtle sweetness and a hint of milk flavor. ', 0.00, 20, 'Biscuits', 'https://i.ibb.co/5X7t0yFM/8fb7551ce701.png', '2025-06-18 14:51:38', '2025-06-18 15:20:35'),
(125, 'Bravo Biscuit', 'known for their unique sweet-salty taste and are packed with vitamins B1, B2, and E. They feature a blend of sugar and sesame seeds, offering a distinctive flavor profile', 58.00, 20, 'Biscuits', 'https://i.ibb.co/Kc304qg6/fd1dbaceef5e.png', '2025-06-18 14:52:55', '2025-06-18 14:52:55'),
(126, 'Rebisco Honey Butter', 'Rebisco Honey Butter Crackers are crunchy, sweet and savory biscuits. They are flavored with honey and butter, and have a subtle sweetness from the honey and a rich, buttery taste.', 58.00, 10, 'Biscuits', 'https://i.ibb.co/WvyTfVmf/b17663b06ee9.png', '2025-06-18 15:07:04', '2025-06-18 15:07:04'),
(127, 'Fudgee Bar', 'Fudgee Barr is a popular Philippine snack, Fudgee Barr is available in various flavors, including chocolate, macapuno (coconut), milk, vanilla, mocha, and salted caramel. A combo pack with assorted flavors is also available. ', 0.00, 200, 'Biscuits', 'https://i.ibb.co/W4FMNyVL/6c0d792aad26.png', '2025-06-18 15:11:39', '2025-06-19 01:39:32'),
(128, 'Cupp Keyk Assorted', 'Cupp Keyk Assorted is a selection of Filipino-style mini cupcakes with a variety of flavors, known for their moist and delicious cake base and enjoyable toppings.', 67.00, 10, 'Biscuits', 'https://i.ibb.co/dJzzQhZQ/f0fd56b261e3.png', '2025-06-18 15:13:43', '2025-06-18 15:13:43'),
(129, 'Topps Sarap ', 'Topps Sarap is a brand of compact, single-serving cupcakes that are known for their rich and creamy filling, thick frosting, and toppings like star sprinkles', 0.00, 30, 'Biscuits', 'https://i.ibb.co/JFxPhLw5/3f865e3665f4.png', '2025-06-18 15:15:47', '2025-06-18 15:20:00'),
(130, 'Brownie Break', 'Brownie Break is a brand of individually wrapped, chewy, bite-sized brownies.', 75.00, 30, 'Biscuits', 'https://i.ibb.co/Ld2y9y6C/3f859b3e89e7.png', '2025-06-18 15:17:49', '2025-06-18 15:17:49'),
(131, '555 Karne Norte', ' a locally manufactured corned beef, known for its quality and affordability, made with selected beef, hashed, and hygienically processed under international standards, ready to eat. ', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/XxwWhW35/12816c9121e9.png', '2025-06-18 16:18:16', '2025-06-18 16:18:42'),
(132, 'Ligo Sardines', 'Ligo sardines, a popular Filipino brand, are known for their high-quality sardines packed in a flavorful tomato sauce.', 0.00, 200, 'Canned Goods', 'https://i.ibb.co/xtf07ypV/9d9995cb1592.png', '2025-06-18 16:22:41', '2025-06-19 01:40:05'),
(133, 'Mega Sardines', 'Mega Sardines, the number one sardine brand in the Philippines, is known for its fresh, high-quality sardines caught and canned within 12 hours.', 0.00, 1000, 'Canned Goods', 'https://i.ibb.co/m5N1MgKp/dd37d6c182e1.png', '2025-06-18 16:24:18', '2025-06-18 16:24:30'),
(135, 'Kopiko Twin (10\'s)', ' These twin packs are popular for their convenience and affordability, offering a creamy, delicious coffee experience. ', 0.00, 800, 'Coffee and Creamer', 'https://i.ibb.co/PsL7Vywf/3fed60dcca32.png', '2025-07-03 09:35:44', '2025-07-03 09:36:15'),
(136, 'Great Taste                                                                   ', 'Great Taste is a popular instant coffee brand known for its rich taste and aroma, offering a variety of flavors and formats to suit different preferences', 0.00, 600, 'Coffee and Creamer', 'https://i.ibb.co/mMrH77q/e5d62ff7e81b.png', '2025-07-03 09:43:25', '2025-07-03 09:44:35'),
(137, 'Nescafe Classic', 'Let the unmistakeable, full-flavoured Nescafé ® Classic instant coffee awaken your senses for a perfect morning moment, with an expert medium-dark roast.', 0.00, 400, 'Coffee and Creamer', 'https://i.ibb.co/rKh3ks8y/57ba9758c142.png', '2025-07-03 09:53:22', '2025-07-03 09:53:47'),
(138, 'Nescafe Twin', 'NESCAFE Original is the strong coffee mix that bring our delicious coffee taste and aroma that lasts from your first whiff until your last gulp.', 0.00, 420, 'Coffee and Creamer', 'https://i.ibb.co/QFj7Trn9/2dcce261df5a.png', '2025-07-03 10:01:46', '2025-07-03 10:01:59'),
(139, 'Kremtop', 'Krem-Top is a non-dairy coffee creamer known for its rich and creamy taste, designed to enhance the flavor of your coffee', 0.00, 280, 'Coffee and Creamer', 'https://i.ibb.co/7tfjcR80/f0dd134a2c03.png', '2025-07-03 10:35:16', '2025-07-03 10:36:40'),
(140, 'Coffeemate', 'Coffee-mate is a non-dairy coffee creamer, available in powdered, liquid, and concentrated liquid forms, that enhances the flavor and texture of coffee', 0.00, 250, 'Coffee and Creamer', 'https://i.ibb.co/ds1vyXTw/6ff408e99e4d.png', '2025-07-03 10:43:12', '2025-07-03 10:43:12'),
(141, 'Great Taste Granules', 'Great Taste Granules are a concentrated coffee product made from 100% granulated coffee beans, specifically Robusta beans.', 0.00, 400, 'Coffee and Creamer', 'https://i.ibb.co/dwkzGQ6y/1f2c32edd630.png', '2025-07-03 10:58:06', '2025-07-03 10:58:06'),
(142, 'Great Taste Premium', 'Great Taste Premium is a line of instant coffee products known for their rich taste and aroma, offering a satisfying coffee experience. ', 0.00, 300, 'Coffee and Creamer', 'https://i.ibb.co/HT7rBkmM/250bb357d0ef.png', '2025-07-03 11:00:18', '2025-07-03 11:00:43'),
(143, 'Magic Sarap', 'Magic Sarap is an all-in-one seasoning, popular in Filipino cuisine, known for its rich, savory, and umami flavor', 0.00, 400, 'Condiments', 'https://i.ibb.co/v4Bvk94x/aebe31d0852f.png', '2025-07-03 11:07:41', '2025-07-03 11:07:41'),
(144, 'Ajinomoto', 'Ajinomoto, also known as monosodium glutamate (MSG), is a flavor enhancer, commonly used in various cuisines, particularly in Asian dishes like Chinese cuisine.', 0.00, 500, 'Condiments', 'https://i.ibb.co/DHHsNNDc/ef7355ba13c2.png', '2025-07-03 11:12:37', '2025-07-03 11:12:37'),
(145, 'Ajiginisa', 'a Filipino seasoning mix, primarily used to enhance the flavor of stir-fried dishes and other savory meals', 57.00, 50, 'Condiments', 'https://i.ibb.co/MkBW7cff/788460e027c6.png', '2025-07-03 11:14:18', '2025-07-03 11:14:18'),
(146, 'Knorr Cubes', 'AI Overview\r\nKnorr Chicken Cubes Savers | 10g x 12 cubes\r\nKnorr cubes are concentrated flavor enhancers, specifically bouillon cubes, designed to add depth and richness to various dishes.', 0.00, 800, 'Condiments', 'https://i.ibb.co/DP8g5SwV/5c1d882d6cbe.png', '2025-07-03 11:18:39', '2025-07-03 11:18:39'),
(147, 'Knorr Sinigang', 'Knorr Sinigang is a Filipino soup known for its sour and savory flavor, with tamarind as the primary souring agent', 0.00, 105, 'Condiments', 'https://i.ibb.co/YFVBm4Cw/02cd78e6e8ea.png', '2025-07-03 11:31:35', '2025-07-03 11:31:35'),
(148, 'Color Rumble Lollipop', 'Lipps assorted, 50pcs per pack', 63.00, 20, 'Candies and Snacks', 'https://i.ibb.co/Y4sv7XSg/b11c1bfcb5ea.png', '2025-07-03 11:35:02', '2025-07-03 11:35:02'),
(149, 'Frooty Rainbow Pop', 'assorted lollipop', 33.00, 20, 'Candies and Snacks', 'https://i.ibb.co/fYs7CNx9/da50be0a43b1.png', '2025-07-03 11:36:13', '2025-07-03 11:36:13'),
(150, 'Stay Fresh Candy', 'menthol candies', 37.00, 20, 'Candies and Snacks', 'https://i.ibb.co/N6SfV7sv/6024d6b38bc1.png', '2025-07-03 11:37:44', '2025-07-03 11:37:44'),
(151, 'Snow Bear Candy', 'menthol candy', 95.00, 100, 'Candies and Snacks', 'https://i.ibb.co/fYTg2h2T/3b252006328f.png', '2025-07-03 11:38:49', '2025-07-03 11:38:49'),
(152, 'Krimstix Jumbo', 'a creamy, flavored paste, available in chocolate, milk, pandan, peanut butter, ube, cookies & cream, and cheesy crunch, among other flavors', 0.00, 100, 'Candies and Snacks', 'https://i.ibb.co/vvJBNFrm/591a3cb7bf9a.png', '2025-07-03 11:41:11', '2025-07-03 11:41:11'),
(153, 'Frutos', 'a Filipino brand of soft, chewy candy, known for its tropical fruit and tamarind (sampalok) flavors', 0.00, 86, 'Candies and Snacks', 'https://i.ibb.co/kVBkdL72/b06bc349ca4b.png', '2025-07-03 11:42:34', '2025-07-03 11:42:34'),
(154, 'Sweet Candies', 'a sweet confection made primarily from sugar or other sweeteners, often with added flavors, fruits, chocolate, or nuts. ', 0.00, 120, 'Candies and Snacks', 'https://i.ibb.co/XqP33f3/41ca766e4d2b.png', '2025-07-03 11:45:58', '2025-07-03 11:45:58'),
(155, 'Cloud 9', 'Cloud 9 candy, a popular Filipino snack, is a chocolate bar featuring a combination of luscious caramel, crunchy peanuts, and soft nougat, all wrapped in a rich chocolate coating.', 0.00, 70, 'Candies and Snacks', 'https://i.ibb.co/9m42v2cQ/b80156045f00.png', '2025-07-03 11:48:14', '2025-07-03 11:48:14'),
(156, 'Beng-beng ', '12 pcs per box Bengbeng is a popular Indonesian chocolate snack, described as a chocolate-covered wafer with multiple layers', 88.00, 50, 'Candies and Snacks', 'https://i.ibb.co/CspY4t1D/9f7cb706b1fd.png', '2025-07-03 11:49:51', '2025-07-03 11:49:51'),
(157, 'Choco Mucho', 'Choco Mucho is a bite-sized chocolate snack made by Rebisco featuring layers of rolled wafer, caramel, and rice crispies, all coated in creamy chocolate.', 0.00, 60, 'Candies and Snacks', 'https://i.ibb.co/ZR5Lx9Rt/9b5e6320333f.png', '2025-07-03 11:53:03', '2025-07-03 11:53:03'),
(158, 'Maxx', 'Maxx candy, introduced by Jack \'n Jill, is a menthol-flavored candy known for its refreshing and cooling sensation, often enjoyed for its potential to relieve sore throats or nasal congestion.', 0.00, 600, 'Candies and Snacks', 'https://i.ibb.co/HLfNFgbb/95c20568e4d3.png', '2025-07-03 11:58:42', '2025-07-03 11:58:42'),
(159, 'Wings Powder 6\'s', 'Wings powder, specifically referring to laundry detergent powder like Wings Solve, is designed for cleaning clothes and offers a few key benefits. ', 0.00, 400, 'Bar and Soap', 'https://i.ibb.co/DDHNs1sK/f580b3cc19f1.png', '2025-07-03 12:05:02', '2025-07-03 12:05:02'),
(160, 'Surf Powder 6\'s', 'Surf powder is a laundry detergent known for its cleaning power and fragrance.', 0.00, 800, 'Bar and Soap', 'https://i.ibb.co/rRvpNQ4Z/4319fe2af7ea.png', '2025-07-03 12:07:22', '2025-07-03 12:07:22'),
(161, 'Ariel Powder 6+1', 'Ariel is a brand of laundry detergent, and Ariel powder is a powdered form of their detergent designed for cleaning clothes.', 95.00, 50, 'Bar and Soap', 'https://i.ibb.co/Gftz7zQG/0d7648342246.png', '2025-07-03 12:08:30', '2025-07-03 12:08:30'),
(162, 'Tide Powder 6+1', 'Tide powder detergent is a laundry cleaning agent designed for both standard and high-efficiency washing machines, as well as handwashing', 95.00, 50, 'Bar and Soap', 'https://i.ibb.co/qMrGTn9b/b17af808fb31.png', '2025-07-03 12:09:21', '2025-07-03 12:09:21'),
(163, 'Breeze Powder 6+1', 'Breeze powder detergent is a laundry cleaning product known for its stain-removing capabilities.', 86.00, 30, 'Bar and Soap', 'https://i.ibb.co/ch6SHn0Y/df5f2b17a486.png', '2025-07-03 12:10:16', '2025-07-03 12:10:16'),
(164, 'Pride Powder', 'Pride Powder is a laundry detergent known for its \"stain-away\" formula that effectively removes dirt and stains, leaving clothes clean and fresh', 0.00, 30, 'Bar and Soap', 'https://i.ibb.co/jPpk0N8H/83494c4c564d.png', '2025-07-03 12:12:25', '2025-07-03 12:12:25'),
(165, 'Wings Powder 1kg', 'Wings powder detergent offers a deep clean, removing dirt and leaving clothes with a fresh, long-lasting scent', 105.00, 10, 'Bar and Soap', 'https://i.ibb.co/LDxKhgpM/d2d605567151.png', '2025-07-03 18:01:33', '2025-07-03 18:01:33'),
(166, 'Safeguard Bar Soap', '2 flavors, floral pink and lemon fresh', 0.00, 200, 'Bar and Soap', 'https://i.ibb.co/rRQ4QpKn/2c418ec426fd.png', '2025-07-03 18:05:07', '2025-07-03 18:05:07'),
(167, 'Silka Bar Soap 65g', 'Silka is a Filipino skincare brand known for its affordable and effective products, particularly those focused on skin whitening and moisturizing', 0.00, 180, 'Bar and Soap', 'https://i.ibb.co/DPBwyK4X/7555a0ca60fd.png', '2025-07-03 18:08:52', '2025-07-03 18:08:52'),
(168, 'Bioderm Sachet', 'Bioderm is a family germicidal soap that offers 99.9% germ-killing action and up to 24-hour protection against germs that can cause illness and body odor', 0.00, 60, 'Bar and Soap', 'https://i.ibb.co/3mrwNgBh/f11cfcf54309.png', '2025-07-03 18:11:54', '2025-07-03 18:11:54'),
(169, 'Top Coffee Tripid (10\'s)', '3 packs per sachet, a total of 30 packs', 139.00, 200, 'Coffee and Creamer', 'https://i.ibb.co/N6V8Ch58/062230b4f2a1.png', '2025-07-03 18:14:50', '2025-07-03 18:14:50'),
(170, 'O-Puff', 'O-Puff is a brand of cream-filled marshmallows produced by Oishi.', 0.00, 100, 'Candies and Snacks', 'https://i.ibb.co/wZvtjvYb/3af922cb5a22.png', '2025-07-03 18:19:49', '2025-07-03 18:19:49'),
(171, 'Polvoron (24\'s)', 'Polvoron is a Filipino-style shortbread made of toasted flour, powdered milk, sugar, and butter. Sweet, buttery, and easy to customize with different flavors.', 24.00, 50, 'Candies and Snacks', 'https://i.ibb.co/pjxsNdkn/8a208d83c9a7.png', '2025-07-03 18:22:04', '2025-07-03 18:22:04'),
(172, 'Superstix ', 'Superstix are crunchy wafer sticks produced by Rebisco, known for their creamy, flavorful fillings.', 0.00, 30, 'Candies and Snacks', 'https://i.ibb.co/wh17M6H0/55bdc4ede310.png', '2025-07-03 18:24:49', '2025-07-03 18:24:49'),
(178, 'TRYTRY PRODUCTS', 'ZXCXZCJFKAJH', 0.00, 96, 'Beverages', 'https://i.ibb.co/XMLp2cF/62b6f6a6d7a5.jpg', '2025-09-16 08:23:59', '2025-09-16 08:23:59');

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
(36, 97, '155g', 35.50, 100, NULL),
(37, 97, '425g', 81.00, 20, NULL),
(38, 99, 'Red', 26.00, 100, NULL),
(39, 99, 'Green', 26.00, 100, NULL),
(40, 100, '155g', 54.00, 50, NULL),
(41, 100, '425g', 118.00, 20, NULL),
(42, 101, '155', 42.00, 20, NULL),
(43, 101, '425', 110.00, 10, NULL),
(44, 102, 'Red', 26.50, 50, NULL),
(45, 102, 'Green', 26.50, 50, NULL),
(46, 103, '170g', 67.00, 24, NULL),
(47, 103, '397g', 131.00, 24, NULL),
(48, 104, '155g', 45.00, 50, NULL),
(49, 104, '425g', 100.00, 12, NULL),
(50, 105, '85g', 31.00, 100, NULL),
(51, 105, '230g', 66.00, 60, NULL),
(52, 107, 'Orange', 84.00, 50, NULL),
(53, 107, 'Grape', 84.00, 50, NULL),
(54, 107, 'Apple', 84.00, 100, NULL),
(55, 113, 'Coke Mismo', 203.00, 100, 'https://i.ibb.co/ksMvMh8H/eccf0110a173.png'),
(56, 113, 'Royal Mismo', 203.00, 50, 'https://i.ibb.co/MyFbvKfP/02fb6e4955f6.png'),
(57, 113, 'Sprite Mismo', 203.00, 50, 'https://i.ibb.co/B5hQp3zB/c63551d74bd7.png'),
(58, 114, '1.5 Coke', 722.00, 10, 'https://i.ibb.co/Y7W1c1pc/5ca33bf6a13a.png'),
(59, 114, '1.5 Royal', 722.00, 10, 'https://i.ibb.co/Zz4TfDHM/de4e35523721.png'),
(60, 114, '1.5 Sprite', 722.00, 10, 'https://i.ibb.co/wh1VqzsT/8fb0e340de7e.png'),
(61, 116, 'Cream', 58.00, 18, 'https://i.ibb.co/jZRLqpqn/eaa546f3ae49.png'),
(62, 116, 'Butter', 58.00, 18, 'https://i.ibb.co/S4mX2Mvc/042caf0a567d.png'),
(63, 116, 'Strawberry', 18.00, 18, 'https://i.ibb.co/8yHnyym/0b6268a1f20a.png'),
(64, 116, 'Chocolate', 58.00, 18, 'https://i.ibb.co/Gvm29r3N/954f9a2f6be6.png'),
(65, 116, 'Flavor Bunch Assorted', 58.00, 18, 'https://i.ibb.co/9k7PNJ5m/4a91171d5a1d.png'),
(66, 120, 'Hansel Choco', 58.00, 150, 'https://i.ibb.co/nN97krfx/bac16d385dc5.png'),
(67, 120, 'Hansel Mocha', 58.00, 150, 'https://i.ibb.co/JwMyJZk2/c84e1afc4c18.png'),
(68, 120, 'Hansel Milk', 58.00, 150, 'https://i.ibb.co/bMM1N0hJ/e97cce0da8f0.png'),
(69, 120, 'Hansel Butter', 58.00, 150, 'https://i.ibb.co/B5TpHvGS/2960fc9474a9.png'),
(70, 120, 'Hansel Flavor Bunch', 58.00, 150, 'https://i.ibb.co/Q3vg9YCW/e073221a0f74.png'),
(71, 122, 'White', 72.00, 25, 'https://i.ibb.co/qFpjX1V7/cfbb7c1d9246.png'),
(72, 122, 'Choco', 72.00, 25, 'https://i.ibb.co/67LSfJWD/6addd661a002.png'),
(73, 124, 'Milk', 58.00, 10, 'https://i.ibb.co/5X7t0yFM/8fb7551ce701.png'),
(74, 124, 'Choco', 58.00, 10, 'https://i.ibb.co/vyTkmP6/3ad414c49332.png'),
(75, 127, 'Choco', 78.00, 25, 'https://i.ibb.co/fbyDy02/9cc0f97653cc.png'),
(76, 127, 'Macapuno', 78.00, 25, 'https://i.ibb.co/Y75qVX93/3605d4abd7d2.png'),
(77, 127, 'Salted Caramel', 78.00, 25, 'https://i.ibb.co/fGBj52Gg/5ef06f784445.png'),
(78, 127, 'Vanilla', 78.00, 25, 'https://i.ibb.co/DPkvSbpv/4caa36155d8f.png'),
(79, 127, 'Dark Chocolate', 78.00, 25, 'https://i.ibb.co/pBVXKVtH/6f547241c025.png'),
(80, 127, 'Mocha', 78.00, 25, 'https://i.ibb.co/TD9sHc57/0c4b2440c6b1.png'),
(81, 127, 'Milk', 78.00, 25, 'https://i.ibb.co/xty6BCmM/3f789d502d97.png'),
(82, 127, 'Assorted', 78.00, 25, 'https://i.ibb.co/W4FMNyVL/6c0d792aad26.png'),
(83, 129, 'Choco', 77.00, 20, 'https://i.ibb.co/JFxPhLw5/3f865e3665f4.png'),
(84, 129, 'Assorted', 96.00, 10, 'https://i.ibb.co/Z6qVpQcN/f3db2131b5b5.png'),
(85, 131, '100g', 20.00, 50, NULL),
(86, 131, '150g', 25.00, 50, NULL),
(87, 132, 'Green', 26.00, 100, NULL),
(88, 132, 'Red', 26.00, 100, NULL),
(89, 133, 'Green', 25.00, 500, NULL),
(90, 133, 'Red', 25.00, 500, NULL),
(91, 74, '375ml', 32.00, 1221, 'https://i.ibb.co/N25PWXHW/e71758e8ad02.png'),
(92, 132, 'zxc', 32.00, 32, NULL),
(93, 75, 'hdftuh', 25.00, 42547, NULL),
(95, 72, '33g (sold per tie)', 93.00, 150, NULL),
(96, 72, '90g', 37.00, 50, NULL),
(97, 72, '135g', 54.00, 50, NULL),
(98, 72, '300g', 114.00, 100, NULL),
(99, 72, '680g', 255.00, 19, NULL),
(100, 72, '840g', 307.00, 20, NULL),
(101, 72, '1210g', 440.00, 10, NULL),
(102, 72, '1.5kg', 542.00, 10, NULL),
(103, 72, '2kg', 710.00, 10, NULL),
(104, 72, '2.4kg', 843.00, 9, NULL),
(105, 74, '33g (sold per tie)', 93.00, 10, NULL),
(106, 74, '300g', 114.00, 20, NULL),
(107, 74, '840g', 307.00, 5, NULL),
(108, 73, '33g (sold per tie)', 141.00, 5, NULL),
(109, 73, '180g', 98.00, 15, NULL),
(110, 73, '300g', 135.00, 20, NULL),
(111, 73, '600g', 270.00, 10, NULL),
(112, 73, '1kg', 495.00, 5, NULL),
(113, 73, '1.2kg', 545.00, 5, NULL),
(114, 75, '24g (1 dozen)', 112.00, 100, NULL),
(115, 75, '150g', 54.00, 15, NULL),
(116, 75, '300g', 100.00, 15, NULL),
(117, 75, '600g', 197.00, 10, NULL),
(118, 75, '1kg', 300.00, 5, NULL),
(119, 76, '33g (9+3 promo)', 84.00, 10, NULL),
(120, 76, '135g', 51.00, 24, NULL),
(121, 76, '300g', 98.00, 30, NULL),
(122, 76, '660g', 235.00, 15, NULL),
(123, 76, '925g', 305.00, 15, NULL),
(124, 76, '2kg', 619.00, 6, NULL),
(125, 135, 'Brown', 132.00, 200, NULL),
(126, 135, 'Black', 132.00, 200, NULL),
(127, 135, 'Blanca', 132.00, 200, NULL),
(128, 135, 'Cafe Mocha', 131.00, 200, NULL),
(129, 136, 'Choco', 128.00, 200, NULL),
(130, 136, 'White', 128.00, 200, NULL),
(131, 136, 'Original', 86.00, 199, NULL),
(132, 137, 'Stick (per pack)', 23.00, 100, NULL),
(133, 137, '23g', 46.00, 100, NULL),
(134, 137, '46g', 92.00, 100, NULL),
(135, 137, '92g', 92.00, 94, NULL),
(136, 112, '1L', 65.00, 100, NULL),
(137, 138, 'Original', 135.00, 200, NULL),
(138, 138, 'Creamy White', 135.00, 200, NULL),
(139, 138, 'CreamyLatte', 135.00, 20, NULL),
(140, 139, '80g', 25.00, 100, NULL),
(141, 139, '150g', 52.00, 100, NULL),
(142, 139, '220g', 64.00, 50, NULL),
(143, 139, '400g', 117.00, 30, NULL),
(144, 140, '80g', 28.00, 100, NULL),
(145, 140, '150g', 50.00, 50, NULL),
(146, 140, '220g', 74.00, 50, NULL),
(147, 140, '400g', 119.00, 50, NULL),
(148, 141, '25g', 22.00, 200, NULL),
(149, 141, '50g', 43.00, 100, NULL),
(150, 141, '100g', 83.00, 100, NULL),
(151, 142, '25g', 21.50, 100, NULL),
(152, 142, '50g', 40.00, 100, NULL),
(153, 142, '100g', 80.00, 100, NULL),
(154, 143, '3g (per tie)', 83.00, 300, NULL),
(155, 143, '55g', 31.00, 50, NULL),
(156, 143, '150g', 72.00, 50, NULL),
(157, 144, 'Blue Pack', 66.00, 100, NULL),
(158, 144, 'Yellow Pack', 53.00, 100, NULL),
(159, 144, '50g', 16.00, 100, NULL),
(160, 144, '100g', 41.00, 100, NULL),
(161, 144, '250g', 69.00, 50, NULL),
(162, 144, '500g', 115.00, 50, NULL),
(163, 146, 'Chicken', 6.50, 200, NULL),
(164, 146, 'Pork', 6.50, 200, NULL),
(165, 146, 'Beef', 6.50, 200, NULL),
(166, 146, 'Shrimp', 6.50, 200, NULL),
(167, 147, '11g (12+1)', 90.00, 50, NULL),
(168, 147, '22g (6\'s with plate)', 94.00, 50, NULL),
(169, 147, 'Sinigang sa Gabi (11g) per tie', 93.00, 5, NULL),
(170, 152, 'Choco', 44.00, 50, NULL),
(171, 152, 'Milk', 44.00, 50, NULL),
(172, 153, 'Tropical', 36.00, 50, NULL),
(173, 153, 'Tamarind', 36.00, 36, NULL),
(174, 154, 'Orange', 34.00, 40, NULL),
(175, 154, 'Corn', 34.00, 40, NULL),
(176, 154, 'Ponkan', 34.00, 40, NULL),
(177, 155, 'Minis', 87.00, 20, NULL),
(178, 155, '12 pcs per box', 98.00, 50, NULL),
(179, 157, 'Choco', 88.00, 20, NULL),
(180, 157, 'White', 88.00, 20, NULL),
(181, 157, 'Dark Choco', 88.00, 20, NULL),
(182, 158, 'Honey lemon', 42.00, 100, NULL),
(183, 158, 'Dalandan Orange', 42.00, 100, NULL),
(184, 158, 'Fresh', 42.00, 100, NULL),
(185, 158, 'Eucalyptus', 42.00, 100, NULL),
(186, 158, 'Extra Strength', 42.00, 100, NULL),
(187, 158, 'Cherry', 42.00, 100, NULL),
(188, 159, 'Calamansi Clean', 38.00, 100, NULL),
(189, 159, 'Floral Fresh', 38.00, 100, NULL),
(190, 159, 'Summer Sunshine', 38.00, 100, NULL),
(191, 159, 'Total Care', 38.00, 100, NULL),
(192, 160, 'Cherry Blossom', 42.00, 200, NULL),
(193, 160, 'Rose Fresh', 42.00, 200, NULL),
(194, 160, 'Tawas', 42.00, 200, NULL),
(195, 160, 'Sunfresh', 42.00, 200, NULL),
(196, 164, '500g', 64.00, 10, NULL),
(197, 164, '1kg', 125.00, 10, NULL),
(198, 164, '2kg', 235.00, 10, NULL),
(199, 166, 'Floral Pink', 129.00, 100, NULL),
(200, 166, 'Lemon Fresh', 129.00, 100, NULL),
(201, 167, 'Orange', 21.00, 120, NULL),
(202, 167, 'Green', 21.00, 60, NULL),
(203, 168, 'Blue', 17.00, 20, NULL),
(204, 168, 'Green', 17.00, 20, NULL),
(205, 168, 'Pink', 17.00, 20, NULL),
(206, 170, 'Choco', 28.00, 50, NULL),
(207, 170, 'Mango', 28.00, 50, NULL),
(208, 172, 'Ube', 71.00, 10, NULL),
(209, 172, 'Pandan', 71.00, 10, NULL),
(210, 172, 'Chocolate', 71.00, 10, NULL),
(211, 48, '100g', 27.50, 100, NULL),
(212, 48, '150g', 36.50, 100, NULL),
(213, 48, '175g', 41.50, 100, NULL),
(214, 48, '260g', 54.00, 12, NULL),
(215, 64, '95g', 27.50, 100, NULL),
(216, 64, 'hot 150g', 37.50, 100, NULL),
(217, 68, '100g', 19.00, 50, NULL),
(218, 68, '150g', 23.00, 50, NULL),
(219, 71, '150g', 25.00, 50, NULL),
(220, 71, '210g', 35.00, 50, NULL),
(221, 71, 'Big', 59.00, 50, NULL),
(222, 62, '100g', 16.00, 100, NULL),
(223, 62, '150g', 23.50, 200, NULL),
(224, 62, '170g', 25.00, 200, NULL),
(225, 62, 'Tocino', 26.50, 100, NULL),
(226, 69, 'Flat 85g', 32.00, 100, NULL),
(227, 69, '100g', 32.00, 100, NULL),
(228, 69, '155g', 40.00, 200, NULL),
(229, 38, '100g', 17.50, 200, NULL),
(230, 38, '150g', 22.75, 187, NULL),
(231, 38, '210g', 31.00, 100, NULL),
(232, 67, '100g', 20.50, 100, NULL),
(233, 67, '150g', 30.50, 100, NULL),
(234, 67, '175g', 34.00, 100, NULL),
(235, 65, 'Afrtitada', 29.75, 200, NULL),
(236, 65, 'Caldereta', 29.75, 200, NULL),
(237, 65, 'Hot and Spicy', 31.50, 50, NULL),
(238, 64, 'flakes 150g', 36.50, 100, NULL),
(239, 85, '100g', 20.00, 50, NULL),
(240, 85, '150g', 25.00, 50, NULL),
(241, 89, 'Green', 21.50, 50, NULL),
(242, 89, 'Red', 23.50, 50, NULL),
(243, 91, 'Green', 25.50, 100, NULL),
(244, 91, 'Red', 25.50, 100, NULL),
(245, 90, 'Green', 23.00, 50, NULL),
(246, 90, 'Red', 23.00, 50, NULL),
(247, 47, '100g', 11.75, 99, NULL),
(248, 47, '200g', 19.50, 50, NULL),
(249, 47, 'Buy 1 Take 1 (200g)', 29.00, 100, NULL),
(250, 47, '1L', 74.00, 50, NULL),
(251, 47, '1/2 gal.', 132.00, 50, NULL),
(252, 47, '1 gallon', 251.00, 50, NULL),
(253, 45, '150ml', 15.50, 100, NULL),
(254, 45, 'Buy 1 Take 1', 28.00, 50, NULL),
(255, 78, 'Buy 1 Take 1', 27.00, 20, NULL),
(256, 78, '1L', 69.00, 5, NULL),
(257, 34, '700ml', 141.00, 100, NULL),
(258, 34, '1L', 189.00, 82, NULL),
(259, 59, 'Light', 1008.00, 50, NULL),
(260, 59, 'Apple', 835.00, 50, NULL),
(264, 178, '500ml', 50.00, 42, 'https://i.ibb.co/TBS8wCMJ/ec280384bcd6.jpg'),
(265, 178, '1 Liter', 70.00, 21, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_reports`
--

CREATE TABLE `product_reports` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `issue_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','in_progress','resolved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_response` text,
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(1, 'JM Garis Store', 'Official Receipt', 'Barcenaga, Naujan City, Oriental Mindoro, Philippines', '09127649805', 'Thank you for your purchase!\nPlease come again!', '', '2025-06-13 22:06:01', '2025-09-16 05:56:25');

-- --------------------------------------------------------

--
-- Table structure for table `rewards_settings`
--

CREATE TABLE `rewards_settings` (
  `id` int NOT NULL,
  `points_per_amount` int NOT NULL DEFAULT '1',
  `amount_threshold` decimal(10,2) NOT NULL DEFAULT '100.00',
  `point_value` decimal(10,2) NOT NULL DEFAULT '0.50',
  `description` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `rewards_settings`
--

INSERT INTO `rewards_settings` (`id`, `points_per_amount`, `amount_threshold`, `point_value`, `description`, `updated_at`, `updated_by`) VALUES
(1, 1, 100.00, 0.50, '', '2025-09-16 08:34:29', 20);

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
(1, 'Bronze Rewardz', 10, 5.00, '₱5 off your next purchase'),
(2, 'Silver Reward', 20, 10.00, '₱10 off your next purchase'),
(3, 'Gold Reward', 50, 25.00, '₱25 off your next purchase');

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
  `profile_picture` varchar(255) DEFAULT NULL,
  `points` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `firstname`, `middlename`, `lastname`, `gender`, `civil_status`, `phone_number`, `address`, `birthdate`, `email`, `password`, `created_at`, `otp`, `otp_expires`, `email_verified`, `role`, `password_reset_otp`, `password_reset_otp_expires`, `profile_picture`, `points`) VALUES
(20, 'adminsiL4ns', '', NULL, '', 'male', 'single', NULL, NULL, NULL, 'admin@gmail.com', '$2a$10$3uohNbdXLU1Tg/JcOamDY.6P4OoZiNuHtzDlqbGJ/DTJ83gGTdji2', '2025-02-14 20:30:57', NULL, NULL, 1, 'admin', NULL, NULL, NULL, 0),
(1014, 'L4nszxc', 'Lans Lorence', 'Navarro', 'Hernandez', 'male', 'single', '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', '2004-07-09', 'lanslorence@gmail.com', '$2a$10$LqL9bOD8WT5e6N3imT6sBuXzplQHVei0k7jaCayx06isCEGWD9oEi', '2025-09-14 05:52:17', NULL, NULL, 1, 'user', 'DbzDDj', '2025-10-09 03:59:00', 'https://i.ibb.co/rfd1Zm1J/61c2de7d82fa.jpg', 0),
(1016, 'KIEN 43', 'L4ns Lor3nc3', 'Navarro', 'Hernandez', 'male', 'single', '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', '2004-07-09', 'hernandezlanslorence@gmail.com', '$2a$10$wBjhChblHNGSSe2o7rxNVeXxooR0vI6UjmeYFlnfUQsYTEEqvZ50u', '2025-09-16 05:45:31', NULL, NULL, 1, 'staff', NULL, NULL, NULL, 0),
(1017, 'adminzxc', 'Lansdsadsa', NULL, 'Losdadsarence', NULL, NULL, NULL, NULL, NULL, 'l4nsh3rn4nd3z@gmail.com', '$2a$10$6Zf2E3YQkpoU/evPQv5QzuscqWT4cYhvBm6FJgmXXmjT9uxPAf7sa', '2025-09-16 05:46:27', NULL, NULL, 1, 'admin', NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_loyalty_status`
--

CREATE TABLE `user_loyalty_status` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `loyalty_tier_id` int DEFAULT NULL,
  `current_month_spend` decimal(10,2) DEFAULT '0.00',
  `last_month_spend` decimal(10,2) DEFAULT '0.00',
  `two_months_ago_spend` decimal(10,2) DEFAULT '0.00',
  `tier_start_date` date DEFAULT NULL,
  `tier_end_date` date DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_loyalty_status`
--

INSERT INTO `user_loyalty_status` (`id`, `user_id`, `loyalty_tier_id`, `current_month_spend`, `last_month_spend`, `two_months_ago_spend`, `tier_start_date`, `tier_end_date`, `last_updated`) VALUES
(10, 1014, 1, 15836.00, 0.00, 0.00, '2025-09-16', '2025-12-16', '2025-10-08 18:38:39');

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
(584, 1014, '0619440', 3, 'Earned points from order #0619440 (₱301.00)', '2025-09-15 02:28:34'),
(585, 1014, '5587250', 1, 'Earned points from order #5587250 (₱234.00)', '2025-09-16 05:50:43'),
(586, 1014, '8329578', 3, 'Earned points from order #8329578 (₱649.00)', '2025-09-16 05:54:37'),
(587, 1014, '9248589', 39, 'Earned points from order #9248589 (₱3960.00)', '2025-10-07 08:44:08'),
(588, 1014, '9248589', 3, 'Bronzezxc loyalty bonus (+10.00%)', '2025-10-07 08:44:08'),
(589, 1014, NULL, -10, 'Redeemed for Bronze Rewardz - ₱5.00 discount', '2025-10-07 08:45:12'),
(590, 1014, '0440898', 2, 'Earned points from order #0440898 (₱229.00)', '2025-10-07 08:45:22'),
(591, 1014, 'PO00030', 3, 'Earned points from order #PO00030 (₱301.00)', '2025-10-07 15:42:29'),
(592, 1014, 'PO00033', 3, 'Earned points from order #PO00033 (₱301.00)', '2025-10-07 18:49:07'),
(593, 1014, 'PO00034', 3, 'Earned points from order #PO00034 (₱301.00)', '2025-10-07 18:53:20'),
(594, 1014, '2145910', 43, 'Earned points from order #2145910 (₱4362.00)', '2025-10-07 21:58:41'),
(595, 1014, '2145910', 4, 'Bronzezxc loyalty bonus (+10.00%)', '2025-10-07 21:58:41'),
(596, 1014, '1411356', 3, 'Earned points from order #1411356 (₱301.00)', '2025-10-07 21:59:00'),
(597, 1014, '1448515', 3, 'Earned points from order #1448515 (₱301.00)', '2025-10-07 22:07:59'),
(598, 1014, '1967882', 2, 'Earned points from order #1967882 (₱234.00)', '2025-10-08 18:05:57'),
(599, 1014, '8731696', 43, 'Earned points from order #8731696 (₱4362.00)', '2025-10-08 18:38:39'),
(600, 1014, '8731696', 4, 'Bronzezxc loyalty bonus (+10.00%)', '2025-10-08 18:38:39');

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
-- Indexes for table `loyalty_tiers`
--
ALTER TABLE `loyalty_tiers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `is_read` (`is_read`),
  ADD KEY `is_deleted` (`is_deleted`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `accepted_by` (`accepted_by`);

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
-- Indexes for table `payment_intents`
--
ALTER TABLE `payment_intents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `idx_reference_number` (`reference_number`),
  ADD KEY `idx_gcash_reference` (`gcash_reference`),
  ADD KEY `idx_verified_at` (`verified_at`);

--
-- Indexes for table `payment_settings`
--
ALTER TABLE `payment_settings`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `product_reports`
--
ALTER TABLE `product_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `receipt_settings`
--
ALTER TABLE `receipt_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rewards_settings`
--
ALTER TABLE `rewards_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `updated_by` (`updated_by`);

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
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_points` (`points`);

--
-- Indexes for table `user_loyalty_status`
--
ALTER TABLE `user_loyalty_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `loyalty_tier_id` (`loyalty_tier_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2491926;

--
-- AUTO_INCREMENT for table `loyalty_tiers`
--
ALTER TABLE `loyalty_tiers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=428;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4325;

--
-- AUTO_INCREMENT for table `order_reports`
--
ALTER TABLE `order_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_reviews`
--
ALTER TABLE `order_reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `payment_intents`
--
ALTER TABLE `payment_intents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `payment_settings`
--
ALTER TABLE `payment_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `products_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=179;

--
-- AUTO_INCREMENT for table `product_choices`
--
ALTER TABLE `product_choices`
  MODIFY `choice_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=266;

--
-- AUTO_INCREMENT for table `product_reports`
--
ALTER TABLE `product_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `receipt_settings`
--
ALTER TABLE `receipt_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `rewards_settings`
--
ALTER TABLE `rewards_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reward_tiers`
--
ALTER TABLE `reward_tiers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1018;

--
-- AUTO_INCREMENT for table `user_loyalty_status`
--
ALTER TABLE `user_loyalty_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_rewards`
--
ALTER TABLE `user_rewards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=601;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`products_id`),
  ADD CONSTRAINT `cart_ibfk_3` FOREIGN KEY (`choice_id`) REFERENCES `product_choices` (`choice_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_intents`
--
ALTER TABLE `payment_intents`
  ADD CONSTRAINT `payment_intents_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
