-- Tables Pulse queries that Dump20260903.sql does not carry.
--
-- Column definitions are the real ones, read from the production
-- `information_schema` before that host became unreachable — not invented. Only
-- these two are recreated, because only these two are actually queried by the
-- code (lib/pulse/*.ts).
--
-- Six tables in the agent allowlist are also absent from the dump:
--   admin_group_login_as, cashfreeWebhookLogs, cities_master,
--   countries_master, country_code_master_list, states_master
-- Their real columns were never captured, and inventing columns would be worse
-- than leaving them out — the agent would learn a shape that does not exist in
-- production. `schema.ts` omits absent tables from the index, so locally the
-- agent sees 106 tables and in production 112.

-- Sales view of a client: account manager, industry, follow-up, per-route
-- consumption averages. Read by lib/pulse/accounts.ts for display names and
-- industry.
DROP TABLE IF EXISTS `clientManagement`;
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
  `AvgConR1` varchar(50) NOT NULL,
  `AvgConR4` varchar(50) NOT NULL,
  `AvgConOTP` varchar(50) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Signup funnel tracking, including the step a signup reached. Read by
-- lib/pulse/audit.ts for the Filtered tab.
DROP TABLE IF EXISTS `signup_tracking`;
CREATE TABLE `signup_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `ip` varchar(24) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `step` decimal(2,1) DEFAULT NULL,
  `requestData` text,
  `responseData` text,
  `last_updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
