-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 03, 2025 at 04:49 PM
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
(62, 58, 10.00, '2025-07-03 14:54:02', '2025-08-02 14:54:02', 1, '4757422'),
(63, 58, 5.00, '2025-07-03 15:17:58', '2025-08-02 15:17:58', 1, '3333057'),
(64, 58, 5.00, '2025-07-03 15:25:51', '2025-08-02 15:25:51', 1, '3687453');

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
  `cash_amount` decimal(10,2) DEFAULT NULL,
  `change_amount` decimal(10,2) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `is_physical_order` tinyint(1) DEFAULT '0',
  `packaging_preference` enum('eco','plastic') DEFAULT 'eco'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `total_amount`, `status`, `created_at`, `updated_at`, `cancel_reason`, `accepted_by`, `accepted_at`, `cash_amount`, `change_amount`, `customer_name`, `is_physical_order`, `packaging_preference`) VALUES
('0200807', 58, 649.00, 'cancelled', '2025-07-03 16:39:55', '2025-07-03 16:46:51', 'Changed my mind', NULL, NULL, NULL, NULL, NULL, 0, 'eco'),
('0808688', 58, 141.00, 'paid', '2025-07-03 16:25:32', '2025-07-03 16:25:47', NULL, 23, '2025-07-04 00:25:36', 200.00, 59.00, NULL, 0, 'eco'),
('0841191', 58, 649.00, 'cancelled', '2025-07-03 16:31:32', '2025-07-03 16:46:57', 'Found better price elsewhere', NULL, NULL, NULL, NULL, NULL, 0, 'eco'),
('1248147', 58, 141.00, 'cancelled', '2025-07-03 16:39:11', '2025-07-03 16:47:01', 'Ordered by mistake', NULL, NULL, NULL, NULL, NULL, 0, 'eco'),
('2015882', 58, 141.00, 'cancelled', '2025-07-03 16:45:51', '2025-07-03 16:46:48', 'Changed my mind', NULL, NULL, NULL, NULL, NULL, 0, 'plastic'),
('2056774', 58, 200.00, 'cancelled', '2025-07-03 16:38:42', '2025-07-03 16:46:55', 'zcx', NULL, NULL, NULL, NULL, NULL, 0, 'eco'),
('5369343', 58, 705.00, 'paid', '2025-07-03 16:30:59', '2025-07-03 16:32:37', NULL, 23, '2025-07-04 00:32:24', 10000.00, 9295.00, NULL, 0, 'eco'),
('5608042', 58, 20.00, 'cancelled', '2025-07-03 16:31:48', '2025-07-03 16:46:59', 'Changed my mind', NULL, NULL, NULL, NULL, NULL, 0, 'eco'),
('7214359', 58, 3245.00, 'paid', '2025-07-03 16:21:31', '2025-07-03 16:21:47', NULL, 23, '2025-07-04 00:21:36', 4000.00, 755.00, NULL, 0, 'eco'),
('9569324', 58, 3245.00, 'paid', '2025-07-03 16:47:19', '2025-07-03 16:47:35', NULL, 23, '2025-07-04 00:47:25', 4000.00, 755.00, NULL, 0, 'plastic');

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
(1798, '7214359', 33, 5, 649.00, NULL),
(1799, '0808688', 34, 1, 141.00, NULL),
(1800, '5369343', 34, 5, 141.00, NULL),
(1801, '0841191', 33, 1, 649.00, NULL),
(1802, '5608042', 45, 1, 20.00, 93),
(1803, '2056774', 71, 8, 25.00, NULL),
(1804, '1248147', 34, 1, 141.00, NULL),
(1805, '0200807', 33, 1, 649.00, NULL),
(1806, '2015882', 34, 1, 141.00, NULL),
(1807, '9569324', 33, 5, 649.00, NULL);

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
(32, 'Alfonso 1 700mL', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 234.00, 983, 'Beverages', 'https://i.ibb.co/wjnnCRK/7928f679733c.png', '2025-04-01 07:22:15', '2025-07-03 16:00:33'),
(33, 'Alfonso 1 1.75Liter', 'brandy-type spirit prepared with medium and high-strength wine spirits, 77% and 94% Alc./Vol. aged in oak casks. ', 649.00, 922, 'Beverages', 'https://i.ibb.co/N2t2GD8s/5da50a598cd4.png', '2025-04-01 07:22:59', '2025-07-03 16:47:19'),
(34, 'GSM Mojito 700mL', 'offers a refreshing blend of gin infused with mint and lime flavors, reminiscent of a traditional Mojito cocktail. It tends to have a crisp and citrusy profile with a hint of herbal notes from the mint.', 141.00, 63, 'Beverages', 'https://i.ibb.co/60Bw2QX7/6a76cc18e196.png', '2025-04-01 07:28:23', '2025-07-03 16:47:01'),
(35, 'GSM Mojito 1L', 'offers a refreshing blend of gin infused with mint and lime flavors, reminiscent of a traditional Mojito cocktail. It tends to have a crisp and citrusy profile with a hint of herbal notes from the mint.', 189.00, 972, 'Beverages', 'https://i.ibb.co/vvP01sRS/00058af3eb33.png', '2025-04-01 07:28:48', '2025-06-26 07:34:33'),
(36, 'Primera Light 750mL', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 140.00, 79, 'Beverages', 'https://i.ibb.co/0pCHgRnP/6b834d85cc3b.png', '2025-04-01 07:34:49', '2025-06-13 18:26:04'),
(37, 'Primera Light 1Liter', 'A unique 55-proof brandy liqueur masterpiece made with fine imported ingredients from Spain. It is exquisitely blended with Solera Gran Reserva Brandy concentrate. Gives a distinctly flavorful aroma and exceptional taste. Delivering a light character and smooth throat-feel.', 189.00, 95, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-04-01 07:35:27', '2025-05-09 13:17:45'),
(38, 'Lucky 7 Corned Beef ', 'organic-free corned beef multipack', 17.50, 195, 'Canned Goods', 'https://i.ibb.co/MD9MDJ5q/d66d18901a73.png', '2025-04-01 07:37:33', '2025-07-03 15:00:42'),
(41, 'Lucky 7 Meat Loaf 100g', 'organic-free corned beef multipack', 23.00, 45, 'Canned Goods', 'https://i.ibb.co/tTMm9hg9/bf73f6e95a5d.png', '2025-04-01 07:42:51', '2025-06-26 07:34:33'),
(45, 'Datu Patis ', '#1 fish sauce in the Philippines.', 0.00, 50, 'Condiments', 'https://i.ibb.co/0Ry6CFm6/51d8ce58dd9f.png', '2025-04-01 09:25:10', '2025-06-26 08:07:51'),
(47, 'UFC Ketchup', 'unique blend of fresh spices and select bananas that provide the tamis anghang (sweet and spicy) flavor. ', 11.75, 100, 'Condiments', 'https://i.ibb.co/j9gnXrxH/cecb6672ce73.png', '2025-04-01 09:27:23', '2025-04-09 06:24:47'),
(48, 'Argentina Corned Beef', 'No. 1 corned beef brand that has the food qualities consumer most value', 27.50, 100, 'Canned Goods', 'https://i.ibb.co/W46GfnGB/d19d7b986670.png', '2025-04-01 09:32:37', '2025-04-08 21:09:32'),
(50, 'Primera Light 1Liter', 'a unique 55-proof brandy liqueur masterpiece', 185.00, 17, 'Beverages', 'https://i.ibb.co/ZjVBQQm/54ecebf9dc9f.png', '2025-04-01 09:41:56', '2025-06-11 19:20:28'),
(51, 'May Sparkle Red', 'A non-alcoholic beverage from freshly-pressed and carefully-selected Belgium Grapes.', 0.00, 6, 'Beverages', 'https://i.ibb.co/Wv5gFDjr/d75fc84e5138.png', '2025-04-01 09:43:28', '2025-04-01 17:04:28'),
(52, 'Novellino 750mL', 'Novellino Wild Blackberry is a casual wine vinified from choice vitis vinifera grapes in the tradition of fine Italian winemaking', 270.00, 2, 'Beverages', 'https://i.ibb.co/278v021y/05b8707b2772.png', '2025-04-01 09:45:11', '2025-07-03 15:00:42'),
(53, 'The Bar Dry Gin 335mL ', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 2, 'Beverages', 'https://i.ibb.co/jkNpPRn2/4cd7e58417a4.png', '2025-04-01 09:46:37', '2025-07-03 14:58:00'),
(54, 'The Bar Pink 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 58, 'Beverages', 'https://i.ibb.co/hxGrvfmq/a6f137b5983c.png', '2025-04-01 09:47:16', '2025-05-19 06:14:33'),
(55, 'The Bar Lime 335mL', ' a world-class gin infused with imported botanicals from Spain that gives it a delicious burst of flavor not found in local gin products', 55.00, 5, 'Beverages', 'https://i.ibb.co/8gggkGVx/49ad7f791839.png', '2025-04-01 09:47:46', '2025-07-03 15:10:26'),
(56, 'Emperador 750mL', ' brand of cut brandy and brandy produced by Emperador Inc.', 142.00, 50, 'Beverages', 'https://i.ibb.co/mrbVVg4L/daf1bf6947ad.png', '2025-04-01 09:51:17', '2025-04-01 17:18:46'),
(57, 'Emperador 1Liter', ' brand of cut brandy and brandy produced by Emperador Inc.', 185.00, 49, 'Beverages', 'https://i.ibb.co/VckXJTFG/ecd6f3d61a21.png', '2025-04-01 09:52:01', '2025-06-12 08:45:48'),
(58, 'Red Horse Beer per Case', 'beer', 617.00, 79, 'Beverages', 'https://i.ibb.co/F4fd74z2/2843dba65b63.png', '2025-04-01 17:27:22', '2025-06-12 09:26:02'),
(59, 'San Mig Light || Apple per Case', 'flavored beer', 835.00, 52, 'Beverages', 'https://i.ibb.co/dwTNCfJV/b0926c017020.png', '2025-04-08 20:30:05', '2025-04-08 21:03:32'),
(60, 'Ginebra per Case', 'delivers a clean, juniper-forward taste, complemented by subtle hints of citrus and spice', 1554.00, 200, 'Beverages', 'https://i.ibb.co/C3MZ5YvK/0b2cffba62af.png', '2025-04-08 20:59:46', '2025-04-08 20:59:46'),
(61, 'San Miguel Beer per case', 'full-flavored taste complements its pleasant aroma, making it a perfectly balanced beer', 599.00, 26, 'Beverages', 'https://i.ibb.co/FqyQ2D5Z/2b8cb868bbda.png', '2025-04-08 21:03:06', '2025-07-03 16:00:23'),
(62, 'Argentina Meat Loaf', 'made from quality meat that\'s seasoned with the most flavorful yet kid-friendly spices', 16.00, 99, 'Canned Goods', 'https://i.ibb.co/zTRL3z2K/67acda401865.png', '2025-04-08 21:13:02', '2025-04-20 17:03:04'),
(63, 'Wow Ulam', 'brand of canned and fresh processed meat products from Century Pacific Food Inc.', 23.00, 99, 'Canned Goods', 'https://i.ibb.co/nNMdv4zm/8eaa96b1b065.png', '2025-04-08 22:09:14', '2025-06-11 17:20:10'),
(64, 'Century Tuna', 'a leading canned tuna brand in the Philippines, known for its healthy, delicious, and convenient options,', 27.50, 100, 'Canned Goods', 'https://i.ibb.co/FbXNJm1m/c00050cbdeba.png', '2025-04-08 22:14:26', '2025-04-08 22:14:26'),
(65, 'Blue Bay', 'Manamis-namis. Deliciously irresistible. Unmistakably fresh. The sea`s bounty and farm`s harvest make one delightful feast.', 29.75, 199, 'Canned Goods', 'https://i.ibb.co/vxtvqDpM/cc9c981cfeb3.png', '2025-04-08 22:18:53', '2025-06-15 21:14:26'),
(66, '555 Tuna', 'the “Super Ulam Pinoy” because it is rich in calcium for stronger bones, protein for muscle building, lycopene for cancer prevention', 26.00, 49, 'Canned Goods', 'https://i.ibb.co/Y7jbJpZ9/0f06ee53e48d.png', '2025-04-08 22:21:01', '2025-04-20 17:03:16'),
(67, 'CDO Karne Norte', 'a Filipino-style corned beef that has a delicious guisado taste', 20.50, 99, 'Canned Goods', 'https://i.ibb.co/KjNHwTmS/6ef04ff0da58.png', '2025-04-08 22:23:53', '2025-06-13 18:36:15'),
(68, 'Bingo Corned Beef', 'a canned, ready-to-eat corned beef product, specially prepared with beef and savory seasonings, and fortified with zinc and iron', 19.00, 50, 'Canned Goods', 'https://i.ibb.co/BH4TXJBC/d226081191f0.png', '2025-04-08 22:26:27', '2025-04-08 22:26:27'),
(69, 'San Marino', 'has the delicious taste and health benefits of tuna', 32.00, 100, 'Canned Goods', 'https://i.ibb.co/ns3PXZPS/e9feba69ac43.png', '2025-04-08 22:34:10', '2025-04-08 22:34:10'),
(70, 'Fresca Tuna', 'It\'s a great alternative to the usual sardines, giving you more value for your money while staying within your budget.', 26.50, 100, 'Canned Goods', 'https://i.ibb.co/j9QJQfM7/2e963da1932c.png', '2025-04-08 22:37:38', '2025-04-08 22:37:38'),
(71, 'Hunts Pork and Beans', '#1 brand of Pork & Beans in the Philippines. It is made from high quality Great Northern Beans and real pork bits covered in rich, thick, sweet tomato sauce.', 25.00, 50, 'Canned Goods', 'https://i.ibb.co/rGVdMcgd/716c7cd11ed1.png', '2025-04-08 22:39:42', '2025-07-03 16:46:55'),
(72, 'Bear Brand', ' a Nestlé-owned milk brand, particularly popular in the Philippines, offering both sterilized milk and fortified powdered milk drinks, known for providing essential nutrients and supporting overall health and well-being. ', 37.00, 50, 'Milk and Chocolate Drink', 'https://i.ibb.co/1fKNBZTT/b2969e594b9d.png', '2025-04-08 22:52:24', '2025-04-08 22:52:24'),
(73, 'Bear Brand Adult', 'a powdered milk drink specially formulated for adults aged 19-29, designed to provide essential nutrients, including calcium, vitamin D, and B-vitamins, to support energy and immunity, and help close daily nutrition gaps. ', 98.00, 14, 'Milk and Chocolate Drink', 'https://i.ibb.co/3mr1fM35/60153400556e.png', '2025-04-08 22:58:08', '2025-04-20 17:00:51'),
(74, 'Bear Brand Choco', ' a chocolate-flavored powdered milk drink fortified with essential nutrients like iron, zinc, and vitamin C, designed for individuals aged 3 and up to support strong immunity and overall well-being', 93.00, 20, 'Milk and Chocolate Drink', 'https://i.ibb.co/nMPC557v/b9527d3d54b3.png', '2025-04-08 23:00:50', '2025-06-11 16:38:11'),
(75, 'Milo', 'a chocolate-flavored malted beverage powder created by Nestlé, known for its unique choco-malty flavor and often mixed with milk or water to create a nutritious and delicious drink, especially popular among children and those seeking an energy boost. ', 54.00, 5, 'Milk and Chocolate Drink', 'https://i.ibb.co/7NrmLyxz/6d157cac0a1f.png', '2025-04-08 23:05:20', '2025-06-11 15:29:15'),
(76, 'Birch Tree', ' known for its affordable price and high-quality nutrition, with a focus on fortified milk for children and adults. ', 51.00, 22, 'Milk and Chocolate Drink', 'https://i.ibb.co/xK9CjyBV/e407420a9dcb.png', '2025-04-08 23:10:11', '2025-04-20 17:03:16'),
(77, 'Del Monte Ketchup', 'made from real, high-quality tomatoes, naturally contains lycopene, and is guaranteed to have no preservatives, offering a rich tomato flavor and a sweet-sour taste for delicious dips and meals', 49.00, 17, 'Condiments', 'https://i.ibb.co/jmzv3ZM/728ac9940fe7.png', '2025-04-09 06:48:17', '2025-07-03 14:54:20'),
(78, 'Lorins Patis', 'a popular, tangy Filipino fish sauce, ideal as a dipping sauce or cooking ingredient for a wide variety of dishes, including seafood, meat, poultry, vegetables, and Filipino favorites like sinigang and nilaga. ', 27.00, 20, 'Condiments', 'https://i.ibb.co/3yZ5qszC/df3e929a28ec.png', '2025-04-09 07:02:19', '2025-04-09 07:03:39'),
(79, 'Sugar per kg', 'brown and white refined', 72.00, 300, 'Condiments', 'https://i.ibb.co/xK5TGqzf/2eb5e49aefb7.png', '2025-04-09 07:06:43', '2025-04-09 07:12:13'),
(80, 'Salt per kg', 'sea salt', 12.00, 200, 'Condiments', 'https://i.ibb.co/j9LdB8xH/50a57d229f22.png', '2025-04-09 07:08:19', '2025-04-09 07:08:19'),
(81, 'Paminta per Tie', 'whole and ground black pepper', 8.00, 100, 'Condiments', 'https://i.ibb.co/N6RqFRg8/3912cb5cc3e9.png', '2025-04-09 07:10:07', '2025-04-09 07:10:07'),
(82, 'Laurel per Tie', 'is an evergreen plant used to add flavor to dishes. It is used in cuisines all over the world for flavoring especially stews and broths, marinades, meat and fish dishes, gravies, and game.', 8.00, 30, 'Condiments', 'https://i.ibb.co/1Gg3Rqmt/c68fa580806f.png', '2025-04-09 07:11:30', '2025-06-11 15:32:15'),
(83, 'Mafran Banana Catsup', 'formulated from choice spices, natural flavor and aroma of banana', 95.00, 12, 'Condiments', 'https://i.ibb.co/jP5X36rq/dc20ac6e0fce.png', '2025-04-09 07:13:42', '2025-04-09 07:13:42'),
(84, 'Dip Catsup Gallon', 'often used as a dip or a topping for various dishes, characterized by its sweet and tangy flavor', 99.00, 12, 'Condiments', 'https://i.ibb.co/KjDjv9WP/00bb85cf904b.png', '2025-04-09 07:15:01', '2025-04-09 07:15:01'),
(85, '555 Karne Norte', ' a locally manufactured corned beef, known for its quality and affordability, made with selected beef, hashed, and hygienically processed under international standards, ready to eat. ', 20.00, 30, 'Canned Goods', 'https://i.ibb.co/xtWHP4pc/d786693a1768.png', '2025-04-09 07:17:10', '2025-06-11 15:32:15'),
(86, '555 Tausi', 'a popular Filipino canned food featuring fried sardines in a savory-sweet sauce with the distinct flavor of fermented black beans (tausi)', 33.00, 10, 'Canned Goods', 'https://i.ibb.co/B5zmwwY5/47dcc1b0cebc.png', '2025-04-09 07:18:12', '2025-04-09 07:18:12'),
(89, 'Lucky 7 Sardines', ' a budget-friendly, canned sardine option in tomato sauce, known for their savory taste and affordability, making them a popular choice for daily meals. ', 21.50, 45, 'Canned Goods', 'https://i.ibb.co/JRzY9m7R/054a358ac5dc.png', '2025-04-09 07:26:01', '2025-04-22 06:34:17'),
(90, 'Atami Sardines', 'A delightful and flavorful seafood choice that combines the natural goodness of sardines', 23.00, 50, 'Canned Goods', 'https://i.ibb.co/sdNR2j4f/0f5b60542f2a.png', '2025-04-09 07:28:21', '2025-04-09 07:28:21'),
(91, 'Master Sardines', 'known for their premium quality, sourced from the depths of the ocean and expertly preserved to retain natural flavors and nutritional goodness, with a focus on a quick catch-to-can process. ', 25.50, 99, 'Canned Goods', 'https://i.ibb.co/ksGrTmWD/8c3590d7e350.png', '2025-04-09 07:31:56', '2025-06-13 18:46:19'),
(92, 'trytry test', 'jm garis', 100.00, 20, 'Beverages', 'https://i.ibb.co/pjrnNm07/59cc32c572c3.jpg', '2025-05-19 07:05:23', '2025-06-11 16:38:19'),
(95, 'trytryzxczxc', 'zxc', 0.00, 100, 'Coffee and Creamer', 'https://i.ibb.co/gbgf00bt/65560c328868.jpg', '2025-06-14 01:53:44', '2025-06-15 20:47:37'),
(96, 'trytryzxczxctry', 'zxcxzcxzczx', 100.00, 40, 'Coffee and Creamer', 'https://i.ibb.co/DH46fpwY/16f540a83f32.jpg', '2025-06-14 02:05:40', '2025-06-15 20:55:01'),
(97, 'Saba Mackarel', 'Saba mackerel, also known as Japanese mackerel or blue mackerel, is a flavorful and oily fish, particularly prized in Japanese cuisine', 0.00, 120, 'Canned Goods', 'https://i.ibb.co/ZRkbT3RJ/0e0921a17a8a.png', '2025-06-18 20:49:21', '2025-06-18 23:20:57'),
(98, 'Mega Mackarel', 'Mega Mackerel is a canned mackerel product known for its big, flavorful chunks and versatility in Filipino dishes.', 33.00, 24, 'Canned Goods', 'https://i.ibb.co/6cB1crnb/dd7ac057568c.png', '2025-06-18 20:51:19', '2025-06-18 20:51:19'),
(99, 'Saba Sardines Large', 'Saba sardines are a popular brand of canned sardines known for their firm, meaty texture and distinct flavor, particularly in the Philippines. ', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/rfs5Z80w/b381e12b66d0.png', '2025-06-18 20:53:45', '2025-06-19 09:30:25'),
(100, 'Saba Squid', 'Saba squid, specifically referring to products like \"Saba Squid in Soy Sauce\" or \"Saba Squid Sisig,\" is a Filipino delicacy featuring tender squid pieces cooked and preserved in a savory sauce, often with soy sauce and chili. ', 0.00, 70, 'Canned Goods', 'https://i.ibb.co/0jfpC22s/6b0257b01d55.png', '2025-06-18 20:56:21', '2025-06-19 09:30:44'),
(101, 'Mega Squid', 'A mega squid, as depicted in The Future is Wild, is a large, terrestrial, omnivorous animal, standing 4 meters tall and weighing 8 tonnes, with a body structure that is a mix of squid and terrestrial animal features', 0.00, 30, 'Canned Goods', 'https://i.ibb.co/CsXsKJQT/bb0835eb7714.png', '2025-06-18 20:58:29', '2025-06-18 23:25:50'),
(102, 'Rosebowl Sardines', 'They are a classic and well-regarded brand, often described as a favorite among many generations. The sardines are packed in a flavorful tomato sauce, and some varieties include a spicy chili kick', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/MyCtkwpC/da06407e203a.png', '2025-06-18 21:01:09', '2025-06-19 09:28:34'),
(103, 'MaLing', 'Maling is a brand of canned luncheon meat, often made with pork, that is popular in Asia, particularly in the Philippines and other Southeast Asian countries. It\'s known for its savory and slightly salty flavor, smooth texture, and versatility in various dishes. ', 0.00, 48, 'Canned Goods', 'https://i.ibb.co/SzRjMZP/499e0e083344.png', '2025-06-18 21:03:03', '2025-06-19 09:31:03'),
(104, 'TigaBunga Squid', 'Tiga Bunga is a brand known for its canned squid in natural ink', 0.00, 62, 'Canned Goods', 'https://i.ibb.co/hNbLLDr/0afd5347f839.png', '2025-06-18 21:05:07', '2025-06-19 09:37:51'),
(105, 'Reno Liver Spread', 'Reno Liver Spread is a Filipino canned liver spread, typically made from a mixture of pureed pork liver, poultry meat, cereals, vegetable oil, and spices.', 0.00, 160, 'Canned Goods', 'https://i.ibb.co/ZRds181S/2d7e7dcbc1ad.png', '2025-06-18 21:11:53', '2025-06-19 09:29:20'),
(106, 'Philips Sausage', 'Philips is a well-known food brand in the Philippines, recognized for its canned goods, particularly its Vienna sausage. Philips Vienna Sausage is known for its quality and affordable price, making it a popular choice for Filipino families.', 26.00, 30, 'Canned Goods', 'https://i.ibb.co/1fXgkHCY/93501a584679.png', '2025-06-18 21:13:30', '2025-06-18 21:13:30'),
(107, 'Koolers per Box', 'Koolers is a brand of juice drinks known for their fruity and refreshing flavors, often marketed as a fun and healthy way to start the day', 0.00, 200, 'Beverages', 'https://i.ibb.co/zhdYJH9K/9cd95abc48cc.png', '2025-06-18 21:18:31', '2025-06-19 09:38:09'),
(108, 'Wilkins 7 Liter', 'a brand of purified drinking water, recognized for its quality and safety.', 88.00, 12, 'Beverages', 'https://i.ibb.co/yn8NpYs2/67e034629cb9.png', '2025-06-18 21:20:07', '2025-06-18 21:20:07'),
(109, 'Refresh Mineral 350mL (sold per case)', 'a brand of bottled water known for its natural, clean taste, sourced directly from springs, and its eco-friendly packaging', 150.00, 20, 'Beverages', 'https://i.ibb.co/F13xwP6/641c5d6df4ec.png', '2025-06-18 21:21:40', '2025-06-18 21:21:40'),
(110, 'Cobra (per case)', 'Cobra is an energy drink, primarily available in the Philippines, known for its orange flavor and ability to provide an energy boost', 207.00, 20, 'Beverages', 'https://i.ibb.co/n8ZzykdX/79aa8145fe83.png', '2025-06-18 21:24:11', '2025-06-18 21:24:11'),
(111, 'Sting (per case)', 'Sting is a carbonated energy drink, produced by PepsiCo Vietnam, designed to provide a boost of energy and focus.', 200.00, 30, 'Beverages', 'https://i.ibb.co/DfwDcqLh/ad3f161a5e26.png', '2025-06-18 21:25:06', '2025-06-18 21:25:06'),
(112, 'Mountain Dew (per case)', 'Mountain Dew is a citrus-flavored, caffeinated soft drink known for its unique, tangy taste and vibrant, slightly neon green color. It\'s a popular choice for those seeking a refreshing, energizing beverage, often enjoyed during activities or with meals.', 192.00, 30, 'Beverages', 'https://i.ibb.co/YBRdJfsP/d62cc77c8cd9.png', '2025-06-18 21:25:58', '2025-06-18 21:25:58'),
(113, 'Coke/Royal/Sprite Mismo (per case)', 'Coke, Royal, and Sprite, all from The Coca-Cola Company, are popular carbonated soft drinks.', 0.00, 200, 'Beverages', 'https://i.ibb.co/ksMvMh8H/eccf0110a173.png', '2025-06-18 21:28:32', '2025-06-18 21:31:28'),
(114, '1.5L Coke/Royal/Sprite (per case)', 'Coke, Royal, and Sprite, all from The Coca-Cola Company, are popular carbonated soft drinks.', 0.00, 30, 'Beverages', 'https://i.ibb.co/Y7W1c1pc/5ca33bf6a13a.png', '2025-06-18 21:31:03', '2025-06-19 09:38:30'),
(115, 'Rebisco Crackers', 'Rebisco Crackers are a classic Filipino snack known for their light, crispy texture and subtle, slightly salty taste. ', 58.00, 10, 'Biscuits', 'https://i.ibb.co/dsfRcZN6/130d3bde1284.png', '2025-06-18 22:31:05', '2025-06-18 22:31:05'),
(116, 'Flavored Rebisco Crackers', 'Rebisco offers a variety of flavored cracker sandwiches with creamy fillings. Popular flavors include chocolate, strawberry, cream, and butter, often sold in packs of 10. Some also feature peanut butter or pastillas fillings. Rebisco also offers whole wheat crackers and other flavored options like honey butter. ', 0.00, 90, 'Biscuits', 'https://i.ibb.co/9k7PNJ5m/4a91171d5a1d.png', '2025-06-18 22:34:03', '2025-06-19 09:38:48'),
(117, 'Frootees', 'Frootees are a line of flavored shortcake cookies, marketed as a nutritious and filling snack for kids. They are known for being high in Vitamin C and Zinc, which are believed to boost the immune system and potentially improve focus.', 58.00, 150, 'Biscuits', 'https://i.ibb.co/yBPRRSdC/ab0f7e9ac462.png', '2025-06-18 22:38:31', '2025-06-18 22:38:31'),
(118, 'Rebisco Extreme', 'Rebisco Extreme is a chocolate-flavored biscuit that features a combination of chocolate crackers, a chocolate filling, a chocolate coating, and chocolate sprinkles', 58.00, 150, 'Biscuits', 'https://i.ibb.co/S73MB8X3/41a3498b084b.png', '2025-06-18 22:39:14', '2025-06-18 22:39:14'),
(119, 'Hansel Crackers', '12 pieces of creamy, sweet-salty plain crackers perfect for sharing with the family! Best paired with coffee, juice, spreads and toppings to cap off a long day with your loved ones!', 58.00, 150, 'Biscuits', 'https://i.ibb.co/TD3tB6wp/ee0a6c972314.png', '2025-06-18 22:40:24', '2025-06-18 22:40:24'),
(120, 'Flavored Hansel', 'Hansel sandwiches are soft, salty-sweet biscuit sandwiches with a creamy filling, available in a variety of flavors. They are known for their distinct aroma and are a popular Filipino snack. The \"Flavor Bunch\" variety includes Mocha, Milk, Chocolate, Butter, and Milky Strawberry flavors. ', 0.00, 750, 'Biscuits', 'https://i.ibb.co/bMM1N0hJ/e97cce0da8f0.png', '2025-06-18 22:44:52', '2025-06-19 09:39:05'),
(121, 'Combi', 'Combi biscuits, specifically the Rebisco Combi Triple Choco, are a snack consisting of a chocolate cream filling sandwiched between a crunchy chocolate cracker and a chocolate wafer.', 62.00, 60, 'Biscuits', 'https://i.ibb.co/1JjyTthp/80e642aa710b.png', '2025-06-18 22:45:46', '2025-06-18 22:45:46'),
(122, 'Choco Mucho (per box)', 'Choco Mucho biscuits are bite-sized treats known for their combination of rolled wafer, caramel, rice crispies, and creamy chocolate. ', 0.00, 50, 'Biscuits', 'https://i.ibb.co/67LSfJWD/6addd661a002.png', '2025-06-18 22:48:20', '2025-06-18 23:29:31'),
(123, 'Wafertime Rich Cream', 'Wafertime Rich Cream biscuits are flat wafer sandwiches with a rich, creamy filling. Rebisco\'s Wafertime Rich Cream in particular, features a deliciously rich chocolate filling abundantly present in every bite. ', 70.00, 20, 'Biscuits', 'https://i.ibb.co/G3ftYQdJ/3ee6834bd091.png', '2025-06-18 22:50:17', '2025-06-18 22:50:17'),
(124, 'Super Thin ', 'Super thin biscuits are light, crispy, and delicate crackers, often described as having the texture of a chip. They are known for their thinness and satisfying crunch, often paired with a subtle sweetness and a hint of milk flavor. ', 0.00, 20, 'Biscuits', 'https://i.ibb.co/5X7t0yFM/8fb7551ce701.png', '2025-06-18 22:51:38', '2025-06-18 23:20:35'),
(125, 'Bravo Biscuit', 'known for their unique sweet-salty taste and are packed with vitamins B1, B2, and E. They feature a blend of sugar and sesame seeds, offering a distinctive flavor profile', 58.00, 20, 'Biscuits', 'https://i.ibb.co/Kc304qg6/fd1dbaceef5e.png', '2025-06-18 22:52:55', '2025-06-18 22:52:55'),
(126, 'Rebisco Honey Butter', 'Rebisco Honey Butter Crackers are crunchy, sweet and savory biscuits. They are flavored with honey and butter, and have a subtle sweetness from the honey and a rich, buttery taste.', 58.00, 10, 'Biscuits', 'https://i.ibb.co/WvyTfVmf/b17663b06ee9.png', '2025-06-18 23:07:04', '2025-06-18 23:07:04'),
(127, 'Fudgee Bar', 'Fudgee Barr is a popular Philippine snack, Fudgee Barr is available in various flavors, including chocolate, macapuno (coconut), milk, vanilla, mocha, and salted caramel. A combo pack with assorted flavors is also available. ', 0.00, 200, 'Biscuits', 'https://i.ibb.co/W4FMNyVL/6c0d792aad26.png', '2025-06-18 23:11:39', '2025-06-19 09:39:32'),
(128, 'Cupp Keyk Assorted', 'Cupp Keyk Assorted is a selection of Filipino-style mini cupcakes with a variety of flavors, known for their moist and delicious cake base and enjoyable toppings.', 67.00, 10, 'Biscuits', 'https://i.ibb.co/dJzzQhZQ/f0fd56b261e3.png', '2025-06-18 23:13:43', '2025-06-18 23:13:43'),
(129, 'Topps Sarap ', 'Topps Sarap is a brand of compact, single-serving cupcakes that are known for their rich and creamy filling, thick frosting, and toppings like star sprinkles', 0.00, 30, 'Biscuits', 'https://i.ibb.co/JFxPhLw5/3f865e3665f4.png', '2025-06-18 23:15:47', '2025-06-18 23:20:00'),
(130, 'Brownie Break', 'Brownie Break is a brand of individually wrapped, chewy, bite-sized brownies.', 75.00, 30, 'Biscuits', 'https://i.ibb.co/Ld2y9y6C/3f859b3e89e7.png', '2025-06-18 23:17:49', '2025-06-18 23:17:49'),
(131, '555 Karne Norte', ' a locally manufactured corned beef, known for its quality and affordability, made with selected beef, hashed, and hygienically processed under international standards, ready to eat. ', 0.00, 100, 'Canned Goods', 'https://i.ibb.co/XxwWhW35/12816c9121e9.png', '2025-06-19 00:18:16', '2025-06-19 00:18:42'),
(132, 'Ligo Sardines', 'Ligo sardines, a popular Filipino brand, are known for their high-quality sardines packed in a flavorful tomato sauce.', 0.00, 200, 'Canned Goods', 'https://i.ibb.co/xtf07ypV/9d9995cb1592.png', '2025-06-19 00:22:41', '2025-06-19 09:40:05'),
(133, 'Mega Sardines', 'Mega Sardines, the number one sardine brand in the Philippines, is known for its fresh, high-quality sardines caught and canned within 12 hours.', 0.00, 1000, 'Canned Goods', 'https://i.ibb.co/m5N1MgKp/dd37d6c182e1.png', '2025-06-19 00:24:18', '2025-06-19 00:24:30');

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
(35, 96, 'Large (480g)', 43.00, 40, 'https://i.ibb.co/TxfPY88k/89af1b0efc5c.webp'),
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
(50, 105, '85g', 31.00, 96, NULL),
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
(91, 74, '375ml', 32.00, 2, 'https://i.ibb.co/N25PWXHW/e71758e8ad02.png'),
(93, 45, 'ZCX', 20.00, 44, 'https://i.ibb.co/pCmq69c/3cf9373984c9.png');

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
(1, 'JM Garis Store', 'Official Receiptzxc', 'Barcenaga, Naujan City, Oriental Mindoro', 'storeofjmgaris@gmail.com', 'Thank you for your purchase!\nPlease come again', 'You can Contact us in: +63*** *** ****', '2025-06-13 22:06:01', '2025-06-30 09:41:56');

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
(1, 1, 100.00, 0.50, '', '2025-06-30 16:45:57', 20);

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
  `profile_picture` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `firstname`, `middlename`, `lastname`, `gender`, `civil_status`, `phone_number`, `address`, `birthdate`, `email`, `password`, `created_at`, `otp`, `otp_expires`, `email_verified`, `role`, `password_reset_otp`, `password_reset_otp_expires`, `profile_picture`) VALUES
(20, 'adminsiL4ns', '', NULL, '', 'male', 'single', NULL, NULL, NULL, 'admin@gmail.com', '$2b$10$wRo343tSktWutK.ljme.JOtFQj3fCguB9r0QtYLioG4F0//XbD0WS', '2025-02-14 20:30:57', NULL, NULL, 1, 'admin', NULL, NULL, NULL),
(23, 'Helios', 'Kien Eros', NULL, 'Aas', 'male', 'single', '097874547561', 'ilaya calapan', '2025-06-17', 'hernandezlanslorence@gmail.com', '$2a$10$8TpY.gjWTcOn29p/NysU7eiHolqOjRGkk4YnSvy2tK0V.FHZOFPSS', '2025-02-14 21:37:21', NULL, NULL, 1, 'staff', NULL, NULL, NULL),
(56, 'l4nszxcqwe', 'dsa', 'dsa', 'dsadsa', 'female', 'single', '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', '2025-02-16', 'dsdsadasdas@gmail.com', '$2a$10$SSpSYo7VpFS4tolhVjEQ2On47sOeNhXD3eplmpR/wEFNkGooExiC6', '2025-02-16 04:31:13', 'lKiGNV', '2025-02-16 04:41:13', 0, 'user', NULL, NULL, NULL),
(57, 'dsad213213', 'adsad', 'sadsa', '3dsads', 'female', 'single', '3442342', 'dsadas', '2025-02-16', 'lans@gmail.com', '$2a$10$Pd2lZMPCnTMBxylXfT47e.OHqz5AekpbITPS9PFmCKcetRQm.2qb6', '2025-02-16 04:32:19', 'blj3Gv', '2025-02-16 04:42:19', 0, 'user', NULL, NULL, NULL),
(58, 'L4nszxc_09', 'Lans Lorence', 'Navarro', 'Hernandez', 'male', 'single', '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', '2004-07-09', 'lanslorence@gmail.com', '$2a$10$nx86zUGo9UtLC1JUuGEZ2.JWqlD1acSar9ELW4soZ05Sfhigr9HAK', '2025-02-16 06:14:39', NULL, NULL, 1, 'user', NULL, NULL, 'https://i.ibb.co/WvLskzHp/c25c8f6e3a6d.jpg'),
(60, 'saddsaddasdsa', 'sda', 'fdgd', 'fdgf', 'male', 'married', '3232432', 'dsadsa', '2025-02-26', 'sa@gmail.com', '$2a$10$rtbD7y7bDxqiyrlvtmoYROheqdfqRbI2RSIFQX/DKkj.lly8B474.', '2025-02-25 18:02:55', NULL, NULL, 1, 'staff', NULL, NULL, NULL),
(1000, 'l4nstest optinal', 'lans', NULL, 'hernandez', NULL, NULL, '09127649805', 'Ibaba West, Calapan City, Oriental Mindoro', NULL, 'l4nsh3rn4nd3z@gmail.com', '$2a$10$.mxwVsDEB/kVnXpjw3.ieu6cc5uRXSoBu6.m5iHbz3IgvfLqH7wum', '2025-06-13 18:19:20', NULL, NULL, 1, 'user', NULL, NULL, NULL);

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
(4, 58, NULL, 9116.00, 0.00, 0.00, NULL, NULL, '2025-07-03 16:47:19');

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
(426, 58, '7214359', 32, 'Earned points from order #7214359 (₱3245.00)', '2025-07-03 16:21:31'),
(427, 58, '0808688', 1, 'Earned points from order #0808688 (₱141.00)', '2025-07-03 16:25:32'),
(428, 58, '5369343', 7, 'Earned points from order #5369343 (₱705.00)', '2025-07-03 16:30:59'),
(429, 58, '0841191', 6, 'Earned points from order #0841191 (₱649.00)', '2025-07-03 16:31:32'),
(430, 58, '2056774', 2, 'Earned points from order #2056774 (₱200.00)', '2025-07-03 16:38:42'),
(431, 58, '1248147', 1, 'Earned points from order #1248147 (₱141.00)', '2025-07-03 16:39:11'),
(432, 58, '0200807', 6, 'Earned points from order #0200807 (₱649.00)', '2025-07-03 16:39:55'),
(433, 58, '2015882', 1, 'Earned points from order #2015882 (₱141.00)', '2025-07-03 16:45:51'),
(434, 58, '9569324', 32, 'Earned points from order #9569324 (₱3245.00)', '2025-07-03 16:47:19');

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
  ADD UNIQUE KEY `email` (`email`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2491728;

--
-- AUTO_INCREMENT for table `loyalty_tiers`
--
ALTER TABLE `loyalty_tiers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1808;

--
-- AUTO_INCREMENT for table `order_reports`
--
ALTER TABLE `order_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_reviews`
--
ALTER TABLE `order_reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `products_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=134;

--
-- AUTO_INCREMENT for table `product_choices`
--
ALTER TABLE `product_choices`
  MODIFY `choice_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `product_reports`
--
ALTER TABLE `product_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1001;

--
-- AUTO_INCREMENT for table `user_loyalty_status`
--
ALTER TABLE `user_loyalty_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_rewards`
--
ALTER TABLE `user_rewards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=435;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
