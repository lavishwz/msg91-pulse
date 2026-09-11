const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const PROD=["SMS","OTP","WHATSAPP","EMAIL","VOICE","HELLO","SEGMENTO","CAMPAIGN","RCS","MASK"];
const OWNED=["SMS","OTP","WHATSAPP","EMAIL","HELLO"];

let BOOK=[
["TR","Sample Co 1","India","Startup","growing on SMS, never tried WhatsApp",1],
["KP","Sample Co 2","India","Outbound","waiting on your rate decision",1],
["FP","Sample Co 3","UAE","Partner","recovering from yesterday's outage",1],
["BF","Sample Co 4","US","Inbound","quote ready to send",1],
["ZL","Sample Co 5","India","Inbound","paused WhatsApp, reason unknown",1],
["MT","Sample Co 6","Singapore","Partner","stepping back — 22 days of silence",1],
["NF","Sample Co 7","India","Startup","stuck in DLT approval, day 9",1],
["OL","Sample Co 8","India","Inbound","signed up 4 minutes ago",1],
["AL","Sample Co 9","India","Inbound","steady · 180k SMS a month",0],
["VM","Sample Co 10","India","Outbound","volume dropped, reason unclear",0],
["SB","Sample Co 11","India","Partner","OTP only · renewal in November",0],
["MH","Sample Co 12","Singapore","Inbound","onboarding, week 3",0],
["KI","Sample Co 13","India","Inbound","steady · campaign heavy",0],
["CE","Sample Co 14","US","Outbound","first invoice paid",0],
["DL","Sample Co 15","UAE","Partner","growing on WhatsApp",0],
["PG","Sample Co 16","India","Startup","free credit at 78%",0],
["LL","Sample Co 17","US","Inbound","quiet, healthy",0],
["RK","Sample Co 18","India","Startup","first message sent yesterday",0]];

let CARDS=[
{s:"me",w:0,r:"Your hands",cust:"Sample Co 8",geo:"India · Inbound",clock:348,
 h:"Call Sample Contact at Sample Co 8.",
 y:'Signed up <span class="l1">4 minutes ago</span> on the OTP trial. Quality 91 — business domain, 40 people, read the pricing page twice. Unassigned until you take her.',
 a:"Call Sample Contact",solid:1,
 rev:[["Quality score","91 / 100 · business domain, 40 employees, 2 pricing visits"],
      ["Source","utm_campaign=otp-compare · google/cpc"],
      ["Rule","Inbound · quality ≥ 80 → human contact within 10 minutes"],
      ["Who she is","Sample Contact Q · Head of Product · sampleco8.example · linkedin.com/in/sample-contact"],
      ["What they do","K-12 test-prep platform · ~40 staff · Bengaluru · Android app, 60k installs"],
      ["Why they need OTP","App has a phone-number login. No OTP provider detected on their stack."],
      ["Owner","Unassigned"]]},

{s:"me",w:0,r:"Your judgment",cust:"Sample Co 2",geo:"India · Outbound",
 h:"Sample Co 2 wants ₹0.11 per SMS.",
 y:'Your floor is ₹0.125. At 11L a month that is <span class="l1">₹1.4L a year</span> below floor, margin 4.1% against a 9% policy. Asked twice, still unanswered.',
 a:"Review the options",solid:1,
 rev:[["Current rate","₹0.128 · 11,00,000 SMS / month committed"],
      ["Margin at ₹0.11","4.1% · policy floor is 9%"],
      ["AI alternative","₹0.119 with 24-month term → margin 9.4%"],
      ["Comparable","Sample Co 9 ₹0.121 · Sample Co 13 ₹0.124"],
      ["Competitor","Trial opened 12 Aug, ends 30 Sep"]]},

{s:"me",w:0,r:"Your voice",cust:"Sample Co 3",geo:"UAE · Partner",
 h:"Sample Co 3 should hear this from you.",
 y:'OTP delivery failed for <span class="l1">4h 12m</span> yesterday on the Etisalat route. Draft is ready but Sample Contact trusts you — it should sound like you.',
 a:"Read the draft",solid:1,
 rev:[["Impact","9,412 OTPs delayed · 2 tickets · both closed"],
      ["Timeline","15:02 route failed · 15:14 failover · 19:14 recovered"],
      ["Root cause","Sent by support 19:40"],
      ["Draft opens","“Sample Contact — yesterday was on us, and here is exactly what happened.”"]]},

{s:"me",w:0,r:"Your approval",cust:"Sample Co 4",geo:"US · Inbound",
 h:"The WhatsApp quote for Sample Co 4 is ready.",
 y:'180,000 conversations a month at <span class="l1">$0.0089</span>, margin 11.2%. Built from their email volume and US rate card v4. Nothing outside policy.',
 a:"Approve and send",solid:1,
 rev:[["Quote","WhatsApp Business · 180,000 conv/month · $0.0089"],
      ["Margin","11.2% · floor 9%"],
      ["Basis","Email volume Jun–Aug, +31% · US rate card v4"],
      ["Prepared","Today 08:14 by Pulse"],
      ["If unanswered","Reminder at 16:00, then held"]]},

{s:"me",w:0,r:"Your knowledge",cust:"Sample Co 5",geo:"India · Inbound",
 h:"Did Sample Contact say why Sample Co 5 paused WhatsApp?",
 y:'Zero volume since <span class="l1">14 August</span>. No ticket, no complaint, invoice paid on time. SMS unchanged. You met him on the 12th.',
 a:"Tell me what happened",solid:0,
 rev:[["WhatsApp","0 messages since 14 Aug · was 22% of spend"],
      ["SMS","2,40,000 / month · unchanged"],
      ["Support","No tickets in 90 days"],
      ["Billing","Invoice #MS-40118 paid 04 Aug, on time"]]},

{s:"me",w:0,r:"Your hands",cust:"Sample Co 1",geo:"India · Startup",
 h:"Sample Co 1 has never touched WhatsApp.",
 y:'<span class="l1">400k SMS</span> a month for order updates, up 12% this quarter. Sample Contact asked about WhatsApp on 22 July and nobody replied.',
 a:"See what to pitch",solid:0,
 rev:[["The opening","Sample Contact D, marketing — 22 Jul, unanswered"],
      ["Comparable","8 accounts, same profile → +38% median messaging spend"],
      ["Who to talk to","Sample Contact D, not Sample Contact E"],
      ["Competitor moved","June"]]},

{s:"me",w:1,r:"Watch closely",cust:"Sample Co 6",geo:"Singapore · Partner",
 h:"Sample Co 6 may be slipping.",
 y:'SMS down <span class="l1">35%</span> over 14 days. Silent 22 days while we reached out 3 times. Sample Contact still opens the reports weekly.',
 a:null,
 rev:[["Silence clock","22 days since they last responded"],
      ["Effort clock","3 days since we last reached out"],
      ["Volume","1,84,000 → 1,19,600 / month"],
      ["Next","Warm intro through the partner, before I ask you"]]},

{s:"me",w:1,r:"Watch closely",cust:"Sample Co 7",geo:"India · Startup",
 h:"Sample Co 7 is stuck in DLT approval.",
 y:'<span class="l1">Day 9</span> and still zero messages sent. Header pending with the operator. I have chased daily and escalated on day 7.',
 a:null,
 rev:[["Signed up","28 Aug · target first value 3 days"],
      ["Blocked on","Header NOVAFD pending · operator queue"],
      ["Chased","9 follow-ups · SPOC escalation 04 Sep"],
      ["Pattern","3rd startup this month on the same operator"]]},

{s:"team",w:0,r:"Your judgment",cust:"Sample Rep 3",geo:"India · Inbound",
 h:"Sample Rep 3 has not touched 6 of his accounts in 61 days.",
 y:'<span class="l1">6 accounts</span> with no meaningful conversation in 30 days. Prompted privately on 8 July and 2 August. Promises kept 96%.',
 a:"Look at his accounts",solid:1,
 rev:[["Accounts","64 accounts · India inbound"],
      ["Flat since","07 Jul"],
      ["Private prompts","08 Jul, 02 Aug — his view only"],
      ["Escalation rule","Manager after 2 prompts and 21 days"],
      ["Not in question","Response 3h · promises 96%"]]},

{s:"team",w:0,r:"Your hands",cust:"Unassigned",geo:"India · Partner",
 h:"46 accounts have had no owner since Sample Rep 9 left.",
 y:'<span class="l1">14 days</span> unassigned. Three asked a question in that time and nobody answered.',
 a:"Reassign the accounts",solid:1,
 rev:[["Proposed split","India 28 → Sample Rep 1, Sample Rep 2 · UAE 11 → Sample Rep 3 · Singapore 7 → Sample Rep"],
      ["Basis","Current load, country, product overlap"],
      ["Unanswered","Sample Co 15, Sample Co 14, Sample Co 13"]]},

{s:"team",w:1,r:"Watch closely",cust:"UAE inbound",geo:"UAE · Inbound",
 h:"First response in UAE slipped to nine hours.",
 y:'Was 4h in July, target is 2h. Every slow response landed between <span class="l1">18:00 and 02:00</span> GST.',
 a:null,
 rev:[["July","4h 10m average"],["September","9h 02m average"],
      ["Coverage","2 reps · both on leave 26–31 Aug"],
      ["Suggested","Route after-hours UAE to India late shift for 4 weeks"]]},

{s:"company",w:0,r:"Your judgment",cust:"OTP · UAE",geo:"UAE · Inbound",
 h:"Nine customers were hit by yesterday's UAE outage.",
 y:'<span class="l1">41,200</span> OTPs delayed across 9 accounts, two in their first month. Only two raised tickets.',
 a:"Decide the disclosure",solid:1,
 rev:[["Affected","9 accounts · 41,200 OTPs · 4h 12m"],
      ["Raised tickets","Sample Co 3, Sample Co 15"],
      ["Precedent","Mar 2026 full disclosure → 0 churn"],
      ["Risk","7 accounts will see it in their own dashboards"]]},

{s:"company",w:1,r:"Watch closely",cust:"Product signal",geo:"India · Inbound",
 h:"Sixteen customers asked for RCS this quarter.",
 y:'Up from 12 last quarter and 9 before that. <span class="l1">6 of 16</span> named a competitor in the same conversation.',
 a:null,
 rev:[["Sources","11 sales calls · 3 tickets · 2 signup notes"],
      ["Profile","Retail and logistics, all above 2L SMS/month"],
      ["Trend","Q1 9 · Q2 12 · Q3 16"]]}];

let GROWTH={
me:{lab:"Your September",h:'You kept 9 of 10 promises. <em>Your best month yet.</em>',
 score:86,delta:"+7 from August",
 tip:["Your score","Promises kept 9/10 · first response 4h against a 6h target · 3 accounts recovered · 2 products activated. Weighted to outcomes you control — never to revenue you inherited."],
 stats:[["9/10","promises kept","Promises kept","A promise is any commitment Pulse extracted from your email, calls or notes. One missed: the Sample Co 3 incident note, due 17:00 today."],
  ["4h","first response","First response","Median time from a high-quality inbound signup to a real human reply. Target is 6h; the team average is 5h."],
  ["3","recovered","Accounts recovered","Accounts that were declining or silent and are now sending again. Sample Co 10, Sample Co 13, Sample Co 11."],
  ["2","activated","Products activated","A product that moved from considering or setting up to actively sending. WhatsApp at Sample Co 15, Email at Sample Co 12."],
  ["18","accounts","Your accounts","Companies where you are the MSG91 owner across all ten products. Nine gained, one handed over this quarter."]],
 pills:1},
team:{lab:"Sales this September",h:'The team kept 41 of 48 promises. Response time is down to <em>five hours</em> from nine.',
 score:79,delta:"+4 from August",
 tip:["Team score","The median of 25 individual scores, not an average — one bad month cannot drag the team, and one great month cannot hide it."],
 stats:[["41/48","promises kept","Promises kept","Seven missed, six of them in the week two UAE reps were on leave."],
  ["5h","first response","First response","Down from 9h in July. UAE is the outlier at 9h; India is at 3h."],
  ["11","recovered","Accounts recovered","Across 25 reps. Sample Rep 1 3, Sample Rep 2 2, Sample Rep 4 2, four others 1 each."],
  ["9","activated","Products activated","WhatsApp 4 · Email 3 · Voice 1 · Segmento 1."],
  ["486","accounts","Team accounts","Owned across the team. 46 currently unassigned since Sample Rep 9 left."]],
 movers:[["Sample Rep 1 +3","accounts recovered"],["Sample Rep 3 100%","promises kept"],["Sample Rep 2 +4","products activated"]]},
company:{lab:"MSG91 this September",h:'Pulse handled 1,842 signals. <em>Sixty-three needed a human.</em>',
 score:92,delta:"+11 from August",
 tip:["Autonomy score","How much of the customer lifecycle runs without a person. 96.6% of signals resolved without escalation, weighted by how consequential each one was."],
 stats:[["1,842","signals","Signals","Every meaningful change: signup, payment, usage shift, message, meeting, ticket, DLT status."],
  ["63","reached a person","Escalations","Signals where AI decided only a human could resolve it. 41 judgment, 12 approval, 7 voice, 3 knowledge."],
  ["12","rules proposed","AI proposals","Rules AI wrote for itself after seeing the same decision resolved the same way. Nine accepted."]]}};

let CUST={
"Sample Co 8":{v:"Four minutes old and already worth a call.",
 s:"Business domain, 40 employees, read the pricing page twice, arrived on the OTP comparison campaign. Quality 91.",
 pe:[["Sample Contact Q","Signed up · not yet contacted","Decision maker"]],
 la:[["OTP","setting up","trial · 4 min"]],
 ev:[["09:12","Signed up on the OTP trial"],["09:10","Read /pricing — second visit"],["08:58","First visit · utm_campaign=otp-compare"]],
 money:[["—","received","No payments yet"],["—","wallet","No wallet"],["Trial","plan","OTP trial · 14 days"]]},
"Sample Co 2":{v:"Ready to commit, waiting on a rate nobody has answered.",
 s:"Asked twice for ₹0.11 against a ₹0.125 floor. 11L SMS a month committed if it clears.",
 pe:[["Sample Contact A","Asked twice · waiting since 12 Aug","Decision maker"],
     ["Sample Contact B","Completed the API test 21 Aug","Technical"],
     ["Sample Contact C","Pays within terms","Billing"]],
 la:[["SMS","considering","11L/mo if cleared"],["OTP","active","40k/mo"]],
 ev:[["03 Sep","Second rate request"],["21 Aug","API test completed"],["12 Aug","First rate request"],
     ["12 Aug","Competitor trial opened"],["04 Aug","Payment received"]],
 money:[["₹8,42,000","received · 12 months","INR"],["₹1,10,400","wallet balance",""],["₹0.128","current SMS rate",""]]},
"Sample Co 1":{v:"Growing on SMS, and blind to everything else.",
 s:"400k order-update SMS a month, up 12% this quarter. Marketing asked about WhatsApp in July and nobody replied.",
 pe:[["Sample Contact D","Asked about WhatsApp 22 Jul · last spoke 46d","Marketing"],
     ["Sample Contact E","Runs the SMS integration · weekly","Technical"],
     ["Sample Contact G","Pays on time, never talks","Billing"]],
 la:[["SMS","growing","4,00,000/mo"],["OTP","active","62,000/mo"],["EMAIL","setting up","week 3"],
     ["WHATSAPP","considering","asked Jul"],["VOICE","stopped","ended Feb"]],
 ev:[["12 Sep","SMS crossed 4,00,000 for the first time"],["22 Jul","Sample Contact asked about WhatsApp order updates"],
     ["04 Jul","Payment received · ₹1,84,000"],["19 Jun","Email integration started"]],
 money:[["₹19,60,000","received · 12 months","INR"],["₹2,40,800","wallet balance",""],["₹0.119","current SMS rate",""]]},
"Sample Co 6":{v:"They are stepping back, and it is not because we forgot.",
 s:"SMS down 35% over 14 days. Silent 22 days while we reached out three times.",
 pe:[["Sample Contact H","Stopped replying 22d ago","Decision maker"],
     ["Sample Contact I","Still opens the reports weekly","Operations"]],
 la:[["SMS","declining","1,19,600/mo ▾35%"],["EMAIL","active","flat"],["WHATSAPP","paused","since Aug"]],
 ev:[["28 Aug","Volume began falling"],["25 Aug","Third outreach — no reply"],["15 Aug","Last reply from Sample Contact"],
     ["02 Aug","Delivery latency ticket · resolved"]],
 money:[["S$41,200","received · 12 months","SGD"],["S$3,900","wallet balance",""],["S$0.0412","current SMS rate",""]]},
"Sample Co 3":{v:"A solid account that just had a bad day.",
 s:"OTP delivery failed for 4h 12m yesterday on the Etisalat route. Everything else is healthy.",
 pe:[["Sample Contact J","Trusts you · spoke 9d ago","Decision maker"],
     ["Sample Contact K","Raised both tickets","Technical"]],
 la:[["OTP","active","9,412 delayed, recovered"],["SMS","growing","▴18% this quarter"],["WHATSAPP","setting up","sandbox"]],
 ev:[["05 Sep","Etisalat route failed 15:02–19:14"],["05 Sep","Root cause sent by support"],
     ["28 Aug","WhatsApp sandbox opened"],["12 Aug","Payment received"]],
 money:[["AED 214,000","received · 12 months","AED"],["AED 18,400","wallet balance",""],["AED 0.0290","current OTP rate",""]]},
"Sample Co 4":{v:"Growing on email and ready for a second product.",
 s:"Email volume up 31% over two quarters. WhatsApp quote drafted and waiting on approval.",
 pe:[["Sample Contact L","Replies fast · spoke 8d ago","Decision maker"],
     ["Sample Contact M","Integrated in four days","Technical"]],
 la:[["EMAIL","growing","▴31% two quarters"],["WHATSAPP","considering","quote drafted"]],
 ev:[["06 Sep","Quote drafted by Pulse"],["29 Aug","Asked about WhatsApp pricing"],["14 Aug","Email volume record"]],
 money:[["$64,800","received · 12 months","USD"],["$4,100","wallet balance",""],["$0.00041","current email rate",""]]},
"Sample Co 5":{v:"Something happened on 14 August and nobody knows what.",
 s:"WhatsApp went to zero with no ticket, no complaint and no missed invoice. SMS unchanged.",
 pe:[["Sample Contact F","You met him 12 Aug","Technical"],["Sample Contact N","Quiet","Operations"]],
 la:[["WHATSAPP","stopped","0 since 14 Aug"],["SMS","active","2,40,000/mo"],["OTP","active","31,000/mo"]],
 ev:[["14 Aug","WhatsApp volume dropped to zero"],["12 Aug","Meeting with Sample Contact"],["04 Aug","Invoice paid on time"]],
 money:[["₹11,20,000","received · 12 months","INR"],["₹1,86,000","wallet balance",""],["₹0.124","current SMS rate",""]]},
"Sample Co 7":{v:"Nine days in and still cannot send a message.",
 s:"Header pending with the operator since day one. Target time to first value is three days.",
 pe:[["Sample Contact O","Founder · patient so far","Decision maker"]],
 la:[["SMS","setting up","blocked on DLT"]],
 ev:[["06 Sep","Ninth follow-up to the DLT desk"],["04 Sep","Escalated to operator SPOC"],["28 Aug","Signed up"]],
 money:[["₹0","received","Startup programme"],["₹5,000","free credit",""],["—","rate","Not set"]]}};

let ASK={
churn:{q:"Who is most likely to churn this month?",big:"4",
 h:"Sample Co 6, Sample Co 5, Sample Co 10 and Sample Co 7.",
 p:"All four stopped sending. Three went quiet before the volume moved.",
 brk:[["Sample Co 6","SMS ▾35% · silent 22d"],["Sample Co 5","WhatsApp 0 since 14 Aug"],
      ["Sample Co 10","SMS ▾28% · silent 31d"],["Sample Co 7","never sent · day 9"]],
 act:"Create recovery missions for all four",
 st:["Rhea Menon","today 09:12","your accounts","fresh to 08:55","2 accounts masked"]},
flat:{q:"Whose accounts are flat?",big:"2",
 h:"Sample Rep 3 at 61 days, Sample Rep 4 at 34.",
 p:"Both kept their promises and answered fast. Neither started a new conversation with an existing customer in over a month.",
 brk:[["Sample Rep 3","64 accounts · flat since 07 Jul · 2 prompts sent"],
      ["Sample Rep 4","51 accounts · flat since 03 Aug · not yet prompted"]],
 act:"Open Sample Rep 3's accounts",
 st:["Rhea Menon","today 09:14","Sales team","manager view","2 names masked"]},
partner:{q:"Partner motion, this month",big:"₹64.2L",
 h:"38 partner-sourced customers across four entities.",
 p:"Native currency only, never converted. Partner-sourced accounts reach first value 11 days faster than inbound.",
 brk:[["India","₹41,80,000 · 21 accounts"],["UAE","AED 402,000 · 9 accounts"],
      ["United States","$61,400 · 5 accounts"],["Singapore","S$88,200 · 3 accounts"]],
 act:"Break it down by partner",
 st:["saved lens","Rhea Menon","today 09:15","Partner · all countries","no conversion applied"]},
uae:{q:"UAE entity, this quarter",big:"AED 402k",
 h:"61 customers. Eleven have no owner.",
 p:"First response has slipped from 4h to 9h, and every slow response landed between 18:00 and 02:00 GST.",
 brk:[["Received","AED 402,000"],["Customers","61 · 11 unowned"],["First response","9h 02m vs 2h target"],
      ["Top account","Sample Co 3 · AED 214,000"]],
 act:"Look at the after-hours gap",
 st:["saved lens","Rhea Menon","today 09:16","UAE entity","AED only"]},
stuck:{q:"Which startups are stuck before their first message?",big:"3",
 h:"Sample Co 7, Sample Co 16 and Sample Co 18.",
 p:"All three on the same operator's DLT queue, all past day seven against a three-day target.",
 brk:[["Sample Co 7","day 9 · header NOVAFD"],["Sample Co 16","day 8 · header PRTREE"],
      ["Sample Co 18","day 7 · cleared yesterday"]],
 act:"Escalate all three to the operator",
 st:["Rhea Menon","today 09:18","Startup motion","fresh to 09:00"]}};

const TIP={
 draft:["Draft","AI wrote it and stopped. Nothing was sent — a person has to release it."],
 sent:["Sent","AI sent this to the customer, from the owner's mailbox, under an approved policy."],
 acted:["Acted","AI did something inside Pulse or with a partner system. No customer was contacted."],
 merge:["Merged","Two signals turned out to be the same story. One mission instead of two, so you get one card."],
 timer:["Timer","AI set itself a reminder. If nothing changes by then it acts or hands it back."],
 escalated:["Escalated","AI could not decide with enough confidence, so it asked a person instead of guessing."],
 learned:["Learned","An outcome changed how AI will behave next time. Logged as a policy version."],
 reveal:["Reveal","A person opened confidential data — payments, margin, contracts. Always logged with a reason."],
 view:["View","A person opened a company page. Name and status only, nothing confidential."],
 config:["Config change","A person changed a setting that affects how AI behaves."],
 approve:["Approved","A person released something AI had drafted."],
 blocked:["Blocked","Policy stopped a person from doing this. The attempt is kept."],
 junk:["Suppressed","AI decided this signup was not worth a person. Nothing is deleted — say so if it got one wrong."],
 merged:["Merged","A duplicate signup was attached to an existing company instead of becoming a new lead."],
 suppressed:["Suppressed","AI decided this signup does not need a person. Nothing was deleted — put it back and it returns to the deck."],
 ACT:["ACT","AI does this on its own. No card, no person, logged."],
 CARD:["CARD","AI stops here and puts a card in front of a person."]};
const TABTIP={
 connections:["Connections","What Pulse can reach. Everything AI can do depends on this list — an amber dot means something is switched off."],
 activity:["Activity","Everything AI did, newest first. Every row opens to show the evidence, the confidence and the policy behind it."],
 rules:["Rules","The policies AI follows, one set per motion. This is where you change its behaviour."],
 audit:["Audit log","Every action a person took — viewed, revealed, changed, exported. Separate from the AI log."],
 };

let AUTO={
/* No sample banner here any more. The prototype's "UAE routing rule fired 41
   times" was the story a circuit breaker is built to catch — and Pulse now has
   a real one, so a permanent invented version of it sitting above the real feed
   would be the worst of both. The banner below is drawn from the same alerts
   the Now surface reads. */
activity:{
 f:[["09:14","Drafted a recovery mail for Sample Co 6","Silence 22d, effort 3d. Held — the last two drafts to this account were edited.","draft","act"],
 ["09:11","Merged two missions on Sample Co 5","Protect revenue and solve issue, same evidence.","merge",""],
 ["09:04","Chased the DLT desk for Sample Co 7","Ninth follow-up. Escalated to the operator SPOC.","acted","ok"],
 ["08:59","Answered a rate question for Sample Co 9","India rate card v7, inside policy. Sent from rep2@msg91.com.","sent","ok"],
 ["08:52","Merged a duplicate signup","Third signup from sampleco1.example, different department.","merged","ok"],
 ["08:47","Scored 14 new signups","One crossed the call threshold — Sample Co 8, 91.","acted","ok"],
 ["08:31","Scheduled a follow-up on Sample Co 4","If no reply by Thursday, nudge once then hand back.","timer",""],
 ["08:22","Promoted subject line B on recovery mails","+18% reply rate over 240 sends. Policy v7 → v8.","learned","ok"],
 ["08:04","Failed over the AE route","Etisalat degraded. Switched at 08:04, 0 messages lost.","acted","ok"]]},
rules:{mo:[
 ["Inbound","Sample Rep 1, Sample Rep 2, Sample Rep 3 · 312 accounts",[["ACT","Score every signup within 60 seconds on domain, company size, pages read and UTM."],
  ["CARD","Quality 80+ → call within 10 minutes. Clock on the card, escalates to the manager at zero."],
  ["ACT","Quality 40–79 → three-mail onboarding over 12 days. No human unless they reply."],
  ["ACT","Below 40 → suppress and file under Filtered."]]],
 ["Outbound","Sample Rep 2, Sample Rep · 88 accounts",[["ACT","Research fit against ICP before any contact. No contact without a named reason."],
  ["ACT","Maximum two touches in 14 days."],["CARD","Any reply from a named decision maker → same-day human contact."],
  ["ACT","No reply after two touches → cool 90 days, then re-score."]]],
 ["Startup","Sample Rep 1, Sample Rep 3 · 141 accounts",[["ACT","Confirm programme eligibility from the signup form."],
  ["ACT","Track days to first message. Chase DLT and sender ID daily."],
  ["CARD","Day 12 with no first message → a person takes over."],["ACT","Free credit at 80% → send the upgrade path."]]],
 ["Partner","Sample Rep 1, Sample Rep · 94 accounts",[["ACT","Monthly digest to each partner of sourced accounts and outcomes."],
  ["CARD","Partner-sourced account goes quiet → route through the partner."],
  ["ACT","Never open a price conversation without the partner on the thread."],
  ["CARD","Partner-sourced volume down 20% → tell the partner manager."]]]],
 pr:[["Stop asking about cancellation clauses under ₹50k","Approved four times in a row with no edits.","Let AI handle it","Keep asking me"],
  ["Promote recovery mails from draft to send","22 drafts released unedited. Accounts under ₹1L a month only.","Promote to send","Not yet"]]},
ailogSample:{f:[
 ["09:14","Sample Co 6 · risk detected · confidence 0.81","SMS −35%/14d (reports) · no inbound reply 22d (gmail) · 3 outbound attempts. Policy: Partner, protect revenue. Drafted recovery mail, held for human. FYI: Sample Rep 1.","draft","act"],
 ["09:11","Sample Co 5 · missions merged","Open protect-revenue mission already covered the WhatsApp pause. Duplicate suppressed.","merge",""],
 ["08:59","Sample Co 9 · rate question · confidence 0.94","Matched India rate card v7. No margin exception. Sent from rep2@msg91.com. FYI: Sample Rep 2.","sent","ok"],
 ["08:40","Sample Co 10 · could not decide","Confidence 0.42 on cause of volume drop. Rules could not resolve. Escalated to Sample Rep 3.","escalated","act"],
 ["08:22","Experiment E-014 · variant B wins","+18% reply over 240 sends, significant. Promoted to default. Policy v7 → v8.","learned","ok"],
 ["07:51","Sample Co 13 · recovery complete","Volume back to 94% of baseline after 3 touches. Mission closed, outcome recorded.","acted","ok"]]},
audit:{sys:["Anomaly","Sample Rep 3 revealed payment history on 40 accounts between 01:52 and 02:14.",
 "Outside his hours, 12× his usual volume, 31 of 40 outside his own accounts. Export blocked. Flagged 02:16."],
 f:[["09:12","Rhea Menon revealed margin on Sample Co 2","Reason: rate request below floor. Level 2, commercial.","reveal",""],
 ["09:06","Sample Rep 2 viewed Sample Co 9","Level 0 only. Her own book.","view",""],
 ["08:58","Sample Rep 4 changed the UAE office-hours window","Removed 18:00–02:00 GST from inbound routing.","config","act"],
 ["08:31","Rhea Menon approved a quote for Sample Co 4","$0.0089 per conversation, margin 11.2%. Sent.","approve",""],
 ["02:14","Sample Rep 3 attempted an export of 40 accounts","Requires a named reason and a second approver.","blocked","act"]]},
connections:{f:[]},
filteredSample:{f:[
 ["09:07","rahul.test@gmail.com","Free domain, no company, bounced verification, scraper user agent. Quality 4.","junk",""],
 ["08:52","Duplicate of Sample Co 1","Third signup from sampleco1.example, different department.","merged","ok"],
 ["08:41","Amrita University · student project","Named it a college assignment in the signup note. Quality 11. Sent free-tier docs.","junk",""],
 ["08:12","Competitor domain","Suppressed and flagged, not blocked.","junk",""],
 ["07:58","wecare-ngo.org re-scored","Sample Rep 2 marked it real — they run 200k SMS a year. Non-profit domains no longer lose 30 points.","learned","ok"]]}};


const DUP={s:"me",w:0,r:"Your hands",cust:"Sample Co 1",geo:"India · Startup",
 h:"Someone new at Sample Co 1 just signed up.",
 y:'Sample Contact P, growth lead, created his own account <span class="l1">this morning</span> — Sample Co 1 is already yours through Sample Contact and Sample Contact. Either a new department is evaluating, or they are not getting what they need from you.',
 a:"Call Sample Contact",solid:1,
 rev:[["Who he is","Sample Contact P · Growth Lead · joined the account Mar 2025 · linkedin.com/in/sample-contact-2"],
  ["What he did","Signed up on the WhatsApp trial, not SMS. Read /whatsapp-pricing twice."],
  ["Why it matters","Sample Contact asked about WhatsApp on 22 Jul and nobody replied. This is the same department asking again."],
  ["Already merged","Attached to Sample Co 1. No duplicate company created."],
  ["Not contacted","I have sent him nothing. A signup from an existing customer is a conversation, not a sequence."]]};

CARDS.splice(6,0,DUP);

const DONE_T=[
 ["09:22","Reassigned 11 UAE accounts to Sample Rep 3","from the unassigned accounts","Unassigned"],
 ["08:47","Reverted a startup credit","Sample Co 23 · 34 staff, above the limit","Sample Co 23"],
 ["08:12","Approved the after-hours routing test","UAE inbound, four weeks","UAE inbound"]];
const DONE_C=[
 ["09:40","Told all nine customers about the UAE outage","full disclosure, as in March","OTP · UAE"],
 ["08:05","Sent the RCS ask to product","third quarter running","Product signal"]];
const DONE=[
 ["09:31","Called Sample Contact at Sample Co 8","reached in 6 minutes · trial extended to 30 days","Sample Co 8"],
 ["09:18","Approved the WhatsApp quote for Sample Co 4","$0.0089 · sent from your mailbox","Sample Co 4"],
 ["08:54","Sent the incident note to Sample Co 3","edited the draft before sending","Sample Co 3"],
 ["08:22","Told Pulse why Sample Co 5 paused WhatsApp","cost decision · recovery play switched","Sample Co 5"]];

let STANDINGS=[
 ["Sample Rep 2","SQ",91,"+5","up",0],["Rhea Menon","RM",86,"+7","up",1],
 ["Sample Rep 4","PS",84,"+2","up",0],["Sample Rep 3","AN",81,"-3","down",0],
 ["Sample Rep 6","VM",79,"+4","up",0],["Sample Rep 5","NK",77,"+1","up",0],
 ["Sample Rep 7","FA",74,"-1","down",0],["Sample Rep 8","RS",72,"+6","up",0]];


const FLIGHT=[
 ["Sample Co 4","Quote sent, waiting on Sample Contact","them",3,0,"I nudge on Thursday, then hand it back to you"],
 ["Sample Co 11","Renewal quote with their finance team","them",8,0,"Second reminder goes Monday"],
 ["Sample Co 14","Outbound · two touches sent","them",6,0,"Cooling until 04 Dec, then re-score"],
 ["Sample Co 7","DLT header pending with the operator","us",9,1,"Chasing daily · SPOC escalated on day 7"],
 ["Sample Co 15","Contract sitting with legal since 21 Aug","us",16,1,"I have asked legal twice. This is the oldest thing you own."],
 ["Sample Co 12","Onboarding · week 3 of 4","pulse",19,0,"Sequence running, two mails left. No human needed."],
 ["Sample Co 18","First message sent, watching activation","pulse",1,0,"Watching volume for 7 days before I say anything"]];

ASK.flight={q:"What is in flight?",big:"7",
 h:"Three with them, two blocked here, two with me.",
 p:"Sorted by how long the ball has been sitting. Two are older than they should be.",
 cols:["Company","What","Ball","Days","What I am doing"],
 rows:FLIGHT.map(f=>[f[0],f[1],{them:"Them",us:"Blocked here",pulse:"Pulse"}[f[2]],f[3]+"d",f[5]]),
 act:"Chase everything over 7 days",
 st:["Rhea Menon","today 09:26","your accounts","fresh to 09:24"]};


/* Mailboxes/Calendars rows below start as the fixed "22 of 25" copy; the
   moment the Connections tab is opened, loadTeamConnections() overwrites
   those two rows in place from pulse_connection (migrations/012) — the real
   count across everyone's own Profile connect, not a demo number. */
let teamConnLoaded=false;
function loadTeamConnections(){
 if(teamConnLoaded)return;teamConnLoaded=true;
 fetch("/api/pulse/connections?view=team").then(r=>r.json()).then(d=>{
  if(!d.ok||!d.team)return;
  const patch=(row,key,gap)=>{
   const t=d.team[key];if(!t||!t.total)return;
   row[1]=t.connected===t.total?"on":t.connected===0?"off":"part";
   row[2]=`${t.connected} of ${t.total} people connected · each person connects their own in Profile`;
   row[4]=t.unconnected.length
    ?`${t.unconnected.slice(0,3).join(", ")}${t.unconnected.length>3?" and others":""} ${
       t.unconnected.length===1?"has":"have"} not connected. ${gap}`
    :"";};
  patch(CONN[0],"gmail","For their accounts, I cannot tell silence from a missed follow-up.");
  patch(CONN[1],"cal","Same people, so meeting prep and capture are off for their accounts too.");
  patch(CONN[2],"slack","I cannot DM them an FYI or their daily digest — only the team channel sees it.");
  if(S.v==="auto"&&S.tab==="connections")render();
 }).catch(()=>{});
}

/* Every row here is backed by pulse_connection (migrations/012) and patched
   with real numbers by loadTeamConnections() the moment the tab opens — see
   below. There is no seventh row for services Pulse does not actually track
   a connection state for (SMS, WhatsApp, email sequencing, Hello, DLT desk,
   a reports/billing feed): inventing one meant a permanently fake number on
   screen, which is worse than the tab being short. */
const CONN=[
 ["Mailboxes · everyone's own","part",loadingIndicator("Loading mailbox connection status"),
  "Silence detection · promise extraction · reply drafting · who said what","",""],
 ["Calendars · everyone's own","part",loadingIndicator("Loading calendar connection status"),
  "Meeting prep 20 minutes before · post-meeting capture · promises made on calls","",""],
 ["Slack · everyone's own","part",loadingIndicator("Loading Slack connection status"),
  "FYI when I act on your account · daily digest · anomaly alerts","",""]];

function loadingIndicator(label="Loading"){
 return `<span class="inline-loader" role="status"><span class="sr">${esc(label)}</span></span>`;
}

const MANIFEST={
 yes:["Score every signup and decide who gets a human",
  "Send onboarding and nurture sequences under 80 quality",
  "Answer standard rate questions from the owner's mailbox, inside the rate card",
  "Chase the DLT desk, operators and sender-ID approvals daily",
  "Research outbound prospects against ICP before anyone contacts them",
  "Create, merge, pause and close missions",
  "Assign owners, set due times, add tags and categories",
  "Draft recovery mails, follow-ups and apologies — held for a person",
  "Suppress junk signups and merge duplicate companies",
  "Set its own follow-up timers and reminders",
  "Run subject-line experiments and promote the winner"],
 no:["Send anything with a price in it",
  "Approve a rate below the margin floor",
  "Contact a partner's customer without the partner on the thread",
  "Change a rate card, a contract or a policy",
  "Export customer data, ever",
  "Escalate a person to their manager before two private prompts"]};


/* Seeded by the server render (app/pulse-shell.tsx) so the profile page knows
   who is signed in on the first paint rather than after bootstrap answers.
   `accounts` still comes from bootstrap — it belongs to the book on screen.
   gmail/cal start unconnected — pulse-live.js corrects them from
   pulse_connection (migrations/012) as soon as bootstrap answers, so a real
   "not connected yet" isn't shown as connected for the first frame. */
const ME={gmail:0,cal:0,slackapp:0,slack:1,email:1,push:1,
 name:(window.PULSE_SIGNED_IN_AS&&window.PULSE_SIGNED_IN_AS.name)||null,
 email_addr:(window.PULSE_SIGNED_IN_AS&&window.PULSE_SIGNED_IN_AS.email)||null};
/* Replaced by the signed-in person's own list as soon as /api/pulse/voice
   answers — see PULSE_BAG.setVoice. These five are the same defaults the API
   seeds a new person with, so the first paint matches what lands. */
let VOICE=["Short sentences","Opens with the point, never a greeting","Says sorry plainly, no hedging",
 "Signs off with just your first name","Never uses exclamation marks"];
const ONB=[
 ["Step 1 of 4","Connect your mailbox and calendar.",
  "Almost everything Pulse does starts here. Without your mail I cannot tell whether a customer went quiet or you simply forgot to follow up — and those need opposite responses.",
  "connect"],
 ["Step 2 of 4","These 18 accounts are yours.",
  "Pulled from MSG91. Remove anything that should not be yours and add anything I have missed — ownership decides who I bring things to, so it is worth thirty seconds now.",
  "book"],
 /* The copy used to open "I read your last twenty sent mails." Pulse has no
    mailbox connection — no OAuth, no IMAP, nothing in the codebase has ever
    seen a sent message — so that was describing a feature that does not
    exist, on the one screen whose job is to earn trust. */
 ["Step 3 of 4","This is how you write.",
  "These are starting points, not something I worked out about you — I cannot see your mail yet. When I draft something for you to send, it will sound like this, so delete what is wrong and add what is missing. It matters more than you would think.",
  "voice"],
 ["Step 4 of 4","That is everything.",
  "There is a queue of things that need you, and everything else Pulse has already handled on its own — you can see every one of them in Autopilot whenever you want to check my work.",
  "done"]];
const ONBSTATE={dropped:new Set(),traits:VOICE.slice(),added:[],adding:false};

/* Room to grow, from Agent 5's digest when there is one. The prototype's six
   ranked opportunities below stay as the fallback: an empty month should still
   show a person what to do, and a blank surface teaches nobody anything. */
/**
 * Room to grow.
 *
 * Three sources, in order of how much they know:
 *
 *   1. Agent 5's month-end digest, when the month has been run. It has read the
 *      whole board and can say what a play is worth.
 *   2. What is already on screen — the board and the counts. No new queries:
 *      ms_trans has no useful index, so anything clever here would cost seconds
 *      on every page load.
 *   3. The prototype's rows, only when neither of the above has anything. An
 *      empty growth section teaches nobody anything.
 */
function roomRows(){
 const dg=window.PulseLive&&PulseLive.state.digest;
 if(dg&&dg.plays&&dg.plays.length)
  return dg.plays.map(p=>[p.what.split(/[.:]/)[0].slice(0,42),p.what,p.why,
   (p.worth||"").toUpperCase()+" · WRITTEN BY AUTOPILOT AT MONTH END",p.cta||"Do it"]);

 const live=[];
 const counts=(window.PulseLive&&PulseLive.state.counts)||null;
 if(counts&&counts.unowned)
  live.push(["Claim an account",
   `${counts.unowned.toLocaleString("en-IN")} accounts have nobody on them`,
   "Nobody is watching these. Whoever claims one owns whatever it becomes — and an unowned account that starts paying is the cheapest revenue on the board.",
   "FROM ms_user AND user_handled_by · COUNTED JUST NOW","Claim three"]);

 /* The board is already scored for this scope, so naming the accounts that are
    slipping costs nothing extra. */
 if(BOARD&&BOARD.bands){
  const risky=BOARD.bands.filter(b=>b.band==="wobbling"||b.band==="risk").flatMap(b=>b.accounts);
  if(risky.length)
   live.push(["Wake something up",
    `${risky.length} account${risky.length===1?"":"s"} in your book are slipping`,
    `${risky.slice(0,3).map(a=>a.name).join(", ")}${risky.length>3?` and ${risky.length-3} more`:""}. Their score is built from payment recency, spend trend, how many products they use and whether anyone owns them — open one to see which part moved.`,
    "FROM THE SAME SCORE THE BOARD USES","See the board"]);
 }

 /* Held drafts are work already done that nobody has released. The cheapest
    thing on this list, and the one most likely to be forgotten. */
 const held=((window.PulseLive&&PulseLive.state.drafts)||[]).length;
 if(held)
  live.push(["Release what is written",
   `${held} message${held===1?"":"s"} are written and waiting on you`,
   "Autopilot drafted these and stopped. Reading one takes ten seconds, and a first touch is worth less every day it waits.",
   "FROM pulse_draft · HELD, NOT SENT","Read them"]);

 return live.length?live:ROOM;
}

const ROOM=[
 ["Claim an account","Sample Co 15 has no owner and is growing on WhatsApp.",
  "UAE, partner-sourced, unassigned for 16 days. They asked a question on 22 August and nobody answered it. Their WhatsApp volume is up 22% anyway.",
  "AED 96,000 RECEIVED IN 12 MONTHS · 1 OF 11 UNOWNED IN YOUR COUNTRIES","Claim it"],
 ["Sell a second product","Six of your accounts use only one MSG91 product.",
  "Sample Co 1, Sample Co 11, Sample Co 13, Sample Co 17, Sample Co 14 and Sample Co 18. Sample Co 1 is the obvious one — 400k SMS a month and marketing already asked about WhatsApp.",
  "MEDIAN OUTCOME FOR THIS PROFILE: +38% MESSAGING SPEND IN TWO QUARTERS","See the best three"],
 ["Meet someone new","At five of your accounts you only know one person.",
  "If Sample Contact leaves Sample Co 5, you lose the account. Sample Contact at Sample Co 1 is the only person who has ever replied to you there. Single-thread accounts churn at roughly twice the rate.",
  "SAMPLE CO 5 · SAMPLE CO 1 · SAMPLE CO 9 · SAMPLE CO 13 · SAMPLE CO 17","Who to meet"],
 ["New prospects","Fourteen companies look like your best customers and are not with MSG91.",
  "Closest is Sample Co 19 — a 200-store grocery chain running order SMS through a competitor, with an app that has a phone-number login and no OTP provider I can detect.",
  "MATCHED ON: VOLUME PROFILE · INDUSTRY · APP LOGIN · CURRENT PROVIDER","Look at them"],
 ["Wake something up","Sample Co 10 left in March. Their new CTO used us at his last company.",
  "Sample Rep 3 still owns it and has not touched it in 94 days. Sample Contact joined in July from Sample Co 9, where he ran our OTP integration himself.",
  "WAS ₹4,10,000 A YEAR · LEFT OVER DELIVERY LATENCY, SINCE FIXED","Read the story"],
 ["Worth ten minutes","You lose most often on rate — two of your last four.",
  "Both times you countered once and stopped. Sample Rep 2 holds ₹0.121 on comparable pharma accounts by leading with term length instead of price.",
  "PRIVATE · ONLY YOU SEE THIS","Ten minutes on this"]];

/**
 * Room to grow, for a rep who has just onboarded (S.newRep). Same shape and
 * call site as roomRows() above, and for the same reason: the unowned count
 * used to be a hand-typed "eleven" presented as fact. Wire it to the real
 * count from bootstrap when it has landed; otherwise say so honestly rather
 * than inventing a number.
 */
function roomNewRows(){
 const counts=(window.PulseLive&&PulseLive.state.counts)||null;
 const unowned=counts&&typeof counts.unowned==="number"?counts.unowned:null;
 return [
  ["Take your first accounts",
   unowned!=null
    ?`${unowned.toLocaleString("en-IN")} unowned account${unowned===1?"":"s"} are waiting for an owner.`
    :"Unowned accounts are waiting for an owner.",
   "Some are sending well and some asked a question nobody answered. Start with those — a live account teaches you more in a week than any document.",
   unowned!=null?`${unowned.toLocaleString("en-IN")} UNOWNED · COUNTED JUST NOW`:"UNOWNED ACCOUNTS",
   "Show me the unowned ones"],
  ["Read before you call","Three accounts are worth understanding first.",
   "Sample Co 1, Sample Co 2 and Sample Co 3. Each one is a different shape of MSG91 customer — a startup growing on volume, an outbound deal stuck on rate, and a partner account recovering from an outage.",
   "ABOUT 20 MINUTES","Open the first"],
  ["See how the team works","Watch how your colleagues are working the open situations.",
   "Team scope shows you what your colleagues are handling and how. The fastest way to learn the job here is to watch it happen.",
   "NOTHING IS HIDDEN FROM YOU","Open Team"],
  ["Ask me anything","I know every account, every payment and every conversation.",
   "Try: which of our customers use WhatsApp? What does a good Indian inbound signup look like? Who should I talk to at Sample Co 1?",
   "ASK IN YOUR OWN WORDS · NO REPORTS TO LEARN","Ask something"]];
}

let PINNED={
team:[
 ["Response time by country","This month, high-quality inbound only","3h · 9h","IN · AE",[41,38,34,30,26,22,20],"uae"],
 ["Accounts with nobody on them","Unassigned since Sample Rep 9 left, 14 days ago","46","3 asked questions",null,"cold"],
 ["Whose accounts are flat","No new conversation in 30 days","2","Sample Rep 3 61d, Sample Rep 34d",null,"flat"]],
company:[
 ["Payments received this month","Four entities, native currency, never converted","₹1.42Cr","+ AED 402k · $184k · S$212k",null,"partner"],
 ["Escalation rate","Signals that reached a person","3.4%","▼ from 6.1% in June",[61,58,52,47,43,38,34],"churn"],
 ["Human minutes per signal","Total human time ÷ signals handled","2.4","▼ 41% since June",[41,40,36,33,29,26,24],"flat"],
 ["Top unmet product ask","Third quarter running","RCS","16 customers · 6 named a competitor",null,"stuck"]]};

const TAGS={
"Sample Co 1":[["High volume",0],["Order updates",0],["Startup programme",0],["Growing",1],["Single-thread risk",1]],
"Sample Co 2":[["Rate sensitive",0],["Pharma",0],["Competitor trial",1],["Decision pending",1]],
"Sample Co 6":[["Partner sourced",0],["Travel",0],["At risk",1],["Ghosting",1]],
"Sample Co 3":[["Partner sourced",0],["Fintech",0],["Had an incident",1]],
"Sample Co 4":[["Fintech",0],["Quote out",1],["Expanding",1]],
"Sample Co 5":[["Logistics",0],["Reason unknown",1]],
"Sample Co 7":[["Startup programme",0],["Blocked on DLT",1]],
"Sample Co 8":[["Edtech",0],["High quality inbound",1]]};

const OPEN={
"Sample Co 1":[["mission","Grow product · WhatsApp","Opened 12 Sep by Pulse · waiting on you to pitch Sample Contact","open"],
 ["promise","Send the WhatsApp pricing sheet","You said Friday, on the call with Sample Contact","due Fri"],
 ["watch","Volume above 400k","Pulse is watching for a plan change","auto"]],
"Sample Co 2":[["mission","Qualify · rate decision","Opened 12 Aug · blocked on your judgment","open"],
 ["overdue","Reply to Dr. Sample Contact","Asked twice. Second request 3 Sep.","4d late"],
 ["promise","Send revised rate","You said Wednesday, on the 15:00 call","due Wed"]],
"Sample Co 6":[["mission","Protect revenue","Opened 28 Aug by Pulse · recovery mail drafted, held for you","open"],
 ["watch","Silence 22 days","Pulse tries the partner first","auto"]],
"Sample Co 3":[["promise","Send the incident note","You said today, 17:00","due 17:00"],
 ["mission","Repair relationship","Opened 5 Sep after the outage","open"]],
"Sample Co 4":[["mission","Grow product · WhatsApp","Quote approved and sent 6 Sep","waiting"]],
"Sample Co 5":[["mission","Solve issue · WhatsApp paused","Blocked — Pulse needs to know why","blocked"]],
"Sample Co 7":[["mission","First value","Day 9 · blocked on the DLT header","blocked"]],
"Sample Co 8":[["mission","Qualify","Opened today · call within 10 minutes","open"]]};

const APPROVALS=[
 ["02 Sep","Sample Co 16","Startup programme · ₹5,000 free credit","Sample Rep 2","Registered 2024, under 20 staff, seed stage"],
 ["31 Aug","Sample Co 18","Startup programme · ₹5,000 free credit","Rhea Menon","Registered 2025, 6 staff, pre-seed"],
 ["28 Aug","Sample Co 7","Startup programme · ₹5,000 free credit","Rhea Menon","Registered 2024, 11 staff, seed stage"],
 ["24 Aug","Sample Co 23","Startup programme · ₹10,000 free credit","Sample Rep 3","Registered 2023, 34 staff — above the usual limit"],
 ["19 Aug","Sample Co 24","Startup programme · ₹5,000 free credit","Sample Rep 5","Registered 2025, 4 staff"]];

const BULK=[
 ["Sample Co 19","sampleco19.example","new","200-store grocery chain · competitor SMS detected · quality 84"],
 ["Sample Co 1","sampleco1.example","dup","Already yours — this is Sample Contact from growth, attached to the account"],
 ["Sample Co 20","sampleco20.example","new","UAE logistics · WhatsApp listed on site · quality 71"],
 ["gmail.com","rakesh.k@gmail.com","junk","Free mail domain, no company · suppressed"],
 ["Sample Co 23","sampleco23.example","dup","Already a customer under Sample Rep 3 since Aug"],
 ["Sample Co 21","sampleco21.example","new","Diagnostics chain · app with phone login, no OTP provider · quality 78"],
 ["Sample Co 22","sampleco22.example","new","US retail · Klaviyo for email, nothing for SMS · quality 66"]];

const PARTNERS=[
 ["Sample Partner 1","CB","India",14,"₹18,40,000",["SMS ₹11,20,000","OTP ₹4,80,000","WhatsApp ₹2,40,000"]],
 ["Sample Partner 2","GT","UAE",9,"AED 214,000",["OTP AED 128,000","SMS AED 61,000","WhatsApp AED 25,000"]],
 ["Sample Partner 3","MD","Singapore",7,"S$88,200",["EMAIL S$46,000","SMS S$42,200"]],
 ["Sample Partner 4","NC","United States",5,"$61,400",["EMAIL $38,900","WHATSAPP $22,500"]],
 ["Sample Partner 5","VR","India",3,"₹4,60,000",["SMS ₹4,60,000"]]];

ASK.teamall={q:"Every account my team is handling",big:"486",
 h:"Across 25 people, with what is open on each.",
 p:"Sorted by what needs attention first. Forty-six have nobody on them.",
 cols:["Account","Owner","State","Open","Last touch"],
 rows:[["Sample Co 2","Sample Rep 2","rate decision pending","1 overdue","today"],
  ["Sample Co 6","Rhea Menon","declining","recovery held","22d"],
  ["Sample Co 10","Sample Rep 3","declining","nothing open","94d"],
  ["Sample Co 15","unassigned","growing","contract with legal","16d"],
  ["Sample Co 7","Rhea Menon","blocked on DLT","day 9","today"],
  ["Sample Co 3","Rhea Menon","recovering","1 promise due","1d"],
  ["Sample Co 11","Rhea Menon","renewal out","waiting on finance","8d"],
  ["Sample Co 14","unassigned","outbound","cooling","6d"],
  ["Sample Co 12","Sample Rep 4","onboarding","week 3 of 4","2d"],
  ["Sample Co 1","Rhea Menon","growing","WhatsApp pitch","2d"]],
 act:"Open the unassigned 46",
 st:["Rhea Menon","today 09:30","Sales team","manager view","payments masked"]};
ASK.partners={q:"Revenue by partner this month",big:"₹64.2L",
 h:"Thirty-eight accounts across five partners.",
 p:"Native currency only. Sample Partner 1 alone is 29% of partner-sourced revenue.",
 cols:["Partner","Country","Accounts","Received","First value"],
 rows:PARTNERS.map(x=>[x[0],x[2],String(x[3]),x[4],["9 days","11 days","14 days","12 days","21 days"][PARTNERS.indexOf(x)]]),
 act:"Send each partner their digest",
 st:["Rhea Menon","today 09:32","Partner motion","no conversion applied"]};


const WRONG=["Not important","Wrong person","Already handled","Bad information","Wrong timing"];

let REPS=[["Rhea Menon","RM","18 companies · India, Singapore",1],
 ["Sample Rep 2","SQ","22 companies · India",0],["Sample Rep 3","AN","64 companies · India, UAE",0],
 ["Sample Rep 4","PS","51 companies · Singapore, US",0],["Sample Rep 5","NK","19 companies · India",0]];

ASK.cold={q:"Which accounts have not been touched in 60 days?",big:"7",
 h:"Seven, and four of them are still paying.",
 p:"Sorted by how long the silence has run. Three belong to the unassigned book.",
 cols:["Company","Last touch","Owner","Products","State"],
 rows:[["Sample Co 10","94 days","Sample Rep 3","SMS, OTP","declining"],
  ["Sample Co 17","81 days","Sample Rep 4","EMAIL","quiet"],
  ["Sample Co 14","76 days","unassigned","SMS","quiet"],
  ["Sample Co 11","71 days","Rhea Menon","OTP","quiet"],
  ["Sample Co 13","68 days","unassigned","SMS, CAMPAIGN","quiet"],
  ["Sample Co 12","64 days","Sample Rep 4","EMAIL, OTP","onboarding"],
  ["Sample Co 15","61 days","unassigned","WHATSAPP","growing"]],
 act:"Create outreach missions for all seven",
 st:["Rhea Menon","today 09:22","Sales team","fresh to 09:20"]};
ASK.all={q:"All my companies",big:"18",
 h:"Everything you own, sorted by what needs you.",
 p:"Eight have something open. Ten are quiet and healthy.",
 cols:["Company","Country","Motion","State","Last touch"],
 rows:BOOK.map(function(b){return [b[1],b[2],b[3],b[4],["2d","today","1d","today","3w","22d","9d","today","11d","94d","71d","6d","68d","76d","61d","4d","81d","1d"][BOOK.indexOf(b)]];}),
 act:"Export is disabled — ask for a reason first",
 st:["saved lens","Rhea Menon","today 09:05","your accounts","recomputed on open"]};
ASK.churn.cols=["Company","Signal","Owner","Silence","Effort"];
ASK.churn.rows=[["Sample Co 6","SMS -35% / 14d","Rhea Menon","22d","3d"],
 ["Sample Co 5","WhatsApp 0 since 14 Aug","Rhea Menon","19d","1d"],
 ["Sample Co 10","SMS -28% / 21d","Sample Rep 3","31d","28d"],
 ["Sample Co 7","never sent · day 9","Rhea Menon","2d","today"]];

let HISTORY=[
 [1,"All my companies","pinned · asked 34 times by 6 people · today 09:05","all"],
 [1,"Partner motion, this month","pinned · asked 12 times by 3 people · today 09:15","partner"],
 [0,"Which accounts have not been touched in 60 days?","asked 6 times by 2 people · today 09:22","cold"],
 [0,"Who is most likely to churn this month?","asked 9 times by 4 people · today 09:12","churn"],
 [0,"UAE entity, this quarter","asked 4 times by 2 people · yesterday","uae"],
 [0,"Whose accounts are flat?","asked 3 times by 1 person · yesterday","flat"],
 [0,"Which startups are stuck before their first message?","asked 2 times by 1 person · 04 Sep","stuck"]];
HISTORY.splice(2,0,[0,"What is in flight?","asked 11 times by 4 people · today 09:26","flight"]);

/* ── pinned questions ──────────────────────────────────────────────────────
   A pin is the one thing on this surface a person changes and expects to find
   again. The database connection is SELECT-only, so there is nowhere on the
   server to put it; localStorage keeps a pin across reloads without inventing
   a write endpoint for it.

   `q` holds overrides for catalogue questions, so unpinning one that ships
   pinned sticks too — a plain list of pinned ids could not express that.
   `typed` holds free-text questions, which have no catalogue id at all. */
const PINKEY="pulse.pins";
let PINS={q:{},typed:[]};
try{const raw=JSON.parse(localStorage.getItem(PINKEY)||"{}");
 PINS={q:raw.q&&typeof raw.q==="object"?raw.q:{},typed:Array.isArray(raw.typed)?raw.typed:[]};}
catch(err){/* private mode, or someone else's JSON — start clean */}
function savePins(){try{localStorage.setItem(PINKEY,JSON.stringify(PINS));}catch(err){}}

/* A typed question is re-asked when it is opened, so the text has to survive
   alongside the row that stands for it. */
const TYPEDQ={};

/* Fold the stored pins onto HISTORY. Runs again whenever the live layer
   replaces HISTORY with the real catalogue, which is why it must be
   idempotent — a second pass must not duplicate the typed rows. */
function applyPins(){
 HISTORY.forEach(h=>{if(PINS.q[h[3]]!=null)h[0]=PINS.q[h[3]]?1:0;});
 PINS.typed.forEach((text,i)=>{
  const id="__typed:"+i;
  TYPEDQ[id]=text;
  const at=HISTORY.findIndex(h=>h[3]===id);
  const row=[1,text,"typed question · re-runs when opened",id];
  if(at>=0)HISTORY[at]=row;else HISTORY.unshift(row);});
 /* A pin that was removed leaves its row behind otherwise. */
 for(let i=HISTORY.length-1;i>=0;i--){
  const id=HISTORY[i][3];
  if(typeof id==="string"&&id.startsWith("__typed:")&&!TYPEDQ[id])HISTORY.splice(i,1);}
}

/* Pin or unpin whatever answer is on screen. A catalogue question flips its
   own row; a typed question has no row until it is pinned, which is the whole
   point — pinning is what puts it into Asked. */
function togglePin(){
 if(S.ask==="__custom"){
  const q=((ASK.__custom||{}).q||"").trim();
  if(!q)return;
  const at=PINS.typed.indexOf(q);
  if(at>=0){delete TYPEDQ["__typed:"+at];PINS.typed.splice(at,1);
   /* The ids are positional, so everything after a removal shifts. */
   Object.keys(TYPEDQ).forEach(k=>delete TYPEDQ[k]);
   for(let i=HISTORY.length-1;i>=0;i--)
    if(String(HISTORY[i][3]).startsWith("__typed:"))HISTORY.splice(i,1);}
  else PINS.typed.push(q);
 } else {
  const row=HISTORY.find(h=>h[3]===S.ask);
  PINS.q[S.ask]=row&&row[0]?0:1;
 }
 savePins();applyPins();render();
}
applyPins();


ASK.mine={q:"My open promises and missions",big:"11",
 h:"Three promises, eight missions. One promise is late.",
 p:"Pulse pulled every one of these out of your mail, calls and notes. Nothing here was typed by hand.",
 cols:["Type","What","Account","Due","Status"],
 rows:[["promise","Reply to Dr. Sample Contact","Sample Co 2","2 Sep","4 days late"],
  ["promise","Send the incident note","Sample Co 3","today 17:00","due today"],
  ["promise","Send the WhatsApp pricing sheet","Sample Co 1","Fri","on track"],
  ["mission","Qualify · rate decision","Sample Co 2","—","blocked on you"],
  ["mission","Protect revenue","Sample Co 6","—","draft held"],
  ["mission","Grow product · WhatsApp","Sample Co 1","—","open"],
  ["mission","Grow product · WhatsApp","Sample Co 4","—","waiting on them"],
  ["mission","Repair relationship","Sample Co 3","—","open"],
  ["mission","First value","Sample Co 7","—","blocked on DLT"],
  ["mission","Solve issue · WhatsApp paused","Sample Co 5","—","blocked on you"],
  ["mission","Qualify","Sample Co 8","—","clock running"]],
 act:"Deal with the late one first",
 st:["Rhea Menon","today 09:34","your accounts","fresh to 09:33"]};
ASK.teammine={q:"Open promises and missions across the team",big:"214",
 h:"Forty-one promises, 173 missions. Nine promises are late.",
 p:"Late promises are the one number I would watch. They are the difference between a team that is busy and a team that is trusted.",
 cols:["Owner","Late","Due this week","Missions","Blocked"],
 rows:[["Rhea Menon","1","2","8","3"],["Sample Rep 2","0","4","11","2"],
  ["Sample Rep 3","4","1","19","7"],["Sample Rep 4","2","3","14","4"],
  ["Sample Rep 5","1","2","9","1"],["unassigned","1","0","6","6"]],
 act:"Look at Sample Rep 3's four",
 st:["Rhea Menon","today 09:35","Sales team","manager view"]};

HISTORY.splice(2,0,[1,"Every account my team is handling","pinned · asked 22 times by 5 people · today 09:30","teamall"]);
HISTORY.splice(3,0,[1,"Revenue by partner this month","pinned · asked 9 times by 3 people · today 09:32","partners"]);
HISTORY.splice(1,0,[1,"My open promises and missions","pinned · asked 41 times by 18 people · today 09:34","mine"]);
HISTORY.splice(4,0,[0,"Open promises and missions across the team","asked 14 times by 4 people · today 09:35","teammine"]);
PINNED.me=[["Your open promises and missions","Three promises, eight missions","11","1 late",null,"mine"]];
PINNED.team.splice(1,0,["Promises across the team","Late promises, by owner","9 late","41 open",null,"teammine"]);
PINNED.team.unshift(["Every account your team handles","486 accounts, 46 with nobody on them","486","46 unassigned",null,"teamall"]);
PINNED.company.splice(1,0,["Revenue by partner","Five partners, native currency","₹64.2L","+ AED 214k · $61k · S$88k",null,"partners"]);
CARDS.push({s:"team",w:1,r:"Watch closely",cust:"Startup approvals",geo:"India · Startup",
 h:"34 startup approvals since 1 August.",
 y:'Your team approved them and the credits are already live. Nothing needs you — but <span class="l1">one</span> was above the usual staff limit.',
 a:"Look through them",solid:0,
 rev:[["Why you are seeing this","Monthly FYI. Approvals do not wait for a manager."],
  ["Total credit granted","₹1,85,000 across 34 accounts"],
  ["Worth a look","Sample Co 23 · 34 staff · ₹10,000 · approved by Sample Rep 3 on 24 Aug"],
  ["Reverting","Not wired up yet — there is no revert endpoint behind it."]]});

/* Detail behind a Live or AI-log row. The rows stay scannable; this is what
   opens in the right-hand panel. Keyed by timestamp — Live and the AI log
   describe the same events, so they share one record. */
const LOGDET={
"09:14":{subj:"Sample Co 6",act:"Risk detected · recovery mail drafted",conf:.81,
 src:[["SMS −35% over 14 days","reports"],["No inbound reply in 22 days","gmail"],["3 outbound attempts","gmail"]],
 pol:"Partner · protect revenue · v4",
 out:"Drafted a recovery mail and held it. The last two drafts to this account were edited before sending, so this one waits for a person.",
 fyi:"Rhea Menon",next:"Nothing goes out until you release it."},
"09:11":{subj:"Sample Co 5",act:"Two missions merged into one",conf:.88,
 src:[["Open protect-revenue mission","pulse"],["WhatsApp volume 0 since 14 Aug","reports"]],
 pol:"Inbound · one mission per story · v2",
 out:"Both signals described the same WhatsApp pause. The duplicate was suppressed so the owner sees one card, not two.",
 fyi:"",next:"The surviving mission keeps both evidence trails."},
"09:04":{subj:"Sample Co 7",act:"Chased the DLT desk · ninth follow-up",conf:.95,
 src:[["Header NOVAFD pending 9 days","DLT desk"],["Zero messages sent since signup","reports"]],
 pol:"Startup · chase DLT daily · v3",
 out:"Escalated to the operator SPOC on day 7. I chase this every morning until the header clears.",
 fyi:"Rhea Menon",next:"Day 12 with no first message hands this to you."},
"08:59":{subj:"Sample Co 9",act:"Answered a rate question",conf:.94,
 src:[["Question matched India rate card v7","billing"],["No margin exception required","billing"]],
 pol:"Inbound · standard rate replies · v7",
 out:"Sent from rep2@msg91.com under her signature. Inside policy, so no approval was needed.",
 fyi:"Sample Rep 2",next:"If they push below the floor it comes back to a person."},
"08:52":{subj:"Sample Co 1",act:"Duplicate signup merged",conf:.91,
 src:[["Third signup from sampleco1.example","signup form"],["Different department, same domain","signup form"]],
 pol:"Inbound · never create a duplicate company · v2",
 out:"Attached to the existing company. A signup from a customer is a conversation, not a new lead — no sequence was started.",
 fyi:"",next:"Shows on the account as a new contact, not a new deal."},
"08:47":{subj:"14 new signups",act:"Scored every signup",conf:.9,
 src:[["Domain, company size, pages read, UTM","signup form"],["Stack detection","enrichment"]],
 pol:"Inbound · score within 60 seconds · v9",
 out:"One crossed the call threshold — Sample Co 8 at 91. Four were suppressed below 40. Nine entered the nurture sequence.",
 fyi:"Rhea Menon",next:"The suppressed four are reviewable under Filtered."},
"08:40":{subj:"Sample Co 10",act:"Could not decide · escalated",conf:.42,
 src:[["SMS −28% over 30 days","reports"],["No reply in 31 days","gmail"],["No ticket, invoice paid","billing"]],
 pol:"Outbound · escalate below 0.60 · v5",
 out:"Three rules matched and disagreed on the cause of the drop. Rather than guess at a recovery play, I handed it to Sample Rep 3.",
 fyi:"Sample Rep 3",next:"Waiting on Sample Rep 3. I will not act on this account meanwhile."},
"08:31":{subj:"Sample Co 4",act:"Set itself a follow-up timer",conf:.86,
 src:[["Quote sent 09:18 yesterday","pulse"],["No reply yet","gmail"]],
 pol:"Inbound · one nudge then hand back · v3",
 out:"If Sample Contact has not replied by Thursday I nudge once, then this comes back to you. I will not chase a quote twice.",
 fyi:"",next:"Fires Thursday 09:00 unless he replies first."},
"08:22":{subj:"Experiment E-014",act:"Promoted variant B to default",conf:.97,
 src:[["+18% reply rate over 240 sends","pulse"],["Significant at p<0.05","pulse"]],
 pol:"Recovery mails · subject line · v7 → v8",
 out:"Variant B is now the default on recovery mails. The old subject line is kept and can be restored.",
 fyi:"",next:"Next review at 500 sends."},
"08:04":{subj:"AE route · Etisalat",act:"Failed over to the backup route",conf:.99,
 src:[["Delivery latency above threshold","reports"],["Etisalat degraded","carrier status"]],
 pol:"Delivery · fail over above 3s latency · v6",
 out:"Switched at 08:04 with zero messages lost. No customer was contacted — there was nothing to disclose.",
 fyi:"",next:"Returns to the primary route when latency holds under 1s for an hour."},
"07:51":{subj:"Sample Co 13",act:"Recovery complete · mission closed",conf:.93,
 src:[["Volume at 94% of baseline","reports"],["3 touches over 18 days","gmail"]],
 pol:"Inbound · close on recovery · v4",
 out:"Outcome recorded against the recovery playbook. This is the third account this quarter recovered without a person.",
 fyi:"Rhea Menon",next:"Watching volume for 14 more days before I stop looking."}};

/* The typed question is the one string on this surface a person composed, and
   it goes straight into innerHTML. Escaped so a stray < or & renders as itself
   rather than as markup. */
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>
 ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);}

function hue(n){let h=7;for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))%360;return h;}
function ini(n){const w=n.replace(/[^A-Za-z ]/g,"").trim().split(/\s+/);
 return ((w[0]||"?")[0]+(w[1]?w[1][0]:(w[0]||"?")[1]||"")).toUpperCase();}
function LOGO(n,sz){sz=sz||24;const h=hue(n);
 return `<span class="clogo" style="width:${sz}px;height:${sz}px;font-size:${Math.max(8,Math.round(sz*.38))}px;background:hsl(${h} 38% 87%);color:hsl(${h} 52% 30%)">${ini(n)}</span>`;}
function AVI(n,sz){sz=sz||24;const h=(hue(n)+140)%360;
 return `<span class="uavi" style="width:${sz}px;height:${sz}px;font-size:${Math.max(8,Math.round(sz*.36))}px;background:hsl(${h} 30% 84%);color:hsl(${h} 45% 26%)">${ini(n)}</span>`;}
/**
 * Is this name a person rather than a company?
 *
 * This used to be a fixed list of the prototype's ten sample rep names. Once
 * the reps became real — STANDINGS and REPS are replaced wholesale out of
 * ms_user + user_handled_by — no real rep's name was ever in it, so MARK()
 * fell through to "" and every real person on the team surfaces rendered with
 * no avatar at all, while the sample names it still held could never appear.
 * It was a list of exactly the wrong ten names.
 *
 * Asked of the live rosters instead, with the signed-in person included:
 * they are a person on their own profile even before a roster loads.
 */
function isPerson(n){
 if(!n)return false;
 if(ME&&ME.name===n)return true;
 if(typeof STANDINGS!=="undefined"&&STANDINGS.some(r=>r[0]===n))return true;
 if(typeof REPS!=="undefined"&&REPS.some(r=>r[0]===n))return true;
 return false;
}
function MARK(n,sz){if(CUST[n]||BOOK.some(b=>b[1]===n))return LOGO(n,sz);
 if(isPerson(n))return AVI(n,sz);return "";}

/* ══════════════════════════════════════════════════════════════════
   The score band, the board and the season · ported from pulse-v2-game
   ══════════════════════════════════════════════════════════════════ */
const GAME={
 me:{label:"Your game",kept:"₹96.2L",keptSub:"running revenue still with you, across 18 accounts",
  atRisk:"2 accounts worth ₹8.1L are slipping",
  mate:["Pulse played 47 moves for you today","14 signups scored, 4 junk suppressed, 9 chases, 1 rate question answered, 1 subject line promoted"]},
 team:{label:"The team",kept:"₹4.81Cr",keptSub:"running revenue across 486 accounts",
  atRisk:"11 accounts worth ₹62L are slipping",
  mate:["Pulse played 612 moves for the team today","Across 25 people. 63 of 1,842 signals this month needed a person at all."]},
 company:{label:"MSG91",kept:"₹6.2Cr",keptSub:"running revenue across four entities",
  atRisk:"nine customers were hit by yesterday's UAE outage",
  mate:["Pulse played 4,180 moves this week","96.6% of everything that happened was resolved without a person touching it."]}};

const POINTS=[
 ["₹22L","46 accounts have nobody on them","Eleven are in your countries and three are sending well. Whoever claims them owns the revenue. This is the single biggest pile of points on the board.","Claim three"],
 ["₹5.8L","Sample Co 1 has never touched WhatsApp","400k SMS a month, and Sample Contact asked about WhatsApp in July. Eight accounts with this profile grew messaging spend 38% within two quarters.","See the pitch"],
 ["₹4.1L","Sample Co 10 left in March, and their new CTO used us before","Sample Contact joined from Sample Co 9 in July, where he ran our OTP integration himself. Sample Rep 3 still owns it and has not touched it in 94 days.","Read the story"],
 ["protects ₹19L","Five accounts where you only know one person","If Sample Contact leaves Sample Co 5 you lose the account. Single-thread accounts churn at roughly twice the rate.","Who to meet"],
 ["₹3.2L","Fourteen companies look like your best customers","Closest is Sample Co 19 — 200 stores, competitor SMS, an app with phone login and no OTP provider I can find.","Look at them"],
 ["—","You lose most often on rate","Two of your last four. Both times you countered once and stopped. Sample Rep 2 holds ₹0.121 by leading with term length.","Ten minutes on this"]];

/* [score, change this month, band] */
const HEALTH={
"Sample Co 1":[78,6,"thriving"],"Sample Co 9":[84,2,"thriving"],"Sample Co 15":[81,9,"thriving"],
"Sample Co 13":[76,1,"thriving"],"Sample Co 18":[74,12,"thriving"],"Sample Co 3":[73,-4,"thriving"],
"Sample Co 4":[68,5,"steady"],"Sample Co 2":[66,0,"steady"],"Sample Co 11":[61,-2,"steady"],
"Sample Co 12":[64,7,"steady"],"Sample Co 16":[58,3,"steady"],"Sample Co 14":[57,1,"steady"],
"Sample Co 17":[55,-1,"steady"],"Sample Co 8":[52,52,"steady"],
"Sample Co 5":[43,-11,"wobbling"],"Sample Co 7":[41,-3,"wobbling"],"Sample Co 10":[38,-6,"wobbling"],
"Sample Co 6":[29,-15,"risk"]};
const BANDS=[
 ["thriving","Thriving","#4C7A52",2,"multi-product, more than one contact"],
 ["steady","Steady","#1E75B9",0,"healthy but single-threaded"],
 ["wobbling","Wobbling","#B79A46",-1,"something changed, nobody fixed it"],
 ["risk","At risk","#A8462A",0,"Sample Co 6 — 22 days silent"]];
/* Playing a card moves the account. Keyed by card subject. */
const CARDMOVE={
 "Sample Co 8":["up","52 → 66","first call inside ten minutes"],
 "Sample Co 2":["up","66 → 79","a rate answered closes the loop and unblocks 11L a month"],
 "Sample Co 3":["hold","73 → 58 if you stay quiet","an unacknowledged outage is how trust goes"],
 "Sample Co 4":["up","68 → 77","a second product is the strongest health signal there is"],
 "Sample Co 5":["up","43 → 58","knowing why turns a mystery into a fixable problem"],
 "Sample Co 1":["up","78 → 88","a second department means the account survives one person leaving"],
 "Sample Co 6":["hold","29 → 18 if nothing changes","every silent day costs about a point"],
 "Sample Co 7":["up","41 → 63","the day they send their first message"]};
const HMOVERS=[
 ["Sample Rep 2","+21","up",0],["Sample Rep 4","+16","up",0],["Rhea Menon","+14","up",1],
 ["Sample Rep 5","+9","up",0],["Sample Rep 6","+4","up",0],["Sample Rep 3","−7","down",0]];
const HKEPT=[
 ["Sample Rep 4","3","up",0],["Rhea Menon","3","up",1],
 ["Sample Rep 2","1","up",0],["Sample Rep 3","−2","down",0]];

/* The lens reads country and motion off the sample book. Live data replaces
   BOOK with the real accounts, and the board is still keyed to HEALTH's
   eighteen — so keep a snapshot to look them up in. */
const LENS_BOOK=BOOK.map(b=>b.slice());

/* ⌘K's resting state: the saved views, by state. */
const STATEOF={"Sample Co 1":"growing","Sample Co 2":"needs","Sample Co 3":"needs",
"Sample Co 4":"flight","Sample Co 5":"needs","Sample Co 6":"needs","Sample Co 7":"flight",
"Sample Co 8":"needs","Sample Co 9":"quiet","Sample Co 10":"needs","Sample Co 11":"flight",
"Sample Co 12":"setup","Sample Co 13":"quiet","Sample Co 14":"flight","Sample Co 15":"growing",
"Sample Co 16":"setup","Sample Co 17":"quiet","Sample Co 18":"setup"};
const LASTTOUCH={"Sample Co 1":"2d","Sample Co 2":"today","Sample Co 3":"1d","Sample Co 4":"today",
"Sample Co 5":"3w","Sample Co 6":"22d","Sample Co 7":"9d","Sample Co 8":"today","Sample Co 9":"11d",
"Sample Co 10":"94d","Sample Co 11":"71d","Sample Co 12":"6d","Sample Co 13":"68d","Sample Co 14":"76d",
"Sample Co 15":"61d","Sample Co 16":"4d","Sample Co 17":"81d","Sample Co 18":"1d"};
const VIEWS=[
 ["all","Your accounts","AC",18,null],
 ["needs","Needs you now","!",6,"needs"],
 ["flight","In flight","→",4,"flight"],
 ["setup","Setting up","○",3,"setup"],
 ["growing","Growing","↗",2,"growing"],
 ["quiet","Quiet and healthy","·",3,"quiet"],
 ["unowned","Nobody on them","?",46,"__unowned"],
 ["everything","Every account at MSG91","∀",486,"__all"]];
VIEWS.forEach(function(v){
 const key=v[0],label=v[1],st=v[4];
 let rows;
 if(st==="__unowned"){
  rows=[["Sample Co 15","UAE","Partner","growing on WhatsApp","61d"],
   ["Sample Co 14","US","Outbound","first invoice paid","76d"],
   ["Sample Co 13","India","Inbound","campaign heavy","68d"],
   ["Sample Co 10","India","Outbound","volume dropped","94d"],
   ["Sample Co 20","UAE","Inbound","new from the event list","2d"]];
 } else if(st==="__all"){
  rows=LENS_BOOK.slice(0,10).map(b=>[b[1],b[2],b[3],b[4],LASTTOUCH[b[1]]||"—"]);
 } else {
  rows=LENS_BOOK.filter(b=>!st||STATEOF[b[1]]===st).map(b=>[b[1],b[2],b[3],b[4],LASTTOUCH[b[1]]||"—"]);
 }
 ASK["v_"+key]={q:label,big:String(v[3]),
  h:key==="all"?"Everything you own, sorted by what needs you.":
    key==="unowned"?"Unassigned since Sample Rep 9 left, fourteen days ago.":
    key==="everything"?"Across 25 people and four entities.":label+".",
  p:key==="unowned"?"Three of them asked a question in that time and nobody answered. Anyone can claim one.":
    key==="everything"?"Showing the first ten. Narrow it by asking a question instead of scrolling.":
    "Sorted by what needs you first.",
  cols:["Account","Country","Motion","State","Last touch"],rows:rows,
  act:key==="unowned"?"Claim the three that are sending":"Create missions for the selected",
  st:["Rhea Menon","today 09:40",key==="everything"?"all teams":"your accounts","recomputed on open"]};
});

const S={v:"now",scope:"me",tab:"activity",ask:"mine",teamTab:"won",from:null,cust:null,doneOpen:0,flightOpen:1,roomOpen:0,newRep:0,askTab:"ask",ostep:0,editRule:null,addingTo:null,act:"all",openRow:null,sel:new Set(),doneIds:new Set(),snoozeIds:new Map(),lensAll:0,C:new Set(),M:new Set(),eaEvent:"",moOpen:new Set()};
const main=$("#main");
/* Opportunities dismissed with "Not now", by their headline. Keyed by text
   rather than index because the list is rebuilt from live data on every load
   and an index would dismiss whatever moved into that slot. */
S.roomOff=new Set();
/* Tags picked in the Add-a-tag sheet before it is saved. */
S.tagPick=new Set();
/* Autopilot proposals already answered, so an answered one stops asking. */
S.prDone=new Set();

/* One country and one motion at a time — see the note on GEO. The label shows
   the flag and the currency, so the symbol on every number below it is
   accounted for rather than left to be guessed at. */
function lensLab(){const c=lensCountry(),m=[...S.M][0]||null;
 if(!c&&!m)return "All";
 const cur=c?lensCur():null;
 const cl=c?(lensFlag(c)+" "+c+(cur?" · "+cur:"")):null;
 return [cl,m].filter(Boolean).join(" · ");}
/**
 * The live board, or null while it is still loading / when the prototype runs
 * standalone. Shape: /api/pulse/board's `board`.
 */
let BOARD=null;

/* Money, native currency, never summed across currencies. */
const CUR={INR:"₹",AED:"AED ",USD:"$",SGD:"S$",GBP:"£",EUR:"€"};

/* The four countries the lens offers, each with the flag shown beside its name
   and the currency its accounts actually transact in. The lens is single-select
   precisely so this mapping is unambiguous: two countries at once would mean
   two currencies, and this product never converts between them. */
const GEO={
 India:{flag:"🇮🇳",cur:"INR"},
 UAE:{flag:"🇦🇪",cur:"AED"},
 US:{flag:"🇺🇸",cur:"USD"},
 Singapore:{flag:"🇸🇬",cur:"SGD"},
 UK:{flag:"🇬🇧",cur:"GBP"},
 Europe:{flag:"🇪🇺",cur:"EUR"}};
/* Currency → country, so a live account can be placed from the only country
   signal the database carries. */
const CUR2GEO={};Object.keys(GEO).forEach(k=>{CUR2GEO[GEO[k].cur]=k;});

/* Which countries the lens offers.
   Every country the customer base is actually in, commonest first, from
   /api/pulse/bootstrap. Deriving it from the board was wrong twice over: the
   board scores one page of 200, and 190 of those carry no country at all, so
   the menu showed India and Unknown while the book spans 65 countries. */
const GEO_UNKNOWN="Unknown";
/* "me" only ever needs the countries this rep's own book is actually in —
   the company-wide list otherwise, since "team" and "company" both show
   every account with no ownership restriction (see board/route.ts). */
function lensCountrySource(){
 if(!window.PulseLive)return null;
 return S.scope==="me"?PulseLive.state.myCountries:PulseLive.state.countries;}
function lensCountries(){
 const live=lensCountrySource();
 if(!live||!live.length)return [...GEO_ALL];
 const names=live.filter(c=>c.name).map(c=>c.name);
 if(live.some(c=>!c.name))names.push(GEO_UNKNOWN);
 S.C.forEach(c=>{if(names.indexOf(c)<0)names.push(c);});
 return names;}

/* What the lens actually lists, before "Show all N countries" is pressed.
   lensCountries() carries every country the base is in — commonest first,
   per its own comment — which on the live data is ~65 rows, most of them at
   zero. Collapsing to the ones with an account (plus whatever is already
   picked, so clearing the lens never hides the current selection) keeps the
   menu to the countries that matter; the toggle below reveals the rest. */
const LENS_COLLAPSE_AT=12;
function lensCountriesShown(){
 const all=lensCountries();
 if(S.lensAll||all.length<=LENS_COLLAPSE_AT)return all;
 const nonzero=all.filter(c=>lensTotal(c)!==0||S.C.has(c));
 return nonzero.length?nonzero:all.slice(0,LENS_COLLAPSE_AT);}

/* How many accounts are in that country, in whichever scope's book applies. */
function lensTotal(c){
 const live=lensCountrySource();
 if(!live)return null;
 const hit=live.find(x=>(x.name||GEO_UNKNOWN)===c);
 return hit?hit.accounts:0;}

/* Its flag, from whichever account carries one. */
function lensFlag(c){
 if(c===GEO_UNKNOWN)return "🏳";
 const live=lensCountrySource();
 if(live){const hit=live.find(x=>x.name===c);if(hit&&hit.flag)return hit.flag;}
 if(BOARD&&BOARD.bands)for(const b of BOARD.bands)for(const a of b.accounts)
  if(a.country===c&&a.countryFlag)return a.countryFlag;
 return (GEO[c]&&GEO[c].flag)||"";}

const GEO_ALL=["India","UAE","US","Singapore","UK","Europe"];
function lensCountry(){const c=[...S.C];return c.length?c[0]:null;}
/* Its currency code, and the symbol every amount is written in while it is on. */
/* The currency to write amounts in while a country is picked: the one most of
   that country's accounts are actually billed in, read off the board rather
   than assumed from the country's name. Null when they disagree or the board
   has not answered — then each row keeps its own. */
function lensCur(){
 const c=lensCountry();if(!c)return null;
 if(BOARD&&BOARD.bands){
  const n=new Map();
  BOARD.bands.forEach(b=>b.accounts.forEach(a=>{
   if((a.country||GEO_UNKNOWN)!==c||!a.currency)return;
   const k=String(a.currency).toUpperCase();n.set(k,(n.get(k)||0)+1);}));
  if(n.size){const best=[...n].sort((x,y)=>y[1]-x[1]);return best[0][0];}}
 return GEO[c]?GEO[c].cur:null;}
function lensSym(){const k=lensCur();return k?CUR[k]:null;}
function flagOf(c){return c&&GEO[c]?GEO[c].flag:"";}
/* The currency, in order: what the row itself carries, then the country the
   lens is on, then INR. The last step is not a new assumption — the lakh/crore
   branch below was already the no-currency default; it just used to render the
   number with no symbol at all, which is the one thing money must never do. */
function purse(n,c){c=c||lensCur()||"INR";const sym=CUR[c]||(c?c+" ":"");
 if(c==="INR"||!c)return n>=1e7?sym+(n/1e7).toFixed(2)+"Cr":n>=1e5?sym+(n/1e5).toFixed(1)+"L":sym+Math.round(n).toLocaleString("en-IN");
 return sym+Math.round(n).toLocaleString("en-US");}
/* Name → currency for the accounts the live board returned. Rebuilt whenever
   BOARD is replaced, which is the only time it can change. */
let BCUR=null,BCTRY=null,BCURSRC=false;
function boardIndex(){
 if(BCURSRC!==BOARD){BCUR=new Map();BCTRY=new Map();BCURSRC=BOARD;
  if(BOARD&&BOARD.bands)BOARD.bands.forEach(b=>b.accounts.forEach(a=>{
   if(a.currency)BCUR.set(a.name,String(a.currency).toUpperCase());
   BCTRY.set(a.name,a.country||GEO_UNKNOWN);}));}}
function boardCurOf(name){boardIndex();return BCUR.get(name)||null;}
function boardCountryOf(name){boardIndex();return BCTRY.get(name)||null;}

/* The lens applied to a list of {currency, amount, accounts} rows.
   These come from the server as an aggregate over every scored account, so
   without this the money beside the board went on describing the whole book
   while the headline count above it described one country. */
function lensRows(rows){const want=lensCountry();
 return want&&rows?rows.filter(r=>(r.country||GEO_UNKNOWN)===want):(rows||[]);}
const purses=rows=>{const u=lensRows(rows);
 return u.length?u.map(r=>purse(r.amount,r.currency)).join(" · "):"—";};

/* The lens filters every scope, not only team and company. It used to return
   your own cards unfiltered, so picking "UAE" while on Your game changed the
   label and nothing else. */
function vis(){return CARDS.filter(x=>x.s===S.scope).filter(x=>{
  const[co,mo]=x.geo.split(" · ");
  return (!S.C.size||S.C.has(co))&&(!S.M.size||S.M.has(mo));});}

/* Board membership. Country and motion come from the sample book snapshot —
   an account the lens knows nothing about stays visible rather than vanishing. */
function inLens(n){const b=BOOK.find(x=>x[1]===n)||LENS_BOOK.find(x=>x[1]===n);
 if(b)return (!S.C.size||S.C.has(b[2]))&&(!S.M.size||S.M.has(b[3]));
 /* A live account, which the sample book knows nothing about. Its currency is
    the only country signal MySQL gives us, so that is what the country half of
    the lens is checked against. Motion has no equivalent in the database, so a
    motion on its own cannot filter live accounts — they stay visible rather
    than vanishing, which is the same rule as before. */
 const want=lensCountry();if(!want)return true;
 const c=boardCountryOf(n);
 return c?c===want:true;}
/* Names in one band. Live scores when the database has answered, the
   prototype's sample map until then. */
/* Climbed and slipped, counted over the accounts the lens leaves visible. The
   server's own totals cover every scored account and cannot answer this once a
   country is picked. */
/* May the person signed in change a rule? Super admin only, and the server
   checks it again on every write — this only decides what is drawn, so nobody
   is shown a pencil that would come back 403. Defaults to true when the live
   layer is absent, so the standalone prototype still demonstrates editing. */
function canEditRules(){
 const st=window.PulseLive&&PulseLive.state;
 if(!st||!st.loaded)return true;
 return Boolean(st.can&&st.can.editRules);}
function boardMoves(){
 if(!BOARD)return {climbed:0,slipped:0};
 if(!S.C.size&&!S.M.size)return {climbed:BOARD.climbed,slipped:BOARD.slipped};
 const acc=BOARD.bands.flatMap(b=>b.accounts).filter(a=>inLens(a.name));
 return {climbed:acc.filter(a=>a.moved==="up").length,
         slipped:acc.filter(a=>a.moved==="down").length};}
function bandOf(k){
 if(BOARD){const b=BOARD.bands.find(x=>x.band===k);
  return b?b.accounts.filter(a=>inLens(a.name)).map(a=>a.name):[];}
 return Object.keys(HEALTH).filter(n=>HEALTH[n][2]===k&&inLens(n));}
function scoreOf(n){
 if(BOARD){for(const b of BOARD.bands){const a=b.accounts.find(x=>x.name===n);if(a)return a.score;}return null;}
 return HEALTH[n]?HEALTH[n][0]:null;}

/**
 * The first paint, before the database has answered.
 *
 * The prototype's sample data used to render immediately and then be replaced a
 * second later, which read as the page changing its mind. Showing the shape of
 * what is coming is honest: nothing is claimed, and nothing has to be unsaid.
 */
function skeleton(){
 const bar=(w,h,mt)=>`<div class="sk" style="width:${w};height:${h||"14px"};margin-top:${mt||"10px"}"></div>`;
 const block=()=>`<div class="skcard">${bar("30%","11px","0")}${bar("70%","22px","14px")}${bar("90%")}${bar("55%")}</div>`;
 main.innerHTML=`<div class="skwrap" aria-busy="true" aria-label="Loading">
   ${bar("34%","13px","30px")}${bar("58%","40px","16px")}
   <div style="margin-top:30px">${block()}${block()}${block()}</div></div>`;
}

/**
 * Where the reader currently is.
 *
 * render() rebuilds main.innerHTML from scratch every time, so the browser has
 * no way of telling "I moved to a different screen" from "the same screen got
 * ten more rows". This string is that difference. Everything in it is part of
 * the address — change one and you have gone somewhere new. Filters, page
 * cursors and expanded rows are deliberately NOT in it: they change what the
 * screen shows without changing which screen it is.
 */
function place(){
 return [S.v,S.cust,S.ask,S.tab,S.act,S.askTab,S.teamTab,S.partner,S.scope].join("|");
}
let LASTPLACE=null;

/* ---------------------------------------------------------------------------
 * The address bar.
 *
 * Every screen used to live at "/". Opening a company, a saved question or the
 * audit log changed S and redrew #main, and the browser was never told, so Back
 * left Pulse entirely and a refresh landed you at Now — after however many
 * clicks it took to get where you were. place() above already says which screen
 * you are on; this turns that string into a path and back again.
 *
 * The mapping is deliberately small. Only what place() counts as *somewhere*
 * gets into the URL, and the pieces that are a filter rather than a place ride
 * as a query string. Anything else — an expanded row, a page cursor, what is
 * selected — stays out, so Back never undoes half a screen.
 *
 * app/company/[name]/, app/ask/, app/autopilot/ and app/profile/ exist so these
 * paths resolve on the server too; each renders the same shell this file draws
 * into.
 */

const AUTOTABS=["activity","rules","connections","audit"];
const SCOPES=["me","team","company"];

/** Where the current state lives, as a path. */
function routePath(){
 const q=new URLSearchParams();
 let p="/";
 if(S.v==="cust"&&S.cust) p="/company/"+encodeURIComponent(S.cust);
 else if(S.v==="ask"){p="/ask/"+encodeURIComponent(S.ask||"mine");
  if(S.askTab&&S.askTab!=="ask")q.set("tab",S.askTab);}
 else if(S.v==="auto"){p="/autopilot/"+encodeURIComponent(S.tab||"activity");
  if(S.act&&S.act!=="all")q.set("filter",S.act);}
 else if(S.v==="profile") p="/profile";
 else{if(S.scope&&S.scope!=="me")q.set("scope",S.scope);
  if(S.teamTab&&S.teamTab!=="won")q.set("team",S.teamTab);}
 const s=q.toString();
 return p+(s?"?"+s:"");
}

/** What the current path asks for. Nothing here is trusted; apply() checks. */
function routeRead(){
 const seg=location.pathname.split("/").filter(Boolean).map(x=>{
  try{return decodeURIComponent(x);}catch(e){return x;}});
 const q=new URLSearchParams(location.search);
 if(seg[0]==="company"&&seg.length>1) return {v:"cust",cust:seg.slice(1).join("/")};
 if(seg[0]==="ask") return {v:"ask",ask:seg[1]||S.ask||"mine",askTab:q.get("tab")||"ask"};
 if(seg[0]==="autopilot") return {v:"auto",tab:seg[1]||"activity",act:q.get("filter")||"all"};
 if(seg[0]==="profile") return {v:"profile"};
 return {v:"now",scope:q.get("scope")||"me",teamTab:q.get("team")||"won"};
}

/* True while a URL is being turned back into state: render() must not write a
   new history entry for a move the browser has already made. */
let ROUTING=false;

/**
 * Tell the browser where we are.
 *
 * Called from render() with whether this is the same screen as last time.
 * Redrawing Now because forty more accounts arrived replaces the entry;
 * arriving somewhere new adds one, which is what Back walks.
 */
function routeSync(samePlace){
 if(ROUTING)return;
 const url=routePath();
 if(url===location.pathname+location.search)return;
 history[samePlace?"replaceState":"pushState"]({pulse:1},"",url);
}

/**
 * A screen the URL names, but the data layer has not fetched yet.
 *
 * Clicking a company or a question triggers its own fetch (see the click
 * handler at the foot of this file). Arriving by URL — a refresh, a pasted
 * link, Back — has no click to hang that on, so it is asked for here instead.
 * Assigned once PulseLive is known to exist.
 */
let routeFetch=()=>{};

/**
 * Put the state where the URL says, and draw it.
 *
 * A name that is not on the logo wall is still a real account — the wall is the
 * first forty of thousands — so it is looked up through search before the link
 * is given up on. A question or a tab that does not exist is not: those are
 * closed sets, and an unknown one falls back rather than rendering nothing.
 */
async function routeGo(){
 const r=routeRead();
 if(r.v==="cust"){
  if(!CUST[r.cust]&&window.PulseLive&&PulseLive.searchCompanies){
   try{await PulseLive.searchCompanies(r.cust,PULSE_BAG,8);}catch(e){}
  }
  /* Still nothing: the link is stale or misspelt. Show Now rather than a page
     about a company we cannot name. */
  if(!CUST[r.cust]){S.v="now";S.cust=null;
   ROUTING=true;try{history.replaceState({pulse:1},"","/");render();}finally{ROUTING=false;}
   return;}
  S.cust=r.cust;S.from=null;
 }
 if(r.v==="ask") {S.ask=(typeof ASK==="object"&&ASK[r.ask])?r.ask:S.ask;S.askTab=r.askTab==="asked"?"asked":"ask";S.sel=new Set();}
 if(r.v==="auto"){S.tab=AUTOTABS.includes(r.tab)?r.tab:"activity";S.act=r.act;}
 if(r.v==="now"){S.scope=SCOPES.includes(r.scope)?r.scope:"me";S.teamTab=r.teamTab;}
 S.v=r.v;
 ROUTING=true;
 try{render();}finally{ROUTING=false;}
 routeFetch();
}

window.addEventListener("popstate",()=>{routeGo();});

function render(){
 main.className="wrap"+(S.v==="auto"||S.v==="ask"?" wide":"");
 $("#amenu").hidden=true;
 /* Until the data layer has answered once, show the shape rather than the
    prototype's sample rows. A screen that contradicts itself two seconds later
    costs more trust than a screen that admits it is still loading. */
 if(window.PulseLive&&!PulseLive.state.loaded&&!PulseLive.state.error){skeleton();return;}
 /* Read before the rebuild: replacing innerHTML can collapse the document to a
    height shorter than the current offset, and the browser clamps the scroll
    position on the spot. */
 const here=place(), y=window.scrollY;
 ({now:vNow,ask:vAsk,auto:vAuto,cust:vCust,profile:vProfile})[S.v]();
 /* Going somewhere new starts at the top. Staying put — loading forty more
    accounts, applying a lens, clearing one — holds the reader where they were.
    The old code scrolled to the top on every render, so pressing "Load 40
    more" at the bottom of the wall threw you back to the header and you had to
    scroll past everything you had already read to reach the new rows.
    Restoring the offset rather than leaving it alone is what makes it work
    both ways: the browser has already clamped by now, and this puts it back. */
 /* The reassign sheet is an overlay: it survives a re-render of the page
    underneath it, so it is redrawn from its own state rather than being
    rebuilt only when it is opened. */
 drawReassign();
 window.scrollTo({top:here===LASTPLACE?y:0});
 /* And the address bar, which is the same question asked of the browser. */
 routeSync(LASTPLACE===null||here===LASTPLACE);
 LASTPLACE=here;
}

/* SNOOZE_MS is fixed rather than user-chosen: the prototype has no "remind me
   in…" picker, so every snooze resurfaces the card four hours out and the Done
   list says exactly when, instead of implying — like a plain "done" would —
   that the work is finished. */
const SNOOZE_MS=4*60*60*1000;
function snoozeBackText(ts){
 const ms=ts-Date.now();
 if(ms<=0)return "back any moment";
 const h=ms/3600000;
 if(h<1)return `back in ${Math.max(1,Math.round(ms/60000))}m`;
 return `back in ${h<1.5?"1h":Math.round(h)+"h"}`;
}
function cardHTML(c,i){
 const clk=c.clock?`<span class="clock" data-clk="${c.clock}">—</span>`:"";
 const btn=c.a?`<button class="go${c.solid?" solid":""}" ${c.sheet?`data-sheet="${c.sheet}"`:`data-do="${i}"`}>${c.a} →</button>`:"";
 return `<article class="card" data-w="${c.w}" id="card-${i}">
  <div class="eb"><span class="dot"></span>${c.r}</div>
  <h2>${c.h}</h2><p class="why">${c.y}</p>
  <div class="row">${clk}${btn}
   <span class="meta"><span class="lnk mkrow" data-cust="${c.cust}" role="button" tabindex="0">${MARK(c.cust,20)}${c.cust}</span><span>${c.geo}</span></span>
   <span class="qa">
    <button data-rev="${i}" aria-expanded="false">Evidence</button><span class="div"></span>
    <button data-do="${i}">Done</button>
    <button data-snooze="${i}">Snooze</button>
    <button data-reassign="${i}">Reassign</button>
    <button data-wrong="${i}" aria-expanded="false">Wrong</button></span></div>
  <div class="rev" id="rev-${i}" hidden><dl>${c.rev.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
   <div class="lg">Opened by ${ME.name||"you"} · logged</div></div>
  <div class="wrong" id="wr-${i}" hidden><p>What did I get wrong? This is the most useful thing you can tell me.</p>
   <div class="opts">${WRONG.map(w=>`<button data-wsel="${i}">${w}</button>`).join("")}</div></div>
  </article>`;
}

function vNow(){
 /* Cards are the slowest query in the app and arrive after the first paint, so
    they get their own loading state. Showing the prototype's sample cards in
    the meantime is what made the page appear to change its mind. */
 const cardsPending=Boolean(window.PulseLive&&!PulseLive.state.cardsLoaded&&!PulseLive.state.error);
 /* Three states, not two: still coming, came back empty, and did not come
    back at all. The third used to be rendered as the second — an unanswered
    question shown as the answer "nothing needs you". */
 const cardsFailed=Boolean(window.PulseLive&&(PulseLive.state.cardsError||PulseLive.state.error));
 const cards=S.newRep||cardsPending?[]:vis().filter(c=>{const idx=CARDS.indexOf(c);return !S.doneIds.has(idx)&&!S.snoozeIds.has(idx);}), n=cards.filter(c=>!c.w).length;
 const who=S.scope==="me"?"you":S.scope==="team"?"the team":"the company";
 const sl=lensLab()!=="All"?` <span class="sl">· ${lensLab()}</span>`:"";
 const g=GROWTH[S.scope];
 const G=GAME[S.scope]||GAME.me, isCo=S.scope==="company";
 const healthy=bandOf("thriving").length+bandOf("steady").length;
 const total=BOARD
  ?BANDS.reduce((n,b)=>n+bandOf(b[0]).length,0)
  :Object.keys(HEALTH).filter(inLens).length;

 /* 1 · the season, the scope and the lens — one row, above everything.
    Used to say "September · 12 days left" verbatim, always, whatever the
    actual date — a stale prototype string nobody had wired to a clock. */
 const now=new Date();
 const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
 const daysLeft=daysInMonth-now.getDate();
 const monthName=now.toLocaleString("en-US",{month:"long"});
 const head=`<div class="gtop2">
   <span class="season">${monthName} · <span class="days">${daysLeft} day${daysLeft===1?"":"s"} left</span></span>
   <span class="gswitch">${["me","team","company"].map(k=>
     `<button data-sc="${k}" aria-selected="${S.scope===k}">${GAME[k].label}</button>`).join("")}</span>
   <span class="lensw"><button class="lensb" id="lensb" data-on="${lensLab()!=="All"}">
     <span>${lensLab()}</span><span class="car">▼</span></button>
    <div class="lens" id="lensm" hidden>
     <h4>Country</h4>
     <label><span>All countries</span><input type="radio" name="lensco" data-c="" ${
      S.C.size?"":"checked"}><span class="bx"></span></label>${lensCountriesShown().map(c=>
      `<label${lensTotal(c)===0?' style="opacity:.45"':""}><span>${lensFlag(c)} ${esc(c)} <em style="font-style:normal;color:var(--faint)">${
       (t=>t==null?"":t)(lensTotal(c))}</em></span><input type="radio" name="lensco" data-c="${esc(c)}" ${
       S.C.has(c)?"checked":""}><span class="bx"></span></label>`).join("")}
     ${(()=>{const all=lensCountries().length;return !S.lensAll&&all>LENS_COLLAPSE_AT
       ?`<button class="clr" id="lensmore">Show all ${all} countries</button>`
       :S.lensAll&&all>LENS_COLLAPSE_AT?`<button class="clr" id="lensfewer">Show fewer</button>`:"";})()}
     <h4>Motion</h4>
     <label><span>All motions</span><input type="radio" name="lensmo" data-m="" ${
      S.M.size?"":"checked"}><span class="bx"></span></label>${["Inbound","Outbound","Startup","Partner"].map(m=>
      `<label><span>${m}</span><input type="radio" name="lensmo" data-m="${m}" ${
       S.M.has(m)?"checked":""}><span class="bx"></span></label>`).join("")}
     <button class="clr" id="lensc">Clear all</button></div></span></div>`;

 /* 1.5 · system exceptions.
    These are not account work, so they sit above the score rather than among
    the cards: a gateway that stopped answering is not a customer problem and
    must not queue behind one. Team and Company only — a rep is not on call for
    the infrastructure, and putting it in their morning list gets both ignored. */
 const allAlerts=(window.PulseLive&&PulseLive.state.alerts)||[];
 /* Work belongs to a person, so it shows on every scope including Me. The
    machinery — a gateway that stopped answering, a runaway rule — belongs to
    whoever runs the system, so it appears at Team and Company only. */
 const alerts=allAlerts.filter(a=>a.audience==="work"||S.scope!=="me");
 const sysband=alerts.length?`<div style="margin:26px 0 0">${alerts.map(a=>
   `<div class="sys">
     <div class="eb"><span class="dot"></span>${a.eyebrow}</div>
     <h4>${a.headline}</h4><p>${a.detail}</p>
     ${a.key==="paused"?`<div class="row"><button class="go solid" data-resume="1">Resume sending →</button></div>`
      :a.audience==="work"?`<div class="row"><button class="go solid" data-nav="auto" data-tab2="activity">Review →</button></div>`
      :`<div class="row"><button class="go" data-nav="auto" data-tab2="activity">See what happened →</button></div>`}
    </div>`).join("")}</div>`:"";

 /* 2 · where you stand, and what it protects */
 /* The board is scored per scope and arrives after the first paint. Until it
    does — or if it fails — the headline must not fall back to sample numbers:
    that is exactly the "changed its mind" bug, and it showed up whenever a
    scope switch cleared BOARD a tick before boardLoaded caught up (fixed
    below at the scope-switch handler), or whenever the board fetch itself
    failed silently. Both are now surfaced honestly instead of papered over
    with the old HEALTH sample object. */
 const boardPending=Boolean(window.PulseLive&&!PulseLive.state.boardLoaded&&!PulseLive.state.error);
 const boardReady=Boolean(BOARD);
 const skelStand=`<div class="stand2">
   <div class="sk" style="width:64%;height:40px"></div>
   <div class="sk" style="width:38%;height:14px;margin-top:16px"></div>
   <div class="sk" style="width:100%;height:10px;margin-top:18px;border-radius:5px"></div>
   <div class="sk" style="width:72%;height:13px;margin-top:16px"></div></div>
  <div class="protects"><div class="lb3">What that protects</div>
   <div class="sk" style="width:44%;height:26px"></div>
   <div class="sk" style="width:86%;margin-top:12px"></div>
   <div class="sk" style="width:64%;margin-top:8px"></div></div>`;
 const sband=boardPending?`<div class="scoreband">${skelStand}</div>`
  :!boardReady?`<div class="scoreband"><div class="stand2">
   <h1 style="color:var(--muted)">Nothing scored for this scope yet.</h1></div>
  <div class="protects"><div class="lb3">What that protects</div>
   <p style="color:var(--muted)">Nothing scored for this scope yet.</p></div></div>`
  :`<div class="scoreband"><div class="stand2">
   <h1>${healthy} of ${total} account${total===1?"":"s"} ${total===1?"is":"are"} healthy.</h1>
   ${lensLab()!=="All"?`<p class="sub2" style="color:var(--act)">Showing ${lensLab()} only.
     <button id="lensc2" style="color:var(--br);border-bottom:1px solid var(--br-s)">Clear</button></p>`:""}
   <p class="sub2">${(mv=>`<b>▲ ${mv.climbed} climbed a band this month.</b> ${
        mv.slipped===0?"None slipped.":mv.slipped===1?"One slipped.":mv.slipped+" slipped."}`)(boardMoves())}</p>
   <div class="hbar">${BANDS.map((b,i)=>`<i class="b${i+1}" style="flex:${bandOf(b[0]).length||0.2}"></i>`).join("")}</div>
   <div class="bandline">${BANDS.map(([k,l,c])=>
     `<span class="bi"><i style="background:${c}"></i><b>${bandOf(k).length}</b>${l}</span>`).join("")}</div>
   <div class="flash2" id="dflash" hidden></div></div>
  <div class="protects"><div class="lb3">What that protects</div>
   ${(()=>{const pro=lensRows(BOARD.protects),rsk=lensRows(BOARD.atRisk);
     const held=pro.reduce((n,r)=>n+r.accounts,0);
     return `<p><b>${purses(BOARD.protects)}</b>${held
       ?`spent over the last thirty days by the ${held} account${held===1?"":"s"} holding up`
       :`spent over the last thirty days — nothing here is holding up${
          lensCur()?" in "+lensCur():""}`}</p>
    <p class="rk2">${(()=>{const n=rsk.reduce((x,r)=>x+r.accounts,0);
      if(!n)return "Nothing here is wobbling or at risk.";
      return `${n} account${n===1?" is":"s are"} wobbling or at risk${
       rsk.some(r=>r.amount>0)?`, worth ${purses(BOARD.atRisk)} last month`
        :`, and ${n===1?"it":"they"} spent nothing last month`}.`;})()}</p>`;})()}</div></div>`;

 /* 3 · what to do now */
 let body;
 if(S.newRep){
  body=`<h1>Welcome, Sample Contact.</h1>
   <p class="why" style="margin-top:18px;max-width:52ch">Nothing needs you yet — you have no accounts. Four things are worth doing today, and the first one gives you something real to work on.</p>`;
 } else if(cardsFailed){
  /* The cards request failed. "Board cleared" would be a lie — nothing was
     cleared, the question was never answered — and the prototype's sample
     cards, which is what stood here before, were a bigger one. */
  body=`<div class="secn"><div class="lab">Could not load</div>
   <div class="zero">
   <h2 style="font-weight:600;font-size:26px;letter-spacing:-.024em;margin:0 0 10px">Pulse could not read what needs ${who}.</h2>
   <p>The scanners did not answer, so this is not "nothing needs you" — it is not known. ${
     esc((window.PulseLive&&PulseLive.state.cardsError)||"")}</p>
   <button class="go" id="retrycards" style="margin-top:16px">Try again →</button></div></div>`;
 } else if(!cards.length){
  const el=CARDS.filter(c=>c.s===S.scope&&!c.w).length;
  const filtered=lensLab()!=="All";
  body=`<div class="secn"><div class="lab">${filtered?"Nothing here":"Nothing needs you"}</div>
   <div class="zero">${filtered?"":`<div class="tk2">✓</div>`}
   <h2 style="font-weight:600;font-size:26px;letter-spacing:-.024em;margin:0 0 10px">${
     filtered?`Nothing needs ${who}${sl}.`:"Board cleared."}</h2>
   <p>${filtered?el+" things need "+who+" elsewhere."
     :((a=>a&&a.total?`${a.total.toLocaleString("en-IN")} decision${a.total===1?"":"s"} have been made and none of the rest need you. When you have time, here is where I would look.`
       :"Forty-seven things happened today and none of the rest need you. When you have time, here is where I would look.")(window.PulseLive&&PulseLive.state.autopilot))}</p>
   ${filtered?`<button class="go" id="clrf" style="margin-top:16px">Clear the filter →</button>`:""}</div></div>`;
 } else {
  body=`<div class="secn"><div class="lab">${n} move${n===1?"":"s"}</div>
   <div class="stack" style="margin-top:6px;border-top:none">${
    cards.map(c=>cardHTML(c,CARDS.indexOf(c))).join("")}</div></div>`;
 }

 /* The cards have not arrived. Two card-shaped placeholders say "something is
    coming here" without saying what — which is the whole point. */
 if(cardsPending&&!S.newRep){
  body=`<div class="secn"><div class="lab sk" style="width:80px;height:11px"></div>
   <div class="stack" style="margin-top:6px;border-top:none">
    ${[0,1].map(()=>`<div class="skcard">
      <div class="sk" style="width:28%;height:11px"></div>
      <div class="sk" style="width:76%;height:24px;margin-top:14px"></div>
      <div class="sk" style="width:92%;margin-top:12px"></div>
      <div class="sk" style="width:58%;margin-top:8px"></div></div>`).join("")}</div></div>`;
 }

 /* 4 · the board.
    Same three states as `sband` just above — pending / not ready / real —
    and for the same reason: this used to call bandOf(k) unconditionally,
    which falls back to the sample HEALTH object whenever BOARD is null,
    including the ordinary tick or two before a real fetch resolves. That
    made a page that had not finished loading look like it was showing
    invented companies as real ones. */
 const boardColsSkeleton=`<div class="cols4">${[0,1,2,3].map(()=>`<div class="col4">
   <div class="ch sk" style="width:60%;height:11px"></div>
   <p class="cn sk" style="width:24px;height:22px;margin-top:6px"></p>
   <div class="cv" style="margin-bottom:11px"></div>
   ${[0,1,2].map(()=>`<div class="sk" style="width:100%;height:34px;margin-top:8px;border-radius:8px"></div>`).join("")}
  </div>`).join("")}</div>`;
 const boardCols=boardPending?boardColsSkeleton
  :!boardReady?`<div class="cols4"><p style="color:var(--muted);grid-column:1/-1">Nothing scored for this scope yet.</p></div>`
  :`<div class="cols4">${BANDS.map(([k,l,c])=>`<div class="col4" data-c="${
    k==="thriving"?"landed":k==="risk"?"slipping":""}">
    <div class="ch">${l}</div><p class="cn">${bandOf(k).length}</p>
    <div class="cv" style="margin-bottom:11px"></div>
    ${bandOf(k).map(a=>`<button class="bcard" data-cust="${a}">${LOGO(a,17)}
     <span class="bn">${a}</span>${scoreOf(a)!=null?`<span class="bv">${scoreOf(a)}</span>`:""}</button>`).join("")}</div>`).join("")}</div>`;
 const boardNote=boardPending?"Loading…"
  :!boardReady?"Pulse moves these from evidence. Open any account to see which part moved."
  :`${(d=>d==="ai"?"Scored by the account-health agent. "
     :d==="mixed"?`Scored by the account-health agent for ${BOARD.aiScored} of ${BOARD.total} accounts; the rest by formula. `
     :"Scored by formula — the account-health agent is not configured. ")(BOARD.decidedBy)}${
    BOARD.formula}${BOARD.tooNew?` ${BOARD.tooNew} more on this page signed up inside thirty days and have not paid yet — too new to score.`:""}`;
 const board=`<section class="secn hard"><div class="lab">The board</div>
  ${boardCols}
  <p class="boardnote">${boardNote}</p></section>`;

 /* 5 · where to grow.
    roomRows() prefers Agent 5's month-end plays, then what is already on
    screen — the unowned count, the board's slipping accounts, drafts nobody has
    released. The prototype's rows are the last resort, not the default. */
 const grow=roomRows().slice(0,3);
 const growLive=grow!==ROOM&&grow[0]&&grow[0].length===5&&/FROM |WRITTEN BY/.test(grow[0][3]||"");
 const points=`<section class="secn"><div class="lab">Where to grow</div>
  ${growLive
   ?grow.map(([t2,h2,p2,ev,cta])=>`<div class="prow3">
     <span class="pb2"><b>${h2}</b><span>${p2}</span>
      <span style="display:block;margin-top:6px;font-size:11px;letter-spacing:.08em;color:var(--faint)">${ev}</span></span>
     <button class="go" data-opp="${encodeURIComponent(JSON.stringify([t2,h2,p2,ev,cta]))}">${cta} →</button></div>`).join("")
   :POINTS.slice(0,3).map(([v,h2,p2,cta])=>`<div class="prow3">
     <span class="pb2"><b>${h2}</b><span>${p2}</span></span>
     <button class="go" data-opp="${encodeURIComponent(JSON.stringify([v,h2,p2,"",cta]))}">${cta} →</button></div>`).join("")}
  <p class="boardnote">${growLive?"Each one is counted from the database as this page loaded."
   :"Three more below."}</p></section>`;

 /* 6 · the team.
    The prototype ranked people by movement — health points lifted this month.
    That needs a month of history Pulse has only just started recording, and
    inventing it would mean fake numbers on the one board every rep checks
    against their own memory. So this shows what is measurable today: the size
    of each book, from ms_user and user_handled_by, and says plainly that
    movement is coming. */
 const liveReps=STANDINGS.length?STANDINGS.slice(0,4):null;
 /* HMOVERS/HKEPT were the prototype's fixed sample movers — nothing populates
    them with anything real, ever, so they used to show forever whenever the
    team simply had no live reps yet. Distinguish "still loading" (show the
    same skeleton bars the rest of the page uses) from "loaded, genuinely
    nothing to show" (say so) — neither one is a fake person's name. */
 const teamPending=Boolean(window.PulseLive&&!PulseLive.state.loaded&&!PulseLive.state.error);
 const team=liveReps
  ?`<section class="secn"><div class="lab">The team</div>
   <div style="margin-top:10px">${liveReps.map(([nm,ini,sc,dl,d,me])=>`<div class="mvrow" data-me="${me}">
    <span class="mv2" data-d="up">${Number(sc).toLocaleString("en-IN")}</span>
    <span class="nm3">${AVI(nm,26)}${nm}${me?"<em>you</em>":""}</span></div>`).join("")}</div>
   <p class="boardnote">Accounts owned. Movement — who lifted a band this month — needs a month of
    history, and Pulse started recording it this week.</p></section>`
  :teamPending?`<section class="secn"><div class="lab">The team</div>
   <div style="margin-top:10px">${[0,1,2].map(()=>'<div class="sk" style="height:22px;margin-top:8px"></div>').join("")}</div></section>`
  :`<section class="secn"><div class="lab">The team</div>
   <p style="margin-top:10px;color:var(--muted)">No reps on this book yet.</p></section>`;

 /* 7 · what Pulse did.
    Real once Autopilot has decided anything: the counts come straight from
    pulse_decision, which is the same table the Activity tab reads. The
    prototype's line stays only while nothing has been decided — a claim about
    how much work AI saved is the last thing that should be invented. */
 const asum=window.PulseLive&&PulseLive.state.autopilot;
 const mateTop=asum&&asum.total
  ?`Pulse made ${asum.thisMonth.toLocaleString("en-IN")} decision${asum.thisMonth===1?"":"s"} this month`
  :G.mate[0];
 const mateSub=asum&&asum.total
  ?`${asum.raised} needed a person. ${asum.nurtured} went to a sequence, ${asum.suppressed} were filtered out${
     asum.held?`, ${asum.held} are held`:""}.`
  :G.mate[1];
 /* The headline number is the promise of the whole product: what fraction was
    resolved without a person. Rounded, and only shown once there is enough to
    round honestly. */
 const noHuman=asum&&asum.thisMonth>=10
  ? Math.round(((asum.thisMonth-asum.raised)/asum.thisMonth)*100)+"%"
  : null;
 const mate=`<button class="mate" data-nav="auto" data-tab2="activity"><span class="av3">P</span>
  <span class="mb"><b>${mateTop}</b><span>${mateSub}</span></span>
  <span class="mv3">${noHuman?`${noHuman}<em>without a person</em>`:`+18 pts<em>held or lifted by me</em>`}</span></button>`;
 const flightPending=Boolean(window.PulseLive&&!PulseLive.state.flightLoaded&&!PulseLive.state.error);
 const nThem=FLIGHT.filter(f=>f[2]==="them").length,nUs=FLIGHT.filter(f=>f[2]==="us").length,
  nAI=FLIGHT.filter(f=>f[2]==="pulse").length,nOld=FLIGHT.filter(f=>f[4]).length;
 const flightSec=S.scope!=="me"?"":flightPending?`<section class="flight">
  <div class="lab" style="color:var(--faint)">In flight</div>
  <div class="sk" style="height:14px;width:70%;margin-top:6px"></div>
  <div class="sk" style="height:14px;width:50%;margin-top:8px"></div></section>`
  :!FLIGHT.length?"":`<section class="flight">
  <div class="lab"><button id="ftog" style="font-family:inherit;letter-spacing:inherit;color:var(--faint)">
   In flight · ${FLIGHT.length} ${S.flightOpen?"▾":"▸"}</button></div>
  <p class="sumline"><em>${nThem} waiting on them</em> · <em>${nUs} blocked here</em> · ${nAI} running without you${
   nOld?` · <span style="color:var(--watch)">${nOld} older than they should be</span>`:""}</p>
  ${S.flightOpen?FLIGHT.map(([c2,w,b2,d,old,ai])=>`<div class="frow" data-old="${old}" data-cust="${c2}">
    <b class="mkrow">${LOGO(c2,22)}${c2}</b><i>${w}<span class="ai">${ai}</span></i>
    <span class="ball" data-b="${b2}" data-tip="${
      b2==="them"?"Waiting on them||The customer owes us a reply, a decision or a document. Normal until it ages.":
      b2==="us"?"Blocked here||Something inside MSG91 or a partner is holding it up. This is where work actually dies.":
      "Running without you||Pulse is handling it — a sequence, a chase or a timer. It becomes a card only if it stalls."
    }">${b2==="them"?"THEM":b2==="us"?"BLOCKED":"PULSE"}</span>
    <span class="age">${d}d</span></div>`).join(""):""}</section>`;
 /* PINNED was never wired to anything real — nothing in pulse-live.js ever
    sets it, so "11 missions", "486 accounts, 46 unassigned" etc. were fixed
    numbers shown as if pinned by someone. Hidden until a real pinned-answers
    fetch exists to back it, rather than inventing pin activity nobody did. */
 const pinSec="";
 const list=S.newRep?roomNewRows():roomRows();
 const auto=S.newRep||!cards.length;
 const roomSec=S.scope==="me"?`<section class="room${auto?" open":""}">
  <div class="lab">${auto?"Where I would look":`<button id="rtog" style="font-family:inherit;letter-spacing:inherit;color:var(--faint)">Room to grow · ${list.length} ${S.roomOpen?"▾":"▸"}</button>`}</div>
  ${auto||S.roomOpen?`${auto?`<p class="lead2">Ranked by what it is worth against what it costs you. Nothing here is urgent — that is the point.</p>`:""}
   ${list.filter(r=>!S.roomOff.has(r[1])).map(([k,h2,p2,ev,cta])=>`<div class="opp">
    <div class="ok3"><span class="dot"></span>${k}</div><h3>${h2}</h3><p>${p2}</p>
    <div class="ev2">${ev}</div>
    <div class="row"><button class="go solid" data-opp="${encodeURIComponent(JSON.stringify([k,h2,p2,ev,cta]))}">${cta} →</button>
     <button class="go" data-oppoff="${esc(h2)}">Not now</button></div></div>`).join("")}`:""}</section>`:"";
 const dlist=S.scope==="me"?DONE:S.scope==="team"?DONE_T:DONE_C;
 const dn=dlist.length+S.doneIds.size+S.snoozeIds.size;
 const doneSec=(!S.newRep)?`<section class="done">
  <div class="lab"><button id="dtog" style="font-family:inherit;letter-spacing:inherit;color:var(--faint)">
   Done today · ${dn} ${S.doneOpen?"▾":"▸"}</button></div>
  ${S.doneOpen?[...S.doneIds].map(i=>`<div class="drow"><span class="tk">✓</span>
    <b>${CARDS[i].h.replace(/\.$/,"")}</b><i>just now</i>
    <button class="un" data-undo="${i}">Undo</button></div>`).join("")
   +[...S.snoozeIds].map(([i,ts])=>`<div class="drow"><span class="tk">⏰</span>
    <b>${CARDS[i].h.replace(/\.$/,"")}</b><i>Snoozed · ${snoozeBackText(ts)}</i>
    <button class="un" data-undo="${i}">Undo</button></div>`).join("")
   +dlist.map(([t,a,b2])=>`<div class="drow"><span class="tk">✓</span><b>${a}</b><i>${b2}</i>
    <time>${t}</time></div>`).join(""):""}</section>`:"";
 const wallTotal=(window.PulseLive&&PulseLive.state.counts&&PulseLive.state.counts.accounts)||0;
 const wallMore=window.PulseLive&&PulseLive.state.wallNext!=null;
 /* wallTotal is falsy for three different reasons, and they must not read the
    same: a real error, a rep who genuinely owns zero accounts (both honest,
    both live), and no live wiring at all (the standalone prototype, which
    keeps its sample numbers). Conflating "still loading" with "you have
    none" is what made this copy a lie the moment either one happened. */
 const liveError=Boolean(window.PulseLive&&PulseLive.state.error);
 const liveWired=Boolean(window.PulseLive);
 const wall=(S.scope!=="company"&&!S.newRep)?`<section class="wall"><div class="lab">${
   wallTotal?`Accounts · showing ${BOOK.length.toLocaleString("en-IN")} of ${wallTotal.toLocaleString("en-IN")}`
    :liveError?"Accounts · could not load"
    :liveWired?(S.scope==="me"?"Your accounts · 0":"Team accounts · 0")
    :(S.scope==="me"?"Your accounts · 18":"Team accounts · showing 18 of 486")}</div>
  <div class="logos">${BOOK.map(([mo,nm,co,mt,st,hot])=>
   `<span data-cust="${nm}" data-tip="${nm}||${co} · ${mt} — ${st}" role="button" tabindex="0">${LOGO(nm,40)}</span>`).join("")}</div>
  ${wallMore?`<div class="row" style="margin-top:14px"><button class="go" id="morewall">Load 40 more →</button></div>`:""}</section>`:"";
 /* The bar is drawn against the largest row, not against 100.
    The prototype's score was 0-100 so a percentage width worked; the live
    numbers are account counts, and 1,320 rendered as width:1320% — clipped to
    full, which made everyone above a hundred accounts look identical. */
 const topScore=Math.max(1,...STANDINGS.map(r=>Number(r[2])||0));
 const stand=S.scope==="team"?`<div class="stand"><div class="lab">Standings · all ${
   STANDINGS.length} · everyone sees this</div>
  ${STANDINGS.map(([nm,ini,sc,dl,d,me],i)=>`<div class="srow" data-me="${me}">
   <span class="rk">${i+1}</span><span class="nm mkrow">${AVI(nm,24)}${nm}${me?"<em>you</em>":""}</span>
   <span class="bar" data-tip="Accounts owned||${Number(sc).toLocaleString("en-IN")} of ${
     topScore.toLocaleString("en-IN")}, the largest book on the team. Ordered by accounts owned, not by revenue."><i style="width:${
     Math.max(2,Math.round((Number(sc)||0)/topScore*100))}%"></i></span>
   <span class="sc2">${Number(sc).toLocaleString("en-IN")}</span><span class="dl" data-d="${d}">${dl}</span></div>`).join("")}
  <div class="srow" style="border:none;color:var(--faint)"><span class="rk"></span>
   <span class="nm" style="font-weight:400;font-size:13px">Ordered by accounts owned. Movement needs a month of history — it is being recorded now.</span></div></div>`:"";
 const ban=(!ME.gmail&&S.scope==="me")?`<div class="banner"><span class="sd" style="width:8px;height:8px;border-radius:50%;background:var(--watch);margin-top:7px;flex:none"></span>
  <div class="bt"><b>I cannot see your conversations.</b>
  <span>Your mailbox is not connected, so for all 18 of your companies I am guessing at silence and I cannot draft anything in your voice. Six days like this and it becomes a card in your manager's view.</span></div>
  <button class="go solid" data-nav="profile">Connect it →</button></div>`:"";
 main.innerHTML=head+sysband+ban+(S.newRep?"":sband)+
  body+(S.newRep?"":flightSec+doneSec+board+points)+roomSec+pinSec+
  (S.newRep?"":team+mate)+
  (S.newRep?"":`<section class="growth"><div class="lab">${g.lab}</div>
   <div class="gtop"><h2>${g.h}</h2>
    ${/* No score when nothing can evidence one. It is weighted to promises kept
        and accounts recovered, and Pulse records neither yet — so the live data
        layer removes it rather than showing a number nobody can stand behind.
        Rendering the block regardless printed "undefined". */
      g.score==null?"":`<div class="score" data-tip="${g.tip[0]}||${g.tip[1]}"><b>${g.score}</b>
     <span>score</span>${g.delta?`<span class="up" style="display:block;font-size:11.5px;margin-top:2px">${g.delta}</span>`:""}</div>`}</div>
   <div class="stats">${g.stats.map(([b,s2,tt,td])=>
     `<div class="stat" data-tip="${tt}||${td}"><b>${b}</b><span>${s2}</span></div>`).join("")}</div>
   ${g.pills?`<div class="pills">${PROD.map(p=>`<span class="pl" data-o="${OWNED.includes(p)?1:0}"
     data-tip="${p}||${OWNED.includes(p)?"Live in your accounts. Sold to at least one company you own.":"Not yet sold by you. Nine of your companies are a plausible fit."}">${p}</span>`).join("")}</div>`:""}
   ${stand}
  </section>`)+wall;
 startClocks();
}

function vAsk(){
 /* Guard: a question with no answer object must not take the surface down. */
 if(!ASK[S.ask]){S.ask=Object.keys(ASK)[0];}
 const a=ASK[S.ask], sel=S.sel;
 const tabs=`<div class="tabs" style="margin-top:34px">
   <button data-atab="ask" aria-selected="${S.askTab==="ask"}">Ask</button>
   <button data-atab="asked" aria-selected="${S.askTab==="asked"}">Asked · ${
    HISTORY.length+((window.PulseLive&&PulseLive.state.asked)||[]).length}</button></div>`;
 if(S.askTab==="asked"){
  const sorted=HISTORY.slice().sort((x,y)=>(y[0]-x[0]));
  /* Questions people actually typed, from pulse_question. These carry a real
     count because the store increments it on every ask — which is also what
     lets the list fade on its own after thirty days of nobody asking. */
  const typed=(window.PulseLive&&PulseLive.state.asked)||[];
  main.innerHTML=tabs+`<p class="lede" style="margin:24px 0 18px;font-size:14px;color:var(--muted);max-width:60ch">
    Pinned questions stay. Everything else fades after thirty days of nobody asking it, so this list stays short on its own.</p>
   ${typed.length?`<div class="lab" style="margin:0 0 8px">Asked by people here</div>
    ${typed.map(t=>`<div class="lrow" data-asked="${encodeURIComponent(t.question)}" style="cursor:pointer" role="button" tabindex="0">
     <span class="pin" style="width:14px;flex:none;color:var(--br);font-size:11px">?</span>
     <span class="ds"><b style="font-weight:500">${t.question.replace(/</g,"&lt;")}</b>
      <em>asked ${t.askedCount} time${t.askedCount===1?"":"s"}${t.headline?" · "+t.headline.replace(/</g,"&lt;"):""}</em></span>
     <span class="rt3">${t.askedCount>1?"SAVED SQL":"ASKED"}</span></div>`).join("")}
    <div class="lab" style="margin:26px 0 8px">The questions Pulse ships with</div>`:""}
   ${sorted.map(([pin,q,meta,k])=>`<div class="lrow" data-q="${k}" style="cursor:pointer" role="button" tabindex="0">
    <span class="pin" style="width:14px;flex:none;color:var(--br);font-size:11px">${pin?"★":""}</span>
    <span class="ds"><b style="font-weight:500">${q}</b><em>${meta}</em></span>
    <span class="rt3">${pin?"PINNED":"OPEN"}</span></div>`).join("")}`;
  return;
 }
 const table=a.cols?`<div class="tbl"><div class="tblscroll"><table>
   <thead><tr><th class="ck"></th>${a.cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
   <tbody>${a.rows.map((r,i)=>`<tr><td class="ck"><input type="checkbox" data-row="${i}" ${sel.has(i)?"checked":""}></td>
    ${r.map((v,j)=>j===0?`<td class="c" ${S.ask==="partners"?`data-partner="${v}"`:`data-cust="${v}"`}>${LOGO(v,18)} ${v}</td>`:`<td>${v}</td>`).join("")}</tr>`).join("")}
   </tbody></table></div></div>
  <div class="tbar"><span class="fresh">SHOWING ${a.rows.length}${
    a.total?` OF ${a.total}`:a.nextCursor!=null?"  ·  MORE AVAILABLE":""}</span>
   ${a.nextCursor!=null?`<button class="go solid" id="loadmore" style="padding:5px 13px;font-size:13px">Load ${
    a.total?Math.min(50,a.total-a.rows.length):50} more →</button>`:""}
   <button class="go" id="recalc" data-recompute="${S.ask}" style="padding:5px 13px;font-size:13px">${
    a.__recomputing?"Recomputing…":a.__recomputedAt?"Recomputed "+a.__recomputedAt:"Recompute"}</button>
   ${sel.size?`<span style="color:var(--br)">${sel.size} selected</span>
    <button class="go solid" disabled title="Bulk reassign from an Ask result isn't wired up yet." style="padding:5px 13px;font-size:13px;opacity:.5;cursor:not-allowed">Reassign ${sel.size} →</button>
    <button class="go" disabled title="Mission creation isn't wired up yet." style="padding:5px 13px;font-size:13px;opacity:.5;cursor:not-allowed">Create missions</button>`:
    `<span>Select rows to act on them</span>`}</div>`:"";
 /* The provenance row rides below the data rather than inside it, so paging
    the breakdown does not slice it off. */
 const brkRows=(a.brk||[]).concat(a.brkMeta||[]);
 const brkbar=a.brkTotal?`<div class="tbar"><span class="fresh">SHOWING ${a.brk.length} OF ${a.brkTotal}</span>
   ${a.brk.length<a.brkTotal?`<button class="go solid" id="loadmore" style="padding:5px 13px;font-size:13px">Load ${
    Math.min(50,a.brkTotal-a.brk.length)} more →</button>`:""}</div>`:"";
 const isPinned=S.ask==="__custom"?PINS.typed.includes(a.q||""):HISTORY.some(h=>h[3]===S.ask&&h[0]);
 main.innerHTML=tabs+`<div class="askbox" style="margin-top:26px">
  <input id="aq" placeholder="Ask anything about accounts, revenue or the team" aria-label="Ask Pulse">
  <span class="hint">↵</span></div>
 <div class="chips">${HISTORY.slice(0,5).map(([pin,q,,k])=>
   `<button class="chip" ${pin?'data-s="1"':""} data-q="${k}">${pin?"★ ":""}${q}</button>`).join("")}</div>
 <div class="answer"><p class="qline"><span class="qtag">YOU ASKED</span>${esc(a.q)}</p>${a.loading?`<div class="bigskel" aria-label="Working it out"><i></i><i></i><i></i></div>`:`<div class="big">${a.big}</div>`}
  <h3>${a.h}</h3><p>${a.p}</p>
  ${table}${/* The breakdown renders whether or not there is a table above it. It
     used to be an either/or, which silently hid the generated SQL on every
     AI answer that came back as a table — and an untraceable number is the
     one thing this surface must never show. */
   brkRows.length?`<div class="brk"${table?' style="margin-top:14px"':""}>${brkRows.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>${brkbar}`:""}
  <div class="row">${a.cols||!a.act||!answerActDest(a.act)?"":`<button class="go solid" data-answeract="${esc(a.act)}">${a.act} →</button>`}
   <button class="go" id="pinq">${isPinned?"★ Pinned · unpin":"Pin this answer…"}</button>
   <button class="go" id="shareq">Share</button></div>
  ${(st=>`<div class="stamp">${st.map(x=>`<span>${x}</span>`).join("")}</div>`)(
    /* The stamp says who was allowed to see this answer, so it has to be the
       person actually logged in — not the prototype's name. */
    a.st.map(x=>x==="Rhea Menon"&&ME.name?ME.name:x))}</div>`;
 $("#aq").addEventListener("keydown",e=>{if(e.key!=="Enter")return;
  const typed=e.target.value.trim();
  /* A typed question goes to Claude, which writes the SQL. Without the live
     layer there is nothing to ask, so fall back to the sample answer. */
  if(typed&&window.PulseLive&&window.PulseLive.askCustom){
   window.PulseLive.askCustom(typed,PULSE_BAG,render);return;}
  S.ask="cold";S.sel=new Set();render();});
}

function vAuto(){
 const t=AUTO[S.tab];
 const dt=(S.tab==="live"||S.tab==="ailog");
 const feed=f=>`<div class="feed">${f.map(([tm,a,b,tag,k])=>{
  const hasd=dt&&LOGDET[tm];
  /* Audit and Filtered rows carry their own detail, so they open a panel
     directly instead of relying on the prototype's sample decision map. */
  const rowAttr=hasd?` data-log="${tm}"`
   :(S.tab==="audit"||S.tab==="filtered")?` data-row-detail="${encodeURIComponent(JSON.stringify([tm,a,b,tag]))}" style="cursor:pointer"`:"";
  /* A suppressed signup carries its key so a person can put it back. Nothing is
     ever deleted, so this is the only way a wrong suppression gets corrected. */
  const unsup=typeof k==="string"&&k.indexOf("unsup:")===0?k.slice(6):"";
  return `<div class="item"${rowAttr}><time>${tm}</time>
  <div class="bd"><b>${a}</b><span>${b}</span></div>
  ${unsup?`<button class="go" data-unsuppress="${unsup}" style="font-size:12px;padding:5px 10px;margin-right:8px">Put back</button>`:""}
  ${(t2=>`<span class="tg" data-t="${unsup?"":k}" data-tip="${t2[0]}||${t2[1]}">${tag}</span>`)(TIP[tag]||[tag,""])}
  ${hasd?`<span class="chev">→</span>`:""}</div>`;}).join("")}</div>`;
 let body="";

 /* ── Activity ──────────────────────────────────────────────────────────────
    Handover §7.4: one feed of everything AI did, chips to filter by what kind
    of action it was, and every row expands to its evidence. Live and the AI log
    were the same events at two verbosities — that is a detail level, not a
    surface, so it became an expandable row instead of a second tab. Suppression
    is just another action type, so it became a chip: keeping it in the main
    stream is better for trust than hiding it in a tab nobody opens. */
 const CHIPS=[["all","Everything"],["acted","Acted"],["drafted","Drafted for a person"],
  ["suppressed","Suppressed"],["learned","Learned something"]];

 const rows=(window.PulseLive&&PulseLive.state.activity)||null;
 const drafts=(window.PulseLive&&PulseLive.state.drafts)||[];

 /* Which rows a chip shows. A draft is not a separate kind of event — it is a
    decision whose action was "write to a person and wait", so it filters on the
    same field as everything else. */
 /* The chips are exclusive on purpose: a row belongs to exactly one of them, so
    the counts add up to Everything. Overlapping filters make a reader think
    something is being double-counted, and on a trust surface that is fatal.
    "Learned something" is a policy change — there are none until the critic
    agent exists, and showing an honest zero is better than borrowing rows from
    another chip to make it look busy. */
 const matches=r=>S.act==="all"||
  (S.act==="acted"&&!r.held&&!r.draftId&&r.verdict!=="suppress")||
  (S.act==="drafted"&&(r.held||!!r.draftId))||
  (S.act==="suppressed"&&r.verdict==="suppress")||
  (S.act==="learned"&&r.agent==="policy-critic");

 if(S.tab==="connections"){
  loadTeamConnections();
  /* Rows 0 and 1 (Mailboxes, Calendars) are the two the real team count
     replaces — see loadTeamConnections(). Until that answers, a skeleton bar
     stands in for the count rather than showing "22 of 25" (or whatever the
     seed copy says) and then silently swapping it for the truth a moment
     later — the flash-then-correct that looks like the number was wrong. */
  const connRow=(row,i)=>{
   const [n,st,who,unlocks,breaks]=row;
   const isTeamCount=i===0||i===1;
   if(isTeamCount&&!teamConnLoaded){
    return `<div class="conn" data-st="part"><span class="sd"></span><div class="cb"><b>${n}</b>
     <div class="sk" style="width:64%;height:12px;margin-top:7px"></div>
     <div class="sk" style="width:80%;height:12px;margin-top:6px"></div></div>
     <span class="rt2">…</span></div>`;}
   return `<div class="conn" data-st="${st}">
    <span class="sd"></span><div class="cb"><b>${n}</b><span class="un">${who}</span>
     <span class="un" style="color:var(--ink2);margin-top:5px">${unlocks}</span>
     ${breaks?`<span class="br">${breaks}</span>`:""}</div>
    <span class="rt2">${st==="on"?"LIVE":st==="off"?"OFF":"PARTIAL"}</span></div>`;};
  body=`<p style="margin:26px 0 0;color:var(--ink2);max-width:62ch">Everything AI can do depends on this list.
   Where a dot is amber, something is switched off and I have said what it costs you.</p>
   <div style="margin-top:20px">${CONN.map(connRow).join("")}</div>
   <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Each person reconnects or fixes their own — there's nothing to do for them from here. See Profile → Your connections.</p>`;
 } else if(S.tab==="rules"){
  /* The manifest is the most important statement in the product, so it is not a
     constant any more — it is rows in pulse_policy that a person can change.
     Until the store answers, a skeleton stands in — MANIFEST used to be shown
     as if it were the real list and then silently swapped, which is the same
     mistake vNow's cards fixed: a screen that contradicts itself a moment
     later costs more trust than one that admits it is still loading. */
  const mf=(window.PulseLive&&PulseLive.state.manifest)||null;
  const col=(side,title)=>{
   if(!mf) return `<div class="mcol" data-k="${side}"><h4>${title}</h4>
    <ul>${[0,1,2].map(()=>'<li style="border-top:none"><div class="sk" style="width:90%;height:13px"></div>'+
     '<div class="sk" style="width:60%;height:13px;margin-top:8px"></div></li>').join("")}</ul></div>`;
   const items=mf[side];
   return `<div class="mcol" data-k="${side}"><h4>${title} · ${items.length}</h4>
    <ul>${items.map(it=>{
     if(S.editRule&&it.key===S.editRule) return `<li>
      <textarea data-rt="${it.key}" style="width:100%;min-height:56px;font:inherit;font-size:13px;
       padding:8px;border:1px solid var(--line2);border-radius:6px;background:var(--raise);color:var(--ink);
       resize:vertical">${it.text.replace(/</g,"&lt;")}</textarea>
      <span class="row" style="margin-top:6px;gap:8px">
       <button class="go solid" data-rsave="${it.key}" style="font-size:12px;padding:4px 10px">Save as ${
        "v"+((+String(it.version).replace("v","")||1)+1)}</button>
       <button class="go" data-rcancel="1" style="font-size:12px;padding:4px 10px">Cancel</button></span></li>`;
     return `<li>${it.text}
      ${it.key?`<span class="rmeta" style="opacity:0;transition:opacity .12s">
       ${canEditRules()?`<span class="pen" data-redit="${it.key}" style="cursor:pointer" role="button" tabindex="0">edit</span>
       <span class="pen" data-rretire="${it.key}" style="cursor:pointer;margin-left:10px">retire</span>`:""}
       <span style="color:var(--faint);font-size:11px;margin-left:10px">${it.version}${
        it.source==="human"?" · yours":""}${it.enforcedIn?" · enforced in code":""}</span></span>`:""}</li>`;
    }).join("")}</ul>
    ${S.addingTo===side?`<div style="margin-top:10px">
     <textarea data-rnew="${side}" placeholder="Write the rule as a sentence" style="width:100%;min-height:56px;
      font:inherit;font-size:13px;padding:8px;border:1px solid var(--line2);border-radius:6px;
      background:var(--raise);color:var(--ink);resize:vertical"></textarea>
     <span class="row" style="margin-top:6px;gap:8px">
      <button class="go solid" data-radd="${side}" style="font-size:12px;padding:4px 10px">Add rule</button>
      <button class="go" data-rcancel="1" style="font-size:12px;padding:4px 10px">Cancel</button></span></div>`
    :!canEditRules()?""
    :`<button class="add" data-raddopen="${side}" style="font-size:13px;color:var(--br);padding:9px 0 0;
      border-top:1px solid var(--line);width:100%;margin-top:10px;text-align:left">＋ Add a rule</button>`}
    </div>`;};
  body=`<div class="manifest">
   ${col("yes","What I am allowed to do without asking")}
   ${col("no","What always needs a person")}</div>
   <p style="margin:10px 0 0;color:var(--muted);font-size:12.5px">Editing a rule saves a new version.
    Nothing is overwritten, and a decision always cites the version that was in force when it was made.</p>
   <div class="lab" style="margin:34px 0 0">The rules behind that, by motion</div>
   ${(mr=>{
    /* The rules are rows now, so the card shows what Autopilot actually runs.
       A rule that is written down but not yet wired into the runner says so —
       a rule that looks live and is not is worse than no rule at all. */
    const MO=[["inbound","Inbound"],["outbound","Outbound"],["startup","Startup"],["partner","Partner"]];
    if(!mr) return `<div class="mo4">${MO.map(([,label])=>`<div class="mo"><h4>${label}</h4>
     ${[0,1,2].map(()=>'<div class="sk" style="height:20px;margin-top:10px"></div>').join("")}</div>`).join("")}</div>`;
    /* A fixed height with everything still in the DOM, rather than slicing
       the list down to N rows — a motion with 3 rules and 20 built
       automations was just as tall as one with 23 rules, and cutting the
       rules list alone barely shrank it. Clipping the whole box's height
       shrinks whatever is actually long, rules or automations or both,
       without having to know which. */
    return `<div class="mo4">${MO.map(([key,label])=>{
     const list=mr[key]||[];
     const liveN=list.filter(r=>r.live).length;
     const auto=((window.PulseLive&&PulseLive.state.automations)||[]).filter(a=>a.motion===key&&a.state!=="retired");
     const open=S.moOpen.has(key);
     return `<div class="mo${open?"":" mo-clamped"}" data-mokey="${key}"><h4>${label}</h4>
      <p class="sb">${liveN} of ${list.length} running today</p>
      <div class="mo-body">
       ${list.map(r=>`<div class="ru" data-openrule="${r.key}" style="cursor:pointer" role="button" tabindex="0">
         <em data-k="${r.then.act==="card"?"CARD":"ACT"}" data-tip="${TIP[r.then.act==="card"?"CARD":"ACT"][0]}||${TIP[r.then.act==="card"?"CARD":"ACT"][1]}">${r.then.act==="card"?"CARD":"ACT"}</em>
         <span${r.live?"":' style="color:var(--faint)"'}>${r.english}
          ${r.live?"":`<em style="font-style:normal;font-size:11px;color:var(--watch);margin-left:6px">not running yet</em>`}
          ${r.version!=="v1"?`<em style="font-style:normal;font-size:11px;color:var(--faint);margin-left:6px">${r.version}</em>`:""}</span>
         ${canEditRules()?`<span class="pen">edit</span>`:""}</div>`).join("")}
       ${auto.length?`<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line)">
          <p class="sb" style="margin:0 0 6px">Built automations</p>
          ${auto.map(a=>`<div class="ru" data-openautomation="${a.key}" style="cursor:pointer" role="button" tabindex="0">
            <em data-k="${a.live?"ACT":"CARD"}" style="opacity:${a.live?1:.5}">${a.mode==="cron"?"CRON":"EVENT"}</em>
            <span${a.live?"":' style="color:var(--faint)"'}>${esc(a.summary||a.english)}
             ${a.live?"":`<em style="font-style:normal;font-size:11px;color:var(--watch);margin-left:6px">not scheduled</em>`}
             <span style="display:block;font-size:11px;color:var(--faint);margin-top:4px">${a.runCount} run${a.runCount===1?"":"s"} · ${a.alertCount} alert${a.alertCount===1?"":"s"}${a.lastError?" · <span style='color:var(--danger,#a8462a)'>failing</span>":""}</span></span>
            ${canEditRules()?`<span class="pen" data-automation-retire="${a.key}" style="cursor:pointer;white-space:nowrap">turn off</span>
             <span class="pen" data-automation-delete="${a.key}" style="cursor:pointer;color:var(--danger,#a8462a);margin-left:10px;white-space:nowrap">delete</span>`:""}</div>`).join("")}
         </div>`:""}
      </div>
      ${(list.length+auto.length)>0?`<button class="add mo-toggle" data-mo-toggle="${key}" style="font-size:12.5px;color:var(--muted);
        padding:8px 0 0;width:100%;text-align:left">${open?"Show less ↑":"Show all →"}</button>`:""}
      ${canEditRules()?`<button class="add" style="font-size:13px;color:var(--br);padding:9px 0 0;border-top:1px solid var(--line);width:100%"
       data-newrule="${key}">＋ Add a rule to ${label}</button>`:""}</div>`;}).join("")}</div>`;
   })(window.PulseLive&&PulseLive.state.motionRules)}
   ${(canEditRules()?t.pr:[]).filter(([h])=>!S.prDone.has(h)).map(([h,p,a,b])=>`<div class="prop"><h4>${h}</h4><p>${p}</p>
    <div class="row" style="margin-top:0"><button class="go solid" data-prop="yes" data-propq="${esc(h)}">${a} →</button>
     <button class="go" data-prop="no" data-propq="${esc(h)}">${b}</button></div></div>`).join("")}
   ${canEditRules()?eventAutomationCard():""}`;
 } else if(S.tab==="activity"){
  if(!rows){
   /* The store has not answered yet — a loading skeleton, not the
      prototype's sample feed standing in as if it were real activity. */
   body=`<div class="feed" style="margin-top:22px">${[0,1,2,3].map(()=>
    '<div class="item"><div class="sk" style="width:60px;height:12px"></div><div class="bd">'+
    '<div class="sk" style="width:40%;height:14px"></div><div class="sk" style="width:80%;margin-top:6px"></div></div></div>').join("")}</div>`;
  } else {
   const shown=rows.filter(matches);
   const count=k=>k==="all"?rows.length:rows.filter(r=>{const o=S.act;S.act=k;const m=matches(r);S.act=o;return m;}).length;
   body=`<div class="row" style="margin:22px 0 0;gap:8px;flex-wrap:wrap">${CHIPS.map(([k,lab])=>
     `<button class="go${S.act===k?" solid":""}" data-act="${k}" style="font-size:12.5px;padding:6px 12px">${lab} · ${count(k)}</button>`).join("")}</div>
    ${shown.length?`<div class="feed" style="margin-top:14px">${shown.map(r=>
     `<div class="item" data-decision="${r.signalKey}::${r.agent}" style="cursor:pointer" role="button" tabindex="0">
      <time>${r.when}</time>
      <div class="bd"><b>${r.title}</b><span>${r.detail}</span></div>
      ${(t2=>`<span class="tg" data-t="${r.kind}" data-tip="${t2[0]}||${t2[1]}">${r.tag}</span>`)(TIP[r.tag]||[r.tag,""])}
      <span class="chev">→</span></div>`).join("")}</div>`
     :`<p style="margin:22px 0 0;color:var(--ink2)">Nothing under this filter.</p>`}`;
  }
 } else {
  /* The audit log. Not backed by the prototype's seed object any more —
     state.audit is null until the real fetch answers, so "still loading"
     and "loaded, and empty or failed" are three different things a reader
     can tell apart, instead of the mock rows standing in for all three. */
  const audit=window.PulseLive&&PulseLive.state.audit;
  const auditErr=window.PulseLive&&PulseLive.state.auditError;
  if(!audit&&!auditErr){
   body=`<div class="feed" style="margin-top:22px">${[0,1,2,3].map(()=>
    '<div class="item"><div class="sk" style="width:60px;height:12px"></div><div class="bd">'+
    '<div class="sk" style="width:40%;height:14px"></div><div class="sk" style="width:80%;margin-top:6px"></div></div></div>').join("")}</div>`;
  }else if(!audit&&auditErr){
   body=`<p style="margin:22px 0 0;color:var(--watch)">Could not load the audit log: ${esc(auditErr)}</p>`;
  }else{
   const loadingMore=PulseLive.state.auditLoadingMore;
   const moreId=window.PulseLive.state.auditNext!=null?"moreaudit":"";
   body=(audit.f.length?feed(audit.f):`<p style="margin:22px 0 0;color:var(--ink2)">Nothing on record yet.</p>`)
    +(moreId?`<div class="row" style="margin-top:16px"><button class="go" id="${moreId}"${loadingMore?" disabled":""}">${
      loadingMore?'<span class="inline-loader" style="margin-right:7px"></span>Loading…':"Load 25 more →"}</button></div>`:"");
  }
 }
 /* The count is the store's own once it has answered; a skeleton while it
    hasn't, an honest word if the store refused rather than the prototype's
    1,842 standing in for either. */
 const asum=window.PulseLive&&PulseLive.state.autopilot;
 const asumErr=window.PulseLive&&PulseLive.state.autopilotError;
 const ahead=asum?`${asum.thisMonth.toLocaleString("en-IN")} signal${asum.thisMonth===1?"":"s"} handled this month.`
  :asumErr?`Could not load Autopilot's numbers.`
  :null;
 main.innerHTML=`<p class="greet" style="margin-top:34px">Autopilot</p>
  <h1>${ahead!==null?ahead:'<span class="sk" style="display:inline-block;width:280px;height:34px;vertical-align:middle"></span>'}</h1>
  <div class="tabs">${["activity","rules","connections","audit"].map(k=>`<button data-tab="${k}" aria-selected="${k===S.tab}"
   data-tip="${TABTIP[k][0]}||${TABTIP[k][1]}">${
   {activity:"Activity",rules:"Rules",connections:"Connections",audit:"Audit log"}[k]}</button>`).join("")}</div>
  ${((sys)=>{
   /* The machinery talking about itself: a breaker that tripped, decisions the
      gateway could not answer, the kill switch left on. Same rows as Now shows
      at Team scope — this is the surface somebody opens *because* something
      looks wrong, so it belongs in both places. */
   if(S.tab==="audit"){
    const audit=window.PulseLive&&PulseLive.state.audit;
    return audit&&audit.sys&&audit.sys.length?`<div class="sys"><div class="eb"><span class="dot"></span>${audit.sys[0]}</div>
      <h4>${audit.sys[1]}</h4><p>${audit.sys[2]}</p></div>`:"";
   }
   if(S.tab!=="activity"||!sys.length) return "";
   return sys.map(a=>`<div class="sys"><div class="eb"><span class="dot"></span>${a.eyebrow}</div>
     <h4>${a.headline}</h4><p>${a.detail}</p>
     ${a.key&&a.key.indexOf("breaker:")===0
      ?`<div class="row"><button class="go solid" data-breaker="${a.key.slice(8)}">Let it run again →</button></div>`
      :a.key==="paused"?`<div class="row"><button class="go solid" data-resume="1">Resume sending →</button></div>`:""}
    </div>`).join("");
  })(((window.PulseLive&&PulseLive.state.alerts)||[]).filter(a=>a.audience==="system"))}
  ${body}`;
}

/**
 * "Recent mail" — the signed-in member's last 10 Gmail messages, read
 * through their own ViaSocket connection (PulseLive.loadGmailRecent,
 * /api/pulse/gmail/recent). Self-contained on purpose: everything it needs is
 * PulseLive.state.gmailRecent*, so it can move to any other view (e.g. a
 * dedicated Mail page later) by relocating this one function and its call.
 */
/* Which mail the side panel currently shows, so a slow /gmail/thread answer
   for a mail the person has since clicked away from doesn't overwrite
   whatever they opened next. */
let openMailId=null;

/**
 * A date as something a person can read, or nothing at all.
 *
 * The mail list and thread both showed `new Date(x).toLocaleString()`
 * unguarded. ViaSocket's two date fields are not the same format — the list
 * gives ISO ("2026-09-11T16:57:47.000Z") and the thread gives RFC 2822
 * ("Fri, 11 Sep 2026 16:57:47 +0000") — and anything either one cannot parse
 * renders the literal string "Invalid Date" in the header of the mail, which
 * reads as a bug in the mail rather than a missing field. An unparseable date
 * is better shown as no date.
 */
function mailDate(v,opts){
 if(!v)return "";
 const d=new Date(v);
 if(isNaN(d.getTime()))return "";
 return d.toLocaleString("en-IN",opts||undefined);
}

/**
 * The human half of a From header: "Ollama" out of "Ollama <hello@ollama.com>".
 *
 * The old expression was /<.*>/ — greedy and unanchored, so on a header
 * carrying two addresses ("A <a@x>, B <b@y>") it matched from the first "<"
 * to the last ">" and swallowed the second name along with both addresses.
 * This takes the part before the first angle bracket instead, and falls back
 * to the address itself when the header is a bare "<a@x>" with no name on it,
 * since an empty sender line says less than an email address does.
 */
function mailSender(from){
 const s=String(from||"").trim();
 const name=s.split("<")[0].replace(/^["']|["']$/g,"").trim();
 if(name)return name;
 const addr=/<([^>]+)>/.exec(s);
 return addr?addr[1]:(s||"Unknown sender");
}

/**
 * Mail body text, escaped, with its URLs made clickable.
 *
 * Order matters and is the whole trick: escape first, then match URLs in the
 * *escaped* text. Linkifying first and escaping after would escape the anchors
 * into visible markup; escaping inside a replace callback on raw text risks
 * putting an unescaped fragment into an href. Matching escaped text means the
 * URL characters that matter here (& becomes &amp;) are already inert.
 *
 * The visible text of a long link is shortened while the href keeps every
 * character. A real unsubscribe URL in this mailbox is 179 characters of
 * unbroken hex — printed in full it is four lines of noise, and it was the
 * thing that used to push the panel off its own width.
 */
function mailBodyHTML(text){
 const safe=esc(text);
 return safe.replace(/https?:\/\/[^\s<]+/g,(url)=>{
  /* Trailing sentence punctuation is almost never part of the address. */
  const trail=/[.,;:!?)\]]+$/.exec(url);
  const href=trail?url.slice(0,-trail[0].length):url;
  const tail=trail?trail[0]:"";
  const shown=href.length>60?href.slice(0,48)+"…"+href.slice(-8):href;
  return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="maillink">${shown}</a>${tail}`;
 });
}

/** The full thread (falling back to the list preview until it loads) plus any attachments. */
function mailThreadHTML(messages,attachments,fallback){
 const empty=`<span class="mailempty">This message has no text content — it was sent as HTML only. Open it in Gmail to read it.</span>`;
 const body=messages&&messages.length
  /* The panel header already names the sender and the date of the mail that
     was opened. Repeating them on the first message of a single-message
     thread printed "Ollama <hello@ollama.com>" twice, one line under the
     other. A per-message header earns its place only when there is more than
     one message to tell apart. */
  ?messages.map((msg,i)=>`<div${i>0?' style="margin-top:18px;padding-top:18px;border-top:1px solid var(--line)"':""}>
    ${messages.length>1?`<p class="why mailfrom">${esc(msg.from)}${
      (d=>d?` · ${esc(d)}`:"")(mailDate(msg.date))}</p>`:""}
    <div class="mailbody">${msg.body?mailBodyHTML(msg.body):empty}</div></div>`).join("")
  :`<div class="mailbody">${fallback?mailBodyHTML(fallback):empty}</div>`;
 const att=attachments&&attachments.length
  ?`<h4>Attachments</h4>${attachments.map(a=>
    `<div class="lrow"><span class="nm2">📎 ${esc(a.filename)}</span>
     <span class="ds">${a.mimeType?esc(a.mimeType):""}${a.size?` · ${(a.size/1024).toFixed(0)} KB`:""}</span>
     ${a.url?`<a class="rt3" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">Download →</a>`:""}</div>`).join("")}`
  :"";
 return body+att;
}

function gmailRecentPanel(){
 const live=window.PulseLive;
 const mails=live&&live.state.gmailRecent;
 const err=live&&live.state.gmailRecentError;
 const loaded=live&&live.state.gmailRecentLoaded;
 let body;
 if(!loaded){
  body=`<div class="feed" style="margin-top:14px">${[0,1,2].map(()=>
   '<div class="item"><div class="sk" style="width:60px;height:12px"></div><div class="bd">'+
   '<div class="sk" style="width:40%;height:14px"></div><div class="sk" style="width:80%;margin-top:6px"></div></div></div>').join("")}</div>`;
 }else if(err){
  body=`<p style="margin:14px 0 0;color:var(--watch);font-size:13px">Could not load recent mail: ${esc(err)}</p>`;
 }else if(!mails||!mails.length){
  body=`<p style="margin:14px 0 0;color:var(--ink2);font-size:13px">Nothing in the inbox yet.</p>`;
 }else{
  body=`<div class="feed" style="margin-top:14px">${mails.map(m=>
   `<div class="item" data-mail="${esc(m.id)}" role="button" tabindex="0">
     <time>${esc(mailDate(m.date,{day:"2-digit",month:"short"}))}</time>
     <div class="bd">
      <b>${esc(mailSender(m.from))}</b>
      <span>${esc(m.subject)}</span>
      ${m.snippet?`<span class="snip">${esc(m.snippet)}</span>`:""}
     </div>
     <span class="chev">›</span>
    </div>`).join("")}</div>`;
 }
 return `<div class="sec"><h5>Recent mail</h5>${body}</div>`;
}

function vProfile(){
 const g=ME.gmail, c=ME.cal;
 main.innerHTML=`<button class="back" data-nav="now" style="font-size:13.5px;color:var(--muted);margin:26px 0 0;display:inline-block">← Back</button>
 <div class="phead2">${AVI(ME.name,56)}
  <div><h1>${ME.name}</h1><span class="m2">${
   [ME.email_addr,ME.accounts!=null?`${ME.accounts.toLocaleString("en-IN")} accounts`:""].filter(Boolean).join(" · ")}</span></div></div>
 <div class="sec"><h5>Your connections</h5>
  <div class="cxn" data-on="${g}"><span class="ico">M</span><div class="cx">
   <b>Your mailbox ${g?'<span class="ok2">CONNECTED</span>':'<span class="no2">NOT CONNECTED</span>'}</b>
   <p>${g?`${ME.email_addr} · connected`:"Pulse cannot see your conversations. Silence detection, promise extraction and drafting in your voice are all switched off for your accounts."}</p>
   <div class="sc3">READ ONLY · CUSTOMER THREADS ONLY · NEVER PERSONAL MAIL<br>YOU CAN DISCONNECT AT ANY TIME AND I FORGET WITHIN 24 HOURS</div></div>
   <button class="go ${g?"":"solid"} cta" data-toggle="gmail">${g?"Disconnect":"Connect Google"}</button></div>
  <div class="cxn" data-on="${c}"><span class="ico">C</span><div class="cx">
   <b>Your calendar ${c?'<span class="ok2">CONNECTED</span>':'<span class="no2">NOT CONNECTED</span>'}</b>
   <p>${c?`${ME.email_addr} · meeting prep and post-meeting capture are on`:"No meeting prep, no post-meeting capture."}</p>
   <div class="sc3">TITLES, TIMES AND ATTENDEES OF CUSTOMER MEETINGS ONLY</div></div>
   <button class="go ${c?"":"solid"} cta" data-toggle="cal">${c?"Disconnect":"Connect Google"}</button></div>
  <div class="cxn" data-on="${ME.slackapp}"><span class="ico">S</span><div class="cx">
   <b>Your Slack ${ME.slackapp?'<span class="ok2">CONNECTED</span>':'<span class="no2">NOT CONNECTED</span>'}</b>
   <p>${ME.slackapp?"Connected · Pulse can post to your DMs and the channels you pick":"Connect it so Pulse can message you directly instead of only the team channel."}</p>
   <div class="sc3">DMS AND THE CHANNELS YOU APPROVE ONLY</div></div>
   <button class="go ${ME.slackapp?"":"solid"} cta" data-toggle="slackapp">${ME.slackapp?"Disconnect":"Connect Slack"}</button></div>
  <div class="cxn" data-on="1"><span class="ico">W</span><div class="cx">
   <b>Your WhatsApp Business number <span class="ok2">+91 90000 00012</span></b>
   <p>Yours alone, provisioned by MSG91. Customers reply to you on it and every thread is visible to Pulse, which is why silence detection works on WhatsApp at all. Use this instead of your personal number.</p>
   <div class="sc3">SENDER IDS MSG91P AND MSGIND ARE SHARED ACROSS THE COMPANY AND MANAGED BY AN ADMIN</div></div>
   <button class="go cta" data-nav="auto" data-tab2="connections">See it</button></div></div>
 ${g?gmailRecentPanel():""}
 <div class="sec"><h5>How you write</h5>
  <div class="voice"><p style="margin:0;font-size:13.5px;color:var(--ink2)">${
    ((V)=>V&&V.edited?"Yours. Kept against your sign-in and visible only to you."
     :"The defaults everybody starts with. Change any of them in first-run setup and the list becomes yours.")(
      window.PulseLive&&PulseLive.state.voice)}</p>
   <div class="vt">${VOICE.map(v=>`<span>${esc(v)}</span>`).join("")}</div>
   <blockquote>“Sample Contact — yesterday was on us. The Etisalat route failed at 3:02 and we moved you across twelve minutes later. Here is what we are changing so it does not happen again.”</blockquote>
   <p style="font-size:12.5px;color:var(--faint);margin:12px 0 0">Edited in first-run setup. Nothing reads it yet: Pulse has no mailbox connection, so this is not learned from your mail and no draft is shaped by it — both are wired to this list the day either lands.</p>
   <div class="row" style="margin-top:14px"><button class="go" id="startonb2">Edit how you write</button></div></div></div>
 <div class="sec"><h5>Where I tell you things</h5>
  <div class="tog"><div><b style="font-weight:500">Slack DM</b><i>When I act on one of your accounts, and your daily digest</i></div>
   <span class="sw" data-on="${ME.slack}" data-toggle="slack"></span></div>
  <div class="tog"><div><b style="font-weight:500">Email digest</b><i>Once each morning at 08:00</i></div>
   <span class="sw" data-on="${ME.email}" data-toggle="email"></span></div>
  <div class="tog"><div><b style="font-weight:500">Push on your phone</b><i>Only the ten-minute clock and approvals. Nothing else, ever.</i></div>
   <span class="sw" data-on="${ME.push}" data-toggle="push"></span></div></div>`;
}

function vCust(){
 const n=S.cust,d=CUST[n],b=BOOK.find(x=>x[1]===n)||["??",n,"India","Inbound","",0];
 const tg=TAGS[n]||[], op=OPEN[n]||[];
 const fr=S.from||{label:"Now · your work"};
 main.innerHTML=`<div class="cpg"><button class="crumb" data-crumb>← ${fr.label}</button>
  <div class="chead">${LOGO(n,52)}
   <div><h1>${n}</h1><span class="m">${b[2]} <span class="motionchip" style="margin:0 6px">${b[3].toUpperCase()}</span>
    ${d.owner?`<span class="ownerchip">${AVI(d.owner,20)} ${esc(d.owner)}</span>`
     :`<span class="ownerchip" style="color:var(--watch)">No owner</span>`}
    ${d.ownerSource==="pulse"?`<span class="motionchip" style="margin-left:6px" data-tip="Reassigned in Pulse||MSG91's own record still says ${
      d.ownerBefore?esc(d.ownerBefore.name):"nobody"}. Pulse cannot write to user_handled_by, so this is an override kept on our side and laid over MSG91's answer wherever the account is read.">REASSIGNED HERE</span>`:""}</span></div></div>
  ${d.__stub?`<div class="row" style="align-items:center;gap:10px;margin:18px 0">
    <span class="loader" style="width:18px;height:18px;border-width:2px"></span>
    <p style="margin:0;color:var(--muted);font-size:13px">Fetching the rest of this account — health, activity, people, everything below is still on its way.</p></div>`:""}
  ${(av=>av?`<p class="verdict">${av.headline}</p><p class="why">${av.why}</p>
   <div class="hblock" style="margin-top:14px"><div class="hh" style="align-items:flex-start">
    <div style="flex:1"><span class="lab">What to do</span>
     <p style="margin:5px 0 0;color:var(--ink);font-size:14px">${av.recommended_move}</p>
     <p style="margin:6px 0 0;color:var(--muted);font-size:12.5px">${av.expected_effect}</p></div></div>
    ${av.evidence&&av.evidence.length?`<div style="margin-top:12px">${av.evidence.map(e=>
     `<div style="display:flex;gap:10px;font-size:12.5px;padding:5px 0;border-top:1px solid var(--line)">
      <span class="lab" style="min-width:130px">${e[0]}</span><span style="color:var(--ink2)">${e[1]}</span></div>`).join("")}</div>`:""}
    <p style="margin:10px 0 0;color:var(--faint);font-size:11.5px">Written by Autopilot at month end · confidence ${
     (av.confidence!=null?av.confidence.toFixed(2):"—")}</p></div>`
   :d.__stub?"":`<p class="verdict">${d.v}</p><p class="why">${d.s}</p>`)(
   window.PulseLive&&PulseLive.state.verdicts&&PulseLive.state.verdicts[d.pid])}
  ${d.health?`<div class="hblock">
   <div class="hh"><b>${d.health.score}</b><span>health · ${
     {thriving:"thriving",steady:"steady",wobbling:"wobbling",risk:"at risk"}[d.health.band]}</span>
    ${d.health.delta?`<em data-d="${d.health.delta<0?"down":"up"}">${
      d.health.delta>0?"+"+d.health.delta:d.health.delta} this month${
      d.health.moved?" · "+(d.health.moved==="up"?"climbed a band":"slipped a band"):""}</em>`:""}</div>
   ${/* The agent's own sentence, above the evidence it read. Shown only when an
        agent actually decided this account — decidedBy is per account, so a
        formula-scored row in an otherwise AI-scored board says so. */
     d.health.decidedBy==="ai"&&d.health.reason?`<p class="hwhy" style="border:none;margin:0 0 10px;padding:0">
    <b>The account-health agent decided this.</b> ${esc(d.health.reason)}${
      d.health.confidence!=null?` · confidence ${d.health.confidence.toFixed(2)}`:""}</p>`:""}
   ${d.health.components.map(c=>`<div class="hcomp"><span class="cl2">${c.label}</span>
    <span class="cbar"><i style="width:${c.value}%" data-low="${c.value<40?1:0}"></i></span>
    <span class="cv2">${c.value}</span></div>
    <p class="hwhy" style="border:none;margin:0 0 4px;padding:0;font-size:12px">${c.evidence} · ${
      Math.round(c.weight*100)}% of the score</p>`).join("")}
   <p class="hwhy">${d.health.decidedBy==="ai"
     ?`The four components above are the evidence, derived on read from ms_trans and ms_text_bal — MSG91's schema stores no health score. They weigh to ${d.health.formulaScore}; the agent set ${d.health.score}.${
        d.health.clamped?" Its first answer was further out and was pulled back to within 20 points of the evidence.":""}`
     :`Derived on read from ms_trans and ms_text_bal — MSG91's schema stores no health score. Scored by formula: the account-health agent did not answer for this account.`}
    Ownership and product breadth have no history here, so the monthly movement holds them at today's value.</p></div>`:""}
  <div class="row"><button class="go solid" data-sheet="log">Log what happened →</button>
   <button class="go" data-reassign2="${n}">Reassign</button></div>

  <div class="sec"><h5>Open on this account · ${op.length}</h5>
   ${op.map(([k,t,w,st])=>`<div class="oi"><span class="k2" data-t="${k}">${k}</span>
     <span class="d2">${t}<em>${w}</em></span><time>${st}</time></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Pulse keeps this list. Nothing here was typed by hand — log a call and it updates itself.</p></div>

  <div class="sec"><h5>Tags</h5>
   <div class="tags">${tg.map(([t,ai])=>`<span class="tag2" data-ai="${ai}">${t}
     <button class="x2" data-untag="${t}">✕</button></span>`).join("")}
    <button class="addtag" data-addtag>＋ Add a tag</button></div>
   ${((e)=>e?`<p class="tagerr" role="alert">That did not save: ${esc(e)}</p>`:"")(window.PulseLive&&PulseLive.state.tagError)}
   <p style="font-size:12.5px;color:var(--faint);margin-top:11px">Dashed tags were added by Pulse from evidence, solid ones are yours, and both are filterable in Ask. Motion is not a tag — it is the single field above that decides which rules run, and an account has exactly one.</p></div>

  <div class="sec"><h5>People · ${d.pe.length+(d.peMine?d.peMine.length:0)}</h5>${
   d.pe.length
    ?d.pe.map(([a,r,rl])=>
      `<div class="pr" data-person="${esc(a)}" style="cursor:pointer" role="button" tabindex="0"><b class="mkrow">${AVI(a,24)}${esc(a)}</b><span class="rl">${esc(rl)}</span><i>${esc(r)}</i></div>`).join("")
    :`<p style="font-size:13px;color:var(--muted);margin:0">Nobody MSG91 invited. MSG91 records the people at a company from the members it has invited, and this one has invited none — which is itself worth knowing, because an account where you know one person churns at roughly twice the rate of one where you know three.</p>`}
   ${(d.peMine||[]).map(([id,nm,rl])=>
     `<div class="pr"><b class="mkrow">${AVI(nm,24)}${esc(nm)}</b><span class="rl">${esc(rl||"contact")}</span>
      <button class="x2" data-uncontact="${id}" title="Remove">✕</button></div>`).join("")}
   ${((e)=>e?`<p class="tagerr" role="alert">That did not save: ${esc(e)}</p>`:"")(window.PulseLive&&PulseLive.state.tagError)}
   <button class="addtag" style="margin-top:12px;border-color:var(--line2);color:var(--br)" data-sheet="person">＋ Add a person</button></div>

  ${(d.no&&d.no.length)||d.__noNext!=null?`<div class="sec"><h5>Notes</h5>${(d.no||[]).map(([who,text,when])=>
   `<div class="pr"><b class="mkrow">${AVI(who,24)}${esc(who)}</b><span class="rl">${esc(when)}</span><i>${esc(text)}</i></div>`).join("")}
   ${d.__noNext!=null?`<div class="row" style="margin-top:12px"><button class="go" id="morenotes">Load 10 more →</button></div>`:""}</div>`:""}
  ${(ap=>!ap||(!ap.decisions.length&&!ap.drafts.length&&!ap.next.length)?"":`
  <div class="sec"><h5>What Autopilot did here</h5>
   ${ap.next.length?`<p style="font-size:13px;color:var(--ink);margin:0 0 12px">
     Next: <b>${ap.next[0].what}</b> in ${ap.next[0].inDays} day${ap.next[0].inDays===1?"":"s"},
     unless something changes before then.</p>`:""}
   ${ap.decisions.map(x=>`<div class="ev" style="align-items:flex-start">
     <time>${x.when}</time>
     <span><b style="color:var(--ink)">${x.title}</b><br>
      <span style="color:var(--ink2)">${x.detail}</span>
      ${x.confidence!=null?`<span style="color:var(--faint);font-size:12px"> · confidence ${x.confidence.toFixed(2)}</span>`:""}
     </span></div>`).join("")}
   ${ap.drafts.filter(x=>x.status==="held").map(x=>`
    <div class="skcard" style="margin-top:12px;background:var(--sink)">
     <div class="lab">Held for you · ${x.channel}</div>
     <b style="display:block;margin:6px 0 8px;font-size:14px">${x.subject||"(no subject)"}</b>
     <textarea data-body="${x.id}" style="width:100%;min-height:96px;font:inherit;font-size:13.5px;
      line-height:1.6;padding:11px;border:1px solid var(--line);border-radius:8px;background:var(--raise);
      color:var(--ink);resize:vertical">${x.body.replace(/</g,"&lt;")}</textarea>
     ${x.holdReason?`<p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">Held: ${x.holdReason}</p>`:""}
     <div class="row" style="margin-top:10px"><button class="go solid" data-release="${x.id}">Release →</button>
      <button class="go" data-discard="${x.id}">Discard</button>
      <span class="dmsg" data-dmsg="${x.id}" style="font-size:12.5px;color:var(--muted);align-self:center"></span></div>
    </div>`).join("")}
  </div>`)(d.autopilot)}

  <div class="sec"><h5>Products · ${d.la.length}</h5>${
   d.la.length
    ?d.la.map(([pp,st,x])=>
      `<div class="ln"><span class="cp">${esc(pp)}</span><span class="st" data-s="${esc(st)}">${esc(st)}</span><i>${esc(x)}</i></div>`).join("")
    :`<p style="font-size:13px;color:var(--muted);margin:0">None that Pulse can see. This account is not switched on for any product in ms_user_services and has nothing built on one either.</p>`}
   <p style="font-size:12.5px;color:var(--faint);margin-top:11px">Read from what the account is switched on for (ms_user_services × microservice_names) and from one table per product for evidence of use — OTP widgets, WhatsApp approval, email and campaign flags, voice templates, Hello teams, SMS route credit. <b>Active</b> means Pulse found use; <b>setting up</b> means switched on with nothing built on it yet. RCS and OneAPI have no per-account table here, so Pulse never claims to know whether they are being used.</p></div>
  <div class="sec"><h5>Recently</h5>${d.ev.map(([t,e])=>`<div class="ev"><time>${t}</time><span>${e}</span></div>`).join("")}
   ${d.__evNext!=null?`<div class="row" style="margin-top:12px"><button class="go" id="morerecent">Load 10 more →</button></div>`:""}</div>
  <div class="sec"><h5>Commercial</h5>
   <div class="hid"><button class="hb" id="revm" data-tip="Level 2||Payments, wallet and rates are hidden by default. Opening them writes a row against your name in pulse_commercial_reveal — who looked, at which company, and when.">Show payments and rates</button></div>
   <div class="money" id="moneyb" hidden>${d.money.map(([b2,s2,x])=>
    `<div><b>${esc(b2)}</b><span>${esc(s2)}${x?" · "+esc(x):""}</span></div>`).join("")}</div>

   ${/* Rates. The other half of the button's own label, and never built until
        now — ms_user_pricing, the price this account actually negotiated. */""}
   <div id="ratesb" hidden>
    <div class="lab" style="margin:18px 0 6px">Rates · what this account pays</div>
    ${(d.rates&&d.rates.length)
      ?d.rates.map(r=>`<div class="ln"><span class="cp">${esc(r.routeName)}</span>
        <span class="st">${esc(r.kind)}</span><i>${esc(r.priceLabel)} per message</i></div>`).join("")
      :`<p style="font-size:13px;color:var(--muted);margin:0">No negotiated rate on this account — it is on list price. MSG91 records a per-account price in ms_user_pricing only where somebody agreed one, and most accounts have no row.</p>`}

    ${(d.recent&&d.recent.length)?`<div class="lab" style="margin:18px 0 6px">Last ${d.recent.length} payment${d.recent.length===1?"":"s"}</div>
     ${d.recent.map(x=>`<div class="ev"><time>${esc(x.when)}</time><span>${esc(x.amount)} · ${esc(x.via)}</span></div>`).join("")}`:""}

    ${(d.reveals&&d.reveals.length)?`<div class="lab" style="margin:18px 0 6px">Who has opened this · ${d.reveals.length}</div>
     ${d.reveals.slice(0,8).map(x=>`<div class="ev"><time>${esc(new Date(x.at).toLocaleString())}</time><span>${esc(x.member)}</span></div>`).join("")}`:""}
    ${d.revealLogged===false?`<p class="tagerr" role="alert">This opening was not recorded — Pulse's own database did not accept the audit row. The figures above are real; the log of who read them is one entry short.</p>`:""}
    <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Payments and wallet come from ms_trans, rates from ms_user_pricing joined to ms_route. Your own opening of this section is in the list above.</p>
   </div></div></div>`;
}

function vPartner(){
 const pt=PARTNERS.find(x=>x[0]===S.partner)||PARTNERS[0];
 const accts=[["Sample Co 3","OTP AED 128,000","growing"],["Sample Co 15","WHATSAPP AED 25,000","growing"],
  ["Sample Co 20","SMS AED 61,000","active"]];
 main.innerHTML=`<div class="cpg"><button class="back" data-q="partners">← Back to partners</button>
  <div class="chead">${LOGO(pt[0],52)}<div><h1>${pt[0]}</h1>
   <span class="m">${pt[2]} · reseller · ${pt[3]} accounts sourced</span></div></div>
  <p class="verdict">${pt[4]} received this month across ${pt[3]} accounts.</p>
  <p class="why">Native currency, never converted. Their accounts reach first value faster than our own inbound.</p>
  <div class="sec"><h5>Revenue by service</h5>
   ${pt[5].map(x=>`<div class="ln"><span class="cp">${x.split(" ")[0]}</span>
    <span class="st"></span><i>${x.split(" ").slice(1).join(" ")}</i></div>`).join("")}</div>
  <div class="sec"><h5>Accounts they brought · ${pt[3]}</h5>
   ${accts.map(([a,rev,st])=>`<div class="lrow" data-cust="${a}" style="cursor:pointer" role="button" tabindex="0">
    <span class="nm2">${LOGO(a,24)}${a}</span><span class="ds">${rev}</span>
    <span class="rt3">${st.toUpperCase()}</span></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Showing 3 of ${pt[3]}. Every account here is co-owned — no price conversation happens without them on the thread.</p></div>
  <div class="row" style="margin-top:26px"><button class="go solid" disabled title="Sending a partner digest isn't wired up yet." style="opacity:.5;cursor:not-allowed">Send this month's digest →</button>
   <button class="go" data-pcontacts="${esc(pt[0])}">Partner contacts</button></div></div>`;
}

let CT=null;
function startClocks(){clearInterval(CT);const els=$$('[data-clk]');if(!els.length)return;
 const go=()=>els.forEach(e=>{let s=+e.dataset.clk;if(s<=0){e.textContent="overdue";return;}
  e.dataset.clk=--s;e.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")} left`;});
 go();CT=setInterval(go,1000);}

/* ⌘K */
let PAL=[
 ...BOOK.map(([mo,nm,co,mt,st])=>({g:"Companies",ic:LOGO(nm,25),t:nm,s:`${co} · ${mt} — ${st}`,rt:"↵",
  run:()=>{S.cust=nm;S.v=CUST[nm]?"cust":"cust";render();}})),
 {g:"People",ic:AVI("Sample Contact D",25),t:"Sample Contact D",s:"Sample Co 1 · marketing · asked about WhatsApp",rt:"↵",run:()=>{S.cust="Sample Co 1";S.v="cust";render();}},
 {g:"People",ic:AVI("Sample Contact A",25),t:"Sample Contact A",s:"Sample Co 2 · decision maker · waiting on a rate",rt:"↵",run:()=>{S.cust="Sample Co 2";S.v="cust";render();}},
 {g:"People",ic:AVI("Sample Contact J",25),t:"Sample Contact J",s:"Sample Co 3 · decision maker · UAE",rt:"↵",run:()=>{S.cust="Sample Co 3";S.v="cust";render();}},
 {g:"People",ic:AVI("Sample Contact E",25),t:"Sample Contact E",s:"Sample Co 1 · technical owner",rt:"↵",run:()=>{S.cust="Sample Co 1";S.v="cust";render();}},
 {g:"Ask Pulse",ic:"?",t:"Who is most likely to churn this month?",s:"4 — Sample Co 6, Sample Co 5, Sample Co 10, Sample Co 7",rt:"↵",run:()=>{S.ask="churn";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Partner motion, this month",s:"Saved · ₹64.2L across four entities",rt:"saved",run:()=>{S.ask="partner";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"UAE entity, this quarter",s:"Saved · AED 402k · 11 unowned",rt:"saved",run:()=>{S.ask="uae";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"What is in flight?",s:"7 — 3 with them, 2 blocked here, 2 with Pulse",rt:"↵",run:()=>{S.ask="flight";S.sel=new Set();S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Whose accounts are flat?",s:"2 — Sample Rep 3 61 days, Sample Rep 34 days",rt:"↵",run:()=>{S.ask="flat";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Which startups are stuck before first message?",s:"3, all on the same DLT queue",rt:"↵",run:()=>{S.ask="stuck";S.v="ask";render();}},
 {g:"Go to",ic:"◆",t:"Autopilot · Activity",s:"Everything AI did, with the evidence",rt:"",run:()=>{S.tab="activity";S.act="all";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Autopilot · Rules",s:"Four motions, four sets of rules",rt:"",run:()=>{S.tab="rules";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Connections",s:"What Pulse can reach · 2 not connected",rt:"",run:()=>{S.tab="connections";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Audit log",s:"What people viewed, revealed and changed",rt:"",run:()=>{S.tab="audit";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Suppressed signups",s:"What AI filtered out, and why",rt:"",run:()=>{S.tab="activity";S.act="suppressed";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Drafts waiting on you",s:"Messages AI wrote, held until you release them",rt:"",run:()=>{S.tab="activity";S.act="drafted";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Your profile and connections",s:"Your mailbox, your calendar, how you write",rt:"",run:()=>{S.v="profile";render();}},
 {g:"Go to",ic:"◆",t:"Preview: a new teammate on day one",s:"What Sample Contact sees with no accounts yet",rt:"",run:()=>{S.newRep=1;S.v="now";render();}},
 {g:"Go to",ic:"◆",t:"Back to the normal view",s:"Leave the new-teammate preview",rt:"",run:()=>{S.newRep=0;S.v="now";render();}},
 {g:"Do",ic:"+",t:"Add a company",s:"Prospect, partner referral or outbound target",rt:"⌘N"},
 {g:"Do",ic:"+",t:"Add accounts in bulk",s:"Paste a list or drop a CSV from an event",rt:"",run:()=>openSheet("bulk")},
 {g:"Do",ic:"✎",t:"Log a call or a meeting",s:"Write or talk — I turn it into the right work",rt:"",run:()=>openSheet("log")},
 {g:"Ask Pulse",ic:"?",t:"My open promises and missions",s:"Pinned · 11 open, 1 late",rt:"saved",run:()=>{S.ask="mine";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Open promises and missions across the team",s:"214 open, 9 late",rt:"↵",run:()=>{S.ask="teammine";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Every account my team is handling",s:"Pinned · 486 accounts, 46 unassigned",rt:"saved",run:()=>{S.ask="teamall";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Revenue by partner this month",s:"Pinned · five partners, native currency",rt:"saved",run:()=>{S.ask="partners";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Do",ic:"→",t:"Reassign accounts",s:"46 accounts unowned since Sample Rep 9 left",rt:""},
 /* The kill switch. It used to be a label with nothing behind it; it now writes
    the pulse_policy row the runner reads before every pass, and the release path
    checks before letting anything out. */
 {g:"Do",ic:"■",t:"Pause all automatic sending",s:"Global stop. Nothing goes out until you resume.",rt:"",
  run:()=>{const paused=!(window.PulseLive&&PulseLive.state.policy&&PulseLive.state.policy.sendingPaused);
   if(window.PulseLive&&PulseLive.setSendingPaused)
    PulseLive.setSendingPaused(paused).then(()=>{S.v="auto";S.tab="activity";S.act="drafted";render();});}}];
let pS=0,pR=[];
/* Open a company page from anywhere, the same way a [data-cust] click does. */
function openCompany(name){
 S.from={v:S.v,scope:S.scope,ask:S.ask,tab:S.tab,label:
  S.v==="ask"?"Ask · "+ASK[S.ask].q:S.v==="auto"?"Autopilot":
  S.scope==="me"?"Now · your work":S.scope==="team"?"Now · the team":"Now · the company"};
 S.cust=name;S.v="cust";render();
 if(window.PulseLive&&window.PulseLive.loadAccount)
  window.PulseLive.loadAccount(name,PULSE_BAG,render);}

const askRow=(q)=>({g:"Ask Pulse",ic:"?",t:`Ask Pulse: "${q}"`,s:"Nothing in the palette matches — ask it as a question instead",rt:"↵",
 run:()=>{const typed=$("#pq").value.trim();
  if(typed&&window.PulseLive&&window.PulseLive.askCustom){
   window.PulseLive.askCustom(typed,PULSE_BAG,render);return;}
  S.ask="churn";S.v="ask";render();}});

/**
 * Rebuild the palette from live data.
 *
 * PAL is constructed at module load, when BOOK still holds the prototype's
 * sample companies — so ⌘K kept showing those long after the real accounts had
 * arrived. This drops the sample companies and people, points the Ask entries
 * at the real question catalogue, and puts true counts in the subtitles.
 * Companies themselves come from the live search below, so only a handful are
 * listed here for the empty state.
 */
function rebuildPal(counts){
 const nav=PAL.filter(r=>r.g==="Go to");
 const doRows=PAL.filter(r=>r.g==="Do").map(r=>
  r.t==="Reassign accounts"&&counts&&counts.unowned!=null
   ?{...r,s:`${counts.unowned.toLocaleString("en-IN")} accounts have no owner`}:r);
 const companies=BOOK.slice(0,6).map(([mo,nm,co,mt,st])=>({g:"Companies",ic:LOGO(nm,25),
  t:nm,s:`${co} · ${mt} — ${st}`,rt:"↵",run:()=>openCompany(nm)}));
 const asks=HISTORY.map(([pin,q,,k])=>({g:"Ask Pulse",ic:"?",t:q,
  s:pin?"Pinned · answered from MySQL":"Answered from MySQL",rt:pin?"saved":"↵",
  run:()=>{S.ask=k;S.sel=new Set();S.askTab="ask";S.v="ask";render();}}));
 PAL=[...companies,...asks,...nav,...doRows];
}

/**
 * What ⌘K shows before anyone types.
 *
 * A flat slice of the palette told you nothing. This is the v2 resting state:
 * the saved views over your accounts with their counts, the questions people
 * pinned, the four asked most recently, and the things you can do — each one a
 * real row, so arrow keys and ↵ reach all of it.
 */
function defaultRows(){
 const views=VIEWS.map(([k,label,ic,cnt])=>({g:"Your accounts",ic,t:label,
  vc:`${cnt}${k==="everything"?'<em>all teams</em>':""}`,
  run:()=>{S.ask="v_"+k;S.sel=new Set();S.askTab="ask";S.v="ask";render();}}));
 const askRun=k=>()=>{
  if(TYPEDQ[k]&&window.PulseLive&&window.PulseLive.askCustom){
   window.PulseLive.askCustom(TYPEDQ[k],PULSE_BAG,render);return;}
  S.ask=k;S.sel=new Set();S.askTab="ask";S.v="ask";render();};
 const pin=HISTORY.filter(h=>h[0]).map(([,q,,k])=>({g:"Pinned questions",ic:"★",t:q,
  vc:'<em>PINNED</em>',run:askRun(k)}));
 const rec=HISTORY.filter(h=>!h[0]).slice(0,4).map(([,q,meta,k])=>({g:"Asked recently",ic:"?",t:q,
  vc:`<em>${String(meta||"").split(" · ")[0].toUpperCase()}</em>`,run:askRun(k)}));
 const all=[{g:"Asked recently",ic:"≡",t:"All questions ever asked",vc:String(HISTORY.length),
  run:()=>{S.askTab="asked";S.v="ask";render();}}];
 const doRows=PAL.filter(r=>r.g==="Do").map(r=>({...r,vc:""}));
 return [...views,...pin,...rec,...all,...doRows];
}

let pQ="",pLimit=12;
function pF(q){const raw=q.trim();if(raw!==pQ)pLimit=12;pQ=raw;q=raw.toLowerCase();
 pR=q?PAL.filter(r=>(r.t+" "+r.s+" "+r.g).toLowerCase().includes(q)):defaultRows();
 if(q)pR=pR.concat(askRow(raw));
 pS=0;pD();
 /* Real accounts come from the database, not the sample list, so the palette
    can find any of the ten thousand companies rather than the eighteen the
    prototype shipped with. Two characters is the server's own minimum. */
 /* Two searches, one bar. Companies come from the database — any of the ten
    thousand, not the eighteen the prototype shipped with — and questions come
    from the ones people have already asked, whose SQL is already written and
    therefore cost a query rather than a call to an agent.

    Rules and the manifest are searched too: "price" should find the rule that
    forbids sending one, not only the companies with price in their name. */
 if(q.length>=2&&window.PulseLive&&window.PulseLive.searchCompanies){
  Promise.all([
   window.PulseLive.searchCompanies(raw,PULSE_BAG,pLimit),
   window.PulseLive.searchQuestions?window.PulseLive.searchQuestions(raw):Promise.resolve([]),
  ]).then(([rows,questions])=>{
   if(!rows||pQ!==raw)return;
   const live=rows.map(a=>({g:"Companies",ic:LOGO(a.name,26),t:a.name,
    s:[a.entity,a.motion,a.line].filter(Boolean).join(" · "),
    rt:a.owner?"":"NO OWNER",run:()=>openCompany(a.name)}));
   const more=window.PulseLive.state.searchMore
    ?[{g:"Companies",ic:"⋯",t:`Show more matches for "${raw}"`,s:`Showing ${live.length}`,rt:"",
       run:()=>{pLimit+=25;pF(pQ);}}]:[];
   const asked=(questions||[]).map(a=>({g:"Questions people asked",ic:"?",t:a.question,
    s:`asked ${a.askedCount} time${a.askedCount===1?"":"s"}${a.headline?" · "+a.headline:""}`,
    rt:"↵",run:()=>{if(window.PulseLive&&window.PulseLive.askCustom)
      window.PulseLive.askCustom(a.question,PULSE_BAG,render);}}));
   pR=asked.concat(live,more,rulesMatching(q),PAL.filter(r=>(r.t+" "+r.s+" "+r.g).toLowerCase().includes(q)),askRow(raw));
   pD();});}}

/**
 * Rules and manifest lines matching what is typed.
 *
 * Searched locally because they are already in memory and there are twenty of
 * them — a round trip to find twenty rows would be slower than the typing.
 */
function rulesMatching(q){
 const st=window.PulseLive&&PulseLive.state; if(!st) return [];
 const out=[];
 const mr=st.motionRules;
 if(mr) Object.keys(mr).forEach(m=>mr[m].forEach(r=>{
  if(r.english.toLowerCase().includes(q)) out.push({g:"Rules",ic:r.then.act==="card"?"◆":"●",
   t:r.english,s:`${m} · ${r.live?"running today":"written down, not running yet"} · ${r.version}`,
   rt:"",run:()=>{S.v="auto";S.tab="rules";render();openRule(r.key);}});}));
 const mf=st.manifest;
 if(mf) ["yes","no"].forEach(side=>(mf[side]||[]).forEach(it=>{
  if(it.text.toLowerCase().includes(q)) out.push({g:"Rules",ic:side==="yes"?"✓":"✕",
   t:it.text,s:side==="yes"?"Allowed without asking":"Always needs a person",
   rt:"",run:()=>{S.v="auto";S.tab="rules";render();}});}));
 return out.slice(0,6);
}
function pD(){
 /* A search with nothing in it is a dead end unless it offers the one thing
    that always has an answer: ask it. askRow is normally appended alongside
    real matches — this is only the belt-and-suspenders case where somehow
    nothing else survived the filter either. */
 if(!pR.length&&pQ.trim())pR=[askRow(pQ.trim())];
 let o="",l="";pR.forEach((r,i)=>{if(r.g!==l){o+=`<div class="pg">${r.g}</div>`;l=r.g;}
 /* Resting rows carry a count instead of a subtitle, and read as one line. */
 o+=r.vc!=null
  ?`<button class="vrow" data-p="${i}" aria-selected="${i===pS}"><span class="vi">${r.ic}</span>
   <span class="vt2">${r.t}</span><span class="vc">${r.vc}</span></button>`
  :`<button class="prw" data-p="${i}" aria-selected="${i===pS}">${(""+r.ic).startsWith("<")?r.ic:`<span class="ic">${r.ic}</span>`}
  <span class="tx"><b>${r.t}</b><span>${r.s}</span></span><span class="rt">${r.rt||""}</span></button>`;});
 $("#pres").innerHTML=o||`<div class="pg">No match</div>`;}
function pO(){$("#pal").hidden=false;$("#pq").value="";pF("");$("#pq").focus();}
function pC(){$("#pal").hidden=true;}
function pRun(){const r=pR[pS];pC();if(r&&r.run)r.run();}

/* tooltip */
const tipEl=$("#tip");
document.addEventListener("mouseover",e=>{
 const t=e.target.closest("[data-tip]");if(!t)return;
 const[h,b]=t.dataset.tip.split("||");
 tipEl.innerHTML=`<b>${h}</b><i>${b}</i>`;tipEl.dataset.on="1";
 const r=t.getBoundingClientRect();
 tipEl.style.left="0px";tipEl.style.top="0px";
 const tw=tipEl.offsetWidth,th=tipEl.offsetHeight;
 let x=r.left+r.width/2-tw/2, y=r.top-th-9;
 if(y<8)y=r.bottom+9;
 x=Math.max(10,Math.min(x,window.innerWidth-tw-10));
 tipEl.style.left=x+"px";tipEl.style.top=y+"px";});
document.addEventListener("mouseout",e=>{if(e.target.closest("[data-tip]"))tipEl.dataset.on="0";});

/* Keyboard support for the rows marked role="button" — account links, wall
   logos, rule rows and the rest of the div/span "buttons" the delegated click
   handlers below already know how to act on. Firing a synthetic click lets
   every one of those handlers work unchanged rather than duplicating each of
   them for Enter/Space. */
document.addEventListener("keydown",e=>{
 if(e.key!=="Enter"&&e.key!==" ")return;
 const t=e.target.closest('[role="button"]');
 if(!t)return;
 e.preventDefault();t.click();
});

/* events */
document.addEventListener("click",e=>{
 const t=e.target;
 if(t.closest("[data-pal]")){pO();return;}
 const p=t.closest("[data-p]");if(p){pS=+p.dataset.p;pRun();return;}
 if(t===$("#pal")){pC();return;}
 if(t.closest("[data-crumb]")){const f=S.from;if(f){S.v=f.v;S.scope=f.scope;S.ask=f.ask;S.tab=f.tab;}
  else S.v="now";render();return;}
 /* The account menu's Autopilot entries name a surface and a tab on the same
    button. The tab has its own handler further down the file, but it runs after
    this one has already drawn — so "Rules" and "Connections" both opened on
    Activity. Read it here, before the render, and the later handler sets it a
    second time to the value it already has. */
 const nv=t.closest("[data-nav]");if(nv){S.v=nv.dataset.nav;
  if(nv.dataset.tab2)S.tab=nv.dataset.tab2;
  render();return;}
 const sc=t.closest("[data-sc]");if(sc){S.scope=sc.dataset.sc;
  /* Each scope scores a different set of accounts, so the board is per scope.
     It is cached in the data layer; this is a no-op the second time.
     boardLoaded is reset here, synchronously, in the same tick BOARD is
     cleared — loadBoard() below sets it false too, but only after an await,
     which left this render() painting with BOARD null and the *previous*
     scope's boardLoaded=true still standing, so the fallback path read the
     old sample HEALTH object as if it were this scope's real score. */
  BOARD=null;
  if(window.PulseLive)PulseLive.state.boardLoaded=false;
  render();
  /* Team and Company see the system alerts that Me does not, so they are
     re-read on a scope change rather than only at boot. */
  if(window.PulseLive&&PulseLive.loadAlerts)PulseLive.loadAlerts(render);
  if(window.PulseLive&&window.PulseLive.loadBoard)
   window.PulseLive.loadBoard(S.scope,PULSE_BAG,render);
  return;}
 const cu=t.closest("[data-cust]");
 if(cu&&CUST[cu.dataset.cust]){$("#pk").hidden=true;
  S.from={v:S.v,scope:S.scope,ask:S.ask,tab:S.tab,label:
   S.v==="ask"?"Ask · "+ASK[S.ask].q:S.v==="auto"?"Autopilot":
   S.scope==="me"?"Now · your work":S.scope==="team"?"Now · the team":"Now · the company"};
  S.cust=cu.dataset.cust;S.v="cust";render();return;}
 if(t.closest("#lensb")){const m=$("#lensm");m.hidden=!m.hidden;return;}
 if(t.closest("#lensc")||t.closest("#lensc2")||t.closest("#clrf")){S.C.clear();S.M.clear();S.lensAll=0;render();return;}
 if(t.closest("#lensmore")){S.lensAll=1;render();const m=$("#lensm");if(m)m.hidden=false;return;}
 if(t.closest("#lensfewer")){S.lensAll=0;render();const m=$("#lensm");if(m)m.hidden=false;return;}
 const mn=t.closest("[data-menu]");
 if(mn){const id=mn.dataset.menu,m=$("#menu-"+id);const was=m.hidden;
  $$(".menu").forEach(x=>x.hidden=true);m.hidden=!was;return;}
 const rv=t.closest("[data-rev]");if(rv){const b=$("#rev-"+rv.dataset.rev);b.hidden=!b.hidden;
  rv.setAttribute("aria-expanded",String(!b.hidden));
  $$(".menu").forEach(x=>x.hidden=true);return;}
 const dd=t.closest("[data-do]");if(dd){const c=CARDS[+dd.dataset.do];
  S.doneIds.add(+dd.dataset.do);
  /* Playing a card is what moves an account between bands — without this the
     board never changed and the score band was decoration. */
  const mv=c&&CARDMOVE[c.cust];
  if(mv&&mv[0]==="up"&&HEALTH[c.cust]){const to=parseInt((mv[1].split("→")[1]||"").trim(),10);
   if(to){HEALTH[c.cust][1]+=to-HEALTH[c.cust][0];HEALTH[c.cust][0]=to;
    HEALTH[c.cust][2]=to>=70?"thriving":to>=50?"steady":to>=35?"wobbling":"risk";}}
  S.doneOpen=1;render();
  const f=$("#dflash");
  if(f&&mv){f.hidden=false;f.innerHTML=mv[0]==="up"
   ?`✓ Played. <b>${c.cust} ${mv[1]}</b> — ${mv[2]}.`
   :`✓ Played. <b>${c.cust} holds at ${HEALTH[c.cust]?HEALTH[c.cust][0]:"where it was"}</b> — ${mv[2]}.`;}
  return;}
 /* Resuming from the alert itself. The switch is easy to set during an
    incident and easy to forget afterwards, so the place that tells you it is on
    is also the place that turns it off. */
 if(t.closest("[data-resume]")&&window.PulseLive&&PulseLive.setSendingPaused){
  PulseLive.setSendingPaused(false).then(()=>{
   if(PulseLive.loadAlerts) PulseLive.loadAlerts(render); else render();});return;}
 const askd=t.closest("[data-asked]");
 if(askd&&window.PulseLive&&PulseLive.askCustom){
  /* Re-runs the question. The SQL is remembered, so this costs a query rather
     than a call to an agent — and the rows are fetched fresh, never cached. */
  PulseLive.askCustom(decodeURIComponent(askd.dataset.asked),PULSE_BAG,render);return;}
 const brk=t.closest("[data-breaker]");
 if(brk&&window.PulseLive&&PulseLive.clearBreaker){
  brk.disabled=true;brk.textContent="…";
  PulseLive.clearBreaker(brk.dataset.breaker,render);return;}
 const ach=t.closest("[data-act]");if(ach){S.act=ach.dataset.act;S.openRow=null;render();return;}
 /* A row opens in place rather than in a panel: the evidence belongs next to
    the claim it supports, and Autopilot is a surface you scan, not one you
    navigate. */
 const dec=t.closest("[data-decision]");
 if(dec&&!t.closest("button")&&!t.closest("textarea")){
  openPanel("autopilot",dec.dataset.decision);$("#pk").hidden=false;return;}
 /* Manifest editing. Every path goes through PulseLive so the store, not the
    screen, is the source of truth — a rule that only changed in the DOM would
    be a lie the next time anyone loaded the page. */
 const re=t.closest("[data-redit]");if(re){S.editRule=re.dataset.redit;S.addingTo=null;render();return;}
 if(t.closest("[data-rcancel]")){S.editRule=null;S.addingTo=null;render();return;}
 const rao=t.closest("[data-raddopen]");if(rao){S.addingTo=rao.dataset.raddopen;S.editRule=null;render();return;}
 const rs=t.closest("[data-rsave]");
 if(rs&&window.PulseLive&&PulseLive.editRule){
  const ta=$(`[data-rt="${rs.dataset.rsave}"]`);
  if(ta&&ta.value.trim()){rs.disabled=true;rs.textContent="…";
   PulseLive.editRule(rs.dataset.rsave,ta.value.trim(),()=>{S.editRule=null;render();toastDone(null,true,"Rule saved.");});}
  return;}
 const radd=t.closest("[data-radd]");
 if(radd&&window.PulseLive&&PulseLive.addRule){
  const ta=$(`[data-rnew="${radd.dataset.radd}"]`);
  if(ta&&ta.value.trim()){radd.disabled=true;radd.textContent="…";
   PulseLive.addRule(radd.dataset.radd,ta.value.trim(),()=>{S.addingTo=null;render();toastDone(null,true,"Rule added.");});}
  return;}
 const rr=t.closest("[data-rretire]");
 if(rr&&window.PulseLive&&PulseLive.retireRule){
  PulseLive.retireRule(rr.dataset.rretire,()=>{render();toastDone(null,true,"Rule retired.");});return;}
 const rlz=t.closest("[data-release]");
 if(rlz&&window.PulseLive&&PulseLive.releaseDraft){
  const id=+rlz.dataset.release;
  const ta=$(`[data-body="${id}"]`);
  rlz.disabled=true;rlz.textContent="…";
  PulseLive.releaseDraft(id,ta?ta.value:null,PULSE_BAG,()=>{render();toastDone(null,true,"Draft released.");});return;}
 const dc=t.closest("[data-discard]");
 if(dc&&window.PulseLive&&PulseLive.discardDraft){
  dc.disabled=true;dc.textContent="…";
  PulseLive.discardDraft(+dc.dataset.discard,PULSE_BAG,()=>{render();toastDone(null,true,"Draft discarded.");});return;}
 const us=t.closest("[data-unsuppress]");
 if(us&&window.PulseLive&&PulseLive.unsuppress){
  us.disabled=true;us.textContent="…";
  PulseLive.unsuppress(us.dataset.unsuppress,PULSE_BAG,render);return;}
 const sn=t.closest("[data-snooze]");if(sn){S.snoozeIds.set(+sn.dataset.snooze,Date.now()+SNOOZE_MS);
  S.doneOpen=1;render();return;}
 const un=t.closest("[data-undo]");if(un){S.doneIds.delete(+un.dataset.undo);S.snoozeIds.delete(+un.dataset.undo);render();return;}
 if(t.closest("#dtog")){S.doneOpen=S.doneOpen?0:1;render();return;}
 if(t.closest("#ftog")){S.flightOpen=S.flightOpen?0:1;render();return;}
 if(t.closest("#rtog")){S.roomOpen=S.roomOpen?0:1;render();return;}
 const wr=t.closest("[data-wrong]");if(wr){$$(".menu").forEach(x=>x.hidden=true);
  const w=$("#wr-"+wr.dataset.wrong);w.hidden=!w.hidden;
  wr.setAttribute("aria-expanded",String(!w.hidden));return;}
 const ws=t.closest("[data-wsel]");if(ws){const reason=ws.textContent;S.doneIds.add(+ws.dataset.wsel);
  S.doneOpen=1;render();toastDone(null,true,`Got it — noted "${reason}".`);return;}
 const nr=t.closest("[data-newrule]");if(nr){if(canEditRules())openNewRule(nr.dataset.newrule);return;}
 const mot=t.closest("[data-mo-toggle]");if(mot){
  const k=mot.dataset.moToggle;
  S.moOpen.has(k)?S.moOpen.delete(k):S.moOpen.add(k);
  render();return;}
 const orl=t.closest("[data-openrule]");if(orl){openRule(orl.dataset.openrule);return;}
 const rl=t.closest("[data-rule]");if(rl){openRule(rl.dataset.rule);return;}
 /* Saving, testing and turning off a motion rule. All three go through the
    store: a rule that only changed on screen would be a lie the next time
    anyone loaded the page. */
 /* Writing a rule is three steps: type it, read back what Pulse understood,
    then decide whether to turn it on. The compiler runs once, here — never when
    a rule is being evaluated. */
 const rcp=t.closest("[data-rule-compile]");
 if(rcp&&window.PulseLive&&PulseLive.compileRule){
  const ta=$("#rule-en");
  if(!ta||!ta.value.trim())return;
  rcp.disabled=true;rcp.textContent="reading…";
  const box=$("#rule-compiled");
  if(box)box.innerHTML=`<p style="color:var(--muted);font-size:13px">Working out what that means…</p>`;
  PulseLive.compileRule(rcp.dataset.ruleCompile,ta.value.trim(),c=>{
   rcp.disabled=false;rcp.textContent="Read it back to me →";
   if(c)showCompiled(rcp.dataset.ruleCompile,ta.value.trim(),c);
   else if(box)box.innerHTML=`<p style="color:var(--watch);font-size:13px">Could not read that back. Try again, or save it without running it.</p>`;});
  return;}
 const rbld=t.closest("[data-rule-build]");
 if(rbld&&window.PulseLive&&PulseLive.buildAutomation){
  const ta=$("#rule-en");
  if(!ta||!ta.value.trim())return;
  rbld.disabled=true;rbld.textContent="building…";
  const box=$("#rule-compiled");
  const stopLoader=box?startBuildLoader(box):null;
  PulseLive.buildAutomation(rbld.dataset.ruleBuild,ta.value.trim(),plan=>{
   if(stopLoader)stopLoader();
   rbld.disabled=false;rbld.textContent="Build it as a live automation →";
   showBuilt(rbld.dataset.ruleBuild,ta.value.trim(),plan);});
  return;}
 const eab=t.closest("[data-ea-build]");
 if(eab&&window.PulseLive&&PulseLive.buildAutomation){
  const ta=$("#ea-en");
  if(!ta||!ta.value.trim())return;
  const eventName=eab.dataset.eaBuild;
  const box=$("#ea-result");
  eab.disabled=true;eab.textContent="building…";
  const stopLoader=box?startBuildLoader(box):null;
  PulseLive.buildAutomation("any",ta.value.trim(),plan=>{
   if(stopLoader)stopLoader();
   eab.disabled=false;eab.textContent="Build it as a live automation →";
   if(box)box.innerHTML=plan&&plan.ok
    ?`<p style="margin:0;color:var(--ok);font-size:13.5px">Built and running — see it in the list below.</p>`
    :`<p style="margin:0;color:var(--watch);font-size:13.5px">${esc((plan&&plan.message)||"Could not build that.")}</p>`;
   S.eaEvent="";
   ta.value="";
   if(window.PulseLive&&PulseLive.loadAutomations)PulseLive.loadAutomations(render);
  },eventName);
  return;}
 const aret=t.closest("[data-automation-retire]");
 if(aret&&window.PulseLive&&PulseLive.retireAutomation){
  aret.textContent="…";
  PulseLive.retireAutomation(aret.dataset.automationRetire,()=>{
   $("#ov").hidden=true;
   PulseLive.loadAutomations(render);});
  return;}
 const adel=t.closest("[data-automation-delete]");
 if(adel&&window.PulseLive&&PulseLive.deleteAutomation){
  const key=adel.dataset.automationDelete;
  if(!confirm("Delete this automation completely? This removes its cron job, its schedule and the row itself — it cannot be undone."))return;
  adel.textContent="…";
  PulseLive.deleteAutomation(key,(out)=>{
   if(!out.ok){alert(out.error||"Could not delete it.");adel.textContent="delete";return;}
   $("#ov").hidden=true;
   PulseLive.loadAutomations(render);});
  return;}
 /* A built automation's own row had no click at all — the compiled rules
    beside it open a popup, this just sat there. Checked after retire/delete
    above, so clicking those still does only that and never also opens this. */
 const oau=t.closest("[data-openautomation]");
 if(oau){openAutomation(oau.dataset.openautomation);return;}
 /* "Open account →" on a decision an automation raised. The account may not
    be in anybody's book yet — nothing before this fetched it by name, only
    by id — so this resolves the id to a name first, then opens the company
    page exactly the way every other entry point does. */
 const osa=t.closest("[data-open-scored-account]");
 if(osa&&window.PulseLive&&PulseLive.loadAccountById){
  const id=osa.dataset.openScoredAccount;
  osa.disabled=true;osa.textContent="Opening…";
  PulseLive.loadAccountById(id,PULSE_BAG,name=>{
   if(name){$("#pk").hidden=true;openCompany(name);}
   else{osa.disabled=false;osa.textContent="Open account →";
    alert("Could not open that account — it may have been removed.");}});
  return;}
 const rsn=t.closest("[data-rule-save-new]");
 if(rsn&&window.PulseLive&&PulseLive.addMotionRule){
  const cm=window.__compiled;
  const ta=$("#rule-en");
  const english=(ta&&ta.value.trim())||(cm&&cm.english);
  if(!english)return;
  rsn.disabled=true;rsn.textContent="…";
  PulseLive.addMotionRule(rsn.dataset.ruleSaveNew,english,
   cm&&cm.c&&cm.c.can_compile?{...cm.c,live:rsn.dataset.live==="1"}:{live:false},
   ()=>{window.__compiled=null;$("#ov").hidden=true;render();});
  return;}
 const rsv=t.closest("[data-rule-save]");
 if(rsv&&window.PulseLive&&PulseLive.saveMotionRule){
  const ta=$("#rule-en");
  if(ta&&ta.value.trim()){rsv.disabled=true;rsv.textContent="…";
   PulseLive.saveMotionRule(rsv.dataset.ruleSave,ta.value.trim(),()=>{$("#ov").hidden=true;render();});}
  return;}
 const rtst=t.closest("[data-rule-test]");
 if(rtst&&window.PulseLive&&PulseLive.testMotionRule){
  const box=$("#tres");box.hidden=false;box.textContent="Replaying the last 30 days…";
  PulseLive.testMotionRule(rtst.dataset.ruleTest,res=>{
   box.innerHTML=res
    ?`Would have applied to <b>${res.fired}</b> of ${res.considered} signups in the last ${res.days} days. `+
     (res.different?`<b>${res.different}</b> would have been decided differently${
       res.examples.length?" — "+res.examples[0]:""}.`:"Every one of them would have been decided the same way.")+
     `<br><span style="color:var(--muted)">${res.note}</span>`
    :"Could not run the test.";});
  return;}
 const rret=t.closest("[data-rule-retire]");
 if(rret&&window.PulseLive&&PulseLive.retireMotionRule){
  PulseLive.retireMotionRule(rret.dataset.ruleRetire,()=>{$("#ov").hidden=true;render();});return;}
 /* Reached only if the live layer is absent — the real test runs above, on
    [data-rule-test]. Say so rather than opening an empty box. */
 if(t.closest("#rtest")){const box=$("#tres");box.hidden=false;
  box.textContent="The live layer is not loaded, so the rule cannot be replayed here.";return;}

 /* Recompute one answer. The server drops its cached copy first, so the number
    that comes back is genuinely recomputed. */
 const rc=t.closest("[data-recompute]");
 if(rc){const id=rc.dataset.recompute;
  if(window.PulseLive&&PulseLive.recomputeAnswer){
   const peek=!$("#pk").hidden;
   PulseLive.recomputeAnswer(id,PULSE_BAG,()=>{render();if(peek)openPanel("answer",id);});
  }
  return;}

 /* The answer's own action, routed by answerActDest. The claim route opens the
    reassign dialog; that dialog's save is still waiting on a write endpoint. */
 const aa=t.closest("[data-answeract]");
 if(aa){const d=answerActDest(aa.dataset.answeract);
  if(!d)return;
  if(d.reassign){openReassign("Unassigned",0);return;}
  if(d.auto){S.v="auto";S.tab="activity";render();return;}
  S.ask=d.ask;S.sel=new Set();S.askTab="ask";S.v="ask";render();return;}

 /* Room to grow. */
 const op=t.closest("[data-opp]");
 if(op){openPanel("opp",JSON.parse(decodeURIComponent(op.dataset.opp)));return;}
 const off=t.closest("[data-oppoff]");
 if(off){S.roomOff.add(off.dataset.oppoff);
  if(off.dataset.pkclose)$("#pk").hidden=true;
  render();return;}

 const pc=t.closest("[data-pcontacts]");
 if(pc){openPanel("pcontacts",pc.dataset.pcontacts);return;}

 /* Bulk sheet: narrow the table to the rows that need a decision. */
 if(t.closest("#bulkdup")){S.bulkDup=!S.bulkDup;openSheet("bulk");return;}

 /* Tag sheet: chips are a picker, and what is picked lands in the box so the
    text about to be saved is the text on screen. */
 const tp=t.closest("[data-tagpick]");
 if(tp){const v=tp.dataset.tagpick;
  S.tagPick.has(v)?S.tagPick.delete(v):S.tagPick.add(v);
  openSheet("tag");
  const box=$("#ovb").querySelector("input.logbox");
  if(box)box.value=[...S.tagPick].join(", ");
  return;}

 /* An Autopilot proposal. Answering it writes the rule to the manifest — the
    list of what AI may and may not do — which is where a standing answer to
    "should I keep asking about this" belongs. */
 const pr=t.closest("[data-prop]");
 if(pr){const side=pr.dataset.prop,q=pr.dataset.propq;
  S.prDone.add(q);
  if(window.PulseLive&&PulseLive.addRule)
   PulseLive.addRule(side==="yes"?"yes":"no",q,()=>{S.tab="rules";render();});
  else render();
  return;}

 const ra=t.closest("[data-reassign]");if(ra){$$(".menu").forEach(x=>x.hidden=true);
  openReassign(CARDS[+ra.dataset.reassign].cust,1);return;}
 if(t.closest("#ovx")||t===$("#ov")){
  /* The reassign sheet owns its own open/closed state — closing it by hiding
     the element would leave PulseLive still thinking it is open, and the next
     render would put it straight back. */
  if(window.PulseLive&&PulseLive.state.reassign.open){PulseLive.closeReassign(render);return;}
  $("#ov").hidden=true;return;}
 const rpick=t.closest("[data-rep]");if(rpick){
  if(window.PulseLive&&PulseLive.state.reassign.open){
   PulseLive.pickRep(Number(rpick.dataset.rep),render);return;}
  $$("[data-rep]").forEach(x=>x.setAttribute("aria-selected",String(x===rpick)));return;}
 if(t.closest("#ovdo")){
  if(window.PulseLive&&PulseLive.state.reassign.open){
   PulseLive.saveReassign(PULSE_BAG,render);return;}
  $("#ov").hidden=true;return;}
 if(t.closest("#ovsplit")){if(window.PulseLive)PulseLive.applySplit(PULSE_BAG,render);return;}
 if(t.closest("#ovone")){if(window.PulseLive)PulseLive.applyPileToOne(PULSE_BAG,render);return;}
 const q2=t.closest("[data-q2]");if(q2){openPanel("answer",q2.dataset.q2);return;}
 const lg=t.closest("[data-log]");if(lg){openPanel("decision",lg.dataset.log);return;}
 const mi=t.closest("[data-mail]");if(mi){openPanel("mail",mi.dataset.mail);return;}
 const rd=t.closest("[data-row-detail]");
 if(rd){openPanel("rowdetail",JSON.parse(decodeURIComponent(rd.dataset.rowDetail)));return;}
 const at=t.closest("[data-atab]");if(at){S.askTab=at.dataset.atab;render();return;}
 const hq=t.closest(".hrow");if(hq){S.ask=hq.dataset.q;S.sel=new Set();render();return;}
 if(t.closest("#morewall")){
  if(window.PulseLive)window.PulseLive.loadMoreAccounts(PULSE_BAG,render);return;}
 if(t.closest("#morenotes")){
  if(window.PulseLive)window.PulseLive.loadMoreAccountFeed("notes",PULSE_BAG,render);return;}
 if(t.closest("#morerecent")){
  if(window.PulseLive)window.PulseLive.loadMoreAccountFeed("recently",PULSE_BAG,render);return;}
 if(t.closest("#moreaudit")){
  if(window.PulseLive)window.PulseLive.loadMoreAudit(PULSE_BAG,render);return;}
 if(t.closest("#pinq")){togglePin();return;}
 const shq=t.closest("#shareq");if(shq){
  /* The same deep link Back/Forward already understand — routePath() is what
     routeSync() writes into the address bar for this exact answer. */
  const url=location.origin+routePath();
  const said=()=>{const was=shq.textContent;shq.textContent="Copied ✓";setTimeout(()=>{shq.textContent=was;},1600);};
  if(navigator.clipboard&&navigator.clipboard.writeText){
   navigator.clipboard.writeText(url).then(said).catch(()=>{shq.textContent="Copy failed";});
  }else{
   window.prompt("Copy this link",url);}
  return;}
 if(t.closest("#loadmore")){
  if(window.PulseLive&&window.PulseLive.loadMoreAnswer)
   window.PulseLive.loadMoreAnswer(S.ask,PULSE_BAG,render);
  return;}
 const q=t.closest("[data-q]");if(q){
  const qid=q.dataset.q;
  /* A pinned typed question is a question, not a frozen answer — opening it
     runs it again, the same as a catalogue question refetches. */
  if(TYPEDQ[qid]&&window.PulseLive&&window.PulseLive.askCustom){
   window.PulseLive.askCustom(TYPEDQ[qid],PULSE_BAG,render);return;}
  S.ask=qid;S.sel=new Set();S.askTab="ask";S.v="ask";render();return;}
 const tt2=t.closest("[data-tt]");if(tt2){S.teamTab=tt2.dataset.tt;render();return;}
 const tb=t.closest("[data-tab]");if(tb){S.tab=tb.dataset.tab;render();return;}
 if(t.closest("#revm")){const m=$("#moneyb"),r=$("#ratesb");m.hidden=!m.hidden;
  if(r)r.hidden=m.hidden;
  $("#revm").textContent=m.hidden?"Show payments and rates":"Hide payments and rates";return;}
 if(!t.closest(".lensw")){const m=$("#lensm");if(m)m.hidden=true;}
});
document.addEventListener("change",e=>{
 if(e.target.id==="ea-event"){S.eaEvent=e.target.value;render();return;}
 const rw=e.target.closest("[data-row]");
 if(rw){const n=+rw.dataset.row;rw.checked?S.sel.add(n):S.sel.delete(n);render();return;}
 const i=e.target.closest("#lensm input");if(!i)return;
 /* One country and one motion, or All of either — which is what the empty
    value on the first radio in each group means. S.C and S.M stay Sets so every
    filter downstream reads the same; they just never hold more than one value,
    and an empty one means "not filtering on this".

    These were checkboxes, and the mismatch was the bug: a square box invites
    you to tick three countries, and ticking the second silently unticked the
    first. Getting back to All meant clicking the chosen one again — an
    interaction nothing hinted at, and one a radio does not even fire a change
    event for, so as radios it would have been a dead end. Hence a real All
    option in each group rather than a gesture people had to guess at.

    "Clear all" stays: it resets both halves at once, which the two All options
    can only do in two clicks. */
 const set="c" in i.dataset?S.C:S.M,v=i.dataset.c||i.dataset.m;
 set.clear();if(v)set.add(v);
 render();
 const m=$("#lensm");if(m)m.hidden=false;});
$("#pq").addEventListener("input",e=>pF(e.target.value));

/**
 * Escape closes the topmost thing that is open, and nothing else.
 *
 * It used to be three handlers that did not know about each other. The one
 * registered first said "Escape on a company page means go back to Now", so
 * pressing it with a sheet open left the sheet on screen and navigated the
 * page out from under it — and once the URL router landed, that was a real
 * history entry, which is why it read as the browser going back.
 *
 * One resolver instead, in z-order, because that is the order they stack in:
 *
 *   onb   150   first-run setup, a full-screen takeover
 *   pal   120   the ⌘K palette
 *   pk    115   the right-hand drawer
 *   ov    110   sheets — reassign, members, log, tag, rules
 *   menus  80   the account menu, row menus, the lens
 *
 * Returns true when it consumed the key, so the caller knows to stop rather
 * than fall through to backing out of the page.
 */
function escClose(){
 if(!$("#onb").hidden){$("#onb").hidden=true;return true;}
 if(!$("#pal").hidden){pC();return true;}
 if(!$("#pk").hidden){$("#pk").hidden=true;return true;}
 if(!$("#ov").hidden){
  /* The reassign sheet keeps its own open/closed state in PulseLive, so
     hiding the element behind its back would have the next render put it
     straight back up. */
  if(window.PulseLive&&PulseLive.state.reassign&&PulseLive.state.reassign.open){
   PulseLive.closeReassign(render);return true;}
  $("#ov").hidden=true;return true;}
 /* Menus last: they are the least modal thing on screen, and closing one
    should never be what Escape does while a sheet is up. */
 const menus=[$("#amenu"),$("#lensm"),...$$(".menu")].filter(m=>m&&!m.hidden);
 if(menus.length){menus.forEach(m=>{m.hidden=true;});return true;}
 return false;
}

document.addEventListener("keydown",e=>{
 const open=!$("#pal").hidden;
 /* The header search bar is focusable, so ↵ and space open it too. */
 if(!open&&(e.key==="Enter"||e.key===" ")&&document.activeElement
  &&document.activeElement.closest&&document.activeElement.closest("[data-pal]")){
  e.preventDefault();pO();return;}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();open?pC():pO();return;}
 if(open){if(e.key==="Escape"){e.preventDefault();pC();return;}
  if(e.key==="ArrowDown"){e.preventDefault();pS=Math.min(pS+1,pR.length-1);pD();}
  if(e.key==="ArrowUp"){e.preventDefault();pS=Math.max(pS-1,0);pD();}
  if(e.key==="Enter"){e.preventDefault();pRun();}return;}
 if(e.key!=="Escape")return;
 /* Something open? Close it and stop — Escape dismisses one layer at a time,
    and leaving the page is not a dismissal. */
 if(escClose()){e.preventDefault();return;}
 /* Nothing open, and you are on a company page: Escape is "back to where I
    came from", the same as the crumb. Going through the crumb's own state
    rather than hardcoding "now" is what makes Escape return you to the board
    or the answer you opened the company from, instead of dumping you on Now. */
 if(S.v==="cust"){
  const f=S.from;
  if(f){S.v=f.v;S.scope=f.scope;S.ask=f.ask;S.tab=f.tab;}else S.v="now";
  render();}});

function drawOnb(){
 const i=S.ostep,[st,h,p2,kind]=ONB[i];
 $("#osteps").innerHTML=ONB.map((_,n)=>`<i data-on="${n===i?1:0}" data-done="${n<i?1:0}"></i>`).join("");
 let extra="",cta="Continue",skip=1;
 if(kind==="connect"){extra=`<div class="cxn" data-on="0"><span class="ico">G</span><div class="cx">
   <b>Google · mail and calendar</b><p>${ME.email_addr||"your email"}</p>
   <div class="sc3">READ ONLY · CUSTOMER THREADS ONLY · NEVER PERSONAL MAIL<br>
    I NEVER SEND FROM YOUR ADDRESS WITHOUT YOU PRESSING SEND<br>
    DISCONNECT WHENEVER YOU LIKE — I FORGET WITHIN 24 HOURS</div></div></div>
   <div class="cxn" data-on="1"><span class="ico">W</span><div class="cx">
    <b>Your WhatsApp Business number <span class="ok2">+91 90000 00012</span></b>
    <p>Already provisioned. Save it now and stop giving out your personal number — every thread on this one is visible to Pulse.</p></div></div>`;
  cta="Connect Google →";}
 if(kind==="book"){const keep=BOOK.concat(ONBSTATE.added).filter(b=>!ONBSTATE.dropped.has(b[1]));
  extra=`<div style="border-top:1px solid var(--line)">${keep.map(b=>`<div class="lrow">
    <span class="nm2">${LOGO(b[1],24)}${b[1]}</span>
    <span class="ds">${b[2]} · ${b[3]}</span>
    <button class="skip" data-drop="${b[1]}">Not mine</button></div>`).join("")}</div>
   <div class="row2" style="margin-top:16px">
    ${ONBSTATE.adding
     ?`<input class="logbox" id="addacctbox" style="min-height:0;padding:8px 11px;font-size:13.5px;width:220px" placeholder="Company name">
      <button class="go solid" id="addacctgo" style="padding:8px 13px;font-size:13px">Add</button>
      <button class="go" id="addacctcancel" style="padding:8px 13px;font-size:13px">Cancel</button>`
     :`<button class="go" id="addacctopen">＋ Add an account I own</button>`}
    <span style="font-size:13px;color:var(--faint)">${keep.length} of ${18+ONBSTATE.added.length} · nine came across when Sample Rep 9 left${
     ONBSTATE.dropped.size?` · ${ONBSTATE.dropped.size} removed`:""}</span></div>`;
  cta="Save and continue →";skip=0;}
 if(kind==="voice"){
  const V=window.PulseLive&&PulseLive.state.voice;
  extra=`<div class="voice">
   <div class="vt">${ONBSTATE.traits.map(v=>`<span>${esc(v)} <button data-untrait="${esc(v)}" style="color:var(--faint);margin-left:4px">✕</button></span>`).join("")}
    <button class="chip" data-addtrait>＋ Add how you write</button></div>
   <div id="traitadd" hidden style="margin-top:10px">
    <input class="logbox" id="traitin" maxlength="120" placeholder="e.g. Never promises a date without checking"
     style="width:100%;font:inherit;font-size:13.5px;padding:10px 12px;border:1px solid var(--line2);
     border-radius:8px;background:var(--raise);color:var(--ink)">
    <div class="row" style="margin-top:9px"><button class="go solid" id="traitsave">Add it →</button>
     <button class="go" id="traitx">Cancel</button></div></div>
   <blockquote>“Sample Contact — yesterday was on us. The Etisalat route failed at 3:02 and we moved you across twelve minutes later.”</blockquote>
   <p style="font-size:12.5px;color:var(--faint);margin:12px 0 0">${
     V&&V.error?`Not saving: ${esc(V.error)} — changes here will be lost.`
     :V&&V.edited?"Yours, saved against your sign-in. Only you can see or change this list."
     :"The five defaults everybody starts with. Change any of them and the list becomes yours."}</p>
   <p style="font-size:12.5px;color:var(--faint);margin:6px 0 0">The example above is a sample of the house style, not something of yours — Pulse has no mailbox connection yet.</p>
   </div>`;
  cta="That is me →";skip=0;}
 if(kind==="done"){
  skip=0;cta="Show me →";
  /* Real numbers when boot() has already answered — it fires on page load,
     well before a menu click can reach step 4 — else the honest generic
     sentence above stays, rather than a made-up count. */
  const ap=window.PulseLive&&PulseLive.state.autopilot;
  const n=CARDS.length;
  if(n||ap){
   p2=`${n?`${n} thing${n===1?"":"s"} need${n===1?"s":""} you right now.`:"Nothing needs you right now."} ${
    ap?`I have already handled ${ap.total.toLocaleString("en-IN")} decisions on my own`:"I handle plenty on my own"
   }, and you can see every one of them in Autopilot whenever you want to check my work.`;
  }
 }
 $("#oc").innerHTML=`<div class="st2">${st}</div><h2>${h}</h2><p class="lead">${p2}</p>${extra}
  <div class="row2"><button class="go solid" id="onext">${cta}</button>
   ${i>0?`<button class="skip" id="oback">Back</button>`:""}
   ${skip?`<button class="skip" id="oskip">I will do this later</button>`:""}</div>`;
}
function openOnb(){S.ostep=0;$("#onb").hidden=false;drawOnb();
 /* Fetched when the flow opens rather than at boot: most sessions never see
    onboarding, and this is one more round trip on the first paint otherwise. */
 if(window.PulseLive)PulseLive.loadVoice(PULSE_BAG,drawOnb);}

/* Gmail, Google Calendar and Slack, via ViaSocket. Three distinct apps, three
   distinct ViaSocket plugin ids (from plug-service.viasocket.com/plugins/search),
   so unlike an early version of this, connecting one no longer marks another —
   each is its own popup and its own OAuth. ME's toggle key, the pulse_connection
   "service" value and ViaSocket's own plugin id can all differ per app, so
   they are looked up together here rather than assumed equal.
   Each open asks the server for a fresh token (never signed in the browser,
   see /api/pulse/viasocket/token) and passes it straight to ViaSocket's own
   script (loaded globally in app/layout.tsx), never storing it. Success and
   disconnect are both saved server-side too (/api/pulse/connections,
   pulse_connection — migrations/012), so the state is Pulse's, not just this
   tab's memory. */
const VIASOCKET_APPS={
 gmail:{service:"gmail",pluginId:"rowo0bqrhj5g",label:"Gmail"},
 cal:{service:"cal",pluginId:"rowkhibv5efp",label:"Google Calendar"},
 slackapp:{service:"slack",pluginId:"rowbu58rc",label:"Slack"}};
let onViasocketDone=null;
let pendingConnectKey=null;

/* react-hot-toast's own function, handed over by app/toast-bridge.tsx (a
   React island — this file is plain script and has no other way to reach a
   component tree). Falls back to alert() for the rare case this fires before
   that bridge has mounted, so a failure is never silent. */
function toastLoading(msg){return window.pulseToast?window.pulseToast.loading(msg):null;}
function toastDone(id,ok,msg){
 if(window.pulseToast){if(id)window.pulseToast.dismiss(id);window.pulseToast[ok?"success":"error"](msg);}
 else if(!ok)alert(msg);
}

function saveConnection(service,action,viasocketId){
 return fetch("/api/pulse/connections",{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({service,action,viasocketId})}).catch(()=>{});
}
/* key: "gmail" | "cal" | "slackapp" — one popup, one app. The onboarding step
   chains connectApp("gmail",()=>connectApp("cal",onDone)) to cover both. */
function connectApp(key,onDone){
 const app=VIASOCKET_APPS[key];
 if(!app){onDone&&onDone();return;}
 const loadingId=toastLoading(`Opening ${app.label}…`);
 fetch("/api/pulse/viasocket/token").then(r=>r.json()).then(d=>{
  if(!d.ok){toastDone(loadingId,false,d.error||"Could not start the connection.");return;}
  if(!window.openViasocketConnection){toastDone(loadingId,false,"Connect isn't ready yet — reload and try again.");return;}
  onViasocketDone=onDone;
  pendingConnectKey=key;
  pendingConnectToast=loadingId;
  window.openViasocketConnection(d.token,app.pluginId);
 }).catch(()=>toastDone(loadingId,false,"Could not start the connection."));
}
let pendingConnectToast=null;
window.addEventListener("message",e=>{
 if(!e.data||!e.data.type)return;
 if(e.data.type==="viasocket_connection_success"){
  const key=pendingConnectKey,app=key&&VIASOCKET_APPS[key],toastId=pendingConnectToast;
  pendingConnectKey=null;pendingConnectToast=null;
  if(app){
   ME[key]=1;
   const vid=e.data.data&&e.data.data.id?e.data.data.id:null;
   const saved=saveConnection(app.service,"connected",vid);
   toastDone(toastId,true,`${app.label} connected.`);
   // The server only has a script_id to run Gmail actions with once this
   // POST lands — reset the cached "loaded" flag and wait for it before
   // asking for recent mail, or the first fetch just fails "not connected".
   if(key==="gmail"&&window.PulseLive){
    window.PulseLive.state.gmailRecentLoaded=false;
    saved.then(()=>window.PulseLive.loadGmailRecent(PULSE_BAG,render));
   }
  }
  const fn=onViasocketDone;onViasocketDone=null;
  if(fn)fn();else if(S.v==="profile")render();
 }else if(e.data.type==="viasocket_connection_error"){
  const key=pendingConnectKey,app=key&&VIASOCKET_APPS[key],toastId=pendingConnectToast;
  onViasocketDone=null;pendingConnectKey=null;pendingConnectToast=null;
  toastDone(toastId,false,`Connecting ${app?app.label:"the app"} failed`+
   (e.data.error&&e.data.error.message?`: ${e.data.error.message}`:"."));
 }else if(e.data.type==="viasocket_connection_closed"){
  /* Popup dismissed with nothing decided — no success, no error. Just clear
     the loading toast rather than leave it spinning forever; not a failure
     worth alarming over. */
  if(pendingConnectToast&&window.pulseToast)window.pulseToast.dismiss(pendingConnectToast);
  onViasocketDone=null;pendingConnectKey=null;pendingConnectToast=null;
 }
});

document.addEventListener("click",e=>{
 const t=e.target;
 if(t.closest("#abtn")){const m=$("#amenu");m.hidden=!m.hidden;return;}
 if(!t.closest(".whow"))$("#amenu").hidden=true;
 if(t.closest("#startonb")){$("#amenu").hidden=true;openOnb();return;}
 /* The profile page's own way into the traits editor — the step that owns it. */
 if(t.closest("#startonb2")){openOnb();S.ostep=2;drawOnb();return;}
 if(t.closest("#onbx")){$("#onb").hidden=true;return;}
 if(t.closest("#retrycards")){
  /* Retry the one query that failed, not the whole bootstrap — the rest of
     the screen is already real and re-fetching it would throw that away. */
  if(window.PulseLive&&PulseLive.loadCards)PulseLive.loadCards(PULSE_BAG,render);
  return;}
 if(t.closest("#mockx")){
  if(window.PulseLive)PulseLive.state.mockDismissed=true;
  const bar=$("#mockbar");if(bar)bar.hidden=true;
  return;}
 if(t.closest("#oskip")){ME.gmail=0;ME.cal=0;S.ostep++;drawOnb();return;}
 if(t.closest("#oback")){S.ostep=Math.max(0,S.ostep-1);drawOnb();return;}
 const dp=t.closest("[data-drop]");if(dp){ONBSTATE.dropped.add(dp.dataset.drop);drawOnb();return;}
 if(t.closest("#addacctopen")){ONBSTATE.adding=true;drawOnb();
  const box=$("#addacctbox");if(box)box.focus();return;}
 if(t.closest("#addacctcancel")){ONBSTATE.adding=false;drawOnb();return;}
 if(t.closest("#addacctgo")){
  const box=$("#addacctbox"),name=box?box.value.trim():"";
  if(name){
   const ini=name.split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?";
   ONBSTATE.added.push([ini,name,"—","Inbound","added by you",1]);
   ONBSTATE.dropped.delete(name);
  }
  ONBSTATE.adding=false;drawOnb();return;}
 const ut=t.closest("[data-untrait]");if(ut){
  const gone=ut.dataset.untrait;
  /* Optimistic, then corrected by whatever the server says the list is —
     the same shape as removing a tag. */
  ONBSTATE.traits=ONBSTATE.traits.filter(x=>x!==gone);drawOnb();
  if(window.PulseLive)PulseLive.removeVoiceTrait(gone,PULSE_BAG,drawOnb);
  return;}
 /* Adding one used to push a fixed string — "Uses the customer's first name
    only" — whatever you meant to say. It asks now. */
 if(t.closest("[data-addtrait]")){
  const box=$("#traitadd");if(box){box.hidden=false;const i=$("#traitin");if(i)i.focus();}
  return;}
 if(t.closest("#traitx")){const box=$("#traitadd");if(box)box.hidden=true;return;}
 if(t.closest("#traitsave")){
  const i=$("#traitin"),v=i?i.value.trim():"";
  if(v.length<2){if(i)i.focus();return;}
  if(window.PulseLive)PulseLive.addVoiceTrait(v,PULSE_BAG,drawOnb);
  else{ONBSTATE.traits.push(v);drawOnb();}
  return;}
 if(t.closest("#onext")){
  if(ONB[S.ostep][3]==="connect"){
   connectApp("gmail",()=>connectApp("cal",()=>{
    S.ostep++;
    if(S.ostep>=ONB.length){$("#onb").hidden=true;S.v="now";render();return;}
    drawOnb();}));
   return;}
  S.ostep++;
  if(S.ostep>=ONB.length){$("#onb").hidden=true;S.v="now";render();return;}
  drawOnb();return;}
 const tg=t.closest("[data-toggle]");
 if(tg){const k=tg.dataset.toggle;
  if(VIASOCKET_APPS[k]&&!ME[k]){connectApp(k,()=>render());return;}
  ME[k]=ME[k]?0:1;
  if(VIASOCKET_APPS[k]&&!ME[k]){
   saveConnection(VIASOCKET_APPS[k].service,"disconnected",null);
   if(k==="gmail"&&window.PulseLive){
    window.PulseLive.state.gmailRecent=null;
    window.PulseLive.state.gmailRecentError=null;
    window.PulseLive.state.gmailRecentLoaded=false;
   }
  }
  if(S.v==="profile")render();else if(tg.classList.contains("sw"))tg.dataset.on=ME[k];return;}
 const t2=t.closest("[data-tab2]");if(t2){S.tab=t2.dataset.tab2;}
 if(t.closest("[data-admin]")){$("#amenu").hidden=true;
  $("#ovb").innerHTML=`<h3>Admin</h3><p class="sub">Everything that is set once for the whole company, not per person.</p>
   ${[["Products","Ten products, billing type, which entity sells which"],
      ["Rate cards","Four entities, four currencies, floors and approval thresholds"],
      ["Entities","India, UAE, United States, Singapore"],
      ["Team and roles","25 in sales, 25 in support, who can reveal what"],
      ["Channels","WhatsApp number, sender IDs, DLT headers"],
      ["Policies","Autonomy levels, escalation ladders, retention"]]
    .map(([a,b2])=>`<div class="rp" style="opacity:.6"><span class="av2" style="color:var(--faint)">SOON</span><span class="tx2"><b>${a}</b><span>${b2}</span></span></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:8px">None of these have a page behind them yet — coming soon.</p>
   <div class="row" style="margin-top:18px"><button class="go" id="ovx">Close</button></div>`;
  $("#ov").hidden=false;return;}
});


const RULEDEF={
 when:"A new signup arrives",
 whenOpts:["A new signup arrives","A payment is received","Usage drops below normal","A customer replies","A promise falls due","Every morning at 08:00"],
 ifs:[["Quality score","is at least","80"],["Country","is any of","India, UAE, US, Singapore"],["Motion","is","Inbound"]],
 thens:[["CARD","Put a card in front of the owner","Call {person} at {company}"],
  ["ACT","Start a clock on that card","10 minutes"],
  ["ACT","Escalate to the manager when the clock hits zero",""],
  ["ACT","Send an FYI on Slack","the owner and their manager"]],
 stops:["The customer replies first","Nobody owns the account — route to the team queue instead",
  "It is outside working hours in that country"],
 who:"Sample Rep 1, Sample Rep 2, Sample Rep 3 · 312 accounts",
 ver:"v8 · changed by Sample Rep 4 today 08:58 · 7 earlier versions"};

/**
 * The rule sheet.
 *
 * Written in plain English on purpose. If you cannot read a rule aloud, it is
 * too complicated to trust — and the person changing it is a salesperson, not
 * an engineer.
 *
 * What a person edits is the sentence. Underneath it, in smaller type, is what
 * Autopilot actually checks — shown, never hidden, because a rule you cannot
 * verify is a rule you are only hoping about.
 */
/**
 * Event automations — its own card, separate from any one motion's list.
 *
 * Schedule automations belong to a motion because that is what "add a rule
 * to Inbound" means. An event automation does not belong anywhere in
 * particular — "when a tag is added" is not an Inbound or Outbound thing —
 * so it gets one place of its own rather than being folded into whichever
 * motion happened to have the button. Picking the event comes first here,
 * on purpose: what to do is only writable once you know what you're
 * reacting to.
 */
let eaEventsCache=null;
function eventAutomationCard(){
 if(eaEventsCache===null){
  eaEventsCache=[];
  if(window.PulseLive&&PulseLive.loadEventCatalogue)
   PulseLive.loadEventCatalogue(events=>{eaEventsCache=events;render();});
 }
 const events=eaEventsCache;
 const built=((window.PulseLive&&PulseLive.state.automations)||[]).filter(a=>a.triggerKind==="event"&&a.state!=="retired");
 return `<div class="lab" style="margin:34px 0 0">Event automations</div>
  <div class="prop" style="border-style:solid">
   <h4>React to something happening, not a schedule</h4>
   <p>Pick what should trigger it first, then describe what Autopilot should do when it fires.</p>
   <select id="ea-event" style="width:100%;font:inherit;font-size:13.5px;padding:9px 11px;
    border:1px solid var(--line2);border-radius:8px;background:var(--raise);color:var(--ink)">
    <option value="">${events.length?"Choose an event…":"Loading events…"}</option>
    ${events.map(e=>`<option value="${e.name}"${S.eaEvent===e.name?" selected":""}>${esc(e.label)}</option>`).join("")}
   </select>
   ${S.eaEvent?`<textarea id="ea-en" placeholder="What should Autopilot do when this happens?" style="width:100%;
     min-height:70px;font:inherit;font-size:14px;padding:11px;border:1px solid var(--line2);border-radius:8px;
     background:var(--raise);color:var(--ink);resize:vertical;margin-top:10px"></textarea>
    <div class="row" style="margin-top:12px">
     <button class="go solid" data-ea-build="${S.eaEvent}">Build it as a live automation →</button></div>
    <div id="ea-result" style="margin-top:14px"></div>`:""}
  </div>
  ${built.length?`<div style="margin-top:16px">${built.map(a=>
    `<div class="ru" data-openautomation="${a.key}" style="cursor:pointer" role="button" tabindex="0">
     <em data-k="${a.live?"ACT":"CARD"}" style="opacity:${a.live?1:.5}">EVENT</em>
     <span${a.live?"":' style="color:var(--faint)"'}>${esc(a.summary||a.english)}
      <em style="font-style:normal;font-size:11px;color:var(--faint);margin-left:6px">on ${esc(a.whenEvent||"?")}</em></span>
     ${canEditRules()?`<span class="pen" data-automation-retire="${a.key}" style="cursor:pointer;white-space:nowrap">turn off</span>
      <span class="pen" data-automation-delete="${a.key}" style="cursor:pointer;color:var(--danger,#a8462a);margin-left:10px;white-space:nowrap">delete</span>`:""}</div>`).join("")}</div>`:""}`;
}

/**
 * Writing a new rule.
 *
 * A person types the sentence. Turning that into something Autopilot can check
 * is a separate step, done once and confirmed by a person — never at decision
 * time. Until that happens the rule is saved, visible, and honest about not
 * running yet.
 */
function openNewRule(motion){
 $("#ovb").innerHTML=`<div class="red">
  <h3>New ${motion} rule</h3>
  <p class="sub">Write it as a sentence you could say out loud to a new teammate.
   Pulse will read it back as the check it would actually perform — if that is not
   what you meant, change the words rather than the machinery.</p>
  <h4>The rule</h4>
  <textarea id="rule-en" placeholder="For example: If a signup has not sent a message twelve days after signing up, a person should take over."
   style="width:100%;min-height:80px;font:inherit;font-size:14px;padding:11px;border:1px solid var(--line2);
   border-radius:8px;background:var(--raise);color:var(--ink);resize:vertical"></textarea>
  <div class="row" style="margin-top:16px">
   <button class="go solid" data-rule-compile="${motion}">Read it back to me →</button>
   <button class="go" data-rule-build="${motion}">Build it as a live automation →</button>
   <button class="go" id="ovx">Cancel</button></div>
  <div id="rule-compiled" style="margin-top:18px"></div>
  <div class="ver">NOTHING RUNS UNTIL YOU CONFIRM IT.</div></div>`;
 $("#ov").hidden=false;
}

/**
 * A real loader for the build wait — this takes real seconds (planning,
 * a dry run against the database, sometimes a cron-job.org call), not a
 * split-second fetch a static line would cover. The spinner is the existing
 * `.loader`; the text cycles through what's actually happening in roughly
 * the order it happens, so the wait reads as progress rather than a stall.
 * Returns a function that stops the cycle — call it once the real result
 * arrives, whichever box is showing it by then.
 */
function startBuildLoader(box){
 const STAGES=["Reading the rule and planning how to check it…",
  "Working out a safe query against the real data…",
  "Testing that query for real, before anything is saved…",
  "Scheduling it, if it needs one…"];
 let i=0;
 const paint=()=>{box.innerHTML=`<div class="row" style="align-items:center;gap:10px">
   <span class="loader" style="width:18px;height:18px;border-width:2px"></span>
   <p style="margin:0;color:var(--muted);font-size:13px">${STAGES[i%STAGES.length]}</p></div>`;};
 paint();
 const id=setInterval(()=>{i++;paint();},2200);
 return ()=>clearInterval(id);
}

/**
 * Show what the automation planner built: its own agent, its own schedule,
 * running the moment this appears — unlike the sentence-rule path above,
 * there is no separate confirm step, because the plan already ran through the
 * SQL guard before anything was provisioned.
 */
function showBuilt(motion,english,plan){
 const box=$("#rule-compiled"); if(!box) return;
 if(!plan||!plan.ok){
  // The real error (plan.error) is logged server-side for whoever debugs
  // this later — a person writing a rule sees plain English, not a database
  // message or a GTWY error body.
  box.innerHTML=`<div class="cl2" style="display:block;padding:14px 16px;background:var(--sink);border-radius:8px">
    <b style="color:var(--watch)">Could not build that.</b>
    <p style="margin:8px 0 0;color:var(--ink2);font-size:13.5px">${esc((plan&&plan.message)||"Something went wrong building this — try again in a moment.")}</p></div>
   <div class="row" style="margin-top:14px"><button class="go" onclick="document.getElementById('rule-en').focus()">Rewrite it</button></div>`;
  return;}
 box.innerHTML=`<div class="cl2" style="display:block;padding:14px 16px;background:var(--sink);border-radius:8px">
   <div class="lab">Now running</div>
   <div style="font-size:14px;color:var(--ink);line-height:1.7;margin-top:8px">${plan.optimizedPrompt}</div>
   <p style="margin:10px 0 0;color:var(--muted);font-size:12.5px">
    ${plan.mode==="cron"?`Checked on schedule <code>${plan.cronSchedule}</code>.`:"Runs on an event, not a schedule."}
    Its own agent judges each row it finds.</p>
  </div>
  <div class="row" style="margin-top:14px">
   <button class="go" data-automation-retire="${plan.key}">Turn it off</button>
   <button class="go" id="ovx">Done</button></div>`;
 window.__built={motion,english,plan};
 if(window.PulseLive&&PulseLive.loadAutomations)PulseLive.loadAutomations(render);
}

/**
 * Show what the compiler understood, in the reader's own language.
 *
 * This is the only screen between a sentence and an automation, so it says the
 * check in words rather than in fields, and it offers two ways to save. A rule
 * that is written down but not running is useful; a rule that looks live and
 * never fires is a trap.
 */
function showCompiled(motion,english,c){
 const box=$("#rule-compiled"); if(!box) return;
 const names={score:"the signup's score",confidence:"how sure the AI is",verdict:"what the AI decided",
  motion:"how they arrived",entity:"which entity",is_free_mail:"a free mailbox",mobile_present:"a mobile number",
  accounts_on_domain:"accounts on the same domain",domain_matches_known_customer:"the domain already pays us",
  domain_matches_competitor:"the domain is a competitor",signup_step_reached:"how far they got in signup",
  industry:"their industry",owner_auto_assigned:"somebody owns the account",days_since_signup:"days since they signed up",
  messages_sent:"messages they have sent",days_since_payment:"days since their last payment",
  spend_change_pct:"spend against the window before"};
 const ops={">=":"is at least","<=":"is at most",">":"is over","<":"is under","==":"is","!=":"is not","in":"is one of"};
 const doing={score:"score the signup",raise_card:"put a card in front of a person",
  nurture:"start the message sequence",suppress:"file it under Suppressed",
  draft:"write a message and hold it",wait:"wait",notify:"tell someone"};
 const line=x=>`${names[x.field]||x.field} ${ops[x.op]||x.op} <b>${x.value}</b>`;

 if(!c.can_compile){
  box.innerHTML=`<div class="cl2" style="display:block;padding:14px 16px;background:var(--sink);border-radius:8px">
    <b style="color:var(--watch)">Pulse cannot check this yet.</b>
    <p style="margin:8px 0 0;color:var(--ink2);font-size:13.5px">It would need ${
     c.missing.map(m=>`<b>${m}</b>`).join(", and ")}.</p>
    <p style="margin:8px 0 0;color:var(--muted);font-size:12.5px">You can still save it. It will sit with the
     other rules, marked as not running, so nobody believes it is protecting them.</p></div>
   <div class="row" style="margin-top:14px">
    <button class="go" data-rule-save-new="${motion}" data-live="0">Save it anyway →</button>
    <button class="go" id="ovx2" onclick="document.getElementById('rule-en').focus()">Rewrite it</button></div>`;
  window.__compiled={motion,english,c};return;}

 box.innerHTML=`<div class="cl2" style="display:block;padding:14px 16px;background:var(--sink);border-radius:8px">
   <div class="lab">What Pulse would check</div>
   <div style="font-size:14px;color:var(--ink);line-height:1.9;margin-top:8px">
    <b>When</b> ${String(c.when).replace(/_/g," ")}<br>
    ${c.conditions.length?`<b>and</b> ${c.conditions.map(line).join("<br><b>and</b> ")}<br>`:""}
    ${c.stop_if.length?`<b>unless</b> ${c.stop_if.map(line).join("<br><b>or</b> ")}<br>`:""}
    <b>then</b> ${doing[c.do]||c.do}${c.sla_minutes?` within ${c.sla_minutes} minutes`:""}${
     c.days?` for ${c.days} days`:""}
    ${c.act==="card"?" — a person decides":" — on its own, and logged"}
   </div>
   ${c.confidence<0.7?`<p style="margin:10px 0 0;color:var(--watch);font-size:12.5px">
     Pulse is only ${c.confidence.toFixed(2)} sure it read this the way you meant. Worth rewording.</p>`:""}
  </div>
  <div class="row" style="margin-top:14px">
   <button class="go solid" data-rule-save-new="${motion}" data-live="1">That is right — turn it on →</button>
   <button class="go" data-rule-save-new="${motion}" data-live="0">Save, but do not run it yet</button>
   <button class="go" id="ovx">Cancel</button></div>`;
 window.__compiled={motion,english,c};
}

function openRule(ruleKey){
 const mr=window.PulseLive&&PulseLive.state.motionRules;
 const r=mr?Object.values(mr).flat().find(x=>x.key===ruleKey):null;
 if(!r){$("#ovb").innerHTML=`<div class="red"><h3>Rule not found</h3>
   <p class="sub">It may have been retired. Reload and try again.</p>
   <div class="row" style="margin-top:20px"><button class="go" id="ovx">Close</button></div></div>`;
  $("#ov").hidden=false;return;}

 const plain=c=>{
  const names={score:"the signup's score",confidence:"how sure the AI is",
   verdict:"what the AI decided",motion:"how they arrived",touches_14d:"messages sent in 14 days",
   days_since_signup:"days since they signed up",messages_sent:"messages they have sent",
   credit_used_pct:"free credit used",volume_change_pct:"volume change",replies:"replies received",
   from_decision_maker:"the sender is a decision maker"};
  const ops={">=":"is at least","<=":"is at most",">":"is over","<":"is under",
   "==":"is","!=":"is not","in":"is one of"};
  return `${names[c[0]]||c[0]} ${ops[c[1]]||c[1]} <b>${c[2]}</b>`;};

 const doing={score:"score the signup",raise_card:"put a card in front of a person",
  nurture:"start the message sequence",suppress:"file it under Suppressed",
  draft:"write a message and hold it",wait:"wait",notify:"tell someone"};

 $("#ovb").innerHTML=`<div class="red">
  <h3>${r.motion.charAt(0).toUpperCase()+r.motion.slice(1)} rule</h3>
  <p class="sub">Write it as a sentence a person could say out loud. If you cannot read a
   rule aloud, it is too complicated to trust.</p>

  <h4>The rule</h4>
  <textarea id="rule-en"${canEditRules()?"":" readonly"} style="width:100%;min-height:66px;font:inherit;font-size:14px;padding:11px;
   border:1px solid var(--line2);border-radius:8px;background:var(--${canEditRules()?"raise":"sink"});color:var(--ink);
   resize:vertical">${r.english.replace(/</g,"&lt;")}</textarea>
  ${canEditRules()?"":`<p style="margin:8px 0 0;font-size:12.5px;color:var(--faint)">Only a super admin can change a rule. You can read it and see what it checks.</p>`}

  <h4>What Autopilot checks</h4>
  <div class="cl2" style="display:block;padding:12px 14px;background:var(--sink);border-radius:8px">
   <div style="font-size:13.5px;color:var(--ink2);line-height:1.9">
    <b>When</b> ${r.when.replace(/_/g," ")}<br>
    ${r.if.length?`<b>and</b> ${r.if.map(plain).join("<br><b>and</b> ")}<br>`:""}
    ${(r.stopIf&&r.stopIf.length)?`<b>unless</b> ${r.stopIf.map(plain).join("<br><b>or</b> ")}<br>`:""}
    <b>then</b> ${doing[r.then.do]||r.then.do}${r.then.sla_minutes?` within ${r.then.sla_minutes} minutes`:""}
    ${r.then.act==="card"?" — a person decides":" — on its own, and logged"}
   </div>
   <p style="margin:10px 0 0;font-size:12px;color:var(--muted)">
    ${r.live?"Autopilot runs this today."
     :"Written down, but Autopilot does not run this yet. It needs something Pulse cannot see so far."}</p>
  </div>

  <div class="row" style="margin-top:20px">
   ${canEditRules()?`<button class="go solid" id="rule-save" data-rule-save="${r.key}">Save as ${
    "v"+((+String(r.version).replace("v","")||1)+1)} →</button>
   <button class="go" id="rtest" data-rule-test="${r.key}">Test on the last 30 days</button>
   <button class="go" style="color:var(--watch)" data-rule-retire="${r.key}">Turn it off</button>`:""}
   <button class="go" id="ovx">${canEditRules()?"Cancel":"Close"}</button></div>
  <div class="test" id="tres" hidden></div>
  <div class="ver">${r.version} · ${r.source==="human"?"written by your team":"shipped with Pulse"}<br>
   EVERY SAVE IS A NEW VERSION. NOTHING IS OVERWRITTEN.</div></div>`;
 $("#ov").hidden=false;
}

/**
 * A built automation's own popup — same shape as openRule's, since these
 * are the two things that live under a motion and only one of them opened
 * anywhere. Unlike a compiled rule this one has no condition list to show —
 * it has a real query or a real event, and a prompt that judges what either
 * one finds — so the popup shows those instead.
 */
function openAutomation(key){
 const list=(window.PulseLive&&PulseLive.state.automations)||[];
 const a=list.find(x=>x.key===key);
 if(!a){$("#ovb").innerHTML=`<div class="red"><h3>Automation not found</h3>
   <p class="sub">It may have been deleted. Reload and try again.</p>
   <div class="row" style="margin-top:20px"><button class="go" id="ovx">Close</button></div></div>`;
  $("#ov").hidden=false;return;}

 const when=a.triggerKind==="event"
  ?`When <b>${esc(a.whenEvent||"an event")}</b> happens`
  :a.everyMinutes?`Checked every ${a.everyMinutes} minute${a.everyMinutes===1?"":"s"}`:"Checked on a schedule";
 const last=a.lastRunAt?new Date(a.lastRunAt).toLocaleString():"never yet";

 $("#ovb").innerHTML=`<div class="red">
  <h3>${a.motion.charAt(0).toUpperCase()+a.motion.slice(1)} automation</h3>
  <p class="sub">Built from a sentence, not hand-compiled — it runs a real ${a.triggerKind==="event"?"event trigger":"query"}
   and its own prompt judges what it finds.</p>

  <h4>What it was asked to do</h4>
  <div class="cl2" style="display:block;padding:12px 14px;background:var(--sink);border-radius:8px">
   <p style="margin:0;font-size:13.5px;color:var(--ink2);line-height:1.7">${esc(a.english)}</p>
  </div>

  <h4 style="margin-top:18px">What Autopilot checks</h4>
  <div class="cl2" style="display:block;padding:12px 14px;background:var(--sink);border-radius:8px">
   <div style="font-size:13.5px;color:var(--ink2);line-height:1.9">
    ${when}${a.findSql?`<br><b>Query</b> <code style="font-size:11.5px;word-break:break-all">${esc(a.findSql)}</code>`:""}
   </div>
   <p style="margin:10px 0 0;font-size:12px;color:var(--muted)">
    ${a.live?`Running today. Last ran ${last} · ${a.runCount} run${a.runCount===1?"":"s"} · ${a.alertCount} alert${a.alertCount===1?"":"s"}${a.lastError?` · <span style="color:var(--danger,#a8462a)">last error: ${esc(a.lastError)}</span>`:""}`
     :"Turned off — not currently running."}</p>
  </div>

  <h4 style="margin-top:18px">The prompt its worker judges each row with</h4>
  <div class="cl2" style="display:block;padding:12px 14px;background:var(--sink);border-radius:8px">
   <p style="margin:0;font-size:12.5px;color:var(--ink2);line-height:1.7;white-space:pre-wrap">${esc(a.executorPrompt||"")}</p>
  </div>

  <div class="row" style="margin-top:20px">
   ${canEditRules()?`<button class="go" style="color:var(--watch)" data-automation-retire="${a.key}">${a.live?"Turn it off":"Retire it"}</button>
   <button class="go" style="color:var(--danger,#a8462a)" data-automation-delete="${a.key}">Delete completely</button>`:""}
   <button class="go" id="ovx">Close</button></div>
  <div class="ver">${a.key}</div></div>`;
 $("#ov").hidden=false;
}

function openPanel(kind,arg){
 const B=$("#pkb");
 if(kind==="mail"){
  const mails=(window.PulseLive&&PulseLive.state.gmailRecent)||[];
  const m=mails.find(x=>x.id===arg);
  if(!m){$("#pk").hidden=true;return;}
  openMailId=m.id;
  B.innerHTML=`<div class="pkh">${AVI(mailSender(m.from),40)}
   <div class="t4"><div class="lb2">${(d=>d?`Mail · ${esc(d)}`:"Mail")(mailDate(m.date))}</div>
   <b>${esc(m.subject)}</b></div><button class="cx2" data-pkx>✕</button></div>
   <p class="why mailfrom" style="font-size:14.5px;margin:20px 0 0">${esc(m.from)}</p>
   <div id="mailThread">${mailThreadHTML(null,null,m.body||m.snippet)}</div>
   <p id="mailLoading" style="font-size:11.5px;color:var(--faint);margin-top:10px">
    <span class="inline-loader" style="margin-right:6px"></span>Loading the full thread${m.attachmentCount?" and attachments":""}…</p>
   ${m.url?`<div class="row" style="margin-top:18px"><a class="go solid" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">Open in Gmail ↗</a></div>`:""}`;
  $("#pk").hidden=false;
  fetch(`/api/pulse/gmail/thread?id=${encodeURIComponent(m.id)}&threadId=${encodeURIComponent(m.threadId)}&attachmentCount=${m.attachmentCount||0}`)
   .then(r=>r.json())
   .then(d=>{
    if(openMailId!==m.id)return; // the panel moved on to something else while this was in flight
    const box=document.getElementById("mailThread"),loading=document.getElementById("mailLoading");
    if(!d.ok){if(loading)loading.textContent=`Could not load the full thread: ${d.error||"unknown error"}`;return;}
    if(box)box.innerHTML=mailThreadHTML(d.messages,d.attachments,m.body||m.snippet);
    if(loading)loading.remove();
   })
   .catch(()=>{
    if(openMailId!==m.id)return;
    const loading=document.getElementById("mailLoading");
    if(loading)loading.textContent="Could not load the full thread.";
   });
  return;
 }
 if(kind==="answer"){
  const a=ASK[arg];
  const tb=a.cols?`<div class="tbl"><div class="tblscroll"><table>
    <thead><tr>${a.cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${a.rows.slice(0,8).map(r=>`<tr>${r.map((v,j)=>j===0?
      `<td class="c">${(CUST[v]||BOOK.some(b=>b[1]===v))?LOGO(v,16)+" ":""}${v}</td>`:`<td>${v}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div></div>${a.rows.length>8?`<p style="font-size:12.5px;color:var(--faint);margin-top:10px">Showing 8 of ${a.rows.length}.</p>`:""}`:
   `<div class="brk">${(a.brk||[]).map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>`;
  B.innerHTML=`<div class="pkh"><div class="t4"><div class="lb2">Pinned answer</div><b>${a.q}</b></div>
   <button class="cx2" data-pkx>✕</button></div>
   <div class="pkbig">${a.big}</div>
   <p class="why" style="font-weight:500;color:var(--ink);font-size:16px;margin-bottom:8px">${a.h}</p>
   <p class="why">${a.p}</p>
   <h4>The rows behind it</h4>${tb}
   <div class="row"><button class="go solid" data-openask="${arg}">Open in Ask →</button>
    <button class="go" data-recompute="${arg}">${
      a.__recomputing?"Recomputing…":a.__recomputedAt?"Recomputed "+a.__recomputedAt:"Recompute"}</button></div>
   ${(st=>`<div class="stamp">${st.map(x=>`<span>${x}</span>`).join("")}</div>`)(
     a.st.map(x=>x==="Rhea Menon"&&ME.name?ME.name:x))}`;
 }
 if(kind==="partner"){
  const pt=PARTNERS.find(x=>x[0]===arg)||PARTNERS[0];
  const accts=[["Sample Co 3","OTP AED 128,000","growing"],["Sample Co 15","WHATSAPP AED 25,000","growing"],
   ["Sample Co 20","SMS AED 61,000","active"]];
  B.innerHTML=`<div class="pkh">${LOGO(pt[0],40)}<div class="t4"><div class="lb2">Partner · ${pt[2]}</div>
   <b>${pt[0]}</b></div><button class="cx2" data-pkx>✕</button></div>
   <div class="pkbig">${pt[4]}</div>
   <p class="why">Received this month across ${pt[3]} accounts they sourced. Native currency, never converted.</p>
   <h4>By service</h4>${pt[5].map(x=>`<div class="ln"><span class="cp">${x.split(" ")[0]}</span>
    <span class="st"></span><i>${x.split(" ").slice(1).join(" ")}</i></div>`).join("")}
   <h4>Accounts they brought · ${pt[3]}</h4>
   ${accts.map(([a,rev,st])=>`<div class="lrow" data-cust="${a}" style="cursor:pointer" role="button" tabindex="0">
    <span class="nm2">${LOGO(a,22)}${a}</span><span class="ds">${rev}</span>
    <span class="rt3">${st.toUpperCase()}</span></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Showing 3 of ${pt[3]}. Every account here is co-owned — no price conversation happens without them on the thread.</p>
   <div class="row"><button class="go solid" disabled title="Sending a partner digest isn't wired up yet." style="opacity:.5;cursor:not-allowed">Send this month's digest →</button>
    <button class="go" data-pcontacts="${esc(pt[0])}">Partner contacts</button></div>`;
 }
 if(kind==="opp"){
  /* One opportunity, with everything behind it. The CTA on the board used to
     be decoration; this is what it opens. */
  const[k,h2,p2,ev,cta]=arg,q=oppAsk(k,cta);
  B.innerHTML=`<div class="pkh"><div class="t4"><div class="lb2">Room to grow</div>
    <b>${esc(k)}</b></div><button class="cx2" data-pkx>✕</button></div>
   <p class="why" style="font-weight:500;color:var(--ink);font-size:16px;margin-bottom:8px">${esc(h2)}</p>
   <p class="why">${esc(p2)}</p>
   ${ev?`<h4>What it is counted from</h4><div class="ev2">${esc(ev)}</div>`:""}
   <div class="row" style="margin-top:18px">${q
     ?`<button class="go solid" data-openask="${q}">Open in Ask →</button>`:""}
    <button class="go" data-oppoff="${esc(h2)}" data-pkclose="1">Not now</button></div>
   <p style="font-size:12.5px;color:var(--faint);margin-top:14px">Dismissing this hides it until the next reload. Nothing is written.</p>`;
 }
 if(kind==="pcontacts"){
  /* Who on our side is on this partner's accounts. Partner-side people are not
     here because there is no contacts table to read them from — the same
     reason the person panel says so. */
  const pt=PARTNERS.find(x=>x[0]===arg)||PARTNERS[0];
  const mine=BOOK.filter(b=>b[2]===pt[2]&&b[3]==="Partner").slice(0,8);
  B.innerHTML=`<div class="pkh">${LOGO(pt[0],40)}<div class="t4"><div class="lb2">Partner · ${pt[2]} · ${
     GEO[pt[2]]?GEO[pt[2]].flag+" "+GEO[pt[2]].cur:""}</div>
   <b>${esc(pt[0])}</b></div><button class="cx2" data-pkx>✕</button></div>
   <h4>Who is on it here</h4>
   ${mine.length?mine.map(b=>`<div class="lrow" data-cust="${esc(b[1])}" style="cursor:pointer" role="button" tabindex="0">
     <span class="nm2">${LOGO(b[1],22)}${esc(b[1])}</span>
     <span class="ds">${esc(ownerOf(b[1]))}</span><span class="rt3">→</span></div>`).join("")
    :`<p class="why" style="margin-top:14px">No partner-sourced accounts in ${esc(pt[2])} are in your book.</p>`}
   <h4>Revenue by service</h4>${pt[5].map(x=>`<div class="ln"><span class="cp">${x.split(" ")[0]}</span>
     <span class="st"></span><i>${x.split(" ").slice(1).join(" ")}</i></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:14px">Names on the partner's own side are not here. Pulse has no contacts table yet — only the people MSG91 records against an account.</p>`;
 }
 if(kind==="decision"){
  const d=LOGDET[arg];
  if(!d){$("#pk").hidden=true;return;}
  const cf=Math.round(d.conf*100), lo=d.conf<.6?1:0;
  B.innerHTML=`<div class="pkh">${MARK(d.subj,40)||`<span class="mark" style="width:40px;height:40px;border-radius:11px;font-size:15px">P</span>`}
   <div class="t4"><div class="lb2">Decision · ${arg}</div><b>${d.subj}</b></div>
   <button class="cx2" data-pkx>✕</button></div>
   <p class="why" style="font-weight:500;color:var(--ink);font-size:16px;margin:20px 0 0">${d.act}</p>
   <h4>How sure I was</h4>
   <div class="cfp" data-lo="${lo}"><b>${d.conf.toFixed(2)}</b>
    <span class="trk"><i style="width:${cf}%"></i></span>
    <span class="cfn">${lo?"Below the 0.60 floor — I stopped and asked a person.":"Above the 0.60 floor — I was allowed to act."}</span></div>
   <h4>What I looked at</h4>
   ${d.src.map(([f,c])=>`<div class="ln"><span>${f}</span><span class="st"></span><i>${c}</i></div>`).join("")}
   <h4>What I did</h4><p class="why">${d.out}</p>
   <h4>What happens next</h4><p class="why">${d.next}</p>
   <h4>The rule behind it</h4>
   <div class="lrow" data-rule="${d.pol.replace(/"/g,"&quot;")}" style="cursor:pointer" role="button" tabindex="0">
    <span class="nm2">${d.pol}</span><span class="ds">Open in Rules</span><span class="rt3">→</span></div>
   ${d.fyi?`<div class="stamp"><span>FYI ${d.fyi}</span><span>logged</span></div>`:`<div class="stamp"><span>no person notified</span><span>logged</span></div>`}`;
 }
 if(kind==="autopilot"){
  /* One decision, in full. The feed is scannable on purpose, so everything that
     would make a row unreadable lives here: the evidence, how sure it was, the
     rule that produced it, and the message if one was written. */
  const st=window.PulseLive&&PulseLive.state;
  const rows=(st&&st.activity)||[];
  const [sk,ag]=String(arg).split("::");
  const d=rows.find(x=>x.signalKey===sk&&x.agent===ag);
  if(!d){$("#pk").hidden=true;return;}
  const draft=d.draftId&&st.drafts?st.drafts.find(x=>x.id===d.draftId):null;
  const cf=d.confidence!=null?Math.round(d.confidence*100):null;
  const lo=d.confidence!=null&&d.confidence<0.6?1:0;
  const name=d.title.replace(/^Scored |^Suppressed |^A person .*? to /,"").split(" — ")[0];
  /* signalKey is "auto:<automation key>:<account id>" for anything an
     automation raised — the id is the only thing this row actually carries;
     there is no name until the account itself is fetched. Not every decision
     names an account (a partner digest's key ends "portfolio"), so the
     button only appears when the last segment is genuinely numeric. */
  const scoredId=(()=>{const p=String(d.signalKey).split(":");const v=p[p.length-1];
   return /^\d+$/.test(v)?v:null;})();

  B.innerHTML=`<div class="pkh">${MARK(name,40)||`<span class="mark" style="width:40px;height:40px;border-radius:11px;font-size:15px">P</span>`}
   <div class="t4"><div class="lb2">${d.agent} · ${d.when}</div><b>${d.title}</b></div>
   <button class="cx2" data-pkx>✕</button></div>
   ${scoredId?`<div class="row" style="margin-top:14px">
    <button class="go solid" data-open-scored-account="${scoredId}">Open account →</button></div>`:""}

   <p class="why" style="font-weight:500;color:var(--ink);font-size:16px;margin:20px 0 0">${d.detail}</p>

   ${d.errorCode?`<h4>What went wrong</h4>
    <p class="why"><b>${d.errorCode}</b> — nothing was acted on and nothing was sent.
     It stays held and is tried again on the next pass.</p>`:""}

   ${d.confidence!=null?`<h4>How sure it was</h4>
    <div class="cfp" data-lo="${lo}"><b>${d.confidence.toFixed(2)}</b>
     <span class="trk"><i style="width:${cf}%"></i></span>
     <span class="cfn">${lo?"Below the 0.60 floor — it was not allowed to suppress on this."
      :"Above the 0.60 floor — it was allowed to act."}</span></div>`:""}

   ${d.reasons&&d.reasons.length?`<h4>What it looked at</h4>
    ${d.reasons.map(x=>`<div class="ln"><span>${x}</span></div>`).join("")}`:""}

   ${d.score!=null?`<h4>The score</h4><p class="why">${d.score} out of 100.
    ${d.score>=80?"Above the call threshold, so a person was asked."
     :d.score>=40?"In the nurture band, so a sequence started instead of a person."
     :"Below 40, so it was filed under Suppressed — reviewable, never deleted."}</p>`:""}

   ${draft?`<h4>The message, held for you</h4>
    <textarea data-body="${draft.id}" style="width:100%;min-height:120px;font:inherit;font-size:13.5px;
     line-height:1.6;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--raise);
     color:var(--ink);resize:vertical">${draft.body.replace(/</g,"&lt;")}</textarea>
    ${draft.holdReason?`<p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">Held: ${draft.holdReason}</p>`:""}
    <div class="row" style="margin-top:10px"><button class="go solid" data-release="${draft.id}">Release →</button>
     <button class="go" data-discard="${draft.id}">Discard</button>
     <span class="dmsg" data-dmsg="${draft.id}" style="font-size:12.5px;color:var(--muted);align-self:center"></span></div>`:""}

   ${d.verdict==="suppress"?`<h4>Put it back</h4>
    <p class="why">Nothing is deleted. Putting it back returns it to the deck with its reasons attached.</p>
    <div class="row"><button class="go solid" data-unsuppress="${d.signalKey}">Put it back →</button></div>`:""}

   <h4>The policy behind it</h4>
   <p class="why">Policy ${d.policyVersion||"—"}${d.model?`, decided on ${d.model}`:""}.
    ${d.agent==="signup-triage"?"The score came from the agent; the verdict came from the motion's rules, applied in code.":""}</p>
   <div class="stamp"><span>${d.signalKey}</span><span>logged</span></div>`;
 }
 if(kind==="rowdetail"){
  const [tm,head,detail,tag]=arg;
  B.innerHTML=`<div class="pkh"><div class="t4"><div class="lb2">${
    S.tab==="filtered"?"Suppressed signup":"Audit event"} · ${tm}</div>
   <b>${head}</b></div><button class="cx2" data-pkx>✕</button></div>
   <h4>${S.tab==="filtered"?"Why":"What changed"}</h4>
   <p class="why">${detail||"No further detail recorded."}</p>
   ${tag?`<h4>Kind</h4><div class="tags"><span class="tag2">${tag}</span></div>`:""}
   <p style="font-size:12.5px;color:var(--faint);margin-top:16px">${
    S.tab==="filtered"?"From signup_tracking. Nothing is deleted — a suppressed signup stays reviewable."
     :"From admin_updation_log. Every staff change is recorded with who, what and when."}</p>`;
 }
 if(kind==="person"){
  /* The three sample people this used to hold are gone. A "person" here is
     whoever wrote a note on the account — user_comment is the only place this
     database records a human by name against a company. */
  const acct=S.cust, c=acct&&CUST[acct];
  const notes=((c&&c.pe)||[]).filter(x=>x[0]===arg);
  B.innerHTML=`<div class="pkh">${AVI(arg,40)}<div class="t4"><div class="lb2">${
    notes.length?`Wrote ${notes.length} note${notes.length===1?"":"s"}`:"Person"} · ${acct||"—"}</div>
   <b>${arg}</b></div><button class="cx2" data-pkx>✕</button></div>
   ${notes.length?`<h4>What they wrote</h4>${notes.map(([who,text,when])=>
     `<div class="ev"><time>${(when||"").replace(/^noted /,"")}</time><span>${text}</span></div>`).join("")}`
    :`<p class="why" style="margin-top:20px">No notes recorded against this account.</p>`}
   ${acct?`<h4>Their account</h4>
   <div class="lrow" data-cust="${acct}" style="cursor:pointer" role="button" tabindex="0"><span class="nm2">${LOGO(acct,22)}${acct}</span>
    <span class="ds">Open the account</span><span class="rt3">→</span></div>`:""}
   <p style="font-size:12.5px;color:var(--faint);margin-top:14px">Names here come from the admin who wrote the note. Pulse has no contacts table yet, so job titles and reporting lines are not available.</p>`;
 }
  $("#pk").hidden=false;
}
document.addEventListener("click",e=>{
 const t=e.target;
 if(t.closest("[data-pkx]")||t===$("#pk")){$("#pk").hidden=true;openMailId=null;return;}
 const oa=t.closest("[data-openask]");
 if(oa){$("#pk").hidden=true;S.ask=oa.dataset.openask;S.sel=new Set();S.askTab="ask";S.v="ask";render();return;}
 const pp=t.closest("[data-person]");if(pp){openPanel("person",pp.dataset.person);return;}
});
/* The drawer's Escape used to live here, in a second listener registered after
   the one above — so the company-page handler always won and this never ran
   when it mattered. escClose owns every layer now. */

function openSheet(kind,arg){
 const B=$("#ovb");
 if(kind==="log"){
  B.innerHTML=`<h3>Log what happened</h3>
   <p class="sub">Write it however you like, or hold the mic and talk. I will turn it into the right work — you do not need to pick a type.</p>
   <textarea class="logbox" id="logtx">Meera called. They will take ₹0.119 if we can do 24 months. She also asked whether we do WhatsApp for refill reminders — said their competitor trial ends on the 30th. I said I would send the revised rate by Wednesday.</textarea>
   <div class="row" style="margin-top:12px"><span class="miclg">●</span>
    <span style="font-size:12.5px;color:var(--faint);font-family:var(--m)">HOLD TO TALK · OR JUST TYPE</span></div>
   <div class="extract2"><div class="l3">What I will do with that</div>
    <div class="ex2"><b>Promise</b><span>Send the revised rate — due Wednesday, added to your promises</span></div>
    <div class="ex2"><b>Decision</b><span>₹0.119 with a 24-month term — closes the rate card, margin 9.4%</span></div>
    <div class="ex2"><b>Interest</b><span>WhatsApp for refill reminders — new mission, grow product</span></div>
    <div class="ex2"><b>Risk</b><span>Competitor trial ends 30 Sep — I will chase you on the 26th</span></div>
    <div class="ex2"><b>Person</b><span>Sample Contact A marked as the decision maker</span></div></div>
   <div class="row" style="margin-top:18px"><button class="go solid" id="ovdo">Save all five →</button>
    <button class="go" id="ovx">Cancel</button></div>`;
 }
 if(kind==="bulk"){
  B.innerHTML=`<h3>Add accounts in bulk</h3>
   <p class="sub">Paste a list or drop a CSV from the event. I check every row against what we already have before anything is created.</p>
   <textarea class="logbox" style="min-height:70px" id="bulktx">sampleco19.example, sampleco1.example, sampleco20.example, rakesh.k@gmail.com, sampleco23.example, sampleco21.example, sampleco22.example</textarea>
   <div class="row" style="margin-top:12px"><button class="go" disabled title="CSV upload isn't wired up yet — paste the list above instead." style="opacity:.5;cursor:not-allowed">Upload a CSV instead</button>
    <span class="fresh">7 ROWS READ · CHECKED AGAINST 3,412 EXISTING ACCOUNTS</span></div>
   <div class="tbl" style="margin-top:16px"><div class="tblscroll"><table>
    <thead><tr><th>Company</th><th>Domain</th><th></th><th>What I found</th></tr></thead>
    <tbody>${BULK.filter(([,,r])=>!S.bulkDup||r==="dup").map(([n,dm,r,note])=>`<tr>
     <td class="c">${r==="junk"?"":LOGO(n,18)+" "}${n}</td><td>${dm}</td>
     <td><span class="rowst" data-r="${r}">${r==="new"?"NEW":r==="dup"?"ALREADY OURS":"SUPPRESSED"}</span></td>
     <td style="white-space:normal;max-width:280px">${note}</td></tr>`).join("")}
    </tbody></table></div></div>
   <div class="row" style="margin-top:16px"><button class="go solid" id="ovdo">Create the 4 new ones →</button>
    <button class="go" id="bulkdup">${S.bulkDup?"Show all 7 rows":`Review the ${
      BULK.filter(b=>b[2]==="dup").length} duplicates`}</button><button class="go" id="ovx">Cancel</button></div>
   <div class="ver" style="font-family:var(--m);font-size:10.5px;color:var(--faint);margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
    NEW ACCOUNTS ARE ENRICHED AND SCORED BEFORE THEY REACH ANYONE. DUPLICATES ATTACH TO THE EXISTING ACCOUNT AND TELL ITS OWNER.</div>`;
 }
 if(kind==="approvals"){
  B.innerHTML=`<h3>Startup approvals · since 1 August</h3>
   <p class="sub">Your team approved these and the credits are already live. This is a monthly read, not a queue.</p>
   ${APPROVALS.map(([dt,acct,what,who,why])=>`<div class="oi" style="align-items:flex-start">
    <time style="min-width:52px">${dt}</time>
    <span class="d2"><span class="mkrow">${LOGO(acct,20)}<b style="font-weight:500">${acct}</b></span>
     <em>${what} · approved by ${who}<br>${why}</em></span>
    <button class="skip" disabled title="Reverting isn't wired up yet — there is no revert endpoint behind this button." style="opacity:.5;cursor:not-allowed">Revert</button></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:14px">29 more, all inside the usual limits. Taking a credit back is not wired up yet — Revert above is shown but disabled rather than pretending to work.</p>
   <div class="row" style="margin-top:16px"><button class="go solid" id="ovdo">Nothing to change →</button>
    <button class="go" id="ovx">Close</button></div>`;
 }
 if(kind==="tag"){
  /* The suggestions are still a fixed list — they are the tags this team
     reaches for — but everything picked here is written to Pulse's store
     against this company, so the next person to open it sees them. */
  B.innerHTML=`<h3>Add a tag</h3><p class="sub">Tags are free text and filterable in Ask. Pulse adds its own from evidence — those show dashed.</p>
   <div class="tags" style="margin-bottom:14px">${["Enterprise","Renewal Q4","Needs a case study","Reference-able","Price sensitive","Multi-department","Warm intro available"].map(t=>`<button class="tag2" data-tagpick="${esc(t)}" aria-pressed="${S.tagPick.has(t)}"${
     S.tagPick.has(t)?' style="border-color:var(--br);color:var(--br)"':""}>${t}</button>`).join("")}</div>
   <input class="logbox" id="tagnew" style="min-height:0;padding:11px 13px" placeholder="Or write a new one">
   <p style="font-size:12.5px;color:var(--faint);margin-top:11px">Saved against ${esc(S.cust||"this company")} for everybody — not just this browser.</p>
   <div class="row" style="margin-top:16px"><button class="go solid" id="tagadd">Add →</button>
    <button class="go" id="ovx">Cancel</button></div>`;
 }
 if(kind==="person"){
  /* Real from the start, same as the tag sheet: written to Pulse's own store
     (pulse_account_contact) against this company, not the "Log what
     happened" sheet this used to open — a note-taking demo with nothing
     behind its own save button, and nothing to do with adding a person. */
  B.innerHTML=`<h3>Add a person</h3>
   <p class="sub">Someone at ${esc(S.cust||"this company")} MSG91 never invited — a finance contact, a decision-maker who never logged in.</p>
   <input class="logbox" id="personname" style="min-height:0;padding:11px 13px" placeholder="Name" maxlength="120">
   <input class="logbox" id="personrole" style="min-height:0;padding:11px 13px;margin-top:8px" placeholder="Role (optional) — e.g. Finance, Decision maker" maxlength="120">
   <p style="font-size:12.5px;color:var(--faint);margin-top:11px">Saved against ${esc(S.cust||"this company")} for everybody — not just this browser.</p>
   <div class="row" style="margin-top:16px"><button class="go solid" id="personadd">Add →</button>
    <button class="go" id="ovx">Cancel</button></div>`;
 }
 $("#ov").hidden=false;
}
document.addEventListener("click",e=>{
 const t=e.target;
 const sh=t.closest("[data-sheet]");if(sh){openSheet(sh.dataset.sheet);return;}
 if(t.closest("[data-addtag]")){openSheet("tag");return;}
 if(t.closest("#tagadd")){
  /* Everything picked, plus whatever was typed. One request, then the sheet
     closes — the list on the page redraws from what the server says it is. */
  const box=$("#tagnew"), typed=box?box.value.trim():"";
  const picked=[...S.tagPick].concat(typed?typed.split(",").map(x=>x.trim()).filter(Boolean):[]);
  S.tagPick.clear();
  $("#ov").hidden=true;
  if(picked.length&&window.PulseLive)PulseLive.addTags(S.cust,picked,PULSE_BAG,render);
  return;}
 const ut=t.closest("[data-untag]");if(ut){
  if(window.PulseLive)PulseLive.removeTag(S.cust,ut.dataset.untag,PULSE_BAG,render);
  return;}
 if(t.closest("#personadd")){
  const nameBox=$("#personname"),roleBox=$("#personrole");
  const nm=nameBox?nameBox.value.trim():"";
  if(nm.length<2){if(nameBox)nameBox.focus();return;}
  $("#ov").hidden=true;
  if(window.PulseLive)PulseLive.addContact(S.cust,nm,roleBox?roleBox.value.trim():"",PULSE_BAG,render);
  return;}
 const unc=t.closest("[data-uncontact]");if(unc){
  if(window.PulseLive)PulseLive.removeContact(S.cust,+unc.dataset.uncontact,PULSE_BAG,render);
  return;}
 const r2=t.closest("[data-reassign2]");if(r2){openReassign(r2.dataset.reassign2,1);return;}
 const pr=t.closest("[data-partner]");if(pr){openPanel("partner",pr.dataset.partner);return;}
});

/* The current owner comes from the account itself. It used to be hardcoded to
   one sample name, which read as fact and was wrong on every real account. */
/**
 * Who holds this account, for the line the reassign sheet opens with.
 *
 * The three branches this used to end in all returned "unassigned", which is
 * the same as having no branches — and it read as deliberate, so nobody looked
 * at it. The wall row is the second source worth having: it carries "no owner"
 * as its hot flag and is present for every account on Now, including ones whose
 * detail has never been fetched.
 */
function ownerOf(name){
 const c=CUST[name];
 if(c&&c.owner)return c.owner;
 const row=BOOK.find(b=>b[1]===name);
 /* Known to have nobody: the stub was built from the wall, or the row says so. */
 if((c&&"owner"in c)||row)return "unassigned";
 return "not known yet";}

/**
 * The reassign sheet.
 *
 * Everything in it used to be typed by hand: "Reassign 46 accounts", "unowned
 * since Sample Rep 9 left, 14 days ago", a three-line split across India, UAE and
 * Singapore, and a SUGGESTED badge pinned to whoever happened to be third in
 * the list. Clicking a rep moved an aria-selected attribute and nothing else,
 * and "Reassign →" closed the sheet and threw the answer away.
 *
 * It is read from the database now, and saving writes. The state — which rep
 * is picked, what the pile looks like, what the last save said — lives in
 * PulseLive.state.reassign rather than in the DOM, because this sheet is
 * rebuilt from scratch on every render and would otherwise forget the
 * selection whenever anything else on the page moved.
 *
 * REPS carries the rep's MSG91 id in position 4 (see pulse-live.js): the
 * selection is by id, never by index, because the list re-sorts as soon as a
 * reassignment changes anybody's book.
 */
function openReassign(name,single){
 if(!window.PulseLive){$("#ov").hidden=false;return;}
 PulseLive.openReassign(name,single,PULSE_BAG,render);
}

/**
 * Where an Ask answer's own CTA goes. `act` is free text — lib/pulse/ask.ts's
 * `action` field is `string | null`, the same shape as the sample answers
 * above (ASK.*.act) — there is no structured payload behind it, so the
 * destination is read out of the words in the label itself. Ambiguous text
 * returns null, which hides the button instead of guessing at a place to send
 * it that might not match what the label promised.
 */
function answerActDest(act){
 if(!act)return null;
 const s=String(act).toLowerCase();
 if(/assign|claim/.test(s))return{reassign:true};
 if(/mission|escalat|chase|recover/.test(s))return{auto:true};
 if(ASK[S.ask]&&s===String(ASK[S.ask].act||"").toLowerCase())return{ask:S.ask};
 if(s.includes("partner"))return{ask:"partner"};
 return null;
}

/**
 * The "Open in Ask →" link on a Room to Grow card. `k`/`cta` are the card's
 * own title and button label (ROOM/ROOM_NEW, or an Agent-5 opportunity in the
 * same shape) — neither is an Ask key, so this only offers the link when the
 * card is plainly about one of the five saved questions in ASK. Most cards
 * are not, and get no link rather than a wrong one.
 */
function oppAsk(k,cta){
 const s=(String(k)+" "+String(cta)).toLowerCase();
 if(/partner/.test(s))return"partner";
 if(/after-hours|uae|entity/.test(s))return"uae";
 if(/stuck|dlt|blocked|first message/.test(s))return"stuck";
 if(/churn|risk|leaving|went quiet|win.?back/.test(s))return"churn";
 return null;
}

/* Drawn on every render while the sheet is open, so it always reflects the
   live state rather than whatever it was built with. */
/* Whether the reassign sheet is the thing currently in the overlay. The
   overlay is shared with every other sheet on the page, so this must not close
   one it did not open. */
let RAOWNS=false;
function drawReassign(){
 const ov=$("#ov"); if(!ov) return;
 const R=window.PulseLive&&PulseLive.state.reassign;
 if(!R||!R.open){if(RAOWNS){ov.hidden=true;RAOWNS=false;}return;}
 RAOWNS=true;
 const name=R.open, bulk=!R.single;
 const pile=R.pile;

 /* The pile's real size, and how much of it this sheet can act on. They differ
    by thousands here, and saying only one of them is what made the prototype's
    "46 accounts" a lie. */
 /* Saved. The sheet stays up and says so — this is the only place the outcome
    is ever shown, and a sheet that closes on success leaves the reader guessing
    whether the press registered. */
 if(R.saved){
  $("#ovb").innerHTML=`<h3>Done</h3><p class="sub">${esc(R.saved)}</p>
   <p class="why">Recorded on Pulse's side and written to the audit log. MSG91's own
    <span class="mono">user_handled_by</span> still says what it said — Pulse may only read it,
    so this is an override laid over their answer wherever the account is read.</p>
   <div class="row" style="margin-top:20px">
    <button class="go solid" id="ovx">Close</button></div>`;
  ov.hidden=false;return;}

 const head=bulk
  ?(pile?`Reassign ${NUM(pile.total)} unowned account${pile.total===1?"":"s"}`:"Reassign the unowned accounts")
  :"Reassign "+esc(name);
 const sub=bulk
  ?(pile
    ?`${NUM(pile.total)} customer${pile.total===1?"":"s"} have nobody on them. This sheet works on the ${
       NUM(pile.showing)} most recent. Anyone can do this — it writes an audit event either way.`
    :(R.loading?loadingIndicator("Loading unowned accounts"):"Anyone can do this — it writes an audit event either way."))
  /* What this actually does, which is not what it used to say. There are no
     mission or promise tables in Pulse's store — migration 009 was written to
     stop the sheet claiming things it does not do, and "the new owner picks up
     every open mission and promise on this account" was the last one left. */
  :`Currently ${esc(ownerOf(name))}. Changing it moves the account everywhere Pulse shows an owner —
     the wall, the standings, and who it counts as belonging to. MSG91's own record is left as it is;
     Pulse may only read that.`;

 const split=bulk&&pile&&pile.groups&&pile.groups.length
  ?`<div class="lab" style="margin-bottom:6px">What Pulse suggests · by who already works each country</div>
    <div class="splitb">${pile.groups.slice(0,6).map(g=>
      `<div><span>${esc(g.country)} · ${NUM(g.accounts)} account${g.accounts===1?"":"s"}</span>
       <b>${g.suggested?esc(g.suggested.name)+" · owns "+NUM(g.suggested.owns)+" there"
         :"<span style=\"color:var(--muted)\">nobody works this country yet</span>"}</b></div>`).join("")}
     ${pile.groups.length>6?`<div><span>and ${pile.groups.length-6} more countries</span><b></b></div>`:""}</div>
    <div class="lab" style="margin-bottom:6px">Or give all ${NUM(pile.showing)} to one person</div>`
  :bulk?"":`<div class="lab" style="margin-bottom:6px">Hand it to</div>`;

 /* Who may be handed this account. R.reps is the real answer — every rep,
    including the ones holding nothing yet — and REPS is the standings, which
    can only name people who already own something. The standings are the
    fallback for the moment before the list lands, and for the session where
    the request failed: short by whoever is on zero, but not empty.

    An empty both ways means nothing has landed. Say so rather than drawing an
    empty list that looks like "there is nobody to pick". */
 const people=(R.reps&&R.reps.length)?R.reps:REPS;
 const list=people.length
  ?people.map(([n,i,m,me,id])=>`<button class="rp" data-rep="${id}" aria-selected="${R.pick===id?"true":"false"}">
     ${AVI(n,30)}<span class="tx2"><b>${esc(n)}${me?" · you":""}</b><span>${esc(m)}</span></span>
     ${R.pick===id?'<span class="sug">PICKED</span>':""}</button>`).join("")
  :`<div class="sheet-loader">${loadingIndicator("Loading team list")}</div>`;

 const act=bulk
  ?`<button class="go solid" id="ovsplit" ${R.loading||!pile?"disabled":""}>Apply the suggested split →</button>
    <button class="go" id="ovone" ${R.loading||!pile||R.pick==null?"disabled":""}>Give them all to the picked rep →</button>`
  :`<button class="go solid" id="ovdo" ${R.loading?"disabled":""}>${
     R.pick==null?"Take it off everybody →":"Reassign →"}</button>`;

 $("#ovb").innerHTML=`<h3>${head}</h3><p class="sub">${sub}</p>
  ${split}${list}
  ${R.pick!=null&&!bulk?"":`<p style="font-size:12.5px;color:var(--faint);margin:10px 0 0">${
    bulk?"Picking nobody leaves the split to Pulse's suggestion.":
    "Nobody is picked, so saving takes this account off its current owner."}</p>`}
  ${R.error?`<p class="tagerr" role="alert">That did not save: ${esc(R.error)}</p>`:""}
  <div class="row" style="margin-top:20px">${act}
   <button class="go" id="ovx">${R.loading?"Close":"Cancel"}</button></div>`;
 ov.hidden=false;
}

/* Thousands separators, the same way every other number on the page gets them. */
function NUM(n){return Number(n||0).toLocaleString("en-IN");}
document.addEventListener("click",e=>{
 if(!e.target.closest(".mw"))$$(".menu").forEach(x=>x.hidden=true);},true);
/* ── live data ─────────────────────────────────────────────────────────────
   The prototype rendered from the sample objects above. PulseLive replaces
   their contents with real MSG91 data before the first paint, then re-renders
   when a lazily-fetched piece (an Ask answer, an account page) arrives. If the
   database is unreachable the sample data is rendered instead, so the UI still
   comes up and the console says why.                                        */
const PULSE_BAG = {
  get BOOK() { return BOOK; },
  get CARDS() { return CARDS; },
  get GROWTH() { return GROWTH; },
  get CUST() { return CUST; },
  /* Tags are read from Pulse's store when a company page opens, and written
     back when somebody adds or removes one — so the live layer needs to see
     this object. Property mutation only; TAGS itself is never replaced. */
  get TAGS() { return TAGS; },
  get ASK() { return ASK; },
  get AUTO() { return AUTO; },
  get STANDINGS() { return STANDINGS; },
  get FLIGHT() { return FLIGHT; },
  get PINNED() { return PINNED; },
  get HISTORY() { return HISTORY; },
  /* The live layer replaces HISTORY wholesale with the real catalogue; the
     stored pins have to be folded back on or they vanish a second after load. */
  set HISTORY(v) { HISTORY = v; applyPins(); },
  /* The renderer's own state, so the live layer can point the default Ask
     question at one the database can actually answer. */
  get S() { return S; },
  /* Rebuilt after live data lands — see rebuildPal. */
  rebuildPal: (counts) => rebuildPal(counts),
  get REPS() { return REPS; },
  set REPS(v) { REPS = v; },
  /* How the signed-in person writes, from pulse_user_voice. Two surfaces read
     it — onboarding step 3 and the profile page — so the live layer pushes it
     into both places the renderer looks. */
  setVoice: (traits) => { VOICE = traits.slice(); ONBSTATE.traits = traits.slice(); },
  get ME() { return ME; },
  /* The live score band and board. Null keeps the sample board on screen. */
  setBoard: (b) => { BOARD = b; },
  get BOARD() { return BOARD; },
};

if (window.PulseLive) {
  /* Ask answers and account pages are fetched on demand rather than up front:
     each is a separate query and most are never opened in a session. */
  const askSeen = new Set(), custSeen = new Set();

  /** Ask for whatever the screen we are on needs, if it has not been asked for. */
  const need = {
    ask(id) {
      if (!id || id.startsWith("__typed:") || askSeen.has(id)) return;
      askSeen.add(id);
      window.PulseLive.loadAnswer(id, PULSE_BAG, render);
    },
    cust(name) {
      if (!name || custSeen.has(name)) return;
      custSeen.add(name);
      window.PulseLive.loadAccount(name, PULSE_BAG, render);
    },
  };

  /* Arriving by URL rather than by click — a refresh, a pasted link, Back —
     fetches the same thing the click would have. */
  routeFetch = () => {
    if (S.v === "cust") need.cust(S.cust);
    if (S.v === "ask") need.ask(S.ask);
    /* A click into Profile fetches its own data (below) — but a page load or
       refresh straight at /profile skips that click entirely and routeGo()
       is the only thing that runs, so the panels sat on their skeleton
       forever with nothing ever asking the server. */
    if (S.v === "profile") {
      window.PulseLive.loadVoice(PULSE_BAG, render);
      if (ME.gmail) window.PulseLive.loadGmailRecent(PULSE_BAG, render);
    }
  };

  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-q]");
    /* A pinned typed question has no catalogue entry, so there is nothing here
       to fetch — the renderer re-asks it through askCustom instead. Without
       this it fired ?q=__typed:0 and got the "cannot answer that" placeholder
       back, cached under an id nothing should ever read. */
    if (q) need.ask(q.dataset.q);
    const cu = e.target.closest("[data-cust]");
    if (cu) need.cust(cu.dataset.cust);
    /* Payments and rates are L2: fetched only on the deliberate reveal. */
    if (e.target.closest("#revm") && S.cust) {
      window.PulseLive.revealCommercial(S.cust, PULSE_BAG, render);
    }
    /* The profile page shows how you write, so it needs the list. Cheap and
       cached after the first answer. */
    const nav = e.target.closest("[data-nav]");
    if (nav && nav.dataset.nav === "profile") {
      window.PulseLive.loadVoice(PULSE_BAG, render);
      if (ME.gmail) window.PulseLive.loadGmailRecent(PULSE_BAG, render);
    }
  });

  /* S.v starts every load as "now" (its bare default) until routeGo() says
     otherwise — and routeGo() cannot run yet, because it may need to search
     for a /company/<name> that is not fetched until boot() answers. Every
     render() before that point, including the skeleton below and however
     many boot() fires while data arrives, called routeSync() with S.v still
     "now" — so a fresh load of /autopilot/activity silently rewrote the
     address bar to "/" during the FIRST paint, long before routeGo() ever
     got a chance to read it back. By the time boot() resolved and routeGo()
     ran, the URL it read had already been overwritten. A refresh on any
     deep link landed on Now no matter what the link named.
     Fixed by applying everything the URL says up front — synchronously,
     before the first render() — for every case that does not need a fetch
     to resolve. That covers /autopilot/*, /ask/*, /profile and /company/<name>
     when it is already known (e.g. still in this tab's memory); only a
     /company/<name> genuinely not seen yet is left for routeGo() itself,
     since that one case cannot be decided without asking the server first. */
  (function applyRouteBeforeFirstPaint(){
   const r=routeRead();
   if(r.v==="cust"&&!CUST[r.cust])return; // needs a fetch; routeGo() below handles it
   if(r.v==="cust"){S.cust=r.cust;S.from=null;}
   if(r.v==="ask"){S.ask=(typeof ASK==="object"&&ASK[r.ask])?r.ask:S.ask;S.askTab=r.askTab==="asked"?"asked":"ask";S.sel=new Set();}
   if(r.v==="auto"){S.tab=AUTOTABS.includes(r.tab)?r.tab:"activity";S.act=r.act;}
   if(r.v==="now"){S.scope=SCOPES.includes(r.scope)?r.scope:"me";S.teamTab=r.teamTab;}
   S.v=r.v;
  })();
  /* Paint the skeleton before asking for anything. boot() awaits the first
     response before it calls render, so without this the page sits blank for
     however long the database takes — and the host is 200ms away on a good
     day. ROUTING guards it (and every render boot() fires internally) so a
     screen that already matches the URL never rewrites it as a side effect
     of merely being drawn. */
  ROUTING = true;
  try { render(); } finally { ROUTING = false; }
  /* Still called: the one case applyRouteBeforeFirstPaint() could not
     resolve (a /company/<name> not yet fetched), and a final correctness
     pass now that real data is in hand. */
  window.PulseLive.boot(PULSE_BAG, render).then(routeGo, routeGo);
} else {
  routeGo();
}
