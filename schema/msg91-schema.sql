-- MySQL dump 10.13  Distrib 8.0.46, for macos15 (arm64)
--
-- Host: mysql.test.txtapi.com    Database: test_betatest
-- ------------------------------------------------------
-- Server version	5.7.44-rds.20250508

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `CHANGELOG`
--

DROP TABLE IF EXISTS `CHANGELOG`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CHANGELOG` (
  `ID` decimal(20,0) NOT NULL,
  `APPLIED_AT` varchar(25) NOT NULL,
  `DESCRIPTION` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `IpLogs`
--

DROP TABLE IF EXISTS `IpLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `IpLogs` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Ip` varchar(35) NOT NULL,
  `userId` int(11) NOT NULL,
  `dateTime` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `IpLogsSecrty`
--

DROP TABLE IF EXISTS `IpLogsSecrty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `IpLogsSecrty` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Ip` varchar(35) NOT NULL,
  `userId` int(11) NOT NULL,
  `dateTime` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=63663 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `IpLogsSecrty_copy`
--

DROP TABLE IF EXISTS `IpLogsSecrty_copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `IpLogsSecrty_copy` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Ip` varchar(35) NOT NULL,
  `userId` int(11) NOT NULL,
  `dateTime` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=58213 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `IpLogsSecrty_newServer`
--

DROP TABLE IF EXISTS `IpLogsSecrty_newServer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `IpLogsSecrty_newServer` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Ip` varchar(35) NOT NULL,
  `userId` int(11) NOT NULL,
  `dateTime` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `IpLogsSecrty_temp`
--

DROP TABLE IF EXISTS `IpLogsSecrty_temp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `IpLogsSecrty_temp` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Ip` varchar(35) NOT NULL,
  `userId` int(11) NOT NULL,
  `dateTime` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=49671 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `OBD_cache`
--

DROP TABLE IF EXISTS `OBD_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OBD_cache` (
  `slNo` int(11) NOT NULL AUTO_INCREMENT,
  `uniqueId` varchar(100) NOT NULL,
  `userName` varchar(50) NOT NULL,
  `telNum` varchar(20) NOT NULL,
  `annName` varchar(100) NOT NULL,
  `dialTime` datetime NOT NULL,
  `answerTime` datetime NOT NULL,
  `disconnectTime` datetime NOT NULL,
  `duration` int(11) NOT NULL,
  `status` varchar(100) NOT NULL,
  `priority` int(11) NOT NULL,
  `maxRetry` int(11) NOT NULL,
  `RetryTime` int(11) NOT NULL,
  `retryCount` int(11) NOT NULL,
  `callBackUrl` varchar(500) NOT NULL,
  `callerId` varchar(20) NOT NULL,
  `usedCredits` int(11) NOT NULL,
  `from_panel` varchar(20) NOT NULL,
  `scheduleTime` datetime NOT NULL,
  `scheduleTimeEnd` datetime NOT NULL,
  `maxDuration` int(11) DEFAULT NULL,
  `upload_time` timestamp NULL DEFAULT NULL,
  `account` varchar(200) NOT NULL,
  `user_block` int(11) NOT NULL,
  `dnd` tinyint(4) NOT NULL,
  `dbType` int(11) NOT NULL,
  PRIMARY KEY (`slNo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `OBD_complete`
--

DROP TABLE IF EXISTS `OBD_complete`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OBD_complete` (
  `slNo` double NOT NULL AUTO_INCREMENT,
  `uniqueId` varchar(100) NOT NULL,
  `userName` varchar(50) NOT NULL,
  `telNum` varchar(20) NOT NULL,
  `annName` varchar(100) NOT NULL,
  `dialTime` datetime NOT NULL,
  `answerTime` datetime NOT NULL,
  `disconnectTime` datetime NOT NULL,
  `duration` int(11) NOT NULL,
  `status` varchar(100) NOT NULL,
  `callBackUrl` varchar(500) NOT NULL,
  `priority` int(11) NOT NULL,
  `maxRetry` varchar(10) NOT NULL,
  `RetryTime` varchar(10) NOT NULL,
  `retryCount` int(11) NOT NULL,
  `usedCredits` int(11) NOT NULL,
  `from_panel` varchar(20) NOT NULL,
  `maxDuration` int(11) DEFAULT NULL,
  `server_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`slNo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ReportAnalysis`
--

DROP TABLE IF EXISTS `ReportAnalysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReportAnalysis` (
  `requestId` varchar(255) NOT NULL,
  `isSpam` int(11) NOT NULL,
  `pauseReason` varchar(255) DEFAULT NULL,
  `noOfSMS` int(11) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `curRoute` varchar(255) DEFAULT NULL,
  `delivered` int(11) NOT NULL,
  `deliveryPercent` float NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `reqRoute` varchar(255) DEFAULT NULL,
  `currentTime` datetime DEFAULT NULL,
  `requestDate` varchar(255) DEFAULT NULL,
  `rab_request_1` int(11) NOT NULL,
  `rab_request_4` int(11) NOT NULL,
  `rab_reports_1` int(11) NOT NULL,
  `rab_reports_4` int(11) NOT NULL,
  `rab_retry_queue` int(11) NOT NULL,
  PRIMARY KEY (`requestId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Theme`
--

DROP TABLE IF EXISTS `Theme`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Theme` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `theme` int(11) NOT NULL,
  `status` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `WhiteListIp`
--

DROP TABLE IF EXISTS `WhiteListIp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WhiteListIp` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Ip` varchar(54) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `authkey` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1787 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `access_list`
--

DROP TABLE IF EXISTS `access_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_list` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `access_name` varchar(40) NOT NULL,
  `description` text NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `acm_cron_config`
--

DROP TABLE IF EXISTS `acm_cron_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acm_cron_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_acm` int(11) DEFAULT NULL COMMENT 'Source ACM ID (NULL for no account manager)',
  `to_acm` int(11) DEFAULT NULL COMMENT 'Target ACM ID (NULL for no account manager)',
  `company_age_in_days` int(11) DEFAULT NULL COMMENT 'Company age filter in days (default is empty)',
  `normal_purchase` tinyint(1) DEFAULT '0' COMMENT 'Normal purchase checkbox (0=unchecked, 1=checked)',
  `purchase_ago` int(11) DEFAULT NULL,
  `giddh_outstanding_ignore` tinyint(1) DEFAULT '0' COMMENT 'Giddh outstanding ignore checkbox (0=unchecked, 1=checked)',
  `created_by` int(11) DEFAULT NULL COMMENT 'Created by admin ID',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `acm_updation_logs`
--

DROP TABLE IF EXISTS `acm_updation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acm_updation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `before_val` varchar(100) NOT NULL,
  `after_val` varchar(100) NOT NULL,
  `status` int(5) NOT NULL,
  `date` datetime NOT NULL,
  `comments` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=411 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `actual_fail_delivered`
--

DROP TABLE IF EXISTS `actual_fail_delivered`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actual_fail_delivered` (
  `date` date NOT NULL,
  `fake_failed` int(11) NOT NULL,
  `delivered` int(11) NOT NULL,
  `final_failed` int(11) NOT NULL,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_auto_recharge_setting`
--

DROP TABLE IF EXISTS `admin_auto_recharge_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_auto_recharge_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panelId` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `sms` int(11) NOT NULL,
  `cost` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_base`
--

DROP TABLE IF EXISTS `admin_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_base` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(255) NOT NULL,
  `base_id` varchar(255) DEFAULT NULL,
  `api_key` varchar(255) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_disable_user`
--

DROP TABLE IF EXISTS `admin_disable_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_disable_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=365 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_permission_level`
--

DROP TABLE IF EXISTS `admin_permission_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permission_level` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `prm` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_admin_prm` (`admin_id`,`prm`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_privilages`
--

DROP TABLE IF EXISTS `admin_privilages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_privilages` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `access` varchar(40) NOT NULL,
  `value` int(11) NOT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `admin_id` (`admin_id`,`access`)
) ENGINE=InnoDB AUTO_INCREMENT=1182 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_trans`
--

DROP TABLE IF EXISTS `admin_trans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_trans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `touserid` int(11) NOT NULL,
  `type` varchar(100) NOT NULL,
  `amt` varchar(100) NOT NULL,
  `status` varchar(4) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_updation_log`
--

DROP TABLE IF EXISTS `admin_updation_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_updation_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `upt_id` int(11) NOT NULL,
  `date` datetime NOT NULL,
  `before_val` varchar(100) NOT NULL,
  `after_val` varchar(100) NOT NULL,
  `comment` blob,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=126716 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_updation_log_test`
--

DROP TABLE IF EXISTS `admin_updation_log_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_updation_log_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `upt_id` int(11) NOT NULL,
  `date` datetime NOT NULL,
  `before_val` varchar(10) NOT NULL,
  `after_val` varchar(10) NOT NULL,
  `comment` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21095 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_user`
--

DROP TABLE IF EXISTS `admin_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allResellerDataAnalysis`
--

DROP TABLE IF EXISTS `allResellerDataAnalysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allResellerDataAnalysis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resId` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `totalClients` int(11) NOT NULL,
  `whiteLabelled` varchar(500) NOT NULL,
  `potentialMonthly4` varchar(500) NOT NULL,
  `potentialMonthly1` varchar(100) NOT NULL,
  `price4` varchar(50) NOT NULL,
  `price1` varchar(50) NOT NULL,
  `totalMonthlyPurchaseRoute1` varchar(500) NOT NULL,
  `totalMonthlyPurchaseRoute4` varchar(500) NOT NULL,
  `lastPurchaseDate` date NOT NULL,
  `route4Avg` varchar(100) NOT NULL,
  `route1Avg` varchar(100) NOT NULL,
  `accountManagerName` varchar(500) NOT NULL,
  `comment` varchar(1000) NOT NULL,
  `scheduleDate` date NOT NULL,
  `discount` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=775 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `approved_otp_template`
--

DROP TABLE IF EXISTS `approved_otp_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approved_otp_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `template_id` varchar(255) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `template` text,
  `email_template_id` int(11) NOT NULL,
  `approved_date` date DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `approved_operators` varchar(255) DEFAULT NULL,
  `rejected_operators` varchar(255) DEFAULT NULL,
  `country_code` int(11) DEFAULT NULL,
  `created_date` date DEFAULT NULL,
  `content_type` tinyint(1) DEFAULT NULL,
  `user_data` varchar(500) DEFAULT NULL,
  `created_by` tinyint(1) DEFAULT NULL,
  `voice_template_id` int(11) NOT NULL,
  `push_payload_id` int(11) DEFAULT NULL,
  `DLT_TE_ID` varchar(50) DEFAULT NULL,
  `dlt_verified` int(11) DEFAULT '0',
  `dlt_reason` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `archive` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=971 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `approved_r4_template`
--

DROP TABLE IF EXISTS `approved_r4_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approved_r4_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender_id` varchar(20) CHARACTER SET latin1 DEFAULT NULL,
  `template_id` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `template_name` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `template` text,
  `approved_date` date DEFAULT NULL,
  `approved_operators` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `rejected_operators` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `country_code` int(11) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `user_data` varchar(500) CHARACTER SET latin1 DEFAULT NULL,
  `created_by` tinyint(1) DEFAULT NULL,
  `is_spam` tinyint(1) NOT NULL,
  `spam_response` text CHARACTER SET latin1,
  `company_name` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `content_type` tinyint(4) DEFAULT NULL,
  `email_template_id` int(11) DEFAULT NULL,
  `is_pending` tinyint(4) DEFAULT NULL,
  `voice_template_id` int(11) DEFAULT NULL,
  `whatsapp_template_id` int(11) DEFAULT NULL,
  `push_payload_id` int(11) DEFAULT NULL,
  `message_type` varchar(50) CHARACTER SET latin1 DEFAULT NULL,
  `flow_order` varchar(128) CHARACTER SET latin1 DEFAULT NULL,
  `condition_flow` varchar(50) CHARACTER SET latin1 DEFAULT NULL,
  `condition_flow_whatsapp` varchar(50) CHARACTER SET latin1 DEFAULT NULL,
  `condition_min` decimal(3,1) DEFAULT NULL,
  `condition_min_whatsapp` decimal(3,1) DEFAULT NULL,
  `recipients` varchar(512) CHARACTER SET latin1 DEFAULT '##mobiles##',
  `status` tinyint(2) DEFAULT '1' COMMENT '0 - Disable, 1 - Enable',
  `condition_flow_notification` varchar(128) DEFAULT NULL,
  `condition_flow_notification_min` decimal(3,1) DEFAULT NULL,
  `matched_percentage_rejected` decimal(10,0) DEFAULT '0',
  `matched_percentage_approve` decimal(10,0) DEFAULT '0',
  `condition_flow_sms` varchar(255) DEFAULT '',
  `condition_min_sms` decimal(3,1) DEFAULT '0.0',
  `DLT_TE_ID` varchar(50) DEFAULT NULL COMMENT 'DLT template id',
  `dlt_verified` int(11) DEFAULT '0',
  `dlt_reason` varchar(255) DEFAULT NULL,
  `reject_reason` varchar(255) DEFAULT NULL,
  `archive` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_pending_spam` (`user_id`,`created_by`,`is_spam`,`is_pending`)
) ENGINE=InnoDB AUTO_INCREMENT=21853 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `approved_senderid`
--

DROP TABLE IF EXISTS `approved_senderid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approved_senderid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `senderid` varchar(20) CHARACTER SET utf8 NOT NULL,
  `route_pid` int(11) NOT NULL,
  `approved_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `senderid` (`senderid`,`route_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auto_pay_tokens`
--

DROP TABLE IF EXISTS `auto_pay_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auto_pay_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `token_id` varchar(120) NOT NULL,
  `mandate_id` varchar(120) NOT NULL,
  `token_name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL COMMENT 'Status (e.g., active/inactive)',
  `gateway` tinyint(1) NOT NULL COMMENT 'Gateway (e.g., cashfree =1 , paypal =2, stripe = 3)',
  `auth_link` varchar(255) NOT NULL,
  `last_updated_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companyName_MandateId_Uniuqe` (`company_id`,`token_name`)
) ENGINE=InnoDB AUTO_INCREMENT=497 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auto_recharge_setting`
--

DROP TABLE IF EXISTS `auto_recharge_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auto_recharge_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `token_id` varchar(150) DEFAULT NULL,
  `mandate_id` varchar(150) NOT NULL,
  `threshold_amount` double(20,5) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) DEFAULT '0.00000',
  `net_amount` double(20,5) NOT NULL,
  `route` int(11) NOT NULL DEFAULT '0',
  `status` int(11) NOT NULL,
  `gateway` tinyint(1) NOT NULL COMMENT 'Gateway (e.g., cashfree =1 , paypal =2, stripe = 3)',
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `consecutive_failures` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT 'Count of consecutive auto-recharge payment failures. Resets to 0 on success or when user re-enables.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id_route_UNIQUE` (`company_id`,`route`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auto_recharge_subscriptions`
--

DROP TABLE IF EXISTS `auto_recharge_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auto_recharge_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `mandate_id` int(11) NOT NULL,
  `threshold_amount` double(20,5) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) DEFAULT '18.00000',
  `net_amount` double(20,5) NOT NULL,
  `route` int(11) NOT NULL DEFAULT '0',
  `status` int(11) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id_route_UNIQUE` (`company_id`,`route`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `backup_running_record`
--

DROP TABLE IF EXISTS `backup_running_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_running_record` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `smpp` varchar(30) NOT NULL,
  `route_pid` int(11) NOT NULL,
  `original_route` int(11) NOT NULL,
  `backup` varchar(30) NOT NULL,
  `status` int(11) NOT NULL,
  `logging date` datetime NOT NULL,
  `resolved time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `backup_smsc_setting`
--

DROP TABLE IF EXISTS `backup_smsc_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_smsc_setting` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `route_pid` int(11) NOT NULL,
  `count` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bankDetail`
--

DROP TABLE IF EXISTS `bankDetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bankDetail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bank` text NOT NULL,
  `ifsc_code` text NOT NULL,
  `account_number` text NOT NULL,
  `account_name` text NOT NULL,
  `reseller_id` int(11) NOT NULL,
  `branch_add` text NOT NULL,
  `iban` text,
  `sorting_code` text,
  `routing_number` text,
  `currency` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=751 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bank_detail_sms`
--

DROP TABLE IF EXISTS `bank_detail_sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_detail_sms` (
  `sid` int(11) NOT NULL AUTO_INCREMENT,
  `currentIP` varchar(25) NOT NULL,
  `msg` text NOT NULL,
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bjp_coupon_code`
--

DROP TABLE IF EXISTS `bjp_coupon_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bjp_coupon_code` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` int(11) NOT NULL,
  `lock_status` int(11) NOT NULL,
  `assign_status` int(11) NOT NULL,
  `number` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaign_feature`
--

DROP TABLE IF EXISTS `campaign_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_feature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `feature_status` int(11) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cashfreeWebhookTesting`
--

DROP TABLE IF EXISTS `cashfreeWebhookTesting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashfreeWebhookTesting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requestData` longtext,
  `headers` longtext,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=209 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cashfree_payments`
--

DROP TABLE IF EXISTS `cashfree_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashfree_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `sub_ref_id` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `amount` double(20,5) NOT NULL,
  `retry_attempts` int(3) NOT NULL DEFAULT '0',
  `schedule_date` date DEFAULT NULL,
  `description` varchar(150) DEFAULT NULL,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id_UNIQUE` (`payment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cashfree_plans`
--

DROP TABLE IF EXISTS `cashfree_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashfree_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_id` varchar(45) NOT NULL,
  `plan_name` varchar(45) NOT NULL,
  `amount` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plan_id_UNIQUE` (`plan_id`),
  UNIQUE KEY `plan_name_UNIQUE` (`plan_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cashfree_subscription_auth_logs`
--

DROP TABLE IF EXISTS `cashfree_subscription_auth_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashfree_subscription_auth_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_ref_id` int(11) NOT NULL,
  `auth_status` tinyint(4) NOT NULL,
  `failure_reason` varchar(250) NOT NULL,
  `subscription_status` tinyint(4) NOT NULL,
  `event_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cashfree_subscriptions`
--

DROP TABLE IF EXISTS `cashfree_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashfree_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `sub_ref_id` int(11) NOT NULL,
  `threshold_amount` double(20,5) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) DEFAULT NULL,
  `net_amount` double(20,5) NOT NULL,
  `plan_id` varchar(45) NOT NULL,
  `status` int(11) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `auth_link` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sub_ref_id_UNIQUE` (`sub_ref_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cc2sms_emails`
--

DROP TABLE IF EXISTS `cc2sms_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cc2sms_emails` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `uniqueID` varchar(30) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `used_with_software` varchar(40) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `status` int(11) NOT NULL,
  `is_deleted` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cc2sms_informclient`
--

DROP TABLE IF EXISTS `cc2sms_informclient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cc2sms_informclient` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(40) COLLATE utf8_bin NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=185 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cc2sms_sms`
--

DROP TABLE IF EXISTS `cc2sms_sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cc2sms_sms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NULL DEFAULT NULL,
  `message` varchar(700) COLLATE utf8_bin NOT NULL,
  `senderID` varchar(15) COLLATE utf8_bin NOT NULL,
  `number` bigint(20) NOT NULL,
  `uniqueID` varchar(30) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `change_company_request`
--

DROP TABLE IF EXISTS `change_company_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `change_company_request` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `old_company_name` varchar(255) NOT NULL,
  `new_company_name` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` varchar(255) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `verification_link_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `checkout_detail`
--

DROP TABLE IF EXISTS `checkout_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkout_detail` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_client` bigint(20) DEFAULT NULL,
  `billing_email` varchar(45) DEFAULT NULL,
  `order_no` text,
  `date1` datetime DEFAULT NULL,
  `talktime` double DEFAULT NULL,
  `recharge` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `circle_detail`
--

DROP TABLE IF EXISTS `circle_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `circle_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `circle_name` varchar(255) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `circle_wise_numbers`
--

DROP TABLE IF EXISTS `circle_wise_numbers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `circle_wise_numbers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `number_series` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `circle_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `click_tracker`
--

DROP TABLE IF EXISTS `click_tracker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `click_tracker` (
  `urls_hash` smallint(5) unsigned NOT NULL,
  `urls_key` varchar(255) NOT NULL,
  `urls_val` text NOT NULL,
  `urls_total` bigint(20) unsigned NOT NULL,
  `urls_cnt0` smallint(5) unsigned NOT NULL,
  `urls_cnt1` smallint(5) unsigned NOT NULL,
  `urls_cnt2` smallint(5) unsigned NOT NULL,
  `urls_cnt3` smallint(5) unsigned NOT NULL,
  `urls_cnt4` smallint(5) unsigned NOT NULL,
  `urls_cnt5` smallint(5) unsigned NOT NULL,
  `urls_cnt6` smallint(5) unsigned NOT NULL,
  `urls_cnt7` smallint(5) unsigned NOT NULL,
  `urls_cnt8` smallint(5) unsigned NOT NULL,
  `urls_cnt9` smallint(5) unsigned NOT NULL,
  `urls_cnt10` smallint(5) unsigned NOT NULL,
  `urls_cnt11` smallint(5) unsigned NOT NULL,
  `urls_cnt12` smallint(5) unsigned NOT NULL,
  `urls_cnt13` smallint(5) unsigned NOT NULL,
  `urls_cnt14` smallint(5) unsigned NOT NULL,
  `urls_cnt15` smallint(5) unsigned NOT NULL,
  `urls_cnt16` smallint(5) unsigned NOT NULL,
  `urls_cnt17` smallint(5) unsigned NOT NULL,
  `urls_cnt18` smallint(5) unsigned NOT NULL,
  `urls_cnt19` smallint(5) unsigned NOT NULL,
  `urls_cnt20` smallint(5) unsigned NOT NULL,
  `urls_cnt21` smallint(5) unsigned NOT NULL,
  `urls_cnt22` smallint(5) unsigned NOT NULL,
  `urls_cnt23` smallint(5) unsigned NOT NULL,
  `urls_cnt24` smallint(5) unsigned NOT NULL,
  `urls_cnt25` smallint(5) unsigned NOT NULL,
  `urls_cnt26` smallint(5) unsigned NOT NULL,
  `urls_cnt27` smallint(5) unsigned NOT NULL,
  `urls_cnt28` smallint(5) unsigned NOT NULL,
  `urls_cnt29` smallint(5) unsigned NOT NULL,
  `urls_cnt30` smallint(5) unsigned NOT NULL,
  `urls_cnt31` smallint(5) unsigned NOT NULL,
  `urls_cnt32` smallint(5) unsigned NOT NULL,
  `urls_cnt33` smallint(5) unsigned NOT NULL,
  `urls_cnt34` smallint(5) unsigned NOT NULL,
  `urls_cnt35` smallint(5) unsigned NOT NULL,
  `urls_cnt36` smallint(5) unsigned NOT NULL,
  `urls_cnt37` smallint(5) unsigned NOT NULL,
  `urls_cnt38` smallint(5) unsigned NOT NULL,
  `urls_cnt39` smallint(5) unsigned NOT NULL,
  `urls_cnt40` smallint(5) unsigned NOT NULL,
  `urls_cnt41` smallint(5) unsigned NOT NULL,
  `urls_cnt42` smallint(5) unsigned NOT NULL,
  `urls_cnt43` smallint(5) unsigned NOT NULL,
  `urls_cnt44` smallint(5) unsigned NOT NULL,
  `urls_cnt45` smallint(5) unsigned NOT NULL,
  `urls_cnt46` smallint(5) unsigned NOT NULL,
  `urls_cnt47` smallint(5) unsigned NOT NULL,
  `urls_cnt48` smallint(5) unsigned NOT NULL,
  `urls_cnt49` smallint(5) unsigned NOT NULL,
  `urls_cnt50` smallint(5) unsigned NOT NULL,
  `urls_cnt51` smallint(5) unsigned NOT NULL,
  `urls_cnt52` smallint(5) unsigned NOT NULL,
  `urls_cnt53` smallint(5) unsigned NOT NULL,
  `urls_cnt54` smallint(5) unsigned NOT NULL,
  `urls_cnt55` smallint(5) unsigned NOT NULL,
  `urls_cnt56` smallint(5) unsigned NOT NULL,
  `urls_cnt57` smallint(5) unsigned NOT NULL,
  `urls_cnt58` smallint(5) unsigned NOT NULL,
  `urls_cnt59` smallint(5) unsigned NOT NULL,
  `urls_cnt60` smallint(5) unsigned NOT NULL,
  `urls_cnt61` smallint(5) unsigned NOT NULL,
  `urls_cnt62` smallint(5) unsigned NOT NULL,
  `urls_cnt63` smallint(5) unsigned NOT NULL,
  `urls_cnt64` smallint(5) unsigned NOT NULL,
  `urls_cnt65` smallint(5) unsigned NOT NULL,
  `urls_cnt66` smallint(5) unsigned NOT NULL,
  `urls_cnt67` smallint(5) unsigned NOT NULL,
  `urls_cnt68` smallint(5) unsigned NOT NULL,
  `urls_cnt69` smallint(5) unsigned NOT NULL,
  `urls_cnt70` smallint(5) unsigned NOT NULL,
  `urls_cnt71` smallint(5) unsigned NOT NULL,
  `urls_cnt72` smallint(5) unsigned NOT NULL,
  `urls_cnt73` smallint(5) unsigned NOT NULL,
  `urls_cnt74` smallint(5) unsigned NOT NULL,
  `urls_cnt75` smallint(5) unsigned NOT NULL,
  `urls_cnt76` smallint(5) unsigned NOT NULL,
  `urls_cnt77` smallint(5) unsigned NOT NULL,
  `urls_cnt78` smallint(5) unsigned NOT NULL,
  `urls_cnt79` smallint(5) unsigned NOT NULL,
  `urls_cnt80` smallint(5) unsigned NOT NULL,
  `urls_cnt81` smallint(5) unsigned NOT NULL,
  `urls_cnt82` smallint(5) unsigned NOT NULL,
  `urls_cnt83` smallint(5) unsigned NOT NULL,
  `urls_cnt84` smallint(5) unsigned NOT NULL,
  `urls_cnt85` smallint(5) unsigned NOT NULL,
  `urls_cnt86` smallint(5) unsigned NOT NULL,
  `urls_cnt87` smallint(5) unsigned NOT NULL,
  `urls_cnt88` smallint(5) unsigned NOT NULL,
  `urls_cnt89` smallint(5) unsigned NOT NULL,
  `urls_cnt90` smallint(5) unsigned NOT NULL,
  `urls_cnt91` smallint(5) unsigned NOT NULL,
  `urls_cnt92` smallint(5) unsigned NOT NULL,
  `urls_cnt93` smallint(5) unsigned NOT NULL,
  `urls_cnt94` smallint(5) unsigned NOT NULL,
  `urls_cnt95` smallint(5) unsigned NOT NULL,
  `urls_cnt96` smallint(5) unsigned NOT NULL,
  `urls_cnt97` smallint(5) unsigned NOT NULL,
  `urls_cnt98` smallint(5) unsigned NOT NULL,
  `urls_cnt99` smallint(5) unsigned NOT NULL,
  `urls_cnt100` smallint(5) unsigned NOT NULL,
  `urls_cnt101` smallint(5) unsigned NOT NULL,
  `urls_cnt102` smallint(5) unsigned NOT NULL,
  `urls_cnt103` smallint(5) unsigned NOT NULL,
  `urls_cnt104` smallint(5) unsigned NOT NULL,
  `urls_cnt105` smallint(5) unsigned NOT NULL,
  `urls_cnt106` smallint(5) unsigned NOT NULL,
  `urls_cnt107` smallint(5) unsigned NOT NULL,
  `urls_cnt108` smallint(5) unsigned NOT NULL,
  `urls_cnt109` smallint(5) unsigned NOT NULL,
  `urls_cnt110` smallint(5) unsigned NOT NULL,
  `urls_cnt111` smallint(5) unsigned NOT NULL,
  `urls_cnt112` smallint(5) unsigned NOT NULL,
  `urls_cnt113` smallint(5) unsigned NOT NULL,
  `urls_cnt114` smallint(5) unsigned NOT NULL,
  `urls_cnt115` smallint(5) unsigned NOT NULL,
  `urls_cnt116` smallint(5) unsigned NOT NULL,
  `urls_cnt117` smallint(5) unsigned NOT NULL,
  `urls_cnt118` smallint(5) unsigned NOT NULL,
  `urls_cnt119` smallint(5) unsigned NOT NULL,
  `urls_cnt120` smallint(5) unsigned NOT NULL,
  `urls_cnt121` smallint(5) unsigned NOT NULL,
  `urls_cnt122` smallint(5) unsigned NOT NULL,
  `urls_cnt123` smallint(5) unsigned NOT NULL,
  `urls_cnt124` smallint(5) unsigned NOT NULL,
  `urls_cnt125` smallint(5) unsigned NOT NULL,
  `urls_cnt126` smallint(5) unsigned NOT NULL,
  `urls_cnt127` smallint(5) unsigned NOT NULL,
  `urls_cnt128` smallint(5) unsigned NOT NULL,
  `urls_cnt129` smallint(5) unsigned NOT NULL,
  `urls_cnt130` smallint(5) unsigned NOT NULL,
  `urls_cnt131` smallint(5) unsigned NOT NULL,
  `urls_cnt132` smallint(5) unsigned NOT NULL,
  `urls_cnt133` smallint(5) unsigned NOT NULL,
  `urls_cnt134` smallint(5) unsigned NOT NULL,
  `urls_cnt135` smallint(5) unsigned NOT NULL,
  `urls_cnt136` smallint(5) unsigned NOT NULL,
  `urls_cnt137` smallint(5) unsigned NOT NULL,
  `urls_cnt138` smallint(5) unsigned NOT NULL,
  `urls_cnt139` smallint(5) unsigned NOT NULL,
  `urls_cnt140` smallint(5) unsigned NOT NULL,
  `urls_cnt141` smallint(5) unsigned NOT NULL,
  `urls_cnt142` smallint(5) unsigned NOT NULL,
  `urls_cnt143` smallint(5) unsigned NOT NULL,
  `urls_cnt144` smallint(5) unsigned NOT NULL,
  `urls_cnt145` smallint(5) unsigned NOT NULL,
  `urls_cnt146` smallint(5) unsigned NOT NULL,
  `urls_cnt147` smallint(5) unsigned NOT NULL,
  `urls_cnt148` smallint(5) unsigned NOT NULL,
  `urls_cnt149` smallint(5) unsigned NOT NULL,
  `urls_cnt150` smallint(5) unsigned NOT NULL,
  `urls_cnt151` smallint(5) unsigned NOT NULL,
  `urls_cnt152` smallint(5) unsigned NOT NULL,
  `urls_cnt153` smallint(5) unsigned NOT NULL,
  `urls_cnt154` smallint(5) unsigned NOT NULL,
  `urls_cnt155` smallint(5) unsigned NOT NULL,
  `urls_cnt156` smallint(5) unsigned NOT NULL,
  `urls_cnt157` smallint(5) unsigned NOT NULL,
  `urls_cnt158` smallint(5) unsigned NOT NULL,
  `urls_cnt159` smallint(5) unsigned NOT NULL,
  `urls_cnt160` smallint(5) unsigned NOT NULL,
  `urls_cnt161` smallint(5) unsigned NOT NULL,
  `urls_cnt162` smallint(5) unsigned NOT NULL,
  `urls_cnt163` smallint(5) unsigned NOT NULL,
  `urls_cnt164` smallint(5) unsigned NOT NULL,
  `urls_cnt165` smallint(5) unsigned NOT NULL,
  `urls_cnt166` smallint(5) unsigned NOT NULL,
  `urls_cnt167` smallint(5) unsigned NOT NULL,
  `urls_cnt168` smallint(5) unsigned NOT NULL,
  `urls_cnt169` smallint(5) unsigned NOT NULL,
  `urls_cnt170` smallint(5) unsigned NOT NULL,
  `urls_cnt171` smallint(5) unsigned NOT NULL,
  `urls_cnt172` smallint(5) unsigned NOT NULL,
  `urls_cnt173` smallint(5) unsigned NOT NULL,
  `urls_cnt174` smallint(5) unsigned NOT NULL,
  `urls_cnt175` smallint(5) unsigned NOT NULL,
  `urls_cnt176` smallint(5) unsigned NOT NULL,
  `urls_cnt177` smallint(5) unsigned NOT NULL,
  `urls_cnt178` smallint(5) unsigned NOT NULL,
  `urls_cnt179` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`urls_key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientManagement`
--

DROP TABLE IF EXISTS `clientManagement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientManagement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `userName` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(60) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `clientType` int(11) NOT NULL,
  `signupDate` datetime NOT NULL,
  `industry` varchar(70) NOT NULL,
  `city` varchar(20) DEFAULT NULL,
  `trueClient` int(11) NOT NULL,
  `latestUpdate` varchar(500) NOT NULL,
  `followupDate` date NOT NULL,
  `accMng` varchar(20) NOT NULL,
  `accMngName` varchar(50) NOT NULL,
  `source` varchar(20) NOT NULL,
  `AvgConR1` varchar(50) NOT NULL DEFAULT '',
  `AvgConR4` varchar(50) NOT NULL DEFAULT '',
  `AvgConOTP` varchar(50) NOT NULL DEFAULT '',
  `lost` varchar(5) NOT NULL,
  `lostReason` varchar(50) NOT NULL,
  `lastPurchaseDate` datetime NOT NULL,
  `route1Bal` varchar(20) NOT NULL,
  `route4Bal` varchar(20) NOT NULL,
  `otpBal` varchar(20) NOT NULL,
  `route1Amount` varchar(20) NOT NULL,
  `route4Amount` varchar(20) NOT NULL,
  `otpAmount` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4127 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_detail`
--

DROP TABLE IF EXISTS `client_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_detail` (
  `S.No` int(11) NOT NULL AUTO_INCREMENT,
  `panel_id` int(11) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `page` varchar(30) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`S.No`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `communication`
--

DROP TABLE IF EXISTS `communication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communication` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `contact` varchar(255) NOT NULL,
  `contact_type` varchar(45) NOT NULL,
  `department` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=68990 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consumers`
--

DROP TABLE IF EXISTS `consumers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumers` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `consumer_command` varchar(500) NOT NULL,
  `search_term` varchar(100) NOT NULL,
  `runs_on` varchar(200) NOT NULL,
  `status` int(11) NOT NULL,
  `isEnvReq` int(11) NOT NULL,
  `extra_command` varchar(500) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consumers_backup_10Oct2024`
--

DROP TABLE IF EXISTS `consumers_backup_10Oct2024`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumers_backup_10Oct2024` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `consumer_command` varchar(500) NOT NULL,
  `search_term` varchar(100) NOT NULL,
  `runs_on` varchar(200) NOT NULL,
  `status` int(11) NOT NULL,
  `isEnvReq` int(11) NOT NULL,
  `extra_command` varchar(500) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country`
--

DROP TABLE IF EXISTS `country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country` (
  `countryid` varchar(255) NOT NULL DEFAULT '',
  `country` varchar(255) DEFAULT NULL,
  `iso2` varchar(255) DEFAULT NULL,
  `capital` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `code` int(11) NOT NULL,
  PRIMARY KEY (`countryid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_base_pricing`
--

DROP TABLE IF EXISTS `country_base_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_base_pricing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `country` varchar(45) NOT NULL,
  `local_price` double(20,4) NOT NULL DEFAULT '1.0000',
  `international_price` double(20,4) NOT NULL DEFAULT '1.0000',
  `status` int(11) DEFAULT '1',
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE` (`country`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_block_logs`
--

DROP TABLE IF EXISTS `country_block_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_block_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `country_name` varchar(255) DEFAULT NULL,
  `country_code` int(11) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL,
  `type` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1095 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_code_master`
--

DROP TABLE IF EXISTS `country_code_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_code_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sortname` varchar(3) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=194 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_code_number_length`
--

DROP TABLE IF EXISTS `country_code_number_length`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_code_number_length` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `country_name` text,
  `country_code` varchar(50) DEFAULT NULL,
  `number_length_type` enum('','fixed','variable') DEFAULT NULL,
  `number_length` text,
  `number_prefix` text,
  `sender_setting` enum('','fixed','dynamic','fixed in multiple') DEFAULT NULL,
  `sender_type` enum('','alpha','alpha numeric','numeric','alpha numeric with space','alpha numeric with special character') DEFAULT NULL,
  `sender_length` text,
  `route` varchar(20) DEFAULT '',
  `sender_open_close` tinyint(1) DEFAULT '0',
  `sender_id_close` tinyint(1) DEFAULT '0',
  `status` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=731 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_code_number_length_bak`
--

DROP TABLE IF EXISTS `country_code_number_length_bak`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_code_number_length_bak` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `country_short_code` varchar(50) DEFAULT NULL,
  `country_name` text,
  `country_series_code` int(11) DEFAULT NULL,
  `country_code_type` enum('','fixed','variable') DEFAULT NULL,
  `number_length` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_ip`
--

DROP TABLE IF EXISTS `country_ip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_ip` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `start_ip` varchar(20) DEFAULT NULL,
  `end_ip` varchar(20) DEFAULT NULL,
  `start_ip_int` int(10) unsigned DEFAULT NULL,
  `end_ip_end` int(10) unsigned DEFAULT NULL,
  `ab` varchar(5) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=155185 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_ip3`
--

DROP TABLE IF EXISTS `country_ip3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_ip3` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `start_ip` varchar(20) DEFAULT NULL,
  `end_ip` varchar(20) DEFAULT NULL,
  `start_ip_int` int(10) unsigned DEFAULT NULL,
  `end_ip_end` int(10) unsigned DEFAULT NULL,
  `ab` varchar(5) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_tbl`
--

DROP TABLE IF EXISTS `country_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_tbl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `countryName` varchar(255) NOT NULL,
  `flagid` varchar(255) NOT NULL,
  `bgcolor` varchar(255) NOT NULL,
  `bgimage` varchar(255) NOT NULL,
  `domainName` varchar(255) CHARACTER SET latin1 COLLATE latin1_bin NOT NULL,
  `resellerId` int(11) NOT NULL,
  `headBanner` longtext NOT NULL,
  `hostName` varchar(255) NOT NULL,
  `mhostName` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `country_wise_numbers`
--

DROP TABLE IF EXISTS `country_wise_numbers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_wise_numbers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `number_series` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `circle_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupon_trans`
--

DROP TABLE IF EXISTS `coupon_trans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_trans` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `coupon_pid` int(11) NOT NULL,
  `coupon_code` varchar(30) CHARACTER SET utf8 COLLATE utf8_swedish_ci NOT NULL,
  `date_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `coupon_pid` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(30) CHARACTER SET utf8 COLLATE utf8_swedish_ci NOT NULL,
  `balance` int(10) unsigned NOT NULL,
  `status` int(11) NOT NULL,
  `clubbed` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `route` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`coupon_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `currency`
--

DROP TABLE IF EXISTS `currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `currencyName` varchar(255) NOT NULL,
  `symbol` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `rate` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `currency_conversion`
--

DROP TABLE IF EXISTS `currency_conversion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_conversion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cr_from` varchar(11) NOT NULL DEFAULT '',
  `cr_to` varchar(11) NOT NULL DEFAULT '',
  `rate` decimal(10,6) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `current_route`
--

DROP TABLE IF EXISTS `current_route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `current_route` (
  `curr_route` int(11) NOT NULL AUTO_INCREMENT,
  `route_name` varchar(55) NOT NULL,
  `keyword` varchar(10) NOT NULL,
  `actual_route` int(11) NOT NULL,
  `description` longblob NOT NULL,
  `line2` blob NOT NULL,
  `line3` blob NOT NULL,
  `warning` varchar(255) NOT NULL,
  `pricing` varchar(55) NOT NULL,
  `status` int(11) NOT NULL,
  `msg_check` tinyint(1) NOT NULL,
  `spam_setting` int(11) NOT NULL,
  `route_time_setting` int(11) NOT NULL,
  `sender_id_setting` int(11) NOT NULL,
  `template_check_setting` int(11) NOT NULL,
  `dnd` text NOT NULL,
  `start_time` varchar(10) NOT NULL,
  `end_time` varchar(10) NOT NULL,
  PRIMARY KEY (`curr_route`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `current_voiceroute`
--

DROP TABLE IF EXISTS `current_voiceroute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `current_voiceroute` (
  `curr_route` int(11) NOT NULL AUTO_INCREMENT,
  `route_name` varchar(55) NOT NULL,
  `keyword` varchar(10) NOT NULL,
  `actual_route` int(11) NOT NULL,
  `description` longblob NOT NULL,
  `line2` blob NOT NULL,
  `line3` blob NOT NULL,
  `warning` varchar(255) NOT NULL,
  `pricing` varchar(55) NOT NULL,
  `dnd` varchar(5) NOT NULL,
  `refund` varchar(5) NOT NULL,
  `status` int(11) NOT NULL,
  `spam_setting` int(11) NOT NULL,
  `route_time_setting` int(11) NOT NULL,
  `template_check_setting` int(11) NOT NULL,
  `sender_id_setting` int(11) NOT NULL,
  PRIMARY KEY (`curr_route`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `custom_domain_short_url`
--

DROP TABLE IF EXISTS `custom_domain_short_url`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_domain_short_url` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `status` tinyint(4) NOT NULL,
  `subscription_status` tinyint(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_id` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_total_consumption`
--

DROP TABLE IF EXISTS `daily_total_consumption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_total_consumption` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `user_id` int(11) NOT NULL,
  `route` int(11) NOT NULL,
  `consumption` int(11) NOT NULL,
  `delivered` int(11) NOT NULL,
  `failed` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dashboard_summary`
--

DROP TABLE IF EXISTS `dashboard_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_summary` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `Time1` double NOT NULL,
  `Time2` double NOT NULL,
  `Time3` double NOT NULL,
  `Time1Average` double NOT NULL,
  `Time2Average` double NOT NULL,
  `Time3Average` double NOT NULL,
  `submit` double NOT NULL,
  `Total` double NOT NULL,
  `totalRetry1` longblob NOT NULL,
  `totalRetry2` blob NOT NULL,
  `totalRetry3` blob NOT NULL,
  `smppPercent` longblob NOT NULL,
  `Date` date NOT NULL,
  `Time4` double NOT NULL,
  `Time4Average` double NOT NULL,
  `totalRetry4` blob NOT NULL,
  `routeId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dashboard_summaryNew`
--

DROP TABLE IF EXISTS `dashboard_summaryNew`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_summaryNew` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `Time1` double NOT NULL,
  `Time2` double NOT NULL,
  `Time3` double NOT NULL,
  `Time1Average` double NOT NULL,
  `Time2Average` double NOT NULL,
  `Time3Average` double NOT NULL,
  `submit` double NOT NULL,
  `Total` double NOT NULL,
  `totalRetry1` longblob NOT NULL,
  `totalRetry2` blob NOT NULL,
  `totalRetry3` blob NOT NULL,
  `smppPercent` longblob NOT NULL,
  `Date` date NOT NULL,
  `Time4` double NOT NULL,
  `Time4Average` double NOT NULL,
  `totalRetry4` blob NOT NULL,
  `routeId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dashboard_summary_28_06`
--

DROP TABLE IF EXISTS `dashboard_summary_28_06`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_summary_28_06` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `Time1` double NOT NULL,
  `Time2` double NOT NULL,
  `Time3` double NOT NULL,
  `Time1Average` double NOT NULL,
  `Time2Average` double NOT NULL,
  `Time3Average` double NOT NULL,
  `submit` double NOT NULL,
  `Total` double NOT NULL,
  `totalRetry1` longblob NOT NULL,
  `totalRetry2` blob NOT NULL,
  `totalRetry3` blob NOT NULL,
  `smppPercent` longblob NOT NULL,
  `Date` timestamp NULL DEFAULT NULL,
  `Time4` double NOT NULL,
  `Time4Average` double NOT NULL,
  `totalRetry4` blob NOT NULL,
  `routeId` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1620 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dashboard_summary_Nov-1`
--

DROP TABLE IF EXISTS `dashboard_summary_Nov-1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_summary_Nov-1` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `Time1` double NOT NULL,
  `Time2` double NOT NULL,
  `Time3` double NOT NULL,
  `Time1Average` double NOT NULL,
  `Time2Average` double NOT NULL,
  `Time3Average` double NOT NULL,
  `submit` double NOT NULL,
  `Total` double NOT NULL,
  `totalRetry1` longblob NOT NULL,
  `totalRetry2` blob NOT NULL,
  `totalRetry3` blob NOT NULL,
  `smppPercent` longblob NOT NULL,
  `Date` date NOT NULL,
  `Time4` double NOT NULL,
  `Time4Average` double NOT NULL,
  `totalRetry4` blob NOT NULL,
  `routeId` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7149 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `decliningAnalysis`
--

DROP TABLE IF EXISTS `decliningAnalysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `decliningAnalysis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `accMng` int(11) NOT NULL,
  `reason` varchar(100) NOT NULL,
  `pattern` varchar(100) NOT NULL,
  `smsquant` int(11) NOT NULL,
  `scheduledate` datetime NOT NULL,
  `remark` varchar(100) NOT NULL,
  `industry` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `signup` datetime NOT NULL,
  `trueclient` varchar(100) NOT NULL,
  `latestactivity` varchar(100) NOT NULL,
  `onboard` int(11) NOT NULL,
  `balance` varchar(100) NOT NULL,
  `AvgConsumption` varchar(100) NOT NULL,
  `upDownPercentage` varchar(20) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16980 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `declining_users`
--

DROP TABLE IF EXISTS `declining_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `declining_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `remark` varchar(100) NOT NULL,
  `scheduleDate` date NOT NULL,
  `status` int(11) NOT NULL,
  `reason` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=296297 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `default_destination_country`
--

DROP TABLE IF EXISTS `default_destination_country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_destination_country` (
  `u_id` int(11) NOT NULL,
  `default_country_code` varchar(45) NOT NULL,
  `billing_country` varchar(10) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `supply` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`u_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `default_sender_smpp`
--

DROP TABLE IF EXISTS `default_sender_smpp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_sender_smpp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `country_id` int(10) DEFAULT NULL,
  `route_id` int(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_country` (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_smsc`
--

DROP TABLE IF EXISTS `deleted_smsc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deleted_smsc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `digioWebhookLogs`
--

DROP TABLE IF EXISTS `digioWebhookLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `digioWebhookLogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `webhookRequest` longtext,
  `logTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlt_failed_request`
--

DROP TABLE IF EXISTS `dlt_failed_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dlt_failed_request` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `awsFileUrl` varchar(100) DEFAULT NULL,
  `status` int(3) DEFAULT '0',
  `dateTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlt_operators`
--

DROP TABLE IF EXISTS `dlt_operators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dlt_operators` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_pid` int(11) NOT NULL,
  `Airtel` int(11) DEFAULT NULL,
  `Jio` int(11) DEFAULT NULL,
  `Tata` int(11) DEFAULT NULL,
  `Vi` int(11) DEFAULT NULL,
  `BSNL` int(11) DEFAULT NULL,
  `Hutch` int(11) DEFAULT NULL,
  `Docomo` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dnd`
--

DROP TABLE IF EXISTS `dnd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dnd` (
  `num` varchar(32) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email`
--

DROP TABLE IF EXISTS `email`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(40) NOT NULL,
  `sent` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2564 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_feature`
--

DROP TABLE IF EXISTS `email_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_feature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `email_status` int(11) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=570 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empty_entity_allowed`
--

DROP TABLE IF EXISTS `empty_entity_allowed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empty_entity_allowed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNQ_USR` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `executive_zip_report`
--

DROP TABLE IF EXISTS `executive_zip_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `executive_zip_report` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `awsUrl` varchar(200) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `userId` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=300 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `failed_nos`
--

DROP TABLE IF EXISTS `failed_nos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_nos` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `number` int(11) NOT NULL,
  `count` int(11) NOT NULL,
  `last_entry` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fallback_setting`
--

DROP TABLE IF EXISTS `fallback_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fallback_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route` int(11) NOT NULL,
  `kannel` varchar(4) NOT NULL,
  `priority` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fallback_status_and_alert`
--

DROP TABLE IF EXISTS `fallback_status_and_alert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fallback_status_and_alert` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `status` int(11) NOT NULL,
  `startTIme` datetime NOT NULL,
  `endTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `featureWiseUsers`
--

DROP TABLE IF EXISTS `featureWiseUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `featureWiseUsers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `feature` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `firstTimeSendotpUser`
--

DROP TABLE IF EXISTS `firstTimeSendotpUser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `firstTimeSendotpUser` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(40) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flow_condition_log`
--

DROP TABLE IF EXISTS `flow_condition_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flow_condition_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_id` varchar(55) DEFAULT NULL,
  `flow_id` varchar(55) DEFAULT NULL,
  `what_next` varchar(50) DEFAULT NULL,
  `after_min` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `is_bulk` tinyint(2) DEFAULT '0' COMMENT '0 - Single, 1 - Bulk',
  `send_anyway` tinyint(1) DEFAULT '0',
  `previous_channel` varchar(255) DEFAULT '',
  `next_id` varchar(255) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=659 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flow_email_templates`
--

DROP TABLE IF EXISTS `flow_email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flow_email_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `template` longtext NOT NULL,
  `subject` varchar(255) NOT NULL,
  `templateId` int(11) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  `email_from` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flow_voice_templates`
--

DROP TABLE IF EXISTS `flow_voice_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flow_voice_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `template` longtext NOT NULL,
  `accent` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  `is_spam` tinyint(4) DEFAULT NULL,
  `spam_response` text,
  `is_pending` tinyint(4) DEFAULT NULL,
  `status` tinyint(2) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flow_whatsapp_templates`
--

DROP TABLE IF EXISTS `flow_whatsapp_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flow_whatsapp_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `template` longtext NOT NULL,
  `created_date` timestamp NULL DEFAULT NULL,
  `updated_date` timestamp NULL DEFAULT NULL,
  `is_spam` tinyint(4) DEFAULT NULL,
  `spam_response` text,
  `is_pending` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `function_execution_times`
--

DROP TABLE IF EXISTS `function_execution_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `function_execution_times` (
  `pid` bigint(20) NOT NULL AUTO_INCREMENT,
  `request_id` varchar(250) DEFAULT NULL,
  `section_name` varchar(50) DEFAULT NULL,
  `execution_time` float DEFAULT NULL,
  `entry_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gdpr_user_storage_region`
--

DROP TABLE IF EXISTS `gdpr_user_storage_region`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gdpr_user_storage_region` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(45) NOT NULL,
  `storage_region_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=337 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `global_prefix_block`
--

DROP TABLE IF EXISTS `global_prefix_block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `global_prefix_block` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prefix` varchar(15) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `prefix_UNIQUE` (`prefix`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hello_team_members`
--

DROP TABLE IF EXISTS `hello_team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hello_team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `status` tinyint(2) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Unique` (`team_id`,`agent_id`),
  CONSTRAINT `f_key` FOREIGN KEY (`team_id`) REFERENCES `hello_teams` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hello_teams`
--

DROP TABLE IF EXISTS `hello_teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hello_teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `team_name` varchar(45) NOT NULL,
  `status` tinyint(2) NOT NULL,
  `voice_call_strategy` int(2) NOT NULL DEFAULT '1',
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`company_id`,`team_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `identity_documents`
--

DROP TABLE IF EXISTS `identity_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `identity_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `verification_link_id` int(11) NOT NULL,
  `document_type` tinyint(2) NOT NULL,
  `document_link` varchar(255) NOT NULL,
  `request_group` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Unique` (`verification_link_id`,`document_type`,`request_group`),
  CONSTRAINT `fkey_foreign` FOREIGN KEY (`verification_link_id`) REFERENCES `ms_user_identity_verification` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=668 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `identity_documents_archive`
--

DROP TABLE IF EXISTS `identity_documents_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `identity_documents_archive` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `verification_link_id` int(11) NOT NULL,
  `document_type` tinyint(2) NOT NULL,
  `document_link` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=580 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ildo_data`
--

DROP TABLE IF EXISTS `ildo_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ildo_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` varchar(20) NOT NULL,
  `template_id` varchar(40) NOT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_UNIQUE` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ildo_divert_error_code`
--

DROP TABLE IF EXISTS `ildo_divert_error_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ildo_divert_error_code` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` varchar(20) NOT NULL,
  `error_code` varchar(20) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `type` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=330 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `in_app_purchase_product`
--

DROP TABLE IF EXISTS `in_app_purchase_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `in_app_purchase_product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(45) NOT NULL,
  `amount_inr` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id_UNIQUE` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inactive_users`
--

DROP TABLE IF EXISTS `inactive_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inactive_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `remark` varchar(100) NOT NULL,
  `scheduleDate` date NOT NULL,
  `lost` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `reason` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1962210 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `indexbanner`
--

DROP TABLE IF EXISTS `indexbanner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `indexbanner` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` longtext NOT NULL,
  `countryid` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `instamojo_response`
--

DROP TABLE IF EXISTS `instamojo_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instamojo_response` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `response` text NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `internal_authentication`
--

DROP TABLE IF EXISTS `internal_authentication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internal_authentication` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `token` varchar(55) NOT NULL,
  `status` tinyint(2) DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userid_UNIQUE` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=1582 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoice_setting`
--

DROP TABLE IF EXISTS `invoice_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ipSecuritySkip`
--

DROP TABLE IF EXISTS `ipSecuritySkip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ipSecuritySkip` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `dateTime` timestamp NULL DEFAULT NULL,
  `reason` varchar(55) NOT NULL,
  `adminId` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ip_blocked_by_user`
--

DROP TABLE IF EXISTS `ip_blocked_by_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ip_blocked_by_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip` (`ip`,`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ipadd`
--

DROP TABLE IF EXISTS `ipadd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ipadd` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `ip` varchar(50) NOT NULL,
  PRIMARY KEY (`user_pid`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jwt_token_generator`
--

DROP TABLE IF EXISTS `jwt_token_generator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jwt_token_generator` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `identifier` varchar(100) NOT NULL,
  `authkey` varchar(55) NOT NULL,
  `token` varchar(100) NOT NULL,
  `encryptToken` varchar(50) NOT NULL,
  `JWT_expiry_time` int(5) NOT NULL,
  `otp_expiry_time` datetime NOT NULL,
  `try_count` int(5) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`identifier`,`authkey`),
  UNIQUE KEY `encryptToken_UNIQUE` (`encryptToken`)
) ENGINE=InnoDB AUTO_INCREMENT=914 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kannel_box_inform_logs`
--

DROP TABLE IF EXISTS `kannel_box_inform_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kannel_box_inform_logs` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `sentTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kannel_submission_data`
--

DROP TABLE IF EXISTS `kannel_submission_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kannel_submission_data` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `kannel` int(11) NOT NULL,
  `panel` int(11) NOT NULL,
  `count` bigint(20) NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1106 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kyc_info_mapping`
--

DROP TABLE IF EXISTS `kyc_info_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kyc_info_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `verification_link_id` int(11) DEFAULT NULL,
  `kyc_id` varchar(45) DEFAULT NULL,
  `kyc_status` varchar(45) NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=387 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kyc_verification_reasons`
--

DROP TABLE IF EXISTS `kyc_verification_reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kyc_verification_reasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reason_text` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `load_balancer`
--

DROP TABLE IF EXISTS `load_balancer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_balancer` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `instanceId` varchar(15) NOT NULL,
  `status` varchar(10) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `load_balancer_alerts`
--

DROP TABLE IF EXISTS `load_balancer_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_balancer_alerts` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `last_alert` datetime NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `load_balancer_logs`
--

DROP TABLE IF EXISTS `load_balancer_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `load_balancer_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(10) NOT NULL,
  `instance` varchar(15) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logger`
--

DROP TABLE IF EXISTS `logger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `req_id` varchar(50) DEFAULT NULL,
  `req_valid` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1184387 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loginLog`
--

DROP TABLE IF EXISTS `loginLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loginLog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(25) NOT NULL,
  `username` varchar(55) NOT NULL,
  `password` varchar(55) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `panel_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loginLogNew`
--

DROP TABLE IF EXISTS `loginLogNew`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loginLogNew` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(25) NOT NULL,
  `username` varchar(55) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `browser` varchar(55) DEFAULT NULL,
  `loginMethod` varchar(25) DEFAULT NULL,
  `isBlocked` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7138 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loginLogNew_vip`
--

DROP TABLE IF EXISTS `loginLogNew_vip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loginLogNew_vip` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(25) NOT NULL,
  `username` varchar(55) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `login_as_permission_requests`
--

DROP TABLE IF EXISTS `login_as_permission_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_as_permission_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `access_time` int(11) NOT NULL,
  `access_time_format` varchar(2) NOT NULL DEFAULT '',
  `expires_at` timestamp NULL DEFAULT NULL,
  `action_by_user` varchar(11) DEFAULT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `login_failed`
--

DROP TABLE IF EXISTS `login_failed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_failed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(55) NOT NULL,
  `ip` varchar(100) NOT NULL DEFAULT '',
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=117116 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `longcode_report`
--

DROP TABLE IF EXISTS `longcode_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `longcode_report` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(32) CHARACTER SET latin1 NOT NULL,
  `tonum` varchar(12) CHARACTER SET latin1 NOT NULL,
  `from` varchar(12) CHARACTER SET latin1 NOT NULL,
  `message` varchar(1024) COLLATE utf8_unicode_ci NOT NULL,
  `keyword` varchar(25) CHARACTER SET latin1 NOT NULL,
  `timestamp` varchar(50) CHARACTER SET latin1 NOT NULL,
  `status` tinyint(4) NOT NULL,
  `receive_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6852030 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `longcode_report_log`
--

DROP TABLE IF EXISTS `longcode_report_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `longcode_report_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(32) CHARACTER SET latin1 NOT NULL,
  `tonum` varchar(12) CHARACTER SET latin1 NOT NULL,
  `from` varchar(12) CHARACTER SET latin1 NOT NULL,
  `message` varchar(1024) COLLATE utf8_unicode_ci NOT NULL,
  `keyword` varchar(25) CHARACTER SET latin1 NOT NULL,
  `timestamp` varchar(50) CHARACTER SET latin1 NOT NULL,
  `status` tinyint(4) NOT NULL,
  `receive_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=607493 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mail2sms`
--

DROP TABLE IF EXISTS `mail2sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail2sms` (
  `_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `message` varchar(700) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `sender` varchar(20) NOT NULL,
  `mobiles` blob NOT NULL,
  `unicode` int(11) NOT NULL,
  `route` blob NOT NULL,
  `authkey` varchar(25) NOT NULL,
  `timestamp` timestamp NULL DEFAULT NULL,
  `sent` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mail_details`
--

DROP TABLE IF EXISTS `mail_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_details` (
  `mail_pid` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `fromEmail` varchar(20) NOT NULL,
  `subject` varchar(250) NOT NULL,
  `content` text NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `count` int(11) NOT NULL,
  `reqId` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`mail_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=590 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mandate_auth_logs`
--

DROP TABLE IF EXISTS `mandate_auth_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mandate_auth_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mandate_id` int(11) NOT NULL,
  `auth_status` tinyint(1) NOT NULL,
  `failure_reason` varchar(250) NOT NULL,
  `mandate_status` tinyint(1) NOT NULL,
  `event_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mandate_payments`
--

DROP TABLE IF EXISTS `mandate_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mandate_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `mandate_id` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) NOT NULL,
  `net_amount` double(20,5) NOT NULL,
  `retry_attempts` int(3) NOT NULL DEFAULT '0',
  `schedule_date` date DEFAULT NULL,
  `description` varchar(150) DEFAULT NULL,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id_UNIQUE` (`payment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mandate_payments_common`
--

DROP TABLE IF EXISTS `mandate_payments_common`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mandate_payments_common` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `payment_id` varchar(30) NOT NULL,
  `token_id` varchar(150) NOT NULL,
  `mandate_id` varchar(150) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) NOT NULL,
  `net_amount` double(20,5) NOT NULL,
  `retry_attempts` int(3) NOT NULL DEFAULT '0',
  `schedule_date` date DEFAULT NULL,
  `description` varchar(150) DEFAULT NULL,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id_UNIQUE` (`payment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50749 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mandate_payments_paypal`
--

DROP TABLE IF EXISTS `mandate_payments_paypal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mandate_payments_paypal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `payment_id` varchar(30) NOT NULL,
  `token_id` varchar(30) NOT NULL,
  `mandate_id` varchar(30) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) NOT NULL,
  `net_amount` double(20,5) NOT NULL,
  `description` varchar(150) DEFAULT NULL,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id_UNIQUE` (`payment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3172 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mandate_payments_stripe`
--

DROP TABLE IF EXISTS `mandate_payments_stripe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mandate_payments_stripe` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `payment_id` varchar(30) NOT NULL,
  `token_id` varchar(150) NOT NULL,
  `mandate_id` varchar(150) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) NOT NULL,
  `net_amount` double(20,5) NOT NULL,
  `description` varchar(150) DEFAULT NULL,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id_UNIQUE` (`payment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mandate_plans`
--

DROP TABLE IF EXISTS `mandate_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mandate_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_id` varchar(45) NOT NULL,
  `plan_name` varchar(45) NOT NULL,
  `amount` int(11) NOT NULL,
  `type` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plan_id_UNIQUE` (`plan_id`),
  UNIQUE KEY `plan_name_UNIQUE` (`plan_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mandates`
--

DROP TABLE IF EXISTS `mandates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mandates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mandate_id` int(11) NOT NULL,
  `mandate_name` varchar(45) NOT NULL,
  `company_id` int(11) NOT NULL,
  `plan_id` varchar(45) NOT NULL,
  `status` int(11) NOT NULL,
  `auth_link` varchar(45) NOT NULL,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mandate_id_UNIQUE` (`mandate_id`),
  UNIQUE KEY `companyName_MandateId_Uniuqe` (`company_id`,`mandate_name`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `menues`
--

DROP TABLE IF EXISTS `menues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `menulinks` varchar(255) NOT NULL,
  `countryId` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `MenuNumbring` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message_pricing`
--

DROP TABLE IF EXISTS `message_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_pricing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_range` int(11) NOT NULL,
  `pricing` decimal(10,2) NOT NULL,
  `route` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `type` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=755 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message_pricing_bckp`
--

DROP TABLE IF EXISTS `message_pricing_bckp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_pricing_bckp` (
  `id` int(11) NOT NULL,
  `message_range` int(11) NOT NULL,
  `pricing` decimal(10,2) NOT NULL,
  `route` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `type` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `micro_sub_payment_failed_logs`
--

DROP TABLE IF EXISTS `micro_sub_payment_failed_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `micro_sub_payment_failed_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `companyId_UNIQUE` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=207673 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `microservice_names`
--

DROP TABLE IF EXISTS `microservice_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `microservice_names` (
  `microservice_id` int(11) NOT NULL AUTO_INCREMENT,
  `microservice_name` varchar(45) NOT NULL,
  PRIMARY KEY (`microservice_id`),
  UNIQUE KEY `id_UNIQUE` (`microservice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `microservice_payment_log`
--

DROP TABLE IF EXISTS `microservice_payment_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `microservice_payment_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(10) NOT NULL,
  `microservice` varchar(30) NOT NULL,
  `amount` double(20,5) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(45) DEFAULT 'Deduction',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44689 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mobile_sessions`
--

DROP TABLE IF EXISTS `mobile_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(55) NOT NULL DEFAULT '',
  `expiry_date` datetime NOT NULL,
  `create_date` datetime NOT NULL,
  `update_date` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `update_date` (`update_date`),
  KEY `expiry_date` (`expiry_date`),
  KEY `update_date_2` (`update_date`,`expiry_date`)
) ENGINE=InnoDB AUTO_INCREMENT=44014 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_Onlinetransaction`
--

DROP TABLE IF EXISTS `ms_Onlinetransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_Onlinetransaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `trans_id` varchar(30) DEFAULT NULL,
  `response_amount` decimal(14,2) DEFAULT NULL,
  `steps` tinyint(4) DEFAULT NULL,
  `no_sms` int(11) DEFAULT NULL,
  `request_amount` decimal(14,2) DEFAULT NULL,
  `credit_type` tinyint(1) DEFAULT NULL,
  `credit_by` tinyint(1) DEFAULT NULL,
  `description` text,
  `trans_time` timestamp NULL DEFAULT NULL,
  `order_no` varchar(255) DEFAULT NULL,
  `dummy_route` varchar(255) DEFAULT NULL,
  `rate` decimal(6,5) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `response_msg` text,
  `gateway_response` text,
  `gateway_order_id` varchar(100) DEFAULT NULL,
  `tds_percentage` int(11) DEFAULT NULL,
  `tds_amount` decimal(14,2) DEFAULT NULL,
  `gross_amount` decimal(14,2) DEFAULT NULL,
  `tax_amount` decimal(14,2) DEFAULT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `payment_cancel_count` tinyint(4) DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `payment_retry_count` tinyint(4) DEFAULT NULL,
  `ms_Onlinetransactioncol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44567 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_advisory_board_ids`
--

DROP TABLE IF EXISTS `ms_advisory_board_ids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_advisory_board_ids` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_alerts`
--

DROP TABLE IF EXISTS `ms_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `reseller_id` int(11) NOT NULL,
  `setall` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_android`
--

DROP TABLE IF EXISTS `ms_android`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_android` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reg_key` text NOT NULL,
  `agent` varchar(25) NOT NULL,
  `pannel` varchar(55) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_auth_key_usecase`
--

DROP TABLE IF EXISTS `ms_auth_key_usecase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_auth_key_usecase` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT '0',
  `use_case` varchar(512) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_USE_CASE` (`use_case`)
) ENGINE=InnoDB AUTO_INCREMENT=4001 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_authkey_reseller_map`
--

DROP TABLE IF EXISTS `ms_authkey_reseller_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_authkey_reseller_map` (
  `authkey` varchar(255) NOT NULL,
  `reseller_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`authkey`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_authkey_usage_info`
--

DROP TABLE IF EXISTS `ms_authkey_usage_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_authkey_usage_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `authkey` varchar(55) NOT NULL,
  `lastAlertAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `alertCount` int(2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authkey` (`authkey`)
) ENGINE=InnoDB AUTO_INCREMENT=15842 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_auto_rejected_sender_id`
--

DROP TABLE IF EXISTS `ms_auto_rejected_sender_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_auto_rejected_sender_id` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` varchar(55) CHARACTER SET latin1 NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `sent_count` int(11) NOT NULL,
  `insert_date` varchar(55) DEFAULT NULL,
  `update_date` timestamp NULL DEFAULT NULL,
  `panel_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_auto_routes`
--

DROP TABLE IF EXISTS `ms_auto_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_auto_routes` (
  `id` int(30) NOT NULL AUTO_INCREMENT,
  `route_pid` int(30) NOT NULL,
  `route_name` text NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_blockno`
--

DROP TABLE IF EXISTS `ms_blockno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_blockno` (
  `blockno_id` int(20) NOT NULL AUTO_INCREMENT,
  `blockno_number` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` varchar(1024) DEFAULT NULL,
  `sender_user_pid` varchar(2048) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `check_for_all` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`blockno_id`),
  UNIQUE KEY `blockno_number` (`blockno_number`),
  KEY `sender_user_pid` (`sender_user_pid`(767))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_bsend`
--

DROP TABLE IF EXISTS `ms_bsend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_bsend` (
  `bsend_pid` int(11) NOT NULL AUTO_INCREMENT,
  `bsend_word` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`bsend_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=1941 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_btxt`
--

DROP TABLE IF EXISTS `ms_btxt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_btxt` (
  `btxt_pid` int(30) NOT NULL AUTO_INCREMENT,
  `btxt_word` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`btxt_pid`),
  UNIQUE KEY `unique` (`btxt_word`(45))
) ENGINE=InnoDB AUTO_INCREMENT=445 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_caller_id`
--

DROP TABLE IF EXISTS `ms_caller_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_caller_id` (
  `caller_pid` bigint(20) NOT NULL AUTO_INCREMENT,
  `caller_userId` bigint(20) NOT NULL,
  `caller_callerId` varchar(32) NOT NULL,
  `caller_verify_code` varchar(20) NOT NULL,
  `caller_verify_flag` int(11) NOT NULL,
  `caller_default_flag` int(11) NOT NULL,
  PRIMARY KEY (`caller_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=15317 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_circle`
--

DROP TABLE IF EXISTS `ms_circle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_circle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `circle` varchar(100) NOT NULL,
  `totalSms` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1364 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_cron_check`
--

DROP TABLE IF EXISTS `ms_cron_check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_cron_check` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cron_name` varchar(255) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `output` blob NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56046 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_crons_detail`
--

DROP TABLE IF EXISTS `ms_crons_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_crons_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `time` varchar(255) NOT NULL,
  `value` decimal(6,2) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_demo_user`
--

DROP TABLE IF EXISTS `ms_demo_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_demo_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `is_demo` tinyint(1) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=167443 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_dialplanPrefix`
--

DROP TABLE IF EXISTS `ms_dialplanPrefix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_dialplanPrefix` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prefix` int(11) NOT NULL,
  `providerId` int(11) NOT NULL,
  `circle` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `prov` (`providerId`)
) ENGINE=InnoDB AUTO_INCREMENT=29262 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_domain`
--

DROP TABLE IF EXISTS `ms_domain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_domain` (
  `subsite_pid` int(11) NOT NULL AUTO_INCREMENT,
  `subsite_userid` int(11) NOT NULL,
  `subsite_logo` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_dname` tinytext CHARACTER SET latin1 NOT NULL,
  `subsite_sdname` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_cname` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_copyright` blob NOT NULL,
  `subsite_pack` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_style` int(11) NOT NULL,
  `subsite_language` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `signup_enabled` int(11) NOT NULL,
  `ip` varchar(55) COLLATE utf8_bin DEFAULT NULL,
  `panelId` int(11) NOT NULL,
  PRIMARY KEY (`subsite_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=16576 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_domain_Mar24`
--

DROP TABLE IF EXISTS `ms_domain_Mar24`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_domain_Mar24` (
  `subsite_pid` int(11) NOT NULL AUTO_INCREMENT,
  `subsite_userid` int(11) NOT NULL,
  `subsite_logo` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_dname` tinytext CHARACTER SET latin1 NOT NULL,
  `subsite_sdname` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_cname` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_copyright` blob NOT NULL,
  `subsite_pack` tinytext COLLATE utf8_bin NOT NULL,
  `subsite_style` int(11) NOT NULL,
  `subsite_language` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `signup_enabled` int(11) NOT NULL,
  `ip` varchar(55) COLLATE utf8_bin DEFAULT NULL,
  `panelId` int(11) NOT NULL,
  PRIMARY KEY (`subsite_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=16553 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_drafts`
--

DROP TABLE IF EXISTS `ms_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_drafts` (
  `drafts_pid` int(11) NOT NULL AUTO_INCREMENT,
  `drafts_userid` int(11) NOT NULL,
  `drafts_type` int(11) NOT NULL,
  `drafts_msg` text COLLATE utf8_bin NOT NULL,
  `draft_audio` blob,
  `DLT_TE_ID` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`drafts_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=2518 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_error_codes`
--

DROP TABLE IF EXISTS `ms_error_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_error_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `error_code` varchar(20) NOT NULL,
  `description` varchar(255) NOT NULL,
  `help_doc_direct_client` varchar(255) DEFAULT NULL,
  `help_doc_indirect_client` varchar(255) DEFAULT NULL,
  `ct_error_code` varchar(20) DEFAULT NULL,
  `no_retry` tinyint(1) NOT NULL DEFAULT '0',
  `DLT` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_executive_report`
--

DROP TABLE IF EXISTS `ms_executive_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_executive_report` (
  `report_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `report_uid` int(11) NOT NULL,
  `date` date NOT NULL,
  `total` bigint(20) NOT NULL,
  `rejected` bigint(20) NOT NULL,
  `delivered` bigint(20) NOT NULL,
  `failed` bigint(20) NOT NULL,
  `Rejected Retry` int(11) NOT NULL,
  `Failed Retry` int(11) NOT NULL,
  `Auto Failed` bigint(20) NOT NULL,
  `dnd_credit` float NOT NULL,
  `request_route` int(11) NOT NULL,
  `ndnc` bigint(20) NOT NULL,
  `block` bigint(20) NOT NULL,
  `pending` int(11) NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `no_of_request` int(11) NOT NULL,
  `balance_deducted` int(11) NOT NULL,
  `lastUpdated` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB AUTO_INCREMENT=200010 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_executive_report_copy`
--

DROP TABLE IF EXISTS `ms_executive_report_copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_executive_report_copy` (
  `report_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `report_uid` int(11) NOT NULL,
  `date` date NOT NULL,
  `campaign_id` varchar(50) CHARACTER SET utf8 NOT NULL,
  `request_route` int(11) NOT NULL,
  `no_of_request` int(11) NOT NULL,
  `total` bigint(20) NOT NULL,
  `rejected` bigint(20) NOT NULL,
  `delivered` bigint(20) NOT NULL,
  `failed` bigint(20) NOT NULL,
  `Auto Failed` bigint(20) NOT NULL,
  `ndnc` bigint(20) NOT NULL,
  `block` bigint(20) NOT NULL,
  `pending` int(11) NOT NULL,
  `delivered_credit` bigint(20) NOT NULL,
  `rejected_credit` bigint(20) NOT NULL,
  `failed_credit` bigint(20) NOT NULL,
  `auto_failed_credit` bigint(20) NOT NULL,
  `balance_deducted` int(11) NOT NULL,
  `lastUpdated` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `report_uid` (`report_uid`,`request_route`,`date`,`campaign_id`)
) ENGINE=InnoDB AUTO_INCREMENT=200013 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_executive_report_pending`
--

DROP TABLE IF EXISTS `ms_executive_report_pending`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_executive_report_pending` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `route` varchar(5) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `campId` varchar(30) DEFAULT NULL,
  `requestId` varchar(30) DEFAULT NULL,
  `pending` int(11) NOT NULL,
  `type` varchar(10) DEFAULT NULL,
  `lastUpdated` timestamp NULL DEFAULT NULL,
  `entryTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_export_report_otp`
--

DROP TABLE IF EXISTS `ms_export_report_otp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_export_report_otp` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_params` text NOT NULL,
  `status` tinyint(1) NOT NULL,
  `execution_time` datetime NOT NULL,
  `record_exported` int(10) unsigned NOT NULL,
  `entry_datetime` datetime NOT NULL,
  `export_type` tinyint(1) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `panel_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_forgot`
--

DROP TABLE IF EXISTS `ms_forgot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_forgot` (
  `forgot_pid` int(11) NOT NULL AUTO_INCREMENT,
  `forgot_userid` int(11) NOT NULL,
  `forgot_date` datetime NOT NULL,
  PRIMARY KEY (`forgot_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_giddh_details`
--

DROP TABLE IF EXISTS `ms_giddh_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_giddh_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `gateway` varchar(10) DEFAULT NULL,
  `auth_key` varchar(1000) NOT NULL,
  `company_name` varchar(1000) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_gidhh_details`
--

DROP TABLE IF EXISTS `ms_gidhh_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_gidhh_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `auth_key` varchar(1000) NOT NULL,
  `company_name` varchar(1000) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_group`
--

DROP TABLE IF EXISTS `ms_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_group` (
  `group_pid` int(11) NOT NULL AUTO_INCREMENT,
  `group_userid` int(11) NOT NULL,
  `group_name` varchar(50) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`group_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_hard_block_keywords`
--

DROP TABLE IF EXISTS `ms_hard_block_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_hard_block_keywords` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `keyword` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=latin1 COMMENT='Always block route 4 messages containing the keywords';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_hidden_route`
--

DROP TABLE IF EXISTS `ms_hidden_route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_hidden_route` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_pid` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_history`
--

DROP TABLE IF EXISTS `ms_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_history` (
  `history_pid` int(11) NOT NULL AUTO_INCREMENT,
  `history_date` datetime NOT NULL,
  `history_addr` varchar(100) COLLATE utf8_bin NOT NULL,
  `history_userid` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `history_status` enum('0','1') COLLATE utf8_bin NOT NULL,
  `history_session_id` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `history_agent` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `history_login_method` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `geo_data` varchar(100) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`history_pid`),
  KEY `history_userid` (`history_userid`),
  KEY `history_session_id` (`history_session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=130440 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_history_10_07`
--

DROP TABLE IF EXISTS `ms_history_10_07`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_history_10_07` (
  `history_pid` int(11) NOT NULL AUTO_INCREMENT,
  `history_date` datetime NOT NULL,
  `history_addr` varchar(100) COLLATE utf8_bin NOT NULL,
  `history_userid` int(11) NOT NULL,
  `history_status` enum('0','1') COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`history_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=90008 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_history_Jun-15-2021`
--

DROP TABLE IF EXISTS `ms_history_Jun-15-2021`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_history_Jun-15-2021` (
  `history_pid` int(11) NOT NULL AUTO_INCREMENT,
  `history_date` datetime NOT NULL,
  `history_addr` varchar(100) COLLATE utf8_bin NOT NULL,
  `history_userid` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `history_status` enum('0','1') COLLATE utf8_bin NOT NULL,
  `history_session_id` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `history_agent` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `history_login_method` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`history_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=21779 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_impno`
--

DROP TABLE IF EXISTS `ms_impno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_impno` (
  `impno_id` int(11) NOT NULL AUTO_INCREMENT,
  `impno_userid` text NOT NULL,
  `impno_number` bigint(20) NOT NULL,
  `add_by` text NOT NULL,
  PRIMARY KEY (`impno_id`,`impno_number`),
  UNIQUE KEY `impno_number` (`impno_number`)
) ENGINE=InnoDB AUTO_INCREMENT=1667 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_invite_member`
--

DROP TABLE IF EXISTS `ms_invite_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_invite_member` (
  `member_id` int(20) NOT NULL AUTO_INCREMENT,
  `member_company_id` bigint(20) unsigned NOT NULL,
  `member_user_id` bigint(20) unsigned DEFAULT '0',
  `member_name` varchar(255) DEFAULT NULL,
  `member_email` varchar(255) NOT NULL,
  `member_role` int(11) NOT NULL,
  `member_access` mediumtext,
  `member_request` longtext NOT NULL,
  `member_status` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '0 = none, 1 = active, 2 = decliend ',
  `member_invite_resend` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `member_invite_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3518 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_invites`
--

DROP TABLE IF EXISTS `ms_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_invites` (
  `c_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`c_id`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_kannel_send`
--

DROP TABLE IF EXISTS `ms_kannel_send`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_kannel_send` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `send_mobno` varchar(40) NOT NULL,
  `sms_id` varchar(30) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_lead_admin`
--

DROP TABLE IF EXISTS `ms_lead_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_lead_admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(255) NOT NULL,
  `pipe_id` varchar(255) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `status` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_leads`
--

DROP TABLE IF EXISTS `ms_leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_leads` (
  `user_pid` int(11) DEFAULT NULL,
  `user_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_date` datetime NOT NULL,
  `admin_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `lead_id` varchar(255) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`user_mobno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_long_code_expiry`
--

DROP TABLE IF EXISTS `ms_long_code_expiry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_long_code_expiry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `long_code_expiry` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_long_code_expiry_20`
--

DROP TABLE IF EXISTS `ms_long_code_expiry_20`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_long_code_expiry_20` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `long_code_expiry` int(11) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_longcode`
--

DROP TABLE IF EXISTS `ms_longcode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_longcode` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `longcode` double NOT NULL,
  `type` tinyint(4) NOT NULL,
  `user_pid` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_longcode_balance`
--

DROP TABLE IF EXISTS `ms_longcode_balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_longcode_balance` (
  `balance_id` int(11) NOT NULL AUTO_INCREMENT,
  `usrid` int(11) NOT NULL,
  `balance` int(11) NOT NULL,
  PRIMARY KEY (`balance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_longcode_balance_deleted`
--

DROP TABLE IF EXISTS `ms_longcode_balance_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_longcode_balance_deleted` (
  `balance_id` int(11) NOT NULL AUTO_INCREMENT,
  `usrid` int(11) NOT NULL,
  `balance` int(11) NOT NULL,
  PRIMARY KEY (`balance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_longcode_deleted`
--

DROP TABLE IF EXISTS `ms_longcode_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_longcode_deleted` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `longcode` double NOT NULL,
  `senderid` varchar(50) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `date_of_deletion` timestamp NULL DEFAULT NULL,
  `message` varchar(1000) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_longcode_keyword`
--

DROP TABLE IF EXISTS `ms_longcode_keyword`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_longcode_keyword` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `longcode` bigint(20) NOT NULL,
  `keyword` varchar(20) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `senderid` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `url` varchar(255) NOT NULL,
  `urls` text,
  `email` varchar(255) DEFAULT NULL,
  `DLT_TE_ID` varchar(55) DEFAULT NULL,
  PRIMARY KEY (`key_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6541 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_longcode_number`
--

DROP TABLE IF EXISTS `ms_longcode_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_longcode_number` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` varchar(16) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `longcode_type` tinyint(4) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_longcode_subscription`
--

DROP TABLE IF EXISTS `ms_longcode_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_longcode_subscription` (
  `user_pid` int(11) NOT NULL,
  `subscribe` enum('0','1') NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_low_balance_alert_history`
--

DROP TABLE IF EXISTS `ms_low_balance_alert_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_low_balance_alert_history` (
  `user_id` int(50) NOT NULL,
  `route` int(12) NOT NULL,
  `balance_last_hour` double(20,5) DEFAULT NULL COMMENT 'Balance snapshot from last hour for usage calculation',
  `balance_last_hour_time` int(11) DEFAULT NULL COMMENT 'Unix timestamp when balance_last_hour was recorded',
  `last_alert_time` int(11) DEFAULT NULL COMMENT 'Unix timestamp when last alert was sent',
  `last_alert_type` varchar(20) COLLATE utf8_bin DEFAULT NULL COMMENT 'Type of last alert: soft or critical',
  `last_recharge_time` int(11) DEFAULT NULL COMMENT 'Unix timestamp of last recharge when alert was sent',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`route`),
  KEY `idx_last_alert_time` (`last_alert_time`),
  KEY `idx_balance_last_hour_time` (`balance_last_hour_time`),
  KEY `idx_route` (`route`),
  CONSTRAINT `fk_alert_user` FOREIGN KEY (`user_id`) REFERENCES `ms_user` (`user_pid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Tracks low balance alerts and hourly balance snapshots per route';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_magic_link`
--

DROP TABLE IF EXISTS `ms_magic_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_magic_link` (
  `user_pid` int(11) NOT NULL,
  `user_email` varchar(100) NOT NULL,
  `token` varchar(100) NOT NULL,
  `expiry_time` datetime NOT NULL,
  `try_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`user_pid`,`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_mapping`
--

DROP TABLE IF EXISTS `ms_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_mapping` (
  `c_id` int(11) NOT NULL,
  `u_id` int(11) NOT NULL,
  `type` tinyint(1) NOT NULL,
  `prv` varchar(512) NOT NULL DEFAULT '',
  `added_on` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`c_id`,`u_id`),
  KEY `idx_mapping_uid_cid` (`u_id`,`c_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_mapping_deleted`
--

DROP TABLE IF EXISTS `ms_mapping_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_mapping_deleted` (
  `c_id` int(11) NOT NULL,
  `u_id` int(11) NOT NULL,
  `type` tinyint(1) NOT NULL,
  `prv` varchar(255) NOT NULL,
  `added_on` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`c_id`,`u_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_min_limit_ratio`
--

DROP TABLE IF EXISTS `ms_min_limit_ratio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_min_limit_ratio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` bigint(20) NOT NULL,
  `voice` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_missedcall`
--

DROP TABLE IF EXISTS `ms_missedcall`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_missedcall` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` varchar(20) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `sender` varchar(20) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `message` varchar(1000) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_pid` int(11) NOT NULL,
  `date_time` timestamp NULL DEFAULT NULL,
  `pushUrl` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_missedcall_report`
--

DROP TABLE IF EXISTS `ms_missedcall_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_missedcall_report` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `user_number` varchar(15) NOT NULL,
  `miss_call_number` varchar(15) NOT NULL,
  `hitTime` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_notification`
--

DROP TABLE IF EXISTS `ms_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `signup_email` tinyint(4) NOT NULL,
  `all_domain_login` tinyint(4) DEFAULT NULL,
  `all_client_login` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_number_block_notification`
--

DROP TABLE IF EXISTS `ms_number_block_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_number_block_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_operator_price`
--

DROP TABLE IF EXISTS `ms_operator_price`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_operator_price` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `smpp` varchar(50) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `prefix` int(11) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'INR',
  `price` float NOT NULL,
  `fail_price` float NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE` (`smpp`,`prefix`,`currency`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_operator_price_ex`
--

DROP TABLE IF EXISTS `ms_operator_price_ex`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_operator_price_ex` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `smpp` varchar(50) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `prefix` int(11) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'INR',
  `price` float NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE` (`smpp`,`prefix`,`currency`)
) ENGINE=InnoDB AUTO_INCREMENT=211 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_operator_price_ex_op`
--

DROP TABLE IF EXISTS `ms_operator_price_ex_op`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_operator_price_ex_op` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `smpp` varchar(50) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `prefix` int(11) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'INR',
  `price` float NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE` (`smpp`,`prefix`,`currency`)
) ENGINE=InnoDB AUTO_INCREMENT=1470 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_panel_time`
--

DROP TABLE IF EXISTS `ms_panel_time`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_panel_time` (
  `panelTime` varchar(10) NOT NULL,
  `uniqueid` tinyint(1) NOT NULL,
  PRIMARY KEY (`uniqueid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_payment_url`
--

DROP TABLE IF EXISTS `ms_payment_url`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_payment_url` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `url` varchar(100) NOT NULL DEFAULT '',
  `buttontext` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_pb_campaign`
--

DROP TABLE IF EXISTS `ms_pb_campaign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_pb_campaign` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `campaign_id` varchar(100) DEFAULT NULL,
  `camp_name` varchar(100) DEFAULT NULL,
  `camp_type` enum('OnGoing','OneTime') DEFAULT NULL,
  `country` int(11) DEFAULT NULL,
  `get_audience` varchar(120) DEFAULT NULL,
  `audience_add_detail` text,
  `route` int(11) DEFAULT NULL,
  `throttle_value` int(11) DEFAULT NULL,
  `throttle_per` enum('min','hrs','day') DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `day_start_time` time DEFAULT NULL,
  `day_end_time` time DEFAULT NULL,
  `condition_time` int(11) DEFAULT NULL,
  `voice_condition` varchar(50) DEFAULT NULL,
  `voice_id` int(11) DEFAULT NULL,
  `text_id` int(11) DEFAULT NULL,
  `start_sending_time` datetime DEFAULT NULL,
  `stop_sending_time` datetime DEFAULT NULL,
  `is_pending` tinyint(4) DEFAULT NULL,
  `request_id` varchar(50) DEFAULT NULL,
  `is_template` tinyint(4) DEFAULT NULL,
  `send_old_contact` tinyint(4) DEFAULT NULL,
  `last_executed_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_pb_template`
--

DROP TABLE IF EXISTS `ms_pb_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_pb_template` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` int(11) NOT NULL,
  `template_name` varchar(100) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `created_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_phnbk`
--

DROP TABLE IF EXISTS `ms_phnbk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_phnbk` (
  `phnbk_pid` int(11) NOT NULL AUTO_INCREMENT,
  `phnbk_groupid` int(11) NOT NULL,
  `phnbk_name` varchar(40) COLLATE utf8_bin NOT NULL,
  `phnbk_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `phnbk_city` varchar(40) COLLATE utf8_bin NOT NULL,
  `phnbk_occup` varchar(40) COLLATE utf8_bin NOT NULL,
  `phnbk_email` varchar(150) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`phnbk_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_prefix_sender`
--

DROP TABLE IF EXISTS `ms_prefix_sender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_prefix_sender` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `prefix` int(11) NOT NULL,
  `sender` int(11) NOT NULL,
  PRIMARY KEY (`pid`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_providers`
--

DROP TABLE IF EXISTS `ms_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_providers` (
  `provider_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `route` int(11) DEFAULT NULL,
  `dialplan_id` int(11) NOT NULL,
  `price` float NOT NULL,
  `second_route` int(11) DEFAULT NULL,
  PRIMARY KEY (`provider_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19153 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_providers_13`
--

DROP TABLE IF EXISTS `ms_providers_13`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_providers_13` (
  `provider_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `route` int(11) DEFAULT NULL,
  `dialplan_id` int(11) NOT NULL,
  `price` float NOT NULL,
  PRIMARY KEY (`provider_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1108 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_push_dlr`
--

DROP TABLE IF EXISTS `ms_push_dlr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_push_dlr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  `header` text NOT NULL,
  `status` int(11) NOT NULL,
  `type` tinyint(2) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `userid_type_UNIQUE` (`user_pid`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=7047 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_r4_keywords`
--

DROP TABLE IF EXISTS `ms_r4_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_r4_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keyword` varchar(50) NOT NULL,
  `approved_by` int(11) NOT NULL,
  `user` int(11) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_r4_sender`
--

DROP TABLE IF EXISTS `ms_r4_sender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_r4_sender` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `senderid` varchar(10) NOT NULL,
  `status` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_r4_setting`
--

DROP TABLE IF EXISTS `ms_r4_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_r4_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `user_approve` int(11) NOT NULL,
  `sender_approve` int(11) NOT NULL,
  `template_approve` int(11) NOT NULL,
  `keyword_check` int(11) NOT NULL,
  `nos_limit` int(11) NOT NULL,
  `optout` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_pid_UNIQUE` (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=794 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_r4rejected_templates`
--

DROP TABLE IF EXISTS `ms_r4rejected_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_r4rejected_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template` varchar(995) NOT NULL,
  `rejected_by` int(11) NOT NULL,
  `user` int(11) NOT NULL DEFAULT '0',
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template` (`template`,`user`),
  FULLTEXT KEY `template_2` (`template`)
) ENGINE=MyISAM AUTO_INCREMENT=19124 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_rates`
--

DROP TABLE IF EXISTS `ms_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_rates` (
  `rates_pid` int(11) NOT NULL AUTO_INCREMENT,
  `rates_sms` bigint(20) DEFAULT NULL,
  `rates_route` int(11) DEFAULT NULL,
  `rates_rate` double DEFAULT NULL,
  PRIMARY KEY (`rates_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_recorded_voice`
--

DROP TABLE IF EXISTS `ms_recorded_voice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_recorded_voice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `draft_name` varchar(100) NOT NULL,
  `actual_name` varchar(100) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_removesmpp_detail`
--

DROP TABLE IF EXISTS `ms_removesmpp_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_removesmpp_detail` (
  `S_no` int(11) NOT NULL AUTO_INCREMENT,
  `smpp_name` varchar(20) NOT NULL,
  `route_pid` int(11) NOT NULL,
  `user_userid` int(11) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`S_no`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_report`
--

DROP TABLE IF EXISTS `ms_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_report` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `report_uid` int(11) NOT NULL,
  `date` date NOT NULL,
  `total` bigint(20) NOT NULL,
  `rejected` bigint(20) NOT NULL,
  `delivered` bigint(20) NOT NULL,
  `failed` bigint(20) NOT NULL,
  `dnd_credit` float NOT NULL,
  `request_route` int(11) NOT NULL,
  `ndnc` bigint(20) NOT NULL,
  `block` bigint(20) NOT NULL,
  `other` int(11) NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `no_of_request` int(11) NOT NULL,
  `balance_deducted` int(11) NOT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_report_older`
--

DROP TABLE IF EXISTS `ms_report_older`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_report_older` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `report_uid` int(11) NOT NULL,
  `date` date NOT NULL,
  `total` bigint(20) NOT NULL,
  `rejected` bigint(20) NOT NULL,
  `delivered` bigint(20) NOT NULL,
  `failed` bigint(20) NOT NULL,
  `dnd_credit` float NOT NULL,
  `request_route` varchar(5) NOT NULL,
  `ndnc` bigint(20) NOT NULL,
  `block` bigint(20) NOT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB AUTO_INCREMENT=48603 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_req`
--

DROP TABLE IF EXISTS `ms_req`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_req` (
  `req_pid` varchar(45) COLLATE utf8_bin NOT NULL,
  `req_requestid` bigint(20) NOT NULL,
  `req_nosms` bigint(20) NOT NULL,
  PRIMARY KEY (`req_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_request`
--

DROP TABLE IF EXISTS `ms_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_request` (
  `request_pid` bigint(20) NOT NULL AUTO_INCREMENT,
  `request_userid` int(11) NOT NULL,
  `request_date` datetime NOT NULL,
  `request_nosms` bigint(20) NOT NULL,
  `request_msg` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `request_type` int(11) NOT NULL,
  `request_route` int(11) NOT NULL,
  `request_totaltime` float NOT NULL,
  `request_dndrefund` float NOT NULL,
  `request_sender` varchar(20) COLLATE utf8_bin DEFAULT NULL,
  `request_criticalrefund` float NOT NULL,
  `is_spam` tinyint(1) NOT NULL,
  `credits` tinyint(4) NOT NULL,
  `is_advanced` tinyint(4) NOT NULL,
  `is_route4` tinyint(1) NOT NULL,
  `spam_reason` text COLLATE utf8_bin NOT NULL,
  `bal_deduct` double DEFAULT NULL,
  `pb_group` varchar(55) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`request_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_request_analysis`
--

DROP TABLE IF EXISTS `ms_request_analysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_request_analysis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` varchar(30) NOT NULL,
  `status` int(11) NOT NULL,
  `response_time` int(11) NOT NULL,
  `no_of_request` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19219 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_reseller_shifted`
--

DROP TABLE IF EXISTS `ms_reseller_shifted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_reseller_shifted` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `from_reseller` varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `to_reseller` varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `admin_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route`
--

DROP TABLE IF EXISTS `ms_route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route` (
  `route_pid` int(11) NOT NULL AUTO_INCREMENT,
  `route_name` text CHARACTER SET utf8 COLLATE utf8_czech_ci NOT NULL,
  `route_delivery` int(11) NOT NULL,
  `route_type` char(10) COLLATE utf8_bin NOT NULL,
  `dp_type` int(1) NOT NULL DEFAULT '0',
  `dp_currency` varchar(10) COLLATE utf8_bin NOT NULL DEFAULT 'INR',
  `dp_category` int(1) NOT NULL DEFAULT '1',
  `dp_multiplier` float DEFAULT '1',
  `dlr_url` varchar(600) COLLATE utf8_bin NOT NULL,
  `api_username` char(30) COLLATE utf8_bin NOT NULL,
  `api_password` char(40) COLLATE utf8_bin NOT NULL,
  `smsc_name` varchar(25) COLLATE utf8_bin NOT NULL,
  `diverted_route` int(11) NOT NULL,
  `route_admin` varchar(20) COLLATE utf8_bin DEFAULT NULL,
  `route_level` int(11) NOT NULL,
  `provider` varchar(25) COLLATE utf8_bin DEFAULT NULL,
  `ndnc_block` tinyint(4) NOT NULL,
  `route_balance` double(20,2) DEFAULT NULL,
  `cost` float DEFAULT NULL,
  `category` varchar(255) COLLATE utf8_bin NOT NULL,
  `route_type_test` varchar(255) COLLATE utf8_bin NOT NULL,
  `panel_admin` varchar(100) COLLATE utf8_bin NOT NULL,
  `validity` int(11) DEFAULT NULL,
  `col_order` int(11) DEFAULT NULL,
  `access_level` int(11) DEFAULT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `timezone` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`route_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=959 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route4_block_user`
--

DROP TABLE IF EXISTS `ms_route4_block_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route4_block_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route4_templates`
--

DROP TABLE IF EXISTS `ms_route4_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route4_templates` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `template` varchar(995) NOT NULL,
  `approved_by` int(10) NOT NULL,
  `user` int(10) NOT NULL DEFAULT '0',
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template` (`template`,`user`),
  KEY `userid` (`user`),
  FULLTEXT KEY `full_text_template` (`template`)
) ENGINE=MyISAM AUTO_INCREMENT=526419 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route4_user`
--

DROP TABLE IF EXISTS `ms_route4_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route4_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `template_match_limit` float NOT NULL,
  `nos_limit` int(11) NOT NULL,
  `check_for_limit` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11435 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_routeHealth`
--

DROP TABLE IF EXISTS `ms_routeHealth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_routeHealth` (
  `healthId` int(11) NOT NULL AUTO_INCREMENT,
  `routeId` int(11) NOT NULL,
  `pending` double DEFAULT NULL,
  `delivered` double NOT NULL,
  `failed` double NOT NULL,
  `total` double NOT NULL,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`healthId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route_attributes`
--

DROP TABLE IF EXISTS `ms_route_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route_attributes` (
  `route_pid` int(11) NOT NULL,
  `future_diverted_route` int(11) DEFAULT NULL,
  `operator` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`route_pid`),
  CONSTRAINT `ms_route_attributes_ibfk_1` FOREIGN KEY (`route_pid`) REFERENCES `ms_route` (`route_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route_sender`
--

DROP TABLE IF EXISTS `ms_route_sender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route_sender` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` int(11) NOT NULL,
  `sender` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route_setting`
--

DROP TABLE IF EXISTS `ms_route_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route_setting` (
  `route_pid` int(11) NOT NULL AUTO_INCREMENT,
  `senderid` tinyint(1) NOT NULL,
  `autoCheck` int(11) NOT NULL,
  `ratio` int(11) NOT NULL,
  `backupRoute` int(11) NOT NULL,
  `smsc` varchar(255) NOT NULL,
  `route_comment` longtext NOT NULL,
  `balance_url` longtext NOT NULL,
  `email_id` longtext NOT NULL,
  `contact_number` longtext NOT NULL,
  `other` longtext NOT NULL,
  `user_name` text NOT NULL,
  `alertId` text NOT NULL,
  PRIMARY KEY (`route_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=98603 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_route_transaction`
--

DROP TABLE IF EXISTS `ms_route_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_route_transaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` int(11) NOT NULL,
  `amount` double NOT NULL,
  `type` tinyint(4) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_schedule`
--

DROP TABLE IF EXISTS `ms_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_schedule` (
  `schedule_pid` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_requestid` varchar(30) COLLATE utf8_bin NOT NULL,
  `schedule_msg` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `schedule_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `request_date` timestamp NULL DEFAULT NULL,
  `schedule_date` date NOT NULL,
  `schedule_time` time NOT NULL,
  `schedule_lang` int(11) NOT NULL,
  `schedule_status` varchar(45) COLLATE utf8_bin NOT NULL,
  `schedule_msgid` text COLLATE utf8_bin NOT NULL,
  `schedule_deltime` datetime NOT NULL,
  `schedule_description` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `schedule_sequenceid` int(11) DEFAULT NULL,
  `schedule_balance` varchar(45) COLLATE utf8_bin NOT NULL,
  `spam_reason` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`schedule_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=1666 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_send`
--

DROP TABLE IF EXISTS `ms_send`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_send` (
  `send_pid` int(11) NOT NULL AUTO_INCREMENT,
  `send_reqid` varchar(30) COLLATE utf8_bin NOT NULL,
  `send_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `send_msgid` varchar(45) COLLATE utf8_bin NOT NULL,
  `send_status` varchar(45) COLLATE utf8_bin NOT NULL,
  `send_deltime` datetime NOT NULL,
  `send_sequenceid` int(11) DEFAULT NULL,
  `send_description` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `msg` varchar(1024) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`send_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_send_feature`
--

DROP TABLE IF EXISTS `ms_send_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_send_feature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `normal_sms` int(11) DEFAULT NULL,
  `voice_sms` int(11) DEFAULT NULL,
  `long_code` int(11) DEFAULT NULL,
  `voice_verf` tinyint(4) DEFAULT NULL,
  `ipSet` int(11) DEFAULT NULL,
  `live_chat` tinyint(1) DEFAULT NULL,
  `delivery_report` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userid` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=45175 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_sender`
--

DROP TABLE IF EXISTS `ms_sender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_sender` (
  `sender_pid` bigint(20) NOT NULL AUTO_INCREMENT,
  `sender_userid` bigint(20) NOT NULL,
  `sender_senderid` varchar(45) NOT NULL,
  PRIMARY KEY (`sender_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=12096 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_senderid_limit`
--

DROP TABLE IF EXISTS `ms_senderid_limit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_senderid_limit` (
  `user_pid` int(11) NOT NULL,
  `limit1` int(11) NOT NULL,
  `type1` tinyint(4) NOT NULL,
  `limit4` int(11) NOT NULL,
  `type4` tinyint(4) NOT NULL,
  `limit5` int(11) NOT NULL,
  `type5` tinyint(4) NOT NULL,
  `limit6` int(11) NOT NULL,
  `type6` tinyint(4) NOT NULL,
  `minLimit1` int(11) NOT NULL,
  `minLimit4` int(11) NOT NULL,
  `limit7` int(11) NOT NULL,
  `minLimit7` int(11) NOT NULL,
  `type7` tinyint(4) NOT NULL,
  `limit8` int(11) NOT NULL,
  `minLimit8` int(11) NOT NULL,
  `type8` tinyint(4) NOT NULL,
  `limit9` int(11) NOT NULL,
  `minLimit9` int(11) NOT NULL,
  `type9` tinyint(4) NOT NULL,
  `limit10` int(11) NOT NULL,
  `minLimit10` int(11) NOT NULL,
  `type10` tinyint(4) NOT NULL,
  `limit11` int(11) NOT NULL,
  `minLimit11` int(11) NOT NULL,
  `type11` tinyint(4) NOT NULL,
  `limit12` int(11) NOT NULL,
  `minLimit12` int(11) NOT NULL,
  `type12` tinyint(4) NOT NULL,
  `limit13` int(11) NOT NULL,
  `minLimit13` int(11) NOT NULL,
  `type13` tinyint(4) NOT NULL,
  `limit14` int(11) NOT NULL,
  `minLimit14` int(11) NOT NULL,
  `type14` tinyint(4) NOT NULL,
  `limit15` int(11) NOT NULL,
  `minLimit15` int(11) NOT NULL,
  `type15` tinyint(4) NOT NULL,
  `limit16` int(11) NOT NULL,
  `minLimit16` int(11) NOT NULL,
  `type16` tinyint(4) NOT NULL,
  `limit17` int(11) NOT NULL,
  `minLimit17` int(11) NOT NULL,
  `type17` tinyint(4) NOT NULL,
  `limit18` int(11) NOT NULL,
  `minLimit18` int(11) NOT NULL,
  `type18` tinyint(4) NOT NULL,
  `limit19` int(11) NOT NULL,
  `minLimit19` int(11) NOT NULL,
  `type19` tinyint(4) NOT NULL,
  `limit20` int(11) NOT NULL,
  `minLimit20` int(11) NOT NULL,
  `type20` tinyint(4) NOT NULL,
  `limit21` int(11) NOT NULL,
  `minLimit21` int(11) NOT NULL,
  `type21` tinyint(4) NOT NULL,
  `limit22` int(11) NOT NULL,
  `minLimit22` int(11) NOT NULL,
  `type22` tinyint(4) NOT NULL,
  `limit23` int(11) NOT NULL,
  `minLimit23` int(11) NOT NULL,
  `type23` tinyint(4) NOT NULL,
  `limit24` int(11) NOT NULL,
  `minLimit24` int(11) NOT NULL,
  `type24` tinyint(4) NOT NULL,
  `limit25` int(11) NOT NULL,
  `minLimit25` int(11) NOT NULL,
  `type25` tinyint(4) NOT NULL,
  `limit26` int(11) NOT NULL,
  `minLimit26` int(11) NOT NULL,
  `type26` tinyint(4) NOT NULL,
  `limit27` int(11) NOT NULL,
  `minLimit27` int(11) NOT NULL,
  `type27` tinyint(4) NOT NULL,
  `limit28` int(11) NOT NULL,
  `minLimit28` int(11) NOT NULL,
  `type28` tinyint(4) NOT NULL,
  `limit0` int(11) NOT NULL DEFAULT '14',
  `minLimit0` int(11) NOT NULL DEFAULT '0',
  `type0` tinyint(4) NOT NULL DEFAULT '0',
  `limit113` int(11) NOT NULL DEFAULT '14',
  `minLimit113` int(11) NOT NULL DEFAULT '0',
  `type113` tinyint(4) NOT NULL DEFAULT '0',
  `limit114` int(11) NOT NULL DEFAULT '14',
  `minLimit114` int(11) NOT NULL DEFAULT '0',
  `type114` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_signup_domain_block`
--

DROP TABLE IF EXISTS `ms_signup_domain_block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_signup_domain_block` (
  `domain` varchar(50) NOT NULL,
  `count` int(11) NOT NULL,
  `emails` varchar(200) NOT NULL,
  `res_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`domain`,`res_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_signup_history`
--

DROP TABLE IF EXISTS `ms_signup_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_signup_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `ip` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6482 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_signup_ip_block`
--

DROP TABLE IF EXISTS `ms_signup_ip_block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_signup_ip_block` (
  `ip` varchar(50) NOT NULL,
  `count` int(11) NOT NULL,
  `res_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ip`,`res_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_signup_log`
--

DROP TABLE IF EXISTS `ms_signup_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_signup_log` (
  `email` varchar(50) NOT NULL,
  `count` int(11) NOT NULL,
  `numbers` varchar(100) DEFAULT NULL,
  `res_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`,`res_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_signup_purpose`
--

DROP TABLE IF EXISTS `ms_signup_purpose`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_signup_purpose` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `purpose` varchar(1024) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=769 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_signup_sms`
--

DROP TABLE IF EXISTS `ms_signup_sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_signup_sms` (
  `user_pid` int(11) NOT NULL,
  `sms` varchar(306) NOT NULL,
  `senderId` varchar(32) DEFAULT NULL,
  `DLT_TE_ID` varchar(50) DEFAULT NULL,
  `signup_mail` varchar(300) NOT NULL,
  `signup_mail_subject` varchar(250) NOT NULL,
  `signup_expiry` int(11) NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_smpp_statistics`
--

DROP TABLE IF EXISTS `ms_smpp_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_smpp_statistics` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `route_id` int(11) NOT NULL,
  `total_submited` int(11) NOT NULL,
  `total_processed` int(11) NOT NULL,
  `total_fake` int(11) NOT NULL,
  `statistics_date` timestamp NULL DEFAULT NULL,
  `credit` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_smsc_count`
--

DROP TABLE IF EXISTS `ms_smsc_count`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_smsc_count` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `smsc` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `delivered` bigint(20) DEFAULT NULL,
  `delivered_credit` bigint(20) DEFAULT NULL,
  `failed` bigint(20) DEFAULT NULL,
  `failed_credit` bigint(20) DEFAULT NULL,
  `rejected` bigint(20) DEFAULT NULL,
  `rejected_credit` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_soft_block_sender_id`
--

DROP TABLE IF EXISTS `ms_soft_block_sender_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_soft_block_sender_id` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` varchar(25) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_spam_allow_user`
--

DROP TABLE IF EXISTS `ms_spam_allow_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_spam_allow_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `spam_allow` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_spam_keywords`
--

DROP TABLE IF EXISTS `ms_spam_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_spam_keywords` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `keyword` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1 COMMENT='Always block route 4 messages containing the keywords';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_sso_domain`
--

DROP TABLE IF EXISTS `ms_sso_domain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_sso_domain` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(200) NOT NULL,
  `company_id` bigint(20) NOT NULL,
  `private_key` mediumtext CHARACTER SET latin1,
  `public_key` mediumtext CHARACTER SET latin1,
  `status` tinyint(4) DEFAULT '1',
  `redirect_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=250 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_stripe_customer`
--

DROP TABLE IF EXISTS `ms_stripe_customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_stripe_customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `thershold_bal` decimal(14,2) DEFAULT NULL,
  `add_bal` decimal(14,2) DEFAULT NULL,
  `is_automatic` tinyint(4) NOT NULL,
  `first_manual_pay` tinyint(4) NOT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_UNIQUE` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_stripe_invoice`
--

DROP TABLE IF EXISTS `ms_stripe_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_stripe_invoice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `invoice_id` varchar(255) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `payment_status` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=525 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_style`
--

DROP TABLE IF EXISTS `ms_style`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_style` (
  `style_pid` int(11) NOT NULL AUTO_INCREMENT,
  `style_name` varchar(45) NOT NULL,
  `style_path` varchar(255) NOT NULL,
  PRIMARY KEY (`style_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_template_deletion_log`
--

DROP TABLE IF EXISTS `ms_template_deletion_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_template_deletion_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `updated_user_id` int(11) NOT NULL,
  `template_id` varchar(245) NOT NULL,
  `comment` varchar(245) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `template_data` blob NOT NULL,
  `voice_template_data` blob,
  `push_payload_data` blob,
  `whatsapp_template_data` blob,
  `email_template_data` blob,
  `ai_r4_template_data` blob,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=396 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_test_user`
--

DROP TABLE IF EXISTS `ms_test_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_test_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `is_test` tinyint(1) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_text_bal`
--

DROP TABLE IF EXISTS `ms_text_bal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_text_bal` (
  `userId` int(11) NOT NULL,
  `route` int(11) NOT NULL,
  `balance` double(20,5) NOT NULL,
  PRIMARY KEY (`userId`,`route`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_text_bal_deleted`
--

DROP TABLE IF EXISTS `ms_text_bal_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_text_bal_deleted` (
  `userId` varchar(50) NOT NULL,
  `route` int(11) NOT NULL,
  `balance` double(20,2) NOT NULL,
  PRIMARY KEY (`userId`,`route`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_text_resend_log`
--

DROP TABLE IF EXISTS `ms_text_resend_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_text_resend_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resend_status` int(11) NOT NULL,
  `resend_start_time` datetime NOT NULL,
  `resend_end_time` datetime NOT NULL,
  `resend_dummy_route` int(11) NOT NULL,
  `resend_previous_route` int(11) NOT NULL,
  `resend_no_sms_sent` bigint(20) NOT NULL,
  `resend_route` int(11) NOT NULL,
  `resend_admin` int(11) NOT NULL,
  `resend_time` datetime NOT NULL,
  `resend_user` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_text_user_ratio`
--

DROP TABLE IF EXISTS `ms_text_user_ratio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_text_user_ratio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `dummy_route` int(11) NOT NULL,
  `actual_ratio` int(11) NOT NULL,
  `fake_ratio` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_and_dummy_route` (`user_id`,`dummy_route`)
) ENGINE=InnoDB AUTO_INCREMENT=422899 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_text_user_route`
--

DROP TABLE IF EXISTS `ms_text_user_route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_text_user_route` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `actual_route` int(11) NOT NULL,
  `dummy_route` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dupidx` (`user_id`,`dummy_route`)
) ENGINE=InnoDB AUTO_INCREMENT=855164 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_trans`
--

DROP TABLE IF EXISTS `ms_trans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_trans` (
  `trans_pid` int(11) NOT NULL AUTO_INCREMENT,
  `trans_fuserid` int(11) NOT NULL,
  `trans_tuserid` int(11) NOT NULL,
  `trans_amt` decimal(14,2) NOT NULL,
  `trans_sms` decimal(14,2) NOT NULL,
  `trans_date` timestamp NULL DEFAULT NULL,
  `trans_type` int(11) NOT NULL,
  `trans_desc` varchar(150) COLLATE utf8_bin NOT NULL,
  `fund_transfer_type` tinyint(1) NOT NULL,
  `record` int(11) NOT NULL,
  `route` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `cost` double NOT NULL,
  `account_manager` int(11) NOT NULL,
  `tax` decimal(11,2) NOT NULL,
  `tds` decimal(11,2) DEFAULT NULL,
  `payment_mode` tinyint(1) NOT NULL,
  `currency` varchar(3) COLLATE utf8_bin DEFAULT 'INR',
  PRIMARY KEY (`trans_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=1084088 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_trans_email_template`
--

DROP TABLE IF EXISTS `ms_trans_email_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_trans_email_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` text,
  `user_id` int(11) NOT NULL,
  `template_id` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `template_name` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `template` longtext,
  `approved_date` date DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `is_spam` tinyint(1) NOT NULL,
  `spam_response` text CHARACTER SET latin1,
  `status` tinyint(4) DEFAULT NULL,
  `is_deleted` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6378 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_unblock`
--

DROP TABLE IF EXISTS `ms_unblock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_unblock` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `number` varchar(15) NOT NULL,
  `senderId` varchar(255) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user`
--

DROP TABLE IF EXISTS `ms_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `user_fname` tinytext COLLATE utf8_bin,
  `user_lname` tinytext COLLATE utf8_bin,
  `user_uname` varchar(50) CHARACTER SET utf8 DEFAULT '',
  `user_pass` char(32) COLLATE utf8_bin DEFAULT '',
  `user_mobno` varchar(20) COLLATE utf8_bin DEFAULT '',
  `user_bal` double DEFAULT NULL,
  `user_expiry` date DEFAULT NULL,
  `user_email` varchar(60) COLLATE utf8_bin DEFAULT '',
  `user_date` datetime DEFAULT NULL,
  `user_phone` varchar(20) COLLATE utf8_bin DEFAULT '',
  `user_slimit` int(11) DEFAULT NULL,
  `user_type` int(11) DEFAULT NULL,
  `user_status` int(11) DEFAULT NULL,
  `user_userid` int(11) DEFAULT NULL,
  `user_route` int(11) DEFAULT NULL,
  `user_delivery` enum('0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100') COLLATE utf8_bin NOT NULL,
  `user_dnd` double DEFAULT NULL,
  `user_fakedel` double DEFAULT NULL,
  `user_areacode` int(11) DEFAULT NULL,
  `user_paypal` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `user_paypal_currency` char(10) COLLATE utf8_bin DEFAULT '',
  `user_country_code` int(11) DEFAULT NULL,
  `user_voice_bal` double DEFAULT NULL,
  `user_voice_route` int(11) DEFAULT NULL,
  `user_sender_option` tinyint(4) DEFAULT NULL,
  `user_lc_inbox_bal` bigint(20) DEFAULT NULL,
  `user_lc_keyword_bal` bigint(20) DEFAULT NULL,
  `user_default_bal` int(11) DEFAULT NULL,
  `is_space_user` enum('1','0') COLLATE utf8_bin NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=302655 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_authentication`
--

DROP TABLE IF EXISTS `ms_user_authentication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_authentication` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `authkey` varchar(55) NOT NULL,
  `panelid` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `priority` int(11) NOT NULL DEFAULT '0',
  `keyName` varchar(50) NOT NULL DEFAULT 'Default',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  `ruleId` int(11) DEFAULT '1',
  `ipSetting` int(11) DEFAULT '0',
  `reseller_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userid` (`userid`),
  KEY `authkey` (`authkey`)
) ENGINE=InnoDB AUTO_INCREMENT=256021 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_authentication_test`
--

DROP TABLE IF EXISTS `ms_user_authentication_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_authentication_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `authkey` varchar(55) NOT NULL,
  `panelid` int(11) NOT NULL,
  `status` int(5) NOT NULL DEFAULT '1' COMMENT '1-ON, 2-OFF, 3-deleted',
  `priority` int(5) NOT NULL DEFAULT '0',
  `keyName` varchar(50) NOT NULL DEFAULT 'Default',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authkey` (`authkey`)
) ENGINE=InnoDB AUTO_INCREMENT=3053 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_authkey_log`
--

DROP TABLE IF EXISTS `ms_user_authkey_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_authkey_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `authkey` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `panel_id` int(11) NOT NULL,
  `status` tinyint(4) NOT NULL,
  `last_modified` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100245 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_balance`
--

DROP TABLE IF EXISTS `ms_user_balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_balance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `route1` double NOT NULL,
  `route4` double NOT NULL,
  `route4_extra_bal` double NOT NULL,
  `route5` double NOT NULL,
  `route6` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50344 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_balance_deleted`
--

DROP TABLE IF EXISTS `ms_user_balance_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_balance_deleted` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `route1` double NOT NULL,
  `route4` double NOT NULL,
  `route4_extra_bal` double NOT NULL,
  `route5` double NOT NULL,
  `route6` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_base`
--

DROP TABLE IF EXISTS `ms_user_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_base` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `user_fname` varchar(50) COLLATE utf8_bin NOT NULL,
  `user_lname` varchar(55) COLLATE utf8_bin NOT NULL,
  `user_uname` varchar(50) COLLATE utf8_bin NOT NULL,
  `user_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_email` varchar(60) COLLATE utf8_bin NOT NULL,
  `user_date` datetime NOT NULL,
  `admin_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `lead_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `notified` int(11) DEFAULT NULL,
  `other_user` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=142345673 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_blockno`
--

DROP TABLE IF EXISTS `ms_user_blockno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_blockno` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `number` longtext NOT NULL,
  `sender` text NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3953 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_consent`
--

DROP TABLE IF EXISTS `ms_user_consent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_consent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `consent_url` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_company_id` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_contacts`
--

DROP TABLE IF EXISTS `ms_user_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_contacts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `contacts` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_deleted`
--

DROP TABLE IF EXISTS `ms_user_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_deleted` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `user_fname` varchar(50) COLLATE utf8_bin NOT NULL,
  `user_lname` varchar(55) COLLATE utf8_bin NOT NULL,
  `user_uname` varchar(50) COLLATE utf8_bin NOT NULL,
  `user_pass` char(32) COLLATE utf8_bin NOT NULL,
  `user_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_bal` double NOT NULL,
  `user_expiry` date DEFAULT NULL,
  `user_email` varchar(60) COLLATE utf8_bin NOT NULL,
  `user_date` datetime NOT NULL,
  `user_phone` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_slimit` int(11) NOT NULL,
  `user_type` int(11) NOT NULL,
  `user_status` int(11) NOT NULL,
  `user_userid` int(11) NOT NULL,
  `user_route` int(11) NOT NULL,
  `user_delivery` enum('0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100') COLLATE utf8_bin NOT NULL,
  `user_dnd` double NOT NULL,
  `user_fakedel` double NOT NULL,
  `user_areacode` int(11) NOT NULL,
  `user_paypal` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `user_paypal_currency` char(10) COLLATE utf8_bin NOT NULL,
  `user_country_code` int(11) NOT NULL,
  `user_voice_bal` double DEFAULT NULL,
  `user_voice_route` int(11) DEFAULT NULL,
  `user_sender_option` tinyint(4) NOT NULL,
  `user_lc_inbox_bal` bigint(20) NOT NULL,
  `user_lc_keyword_bal` bigint(20) NOT NULL,
  `user_default_bal` int(11) NOT NULL,
  `is_space_user` enum('0','1') COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=278365003 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_email_verification`
--

DROP TABLE IF EXISTS `ms_user_email_verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_email_verification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `user_name` varchar(32) NOT NULL,
  `verify_code` varchar(24) NOT NULL,
  `verify` int(11) NOT NULL,
  `date` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_enq`
--

DROP TABLE IF EXISTS `ms_user_enq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_enq` (
  `name` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL,
  `contact_no` varchar(15) NOT NULL,
  `description` text NOT NULL,
  `datetime` datetime NOT NULL,
  `enq_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`enq_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_extra_discount_vol`
--

DROP TABLE IF EXISTS `ms_user_extra_discount_vol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_extra_discount_vol` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `route` int(12) NOT NULL,
  `extra_discount` double(4,2) NOT NULL,
  `mnthly_expctd_vol` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDX_USR_RT` (`userId`,`route`)
) ENGINE=InnoDB AUTO_INCREMENT=185 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_feature_setting`
--

DROP TABLE IF EXISTS `ms_user_feature_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_feature_setting` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `feature` varchar(30) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `user_feature` (`userid`,`feature`)
) ENGINE=InnoDB AUTO_INCREMENT=185937 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_group`
--

DROP TABLE IF EXISTS `ms_user_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_group` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `company_id` int(11) DEFAULT '0',
  `allowed_ip` varchar(512) DEFAULT NULL,
  `permissions` varchar(512) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY ` unique_company_group` (`company_id`,`name`),
  KEY `company_id` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=188 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_group_mapping`
--

DROP TABLE IF EXISTS `ms_user_group_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_group_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT '0',
  `user_id` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_user_group` (`group_id`,`company_id`,`user_id`),
  KEY `group_id` (`group_id`),
  KEY `company_id` (`company_id`),
  KEY `user_id` (`user_id`),
  KEY `company_group` (`group_id`,`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_identity_info`
--

DROP TABLE IF EXISTS `ms_user_identity_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_identity_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `verification_session` varchar(45) DEFAULT NULL,
  `verification_report` varchar(45) DEFAULT NULL,
  `status` varchar(45) NOT NULL DEFAULT '',
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_id` int(11) DEFAULT NULL,
  `documents_verified` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id_UNIQUE` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=171 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_identity_verification`
--

DROP TABLE IF EXISTS `ms_user_identity_verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_identity_verification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `verify_mode` int(11) DEFAULT '2',
  `status` int(11) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `approval_action_by` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=990 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_int_route`
--

DROP TABLE IF EXISTS `ms_user_int_route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_int_route` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `route` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1152 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_integrations`
--

DROP TABLE IF EXISTS `ms_user_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_integrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `service_name` varchar(250) DEFAULT NULL,
  `credentials` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_kyc_info`
--

DROP TABLE IF EXISTS `ms_user_kyc_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_kyc_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `kyc_id` varchar(45) DEFAULT NULL,
  `kyc_status` varchar(45) NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_id` int(11) DEFAULT NULL,
  `documents_verified` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id_UNIQUE` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=202 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_login`
--

DROP TABLE IF EXISTS `ms_user_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_login` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `user_fname` tinytext COLLATE utf8_bin,
  `user_lname` tinytext COLLATE utf8_bin,
  `user_uname` varchar(50) CHARACTER SET utf8 DEFAULT '',
  `user_pass` char(32) COLLATE utf8_bin DEFAULT '',
  `user_mobno` varchar(20) COLLATE utf8_bin DEFAULT '',
  `user_bal` double DEFAULT NULL,
  `export_permission` tinyint(4) DEFAULT NULL,
  `user_expiry` date DEFAULT NULL,
  `user_email` varchar(60) COLLATE utf8_bin DEFAULT '',
  `user_date` datetime DEFAULT NULL,
  `user_phone` varchar(20) COLLATE utf8_bin DEFAULT '',
  `user_slimit` int(11) DEFAULT NULL,
  `user_type` int(11) DEFAULT NULL,
  `user_status` int(11) DEFAULT NULL,
  `user_userid` int(11) DEFAULT NULL,
  `user_route` int(11) DEFAULT NULL,
  `user_delivery` enum('0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100') COLLATE utf8_bin NOT NULL,
  `user_dnd` double DEFAULT NULL,
  `user_fakedel` double DEFAULT NULL,
  `user_areacode` int(11) DEFAULT NULL,
  `user_paypal` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `user_paypal_currency` char(10) COLLATE utf8_bin DEFAULT '',
  `user_country_code` int(11) DEFAULT NULL,
  `user_voice_bal` double DEFAULT NULL,
  `user_voice_route` int(11) DEFAULT NULL,
  `user_sender_option` tinyint(4) DEFAULT NULL,
  `user_lc_inbox_bal` bigint(20) DEFAULT NULL,
  `user_lc_keyword_bal` bigint(20) DEFAULT NULL,
  `user_default_bal` int(11) DEFAULT NULL,
  `is_space_user` enum('1','0') COLLATE utf8_bin NOT NULL DEFAULT '0',
  `email_verified` tinyint(1) DEFAULT '1',
  `is_developer` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_pid`),
  KEY `user_status` (`user_status`),
  KEY `idx_user_login_pid_status` (`user_pid`,`user_status`)
) ENGINE=InnoDB AUTO_INCREMENT=300929 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_login_copy`
--

DROP TABLE IF EXISTS `ms_user_login_copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_login_copy` (
  `user_pid` int(11) NOT NULL,
  `user_fname` tinytext COLLATE utf8_bin NOT NULL,
  `user_lname` tinytext COLLATE utf8_bin,
  `user_uname` varchar(50) CHARACTER SET utf8 NOT NULL,
  `user_pass` char(32) COLLATE utf8_bin NOT NULL,
  `user_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_bal` double NOT NULL,
  `user_expiry` date DEFAULT NULL,
  `user_email` varchar(60) COLLATE utf8_bin NOT NULL,
  `user_date` datetime NOT NULL,
  `user_phone` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_slimit` int(11) NOT NULL,
  `user_type` int(11) NOT NULL,
  `user_status` int(11) NOT NULL,
  `user_userid` int(11) NOT NULL,
  `user_route` int(11) NOT NULL,
  `user_delivery` enum('0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100') COLLATE utf8_bin NOT NULL,
  `user_dnd` double NOT NULL,
  `user_fakedel` double NOT NULL,
  `user_areacode` int(11) NOT NULL,
  `user_paypal` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `user_paypal_currency` char(10) COLLATE utf8_bin NOT NULL,
  `user_country_code` int(11) NOT NULL,
  `user_voice_bal` double DEFAULT NULL,
  `user_voice_route` int(11) DEFAULT NULL,
  `user_sender_option` tinyint(4) NOT NULL,
  `user_lc_inbox_bal` bigint(20) NOT NULL,
  `user_lc_keyword_bal` bigint(20) NOT NULL,
  `user_default_bal` int(11) NOT NULL,
  `is_space_user` enum('0','1') COLLATE utf8_bin NOT NULL,
  `email_verified` int(11) DEFAULT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_login_deleted`
--

DROP TABLE IF EXISTS `ms_user_login_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_login_deleted` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `user_fname` tinytext COLLATE utf8_bin,
  `user_lname` tinytext COLLATE utf8_bin,
  `user_uname` varchar(50) CHARACTER SET utf8 DEFAULT '',
  `user_pass` char(32) COLLATE utf8_bin DEFAULT '',
  `user_mobno` varchar(20) COLLATE utf8_bin DEFAULT '',
  `user_bal` double DEFAULT NULL,
  `export_permission` tinyint(4) DEFAULT NULL,
  `user_expiry` date DEFAULT NULL,
  `user_email` varchar(60) COLLATE utf8_bin DEFAULT '',
  `user_date` datetime DEFAULT NULL,
  `user_phone` varchar(20) COLLATE utf8_bin DEFAULT '',
  `user_slimit` int(11) DEFAULT NULL,
  `user_type` int(11) DEFAULT NULL,
  `user_status` int(11) DEFAULT NULL,
  `user_userid` int(11) DEFAULT NULL,
  `user_route` int(11) DEFAULT NULL,
  `user_delivery` enum('0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100') COLLATE utf8_bin NOT NULL,
  `user_dnd` double DEFAULT NULL,
  `user_fakedel` double DEFAULT NULL,
  `user_areacode` int(11) DEFAULT NULL,
  `user_paypal` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `user_paypal_currency` char(10) COLLATE utf8_bin DEFAULT '',
  `user_country_code` int(11) DEFAULT NULL,
  `user_voice_bal` double DEFAULT NULL,
  `user_voice_route` int(11) DEFAULT NULL,
  `user_sender_option` tinyint(4) DEFAULT NULL,
  `user_lc_inbox_bal` bigint(20) DEFAULT NULL,
  `user_lc_keyword_bal` bigint(20) DEFAULT NULL,
  `user_default_bal` int(11) DEFAULT NULL,
  `is_space_user` enum('1','0') COLLATE utf8_bin NOT NULL DEFAULT '0',
  `email_verified` tinyint(1) DEFAULT '1',
  `is_developer` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=300473 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_login_features`
--

DROP TABLE IF EXISTS `ms_user_login_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_login_features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `feature_name` varchar(100) NOT NULL,
  `value` varchar(20) DEFAULT NULL,
  `modified_by` varchar(255) DEFAULT NULL,
  `comments` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_main`
--

DROP TABLE IF EXISTS `ms_user_main`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_main` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` text COLLATE utf8_bin NOT NULL,
  `user_uname` varchar(50) COLLATE utf8_bin NOT NULL,
  `user_pass` char(32) COLLATE utf8_bin NOT NULL,
  `user_mobno` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_email` varchar(60) COLLATE utf8_bin NOT NULL,
  `user_signup_date` datetime NOT NULL,
  `user_countrycode` tinytext COLLATE utf8_bin NOT NULL,
  `user_uid` int(11) NOT NULL,
  `user_status` int(11) NOT NULL,
  `user_type` int(11) NOT NULL,
  `user_senderid` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_expiry` datetime NOT NULL,
  `user_occupation` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=35000 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_ndnc`
--

DROP TABLE IF EXISTS `ms_user_ndnc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_ndnc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_nos`
--

DROP TABLE IF EXISTS `ms_user_nos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_nos` (
  `user` int(11) NOT NULL,
  `mobile` bigint(20) NOT NULL,
  `is_first_time` tinyint(1) NOT NULL,
  `time_send` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user`,`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_nos_2`
--

DROP TABLE IF EXISTS `ms_user_nos_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_nos_2` (
  `user` int(11) NOT NULL,
  `mobile` bigint(20) NOT NULL,
  PRIMARY KEY (`user`,`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_nos_new`
--

DROP TABLE IF EXISTS `ms_user_nos_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_nos_new` (
  `user` int(11) NOT NULL,
  `mobile` bigint(20) NOT NULL,
  `is_first_time` tinyint(1) NOT NULL,
  `sender_id` varchar(20) NOT NULL,
  `time_send` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user`,`mobile`,`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_otherdetails`
--

DROP TABLE IF EXISTS `ms_user_otherdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_otherdetails` (
  `user_pid` int(11) NOT NULL,
  `user_dob` date NOT NULL,
  `user_addr` text CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_city` tinytext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_zipcode` varchar(11) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_areacode` int(11) NOT NULL,
  `user_state` tinytext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_country` tinytext CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_numeric_sender` bigint(20) NOT NULL,
  `user_phone` varchar(20) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_panel_time` varchar(45) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_paypal` varchar(45) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_paypal_currency` char(10) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_otp_averagetime`
--

DROP TABLE IF EXISTS `ms_user_otp_averagetime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_otp_averagetime` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `avgtime` float(4,1) DEFAULT NULL,
  `entrydate` datetime DEFAULT NULL,
  `deliveredmsgcount` int(11) DEFAULT NULL,
  `totalmsgcount` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51983 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_otp_averagetime_hourly`
--

DROP TABLE IF EXISTS `ms_user_otp_averagetime_hourly`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_otp_averagetime_hourly` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `avgtime` float(4,1) DEFAULT NULL,
  `entrydate` datetime DEFAULT NULL,
  `deliveredmsgcount` int(11) DEFAULT NULL,
  `totalmsgcount` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=385315 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_paid_signup`
--

DROP TABLE IF EXISTS `ms_user_paid_signup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_paid_signup` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=8351 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_pricing`
--

DROP TABLE IF EXISTS `ms_user_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_pricing` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `route` varchar(10) NOT NULL,
  `type` varchar(10) NOT NULL,
  `pricing` decimal(5,5) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3196 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_r4_single_request_averagetime`
--

DROP TABLE IF EXISTS `ms_user_r4_single_request_averagetime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_r4_single_request_averagetime` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `avgtime` float(4,1) DEFAULT NULL,
  `entrydate` datetime DEFAULT NULL,
  `deliveredmsgcount` int(11) DEFAULT NULL,
  `totalmsgcount` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3524 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_r4_single_request_averagetime_hourly`
--

DROP TABLE IF EXISTS `ms_user_r4_single_request_averagetime_hourly`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_r4_single_request_averagetime_hourly` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `avgtime` float(4,1) DEFAULT NULL,
  `entrydate` datetime DEFAULT NULL,
  `deliveredmsgcount` int(11) DEFAULT NULL,
  `totalmsgcount` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1653454 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_sender`
--

DROP TABLE IF EXISTS `ms_user_sender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_sender` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `senderId` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_services`
--

DROP TABLE IF EXISTS `ms_user_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_services` (
  `service_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int(10) unsigned NOT NULL,
  `services` tinytext CHARACTER SET utf8mb4,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`service_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_signature`
--

DROP TABLE IF EXISTS `ms_user_signature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_signature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `sign` varchar(255) DEFAULT NULL,
  `userSignPref` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_pid` (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=1982 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_status`
--

DROP TABLE IF EXISTS `ms_user_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `status` tinyint(4) NOT NULL,
  `type` varchar(15) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_updation_logs`
--

DROP TABLE IF EXISTS `ms_user_updation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_updation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `updater_id` int(11) NOT NULL,
  `prev_val` varchar(255) NOT NULL,
  `curr_val` varchar(255) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `action_time` timestamp NULL DEFAULT NULL,
  `comment` varchar(225) DEFAULT NULL,
  `row_identifier` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7543 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_voice_route`
--

DROP TABLE IF EXISTS `ms_user_voice_route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_voice_route` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `route` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_user_voicebalance`
--

DROP TABLE IF EXISTS `ms_user_voicebalance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_user_voicebalance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `route4` double NOT NULL,
  `route1` double NOT NULL,
  `route3` double NOT NULL,
  `route5` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=86049 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_allratio`
--

DROP TABLE IF EXISTS `ms_voice_allratio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_allratio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_delivery1` smallint(6) NOT NULL,
  `user_fakedel1` smallint(6) NOT NULL,
  `user_delivery4` smallint(6) NOT NULL,
  `user_fakedel4` smallint(6) NOT NULL,
  `user_delivery3` smallint(6) NOT NULL,
  `user_fakedel3` smallint(6) NOT NULL,
  `user_delivery5` smallint(6) NOT NULL,
  `user_fakedel5` smallint(6) NOT NULL,
  `user_delivery8` smallint(6) NOT NULL,
  `user_fakedel8` smallint(6) NOT NULL,
  `user_delivery9` smallint(6) NOT NULL,
  `user_fakedel9` smallint(6) NOT NULL,
  `user_delivery10` smallint(6) NOT NULL,
  `user_fakedel10` smallint(6) NOT NULL,
  `user_delivery11` smallint(6) NOT NULL,
  `user_fakedel11` smallint(6) NOT NULL,
  `user_delivery12` smallint(6) NOT NULL,
  `user_fakedel12` smallint(6) NOT NULL,
  `user_delivery13` smallint(6) NOT NULL,
  `user_fakedel13` smallint(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39528 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_blockno`
--

DROP TABLE IF EXISTS `ms_voice_blockno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_blockno` (
  `blockno_id` int(11) NOT NULL AUTO_INCREMENT,
  `blockno_number` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` varchar(1024) DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`blockno_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_bsend`
--

DROP TABLE IF EXISTS `ms_voice_bsend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_bsend` (
  `bsend_pid` int(11) NOT NULL AUTO_INCREMENT,
  `bsend_word` varchar(12) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`bsend_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_credit_operator`
--

DROP TABLE IF EXISTS `ms_voice_credit_operator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_credit_operator` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prefix` int(11) NOT NULL,
  `operator` int(11) NOT NULL,
  `credit` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=417 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_credits`
--

DROP TABLE IF EXISTS `ms_voice_credits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_credits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prefix` int(11) NOT NULL,
  `credit` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=400 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_flow_track`
--

DROP TABLE IF EXISTS `ms_voice_flow_track`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_flow_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` bigint(20) NOT NULL,
  `Step` varchar(5) NOT NULL,
  `Time` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `totalmsg` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_operator`
--

DROP TABLE IF EXISTS `ms_voice_operator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_operator` (
  `op_id` int(11) NOT NULL AUTO_INCREMENT,
  `operatorname` varchar(20) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`op_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_ratio`
--

DROP TABLE IF EXISTS `ms_voice_ratio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_ratio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `user_delivery` enum('0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100') CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_fakedel` smallint(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1013 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_report`
--

DROP TABLE IF EXISTS `ms_voice_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_report` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `total_sms` bigint(20) NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1892 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_req_status`
--

DROP TABLE IF EXISTS `ms_voice_req_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_req_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_pid` bigint(20) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `status` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_sms`
--

DROP TABLE IF EXISTS `ms_voice_sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_sms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uniqueId` varchar(100) NOT NULL,
  `telNum` varchar(20) NOT NULL,
  `annName` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `status` varchar(100) NOT NULL,
  `priority` int(11) NOT NULL,
  `maxRetry` varchar(10) NOT NULL,
  `retryTime` varchar(10) NOT NULL,
  `retryCount` int(11) NOT NULL,
  `callerId` varchar(20) NOT NULL,
  `maxDuration` int(11) NOT NULL,
  `scheduleTime` datetime NOT NULL,
  `send_status` varchar(15) NOT NULL,
  `spam_reason` varchar(100) DEFAULT NULL,
  `sms_id` varchar(30) DEFAULT NULL,
  `server_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voice_smsold`
--

DROP TABLE IF EXISTS `ms_voice_smsold`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voice_smsold` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uniqueId` varchar(100) NOT NULL,
  `telNum` varchar(20) NOT NULL,
  `annName` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `status` varchar(100) NOT NULL,
  `priority` int(11) NOT NULL,
  `maxRetry` varchar(10) NOT NULL,
  `retryTime` varchar(10) NOT NULL,
  `retryCount` int(11) NOT NULL,
  `callerId` varchar(20) NOT NULL,
  `maxDuration` int(11) NOT NULL,
  `scheduleTime` datetime NOT NULL,
  `send_status` varchar(15) NOT NULL,
  `spam_reason` varchar(100) DEFAULT NULL,
  `sms_id` varchar(30) DEFAULT NULL,
  `server_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_voicetrans`
--

DROP TABLE IF EXISTS `ms_voicetrans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_voicetrans` (
  `trans_pid` int(11) NOT NULL AUTO_INCREMENT,
  `trans_fuserid` int(11) NOT NULL,
  `trans_tuserid` int(11) NOT NULL,
  `route` int(11) NOT NULL,
  `trans_type` int(11) NOT NULL,
  `trans_sms` int(11) NOT NULL,
  `fund_transfer_type` tinyint(1) NOT NULL,
  `tax` decimal(11,2) NOT NULL,
  `trans_amt` decimal(14,2) NOT NULL,
  `trans_desc` text NOT NULL,
  `trans_date` timestamp NULL DEFAULT NULL,
  `cost` double NOT NULL,
  `account_manager` int(11) NOT NULL,
  `record` int(11) NOT NULL,
  `payment_mode` tinyint(1) NOT NULL,
  `tds` int(11) DEFAULT NULL,
  `currency` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`trans_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=9061 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_wallet_slab`
--

DROP TABLE IF EXISTS `ms_wallet_slab`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_wallet_slab` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` int(11) NOT NULL,
  `to` int(11) NOT NULL,
  `channel_id` int(11) NOT NULL,
  `dialplan_id` int(11) NOT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `local_dialplan_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ms_whatsapp_user_setting`
--

DROP TABLE IF EXISTS `ms_whatsapp_user_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ms_whatsapp_user_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `request_accepted` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `authkey` varchar(255) DEFAULT NULL,
  `last_key_updated_by` int(11) DEFAULT NULL,
  `key_added_by` int(11) DEFAULT NULL,
  `mobile_number` bigint(20) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_date` timestamp NULL DEFAULT NULL,
  `credits_per_message` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msg91_click_tracker`
--

DROP TABLE IF EXISTS `msg91_click_tracker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msg91_click_tracker` (
  `urls_hash` smallint(5) unsigned NOT NULL,
  `urls_key` varchar(255) NOT NULL,
  `urls_val` text NOT NULL,
  `urls_total` bigint(20) unsigned NOT NULL,
  `urls_cnt0` smallint(5) unsigned NOT NULL,
  `urls_cnt1` smallint(5) unsigned NOT NULL,
  `urls_cnt2` smallint(5) unsigned NOT NULL,
  `urls_cnt3` smallint(5) unsigned NOT NULL,
  `urls_cnt4` smallint(5) unsigned NOT NULL,
  `urls_cnt5` smallint(5) unsigned NOT NULL,
  `urls_cnt6` smallint(5) unsigned NOT NULL,
  `urls_cnt7` smallint(5) unsigned NOT NULL,
  `urls_cnt8` smallint(5) unsigned NOT NULL,
  `urls_cnt9` smallint(5) unsigned NOT NULL,
  `urls_cnt10` smallint(5) unsigned NOT NULL,
  `urls_cnt11` smallint(5) unsigned NOT NULL,
  `urls_cnt12` smallint(5) unsigned NOT NULL,
  `urls_cnt13` smallint(5) unsigned NOT NULL,
  `urls_cnt14` smallint(5) unsigned NOT NULL,
  `urls_cnt15` smallint(5) unsigned NOT NULL,
  `urls_cnt16` smallint(5) unsigned NOT NULL,
  `urls_cnt17` smallint(5) unsigned NOT NULL,
  `urls_cnt18` smallint(5) unsigned NOT NULL,
  `urls_cnt19` smallint(5) unsigned NOT NULL,
  `urls_cnt20` smallint(5) unsigned NOT NULL,
  `urls_cnt21` smallint(5) unsigned NOT NULL,
  `urls_cnt22` smallint(5) unsigned NOT NULL,
  `urls_cnt23` smallint(5) unsigned NOT NULL,
  `urls_cnt24` smallint(5) unsigned NOT NULL,
  `urls_cnt25` smallint(5) unsigned NOT NULL,
  `urls_cnt26` smallint(5) unsigned NOT NULL,
  `urls_cnt27` smallint(5) unsigned NOT NULL,
  `urls_cnt28` smallint(5) unsigned NOT NULL,
  `urls_cnt29` smallint(5) unsigned NOT NULL,
  `urls_cnt30` smallint(5) unsigned NOT NULL,
  `urls_cnt31` smallint(5) unsigned NOT NULL,
  `urls_cnt32` smallint(5) unsigned NOT NULL,
  `urls_cnt33` smallint(5) unsigned NOT NULL,
  `urls_cnt34` smallint(5) unsigned NOT NULL,
  `urls_cnt35` smallint(5) unsigned NOT NULL,
  `urls_cnt36` smallint(5) unsigned NOT NULL,
  `urls_cnt37` smallint(5) unsigned NOT NULL,
  `urls_cnt38` smallint(5) unsigned NOT NULL,
  `urls_cnt39` smallint(5) unsigned NOT NULL,
  `urls_cnt40` smallint(5) unsigned NOT NULL,
  `urls_cnt41` smallint(5) unsigned NOT NULL,
  `urls_cnt42` smallint(5) unsigned NOT NULL,
  `urls_cnt43` smallint(5) unsigned NOT NULL,
  `urls_cnt44` smallint(5) unsigned NOT NULL,
  `urls_cnt45` smallint(5) unsigned NOT NULL,
  `urls_cnt46` smallint(5) unsigned NOT NULL,
  `urls_cnt47` smallint(5) unsigned NOT NULL,
  `urls_cnt48` smallint(5) unsigned NOT NULL,
  `urls_cnt49` smallint(5) unsigned NOT NULL,
  `urls_cnt50` smallint(5) unsigned NOT NULL,
  `urls_cnt51` smallint(5) unsigned NOT NULL,
  `urls_cnt52` smallint(5) unsigned NOT NULL,
  `urls_cnt53` smallint(5) unsigned NOT NULL,
  `urls_cnt54` smallint(5) unsigned NOT NULL,
  `urls_cnt55` smallint(5) unsigned NOT NULL,
  `urls_cnt56` smallint(5) unsigned NOT NULL,
  `urls_cnt57` smallint(5) unsigned NOT NULL,
  `urls_cnt58` smallint(5) unsigned NOT NULL,
  `urls_cnt59` smallint(5) unsigned NOT NULL,
  `urls_cnt60` smallint(5) unsigned NOT NULL,
  `urls_cnt61` smallint(5) unsigned NOT NULL,
  `urls_cnt62` smallint(5) unsigned NOT NULL,
  `urls_cnt63` smallint(5) unsigned NOT NULL,
  `urls_cnt64` smallint(5) unsigned NOT NULL,
  `urls_cnt65` smallint(5) unsigned NOT NULL,
  `urls_cnt66` smallint(5) unsigned NOT NULL,
  `urls_cnt67` smallint(5) unsigned NOT NULL,
  `urls_cnt68` smallint(5) unsigned NOT NULL,
  `urls_cnt69` smallint(5) unsigned NOT NULL,
  `urls_cnt70` smallint(5) unsigned NOT NULL,
  `urls_cnt71` smallint(5) unsigned NOT NULL,
  `urls_cnt72` smallint(5) unsigned NOT NULL,
  `urls_cnt73` smallint(5) unsigned NOT NULL,
  `urls_cnt74` smallint(5) unsigned NOT NULL,
  `urls_cnt75` smallint(5) unsigned NOT NULL,
  `urls_cnt76` smallint(5) unsigned NOT NULL,
  `urls_cnt77` smallint(5) unsigned NOT NULL,
  `urls_cnt78` smallint(5) unsigned NOT NULL,
  `urls_cnt79` smallint(5) unsigned NOT NULL,
  `urls_cnt80` smallint(5) unsigned NOT NULL,
  `urls_cnt81` smallint(5) unsigned NOT NULL,
  `urls_cnt82` smallint(5) unsigned NOT NULL,
  `urls_cnt83` smallint(5) unsigned NOT NULL,
  `urls_cnt84` smallint(5) unsigned NOT NULL,
  `urls_cnt85` smallint(5) unsigned NOT NULL,
  `urls_cnt86` smallint(5) unsigned NOT NULL,
  `urls_cnt87` smallint(5) unsigned NOT NULL,
  `urls_cnt88` smallint(5) unsigned NOT NULL,
  `urls_cnt89` smallint(5) unsigned NOT NULL,
  `urls_cnt90` smallint(5) unsigned NOT NULL,
  `urls_cnt91` smallint(5) unsigned NOT NULL,
  `urls_cnt92` smallint(5) unsigned NOT NULL,
  `urls_cnt93` smallint(5) unsigned NOT NULL,
  `urls_cnt94` smallint(5) unsigned NOT NULL,
  `urls_cnt95` smallint(5) unsigned NOT NULL,
  `urls_cnt96` smallint(5) unsigned NOT NULL,
  `urls_cnt97` smallint(5) unsigned NOT NULL,
  `urls_cnt98` smallint(5) unsigned NOT NULL,
  `urls_cnt99` smallint(5) unsigned NOT NULL,
  `urls_cnt100` smallint(5) unsigned NOT NULL,
  `urls_cnt101` smallint(5) unsigned NOT NULL,
  `urls_cnt102` smallint(5) unsigned NOT NULL,
  `urls_cnt103` smallint(5) unsigned NOT NULL,
  `urls_cnt104` smallint(5) unsigned NOT NULL,
  `urls_cnt105` smallint(5) unsigned NOT NULL,
  `urls_cnt106` smallint(5) unsigned NOT NULL,
  `urls_cnt107` smallint(5) unsigned NOT NULL,
  `urls_cnt108` smallint(5) unsigned NOT NULL,
  `urls_cnt109` smallint(5) unsigned NOT NULL,
  `urls_cnt110` smallint(5) unsigned NOT NULL,
  `urls_cnt111` smallint(5) unsigned NOT NULL,
  `urls_cnt112` smallint(5) unsigned NOT NULL,
  `urls_cnt113` smallint(5) unsigned NOT NULL,
  `urls_cnt114` smallint(5) unsigned NOT NULL,
  `urls_cnt115` smallint(5) unsigned NOT NULL,
  `urls_cnt116` smallint(5) unsigned NOT NULL,
  `urls_cnt117` smallint(5) unsigned NOT NULL,
  `urls_cnt118` smallint(5) unsigned NOT NULL,
  `urls_cnt119` smallint(5) unsigned NOT NULL,
  `urls_cnt120` smallint(5) unsigned NOT NULL,
  `urls_cnt121` smallint(5) unsigned NOT NULL,
  `urls_cnt122` smallint(5) unsigned NOT NULL,
  `urls_cnt123` smallint(5) unsigned NOT NULL,
  `urls_cnt124` smallint(5) unsigned NOT NULL,
  `urls_cnt125` smallint(5) unsigned NOT NULL,
  `urls_cnt126` smallint(5) unsigned NOT NULL,
  `urls_cnt127` smallint(5) unsigned NOT NULL,
  `urls_cnt128` smallint(5) unsigned NOT NULL,
  `urls_cnt129` smallint(5) unsigned NOT NULL,
  `urls_cnt130` smallint(5) unsigned NOT NULL,
  `urls_cnt131` smallint(5) unsigned NOT NULL,
  `urls_cnt132` smallint(5) unsigned NOT NULL,
  `urls_cnt133` smallint(5) unsigned NOT NULL,
  `urls_cnt134` smallint(5) unsigned NOT NULL,
  `urls_cnt135` smallint(5) unsigned NOT NULL,
  `urls_cnt136` smallint(5) unsigned NOT NULL,
  `urls_cnt137` smallint(5) unsigned NOT NULL,
  `urls_cnt138` smallint(5) unsigned NOT NULL,
  `urls_cnt139` smallint(5) unsigned NOT NULL,
  `urls_cnt140` smallint(5) unsigned NOT NULL,
  `urls_cnt141` smallint(5) unsigned NOT NULL,
  `urls_cnt142` smallint(5) unsigned NOT NULL,
  `urls_cnt143` smallint(5) unsigned NOT NULL,
  `urls_cnt144` smallint(5) unsigned NOT NULL,
  `urls_cnt145` smallint(5) unsigned NOT NULL,
  `urls_cnt146` smallint(5) unsigned NOT NULL,
  `urls_cnt147` smallint(5) unsigned NOT NULL,
  `urls_cnt148` smallint(5) unsigned NOT NULL,
  `urls_cnt149` smallint(5) unsigned NOT NULL,
  `urls_cnt150` smallint(5) unsigned NOT NULL,
  `urls_cnt151` smallint(5) unsigned NOT NULL,
  `urls_cnt152` smallint(5) unsigned NOT NULL,
  `urls_cnt153` smallint(5) unsigned NOT NULL,
  `urls_cnt154` smallint(5) unsigned NOT NULL,
  `urls_cnt155` smallint(5) unsigned NOT NULL,
  `urls_cnt156` smallint(5) unsigned NOT NULL,
  `urls_cnt157` smallint(5) unsigned NOT NULL,
  `urls_cnt158` smallint(5) unsigned NOT NULL,
  `urls_cnt159` smallint(5) unsigned NOT NULL,
  `urls_cnt160` smallint(5) unsigned NOT NULL,
  `urls_cnt161` smallint(5) unsigned NOT NULL,
  `urls_cnt162` smallint(5) unsigned NOT NULL,
  `urls_cnt163` smallint(5) unsigned NOT NULL,
  `urls_cnt164` smallint(5) unsigned NOT NULL,
  `urls_cnt165` smallint(5) unsigned NOT NULL,
  `urls_cnt166` smallint(5) unsigned NOT NULL,
  `urls_cnt167` smallint(5) unsigned NOT NULL,
  `urls_cnt168` smallint(5) unsigned NOT NULL,
  `urls_cnt169` smallint(5) unsigned NOT NULL,
  `urls_cnt170` smallint(5) unsigned NOT NULL,
  `urls_cnt171` smallint(5) unsigned NOT NULL,
  `urls_cnt172` smallint(5) unsigned NOT NULL,
  `urls_cnt173` smallint(5) unsigned NOT NULL,
  `urls_cnt174` smallint(5) unsigned NOT NULL,
  `urls_cnt175` smallint(5) unsigned NOT NULL,
  `urls_cnt176` smallint(5) unsigned NOT NULL,
  `urls_cnt177` smallint(5) unsigned NOT NULL,
  `urls_cnt178` smallint(5) unsigned NOT NULL,
  `urls_cnt179` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`urls_key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mytable`
--

DROP TABLE IF EXISTS `mytable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mytable` (
  `request_id` varchar(25) NOT NULL,
  `date` varchar(20) NOT NULL,
  `receiver` varchar(12) NOT NULL,
  `status` varchar(3) NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_ndnc_inc`
--

DROP TABLE IF EXISTS `new_ndnc_inc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_ndnc_inc` (
  `Service Area Code` varchar(5) NOT NULL,
  `phonenumbers` bigint(20) NOT NULL,
  `Preferences` varchar(5) NOT NULL,
  `Opstype` varchar(5) NOT NULL,
  `PhoneType` varchar(5) NOT NULL,
  PRIMARY KEY (`phonenumbers`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_reseller_data`
--

DROP TABLE IF EXISTS `new_reseller_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_reseller_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `mobile` varchar(50) NOT NULL,
  `city` varchar(50) NOT NULL,
  `country` varchar(50) NOT NULL,
  `expvolume` varchar(50) NOT NULL,
  `comment` varchar(200) NOT NULL,
  `type` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `newletter_emails`
--

DROP TABLE IF EXISTS `newletter_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newletter_emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `key` text NOT NULL,
  `name` varchar(300) NOT NULL,
  `message` text NOT NULL,
  `startTime` timestamp NULL DEFAULT NULL,
  `status` tinyint(1) NOT NULL,
  `endTime` datetime DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4283 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_templates`
--

DROP TABLE IF EXISTS `otp_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `template` longtext NOT NULL,
  `subject` varchar(255) NOT NULL,
  `templateId` int(11) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_widget`
--

DROP TABLE IF EXISTS `otp_widget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_widget` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `widget_id` varchar(45) NOT NULL DEFAULT '',
  `company_id` int(11) NOT NULL,
  `brand_name` varchar(20) NOT NULL DEFAULT '',
  `type` int(1) NOT NULL,
  `process_type` int(1) NOT NULL,
  `length` int(1) NOT NULL,
  `status` int(1) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `extra_details` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Unique` (`company_id`,`brand_name`),
  KEY `wid` (`widget_id`),
  CONSTRAINT `ForeignKey` FOREIGN KEY (`company_id`) REFERENCES `ms_user` (`user_pid`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=602 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_widget_process`
--

DROP TABLE IF EXISTS `otp_widget_process`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_widget_process` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `otp_widget_id` varchar(45) NOT NULL DEFAULT '',
  `process_via` int(2) NOT NULL,
  `channel` int(2) NOT NULL,
  `template_id` varchar(45) DEFAULT '',
  `template_variables` longtext,
  PRIMARY KEY (`id`),
  KEY `FKEY_idx` (`otp_widget_id`),
  CONSTRAINT `FKEY` FOREIGN KEY (`otp_widget_id`) REFERENCES `otp_widget` (`widget_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4560 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ourdomains`
--

DROP TABLE IF EXISTS `ourdomains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ourdomains` (
  `dom_id` int(11) NOT NULL AUTO_INCREMENT,
  `dom_name` varchar(100) NOT NULL,
  PRIMARY KEY (`dom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `outstanding_mails`
--

DROP TABLE IF EXISTS `outstanding_mails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outstanding_mails` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `outstanding` varchar(12) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `sent` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `countryId` varchar(255) NOT NULL,
  `pageName` longtext NOT NULL,
  `logo` longtext NOT NULL,
  `headbanner` longtext NOT NULL,
  `color` varchar(255) NOT NULL,
  `bannerText` longtext NOT NULL,
  `section1` longtext NOT NULL,
  `quotes` longtext NOT NULL,
  `section2` longtext NOT NULL,
  `quicklinks` longtext NOT NULL,
  `section3` longtext NOT NULL,
  `price` longtext NOT NULL,
  `contact` longtext NOT NULL,
  `footerlinks` longtext NOT NULL,
  `status` varchar(255) NOT NULL,
  `metatags` longtext NOT NULL,
  `last_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel`
--

DROP TABLE IF EXISTS `panel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel` (
  `blockno_id` int(11) NOT NULL AUTO_INCREMENT,
  `blockno_number` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` varchar(1024) DEFAULT NULL,
  `sender_user_pid` varchar(2048) DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `check_for_all` tinyint(4) NOT NULL,
  PRIMARY KEY (`blockno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27537 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_db`
--

DROP TABLE IF EXISTS `panel_db`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_db` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel_id` int(11) NOT NULL,
  `hostname` varchar(200) NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `db` varchar(50) NOT NULL,
  `mongo_collection` varchar(50) NOT NULL,
  `spam_collection` varchar(50) NOT NULL,
  `proxy_host` varchar(255) DEFAULT NULL,
  `replica` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_db_copy`
--

DROP TABLE IF EXISTS `panel_db_copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_db_copy` (
  `id` int(11) NOT NULL,
  `panel_id` int(11) NOT NULL,
  `hostname` varchar(200) NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `db` varchar(50) NOT NULL,
  `mongo_collection` varchar(50) NOT NULL,
  `spam_collection` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_db_withrds_kannel`
--

DROP TABLE IF EXISTS `panel_db_withrds_kannel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_db_withrds_kannel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel_id` int(11) NOT NULL,
  `hostname` varchar(100) NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `db` varchar(50) NOT NULL,
  `mongo_collection` varchar(50) NOT NULL,
  `spam_collection` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_feature`
--

DROP TABLE IF EXISTS `panel_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_feature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pid` int(11) NOT NULL,
  `isUsingTextPanel` tinyint(1) NOT NULL,
  `isUsingShortUrl` tinyint(1) DEFAULT NULL,
  `isUsingVoicePanel` tinyint(1) NOT NULL,
  `isUsingPanelRoute` int(11) NOT NULL,
  `isRequestDetailShow` tinyint(1) NOT NULL,
  `isUsingResend` tinyint(1) NOT NULL,
  `executiveSummary` tinyint(1) NOT NULL,
  `isUsingRoute4` tinyint(1) NOT NULL,
  `isUsingMongo` int(11) NOT NULL,
  `isR4Allow` tinyint(1) NOT NULL,
  `isUsingDialPlan` int(11) NOT NULL,
  `isUsingPanelTime` tinyint(1) NOT NULL,
  `isUsingLongcode` tinyint(1) NOT NULL,
  `isUsingBlockNumber` tinyint(1) NOT NULL,
  `isusingAnalysis` tinyint(1) NOT NULL,
  `isUsingOpt` tinyint(4) NOT NULL,
  `isUsingExport` tinyint(1) NOT NULL,
  `isUsingDelete` tinyint(4) NOT NULL,
  `isUsingStopRoute` tinyint(1) NOT NULL,
  `isUsingDlrsetting` tinyint(1) NOT NULL,
  `isUsingDlrpush` tinyint(1) NOT NULL,
  `isMultiadmin` tinyint(1) NOT NULL,
  `isSuperadmin` tinyint(1) NOT NULL,
  `isTextdialplan` tinyint(1) NOT NULL,
  `isUsingDummytext` tinyint(1) NOT NULL,
  `isUsingDummyVoice` tinyint(1) NOT NULL,
  `isUsingCircleBlocked` tinyint(1) NOT NULL,
  `isUsingHardblocked` tinyint(1) NOT NULL,
  `isUsingFlash` int(11) NOT NULL,
  `isUsingRatio` int(11) NOT NULL,
  `blockPanelLogin` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_resend_setting`
--

DROP TABLE IF EXISTS `panel_resend_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_resend_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel_id` int(11) NOT NULL,
  `route1_expiry_time` int(11) NOT NULL,
  `route4_expiry_time` int(11) NOT NULL,
  `resend_status` int(11) NOT NULL,
  `isUser` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_route_balance_log`
--

DROP TABLE IF EXISTS `panel_route_balance_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_route_balance_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel_route_id` int(11) NOT NULL,
  `panel_route_balance` double NOT NULL,
  `server_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=225 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_route_trans_log`
--

DROP TABLE IF EXISTS `panel_route_trans_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_route_trans_log` (
  `trans_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `panel_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `sms` double NOT NULL,
  `rate` double(20,2) NOT NULL,
  `trans_date` timestamp NULL DEFAULT NULL,
  `credit_type` int(11) NOT NULL,
  `trans_type` int(11) NOT NULL,
  `giddh_id` text NOT NULL,
  PRIMARY KEY (`trans_id`)
) ENGINE=InnoDB AUTO_INCREMENT=240 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_routes`
--

DROP TABLE IF EXISTS `panel_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel` varchar(100) NOT NULL,
  `route` varchar(55) NOT NULL,
  `balance` double NOT NULL,
  `dlr_url` varchar(600) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `smsc_name` varchar(25) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `route_delivery` enum('1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100') CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `pannel_id` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_trans_log`
--

DROP TABLE IF EXISTS `panel_trans_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_trans_log` (
  `trans_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `panel_id` int(11) NOT NULL,
  `sms` double NOT NULL,
  `rate` double(20,2) NOT NULL,
  `trans_date` timestamp NULL DEFAULT NULL,
  `credit_type` int(11) NOT NULL,
  `trans_type` int(11) NOT NULL,
  `giddh_id` text NOT NULL,
  PRIMARY KEY (`trans_id`)
) ENGINE=InnoDB AUTO_INCREMENT=285 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_voice_routes`
--

DROP TABLE IF EXISTS `panel_voice_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_voice_routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `route_delivery` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pannel_details`
--

DROP TABLE IF EXISTS `pannel_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pannel_details` (
  `pannel_id` int(11) NOT NULL,
  `p_name` varchar(55) NOT NULL,
  `ip` varchar(55) NOT NULL,
  `full_name` varchar(55) NOT NULL,
  `admin_uname` varchar(55) NOT NULL,
  `acc_manager` int(11) DEFAULT NULL,
  `defined_name` varchar(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `mobile` varchar(50) NOT NULL,
  `expire_date` date NOT NULL,
  `status` tinyint(4) NOT NULL,
  `block` int(11) NOT NULL,
  `admin_password` varchar(50) NOT NULL,
  `admin_domain` varchar(255) NOT NULL,
  PRIMARY KEY (`pannel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pannel_details_bckp`
--

DROP TABLE IF EXISTS `pannel_details_bckp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pannel_details_bckp` (
  `pannel_id` int(11) NOT NULL,
  `p_name` varchar(55) NOT NULL,
  `ip` varchar(55) NOT NULL,
  `full_name` varchar(55) NOT NULL,
  `admin_uname` varchar(55) NOT NULL,
  `acc_manager` int(11) DEFAULT NULL,
  `defined_name` varchar(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `mobile` varchar(50) NOT NULL,
  `expire_date` date NOT NULL,
  `status` tinyint(4) NOT NULL,
  `block` int(11) NOT NULL,
  `admin_password` varchar(50) NOT NULL,
  `admin_domain` varchar(255) NOT NULL,
  PRIMARY KEY (`pannel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pannel_details_temp`
--

DROP TABLE IF EXISTS `pannel_details_temp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pannel_details_temp` (
  `pannel_id` int(11) NOT NULL AUTO_INCREMENT,
  `p_name` varchar(55) NOT NULL,
  `ip` varchar(55) NOT NULL,
  `full_name` varchar(55) NOT NULL,
  `admin_uname` varchar(55) NOT NULL,
  `db` tinyint(4) DEFAULT NULL,
  `acc_manager` int(11) DEFAULT NULL,
  `defined_name` varchar(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `expire_date` date NOT NULL,
  `status` tinyint(4) NOT NULL,
  `block` int(11) NOT NULL,
  PRIMARY KEY (`pannel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parent_chain`
--

DROP TABLE IF EXISTS `parent_chain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_chain` (
  `user_pid` int(11) NOT NULL,
  `upchain` varchar(45) NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parent_chain_26_03_14`
--

DROP TABLE IF EXISTS `parent_chain_26_03_14`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_chain_26_03_14` (
  `user_pid` int(11) NOT NULL,
  `upchain` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parent_chain_7_4`
--

DROP TABLE IF EXISTS `parent_chain_7_4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_chain_7_4` (
  `user_pid` int(11) NOT NULL,
  `upchain` varchar(255) NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parent_chain_old`
--

DROP TABLE IF EXISTS `parent_chain_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_chain_old` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `upchain` varchar(255) NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=278971 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parent_chain_shftTest`
--

DROP TABLE IF EXISTS `parent_chain_shftTest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_chain_shftTest` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `upchain` varchar(255) NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=87620 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parser_template`
--

DROP TABLE IF EXISTS `parser_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parser_template` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(25) NOT NULL,
  `authkey` varchar(10) NOT NULL,
  `template` blob NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`pid`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_route_level`
--

DROP TABLE IF EXISTS `pay_route_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_route_level` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` varchar(255) NOT NULL,
  `route_level` varchar(255) NOT NULL,
  `min_range` varchar(255) NOT NULL,
  `max_range` varchar(255) NOT NULL,
  `sms_rate` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8131 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_integrations`
--

DROP TABLE IF EXISTS `payment_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_integrations` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `supply` varchar(20) DEFAULT NULL,
  `gateway` varchar(50) DEFAULT NULL,
  `gateway_key` varchar(50) DEFAULT NULL,
  `gateway_value` varchar(120) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint(2) NOT NULL DEFAULT '1',
  `is_public` tinyint(1) DEFAULT NULL,
  `selection_ratio` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`gateway`,`gateway_key`,`supply`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_tbl`
--

DROP TABLE IF EXISTS `payment_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_tbl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `netBanking` varchar(255) NOT NULL,
  `paypal` varchar(255) NOT NULL,
  `paypal_key_secret` varchar(255) DEFAULT '',
  `moneybooker` varchar(255) NOT NULL,
  `ccAvenue` varchar(255) NOT NULL,
  `tax` decimal(5,2) NOT NULL,
  `description` text NOT NULL,
  `email` varchar(255) NOT NULL,
  `status` varchar(7) NOT NULL,
  `url` varchar(128) NOT NULL,
  `ebs` varchar(255) NOT NULL,
  `ccAvenueKey` varchar(255) NOT NULL,
  `ebsKey` varchar(255) NOT NULL,
  `direcPayKey` varchar(255) NOT NULL,
  `stripe_pk` varchar(50) NOT NULL,
  `stripe_sk` varchar(50) NOT NULL,
  `payU_key` varchar(40) NOT NULL,
  `payU_salt` varchar(40) NOT NULL,
  `payU_biz_key` text,
  `payU_biz_salt` text,
  `instamojo_key` varchar(40) NOT NULL,
  `instamojo_token` varchar(40) NOT NULL,
  `razorpay_key_id` varchar(40) NOT NULL,
  `razorpay_key_secret` varchar(40) NOT NULL,
  `pesapal_key_id` varchar(40) NOT NULL,
  `pesapal_key_secret` varchar(40) NOT NULL,
  `lipisha_api_key` varchar(255) DEFAULT NULL,
  `lipisha_api_signature` varchar(1000) DEFAULT NULL,
  `lipisha_account_no` varchar(100) NOT NULL,
  `rave_flutterwave_public` varchar(100) NOT NULL,
  `rave_flutterwave_secret` varchar(100) NOT NULL,
  `paynimo_merchant` varchar(40) DEFAULT NULL,
  `paynimo_key` varchar(40) DEFAULT NULL,
  `paynimo_iv` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=418 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_validation`
--

DROP TABLE IF EXISTS `payment_validation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_validation` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `email_verified` enum('1','0') NOT NULL,
  `signup_type` enum('1','2') NOT NULL,
  `user_type` tinyint(1) NOT NULL,
  `validation_code` varchar(32) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=314 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_webhook_log`
--

DROP TABLE IF EXISTS `payment_webhook_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_webhook_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel_id` int(11) DEFAULT NULL,
  `gateway` varchar(30) DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  `response` text,
  `request_url` longtext,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30151 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paypalTokens`
--

DROP TABLE IF EXISTS `paypalTokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paypalTokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token_id` varchar(30) NOT NULL,
  `mandate_id` varchar(30) NOT NULL,
  `token_name` varchar(255) NOT NULL,
  `company_id` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL COMMENT 'Status (e.g., active/inactive)',
  `link` varchar(255) NOT NULL,
  `last_updated_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token_id` (`token_id`)
) ENGINE=InnoDB AUTO_INCREMENT=179 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paypalWebhookLogs`
--

DROP TABLE IF EXISTS `paypalWebhookLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paypalWebhookLogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `webhookRequest` longtext,
  `logTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2710 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paypal_auto_recharge_subscriptions`
--

DROP TABLE IF EXISTS `paypal_auto_recharge_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paypal_auto_recharge_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `token_id` varchar(30) NOT NULL,
  `mandate_id` varchar(30) NOT NULL,
  `threshold_amount` double(20,5) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) DEFAULT '0.00000',
  `net_amount` double(20,5) NOT NULL,
  `route` int(11) NOT NULL DEFAULT '0',
  `status` int(11) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id_route_UNIQUE` (`company_id`,`route`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_campaign_text`
--

DROP TABLE IF EXISTS `pb_campaign_text`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_campaign_text` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender_id` varchar(24) NOT NULL,
  `is_unicode` tinyint(4) DEFAULT NULL,
  `message` text,
  `created_time` timestamp NULL DEFAULT NULL,
  `is_spam` tinyint(4) DEFAULT NULL,
  `spam_response` text,
  `is_pending` tinyint(4) DEFAULT NULL,
  `is_flash` tinyint(4) DEFAULT NULL,
  `is_encrypt` tinyint(4) DEFAULT NULL,
  `signature` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_default_fields`
--

DROP TABLE IF EXISTS `pb_default_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_default_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `length` int(11) DEFAULT NULL,
  `short_name` varchar(100) DEFAULT NULL,
  `seq` int(11) DEFAULT NULL,
  `field_type_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `field_type_id` (`field_type_id`),
  CONSTRAINT `pb_default_fields_ibfk_1` FOREIGN KEY (`field_type_id`) REFERENCES `pb_field_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_detail`
--

DROP TABLE IF EXISTS `pb_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_detail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pb_name` varchar(128) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=461 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_field_dict`
--

DROP TABLE IF EXISTS `pb_field_dict`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_field_dict` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `pb_id` int(11) DEFAULT NULL,
  `pb_collection_name` varchar(50) DEFAULT NULL,
  `field_name` varchar(50) DEFAULT NULL,
  `field_type` varchar(50) DEFAULT NULL,
  `field_length` int(11) DEFAULT NULL,
  `field_short_name` varchar(5) DEFAULT NULL,
  `is_deleted` tinyint(2) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `seq` int(11) DEFAULT '0',
  `field_type_id` int(11) DEFAULT NULL,
  `is_custom_field` tinyint(1) DEFAULT '1',
  `is_unique` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNQIDX_FLD_NAME` (`pb_id`,`field_name`),
  UNIQUE KEY `UNQIDX_SHRT_NAME` (`pb_id`,`field_short_name`),
  KEY `field_type_id` (`field_type_id`),
  CONSTRAINT `pb_field_dict_ibfk_1` FOREIGN KEY (`field_type_id`) REFERENCES `pb_field_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_field_dict_old`
--

DROP TABLE IF EXISTS `pb_field_dict_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_field_dict_old` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pb_id` int(11) DEFAULT NULL,
  `pb_collection_name` varchar(50) DEFAULT NULL,
  `field_name` varchar(50) DEFAULT NULL,
  `field_type` varchar(50) DEFAULT NULL,
  `field_length` int(11) DEFAULT NULL,
  `field_short_name` varchar(5) DEFAULT NULL,
  `is_deleted` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `seq` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_field_type_condition_groups`
--

DROP TABLE IF EXISTS `pb_field_type_condition_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_field_type_condition_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_field_type_conditions`
--

DROP TABLE IF EXISTS `pb_field_type_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_field_type_conditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `field_type_id` int(11) DEFAULT NULL,
  `field_type_condition_group_id` int(11) DEFAULT NULL,
  `label` varchar(100) DEFAULT NULL,
  `input_type` enum('text','numeric','date','dropdown','empty') DEFAULT NULL,
  `mathematical_symbol` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `field_type_id` (`field_type_id`),
  KEY `field_type_condition_group_id` (`field_type_condition_group_id`),
  CONSTRAINT `pb_field_type_conditions_ibfk_1` FOREIGN KEY (`field_type_id`) REFERENCES `pb_field_types` (`id`),
  CONSTRAINT `pb_field_type_conditions_ibfk_2` FOREIGN KEY (`field_type_condition_group_id`) REFERENCES `pb_field_type_condition_groups` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_field_types`
--

DROP TABLE IF EXISTS `pb_field_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_field_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `field_length` int(11) DEFAULT NULL,
  `icon_url` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_segment_filters`
--

DROP TABLE IF EXISTS `pb_segment_filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_segment_filters` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `segment_id` int(10) unsigned NOT NULL,
  `field_id` int(10) unsigned NOT NULL,
  `operator` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `join_operator` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pb_segments`
--

DROP TABLE IF EXISTS `pb_segments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pb_segments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pb_id` int(10) unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL,
  `query` text,
  `dates` text,
  `records` int(11) DEFAULT NULL,
  `segment_id` varchar(50) DEFAULT NULL,
  `fields` text,
  `is_old_group` tinyint(1) DEFAULT NULL,
  `filter_query` json DEFAULT NULL,
  `is_counting_under_progress` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pe_tm_binding`
--

DROP TABLE IF EXISTS `pe_tm_binding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pe_tm_binding` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `tm_chain` varchar(255) NOT NULL,
  `final_hash` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_entity` (`user_id`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1006 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pe_tm_binding_version`
--

DROP TABLE IF EXISTS `pe_tm_binding_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pe_tm_binding_version` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `tm_chain` varchar(255) NOT NULL,
  `final_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1010 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pending_otp_template`
--

DROP TABLE IF EXISTS `pending_otp_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_otp_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `template_id` varchar(255) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `template` text,
  `approved_date` date DEFAULT NULL,
  `approved_operators` varchar(255) DEFAULT NULL,
  `rejected_operators` varchar(255) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `created_by` tinyint(1) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=280 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pending_r4_template`
--

DROP TABLE IF EXISTS `pending_r4_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_r4_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `template_id` varchar(255) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `template` text,
  `approved_date` date DEFAULT NULL,
  `approved_operators` varchar(255) DEFAULT NULL,
  `rejected_operators` varchar(255) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `created_by` tinyint(1) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pending_senderid`
--

DROP TABLE IF EXISTS `pending_senderid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_senderid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `senderid` varchar(20) NOT NULL,
  `route_pid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11481 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permission_names`
--

DROP TABLE IF EXISTS `permission_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_names` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(255) NOT NULL,
  `permission_display_name` varchar(225) NOT NULL,
  `microservice_type` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permission_status_names`
--

DROP TABLE IF EXISTS `permission_status_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_status_names` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `permission_id` int(11) NOT NULL,
  `status_value` int(11) NOT NULL,
  `status_label` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=491 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pricing_slab`
--

DROP TABLE IF EXISTS `pricing_slab`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_slab` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route` int(11) NOT NULL,
  `dialplan_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `public_disposable_domain_backup`
--

DROP TABLE IF EXISTS `public_disposable_domain_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `public_disposable_domain_backup` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(25) DEFAULT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1',
  `mx_record` varchar(255) DEFAULT NULL,
  `smtp_provider` varchar(255) DEFAULT NULL,
  `free_domain` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domain` (`domain`)
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `push_auth_key`
--

DROP TABLE IF EXISTS `push_auth_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_auth_key` (
  `push_auth_key_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int(10) unsigned NOT NULL,
  `auth_key_name` varchar(64) NOT NULL,
  `sender_id` varchar(255) NOT NULL,
  `auth_key` varchar(255) NOT NULL,
  `is_active` tinyint(3) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`push_auth_key_id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `push_payload`
--

DROP TABLE IF EXISTS `push_payload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_payload` (
  `push_payload_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `push_auth_key_id` int(10) unsigned NOT NULL,
  `company_id` int(10) unsigned NOT NULL,
  `payload_name` varchar(64) NOT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `payload_json` text NOT NULL,
  `is_active` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`push_payload_id`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `push_report`
--

DROP TABLE IF EXISTS `push_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_report` (
  `push_request_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `push_payload_id` bigint(20) unsigned NOT NULL,
  `company_id` int(10) unsigned NOT NULL,
  `push_auth_key_id` bigint(20) unsigned NOT NULL,
  `fcm_token` varchar(255) NOT NULL,
  `status` enum('SUCCESS','FAILURE','PENDING') NOT NULL,
  `message` varchar(512) NOT NULL,
  `request_json` text NOT NULL,
  `response_json` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`push_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pushurl_delete_log`
--

DROP TABLE IF EXISTS `pushurl_delete_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pushurl_delete_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `email` varchar(50) NOT NULL,
  `url` varchar(250) NOT NULL,
  `date` datetime NOT NULL,
  `count` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rabbit_automation_simulate`
--

DROP TABLE IF EXISTS `rabbit_automation_simulate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rabbit_automation_simulate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_id` int(11) NOT NULL,
  `queue_name` varchar(30) NOT NULL,
  `incoming_rate` int(11) NOT NULL,
  `delivery_rate` int(11) NOT NULL,
  `queue_size` int(11) NOT NULL,
  `runs_on` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rabbit_queue_info`
--

DROP TABLE IF EXISTS `rabbit_queue_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rabbit_queue_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queuetime` varchar(20) NOT NULL,
  `sms_check` int(11) DEFAULT NULL,
  `api` int(11) DEFAULT NULL,
  `all_request_1` int(11) DEFAULT NULL,
  `all_request_4` int(11) DEFAULT NULL,
  `all_request_1_step2` int(11) DEFAULT NULL,
  `all_request_4_step2` int(11) DEFAULT NULL,
  `error_request_retry` int(11) DEFAULT NULL,
  `Promotional_Reports` int(11) DEFAULT NULL,
  `Transactional_Reports` int(11) DEFAULT NULL,
  `Other_panel_4` int(11) DEFAULT NULL,
  `reportPushRawData` int(11) DEFAULT NULL,
  `balance_deduct` int(11) NOT NULL,
  `long_file_promo` int(11) DEFAULT NULL,
  `long_file_trans` int(11) DEFAULT NULL,
  `reportBufferRetryOTP` int(11) DEFAULT NULL,
  `reportBufferRetryTrans` int(11) DEFAULT NULL,
  `Trans_Failed_Retry` int(11) DEFAULT NULL,
  `longcode` int(11) DEFAULT NULL,
  `apiTrans` int(11) DEFAULT NULL,
  `reportBufferRetry` int(11) DEFAULT NULL,
  `OTPAPI` int(11) DEFAULT NULL,
  `Other_panel_4_step2` int(11) DEFAULT NULL,
  `SendOTP_Reports` int(11) DEFAULT NULL,
  `Transactional_Reports_Even` int(11) DEFAULT NULL,
  `failedApi` int(11) DEFAULT NULL,
  `longapi` int(11) DEFAULT NULL,
  `longcodeCallbacks` int(11) DEFAULT NULL,
  `longcodeSendSMS` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rabbit_queue_status`
--

DROP TABLE IF EXISTS `rabbit_queue_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rabbit_queue_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queuetime` varchar(20) NOT NULL,
  `api` int(11) DEFAULT NULL,
  `all_request_1` int(11) DEFAULT NULL,
  `all_request_4` int(11) DEFAULT NULL,
  `all_request_1_step2` int(11) NOT NULL,
  `all_request_4_step2` int(11) NOT NULL,
  `error_request_retry` int(11) DEFAULT NULL,
  `Promotional_Reports` int(11) DEFAULT NULL,
  `Transactional_Reports` int(11) DEFAULT NULL,
  `sms_check` int(11) DEFAULT NULL,
  `Other_panel_4` int(11) DEFAULT NULL,
  `reportPushRawData` int(11) DEFAULT NULL,
  `balance_deduct` int(11) NOT NULL,
  `message` text NOT NULL,
  `apiTrans` int(11) NOT NULL,
  `long_file_trans` int(11) NOT NULL,
  `long_file_promo` int(11) NOT NULL,
  `reportBufferRetry` int(11) NOT NULL,
  `reportBufferRetryOTP` int(11) NOT NULL,
  `reportBufferRetryTrans` int(11) NOT NULL,
  `Trans_Failed_Retry` int(11) NOT NULL,
  `longcode` int(11) NOT NULL,
  `OTPAPI` int(11) NOT NULL,
  `Other_panel_4_step2` int(11) NOT NULL,
  `SendOTP_Reports` int(11) NOT NULL,
  `Transactional_Reports_Even` int(11) NOT NULL,
  `failedApi` int(11) NOT NULL,
  `longapi` int(11) NOT NULL,
  `longcodeCallbacks` int(11) NOT NULL,
  `longcodeSendSMS` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rate_limit`
--

DROP TABLE IF EXISTS `rate_limit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL DEFAULT '0',
  `microservice` int(11) NOT NULL,
  `request_limit` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_limit` (`company_id`,`microservice`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recurring_payment`
--

DROP TABLE IF EXISTS `recurring_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurring_payment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `recurring` tinyint(4) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `regional_message_url_mapping`
--

DROP TABLE IF EXISTS `regional_message_url_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regional_message_url_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message_text` longtext NOT NULL,
  `short_url` text,
  `date_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=485 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `regional_pending_campaigns`
--

DROP TABLE IF EXISTS `regional_pending_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regional_pending_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `campaign_name` varchar(100) DEFAULT NULL,
  `circle_code` varchar(100) NOT NULL,
  `file_name` varchar(1000) NOT NULL,
  `number_count` int(11) DEFAULT NULL,
  `sender_id` varchar(10) DEFAULT NULL,
  `message_text` text,
  `is_sent` enum('0','1') NOT NULL,
  `is_unicode` enum('0','1') NOT NULL,
  `date_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=545 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `regional_sms_campaigns`
--

DROP TABLE IF EXISTS `regional_sms_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regional_sms_campaigns` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `file_name` text,
  `number_count` int(11) DEFAULT NULL,
  `campaign_status` enum('0','1') NOT NULL,
  `date_time` datetime DEFAULT NULL,
  `campaign_name` varchar(250) DEFAULT NULL,
  `message_text` text,
  `is_unicode` tinyint(4) DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `is_sent` tinyint(4) DEFAULT NULL,
  `short_link` text,
  `total_sms_campaign` varchar(50) DEFAULT NULL,
  `sent_sms_campaign` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report_analysis`
--

DROP TABLE IF EXISTS `report_analysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_analysis` (
  `requestId` varchar(255) NOT NULL,
  `isSpam` int(11) NOT NULL,
  `pauseReason` varchar(255) DEFAULT NULL,
  `noOfSMS` int(11) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `curRoute` varchar(255) DEFAULT NULL,
  `delivered` int(11) NOT NULL,
  `deliveryPercent` float NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `reqRoute` varchar(255) DEFAULT NULL,
  `currentTime` datetime DEFAULT NULL,
  `requestDate` varchar(255) DEFAULT NULL,
  `rab_request_1` int(11) NOT NULL,
  `rab_request_4` int(11) NOT NULL,
  `rab_reports_1` int(11) NOT NULL,
  `rab_reports_4` int(11) NOT NULL,
  `rab_retry_queue` int(11) NOT NULL,
  PRIMARY KEY (`requestId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report_archive_status`
--

DROP TABLE IF EXISTS `report_archive_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_archive_status` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `hour` int(11) NOT NULL,
  `started` int(11) NOT NULL,
  `completed` int(11) NOT NULL,
  `last_entry` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `request_archive_status`
--

DROP TABLE IF EXISTS `request_archive_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_archive_status` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `hour` int(11) NOT NULL,
  `started` int(11) NOT NULL,
  `completed` int(11) NOT NULL,
  `last_entry` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resellerApiSecurity`
--

DROP TABLE IF EXISTS `resellerApiSecurity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resellerApiSecurity` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reseller_credit_range`
--

DROP TABLE IF EXISTS `reseller_credit_range`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reseller_credit_range` (
  `range_pid` int(11) NOT NULL AUTO_INCREMENT,
  `reseller_id` int(11) NOT NULL,
  `range_min_sms` bigint(20) NOT NULL,
  `range_max_sms` bigint(20) NOT NULL,
  `range_credits` float NOT NULL,
  PRIMARY KEY (`range_pid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reseller_google_oauth_settings`
--

DROP TABLE IF EXISTS `reseller_google_oauth_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reseller_google_oauth_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reseller_id` int(11) NOT NULL COMMENT 'Reseller user ID',
  `google_client_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Google OAuth Client ID',
  `google_client_secret` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Google OAuth Client Secret',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Active, 0=Inactive',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reseller` (`reseller_id`),
  KEY `idx_reseller_active` (`reseller_id`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores reseller-specific Google OAuth credentials for login/signup on custom domains';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reseller_settings`
--

DROP TABLE IF EXISTS `reseller_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reseller_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `signup_email` tinyint(4) NOT NULL,
  `all_domain_login` tinyint(4) NOT NULL,
  `all_client_login` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reseller_webhook`
--

DROP TABLE IF EXISTS `reseller_webhook`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reseller_webhook` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reseller_id` int(11) DEFAULT NULL,
  `webhook_url` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reseller_id` (`reseller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `route4_optout_users`
--

DROP TABLE IF EXISTS `route4_optout_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route4_optout_users` (
  `optout_pid` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `optout_update_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`optout_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=16503 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `route_health_rules`
--

DROP TABLE IF EXISTS `route_health_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_health_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_pid` int(11) NOT NULL,
  `metric` varchar(50) NOT NULL,
  `comparison_operator` enum('less_than','greater_than') NOT NULL,
  `day_alert_threshold` decimal(5,2) DEFAULT NULL,
  `night_alert_threshold` decimal(5,2) DEFAULT NULL,
  `day_divert_threshold` decimal(5,2) DEFAULT NULL,
  `night_divert_threshold` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_route_metric` (`route_pid`,`metric`),
  KEY `idx_route_pid` (`route_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `route_senderid_setting`
--

DROP TABLE IF EXISTS `route_senderid_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_senderid_setting` (
  `route_pid` int(11) NOT NULL AUTO_INCREMENT,
  `min_length` int(11) NOT NULL,
  `max_length` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `category` varchar(30) NOT NULL,
  `senderid` varchar(100) NOT NULL,
  `Prefix` varchar(30) NOT NULL,
  PRIMARY KEY (`route_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=98608 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `route_usages`
--

DROP TABLE IF EXISTS `route_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_usages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_pid` varchar(25) NOT NULL,
  `route_pid` int(11) NOT NULL,
  `bal_deduct` double NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8271 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rule_permission_mapping`
--

DROP TABLE IF EXISTS `rule_permission_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_permission_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `rule_id` int(11) NOT NULL,
  `microservice_type` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rule_id` (`rule_id`,`microservice_type`)
) ENGINE=InnoDB AUTO_INCREMENT=15717 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `running_requests`
--

DROP TABLE IF EXISTS `running_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `running_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `request_id` varchar(30) NOT NULL,
  `date_time` timestamp NULL DEFAULT NULL,
  `request_time` varchar(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=915 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sch_partition`
--

DROP TABLE IF EXISTS `sch_partition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sch_partition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` text NOT NULL,
  `date` datetime NOT NULL,
  `reqId` varchar(30) NOT NULL,
  `host` text NOT NULL,
  `reqRoute` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sendMailDetail`
--

DROP TABLE IF EXISTS `sendMailDetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sendMailDetail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mail_group_id` varchar(100) NOT NULL,
  `status` int(11) NOT NULL,
  `to_email` varchar(100) NOT NULL,
  `from_email` varchar(100) NOT NULL,
  `from_name` varchar(250) NOT NULL,
  `subject` varchar(250) NOT NULL,
  `content` mediumtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=387 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sender_id_configuration`
--

DROP TABLE IF EXISTS `sender_id_configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sender_id_configuration` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `country_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `favicon` varchar(500) DEFAULT NULL,
  `brand_name` varchar(250) DEFAULT NULL,
  `company_name` varchar(250) DEFAULT NULL,
  `website_url` varchar(200) DEFAULT NULL,
  `status` tinyint(3) unsigned DEFAULT NULL,
  `route` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`sender_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2614 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sender_id_configuration_copy`
--

DROP TABLE IF EXISTS `sender_id_configuration_copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sender_id_configuration_copy` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `country_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `favicon` varchar(500) DEFAULT NULL,
  `brand_name` varchar(250) DEFAULT NULL,
  `company_name` varchar(250) DEFAULT NULL,
  `website_url` varchar(200) DEFAULT NULL,
  `status` tinyint(3) unsigned DEFAULT NULL,
  `route` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sender_id_country_wise`
--

DROP TABLE IF EXISTS `sender_id_country_wise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sender_id_country_wise` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sender_config_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `route` int(10) unsigned DEFAULT NULL,
  `sender_id` varchar(50) DEFAULT NULL,
  `country_code` int(10) unsigned DEFAULT NULL,
  `status` tinyint(3) unsigned DEFAULT NULL,
  `entity_id` varchar(255) DEFAULT NULL,
  `lower_sender_id` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `sender_id` (`sender_id`),
  KEY `country_code` (`country_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10558 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sender_id_executive_summary`
--

DROP TABLE IF EXISTS `sender_id_executive_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sender_id_executive_summary` (
  `_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `date` date NOT NULL,
  `senderID` varchar(20) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `total` bigint(20) NOT NULL,
  `delivered` bigint(20) NOT NULL,
  `delivered_credit` bigint(20) NOT NULL,
  `failed` bigint(20) NOT NULL,
  `failed_credit` bigint(20) NOT NULL,
  `ndnc` bigint(20) NOT NULL,
  `blocked` bigint(20) NOT NULL,
  `rejected` bigint(20) NOT NULL,
  `rejected_credit` bigint(20) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25270889 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sender_id_mapping`
--

DROP TABLE IF EXISTS `sender_id_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sender_id_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(10) DEFAULT NULL,
  `sender_id_num` varchar(20) DEFAULT NULL,
  `sender_id_alpha` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=250 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `senderid_kyc_request`
--

DROP TABLE IF EXISTS `senderid_kyc_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `senderid_kyc_request` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `senderid` varchar(100) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `authid` varchar(30) NOT NULL,
  `request_time` timestamp NULL DEFAULT NULL,
  `doc_location` varchar(255) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sendotp_data`
--

DROP TABLE IF EXISTS `sendotp_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sendotp_data` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `feature` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `count` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `service_termination`
--

DROP TABLE IF EXISTS `service_termination`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_termination` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `reseller_id` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `reason` varchar(200) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=427 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shopify_webhook_logs`
--

DROP TABLE IF EXISTS `shopify_webhook_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopify_webhook_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Shopify transaction ID',
  `order_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Shopify order ID',
  `company_id` bigint(20) NOT NULL DEFAULT '0' COMMENT 'MSG91 company/user ID',
  `amount_usd` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT 'Webhook USD amount (after Shopify 30% deduction)',
  `request_data` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Full webhook payload (JSON)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `short_id_prefix`
--

DROP TABLE IF EXISTS `short_id_prefix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `short_id_prefix` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prefix` varchar(10) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `date` date DEFAULT NULL,
  `current_table` tinyint(1) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `signup_info`
--

DROP TABLE IF EXISTS `signup_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `signup_info` (
  `route` int(11) NOT NULL,
  `sender` varchar(10) NOT NULL,
  `expiryDayCount` int(11) NOT NULL,
  `entity_id` varchar(55) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `signup_tracking`
--

DROP TABLE IF EXISTS `signup_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `signup_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `ip` varchar(24) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `step` decimal(2,1) DEFAULT NULL,
  `requestData` text,
  `responseData` text,
  `last_updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3074 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smpp_error_codes`
--

DROP TABLE IF EXISTS `smpp_error_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smpp_error_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `smpp_id` varchar(25) NOT NULL,
  `error_code` varchar(20) NOT NULL,
  `smpp_error_code` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `error_code` (`error_code`,`smpp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6061 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smpp_error_discription`
--

DROP TABLE IF EXISTS `smpp_error_discription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smpp_error_discription` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `error_code` varchar(20) NOT NULL,
  `discription` varchar(255) NOT NULL,
  `route` varchar(25) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3899 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smpp_group_error_codes`
--

DROP TABLE IF EXISTS `smpp_group_error_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smpp_group_error_codes` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `error_code` varchar(20) NOT NULL,
  `smpp_error_codes` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE` (`group_id`,`error_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1713 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smpp_group_mapping`
--

DROP TABLE IF EXISTS `smpp_group_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smpp_group_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `smpp_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE` (`smpp_id`),
  KEY `group_idx` (`group_id`),
  CONSTRAINT `group` FOREIGN KEY (`group_id`) REFERENCES `smpp_groups` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `smpp` FOREIGN KEY (`smpp_id`) REFERENCES `ms_route` (`route_pid`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=507 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smpp_groups`
--

DROP TABLE IF EXISTS `smpp_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smpp_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smpp_queue_alert`
--

DROP TABLE IF EXISTS `smpp_queue_alert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smpp_queue_alert` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `route_pid` int(11) NOT NULL,
  `count` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smpp_sms_status`
--

DROP TABLE IF EXISTS `smpp_sms_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smpp_sms_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `send_mobno` bigint(20) NOT NULL,
  `send_status` tinyint(4) NOT NULL,
  `send_description` varchar(255) NOT NULL,
  `send_deltime` varchar(20) NOT NULL,
  `sms_id` varchar(45) NOT NULL,
  `send_type` int(11) NOT NULL,
  `send_sequenceid` int(11) DEFAULT NULL,
  `msg` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms_details`
--

DROP TABLE IF EXISTS `sms_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_details` (
  `sms_pid` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL,
  `route` int(11) NOT NULL,
  `senderId` varchar(250) NOT NULL,
  `sms` text NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `dlt_template_id` varchar(45) NOT NULL,
  PRIMARY KEY (`sms_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=242 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smscCount`
--

DROP TABLE IF EXISTS `smscCount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smscCount` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smsc_status`
--

DROP TABLE IF EXISTS `smsc_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smsc_status` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `kannel` int(11) NOT NULL,
  `smsc_name` varchar(20) NOT NULL,
  `status` int(11) NOT NULL,
  `queue` bigint(20) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spreadsheet_logins`
--

DROP TABLE IF EXISTS `spreadsheet_logins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spreadsheet_logins` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `startupsCheck`
--

DROP TABLE IF EXISTS `startupsCheck`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `startupsCheck` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(100) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `create_date` timestamp NULL DEFAULT NULL,
  `status` int(11) NOT NULL,
  `email_check` int(11) NOT NULL,
  `date_default` timestamp NULL DEFAULT NULL,
  `purpose` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `states`
--

DROP TABLE IF EXISTS `states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `states` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `state_name` varchar(30) NOT NULL,
  `state_code` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stpl_approvals`
--

DROP TABLE IF EXISTS `stpl_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stpl_approvals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `type` int(11) NOT NULL COMMENT '1=templateId, 2=peId, 3=headerId',
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int(11) DEFAULT '1' COMMENT '1=pending, 2=approved, 3=rejected',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_type_value` (`company_id`,`type`,`value`),
  KEY `idx_company_status` (`company_id`,`status`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stpl_clients`
--

DROP TABLE IF EXISTS `stpl_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stpl_clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token` text COLLATE utf8mb4_unicode_ci,
  `refresh_token` text COLLATE utf8mb4_unicode_ci,
  `access_token_expiry` datetime DEFAULT NULL,
  `refresh_token_expiry` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_company` (`company_id`),
  KEY `idx_company_id` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stpl_headers`
--

DROP TABLE IF EXISTS `stpl_headers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stpl_headers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int(10) unsigned NOT NULL,
  `cli` varchar(50) NOT NULL,
  `peid` varchar(30) NOT NULL,
  `reference_no` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_cli` (`company_id`,`cli`),
  KEY `idx_company_peid` (`company_id`,`peid`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stpl_templates`
--

DROP TABLE IF EXISTS `stpl_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stpl_templates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int(10) unsigned NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `urn` varchar(30) NOT NULL,
  `peid` varchar(30) NOT NULL,
  `reference_no` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_urn` (`company_id`,`urn`),
  KEY `idx_company_peid` (`company_id`,`peid`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stripeTokens`
--

DROP TABLE IF EXISTS `stripeTokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripeTokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token_id` varchar(150) NOT NULL,
  `mandate_id` varchar(150) NOT NULL,
  `token_name` varchar(255) NOT NULL,
  `company_id` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL COMMENT 'Status (e.g., active/inactive)',
  `link` varchar(255) NOT NULL,
  `last_updated_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id` (`token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stripeWebhookLogs`
--

DROP TABLE IF EXISTS `stripeWebhookLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripeWebhookLogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `webhookRequest` longtext,
  `logTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21240 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stripe_auto_recharge_subscriptions`
--

DROP TABLE IF EXISTS `stripe_auto_recharge_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripe_auto_recharge_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `token_id` varchar(150) NOT NULL,
  `mandate_id` varchar(150) NOT NULL,
  `threshold_amount` double(20,5) NOT NULL,
  `recharge_amount` double(20,5) NOT NULL,
  `tax` double(20,5) DEFAULT '0.00000',
  `net_amount` double(20,5) NOT NULL,
  `route` int(11) NOT NULL DEFAULT '0',
  `status` int(11) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id_route_UNIQUE` (`company_id`,`route`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stripe_customer`
--

DROP TABLE IF EXISTS `stripe_customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripe_customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `customer_id` varchar(30) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_UNIQUE` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscription mails`
--

DROP TABLE IF EXISTS `subscription mails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription mails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_updates`
--

DROP TABLE IF EXISTS `system_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_updates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(50) NOT NULL,
  `description` varchar(200) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `is_enabled` tinyint(1) NOT NULL,
  `client_type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tapfiliate_users`
--

DROP TABLE IF EXISTS `tapfiliate_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tapfiliate_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `coupon` varchar(50) NOT NULL,
  `external_id` int(11) NOT NULL,
  `commission_id` int(11) NOT NULL,
  `count` int(11) NOT NULL,
  `referral_link` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp`
--

DROP TABLE IF EXISTS `temp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `senderid` varchar(255) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29606 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_users`
--

DROP TABLE IF EXISTS `temp_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temp_users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `status` tinyint(4) NOT NULL,
  `chain` mediumtext NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template`
--

DROP TABLE IF EXISTS `template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(100) NOT NULL,
  `template_structure` text NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`template_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_mapping`
--

DROP TABLE IF EXISTS `template_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL DEFAULT '',
  `template_id` varchar(55) NOT NULL DEFAULT '',
  `dlt_template_id` varchar(55) NOT NULL DEFAULT '',
  `map_variables` text,
  `type` varchar(30) NOT NULL DEFAULT 'trans',
  `status` tinyint(2) NOT NULL DEFAULT '1',
  `archive` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1971 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_status_webhooks`
--

DROP TABLE IF EXISTS `template_status_webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_status_webhooks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `webhook_url` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `company_id_UNIQUE` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_versions`
--

DROP TABLE IF EXISTS `template_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` varchar(255) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `template_data` text NOT NULL,
  `DLT_ID` varchar(45) DEFAULT NULL,
  `sender_id` varchar(45) NOT NULL,
  `version` varchar(45) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `user_id` int(11) NOT NULL,
  `active_status` int(11) NOT NULL DEFAULT '0',
  `dlt_verified` int(11) NOT NULL DEFAULT '0',
  `dlt_reason` varchar(255) DEFAULT NULL,
  `reject_reason` varchar(255) DEFAULT NULL,
  `archive` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20167 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_versions_logs`
--

DROP TABLE IF EXISTS `template_versions_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_versions_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `temp_version_id` int(11) NOT NULL,
  `temp_id` varchar(255) NOT NULL,
  `version` varchar(45) NOT NULL,
  `temp_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(45) NOT NULL,
  `action_by` varchar(255) NOT NULL,
  `date_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4440 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_betatest.ms_user_pricing`
--

DROP TABLE IF EXISTS `test_betatest.ms_user_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_betatest.ms_user_pricing` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `route` varchar(10) NOT NULL,
  `pricing` decimal(4,3) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testdheeraj`
--

DROP TABLE IF EXISTS `testdheeraj`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testdheeraj` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testtable`
--

DROP TABLE IF EXISTS `testtable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testtable` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tuid` int(11) NOT NULL,
  `fuid` int(11) NOT NULL,
  `amt` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `token_authorization`
--

DROP TABLE IF EXISTS `token_authorization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_authorization` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(55) NOT NULL DEFAULT '',
  `token_name` varchar(55) NOT NULL,
  `company_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `rate_limit` int(11) NOT NULL DEFAULT '3',
  `rate_limit_time` int(11) NOT NULL DEFAULT '300',
  `rate_limit_block_time` int(11) NOT NULL DEFAULT '86400',
  `last_updated_by` int(11) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id_UNIQUE` (`token`),
  UNIQUE KEY `token_name_company_UNIQUE` (`token_name`,`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=565 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `token_ip_mapping`
--

DROP TABLE IF EXISTS `token_ip_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_ip_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(55) NOT NULL,
  `token_ref_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `blocked_at` double DEFAULT NULL,
  `identifier` varchar(255) DEFAULT NULL,
  `ip_info` varchar(100) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_ip_UNIQUE` (`ip`,`token_ref_id`),
  KEY `token_identifier` (`token_ref_id`,`identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=2974 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `total_chain_balance`
--

DROP TABLE IF EXISTS `total_chain_balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `total_chain_balance` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) NOT NULL,
  `date` date NOT NULL,
  `service` varchar(25) NOT NULL,
  `client_balance` bigint(20) NOT NULL,
  `active_chain_balance` bigint(20) NOT NULL,
  `inactive_chain_balance` bigint(20) NOT NULL,
  `total` bigint(20) NOT NULL,
  `after_ratio` bigint(20) NOT NULL,
  `balance_amount` bigint(20) NOT NULL,
  `our_cost` decimal(11,3) NOT NULL,
  `type` int(11) NOT NULL,
  `ratio` int(11) NOT NULL,
  `route` int(11) NOT NULL,
  `price` decimal(5,4) NOT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26149 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `true_users`
--

DROP TABLE IF EXISTS `true_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `true_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `adminId` int(11) NOT NULL,
  `trueClient` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique user` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `two_way_sender_id`
--

DROP TABLE IF EXISTS `two_way_sender_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `two_way_sender_id` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numbers` bigint(20) unsigned NOT NULL,
  `company_ids` varchar(255) NOT NULL,
  `route` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `numbers` (`numbers`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ui_feature_version_config`
--

DROP TABLE IF EXISTS `ui_feature_version_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ui_feature_version_config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `feature_name` varchar(100) NOT NULL COMMENT 'Identifier for the UI feature/page option, e.g. phonebook, send_sms',
  `version` varchar(5) NOT NULL COMMENT 'App or panel version string, e.g. v1, v2, 1.0.0',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = show, 1 = hide',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feature_version` (`feature_name`,`version`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COMMENT='Version-based UI feature visibility config for Angular migration';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unsubscribed_emails`
--

DROP TABLE IF EXISTS `unsubscribed_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unsubscribed_emails` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(40) NOT NULL,
  `reason` varchar(400) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `update_kannel`
--

DROP TABLE IF EXISTS `update_kannel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `update_kannel` (
  `kannel_id` int(11) NOT NULL AUTO_INCREMENT,
  `status` int(11) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`kannel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `upid`
--

DROP TABLE IF EXISTS `upid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `upid` (
  `upid` varchar(32) NOT NULL,
  PRIMARY KEY (`upid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `urlinfo`
--

DROP TABLE IF EXISTS `urlinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `urlinfo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `browser_id` varchar(50) NOT NULL,
  `urls` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `urls`
--

DROP TABLE IF EXISTS `urls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `urls` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `identifier` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `short_id` varchar(10) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `url_type` enum('BASIC','APP','ATTACHMENT') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'BASIC',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `urls_user_id_name_unique` (`user_id`,`name`),
  UNIQUE KEY `urls_identifier_unique` (`identifier`),
  KEY `urls_short_id_index` (`short_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18224 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userTrackTemp`
--

DROP TABLE IF EXISTS `userTrackTemp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userTrackTemp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `panelId` int(11) NOT NULL,
  `time` datetime NOT NULL,
  `type` varchar(20) NOT NULL,
  `ip` varchar(20) NOT NULL,
  `forwardIP` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5062 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userTrackTemp_19`
--

DROP TABLE IF EXISTS `userTrackTemp_19`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userTrackTemp_19` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `panelId` int(11) NOT NULL,
  `time` datetime NOT NULL,
  `type` varchar(20) NOT NULL,
  `ip` varchar(20) NOT NULL,
  `forwardIP` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1471 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_billing_type`
--

DROP TABLE IF EXISTS `user_billing_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_billing_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `billing_type` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_comment`
--

DROP TABLE IF EXISTS `user_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_comment` (
  `comm_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` longblob NOT NULL,
  `comment_date` datetime NOT NULL,
  PRIMARY KEY (`comm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=892 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_country_block`
--

DROP TABLE IF EXISTS `user_country_block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_country_block` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int(11) unsigned NOT NULL,
  `country_code` varchar(50) NOT NULL DEFAULT '',
  `block` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `price` varchar(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id` (`company_id`,`country_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10677 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_detail_permissions`
--

DROP TABLE IF EXISTS `user_detail_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_detail_permissions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `rule_link_id` int(11) unsigned DEFAULT NULL,
  `permission_type` int(11) DEFAULT NULL,
  `permission_status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rule_link_id` (`rule_link_id`,`permission_type`),
  KEY `foriegnKey_idx` (`rule_link_id`),
  CONSTRAINT `foriegnKey` FOREIGN KEY (`rule_link_id`) REFERENCES `rule_permission_mapping` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=74501 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_details`
--

DROP TABLE IF EXISTS `user_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` varchar(255) NOT NULL,
  `urls` text NOT NULL,
  `ipaddress` varchar(255) NOT NULL,
  `userinfo` varchar(255) NOT NULL,
  `browserinfo` text NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_dlr_report`
--

DROP TABLE IF EXISTS `user_dlr_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_dlr_report` (
  `requestId` varchar(50) NOT NULL,
  `lastExportedTime` timestamp NULL DEFAULT NULL,
  `awsUrl` varchar(350) NOT NULL,
  PRIMARY KEY (`requestId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_first_login`
--

DROP TABLE IF EXISTS `user_first_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_first_login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(10) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniqueuserId` (`userId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11971 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_handled_by`
--

DROP TABLE IF EXISTS `user_handled_by`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_handled_by` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `deal_breaker` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14112 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_microservices_token`
--

DROP TABLE IF EXISTS `user_microservices_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_microservices_token` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int(11) DEFAULT NULL,
  `service_type` varchar(55) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `token` varchar(55) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_index` (`company_id`,`service_type`)
) ENGINE=InnoDB AUTO_INCREMENT=159349 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_num_language_preference`
--

DROP TABLE IF EXISTS `user_num_language_preference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_num_language_preference` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile_number` varchar(20) NOT NULL,
  `language_preference` varchar(50) NOT NULL,
  `date_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_otp_raw_template`
--

DROP TABLE IF EXISTS `user_otp_raw_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_otp_raw_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender_id` varchar(20) CHARACTER SET latin1 DEFAULT NULL,
  `template` text,
  `company_name` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `country_code` int(11) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `content_type` tinyint(1) DEFAULT NULL,
  `user_data` varchar(500) CHARACTER SET latin1 DEFAULT NULL,
  `is_read` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=80728 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_price_block`
--

DROP TABLE IF EXISTS `user_price_block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_price_block` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int(11) unsigned NOT NULL,
  `price` varchar(10) NOT NULL DEFAULT '',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_rating`
--

DROP TABLE IF EXISTS `user_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_rating` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_rule_mapping`
--

DROP TABLE IF EXISTS `user_rule_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_rule_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `rule_id` int(11) DEFAULT NULL,
  `ip_setting` tinyint(1) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15571 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_rules`
--

DROP TABLE IF EXISTS `user_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_rules` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(255) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=475 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_senderid`
--

DROP TABLE IF EXISTS `user_senderid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_senderid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `senderid` varchar(50) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=325 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_threshold`
--

DROP TABLE IF EXISTS `user_threshold`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_threshold` (
  `user_pid` int(11) NOT NULL AUTO_INCREMENT,
  `threshold_bal` double NOT NULL,
  `send_alert` int(11) NOT NULL,
  PRIMARY KEY (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=55637 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `verify_dlt`
--

DROP TABLE IF EXISTS `verify_dlt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verify_dlt` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` varchar(45) NOT NULL,
  `user_id` varchar(45) NOT NULL,
  `template_id` varchar(45) NOT NULL,
  `version_id` varchar(45) DEFAULT NULL,
  `date_time` datetime NOT NULL,
  `type` varchar(45) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2961 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `virtualbalLog`
--

DROP TABLE IF EXISTS `virtualbalLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `virtualbalLog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `oldbal` varchar(10) NOT NULL,
  `newbal` varchar(20) NOT NULL,
  `type` varchar(20) NOT NULL,
  `panelid` int(11) NOT NULL,
  `routeid` int(11) NOT NULL,
  `adminid` int(11) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voice_feature`
--

DROP TABLE IF EXISTS `voice_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voice_feature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `voice_status` int(11) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voice_record_status`
--

DROP TABLE IF EXISTS `voice_record_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voice_record_status` (
  `record_id` int(11) NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(100) NOT NULL,
  `call_no` varchar(20) NOT NULL,
  `filename` varchar(100) NOT NULL,
  `filelength` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL,
  `date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`record_id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voice_routerefund`
--

DROP TABLE IF EXISTS `voice_routerefund`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voice_routerefund` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uniqueid` bigint(20) NOT NULL,
  `dummyroute` int(11) NOT NULL,
  `refund` varchar(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=819 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voice_server_text_msg`
--

DROP TABLE IF EXISTS `voice_server_text_msg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voice_server_text_msg` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `time` time NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voice_spam`
--

DROP TABLE IF EXISTS `voice_spam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voice_spam` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uniqueId` varchar(100) NOT NULL,
  `telNum` varchar(20) NOT NULL,
  `annName` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `status` varchar(100) NOT NULL,
  `priority` int(11) NOT NULL,
  `maxRetry` varchar(10) NOT NULL,
  `retryTime` varchar(10) NOT NULL,
  `retryCount` int(11) NOT NULL,
  `callerId` varchar(20) NOT NULL,
  `maxDuration` int(11) NOT NULL,
  `scheduleTime` datetime NOT NULL,
  `spam_status` int(11) NOT NULL,
  `scheduleTimeEnd` datetime NOT NULL,
  `account` varchar(50) NOT NULL,
  `dnd` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voicespam_log`
--

DROP TABLE IF EXISTS `voicespam_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voicespam_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `admin` int(11) NOT NULL,
  `refund` int(11) NOT NULL,
  `uniqueid` varchar(100) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voicespamlog`
--

DROP TABLE IF EXISTS `voicespamlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voicespamlog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `admin` int(11) NOT NULL,
  `action` varchar(20) NOT NULL,
  `uniqueid` varchar(100) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `white_list_CIDRS`
--

DROP TABLE IF EXISTS `white_list_CIDRS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `white_list_CIDRS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cidr` varchar(43) NOT NULL,
  `start_ip` varchar(255) NOT NULL,
  `end_ip` varchar(255) NOT NULL,
  `user_pid` int(11) NOT NULL,
  `authkey` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_pid` (`user_pid`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `white_list_ip_user_wise`
--

DROP TABLE IF EXISTS `white_list_ip_user_wise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `white_list_ip_user_wise` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_pid` int(11) DEFAULT NULL,
  `company_pid` int(11) DEFAULT NULL,
  `ip` varchar(55) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1376 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `xmlapi_request`
--

DROP TABLE IF EXISTS `xmlapi_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `xmlapi_request` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `api_id` bigint(20) NOT NULL,
  `request_id` varchar(30) NOT NULL,
  `sent_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-03 16:43:16
