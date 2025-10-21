-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 21, 2025 at 08:43 AM
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
(1, 'Bronze', 10000.00, 15000.00, 5.00, 0, '2025-06-30 13:50:00'),
(2, 'Silver', 16000.00, 20000.00, 10.00, 0, '2025-06-30 13:50:00'),
(3, 'Gold', 21000.00, NULL, 15.00, 1, '2025-06-30 13:50:00');

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


-- Data for table: notifications
INSERT INTO `notifications` (`id`, `custom_id`, `user_id`, `title`, `message`, `type`, `icon`, `is_read`, `is_deleted`, `created_at`, `updated_at`, `related_order_id`, `action_url`) VALUES
(62, 'order-2132942-pending', 1014, 'Order Update', 'Order #2132942 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-09-16 01:01:10', '2025-10-07 13:43:47', '2132942', '/order-details/2132942'),
(63, 'order-8936241-pending', 1014, 'Order Update', 'Order #8936241 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-09-16 01:02:10', '2025-10-07 13:43:47', '8936241', '/order-details/8936241'),
(65, 'order-8936241-paid', 1014, 'Order Update', 'Order #8936241 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 1, 0, '2025-09-16 01:03:00', '2025-10-07 13:43:47', '8936241', '/order-details/8936241'),
(66, 'order-2132942-ready for pickup', 1014, 'Order Update', 'Order #2132942 is ready for pickup!', 'order', 'fas fa-check-circle', 1, 0, '2025-09-16 01:07:34', '2025-10-07 13:43:47', '2132942', '/order-details/2132942'),
(68, 'order-2132942-paid', 1014, 'Order Update', 'Order #2132942 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 1, 0, '2025-09-16 01:09:33', '2025-10-07 13:43:47', '2132942', '/order-details/2132942'),
(72, 'order-PO00118-paid', 1017, 'Order Update', 'Order #PO00118 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-09-30 23:00:28', '2025-09-30 23:00:28', 'PO00118', '/order-details/PO00118'),
(73, 'order-PO00117-paid', 1017, 'Order Update', 'Order #PO00117 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-09-30 23:00:29', '2025-09-30 23:00:29', 'PO00117', '/order-details/PO00117'),
(74, 'order-1802116-pending', 1014, 'Order Update', 'Order #1802116 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-10-07 12:51:36', '2025-10-07 13:43:47', '1802116', '/order-details/1802116'),
(75, 'order-1802116-preparing', 1014, 'Order Update', 'Order #1802116 is now being prepared.', 'order', 'fas fa-utensils', 1, 0, '2025-10-07 12:53:22', '2025-10-07 13:43:47', '1802116', '/order-details/1802116'),
(76, 'order-1802116-paid', 1014, 'Order Update', 'Order #1802116 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 1, 0, '2025-10-07 12:54:23', '2025-10-07 13:43:47', '1802116', '/order-details/1802116'),
(79, 'order-1024487-pending', 1014, 'Order Update', 'Order #1024487 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-10-07 13:25:07', '2025-10-07 13:43:47', '1024487', '/order-details/1024487'),
(80, 'order-0953422-pending', 1014, 'Order Update', 'Order #0953422 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-10-07 13:25:33', '2025-10-07 13:43:47', '0953422', '/order-details/0953422'),
(81, 'order-9738002-pending', 1014, 'Order Update', 'Order #9738002 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 14:00:22', '2025-10-07 14:00:22', '9738002', '/order-details/9738002'),
(82, 'order-0769762-pending', 1014, 'Order Update', 'Order #0769762 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 14:02:02', '2025-10-07 14:02:02', '0769762', '/order-details/0769762'),
(83, 'order-6922553-pending', 1014, 'Order Update', 'Order #6922553 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 14:03:25', '2025-10-07 14:03:25', '6922553', '/order-details/6922553'),
(84, 'order-5075608-pending', 1014, 'Order Update', 'Order #5075608 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-07 14:09:00', '2025-10-07 14:09:00', '5075608', '/order-details/5075608'),
(85, 'order-5075608-ready for pickup', 1014, 'Order Update', 'Order #5075608 is ready for pickup!', 'order', 'fas fa-check-circle', 0, 0, '2025-10-07 14:32:35', '2025-10-07 14:32:35', '5075608', '/order-details/5075608'),
(104, 'order-5075608-paid', 1014, 'Order Update', 'Order #5075608 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 08:31:34', '2025-10-08 08:31:34', '5075608', '/order-details/5075608'),
(107, 'order-6922553-paid', 1014, 'Order Update', 'Order #6922553 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 08:33:38', '2025-10-08 08:33:38', '6922553', '/order-details/6922553'),
(112, 'order-2368681-pending', 1014, 'Order Update', 'Order #2368681 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-08 08:37:46', '2025-10-08 08:37:46', '2368681', '/order-details/2368681'),
(113, 'order-5167329-pending', 1014, 'Order Update', 'Order #5167329 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-08 08:37:47', '2025-10-08 08:37:47', '5167329', '/order-details/5167329'),
(114, 'order-2368681-paid', 1014, 'Order Update', 'Order #2368681 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 08:58:38', '2025-10-08 08:58:38', '2368681', '/order-details/2368681'),
(116, 'order-5167329-ready for pickup', 1014, 'Order Update', 'Order #5167329 is ready for pickup!', 'order', 'fas fa-check-circle', 0, 0, '2025-10-08 08:59:38', '2025-10-08 08:59:38', '5167329', '/order-details/5167329'),
(126, 'order-5167329-paid', 1014, 'Order Update', 'Order #5167329 has been paid and completed.', 'order', 'fas fa-money-bill-wave', 0, 0, '2025-10-08 09:04:38', '2025-10-08 09:04:38', '5167329', '/order-details/5167329'),
(201, 'order-1346486-pending', 1014, 'Order Update', 'Order #1346486 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-08 09:59:38', '2025-10-08 09:59:38', '1346486', '/order-details/1346486'),
(209, 'order-9515823-pending', 1014, 'Order Update', 'Order #9515823 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-08 10:14:09', '2025-10-08 10:14:09', '9515823', '/order-details/9515823'),
(216, 'order-9771613-pending', 1014, 'Order Update', 'Order #9771613 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-08 10:22:21', '2025-10-08 10:22:21', '9771613', '/order-details/9771613'),
(217, 'order-2701428-pending', 1021, 'Order Update', 'Order #2701428 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 1, 0, '2025-10-09 15:18:33', '2025-10-09 15:19:04', '2701428', '/order-details/2701428'),
(218, 'order-1205939-pending', 1021, 'Order Update', 'Order #1205939 has been placed and is pending.', 'order', 'fas fa-hourglass-half', 0, 0, '2025-10-09 15:19:30', '2025-10-09 15:19:30', '1205939', '/order-details/1205939');

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

-- Data for table: orders
INSERT INTO `orders` (`order_id`, `user_id`, `total_amount`, `status`, `payment_status`, `created_at`, `updated_at`, `cancel_reason`, `accepted_by`, `accepted_at`, `cash_amount`, `change_amount`, `customer_name`, `is_physical_order`, `packaging_preference`, `payment_intent_id`, `payment_method`) VALUES
('0769762', 1014, '58.00', 'pending', 'pending', '2025-10-07 14:01:51', '2025-10-07 14:01:51', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('0953422', 1014, '649.00', 'pending', 'pending', '2025-10-07 13:25:03', '2025-10-07 13:25:03', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('1024487', 1014, '649.00', 'pending', 'pending', '2025-10-07 13:24:57', '2025-10-07 13:24:57', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('1205939', 1021, '132.00', 'pending', 'pending', '2025-10-09 15:19:18', '2025-10-09 15:19:18', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('1346486', 1014, '301.00', 'pending', 'pending', '2025-10-08 09:59:23', '2025-10-08 09:59:23', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('2701428', 1021, '66.00', 'pending', 'pending', '2025-10-09 15:18:22', '2025-10-09 15:18:22', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'plastic', NULL, 'cash'),
('9515823', 1014, '301.00', 'pending', 'pending', '2025-10-08 10:13:56', '2025-10-08 10:13:56', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('9738002', 1014, '649.00', 'pending', 'pending', '2025-10-07 14:00:12', '2025-10-07 14:00:12', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('9771613', 1014, '301.00', 'pending', 'pending', '2025-10-08 10:22:09', '2025-10-08 10:22:09', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'eco', NULL, 'cash'),
('PO00002', 1018, '1031.75', 'paid', 'pending', '2025-09-16 23:47:22', '2025-09-17 00:09:33', NULL, 1018, '2025-09-16 23:47:22', '1100.00', '68.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00003', 1018, '1536.00', 'paid', 'pending', '2025-09-16 23:55:12', '2025-09-17 00:08:55', NULL, 1018, '2025-09-16 23:55:12', '2000.00', '464.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00004', 1018, '820.50', 'paid', 'pending', '2025-09-17 00:04:22', '2025-09-17 00:07:52', NULL, 1018, '2025-09-17 00:04:22', '1000.00', '179.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00005', 1018, '1632.00', 'paid', 'pending', '2025-09-17 00:10:47', '2025-09-17 00:18:25', NULL, 1018, '2025-09-17 00:10:47', '2000.00', '368.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00006', 1018, '1632.00', 'paid', 'pending', '2025-09-17 00:10:58', '2025-09-17 00:17:22', NULL, 1018, '2025-09-17 00:10:58', '2000.00', '368.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00007', 1018, '2321.75', 'paid', 'pending', '2025-09-17 00:14:50', '2025-09-17 00:17:58', NULL, 1018, '2025-09-17 00:14:50', '2500.00', '178.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00008', 1018, '1602.00', 'paid', 'pending', '2025-09-17 00:20:01', '2025-09-17 00:31:06', NULL, 1018, '2025-09-17 00:20:01', '1700.00', '98.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00009', 1018, '1113.25', 'paid', 'pending', '2025-09-17 17:15:23', '2025-09-17 18:11:32', NULL, 1018, '2025-09-17 17:15:23', '1200.00', '86.75', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00010', 1018, '2280.00', 'paid', 'pending', '2025-09-17 17:19:36', '2025-09-17 18:11:53', NULL, 1018, '2025-09-17 17:19:36', '2500.00', '220.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00011', 1018, '785.50', 'paid', 'pending', '2025-09-17 17:24:56', '2025-09-17 18:12:47', NULL, 1018, '2025-09-17 17:24:56', '800.00', '14.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00012', 1018, '1009.00', 'paid', 'pending', '2025-09-17 17:32:35', '2025-09-17 18:13:15', NULL, 1018, '2025-09-17 17:32:35', '1010.00', '1.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00013', 1018, '1009.00', 'paid', 'pending', '2025-09-17 17:32:42', '2025-09-17 18:14:40', NULL, 1018, '2025-09-17 17:32:42', '1100.00', '91.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00014', 1018, '2146.00', 'paid', 'pending', '2025-09-17 17:36:59', '2025-09-17 18:14:10', NULL, 1018, '2025-09-17 17:36:59', '2500.00', '354.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00015', 1018, '2146.00', 'paid', 'pending', '2025-09-17 17:37:05', '2025-09-17 18:13:44', NULL, 1018, '2025-09-17 17:37:05', '3000.00', '854.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00016', 1018, '1248.25', 'paid', 'pending', '2025-09-17 17:41:59', '2025-09-17 18:11:11', NULL, 1018, '2025-09-17 17:41:59', '1500.00', '251.75', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00017', 1018, '1248.25', 'paid', 'pending', '2025-09-17 17:42:07', '2025-09-17 18:10:44', NULL, 1018, '2025-09-17 17:42:07', '1500.00', '251.75', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00018', 1018, '1784.75', 'paid', 'pending', '2025-09-17 18:05:12', '2025-09-17 18:10:13', NULL, 1018, '2025-09-17 18:05:12', '2000.00', '215.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00019', 1018, '2584.50', 'paid', 'pending', '2025-09-17 18:11:36', '2025-09-17 18:12:22', NULL, 1018, '2025-09-17 18:11:36', '3000.00', '415.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00020', 1018, '1348.50', 'paid', 'pending', '2025-09-17 18:15:55', '2025-09-18 04:45:25', NULL, 1018, '2025-09-17 18:15:55', '1500.00', '151.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00021', 1018, '1348.50', 'paid', 'pending', '2025-09-17 18:16:04', '2025-09-18 04:46:24', NULL, 1018, '2025-09-17 18:16:04', '1400.00', '51.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00022', 1018, '1240.50', 'paid', 'pending', '2025-09-17 18:24:38', '2025-09-18 04:48:14', NULL, 1018, '2025-09-17 18:24:38', '1500.00', '259.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00023', 1018, '1240.50', 'paid', 'pending', '2025-09-17 18:24:45', '2025-09-18 04:51:46', NULL, 1018, '2025-09-17 18:24:45', '1500.00', '259.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00024', 1018, '1182.50', 'paid', 'pending', '2025-09-17 18:30:23', '2025-09-18 04:51:18', NULL, 1018, '2025-09-17 18:30:23', '1200.00', '17.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00025', 1018, '1182.50', 'paid', 'pending', '2025-09-17 18:30:30', '2025-09-18 04:50:52', NULL, 1018, '2025-09-17 18:30:30', '1200.00', '17.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00026', 1018, '702.50', 'paid', 'pending', '2025-09-17 20:30:35', '2025-09-18 04:50:26', NULL, 1018, '2025-09-17 20:30:35', '750.00', '47.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00027', 1018, '1909.50', 'paid', 'pending', '2025-09-17 20:40:21', '2025-09-18 04:49:43', NULL, 1018, '2025-09-17 20:40:21', '2000.00', '90.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00028', 1018, '626.50', 'paid', 'pending', '2025-09-17 20:48:55', '2025-09-18 04:48:41', NULL, 1018, '2025-09-17 20:48:55', '700.00', '73.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00029', 1018, '596.00', 'paid', 'pending', '2025-09-17 20:51:20', '2025-09-18 04:47:49', NULL, 1018, '2025-09-17 20:51:20', '600.00', '4.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00030', 1018, '1238.50', 'paid', 'pending', '2025-09-17 20:57:56', '2025-09-18 04:47:19', NULL, 1018, '2025-09-17 20:57:56', '1300.00', '61.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00031', 1018, '634.00', 'paid', 'pending', '2025-09-17 21:10:32', '2025-09-18 04:46:53', NULL, 1018, '2025-09-17 21:10:32', '1000.00', '366.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00032', 1018, '1318.25', 'paid', 'pending', '2025-09-17 21:16:30', '2025-09-18 04:45:55', NULL, 1018, '2025-09-17 21:16:30', '1500.00', '181.75', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00033', 1018, '388.00', 'paid', 'pending', '2025-09-17 21:22:09', '2025-09-18 04:44:51', NULL, 1018, '2025-09-17 21:22:09', '400.00', '12.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00034', 1018, '699.00', 'paid', 'pending', '2025-09-18 18:19:53', '2025-09-18 19:46:48', NULL, 1018, '2025-09-18 18:19:53', '1000.00', '301.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00035', 1018, '551.00', 'paid', 'pending', '2025-09-18 19:45:12', '2025-09-18 19:46:09', NULL, 1018, '2025-09-18 19:45:12', '600.00', '49.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00036', 1018, '1339.50', 'paid', 'pending', '2025-09-18 19:51:54', '2025-09-19 00:50:30', NULL, 1018, '2025-09-18 19:51:54', '1500.00', '160.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00037', 1018, '813.50', 'paid', 'pending', '2025-09-18 20:03:20', '2025-09-19 00:56:02', NULL, 1018, '2025-09-18 20:03:20', '1000.00', '186.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00038', 1018, '1115.50', 'paid', 'pending', '2025-09-18 20:06:21', '2025-09-19 00:55:13', NULL, 1018, '2025-09-18 20:06:21', '1500.00', '384.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00039', 1018, '902.00', 'paid', 'pending', '2025-09-18 20:09:17', '2025-09-19 00:53:56', NULL, 1018, '2025-09-18 20:09:17', '1000.00', '98.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00040', 1018, '1536.00', 'paid', 'pending', '2025-09-18 20:13:02', '2025-09-19 00:51:35', NULL, 1018, '2025-09-18 20:13:02', '1600.00', '64.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00041', 1018, '2201.00', 'paid', 'pending', '2025-09-18 20:15:06', '2025-09-19 00:51:14', NULL, 1018, '2025-09-18 20:15:06', '2300.00', '99.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00042', 1018, '1170.00', 'paid', 'pending', '2025-09-19 00:47:55', '2025-09-19 00:50:10', NULL, 1018, '2025-09-19 00:47:55', '1200.00', '30.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00043', 1018, '1701.00', 'paid', 'pending', '2025-09-19 00:50:14', '2025-09-19 00:50:52', NULL, 1018, '2025-09-19 00:50:14', '2000.00', '299.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00044', 1018, '494.00', 'paid', 'pending', '2025-09-19 00:53:30', '2025-09-19 00:54:20', NULL, 1018, '2025-09-19 00:53:30', '500.00', '6.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00045', 1018, '938.00', 'paid', 'pending', '2025-09-19 00:59:44', '2025-09-20 15:35:47', NULL, 1018, '2025-09-19 00:59:44', '1000.00', '62.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00046', 1018, '1961.00', 'paid', 'pending', '2025-09-19 01:01:37', '2025-09-20 15:42:24', NULL, 1018, '2025-09-19 01:01:37', '2000.00', '39.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00047', 1018, '742.00', 'paid', 'pending', '2025-09-19 01:03:19', '2025-09-20 15:42:47', NULL, 1018, '2025-09-19 01:03:19', '1000.00', '258.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00048', 1018, '966.50', 'paid', 'pending', '2025-09-19 01:05:12', '2025-09-20 15:47:18', NULL, 1018, '2025-09-19 01:05:12', '1000.00', '33.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00049', 1018, '910.00', 'paid', 'pending', '2025-09-19 01:08:42', '2025-09-20 15:46:54', NULL, 1018, '2025-09-19 01:08:42', '1000.00', '90.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00050', 1018, '2178.00', 'paid', 'pending', '2025-09-19 01:28:59', '2025-09-20 15:46:36', NULL, 1018, '2025-09-19 01:28:59', '3000.00', '822.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00051', 1018, '2009.00', 'paid', 'pending', '2025-09-20 00:50:53', '2025-09-20 15:46:16', NULL, 1018, '2025-09-20 00:50:53', '2050.00', '41.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00052', 1018, '533.00', 'paid', 'pending', '2025-09-20 00:52:28', '2025-09-20 15:45:44', NULL, 1018, '2025-09-20 00:52:28', '600.00', '67.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00053', 1018, '932.00', 'paid', 'pending', '2025-09-20 00:56:04', '2025-09-20 15:45:15', NULL, 1018, '2025-09-20 00:56:04', '1000.00', '68.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00054', 1018, '2523.00', 'paid', 'pending', '2025-09-20 00:58:14', '2025-09-20 15:44:55', NULL, 1018, '2025-09-20 00:58:14', '3000.00', '477.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00055', 1018, '1026.00', 'paid', 'pending', '2025-09-20 00:59:54', '2025-09-20 15:43:12', NULL, 1018, '2025-09-20 00:59:54', '2000.00', '974.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00056', 1018, '857.00', 'paid', 'pending', '2025-09-20 01:01:05', '2025-09-20 15:41:57', NULL, 1018, '2025-09-20 01:01:05', '1000.00', '143.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00057', 1018, '1434.75', 'paid', 'pending', '2025-09-20 01:03:40', '2025-09-20 15:41:34', NULL, 1018, '2025-09-20 01:03:40', '1500.00', '65.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00058', 1018, '879.00', 'paid', 'pending', '2025-09-20 01:05:13', '2025-09-20 15:41:07', NULL, 1018, '2025-09-20 01:05:13', '1000.00', '121.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00059', 1018, '1001.75', 'paid', 'pending', '2025-09-20 01:06:59', '2025-09-20 15:40:28', NULL, 1018, '2025-09-20 01:06:59', '1010.00', '8.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00060', 1018, '2625.25', 'paid', 'pending', '2025-09-20 01:09:01', '2025-09-20 15:39:25', NULL, 1018, '2025-09-20 01:09:01', '3000.00', '374.75', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00061', 1018, '519.00', 'paid', 'pending', '2025-09-20 01:10:24', '2025-09-20 15:38:36', NULL, 1018, '2025-09-20 01:10:24', '600.00', '81.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00062', 1018, '2136.00', 'paid', 'pending', '2025-09-20 01:12:43', '2025-09-20 15:36:49', NULL, 1018, '2025-09-20 01:12:43', '3000.00', '864.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00063', 1018, '768.00', 'paid', 'pending', '2025-09-20 01:13:51', '2025-09-20 15:36:15', NULL, 1018, '2025-09-20 01:13:51', '1000.00', '232.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00064', 1018, '718.00', 'paid', 'pending', '2025-09-20 19:00:28', '2025-09-20 19:55:44', NULL, 1018, '2025-09-20 19:00:28', '1000.00', '282.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00065', 1018, '1149.50', 'paid', 'pending', '2025-09-20 19:06:28', '2025-09-20 19:56:04', NULL, 1018, '2025-09-20 19:06:28', '1200.00', '50.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00066', 1018, '2634.00', 'paid', 'pending', '2025-09-20 19:09:07', '2025-09-20 19:56:22', NULL, 1018, '2025-09-20 19:09:07', '3000.00', '366.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00067', 1018, '921.00', 'paid', 'pending', '2025-09-20 19:13:12', '2025-09-20 19:56:43', NULL, 1018, '2025-09-20 19:13:12', '1000.00', '79.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00068', 1018, '1214.00', 'paid', 'pending', '2025-09-20 19:19:54', '2025-09-20 19:57:01', NULL, 1018, '2025-09-20 19:19:54', '1300.00', '86.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00069', 1018, '953.00', 'paid', 'pending', '2025-09-20 19:38:01', '2025-09-20 19:57:19', NULL, 1018, '2025-09-20 19:38:01', '1000.00', '47.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00070', 1018, '899.75', 'paid', 'pending', '2025-09-20 19:39:59', '2025-09-20 19:57:44', NULL, 1018, '2025-09-20 19:39:59', '900.00', '0.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00071', 1018, '1317.00', 'paid', 'pending', '2025-09-20 19:41:32', '2025-09-20 19:58:03', NULL, 1018, '2025-09-20 19:41:32', '1400.00', '83.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00072', 1018, '716.00', 'paid', 'pending', '2025-09-20 19:42:47', '2025-09-20 19:58:24', NULL, 1018, '2025-09-20 19:42:47', '1000.00', '284.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00073', 1018, '1979.00', 'paid', 'pending', '2025-09-20 19:43:55', '2025-09-20 19:58:43', NULL, 1018, '2025-09-20 19:43:55', '2000.00', '21.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00074', 1018, '871.50', 'paid', 'pending', '2025-09-20 19:49:18', '2025-09-20 19:59:02', NULL, 1018, '2025-09-20 19:49:18', '1000.00', '128.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00075', 1018, '888.00', 'paid', 'pending', '2025-09-20 19:52:23', '2025-09-20 19:59:23', NULL, 1018, '2025-09-20 19:52:23', '900.00', '12.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00076', 1018, '561.00', 'paid', 'pending', '2025-09-21 15:16:01', '2025-09-22 02:56:29', NULL, 1018, '2025-09-21 15:16:01', '600.00', '39.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00077', 1018, '1174.00', 'paid', 'pending', '2025-09-21 15:18:09', '2025-09-22 05:39:13', NULL, 1018, '2025-09-21 15:18:09', '1200.00', '26.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00078', 1018, '906.75', 'paid', 'pending', '2025-09-21 15:20:28', '2025-09-22 05:39:36', NULL, 1018, '2025-09-21 15:20:28', '1000.00', '93.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00079', 1018, '491.00', 'paid', 'pending', '2025-09-21 15:21:55', '2025-09-22 05:39:55', NULL, 1018, '2025-09-21 15:21:55', '500.00', '9.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00080', 1018, '956.00', 'paid', 'pending', '2025-09-21 15:24:00', '2025-09-22 05:40:20', NULL, 1018, '2025-09-21 15:24:00', '1000.00', '44.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00081', 1018, '1771.00', 'paid', 'pending', '2025-09-21 15:26:34', '2025-09-22 05:40:41', NULL, 1018, '2025-09-21 15:26:34', '2000.00', '229.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00082', 1018, '370.00', 'paid', 'pending', '2025-09-21 15:27:50', '2025-09-22 05:41:03', NULL, 1018, '2025-09-21 15:27:50', '400.00', '30.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00083', 1018, '555.00', 'paid', 'pending', '2025-09-21 15:29:24', '2025-09-22 05:41:25', NULL, 1018, '2025-09-21 15:29:24', '600.00', '45.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00084', 1018, '2452.00', 'paid', 'pending', '2025-09-21 15:31:41', '2025-09-22 05:41:52', NULL, 1018, '2025-09-21 15:31:41', '2500.00', '48.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00085', 1018, '781.75', 'paid', 'pending', '2025-09-21 15:33:25', '2025-09-22 05:42:31', NULL, 1018, '2025-09-21 15:33:25', '1000.00', '218.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00086', 1018, '706.50', 'paid', 'pending', '2025-09-21 15:35:59', '2025-09-22 05:42:55', NULL, 1018, '2025-09-21 15:35:59', '800.00', '93.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00087', 1018, '2179.50', 'paid', 'pending', '2025-09-21 15:39:47', '2025-09-22 05:43:20', NULL, 1018, '2025-09-21 15:39:47', '3000.00', '820.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00088', 1018, '314.00', 'paid', 'pending', '2025-09-21 15:43:32', '2025-09-22 05:43:46', NULL, 1018, '2025-09-21 15:43:32', '500.00', '186.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00089', 1018, '513.50', 'paid', 'pending', '2025-09-21 21:54:51', '2025-09-22 05:44:10', NULL, 1018, '2025-09-21 21:54:51', '600.00', '86.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00090', 1018, '439.00', 'paid', 'pending', '2025-09-22 14:48:42', '2025-09-22 19:54:02', NULL, 1018, '2025-09-22 14:48:42', '500.00', '61.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00091', 1018, '768.00', 'paid', 'pending', '2025-09-22 14:54:47', '2025-09-22 19:54:33', NULL, 1018, '2025-09-22 14:54:47', '1000.00', '232.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00092', 1018, '929.50', 'paid', 'pending', '2025-09-22 15:03:38', '2025-09-22 19:54:56', NULL, 1018, '2025-09-22 15:03:38', '1000.00', '70.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00093', 1018, '597.00', 'paid', 'pending', '2025-09-22 15:06:12', '2025-09-22 19:55:29', NULL, 1018, '2025-09-22 15:06:12', '597.00', '0.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00094', 1018, '2360.75', 'paid', 'pending', '2025-09-22 23:27:28', '2025-09-23 23:26:55', NULL, 1018, '2025-09-22 23:27:28', '2500.00', '139.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00095', 1018, '554.00', 'paid', 'pending', '2025-09-22 23:33:29', '2025-09-23 23:35:16', NULL, 1018, '2025-09-22 23:33:29', '554.00', '0.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00096', 1018, '745.75', 'paid', 'pending', '2025-09-22 23:38:05', '2025-09-23 23:40:11', NULL, 1018, '2025-09-22 23:38:05', '1000.00', '254.25', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00097', 1018, '1327.00', 'paid', 'pending', '2025-09-22 23:40:46', '2025-09-23 23:45:09', NULL, 1018, '2025-09-22 23:40:46', '1500.00', '173.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00098', 1018, '774.00', 'paid', 'pending', '2025-09-22 23:42:29', '2025-09-23 23:48:49', NULL, 1018, '2025-09-22 23:42:29', '1000.00', '226.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00099', 1018, '3052.00', 'paid', 'pending', '2025-09-22 23:43:23', '2025-09-23 23:49:26', NULL, 1018, '2025-09-22 23:43:23', '3100.00', '48.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00100', 1018, '1004.00', 'paid', 'pending', '2025-09-22 23:45:19', '2025-09-23 23:51:14', NULL, 1018, '2025-09-22 23:45:19', '1010.00', '6.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00101', 1018, '453.00', 'paid', 'pending', '2025-09-22 23:46:10', '2025-09-23 23:52:17', NULL, 1018, '2025-09-22 23:46:10', '500.00', '47.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00102', 1018, '897.00', 'paid', 'pending', '2025-09-22 23:48:24', '2025-09-23 23:53:14', NULL, 1018, '2025-09-22 23:48:24', '1000.00', '103.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00103', 1018, '565.50', 'paid', 'pending', '2025-09-22 23:49:58', '2025-09-23 23:54:02', NULL, 1018, '2025-09-22 23:49:58', '566.00', '0.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00104', 1018, '1387.00', 'paid', 'pending', '2025-09-22 23:51:34', '2025-09-23 23:54:55', NULL, 1018, '2025-09-22 23:51:34', '1400.00', '13.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00105', 1018, '602.00', 'paid', 'pending', '2025-09-22 23:53:15', '2025-09-23 23:56:05', NULL, 1018, '2025-09-22 23:53:15', '650.00', '48.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00106', 1018, '1200.00', 'paid', 'pending', '2025-09-22 23:54:15', '2025-09-23 23:56:36', NULL, 1018, '2025-09-22 23:54:15', '1200.00', '0.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00107', 1018, '1200.00', 'paid', 'pending', '2025-09-22 23:54:52', '2025-09-23 23:57:23', NULL, 1018, '2025-09-22 23:54:52', '1200.00', '0.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00108', 1018, '594.50', 'paid', 'pending', '2025-09-22 23:56:02', '2025-09-23 23:58:26', NULL, 1018, '2025-09-22 23:56:02', '600.00', '5.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00109', 1018, '1077.00', 'paid', 'pending', '2025-09-22 23:57:18', '2025-09-23 23:59:00', NULL, 1018, '2025-09-22 23:57:18', '1080.00', '3.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00110', 1018, '514.00', 'paid', 'pending', '2025-09-23 23:10:47', '2025-09-23 23:59:49', NULL, 1018, '2025-09-23 23:10:47', '550.00', '36.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00111', 1018, '1946.00', 'paid', 'pending', '2025-09-23 23:12:32', '2025-09-24 00:01:28', NULL, 1018, '2025-09-23 23:12:32', '1950.00', '4.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00112', 1018, '1003.25', 'paid', 'pending', '2025-09-23 23:16:32', '2025-09-24 00:02:10', NULL, 1018, '2025-09-23 23:16:32', '1005.00', '1.75', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00113', 1018, '2042.00', 'paid', 'pending', '2025-09-23 23:18:56', '2025-09-24 00:02:42', NULL, 1018, '2025-09-23 23:18:56', '2050.00', '8.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00114', 1018, '700.00', 'paid', 'pending', '2025-09-23 23:20:05', '2025-09-24 00:03:52', NULL, 1018, '2025-09-23 23:20:05', '700.00', '0.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00115', 1018, '452.00', 'paid', 'pending', '2025-09-24 18:37:38', '2025-10-06 23:30:47', NULL, 1018, '2025-09-24 18:37:38', '500.00', '48.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00116', 1018, '926.50', 'paid', 'pending', '2025-09-24 18:39:43', '2025-10-06 23:29:09', NULL, 1018, '2025-09-24 18:39:43', '1000.00', '73.50', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00139', 1018, '1101.00', 'paid', 'pending', '2025-10-08 15:14:03', '2025-10-08 21:44:17', NULL, 1018, '2025-10-08 15:14:03', '1200.00', '99.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00140', 1018, '3028.00', 'paid', 'pending', '2025-10-08 15:16:00', '2025-10-08 21:43:33', NULL, 1018, '2025-10-08 15:16:00', '3500.00', '472.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash'),
('PO00141', 1018, '1081.00', 'paid', 'pending', '2025-10-08 15:18:47', '2025-10-08 21:42:59', NULL, 1018, '2025-10-08 15:18:47', '1100.00', '19.00', 'Walk-in Customer', 1, 'eco', NULL, 'cash');

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

-- Data for table: order_items
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `choice_id`) VALUES
(4265, 'PO00002', 72, 1, '93.00', 95),
(4266, 'PO00002', 67, 3, '20.50', 232),
(4267, 'PO00002', 63, 3, '23.00', NULL),
(4268, 'PO00002', 65, 3, '29.75', 235),
(4269, 'PO00002', 65, 3, '29.75', 236),
(4270, 'PO00002', 119, 1, '58.00', NULL),
(4271, 'PO00002', 121, 1, '62.00', NULL),
(4272, 'PO00002', 135, 1, '132.00', 125),
(4273, 'PO00002', 169, 1, '139.00', NULL),
(4274, 'PO00002', 47, 5, '11.75', 247),
(4275, 'PO00002', 45, 2, '15.50', 253),
(4276, 'PO00002', 143, 1, '83.00', 154),
(4277, 'PO00002', 144, 1, '66.00', 157),
(4278, 'PO00003', 69, 3, '32.00', 226),
(4279, 'PO00003', 133, 4, '25.00', 89),
(4280, 'PO00003', 133, 4, '25.00', 90),
(4281, 'PO00003', 161, 1, '95.00', NULL),
(4282, 'PO00003', 167, 2, '21.00', 201),
(4283, 'PO00003', 75, 1, '112.00', 114),
(4284, 'PO00003', 76, 1, '84.00', 119),
(4285, 'PO00003', 79, 2, '72.00', NULL),
(4286, 'PO00003', 143, 1, '83.00', 154),
(4287, 'PO00003', 58, 1, '617.00', NULL),
(4288, 'PO00003', 148, 1, '63.00', NULL),
(4289, 'PO00004', 80, 3, '12.00', NULL),
(4290, 'PO00004', 146, 6, '6.50', 164),
(4291, 'PO00004', 146, 6, '6.50', 163),
(4292, 'PO00004', 147, 1, '94.00', 168),
(4293, 'PO00004', 117, 1, '58.00', NULL),
(4294, 'PO00004', 115, 1, '58.00', NULL),
(4295, 'PO00004', 135, 1, '132.00', 127),
(4296, 'PO00004', 81, 3, '8.00', NULL),
(4297, 'PO00004', 151, 1, '95.00', NULL),
(4298, 'PO00004', 152, 1, '0.00', NULL),
(4299, 'PO00004', 172, 1, '71.00', 210),
(4300, 'PO00004', 141, 5, '22.00', 148),
(4301, 'PO00004', 142, 3, '21.50', 151),
(4302, 'PO00005', 31, 1, '301.00', NULL),
(4303, 'PO00005', 47, 3, '11.75', 247),
(4304, 'PO00005', 48, 3, '36.50', 212),
(4305, 'PO00005', 38, 3, '22.75', 230),
(4306, 'PO00005', 123, 1, '70.00', NULL),
(4307, 'PO00005', 137, 1, '92.00', 135),
(4308, 'PO00005', 76, 1, '98.00', 121),
(4309, 'PO00005', 75, 1, '112.00', 114),
(4310, 'PO00005', 41, 2, '22.50', NULL),
(4311, 'PO00005', 98, 3, '33.00', NULL),
(4312, 'PO00005', 91, 2, '0.00', NULL),
(4313, 'PO00005', 85, 3, '0.00', NULL),
(4314, 'PO00005', 71, 3, '25.00', 219),
(4315, 'PO00005', 138, 1, '135.00', 137),
(4316, 'PO00005', 160, 2, '42.00', 192),
(4317, 'PO00005', 160, 1, '42.00', 193),
(4318, 'PO00005', 160, 1, '42.00', 195),
(4319, 'PO00005', 161, 1, '95.00', NULL),
(4320, 'PO00005', 166, 1, '129.00', 200),
(4321, 'PO00006', 31, 1, '301.00', NULL),
(4322, 'PO00006', 47, 3, '11.75', 247),
(4323, 'PO00006', 48, 3, '36.50', 212),
(4324, 'PO00006', 38, 3, '22.75', 230),
(4325, 'PO00006', 123, 1, '70.00', NULL),
(4326, 'PO00006', 137, 1, '92.00', 135),
(4327, 'PO00006', 76, 1, '98.00', 121),
(4328, 'PO00006', 75, 1, '112.00', 114),
(4329, 'PO00006', 41, 2, '22.50', NULL),
(4330, 'PO00006', 98, 3, '33.00', NULL),
(4331, 'PO00006', 91, 2, '0.00', NULL),
(4332, 'PO00006', 85, 3, '0.00', NULL),
(4333, 'PO00006', 71, 3, '25.00', 219),
(4334, 'PO00006', 138, 1, '135.00', 137),
(4335, 'PO00006', 160, 2, '42.00', 192),
(4336, 'PO00006', 160, 1, '42.00', 193),
(4337, 'PO00006', 160, 1, '42.00', 195),
(4338, 'PO00006', 161, 1, '95.00', NULL),
(4339, 'PO00006', 166, 1, '129.00', 200),
(4340, 'PO00007', 38, 5, '17.50', 229),
(4341, 'PO00007', 38, 3, '22.75', 230),
(4342, 'PO00007', 45, 2, '15.50', 253),
(4343, 'PO00007', 60, 1, '1554.00', NULL),
(4344, 'PO00007', 104, 3, '45.00', 48),
(4345, 'PO00007', 111, 1, '200.00', NULL),
(4346, 'PO00007', 127, 1, '78.00', 82),
(4347, 'PO00007', 153, 1, '36.00', 172),
(4348, 'PO00007', 159, 2, '38.00', 189),
(4349, 'PO00007', 170, 1, '28.00', 206),
(4350, 'PO00007', 170, 1, '28.00', 207),
(4351, 'PO00008', 116, 1, '58.00', 65),
(4352, 'PO00008', 125, 1, '58.00', NULL),
(4353, 'PO00008', 128, 1, '67.00', NULL),
(4354, 'PO00008', 136, 1, '128.00', 130),
(4355, 'PO00008', 169, 1, '139.00', NULL),
(4356, 'PO00008', 155, 1, '98.00', 178),
(4357, 'PO00008', 149, 1, '33.00', NULL),
(4358, 'PO00008', 79, 1, '72.00', NULL),
(4359, 'PO00008', 73, 1, '98.00', 109),
(4360, 'PO00008', 107, 1, '84.00', 54),
(4361, 'PO00008', 109, 1, '150.00', NULL),
(4362, 'PO00008', 58, 1, '617.00', NULL),
(4363, 'PO00009', 48, 3, '36.50', 212),
(4364, 'PO00009', 41, 2, '22.50', NULL),
(4365, 'PO00009', 72, 1, '93.00', 95),
(4366, 'PO00009', 75, 1, '112.00', 114),
(4367, 'PO00009', 135, 1, '132.00', 127),
(4368, 'PO00009', 135, 1, '132.00', 125),
(4369, 'PO00009', 141, 5, '22.00', 148),
(4370, 'PO00009', 47, 5, '11.75', 247),
(4371, 'PO00009', 143, 1, '83.00', 154),
(4372, 'PO00009', 150, 1, '37.00', NULL),
(4373, 'PO00009', 151, 1, '95.00', NULL),
(4374, 'PO00009', 171, 2, '24.00', NULL),
(4375, 'PO00009', 154, 1, '0.00', NULL),
(4376, 'PO00009', 117, 1, '58.00', NULL),
(4377, 'PO00010', 161, 2, '95.00', NULL),
(4378, 'PO00010', 166, 1, '129.00', 199),
(4379, 'PO00010', 160, 2, '42.00', 192),
(4380, 'PO00010', 160, 1, '42.00', 195),
(4381, 'PO00010', 79, 2, '72.00', NULL),
(4382, 'PO00010', 144, 1, '66.00', 157),
(4383, 'PO00010', 59, 1, '1008.00', 259),
(4384, 'PO00010', 58, 1, '617.00', NULL),
(4385, 'PO00011', 116, 1, '58.00', 65),
(4386, 'PO00011', 127, 1, '78.00', 82),
(4387, 'PO00011', 127, 1, '78.00', 75),
(4388, 'PO00011', 129, 1, '77.00', 83),
(4389, 'PO00011', 140, 3, '28.00', 144),
(4390, 'PO00011', 142, 5, '21.50', 151),
(4391, 'PO00011', 149, 1, '33.00', NULL),
(4392, 'PO00011', 152, 2, '44.00', 170),
(4393, 'PO00011', 170, 2, '28.00', 206),
(4394, 'PO00011', 160, 3, '0.00', NULL),
(4395, 'PO00011', 160, 3, '42.00', 192),
(4396, 'PO00012', 62, 4, '23.50', 223),
(4397, 'PO00012', 72, 2, '93.00', 95),
(4398, 'PO00012', 72, 1, '114.00', 98),
(4399, 'PO00012', 69, 5, '32.00', 226),
(4400, 'PO00012', 69, 2, '40.00', 228),
(4401, 'PO00012', 80, 3, '12.00', NULL),
(4402, 'PO00012', 113, 1, '203.00', 55),
(4403, 'PO00012', 119, 1, '58.00', NULL),
(4404, 'PO00012', 146, 6, '6.50', 163),
(4405, 'PO00012', 146, 6, '6.50', 164),
(4406, 'PO00013', 62, 4, '23.50', 223),
(4407, 'PO00013', 72, 2, '93.00', 95),
(4408, 'PO00013', 72, 1, '114.00', 98),
(4409, 'PO00013', 69, 5, '32.00', 226),
(4410, 'PO00013', 69, 2, '40.00', 228),
(4411, 'PO00013', 80, 3, '12.00', NULL),
(4412, 'PO00013', 113, 1, '203.00', 55),
(4413, 'PO00013', 119, 1, '58.00', NULL),
(4414, 'PO00013', 146, 6, '6.50', 163),
(4415, 'PO00013', 146, 6, '6.50', 164),
(4416, 'PO00014', 147, 1, '90.00', 167),
(4417, 'PO00014', 163, 1, '86.00', NULL),
(4418, 'PO00014', 141, 5, '22.00', 148),
(4419, 'PO00014', 135, 1, '132.00', 127),
(4420, 'PO00014', 162, 1, '95.00', NULL),
(4421, 'PO00014', 167, 6, '21.00', 201),
(4422, 'PO00014', 107, 1, '84.00', 52),
(4423, 'PO00014', 107, 1, '84.00', 53),
(4424, 'PO00014', 58, 1, '617.00', NULL),
(4425, 'PO00014', 114, 1, '722.00', 58),
(4426, 'PO00015', 147, 1, '90.00', 167),
(4427, 'PO00015', 163, 1, '86.00', NULL),
(4428, 'PO00015', 141, 5, '22.00', 148),
(4429, 'PO00015', 135, 1, '132.00', 127),
(4430, 'PO00015', 162, 1, '95.00', NULL),
(4431, 'PO00015', 167, 6, '21.00', 201),
(4432, 'PO00015', 107, 1, '84.00', 52),
(4433, 'PO00015', 107, 1, '84.00', 53),
(4434, 'PO00015', 58, 1, '617.00', NULL),
(4435, 'PO00015', 114, 1, '722.00', 58),
(4436, 'PO00016', 45, 3, '15.50', 253),
(4437, 'PO00016', 41, 2, '22.50', NULL),
(4438, 'PO00016', 62, 5, '26.50', 225),
(4439, 'PO00016', 62, 3, '23.50', 223),
(4440, 'PO00016', 138, 1, '135.00', 137),
(4441, 'PO00016', 138, 1, '135.00', 138),
(4442, 'PO00016', 139, 1, '52.00', 141),
(4443, 'PO00016', 38, 5, '17.50', 229),
(4444, 'PO00016', 38, 3, '22.75', 230),
(4445, 'PO00016', 38, 2, '31.00', 231),
(4446, 'PO00016', 63, 4, '23.00', NULL),
(4447, 'PO00016', 101, 2, '42.00', 42),
(4448, 'PO00016', 151, 1, '95.00', NULL),
(4449, 'PO00016', 157, 1, '88.00', 179),
(4450, 'PO00016', 64, 2, '27.50', 215),
(4451, 'PO00017', 45, 3, '15.50', 253),
(4452, 'PO00017', 41, 2, '22.50', NULL),
(4453, 'PO00017', 62, 5, '26.50', 225),
(4454, 'PO00017', 62, 3, '23.50', 223),
(4455, 'PO00017', 138, 1, '135.00', 137),
(4456, 'PO00017', 138, 1, '135.00', 138),
(4457, 'PO00017', 139, 1, '52.00', 141),
(4458, 'PO00017', 38, 5, '17.50', 229),
(4459, 'PO00017', 38, 3, '22.75', 230),
(4460, 'PO00017', 38, 2, '31.00', 231),
(4461, 'PO00017', 63, 4, '23.00', NULL),
(4462, 'PO00017', 101, 2, '42.00', 42),
(4463, 'PO00017', 151, 1, '95.00', NULL),
(4464, 'PO00017', 157, 1, '88.00', 179),
(4465, 'PO00017', 64, 2, '27.50', 215),
(4466, 'PO00018', 47, 5, '11.75', 247),
(4467, 'PO00018', 48, 3, '27.50', 211),
(4468, 'PO00018', 136, 1, '128.00', 130),
(4469, 'PO00018', 169, 1, '139.00', NULL),
(4470, 'PO00018', 143, 2, '83.00', 154),
(4471, 'PO00018', 48, 3, '41.50', 213),
(4472, 'PO00018', 72, 1, '255.00', 99),
(4473, 'PO00018', 73, 1, '98.00', 109),
(4474, 'PO00018', 71, 2, '35.00', 220),
(4475, 'PO00018', 76, 1, '98.00', 121),
(4476, 'PO00018', 75, 1, '112.00', 114),
(4477, 'PO00018', 103, 1, '67.00', 46),
(4478, 'PO00018', 104, 3, '45.00', 48),
(4479, 'PO00018', 115, 1, '58.00', NULL),
(4480, 'PO00018', 125, 1, '58.00', NULL),
(4481, 'PO00018', 145, 1, '57.00', NULL),
(4482, 'PO00018', 146, 12, '6.50', 163),
(4483, 'PO00019', 76, 1, '84.00', 119),
(4484, 'PO00019', 72, 2, '93.00', 95),
(4485, 'PO00019', 143, 2, '83.00', 154),
(4486, 'PO00019', 144, 1, '66.00', 157),
(4487, 'PO00019', 147, 1, '90.00', 167),
(4488, 'PO00019', 151, 1, '95.00', NULL),
(4489, 'PO00019', 172, 1, '71.00', 210),
(4490, 'PO00019', 121, 1, '62.00', NULL),
(4491, 'PO00019', 126, 1, '58.00', NULL),
(4492, 'PO00019', 38, 4, '22.75', 230),
(4493, 'PO00019', 67, 3, '20.50', 232),
(4494, 'PO00019', 60, 1, '1554.00', NULL),
(4495, 'PO00020', 135, 1, '132.00', 125),
(4496, 'PO00020', 135, 1, '132.00', 127),
(4497, 'PO00020', 141, 5, '22.00', 148),
(4498, 'PO00020', 152, 2, '44.00', 170),
(4499, 'PO00020', 156, 1, '88.00', NULL),
(4500, 'PO00020', 80, 5, '12.00', NULL),
(4501, 'PO00020', 144, 1, '66.00', 157),
(4502, 'PO00020', 146, 6, '6.50', 163),
(4503, 'PO00020', 159, 2, '38.00', 189),
(4504, 'PO00020', 159, 2, '38.00', 188),
(4505, 'PO00020', 160, 2, '42.00', 192),
(4506, 'PO00020', 160, 2, '42.00', 193),
(4507, 'PO00020', 64, 3, '37.50', 216),
(4508, 'PO00020', 64, 3, '36.50', 238),
(4509, 'PO00020', 67, 3, '30.50', 233),
(4510, 'PO00021', 135, 1, '132.00', 125),
(4511, 'PO00021', 135, 1, '132.00', 127),
(4512, 'PO00021', 141, 5, '22.00', 148),
(4513, 'PO00021', 152, 2, '44.00', 170),
(4514, 'PO00021', 156, 1, '88.00', NULL),
(4515, 'PO00021', 80, 5, '12.00', NULL),
(4516, 'PO00021', 144, 1, '66.00', 157),
(4517, 'PO00021', 146, 6, '6.50', 163),
(4518, 'PO00021', 159, 2, '38.00', 189),
(4519, 'PO00021', 159, 2, '38.00', 188),
(4520, 'PO00021', 160, 2, '42.00', 192),
(4521, 'PO00021', 160, 2, '42.00', 193),
(4522, 'PO00021', 64, 3, '37.50', 216),
(4523, 'PO00021', 64, 3, '36.50', 238),
(4524, 'PO00021', 67, 3, '30.50', 233),
(4525, 'PO00022', 75, 2, '112.00', 114),
(4526, 'PO00022', 72, 2, '93.00', 95),
(4527, 'PO00022', 135, 2, '132.00', 127),
(4528, 'PO00022', 135, 1, '132.00', 125),
(4529, 'PO00022', 158, 1, '42.00', 183),
(4530, 'PO00022', 158, 1, '42.00', 187),
(4531, 'PO00022', 169, 1, '139.00', NULL),
(4532, 'PO00022', 45, 3, '15.50', 253),
(4533, 'PO00022', 123, 1, '70.00', NULL),
(4534, 'PO00022', 161, 1, '95.00', NULL),
(4535, 'PO00023', 75, 2, '112.00', 114),
(4536, 'PO00023', 72, 2, '93.00', 95),
(4537, 'PO00023', 135, 2, '132.00', 127),
(4538, 'PO00023', 135, 1, '132.00', 125),
(4539, 'PO00023', 158, 1, '42.00', 183),
(4540, 'PO00023', 158, 1, '42.00', 187),
(4541, 'PO00023', 169, 1, '139.00', NULL),
(4542, 'PO00023', 45, 3, '15.50', 253),
(4543, 'PO00023', 123, 1, '70.00', NULL),
(4544, 'PO00023', 161, 1, '95.00', NULL),
(4545, 'PO00024', 165, 1, '105.00', NULL),
(4546, 'PO00024', 65, 3, '29.75', 235),
(4547, 'PO00024', 65, 3, '29.75', 236),
(4548, 'PO00024', 69, 4, '32.00', 226),
(4549, 'PO00024', 97, 3, '35.50', 36),
(4550, 'PO00024', 140, 2, '50.00', 145),
(4551, 'PO00024', 139, 4, '25.00', 140),
(4552, 'PO00024', 79, 2, '72.00', NULL),
(4553, 'PO00024', 120, 1, '58.00', 70),
(4554, 'PO00024', 128, 1, '67.00', NULL),
(4555, 'PO00024', 127, 1, '78.00', 75),
(4556, 'PO00024', 62, 5, '23.50', 223),
(4557, 'PO00025', 165, 1, '105.00', NULL),
(4558, 'PO00025', 65, 3, '29.75', 235),
(4559, 'PO00025', 65, 3, '29.75', 236),
(4560, 'PO00025', 69, 4, '32.00', 226),
(4561, 'PO00025', 97, 3, '35.50', 36),
(4562, 'PO00025', 140, 2, '50.00', 145),
(4563, 'PO00025', 139, 4, '25.00', 140),
(4564, 'PO00025', 79, 2, '72.00', NULL),
(4565, 'PO00025', 120, 1, '58.00', 70),
(4566, 'PO00025', 128, 1, '67.00', NULL),
(4567, 'PO00025', 127, 1, '78.00', 75),
(4568, 'PO00025', 62, 5, '23.50', 223),
(4569, 'PO00026', 138, 1, '135.00', 138),
(4570, 'PO00026', 135, 1, '132.00', 127),
(4571, 'PO00026', 148, 1, '63.00', NULL),
(4572, 'PO00026', 172, 1, '0.00', NULL),
(4573, 'PO00026', 172, 1, '71.00', 209),
(4574, 'PO00026', 146, 6, '6.50', 163),
(4575, 'PO00026', 146, 6, '6.50', 164),
(4576, 'PO00026', 72, 1, '114.00', 98),
(4577, 'PO00026', 64, 3, '36.50', 238),
(4578, 'PO00027', 153, 1, '36.00', 172),
(4579, 'PO00027', 153, 1, '36.00', 173),
(4580, 'PO00027', 148, 1, '63.00', NULL),
(4581, 'PO00027', 72, 1, '93.00', 95),
(4582, 'PO00027', 75, 1, '100.00', 116),
(4583, 'PO00027', 62, 5, '23.50', 223),
(4584, 'PO00027', 111, 1, '200.00', NULL),
(4585, 'PO00027', 107, 1, '84.00', 52),
(4586, 'PO00027', 107, 1, '84.00', 53),
(4587, 'PO00027', 59, 1, '1008.00', 259),
(4588, 'PO00027', 152, 2, '44.00', 170),
(4589, 'PO00028', 136, 1, '128.00', 130),
(4590, 'PO00028', 141, 1, '43.00', 149),
(4591, 'PO00028', 79, 2, '72.00', NULL),
(4592, 'PO00028', 143, 1, '83.00', 154),
(4593, 'PO00028', 144, 1, '66.00', 157),
(4594, 'PO00028', 48, 3, '36.50', 212),
(4595, 'PO00028', 70, 2, '26.50', NULL),
(4596, 'PO00029', 31, 1, '301.00', NULL),
(4597, 'PO00029', 155, 1, '98.00', 178),
(4598, 'PO00029', 75, 1, '197.00', 117),
(4599, 'PO00030', 58, 1, '617.00', NULL),
(4600, 'PO00030', 67, 5, '30.50', 233),
(4601, 'PO00030', 73, 1, '135.00', 110),
(4602, 'PO00030', 79, 2, '72.00', NULL),
(4603, 'PO00030', 80, 5, '12.00', NULL),
(4604, 'PO00030', 122, 1, '72.00', 72),
(4605, 'PO00030', 119, 1, '58.00', NULL),
(4606, 'PO00031', 156, 1, '88.00', NULL),
(4607, 'PO00031', 170, 2, '28.00', 206),
(4608, 'PO00031', 170, 2, '28.00', 207),
(4609, 'PO00031', 115, 1, '58.00', NULL),
(4610, 'PO00031', 125, 1, '58.00', NULL),
(4611, 'PO00031', 136, 1, '128.00', 129),
(4612, 'PO00031', 135, 1, '132.00', 127),
(4613, 'PO00031', 120, 1, '58.00', 66),
(4614, 'PO00032', 41, 3, '22.50', NULL),
(4615, 'PO00032', 38, 5, '22.75', 230),
(4616, 'PO00032', 34, 2, '141.00', 257),
(4617, 'PO00032', 135, 1, '132.00', 125),
(4618, 'PO00032', 135, 1, '131.00', 128),
(4619, 'PO00032', 153, 1, '36.00', 173),
(4620, 'PO00032', 158, 1, '42.00', 183),
(4621, 'PO00032', 172, 1, '71.00', 210),
(4622, 'PO00032', 72, 1, '93.00', 95),
(4623, 'PO00032', 75, 1, '112.00', 114),
(4624, 'PO00032', 76, 2, '84.00', 119),
(4625, 'PO00032', 123, 1, '70.00', NULL),
(4626, 'PO00033', 81, 5, '8.00', NULL),
(4627, 'PO00033', 143, 2, '83.00', 154),
(4628, 'PO00033', 144, 1, '66.00', 157),
(4629, 'PO00033', 126, 1, '58.00', NULL),
(4630, 'PO00033', 116, 1, '58.00', 64),
(4631, 'PO00034', 38, 4, '22.75', 230),
(4632, 'PO00034', 135, 1, '132.00', 127),
(4633, 'PO00034', 136, 1, '128.00', 130),
(4634, 'PO00034', 139, 4, '25.00', 140),
(4635, 'PO00034', 143, 1, '83.00', 154),
(4636, 'PO00034', 144, 1, '66.00', 157),
(4637, 'PO00034', 84, 1, '99.00', NULL),
(4638, 'PO00035', 38, 6, '17.50', 229),
(4639, 'PO00035', 72, 1, '93.00', 95),
(4640, 'PO00035', 76, 1, '98.00', 121),
(4641, 'PO00035', 160, 2, '42.00', 192),
(4642, 'PO00035', 160, 1, '42.00', 195),
(4643, 'PO00035', 166, 1, '129.00', 200),
(4644, 'PO00036', 69, 4, '32.00', 226),
(4645, 'PO00036', 75, 1, '112.00', 114),
(4646, 'PO00036', 103, 2, '67.00', 46),
(4647, 'PO00036', 91, 3, '25.50', 243),
(4648, 'PO00036', 91, 2, '25.50', 244),
(4649, 'PO00036', 114, 1, '722.00', 58),
(4650, 'PO00036', 115, 1, '58.00', NULL),
(4651, 'PO00036', 120, 1, '58.00', 68),
(4652, 'PO00037', 47, 4, '11.75', 247),
(4653, 'PO00037', 62, 3, '23.50', 223),
(4654, 'PO00037', 83, 1, '95.00', NULL),
(4655, 'PO00037', 116, 1, '58.00', 65),
(4656, 'PO00037', 128, 1, '67.00', NULL),
(4657, 'PO00037', 138, 1, '135.00', 137),
(4658, 'PO00037', 129, 1, '77.00', 83),
(4659, 'PO00037', 152, 2, '44.00', 170),
(4660, 'PO00037', 165, 1, '105.00', NULL),
(4661, 'PO00037', 172, 1, '71.00', 209),
(4662, 'PO00038', 79, 2, '72.00', NULL),
(4663, 'PO00038', 80, 4, '12.00', NULL),
(4664, 'PO00038', 143, 2, '83.00', 154),
(4665, 'PO00038', 144, 1, '53.00', 158),
(4666, 'PO00038', 146, 6, '6.50', 163),
(4667, 'PO00038', 146, 6, '6.50', 164),
(4668, 'PO00038', 147, 1, '90.00', 167),
(4669, 'PO00038', 149, 1, '33.00', NULL),
(4670, 'PO00038', 150, 1, '37.00', NULL),
(4671, 'PO00038', 155, 1, '98.00', 178),
(4672, 'PO00038', 135, 2, '132.00', 127),
(4673, 'PO00038', 142, 3, '21.50', 151),
(4674, 'PO00038', 142, 1, '40.00', 152),
(4675, 'PO00039', 73, 1, '270.00', 111),
(4676, 'PO00039', 65, 3, '29.75', 235),
(4677, 'PO00039', 65, 3, '29.75', 236),
(4678, 'PO00039', 67, 5, '30.50', 233),
(4679, 'PO00039', 119, 1, '58.00', NULL),
(4680, 'PO00039', 130, 1, '75.00', NULL),
(4681, 'PO00039', 107, 1, '84.00', 52),
(4682, 'PO00039', 107, 1, '84.00', 53),
(4683, 'PO00040', 33, 1, '649.00', NULL),
(4684, 'PO00040', 135, 1, '131.00', 128),
(4685, 'PO00040', 135, 1, '132.00', 127),
(4686, 'PO00040', 138, 1, '135.00', 138),
(4687, 'PO00040', 151, 1, '95.00', NULL),
(4688, 'PO00040', 156, 1, '88.00', NULL),
(4689, 'PO00040', 158, 1, '42.00', 183),
(4690, 'PO00040', 158, 1, '42.00', 182),
(4691, 'PO00040', 64, 3, '36.50', 238),
(4692, 'PO00040', 64, 3, '37.50', 216),
(4693, 'PO00041', 119, 1, '58.00', NULL),
(4694, 'PO00041', 120, 1, '58.00', 66),
(4695, 'PO00041', 120, 1, '58.00', 67),
(4696, 'PO00041', 125, 1, '58.00', NULL),
(4697, 'PO00041', 60, 1, '1554.00', NULL),
(4698, 'PO00041', 135, 1, '132.00', 125),
(4699, 'PO00041', 169, 1, '139.00', NULL),
(4700, 'PO00041', 79, 2, '72.00', NULL),
(4701, 'PO00042', 72, 1, '114.00', 98),
(4702, 'PO00042', 72, 2, '93.00', 95),
(4703, 'PO00042', 75, 1, '112.00', 114),
(4704, 'PO00042', 76, 1, '84.00', 119),
(4705, 'PO00042', 111, 1, '200.00', NULL),
(4706, 'PO00042', 109, 1, '150.00', NULL),
(4707, 'PO00042', 107, 2, '84.00', 52),
(4708, 'PO00042', 153, 1, '36.00', 172),
(4709, 'PO00042', 153, 1, '36.00', 173),
(4710, 'PO00042', 170, 3, '28.00', 206),
(4711, 'PO00043', 41, 4, '22.50', NULL),
(4712, 'PO00043', 38, 5, '22.75', 230),
(4713, 'PO00043', 47, 3, '19.50', 248),
(4714, 'PO00043', 47, 5, '11.75', 247),
(4715, 'PO00043', 48, 4, '36.50', 212),
(4716, 'PO00043', 58, 2, '617.00', NULL),
(4717, 'PO00044', 115, 1, '58.00', NULL),
(4718, 'PO00044', 119, 1, '58.00', NULL),
(4719, 'PO00044', 120, 1, '58.00', 66),
(4720, 'PO00044', 121, 1, '62.00', NULL),
(4721, 'PO00044', 127, 1, '78.00', 75),
(4722, 'PO00044', 79, 2, '72.00', NULL),
(4723, 'PO00044', 80, 3, '12.00', NULL),
(4724, 'PO00045', 123, 1, '70.00', NULL),
(4725, 'PO00045', 126, 1, '58.00', NULL),
(4726, 'PO00045', 135, 1, '132.00', 125),
(4727, 'PO00045', 136, 1, '128.00', 130),
(4728, 'PO00045', 138, 1, '135.00', 138),
(4729, 'PO00045', 143, 2, '83.00', 154),
(4730, 'PO00045', 144, 1, '66.00', 157),
(4731, 'PO00045', 151, 1, '95.00', NULL),
(4732, 'PO00045', 152, 2, '44.00', 170),
(4733, 'PO00046', 108, 1, '88.00', NULL),
(4734, 'PO00046', 59, 1, '1008.00', 259),
(4735, 'PO00046', 113, 1, '203.00', 55),
(4736, 'PO00046', 113, 1, '203.00', 56),
(4737, 'PO00046', 140, 3, '50.00', 145),
(4738, 'PO00046', 140, 1, '119.00', 147),
(4739, 'PO00046', 161, 2, '95.00', NULL),
(4740, 'PO00047', 166, 1, '129.00', 199),
(4741, 'PO00047', 164, 1, '125.00', 197),
(4742, 'PO00047', 76, 2, '84.00', 119),
(4743, 'PO00047', 75, 1, '112.00', 114),
(4744, 'PO00047', 79, 2, '72.00', NULL),
(4745, 'PO00047', 80, 2, '12.00', NULL),
(4746, 'PO00047', 82, 5, '8.00', NULL),
(4747, 'PO00048', 34, 1, '189.00', 258),
(4748, 'PO00048', 48, 5, '36.50', 212),
(4749, 'PO00048', 72, 2, '93.00', 95),
(4750, 'PO00048', 138, 1, '135.00', 137),
(4751, 'PO00048', 138, 1, '135.00', 138),
(4752, 'PO00048', 169, 1, '139.00', NULL),
(4753, 'PO00049', 63, 5, '23.00', NULL),
(4754, 'PO00049', 64, 3, '37.50', 216),
(4755, 'PO00049', 64, 3, '36.50', 238),
(4756, 'PO00049', 62, 5, '26.50', 225),
(4757, 'PO00049', 67, 5, '20.50', 232),
(4758, 'PO00049', 69, 3, '32.00', 226),
(4759, 'PO00049', 135, 1, '132.00', 126),
(4760, 'PO00049', 141, 5, '22.00', 148),
(4761, 'PO00050', 60, 1, '1554.00', NULL),
(4762, 'PO00050', 72, 1, '93.00', 95),
(4763, 'PO00050', 69, 5, '32.00', 226),
(4764, 'PO00050', 68, 3, '23.00', 218),
(4765, 'PO00050', 136, 1, '128.00', 130),
(4766, 'PO00050', 117, 1, '58.00', NULL),
(4767, 'PO00050', 120, 1, '58.00', 67),
(4768, 'PO00050', 124, 1, '58.00', 74),
(4769, 'PO00051', 60, 1, '1554.00', NULL),
(4770, 'PO00051', 109, 1, '150.00', NULL),
(4771, 'PO00051', 75, 1, '197.00', 117),
(4772, 'PO00051', 149, 2, '33.00', NULL),
(4773, 'PO00051', 158, 1, '42.00', 184),
(4774, 'PO00052', 79, 3, '72.00', NULL),
(4775, 'PO00052', 80, 5, '12.00', NULL),
(4776, 'PO00052', 143, 1, '83.00', 154),
(4777, 'PO00052', 118, 1, '58.00', NULL),
(4778, 'PO00052', 119, 1, '58.00', NULL),
(4779, 'PO00052', 117, 1, '58.00', NULL),
(4780, 'PO00053', 63, 3, '23.00', NULL),
(4781, 'PO00053', 64, 5, '27.50', 215),
(4782, 'PO00053', 64, 4, '37.50', 216),
(4783, 'PO00053', 62, 5, '23.50', 223),
(4784, 'PO00053', 69, 5, '32.00', 226),
(4785, 'PO00053', 75, 1, '112.00', 114),
(4786, 'PO00053', 72, 2, '93.00', 95),
(4787, 'PO00054', 58, 2, '617.00', NULL),
(4788, 'PO00054', 59, 1, '1008.00', 259),
(4789, 'PO00054', 83, 1, '95.00', NULL),
(4790, 'PO00054', 156, 1, '88.00', NULL),
(4791, 'PO00054', 155, 1, '98.00', 178),
(4792, 'PO00055', 135, 1, '132.00', 126),
(4793, 'PO00055', 135, 1, '132.00', 127),
(4794, 'PO00055', 138, 1, '135.00', 137),
(4795, 'PO00055', 141, 5, '22.00', 148),
(4796, 'PO00055', 140, 6, '28.00', 144),
(4797, 'PO00055', 47, 3, '19.50', 248),
(4798, 'PO00055', 45, 3, '15.50', 253),
(4799, 'PO00055', 160, 2, '42.00', 195),
(4800, 'PO00055', 160, 2, '42.00', 192),
(4801, 'PO00055', 159, 1, '38.00', 188),
(4802, 'PO00055', 159, 1, '38.00', 190),
(4803, 'PO00056', 111, 1, '200.00', NULL),
(4804, 'PO00056', 110, 1, '207.00', NULL),
(4805, 'PO00056', 107, 1, '84.00', 54),
(4806, 'PO00056', 107, 1, '84.00', 53),
(4807, 'PO00056', 72, 1, '114.00', 98),
(4808, 'PO00056', 76, 2, '84.00', 119),
(4809, 'PO00057', 75, 2, '112.00', 114),
(4810, 'PO00057', 73, 1, '135.00', 110),
(4811, 'PO00057', 72, 1, '93.00', 95),
(4812, 'PO00057', 135, 1, '132.00', 125),
(4813, 'PO00057', 169, 1, '139.00', NULL),
(4814, 'PO00057', 38, 5, '22.75', 230),
(4815, 'PO00057', 38, 5, '17.50', 229),
(4816, 'PO00057', 48, 6, '36.50', 212),
(4817, 'PO00057', 48, 4, '27.50', 211),
(4818, 'PO00057', 62, 5, '23.50', 223),
(4819, 'PO00057', 62, 4, '16.00', 222),
(4820, 'PO00058', 67, 5, '20.50', 232),
(4821, 'PO00058', 67, 5, '30.50', 233),
(4822, 'PO00058', 65, 4, '29.75', 235),
(4823, 'PO00058', 65, 4, '29.75', 236),
(4824, 'PO00058', 74, 1, '93.00', 105),
(4825, 'PO00058', 79, 2, '72.00', NULL),
(4826, 'PO00058', 143, 1, '83.00', 154),
(4827, 'PO00058', 144, 1, '66.00', 157),
(4828, 'PO00059', 80, 5, '12.00', NULL),
(4829, 'PO00059', 47, 5, '11.75', 247),
(4830, 'PO00059', 161, 2, '95.00', NULL),
(4831, 'PO00059', 162, 1, '95.00', NULL),
(4832, 'PO00059', 160, 2, '42.00', 193),
(4833, 'PO00059', 122, 1, '72.00', 71),
(4834, 'PO00059', 123, 1, '70.00', NULL),
(4835, 'PO00059', 127, 1, '78.00', 75),
(4836, 'PO00059', 129, 1, '77.00', 83),
(4837, 'PO00059', 151, 1, '95.00', NULL),
(4838, 'PO00059', 152, 1, '44.00', 170),
(4839, 'PO00059', 153, 1, '36.00', 172),
(4840, 'PO00059', 158, 1, '42.00', 182),
(4841, 'PO00060', 58, 2, '617.00', NULL),
(4842, 'PO00060', 109, 1, '150.00', NULL),
(4843, 'PO00060', 113, 1, '203.00', 55),
(4844, 'PO00060', 113, 1, '203.00', 56),
(4845, 'PO00060', 112, 1, '192.00', NULL),
(4846, 'PO00060', 172, 1, '71.00', 209),
(4847, 'PO00060', 152, 2, '44.00', 170),
(4848, 'PO00060', 48, 3, '36.50', 212),
(4849, 'PO00060', 38, 3, '22.75', 230),
(4850, 'PO00060', 65, 3, '29.75', 235),
(4851, 'PO00060', 65, 3, '29.75', 236),
(4852, 'PO00060', 69, 4, '32.00', 226),
(4853, 'PO00061', 115, 2, '58.00', NULL),
(4854, 'PO00061', 120, 1, '58.00', 70),
(4855, 'PO00061', 72, 1, '93.00', 95),
(4856, 'PO00061', 76, 2, '84.00', 119),
(4857, 'PO00061', 160, 2, '42.00', 192),
(4858, 'PO00062', 135, 1, '132.00', 127),
(4859, 'PO00062', 169, 1, '139.00', NULL),
(4860, 'PO00062', 75, 1, '100.00', 116),
(4861, 'PO00062', 119, 1, '58.00', NULL),
(4862, 'PO00062', 130, 1, '75.00', NULL),
(4863, 'PO00062', 127, 1, '78.00', 82),
(4864, 'PO00062', 60, 1, '1554.00', NULL),
(4865, 'PO00063', 108, 3, '88.00', NULL),
(4866, 'PO00063', 123, 1, '70.00', NULL),
(4867, 'PO00063', 122, 1, '72.00', 72),
(4868, 'PO00063', 121, 1, '62.00', NULL),
(4869, 'PO00063', 64, 5, '36.50', 238),
(4870, 'PO00063', 62, 5, '23.50', 223),
(4871, 'PO00064', 72, 2, '93.00', 95),
(4872, 'PO00064', 75, 1, '112.00', 114),
(4873, 'PO00064', 135, 1, '132.00', 125),
(4874, 'PO00064', 135, 1, '132.00', 127),
(4875, 'PO00064', 150, 1, '37.00', NULL),
(4876, 'PO00064', 148, 1, '63.00', NULL),
(4877, 'PO00064', 170, 2, '28.00', 206),
(4878, 'PO00065', 152, 2, '44.00', 170),
(4879, 'PO00065', 38, 4, '22.75', 230),
(4880, 'PO00065', 38, 2, '17.50', 229),
(4881, 'PO00065', 48, 3, '36.50', 212),
(4882, 'PO00065', 63, 5, '23.00', NULL),
(4883, 'PO00065', 64, 3, '27.50', 215),
(4884, 'PO00065', 67, 5, '20.50', 232),
(4885, 'PO00065', 69, 3, '32.00', 226),
(4886, 'PO00065', 120, 1, '58.00', 67),
(4887, 'PO00065', 121, 1, '62.00', NULL),
(4888, 'PO00065', 79, 2, '72.00', NULL),
(4889, 'PO00065', 143, 2, '83.00', 154),
(4890, 'PO00066', 80, 5, '12.00', NULL),
(4891, 'PO00066', 111, 1, '200.00', NULL),
(4892, 'PO00066', 109, 1, '150.00', NULL),
(4893, 'PO00066', 60, 1, '1554.00', NULL),
(4894, 'PO00066', 136, 1, '128.00', 129),
(4895, 'PO00066', 135, 1, '132.00', 125),
(4896, 'PO00066', 140, 1, '119.00', 147),
(4897, 'PO00066', 142, 4, '21.50', 151),
(4898, 'PO00066', 38, 5, '17.50', 229),
(4899, 'PO00066', 62, 5, '23.50', 223),
(4900, 'PO00067', 160, 2, '42.00', 193),
(4901, 'PO00067', 160, 2, '42.00', 192),
(4902, 'PO00067', 161, 2, '95.00', NULL),
(4903, 'PO00067', 166, 1, '129.00', 200),
(4904, 'PO00067', 116, 1, '58.00', 64),
(4905, 'PO00067', 125, 1, '58.00', NULL),
(4906, 'PO00067', 151, 1, '95.00', NULL),
(4907, 'PO00067', 157, 1, '88.00', 181),
(4908, 'PO00067', 138, 1, '135.00', 137),
(4909, 'PO00068', 31, 1, '301.00', NULL),
(4910, 'PO00068', 107, 1, '84.00', 54),
(4911, 'PO00068', 107, 1, '84.00', 53),
(4912, 'PO00068', 58, 1, '617.00', NULL),
(4913, 'PO00068', 123, 1, '70.00', NULL),
(4914, 'PO00068', 126, 1, '58.00', NULL),
(4915, 'PO00069', 117, 1, '58.00', NULL),
(4916, 'PO00069', 115, 1, '58.00', NULL),
(4917, 'PO00069', 72, 1, '93.00', 95),
(4918, 'PO00069', 72, 1, '255.00', 99),
(4919, 'PO00069', 75, 1, '112.00', 114),
(4920, 'PO00069', 76, 1, '84.00', 119),
(4921, 'PO00069', 79, 2, '72.00', NULL),
(4922, 'PO00069', 144, 1, '66.00', 157),
(4923, 'PO00069', 143, 1, '83.00', 154),
(4924, 'PO00070', 47, 5, '11.75', 247),
(4925, 'PO00070', 41, 3, '22.50', NULL),
(4926, 'PO00070', 63, 4, '23.00', NULL),
(4927, 'PO00070', 62, 5, '23.50', 223),
(4928, 'PO00070', 64, 3, '27.50', 215),
(4929, 'PO00070', 64, 3, '37.50', 216),
(4930, 'PO00070', 67, 4, '30.50', 233),
(4931, 'PO00070', 159, 2, '38.00', 190),
(4932, 'PO00070', 161, 1, '95.00', NULL),
(4933, 'PO00070', 159, 2, '38.00', 188),
(4934, 'PO00071', 34, 1, '189.00', 258),
(4935, 'PO00071', 58, 1, '617.00', NULL),
(4936, 'PO00071', 113, 1, '203.00', 55),
(4937, 'PO00071', 112, 1, '192.00', NULL),
(4938, 'PO00071', 119, 2, '58.00', NULL),
(4939, 'PO00072', 127, 1, '78.00', 75),
(4940, 'PO00072', 127, 1, '78.00', 76),
(4941, 'PO00072', 129, 1, '77.00', 83),
(4942, 'PO00072', 79, 2, '72.00', NULL),
(4943, 'PO00072', 80, 4, '12.00', NULL),
(4944, 'PO00072', 45, 2, '15.50', 253),
(4945, 'PO00072', 135, 1, '132.00', 127),
(4946, 'PO00072', 136, 1, '128.00', 130),
(4947, 'PO00073', 83, 1, '95.00', NULL),
(4948, 'PO00073', 144, 1, '41.00', 160),
(4949, 'PO00073', 143, 1, '72.00', 156),
(4950, 'PO00073', 108, 1, '88.00', NULL),
(4951, 'PO00073', 60, 1, '1554.00', NULL),
(4952, 'PO00073', 166, 1, '129.00', 200),
(4953, 'PO00074', 118, 1, '58.00', NULL),
(4954, 'PO00074', 115, 1, '58.00', NULL),
(4955, 'PO00074', 138, 1, '135.00', 138),
(4956, 'PO00074', 169, 1, '139.00', NULL),
(4957, 'PO00074', 153, 1, '36.00', 173),
(4958, 'PO00074', 152, 1, '44.00', 170),
(4959, 'PO00074', 157, 1, '88.00', 179),
(4960, 'PO00074', 160, 2, '42.00', 192),
(4961, 'PO00074', 168, 3, '17.00', 203),
(4962, 'PO00074', 65, 3, '29.75', 235),
(4963, 'PO00074', 65, 3, '29.75', 236),
(4964, 'PO00075', 151, 1, '95.00', NULL),
(4965, 'PO00075', 143, 2, '83.00', 154),
(4966, 'PO00075', 79, 2, '72.00', NULL),
(4967, 'PO00075', 80, 4, '12.00', NULL),
(4968, 'PO00075', 45, 2, '15.50', 253),
(4969, 'PO00075', 130, 1, '75.00', NULL),
(4970, 'PO00075', 72, 3, '37.00', 96),
(4971, 'PO00075', 158, 1, '42.00', 187),
(4972, 'PO00075', 154, 1, '34.00', 174),
(4973, 'PO00075', 172, 1, '71.00', 210),
(4974, 'PO00075', 172, 1, '71.00', 209),
(4975, 'PO00076', 75, 1, '100.00', 116),
(4976, 'PO00076', 72, 1, '255.00', 99),
(4977, 'PO00076', 119, 1, '58.00', NULL),
(4978, 'PO00076', 123, 1, '70.00', NULL),
(4979, 'PO00076', 127, 1, '78.00', 82),
(4980, 'PO00077', 135, 1, '132.00', 127),
(4981, 'PO00077', 135, 1, '132.00', 125),
(4982, 'PO00077', 139, 5, '25.00', 140),
(4983, 'PO00077', 140, 5, '28.00', 144),
(4984, 'PO00077', 62, 5, '23.50', 223),
(4985, 'PO00077', 62, 3, '16.00', 222),
(4986, 'PO00077', 38, 4, '22.75', 230),
(4987, 'PO00077', 38, 4, '17.50', 229),
(4988, 'PO00077', 67, 5, '30.50', 233),
(4989, 'PO00077', 68, 3, '19.00', 217),
(4990, 'PO00077', 78, 1, '69.00', 256),
(4991, 'PO00077', 81, 5, '8.00', NULL),
(4992, 'PO00078', 47, 5, '11.75', 247),
(4993, 'PO00078', 79, 3, '72.00', NULL),
(4994, 'PO00078', 80, 5, '12.00', NULL),
(4995, 'PO00078', 143, 1, '83.00', 154),
(4996, 'PO00078', 144, 1, '66.00', 157),
(4997, 'PO00078', 148, 1, '63.00', NULL),
(4998, 'PO00078', 152, 1, '44.00', 170),
(4999, 'PO00078', 152, 1, '44.00', 171),
(5000, 'PO00078', 151, 1, '95.00', NULL),
(5001, 'PO00078', 154, 1, '34.00', 176),
(5002, 'PO00078', 171, 3, '24.00', NULL),
(5003, 'PO00078', 172, 1, '71.00', 210),
(5004, 'PO00079', 48, 4, '36.50', 212),
(5005, 'PO00079', 48, 2, '27.50', 211),
(5006, 'PO00079', 121, 1, '62.00', NULL),
(5007, 'PO00079', 126, 1, '58.00', NULL),
(5008, 'PO00079', 130, 1, '75.00', NULL),
(5009, 'PO00079', 161, 1, '95.00', NULL),
(5010, 'PO00080', 166, 1, '129.00', 200),
(5011, 'PO00080', 167, 4, '21.00', 201),
(5012, 'PO00080', 160, 3, '42.00', 192),
(5013, 'PO00080', 160, 3, '42.00', 193),
(5014, 'PO00080', 135, 1, '132.00', 125),
(5015, 'PO00080', 137, 1, '92.00', 135),
(5016, 'PO00080', 143, 1, '72.00', 156),
(5017, 'PO00080', 143, 1, '83.00', 154),
(5018, 'PO00080', 170, 2, '28.00', 206),
(5019, 'PO00080', 170, 2, '28.00', 207),
(5020, 'PO00081', 58, 1, '617.00', NULL),
(5021, 'PO00081', 161, 1, '95.00', NULL),
(5022, 'PO00081', 159, 2, '38.00', 188),
(5023, 'PO00081', 72, 1, '93.00', 95),
(5024, 'PO00081', 72, 1, '114.00', 98),
(5025, 'PO00081', 75, 1, '112.00', 114),
(5026, 'PO00081', 76, 1, '84.00', 119),
(5027, 'PO00081', 41, 2, '22.50', NULL),
(5028, 'PO00081', 63, 3, '23.00', NULL),
(5029, 'PO00081', 70, 2, '26.50', NULL),
(5030, 'PO00081', 69, 4, '32.00', 226),
(5031, 'PO00081', 69, 2, '40.00', 228),
(5032, 'PO00081', 122, 1, '72.00', 72),
(5033, 'PO00081', 124, 1, '58.00', 74),
(5034, 'PO00081', 149, 1, '33.00', NULL),
(5035, 'PO00081', 158, 1, '42.00', 183),
(5036, 'PO00082', 79, 1, '72.00', NULL),
(5037, 'PO00082', 80, 2, '12.00', NULL),
(5038, 'PO00082', 128, 1, '67.00', NULL),
(5039, 'PO00082', 74, 1, '114.00', 106),
(5040, 'PO00082', 72, 1, '93.00', 95),
(5041, 'PO00083', 165, 1, '105.00', NULL),
(5042, 'PO00083', 168, 3, '17.00', 205),
(5043, 'PO00083', 141, 2, '83.00', 150),
(5044, 'PO00083', 79, 2, '72.00', NULL),
(5045, 'PO00083', 144, 1, '41.00', 160),
(5046, 'PO00083', 82, 1, '8.00', NULL),
(5047, 'PO00083', 81, 5, '8.00', NULL),
(5048, 'PO00084', 60, 1, '1554.00', NULL),
(5049, 'PO00084', 107, 1, '84.00', 52),
(5050, 'PO00084', 107, 1, '84.00', 53),
(5051, 'PO00084', 112, 1, '192.00', NULL),
(5052, 'PO00084', 113, 1, '203.00', 55),
(5053, 'PO00084', 152, 1, '44.00', 170),
(5054, 'PO00084', 153, 1, '36.00', 172),
(5055, 'PO00084', 72, 1, '93.00', 95),
(5056, 'PO00084', 76, 1, '84.00', 119),
(5057, 'PO00084', 127, 1, '78.00', 82),
(5058, 'PO00085', 48, 3, '36.50', 212),
(5059, 'PO00085', 48, 3, '41.50', 213),
(5060, 'PO00085', 48, 3, '27.50', 211),
(5061, 'PO00085', 47, 4, '11.75', 247),
(5062, 'PO00085', 47, 2, '19.50', 248),
(5063, 'PO00085', 45, 2, '15.50', 253),
(5064, 'PO00085', 38, 4, '17.50', 229),
(5065, 'PO00085', 38, 3, '22.75', 230),
(5066, 'PO00085', 73, 1, '98.00', 109),
(5067, 'PO00085', 75, 1, '112.00', 114),
(5068, 'PO00086', 143, 1, '0.00', NULL),
(5069, 'PO00086', 143, 1, '83.00', 154),
(5070, 'PO00086', 144, 1, '53.00', 158),
(5071, 'PO00086', 146, 6, '6.50', 163),
(5072, 'PO00086', 146, 6, '6.50', 164),
(5073, 'PO00086', 146, 6, '6.50', 165),
(5074, 'PO00086', 147, 1, '90.00', 167),
(5075, 'PO00086', 65, 3, '29.75', 236),
(5076, 'PO00086', 65, 3, '29.75', 235),
(5077, 'PO00086', 63, 3, '23.00', NULL),
(5078, 'PO00086', 117, 1, '58.00', NULL),
(5079, 'PO00086', 115, 1, '58.00', NULL),
(5080, 'PO00087', 59, 1, '835.00', 260),
(5081, 'PO00087', 62, 5, '16.00', 222),
(5082, 'PO00087', 62, 3, '23.50', 223),
(5083, 'PO00087', 72, 1, '93.00', 95),
(5084, 'PO00087', 69, 3, '32.00', 226),
(5085, 'PO00087', 64, 3, '27.50', 215),
(5086, 'PO00087', 104, 4, '45.00', 48),
(5087, 'PO00087', 98, 3, '33.00', NULL),
(5088, 'PO00087', 89, 3, '21.50', 241),
(5089, 'PO00087', 111, 1, '200.00', NULL),
(5090, 'PO00087', 125, 1, '58.00', NULL),
(5091, 'PO00087', 138, 1, '135.00', 137),
(5092, 'PO00087', 145, 1, '57.00', NULL),
(5093, 'PO00087', 166, 1, '129.00', 199),
(5094, 'PO00088', 47, 1, '74.00', 250),
(5095, 'PO00088', 143, 1, '72.00', 156),
(5096, 'PO00088', 79, 2, '72.00', NULL),
(5097, 'PO00088', 80, 2, '12.00', NULL),
(5098, 'PO00089', 75, 1, '112.00', 114),
(5099, 'PO00089', 76, 1, '84.00', 119),
(5100, 'PO00089', 64, 3, '27.50', 215),
(5101, 'PO00089', 69, 3, '32.00', 226),
(5102, 'PO00089', 151, 1, '95.00', NULL),
(5103, 'PO00089', 152, 1, '44.00', 170),
(5104, 'PO00090', 138, 1, '135.00', 137),
(5105, 'PO00090', 141, 1, '83.00', 150),
(5106, 'PO00090', 79, 1, '72.00', NULL),
(5107, 'PO00090', 143, 1, '83.00', 154),
(5108, 'PO00090', 144, 1, '66.00', 157),
(5109, 'PO00091', 80, 4, '12.00', NULL),
(5110, 'PO00091', 147, 1, '90.00', 167),
(5111, 'PO00091', 145, 1, '57.00', NULL),
(5112, 'PO00091', 115, 1, '58.00', NULL),
(5113, 'PO00091', 120, 1, '58.00', 67),
(5114, 'PO00091', 121, 1, '62.00', NULL),
(5115, 'PO00091', 160, 2, '42.00', 192),
(5116, 'PO00091', 160, 1, '42.00', 193),
(5117, 'PO00091', 159, 2, '38.00', 188),
(5118, 'PO00091', 153, 2, '36.00', 172),
(5119, 'PO00091', 152, 2, '44.00', 170),
(5120, 'PO00091', 149, 1, '33.00', NULL),
(5121, 'PO00092', 72, 1, '93.00', 95),
(5122, 'PO00092', 73, 1, '135.00', 110),
(5123, 'PO00092', 75, 1, '112.00', 114),
(5124, 'PO00092', 48, 3, '27.50', 211),
(5125, 'PO00092', 63, 3, '23.00', NULL),
(5126, 'PO00092', 67, 4, '20.50', 232),
(5127, 'PO00092', 69, 3, '32.00', 226),
(5128, 'PO00092', 135, 1, '132.00', 125),
(5129, 'PO00092', 136, 1, '128.00', 130),
(5130, 'PO00093', 127, 1, '78.00', 82),
(5131, 'PO00093', 129, 1, '77.00', 83),
(5132, 'PO00093', 107, 1, '84.00', 52),
(5133, 'PO00093', 107, 1, '84.00', 53),
(5134, 'PO00093', 119, 1, '58.00', NULL),
(5135, 'PO00093', 120, 1, '58.00', 68),
(5136, 'PO00093', 151, 1, '95.00', NULL),
(5137, 'PO00093', 148, 1, '63.00', NULL),
(5138, 'PO00094', 48, 3, '36.50', 212),
(5139, 'PO00094', 47, 5, '11.75', 247),
(5140, 'PO00094', 60, 1, '1554.00', NULL),
(5141, 'PO00094', 107, 2, '84.00', 53),
(5142, 'PO00094', 113, 1, '203.00', 55),
(5143, 'PO00094', 119, 1, '58.00', NULL),
(5144, 'PO00094', 120, 1, '58.00', 68),
(5145, 'PO00094', 63, 3, '23.00', NULL),
(5146, 'PO00094', 64, 3, '27.50', 215),
(5147, 'PO00095', 31, 1, '301.00', NULL),
(5148, 'PO00095', 151, 1, '95.00', NULL),
(5149, 'PO00095', 149, 1, '33.00', NULL),
(5150, 'PO00095', 150, 1, '37.00', NULL),
(5151, 'PO00095', 157, 1, '0.00', NULL),
(5152, 'PO00095', 157, 1, '88.00', 181),
(5153, 'PO00096', 161, 1, '95.00', NULL),
(5154, 'PO00096', 160, 4, '42.00', 192),
(5155, 'PO00096', 75, 1, '112.00', 114),
(5156, 'PO00096', 72, 1, '93.00', 95),
(5157, 'PO00096', 135, 1, '132.00', 125),
(5158, 'PO00096', 139, 1, '25.00', 140),
(5159, 'PO00096', 38, 3, '22.75', 230),
(5160, 'PO00096', 38, 3, '17.50', 229),
(5161, 'PO00097', 151, 1, '95.00', NULL),
(5162, 'PO00097', 156, 1, '88.00', NULL),
(5163, 'PO00097', 79, 2, '72.00', NULL),
(5164, 'PO00097', 123, 1, '70.00', NULL),
(5165, 'PO00097', 127, 1, '78.00', 75),
(5166, 'PO00097', 127, 1, '78.00', 78),
(5167, 'PO00097', 129, 1, '77.00', 83),
(5168, 'PO00097', 135, 1, '132.00', 126),
(5169, 'PO00097', 138, 1, '135.00', 137),
(5170, 'PO00097', 67, 3, '30.50', 233),
(5171, 'PO00097', 65, 3, '29.75', 236),
(5172, 'PO00097', 65, 3, '29.75', 235),
(5173, 'PO00097', 69, 5, '32.00', 226),
(5174, 'PO00098', 63, 4, '23.00', NULL),
(5175, 'PO00098', 62, 3, '16.00', 222),
(5176, 'PO00098', 62, 3, '23.50', 223),
(5177, 'PO00098', 64, 2, '37.50', 216),
(5178, 'PO00098', 64, 3, '36.50', 238),
(5179, 'PO00098', 66, 4, '26.00', NULL),
(5180, 'PO00098', 121, 1, '62.00', NULL),
(5181, 'PO00098', 125, 1, '58.00', NULL),
(5182, 'PO00098', 158, 1, '42.00', 187),
(5183, 'PO00098', 158, 1, '42.00', 182),
(5184, 'PO00098', 172, 1, '71.00', 210),
(5185, 'PO00099', 58, 2, '617.00', NULL),
(5186, 'PO00099', 60, 1, '1554.00', NULL),
(5187, 'PO00099', 135, 1, '132.00', 127),
(5188, 'PO00099', 135, 1, '132.00', 125),
(5189, 'PO00100', 116, 1, '58.00', 65),
(5190, 'PO00100', 129, 1, '96.00', 84),
(5191, 'PO00100', 69, 4, '40.00', 228),
(5192, 'PO00100', 89, 4, '21.50', 241),
(5193, 'PO00100', 98, 3, '33.00', NULL),
(5194, 'PO00100', 133, 3, '25.00', 89),
(5195, 'PO00100', 133, 4, '25.00', 90),
(5196, 'PO00100', 132, 2, '26.00', 87),
(5197, 'PO00100', 132, 2, '26.00', 88),
(5198, 'PO00100', 72, 1, '114.00', 98),
(5199, 'PO00100', 75, 1, '112.00', 114),
(5200, 'PO00101', 76, 2, '84.00', 119),
(5201, 'PO00101', 80, 4, '12.00', NULL),
(5202, 'PO00101', 143, 1, '83.00', 154),
(5203, 'PO00101', 144, 1, '66.00', 157),
(5204, 'PO00101', 152, 2, '44.00', 170),
(5205, 'PO00102', 34, 1, '189.00', 258),
(5206, 'PO00102', 48, 5, '41.50', 213),
(5207, 'PO00102', 62, 5, '23.50', 223),
(5208, 'PO00102', 136, 1, '128.00', 130),
(5209, 'PO00102', 169, 1, '139.00', NULL),
(5210, 'PO00102', 118, 1, '58.00', NULL),
(5211, 'PO00102', 117, 1, '58.00', NULL),
(5212, 'PO00103', 148, 1, '63.00', NULL),
(5213, 'PO00103', 170, 3, '28.00', 206),
(5214, 'PO00103', 79, 2, '72.00', NULL),
(5215, 'PO00103', 81, 5, '8.00', NULL),
(5216, 'PO00103', 141, 2, '43.00', 149),
(5217, 'PO00103', 142, 3, '21.50', 151),
(5218, 'PO00103', 140, 3, '28.00', 144),
(5219, 'PO00104', 59, 1, '1008.00', 259),
(5220, 'PO00104', 120, 1, '58.00', 69),
(5221, 'PO00104', 122, 1, '72.00', 71),
(5222, 'PO00104', 79, 1, '72.00', NULL),
(5223, 'PO00104', 76, 1, '84.00', 119),
(5224, 'PO00104', 72, 1, '93.00', 95),
(5225, 'PO00105', 41, 3, '22.50', NULL),
(5226, 'PO00105', 47, 4, '11.75', 247),
(5227, 'PO00105', 70, 3, '26.50', NULL),
(5228, 'PO00105', 80, 3, '12.00', NULL),
(5229, 'PO00105', 104, 4, '45.00', 48),
(5230, 'PO00105', 112, 1, '192.00', NULL),
(5231, 'PO00106', 105, 3, '31.00', 50),
(5232, 'PO00106', 109, 1, '150.00', NULL),
(5233, 'PO00106', 107, 1, '84.00', 52),
(5234, 'PO00106', 107, 1, '84.00', 53),
(5235, 'PO00106', 114, 1, '722.00', 58),
(5236, 'PO00106', 128, 1, '67.00', NULL),
(5237, 'PO00107', 105, 3, '31.00', 50),
(5238, 'PO00107', 109, 1, '150.00', NULL),
(5239, 'PO00107', 107, 1, '84.00', 52),
(5240, 'PO00107', 107, 1, '84.00', 53),
(5241, 'PO00107', 114, 1, '722.00', 58),
(5242, 'PO00107', 128, 1, '67.00', NULL),
(5243, 'PO00108', 65, 3, '29.75', 236),
(5244, 'PO00108', 65, 3, '29.75', 235),
(5245, 'PO00108', 118, 1, '58.00', NULL),
(5246, 'PO00108', 121, 1, '62.00', NULL),
(5247, 'PO00108', 75, 1, '100.00', 116),
(5248, 'PO00108', 75, 1, '112.00', 114),
(5249, 'PO00108', 76, 1, '84.00', 119),
(5250, 'PO00109', 79, 2, '72.00', NULL),
(5251, 'PO00109', 58, 1, '617.00', NULL),
(5252, 'PO00109', 111, 1, '200.00', NULL),
(5253, 'PO00109', 126, 1, '58.00', NULL),
(5254, 'PO00109', 115, 1, '58.00', NULL),
(5255, 'PO00110', 148, 1, '63.00', NULL),
(5256, 'PO00110', 153, 1, '36.00', 173),
(5257, 'PO00110', 135, 1, '132.00', 127),
(5258, 'PO00110', 135, 1, '131.00', 128),
(5259, 'PO00110', 142, 4, '21.50', 151),
(5260, 'PO00110', 144, 1, '66.00', 157),
(5261, 'PO00111', 58, 1, '617.00', NULL),
(5262, 'PO00111', 114, 1, '722.00', 58),
(5263, 'PO00111', 47, 1, '74.00', 250),
(5264, 'PO00111', 145, 1, '57.00', NULL),
(5265, 'PO00111', 147, 1, '90.00', 167),
(5266, 'PO00111', 48, 4, '36.50', 212),
(5267, 'PO00111', 67, 3, '20.50', 232),
(5268, 'PO00111', 65, 3, '29.75', 235),
(5269, 'PO00111', 65, 3, '29.75', 236),
(5270, 'PO00112', 79, 2, '72.00', NULL),
(5271, 'PO00112', 120, 1, '58.00', 67),
(5272, 'PO00112', 123, 1, '70.00', NULL),
(5273, 'PO00112', 127, 1, '78.00', 82),
(5274, 'PO00112', 72, 1, '93.00', 95),
(5275, 'PO00112', 75, 1, '112.00', 114),
(5276, 'PO00112', 76, 2, '84.00', 119),
(5277, 'PO00112', 38, 5, '22.75', 230),
(5278, 'PO00112', 48, 3, '27.50', 211),
(5279, 'PO00112', 63, 2, '23.00', NULL),
(5280, 'PO00112', 68, 2, '19.00', 217),
(5281, 'PO00113', 107, 1, '84.00', 52),
(5282, 'PO00113', 107, 1, '84.00', 53),
(5283, 'PO00113', 60, 1, '1554.00', NULL),
(5284, 'PO00113', 112, 1, '192.00', NULL),
(5285, 'PO00113', 136, 1, '128.00', 130),
(5286, 'PO00114', 139, 4, '25.00', 140),
(5287, 'PO00114', 140, 4, '28.00', 144),
(5288, 'PO00114', 138, 1, '135.00', 138),
(5289, 'PO00114', 169, 1, '139.00', NULL),
(5290, 'PO00114', 143, 1, '83.00', 154),
(5291, 'PO00114', 81, 5, '8.00', NULL),
(5292, 'PO00114', 80, 5, '12.00', NULL),
(5293, 'PO00114', 45, 2, '15.50', 253),
(5294, 'PO00115', 72, 1, '255.00', 99),
(5295, 'PO00115', 75, 1, '197.00', 117),
(5296, 'PO00116', 135, 1, '132.00', 125),
(5297, 'PO00116', 135, 1, '132.00', 127),
(5298, 'PO00116', 136, 1, '128.00', 130),
(5299, 'PO00116', 62, 3, '25.00', 224),
(5300, 'PO00116', 64, 2, '37.50', 216),
(5301, 'PO00116', 64, 3, '36.50', 238),
(5302, 'PO00116', 121, 1, '62.00', NULL),
(5303, 'PO00116', 126, 1, '58.00', NULL),
(5304, 'PO00116', 79, 1, '72.00', NULL),
(5305, 'PO00116', 143, 1, '83.00', 154),
(5330, '1024487', 33, 1, '649.00', NULL),
(5331, '0953422', 33, 1, '649.00', NULL),
(5332, '9738002', 33, 1, '649.00', NULL),
(5333, '0769762', 117, 1, '58.00', NULL),
(5342, '1346486', 31, 1, '301.00', NULL),
(5343, '9515823', 31, 1, '301.00', NULL),
(5344, '9771613', 31, 1, '301.00', NULL),
(5345, 'PO00139', 48, 4, '36.50', 212),
(5346, 'PO00139', 63, 3, '23.00', NULL),
(5347, 'PO00139', 64, 4, '36.50', 238),
(5348, 'PO00139', 135, 1, '132.00', 127),
(5349, 'PO00139', 135, 1, '132.00', 125),
(5350, 'PO00139', 169, 1, '139.00', NULL),
(5351, 'PO00139', 141, 5, '22.00', 148),
(5352, 'PO00139', 47, 4, '11.75', 247),
(5353, 'PO00139', 45, 2, '15.50', 253),
(5354, 'PO00139', 143, 1, '83.00', 154),
(5355, 'PO00139', 144, 1, '66.00', 157),
(5356, 'PO00140', 60, 1, '1554.00', NULL),
(5357, 'PO00140', 107, 1, '84.00', 53),
(5358, 'PO00140', 107, 1, '84.00', 52),
(5359, 'PO00140', 59, 1, '1008.00', 259),
(5360, 'PO00140', 72, 2, '93.00', 95),
(5361, 'PO00140', 75, 1, '112.00', 114),
(5362, 'PO00141', 76, 2, '84.00', 119),
(5363, 'PO00141', 139, 6, '25.00', 140),
(5364, 'PO00141', 138, 1, '135.00', 137),
(5365, 'PO00141', 161, 1, '95.00', NULL),
(5366, 'PO00141', 160, 2, '42.00', 192),
(5367, 'PO00141', 160, 2, '42.00', 195),
(5368, 'PO00141', 166, 1, '129.00', 200),
(5369, 'PO00141', 119, 1, '58.00', NULL),
(5370, 'PO00141', 120, 2, '58.00', 70),
(5371, 'PO00141', 121, 1, '62.00', NULL),
(5372, '2701428', 149, 2, '33.00', NULL),
(5373, '1205939', 135, 1, '132.00', 126);
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

-- Data for table: order_reviews
INSERT INTO `order_reviews` (`id`, `order_id`, `user_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(13, '8936241', 1014, 5, 'high quality', '2025-09-16 01:03:35', '2025-09-16 01:03:35');

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
  `paid_at` timestamp NULL DEFAULT NULL,
  `order_data` text,
  `user_id` int DEFAULT NULL,
  `payment_type` varchar(20) DEFAULT 'full_payment',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `remaining_amount` decimal(10,2) DEFAULT NULL,
  `gcash_reference` varchar(255) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `receipt_image` longblob COMMENT 'GCash receipt image data',
  `receipt_filename` varchar(255) DEFAULT NULL COMMENT 'Original filename of the receipt',
  `receipt_mimetype` varchar(100) DEFAULT NULL COMMENT 'MIME type of the receipt image (e.g., image/jpeg)',
  `receipt_filesize` int DEFAULT NULL COMMENT 'File size in bytes',
  `verification_method` enum('reference','receipt') DEFAULT 'reference' COMMENT 'Payment verification method: reference number or receipt upload'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_settings`
--

CREATE TABLE `payment_settings` (
  `id` int NOT NULL,
  `gcash_enabled` tinyint(1) DEFAULT '1',
  `gcash_public_key` varchar(255) DEFAULT NULL,
  `gcash_secret_key` varchar(255) DEFAULT NULL,
  `gcash_environment` enum('test','live') DEFAULT 'test',
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

INSERT INTO `payment_settings` (`id`, `gcash_enabled`, `gcash_public_key`, `gcash_secret_key`, `gcash_environment`, `downpayment_enabled`, `downpayment_percentage`, `min_order_amount`, `created_at`, `updated_at`, `updated_by`) VALUES
(1, 1, NULL, NULL, 'test', 1, 25.00, 500.00, '2025-09-09 17:29:41', '2025-10-21 07:34:02', 20);

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
(31, 'Alfonso 1 1Liter', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 301.00, 889, 'Beverages', 'https://i.ibb.co/jPyMQ6tH/2bf48b084634.png', '2025-03-31 23:21:29', '2025-10-21 06:42:50'),
(32, 'Alfonso 1 700mL', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 234.00, 914, 'Beverages', 'https://i.ibb.co/wjnnCRK/7928f679733c.png', '2025-03-31 23:22:15', '2025-10-21 08:08:20'),
(33, 'Alfonso 1 1.75Liter', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 649.00, 878, 'Beverages', 'https://i.ibb.co/N2t2GD8s/5da50a598cd4.png', '2025-03-31 23:22:59', '2025-10-21 08:18:51'),
(34, 'GSM Mojito', 'offers a refreshing blend of gin infused with mint and lime flavors, reminiscent of a traditional Mojito cocktail. It tends to have a crisp and citrusy profile with a hint of herbal notes from the mint.', 0.00, 72, 'Beverages', 'https://i.ibb.co/60Bw2QX7/6a76cc18e196.png', '2025-03-31 23:28:23', '2025-07-03 18:59:39'),
(36, 'Primera Light 750mL', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 140.00, 70, 'Beverages', 'https://i.ibb.co/0pCHgRnP/6b834d85cc3b.png', '2025-03-31 23:34:49', '2025-10-14 21:40:24'),
(37, 'Primera Light 1Liter', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 189.00, 76, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-03-31 23:35:27', '2025-10-20 18:11:18'),
(38, 'Lucky 7 Corned Beef ', 'organic-free corned beef multipack', 0.00, 196, 'Canned Goods', 'https://i.ibb.co/MD9MDJ5q/d66d18901a73.png', '2025-03-31 23:37:33', '2025-07-03 18:36:10'),
(41, 'Lucky 7 Meat Loaf 150g', 'organic-free corned beef multipack', 22.50, 48, 'Canned Goods', 'https://i.ibb.co/tTMm9hg9/bf73f6e95a5d.png', '2025-03-31 23:42:51', '2025-10-21 06:31:06'),
(45, 'Datu Patis ', '#1 fish sauce in the Philippines.', 0.00, 95, 'Condiments', 'https://i.ibb.co/0Ry6CFm6/51d8ce58dd9f.png', '2025-04-01 01:25:10', '2025-07-03 18:55:44'),
(47, 'UFC Ketchup', 'unique blend of fresh spices and select bananas that provide the tamis anghang (sweet and spicy) flavor. ', 0.00, 100, 'Condiments', 'https://i.ibb.co/j9gnXrxH/cecb6672ce73.png', '2025-04-01 01:27:23', '2025-07-03 18:55:01'),
(48, 'Argentina Corned Beef', 'No. 1 corned beef brand that has the food qualities consumer most value', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/W46GfnGB/d19d7b986670.png', '2025-04-01 01:32:37', '2025-07-03 18:28:05'),
(50, 'Primera Light 1Liter', 'a unique 55-proof brandy liqueur masterpiece', 185.00, 2, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-04-01 01:41:56', '2025-10-21 07:39:14'),
(51, 'May Sparkle Red', 'A non-alcoholic beverage from freshly-pressed and carefully-selected Belgium Grapes.', 0.00, 6, 'Beverages', 'https://i.ibb.co/Wv5gFDjr/d75fc84e5138.png', '2025-04-01 01:43:28', '2025-04-01 09:04:28'),
(52, 'Novellino 750mL', 'Novellino Wild Blackberry is a casual wine vinified from choice vitis vinifera grapes in the tradition of fine Italian winemaking', 270.00, 1, 'Beverages', 'https://i.ibb.co/278v021y/05b8707b2772.png', '2025-04-01 01:45:11', '2025-10-20 09:24:12'),
(53, 'The Bar Dry Gin 335mL ', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 0, 'Beverages', 'https://i.ibb.co/jkNpPRn2/4cd7e58417a4.png', '2025-04-01 01:46:37', '2025-10-21 06:41:59'),
(54, 'The Bar Pink 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 57, 'Beverages', 'https://i.ibb.co/hxGrvfmq/a6f137b5983c.png', '2025-04-01 01:47:16', '2025-10-21 06:31:13'),
(55, 'The Bar Lime 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 6, 'Beverages', 'https://i.ibb.co/8gggkGVx/49ad7f791839.png', '2025-04-01 01:47:46', '2025-08-07 00:31:29'),
(56, 'Emperador 750mL', ' brand of cut brandy and brandy produced by Emperador Inc.', 142.00, 46, 'Beverages', 'https://i.ibb.co/mrbVVg4L/daf1bf6947ad.png', '2025-04-01 01:51:17', '2025-10-20 10:53:00'),
(57, 'Emperador 1Liter', ' brand of cut brandy and brandy produced by Emperador Inc.', 185.00, 46, 'Beverages', 'https://i.ibb.co/VckXJTFG/ecd6f3d61a21.png', '2025-04-01 01:52:01', '2025-08-07 00:31:33'),
(58, 'Red Horse Beer per Case', 'beer', 617.00, 73, 'Beverages', 'https://i.ibb.co/F4fd74z2/2843dba65b63.png', '2025-04-01 09:27:22', '2025-10-21 07:45:09'),
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
(258, 34, '1L', 189.00, 81, NULL),
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
(20, 'adminsiL4ns', '', NULL, '', 'male', 'single', NULL, NULL, NULL, 'admin@gmail.com', '$2a$10$mUmvlJQ0rZiODOSt/wPcS.oB.d2pWNki8eqgruP3jf58KyllhRSnu', '2025-02-14 12:30:57', NULL, NULL, 1, 'admin', NULL, NULL, NULL, 0),
(1014, 'L4nszxc', 'Lans Lorence', 'Navarro', 'Hernandez', 'male', 'single', '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', '2004-07-08 16:00:00', 'lanslorence@gmail.com', '$2a$10$wHLxOlGqtFw9fz3AYyxdgONawElc3V28ZyQ1d..vnH5bVDN/pHGlm', '2025-09-13 21:52:17', NULL, NULL, 1, 'user', NULL, NULL, 'https://i.ibb.co/rK5pDFW6/c16d7f8c3d18.jpg', 0),
(1015, 'L4nszxc123', 'Lans', NULL, 'Navarro', 'other', 'single', '09639447150', 'Zone 3, Ibaba West, Calapan City, Oriental Mindoro', '2004-09-06 16:00:00', 'hernandezlanslorence@gmail.com', '$2a$10$WrITFF7EbUxh5EWK7PXSb.SWkQ5MH5sXYdciQq1YtJWMelRTS5Fqa', '2025-09-14 06:19:04', NULL, NULL, 1, 'user', NULL, NULL, NULL, 0),
(1016, 's_chi', 'Sachilette', NULL, 'Leyesa', 'female', 'single', '09939048662', 'Sitio Pag-Asa, Calapan City Oriental Mindoro', '2004-02-24 16:00:00', 'saaach25@gmail.com', '$2a$10$ZUImT2eunvXR8SSz4tfWxe8XPATGn7D6H9oYB38wBCt/IyHKZgiwy', '2025-09-16 00:20:49', NULL, NULL, 1, 'user', NULL, NULL, 'https://i.ibb.co/spLXdnPQ/07d9b6e689ff.jpg', 0),
(1017, 'EXAMPLE STAFF', 'example', 'of', 'Staff', 'male', 'single', '09127649805', 'Barcenaga, Naujan City, Oriental Mindoro, Philippines', '2004-06-15 16:00:00', 'example@gmail.com', '$2a$10$neXJyarOlVGKHPwnsAj/QOU6IoILfXubUIU0hV5dfTrvZDP/jdUoK', '2025-09-16 00:54:26', NULL, NULL, 1, 'staff', NULL, NULL, NULL, 0),
(1018, 'GS - Len', 'Lenlen', 'Asilo', 'Austria', 'female', 'single', '09952111178', 'Sta. Maria, Naujan,Or.Mindoro', '1996-11-25 16:00:00', 'austrialenlen08@gmail.com', '$2a$10$P82eXcoegGlVFIxK2lkBwuNZMZoBCd48Vef7.Af52Py7T9xs7oaBW', '2025-09-16 23:30:19', NULL, NULL, 1, 'staff', NULL, NULL, NULL, 0),
(1019, 'Ken', 'Ken', NULL, 'Villanueva ', 'male', 'single', '09512783493', 'Sitio Buhuan Comunal', NULL, 'nekpogivillanueva24@gmail.com', '$2a$10$r72wgSquYjqFZT5Qn29HYeVv5Lba7mXI2Qd.NIdm9p/Phx8nNDtHS', '2025-10-08 01:48:13', 'FID46Q', '2025-10-08 02:03:45', 0, 'user', NULL, NULL, NULL, 0),
(1020, 'Aye', 'Yessah Mardel ', 'Delos Santos ', 'Vibas', 'female', 'single', '09947825274', 'Comunal Calapan City Oriental Mindoro ', '2007-03-30 16:00:00', 'yessahmardelvibas@gmail.com', '$2a$10$3Zj8PG8FfiWMuQQgOsgeVOg2AgHNuCihnRHg/IVXhBhdPTua0qIIW', '2025-10-08 01:57:27', NULL, NULL, 1, 'user', NULL, NULL, NULL, 0),
(1021, 'shesnikowl', 'Gybrielle Nicole ', NULL, 'Gacilo', 'female', 'single', '9695130590', 'Comunal, Calapan City, Oriental Mindoro', '2004-03-02 16:00:00', 'nicole.gybrielle3@gmail.com', '$2a$10$yz/KruqXwRfhggVd5WgCe.C.VFyvpF4JAuflLHaOoZlzcTTyTL9hS', '2025-10-09 15:14:56', NULL, NULL, 1, 'user', NULL, NULL, NULL, 0);

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

-- Data for table: user_loyalty_status
INSERT INTO `user_loyalty_status` (`id`, `user_id`, `loyalty_tier_id`, `current_month_spend`, `last_month_spend`, `two_months_ago_spend`, `tier_start_date`, `tier_end_date`, `last_updated`) VALUES
(10, 1014, NULL, '6128.00', '0.00', '0.00', NULL, NULL, '2025-10-08 10:22:13'),
(11, 1021, NULL, '132.00', '0.00', '0.00', NULL, NULL, '2025-10-09 15:19:23');

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

-- Data for table: user_rewards
INSERT INTO `user_rewards` (`id`, `user_id`, `order_id`, `points`, `description`, `created_at`) VALUES
(584, 1014, '2132942', 3, 'Earned points from order #2132942 (₱370.00)', '2025-09-16 01:01:05'),
(585, 1014, '8936241', 3, 'Earned points from order #8936241 (₱370.00)', '2025-09-16 01:01:11'),
(586, 1014, 'PO00132', 3, 'Earned points from order #PO00132 (₱301.00)', '2025-10-07 08:18:54'),
(587, 1014, '1802116', 11, 'Earned points from order #1802116 (₱1117.00)', '2025-10-07 12:51:30'),
(588, 1014, '1024487', 6, 'Earned points from order #1024487 (₱649.00)', '2025-10-07 13:25:01'),
(589, 1014, '0953422', 6, 'Earned points from order #0953422 (₱649.00)', '2025-10-07 13:25:08'),
(590, 1014, '9738002', 6, 'Earned points from order #9738002 (₱649.00)', '2025-10-07 14:00:16'),
(591, 1014, '5167329', 5, 'Earned points from order #5167329 (₱560.00)', '2025-10-08 08:37:35'),
(592, 1014, '2368681', 5, 'Earned points from order #2368681 (₱560.00)', '2025-10-08 08:37:43'),
(593, 1014, '1346486', 3, 'Earned points from order #1346486 (₱301.00)', '2025-10-08 09:59:27'),
(594, 1014, '9515823', 3, 'Earned points from order #9515823 (₱301.00)', '2025-10-08 10:13:59'),
(595, 1014, '9771613', 3, 'Earned points from order #9771613 (₱301.00)', '2025-10-08 10:22:13'),
(596, 1021, '1205939', 1, 'Earned points from order #1205939 (₱132.00)', '2025-10-09 15:19:23');

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
  ADD KEY `idx_verification_method` (`verification_method`),
  ADD KEY `idx_receipt_filename` (`receipt_filename`),
  ADD KEY `idx_status_verification` (`status`,`verification_method`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2491977;

--
-- AUTO_INCREMENT for table `loyalty_tiers`
--
ALTER TABLE `loyalty_tiers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1678;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4381;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `user_rewards`
--
ALTER TABLE `user_rewards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=618;

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
