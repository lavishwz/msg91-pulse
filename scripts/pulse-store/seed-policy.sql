-- Seed pulse_policy v1 from the manifest and the triage thresholds.
--
-- These are the rules Autopilot cites. They were prototype constants in
-- public/pulse.js (MANIFEST) and prose in docs/autopilot-agent-prompts.md;
-- here they become rows a decision can point at.
USE pulse_store;

INSERT IGNORE INTO pulse_policy (version, policy_key, kind, body, note, state, source) VALUES
-- triage thresholds — the agent is never told these, the runner applies them
('v1','triage.threshold.human_now','threshold','{"min_score":80}','A rep gets a card and an SLA clock starts.','active','seed'),
('v1','triage.threshold.nurture','threshold','{"min_score":40,"max_score":79}','Automated sequence; Agent 3 writes step one.','active','seed'),
('v1','triage.threshold.suppress','threshold','{"max_score":39}','Filtered tab, with reasons. Reversible, never deleted.','active','seed'),
('v1','triage.floor.suppress_confidence','threshold','{"min_confidence":0.6}','Below this a signup may never be suppressed — an unseen lost customer is the expensive error.','active','seed'),
-- how long to wait between nurture messages. Rows, not constants, so the
-- cadence changes without a deploy.
('v1','nurture.gap.step2','threshold','{"days":3}','Days between message one and two.','active','seed'),
('v1','nurture.gap.step3','threshold','{"days":5}','Days between message two and three. There is no step four.','active','seed'),
-- the kill switch: the runner reads this first, every tick
('v1','sending.paused','switch','{"paused":false}','"Pause all automatic sending" in the command bar writes here.','active','seed'),
-- what Autopilot may do unasked
('v1','manifest.yes.score_signups','manifest_yes','{"text":"Score every signup and decide who gets a human"}',NULL,'active','seed'),
('v1','manifest.yes.nurture_under_80','manifest_yes','{"text":"Send onboarding and nurture sequences under 80 quality"}',NULL,'active','seed'),
('v1','manifest.yes.answer_rate_questions','manifest_yes','{"text":"Answer standard rate questions from the owner''s mailbox, inside the rate card"}','Needs Agent 6; not built.','proposed','seed'),
('v1','manifest.yes.chase_dlt','manifest_yes','{"text":"Chase the DLT desk, operators and sender-ID approvals daily"}',NULL,'active','seed'),
('v1','manifest.yes.research_prospects','manifest_yes','{"text":"Research outbound prospects against ICP before anyone contacts them"}',NULL,'active','seed'),
('v1','manifest.yes.manage_missions','manifest_yes','{"text":"Create, merge, pause and close missions"}',NULL,'active','seed'),
('v1','manifest.yes.assign_owners','manifest_yes','{"text":"Assign owners, set due times, add tags and categories"}',NULL,'active','seed'),
('v1','manifest.yes.draft_held','manifest_yes','{"text":"Draft recovery mails, follow-ups and apologies — held for a person"}',NULL,'active','seed'),
('v1','manifest.yes.suppress_junk','manifest_yes','{"text":"Suppress junk signups and merge duplicate companies"}',NULL,'active','seed'),
('v1','manifest.yes.set_timers','manifest_yes','{"text":"Set its own follow-up timers and reminders"}',NULL,'active','seed'),
('v1','manifest.yes.subject_experiments','manifest_yes','{"text":"Run subject-line experiments and promote the winner"}',NULL,'active','seed'),
-- what always needs a person. These are enforced in code, not by the prompt.
('v1','manifest.no.price','manifest_no','{"text":"Send anything with a price in it","enforced_in":"lib/pulse/agents.ts + release flow"}','Agent 3 sets send=false; the release path must check it again.','active','seed'),
('v1','manifest.no.below_margin','manifest_no','{"text":"Approve a rate below the margin floor"}',NULL,'active','seed'),
('v1','manifest.no.partner_customer','manifest_no','{"text":"Contact a partner''s customer without the partner on the thread"}',NULL,'active','seed'),
('v1','manifest.no.change_rate_card','manifest_no','{"text":"Change a rate card, a contract or a policy"}',NULL,'active','seed'),
('v1','manifest.no.export_data','manifest_no','{"text":"Export customer data, ever"}',NULL,'active','seed'),
('v1','manifest.no.escalate_early','manifest_no','{"text":"Escalate a person to their manager before two private prompts"}',NULL,'active','seed');
