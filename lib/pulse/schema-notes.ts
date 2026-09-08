/**
 * The tables the AI agent is allowed to see, with MSG91's own descriptions.
 *
 * This is an allowlist, not a hint list. The database has 509 tables; the
 * agent is told about these 112 and nothing else. Two reasons:
 *
 *   · Scope — the rest are backups, dumps, dead experiments and internal
 *     plumbing. Naming them invites the agent to build an answer on a table
 *     nobody trusts.
 *   · Accuracy — a smaller, described schema produces better SQL than a large
 *     undescribed one. The descriptions are the important half: nothing in
 *     `information_schema` says that `user_handled_by` is where account
 *     ownership lives, and without that the agent guesses.
 *
 * Descriptions are MSG91's own wording, kept verbatim including their typos, so
 * this file can be diffed against the source spreadsheet.
 *
 * To let the agent use another table, add it here. Nothing else needs changing:
 * `schema.ts` derives both the index and the column detail from this map, and
 * refuses to fetch columns for anything absent from it.
 */
export const ALLOWED_TABLES: Record<string, string> = {
  // ── the company, its people, its ownership ──────────────────────────────
  ms_user: "This table store the complete information of a company",
  ms_user_login: "use to store user details",
  ms_user_deleted: "Store deleted company details",
  ms_mapping: "for user company mapping",
  ms_mapping_deleted: "for deleted mapping with company for user",
  parent_chain: "Table stores information about the full chain of a user",
  user_handled_by: "stores account manager and deal breaker of a company",
  ms_reseller_shifted: "Details of all the companies that are shifted from one reseller to another.",
  ms_invite_member: "contains data of inviation in a compnay wallet",
  user_comment: "Table containing information about the comments added by a admin for a company",
  ms_impno: "used or company related important number",
  ms_demo_user: "Store user authentic status",

  // ── admins and access ───────────────────────────────────────────────────
  admin_user: "Account Ids of the admins",
  admin_privilages: "admin to acess_list mapping to give access to the admin on what so ever features",
  access_list: "Lists all the access/feature names that will be assigned to the admins",
  admin_disable_user: "(old) list of the users who have been disabled by their admins",
  admin_group_login_as:
    "group login acess to support executives if the permission given by the client to login into their account",
  login_as_permission_requests: "Login request by admin to login into the users account",
  admin_updation_log: "Stores logs of the activities done by the admins",
  ms_user_updation_logs: "Stores logs of the activities done by the users",

  // ── money ───────────────────────────────────────────────────────────────
  ms_trans: "This table stores information about the transaction logs",
  ms_Onlinetransaction: "contains payment related data store in this step tracking",
  microservice_payment_log: "captures logs of the success attempts to deduct balance by microservices",
  micro_sub_payment_failed_logs: "captures logs of the failed attempts to deduct balance by microservices",
  payment_tbl: "Details of payment methods for resellers and their clients",
  payment_integrations: "Details of payment methods for wallet users",
  payment_webhook_log: "Details of the payment webhooks that we receive from razorpay etc",
  cashfreeWebhookLogs: "stores cashfree webhoook logs",
  mandate_payments: "Payments details done using mandate (Cashfree Subscription)",
  auto_recharge_subscriptions: "Payment automation : cash free Auto payment subscription details",
  ms_text_bal: "List of balance in each route of users",
  ms_wallet_slab: "Wallet slab for pricing and dialplan assigning",
  pricing_slab: "store website pricing details",
  ms_user_pricing: "used in pricing",
  user_price_block: "Stores price block limits of a company, above this price sms will not deliver",
  ms_user_paid_signup:
    "contains user's paid signup setting | used to add extra bal while first purchase",
  ms_gidhh_details: "used. in giddh entery.",

  // ── sending, routes, providers, delivery ────────────────────────────────
  ms_route: "Details of all the routes used for sms delivery like name, route type, route name, route balance etc",
  panel_routes: "Route details like balance,  smsc, dlr_url of all the panels",
  ms_text_user_route: "List of the routes and dummy route assigned to users to send sms",
  ms_providers:
    "Provides details related to all the providers of sms (countries and dialplan ids along with pricing)",
  ms_dialplanPrefix: "Prefix of provider in DP",
  ms_send_feature: "old | used for send sms, voice, longcode feature",
  ms_push_dlr: "Gives detail of user-wise push dlr (delivery report webhook url)",
  ms_error_codes: "error code info provided by operator",
  smpp_error_codes: "Table stores the information about the different error codes provided by the operator",
  smpp_error_discription: "Table stores the description of different error codes provided by the operator",

  // ── sender ids and templates ────────────────────────────────────────────
  ms_sender: "used as sender id collection",
  approved_senderid: "list of all the approves sender ids",
  sender_id_configuration: "Store complete information about the senderID",
  sender_id_country_wise: "contains sender id county wise data",
  ms_auto_rejected_sender_id: "store auto rejeceted sender ID",
  ms_soft_block_sender_id: "contains rejected sender id",
  approved_otp_template: "Stores OTP templates",
  approved_r4_template: "Stores SMS templates",
  ms_route4_templates: "approved tempaltes",
  ms_r4rejected_templates:
    "List of all the templates that are blocked by admins for users due to spam content or other reason",
  ms_r4_keywords: "Fetches the list of all the keywords that are approved while creating sms templates",
  ms_r4_sender: "Fetches the list of all the Sender ids that are approved while creating sms templates",
  ms_r4_setting:
    "Give details user-wise that certain checks should be perfomed while sending sms. Checks include - sender id, template, keywords, optout.",
  template_mapping: "Table stores the mapping of user and template with variables",
  template_versions: "Table containing information about the different versions of a template",
  template_versions_logs: "Table containing information about the logs of  template version",
  verify_dlt: "This table store DLT verification status of a template while creating template",

  // ── blocking and spam ───────────────────────────────────────────────────
  ms_blockno: "contains blocked no user wise",
  ms_user_blockno: "user blocked numbers",
  ms_bsend: "Block keywords and sender id",
  ms_btxt: "Block keywords",
  ms_hard_block_keywords: "hard block keyword storgae for block sms",
  ms_spam_keywords: "used in hard block keywords",
  user_country_block: "Table containing information about the blocked countries of a comapny",

  // ── signup, identity, verification ──────────────────────────────────────
  ms_signup_history: "usefull in ip store while signup",
  ms_signup_log: "used in invalid attempts while signup",
  ms_user_identity_verification: "contains users identity  verification status and other info",
  ms_user_identity_info: "used in identity verification",
  identity_documents: "Aws url of the Documents uploaded by the client for Identity verification",
  ms_magic_link: "for store email otp",

  // ── auth, tokens, security ──────────────────────────────────────────────
  ms_user_authentication: "store autthentication key",
  ms_auth_key_usecase: "used to store autkey use case.",
  token_authorization: "Stores all the user authorization tokens, its rate limit and status",
  token_ip_mapping: "mapping of the tokens and Ip from the token request has been generated.",
  WhiteListIp: "Table is used for storing the whitlisted IP of user, if IP security is ON",
  white_list_ip_user_wise: "Whitelisted IPs for the users to login into his account",
  IpLogsSecrty: "used to store non whitelisted ips from which we got api hit",
  loginLogNew: "contains login logs of user",
  ms_history: "stores login history, ip and session id.",

  // ── features, rules, permissions ────────────────────────────────────────
  ms_user_feature_setting: "This table used to store many features setting of a company like auto-routing",
  email_feature: "stores if the email feature is enabled in old credit accounts",
  panel_feature: "panel realted features",
  user_rules: "Stores rules created by a user",
  user_rule_mapping: "contains mapping of user to its company and assigned rule in company",
  user_detail_permissions: "stores mapping of user with rules and permissions",
  rule_permission_mapping: "contains Mapping of rules with the permission",
  permission_names: "Rule permission name",
  permission_status_names: "contains Rule permission status name assigned while create role",

  // ── products: longcode, OTP widget, mail ────────────────────────────────
  ms_longcode: "used in longcode service",
  ms_longcode_deleted: "used in longcode service",
  ms_longcode_keyword: "used in longcode service",
  otp_widget: "contains otp widget mapping with company and its info",
  otp_widget_process: "Mappping of widget with the process of sending the otp",
  mail_details: "mail details sent to clients from advance search on admin panel",

  // ── panels and domains ──────────────────────────────────────────────────
  panel_db: "contains all panel db config details",
  pannel_details: "used to store details of other admin panels",
  ms_domain: "Store all parked domains",

  // ── geography and reference data ────────────────────────────────────────
  country: "Stores all the country details like country name, code, capital, currency",
  countries_master: "Stores all the country details",
  country_code_master_list: "Stores all the country name with its code",
  country_code_number_length:
    "stores mobile number details as per the country. like number length, number prefixes",
  default_destination_country: "mapping of clients with thier currency, billing country",
  states: "table containing information about the states",
  states_master: "contains states country wise",
  cities_master: "Stores all the cities details mapped to their states code",
};

/**
 * The tables most questions touch. Always sent with full column detail.
 *
 * Every entry must appear in ALLOWED_TABLES above — `tests/allowlist.test.mjs`
 * enforces that, because describing a table the agent may not query would be a
 * silent contradiction.
 *
 * Pulse's own hand-written scanners also read clientManagement,
 * ms_user_balance and signup_tracking. Those are deliberately absent from the
 * allowlist: they are code-only and invisible to the agent.
 */
export const CORE_TABLES = [
  "ms_user",
  "user_handled_by",
  "ms_trans",
  "default_destination_country",
  "ms_text_bal",
  "ms_mapping",
  "parent_chain",
  "admin_updation_log",
  "ms_user_updation_logs",
  "user_comment",
  "ms_signup_history",
  "ms_user_paid_signup",
];

/** Fast membership test used by `schema.ts`. */
export const ALLOWED_TABLE_NAMES: ReadonlySet<string> = new Set(Object.keys(ALLOWED_TABLES));

/**
 * Back-compat alias. `TABLE_NOTES` was the old name when this file was a
 * description lookup over all 509 tables rather than an allowlist.
 */
export const TABLE_NOTES = ALLOWED_TABLES;
