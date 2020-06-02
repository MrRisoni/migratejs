-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 02, 2020 at 11:39 AM
-- Server version: 8.0.20
-- PHP Version: 7.4.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `foradb_dev`
--

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` bigint UNSIGNED NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `processed` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `file_name`, `processed`, `created_at`) VALUES
(1, 'migration20200528_090408_users', 1, '2020-04-28 17:48:19'),
(9, 'migration20200528_102626_tickets', 1, '2020-05-28 07:26:26'),
(15, 'migration20200528_103652_AddIndexToTickets', 1, '2020-05-30 06:17:29'),
(17, 'migration20200530_094028_AddColumnsToUser', 1, '2020-05-30 06:40:28'),
(18, 'migration20200530_021633_Rank', 1, '2020-05-30 11:16:33'),
(27, 'migration20200602_101038_AddForeignKeyTousersReferencesranks', 1, '2020-06-02 07:10:38'),
(28, 'migration20200602_102145_Thread', 1, '2020-06-02 07:21:45'),
(30, 'migration20200602_115716_AddColumnsTo_users', 1, '2020-05-28 17:48:19'),
(33, 'migration20200602_124417_AddColumnsTo_threads', 1, '2020-06-02 09:44:17');

-- --------------------------------------------------------

--
-- Table structure for table `ranks`
--

CREATE TABLE `ranks` (
  `rnk_id` tinyint NOT NULL,
  `rnk_title` varchar(255) DEFAULT NULL,
  `rnk_created_at` datetime DEFAULT NULL,
  `rnk_updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `ranks`
--

INSERT INTO `ranks` (`rnk_id`, `rnk_title`, `rnk_created_at`, `rnk_updated_at`) VALUES
(1, 'Adobe', '2020-06-02 10:16:27', '2020-06-02 10:16:27');

-- --------------------------------------------------------

--
-- Table structure for table `threads`
--

CREATE TABLE `threads` (
  `thrd_id` bigint NOT NULL,
  `thrd_title` varchar(80) NOT NULL,
  `thrd_upvotes` tinyint UNSIGNED DEFAULT '0',
  `thrd_created_at` datetime DEFAULT NULL,
  `thrd_updated_at` datetime DEFAULT NULL,
  `thrd_downvotes` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `tkt_id` bigint NOT NULL,
  `tkt_bookingId` int DEFAULT NULL,
  `tkt_pnr` varchar(255) DEFAULT NULL,
  `tkt_ticket_no` varchar(255) DEFAULT NULL,
  `tkt_created_at` datetime DEFAULT NULL,
  `tkt_updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `usr_id` int UNSIGNED NOT NULL,
  `usr_title` varchar(255) NOT NULL,
  `usr_created_at` datetime NOT NULL,
  `usr_updated_at` datetime NOT NULL,
  `usr_email` varchar(255) DEFAULT NULL,
  `usr_dob` date DEFAULT '2010-01-01',
  `usr_passwd` varchar(255) DEFAULT NULL,
  `usr_ranks_id` tinyint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`usr_id`, `usr_title`, `usr_created_at`, `usr_updated_at`, `usr_email`, `usr_dob`, `usr_passwd`, `usr_ranks_id`) VALUES
(1, 'dsdsd', '2020-06-02 12:02:54', '2020-06-02 12:02:54', NULL, '2010-01-01', 'sdsds', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `file_name` (`file_name`);

--
-- Indexes for table `ranks`
--
ALTER TABLE `ranks`
  ADD PRIMARY KEY (`rnk_id`);

--
-- Indexes for table `threads`
--
ALTER TABLE `threads`
  ADD PRIMARY KEY (`thrd_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`tkt_id`),
  ADD UNIQUE KEY `unique_tkt_kombo` (`tkt_bookingId`,`tkt_pnr`,`tkt_ticket_no`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`usr_id`),
  ADD KEY `usr_ranks_id` (`usr_ranks_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `ranks`
--
ALTER TABLE `ranks`
  MODIFY `rnk_id` tinyint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `threads`
--
ALTER TABLE `threads`
  MODIFY `thrd_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `tkt_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `usr_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`usr_ranks_id`) REFERENCES `ranks` (`rnk_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
