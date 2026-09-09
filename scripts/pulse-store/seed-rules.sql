-- The four motions' rules, as rows.
--
-- These were a hardcoded array in the prototype and, for Inbound, a set of
-- thresholds compiled into the runner. Both are now the same rows, so what a
-- person reads on the Rules tab and what Autopilot actually does cannot drift
-- apart.
--
-- `live: true` means the runner evaluates it today. The rules marked false are
-- written down, visible, and honest about not being wired up yet — a rule that
-- looks live and is not is worse than no rule at all.
USE pulse_store;

INSERT IGNORE INTO pulse_policy (version, policy_key, kind, body, note, state, source) VALUES

-- ── Inbound. These four run. ────────────────────────────────────────────────
('v1','rule.inbound.score_every_signup','rule',
 '{"motion":"inbound","english":"Score every signup within 5 minutes on domain history, signup progress and entity.",
   "when":"signup_seen","if":[],"then":{"act":"act","do":"score"},"stop_if":[],"live":true}',
 'The runner polls every five minutes from a watermark.','active','seed'),

('v1','rule.inbound.quality_80','rule',
 '{"motion":"inbound","english":"Quality 80+ → a person calls within 10 minutes. The clock is on the card.",
   "when":"signup_scored","if":[["score",">=",80]],
   "then":{"act":"card","do":"raise_card","reason":"your_hands","sla_minutes":10},"stop_if":[],"live":true}',
 'Threshold lives in triage.threshold.human_now.','active','seed'),

('v1','rule.inbound.quality_40_79','rule',
 '{"motion":"inbound","english":"Quality 40-79 → a three-message sequence over 8 days. No person unless they reply.",
   "when":"signup_scored","if":[["score",">=",40],["score","<",80]],
   "then":{"act":"act","do":"nurture","sequence":"onboarding_3"},"stop_if":[],"live":true}',
 'Steps two and three are timers; gaps live in nurture.gap.*','active','seed'),

('v1','rule.inbound.below_40','rule',
 '{"motion":"inbound","english":"Below 40 → suppress, with the reasons, reviewable under Suppressed. Never deleted.",
   "when":"signup_scored","if":[["score","<",40]],
   "then":{"act":"act","do":"suppress"},
   "stop_if":[["confidence","<",0.6]],"live":true}',
 'The stop rule is the confidence floor: a weak suppression becomes a nurture.','active','seed'),

-- ── Outbound. Written down, not wired up. ───────────────────────────────────
('v1','rule.outbound.research_first','rule',
 '{"motion":"outbound","english":"Research fit against ICP before any contact. No contact without a named reason.",
   "when":"prospect_added","if":[],"then":{"act":"act","do":"score"},"stop_if":[],"live":false}',
 'Needs the enrichment step.','active','seed'),
('v1','rule.outbound.two_touches','rule',
 '{"motion":"outbound","english":"At most two touches in 14 days.",
   "when":"before_send","if":[["touches_14d",">=",2]],"then":{"act":"act","do":"wait","days":14},"stop_if":[],"live":false}',
 'Needs a mailbox to count touches.','active','seed'),
('v1','rule.outbound.decision_maker_reply','rule',
 '{"motion":"outbound","english":"Any reply from a named decision maker → same-day human contact.",
   "when":"reply_received","if":[["from_decision_maker","==","true"]],
   "then":{"act":"card","do":"raise_card","reason":"your_voice","sla_minutes":480},"stop_if":[],"live":false}',
 'Needs Gmail.','active','seed'),
('v1','rule.outbound.cool_off','rule',
 '{"motion":"outbound","english":"No reply after two touches → cool off 90 days, then score again.",
   "when":"sequence_ended","if":[["replies","==",0]],"then":{"act":"act","do":"wait","days":90},"stop_if":[],"live":false}',
 'Needs a mailbox.','active','seed'),

-- ── Startup. ────────────────────────────────────────────────────────────────
('v1','rule.startup.confirm_eligibility','rule',
 '{"motion":"startup","english":"Confirm programme eligibility from the signup form.",
   "when":"signup_seen","if":[["motion","==","startup"]],"then":{"act":"act","do":"score"},"stop_if":[],"live":false}',
 'Needs the programme field.','active','seed'),
('v1','rule.startup.track_first_message','rule',
 '{"motion":"startup","english":"Track days to first message. Chase DLT and sender ID daily.",
   "when":"daily","if":[],"then":{"act":"act","do":"notify"},"stop_if":[],"live":false}',
 'Needs the DLT tracker.','active','seed'),
('v1','rule.startup.day_12','rule',
 '{"motion":"startup","english":"Day 12 with no first message → a person takes over.",
   "when":"daily","if":[["days_since_signup",">=",12],["messages_sent","==",0]],
   "then":{"act":"card","do":"raise_card","reason":"your_hands"},"stop_if":[],"live":false}',
 'Needs first-value tracking.','active','seed'),
('v1','rule.startup.free_credit_80','rule',
 '{"motion":"startup","english":"Free credit at 80% used → send the upgrade path.",
   "when":"balance_changed","if":[["credit_used_pct",">=",80]],
   "then":{"act":"act","do":"draft"},"stop_if":[],"live":false}',
 'Reads ms_text_bal; not wired yet.','active','seed'),

-- ── Partner. ────────────────────────────────────────────────────────────────
('v1','rule.partner.monthly_digest','rule',
 '{"motion":"partner","english":"Monthly digest to each partner of sourced accounts and outcomes.",
   "when":"month_end","if":[],"then":{"act":"act","do":"draft"},"stop_if":[],"live":false}',
 'Agent 5 exists; partner scope does not.','active','seed'),
('v1','rule.partner.goes_quiet','rule',
 '{"motion":"partner","english":"A partner-sourced account goes quiet → route it through the partner, never around them.",
   "when":"silence_detected","if":[["motion","==","partner"]],
   "then":{"act":"card","do":"raise_card","reason":"your_judgment"},"stop_if":[],"live":false}',
 'Needs the silence detector.','active','seed'),
('v1','rule.partner.never_price','rule',
 '{"motion":"partner","english":"Never open a price conversation without the partner on the thread.",
   "when":"before_send","if":[["motion","==","partner"]],
   "then":{"act":"card","do":"raise_card","reason":"your_judgment"},"stop_if":[],"live":true}',
 'Enforced in code as well: drafts.ts refuses to write to a partner customer at all.','active','seed'),
('v1','rule.partner.volume_down','rule',
 '{"motion":"partner","english":"Partner-sourced volume down 20% → tell the partner manager.",
   "when":"monthly","if":[["volume_change_pct","<=",-20]],
   "then":{"act":"card","do":"notify"},"stop_if":[],"live":false}',
 'Needs volume trend per partner.','active','seed');
