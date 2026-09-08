const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const PROD=["SMS","OTP","WHATSAPP","EMAIL","VOICE","HELLO","SEGMENTO","CAMPAIGN","RCS","MASK"];
const OWNED=["SMS","OTP","WHATSAPP","EMAIL","HELLO"];

let BOOK=[
["TR","Trellis Retail","India","Startup","growing on SMS, never tried WhatsApp",1],
["KP","Kanchan Pharma","India","Outbound","waiting on your rate decision",1],
["FP","Falcon Pay","UAE","Partner","recovering from yesterday's outage",1],
["BF","Bluebird Fintech","US","Inbound","quote ready to send",1],
["ZL","Zippy Logistics","India","Inbound","paused WhatsApp, reason unknown",1],
["MT","Marigold Travel","Singapore","Partner","stepping back — 22 days of silence",1],
["NF","Nova Foods","India","Startup","stuck in DLT approval, day 9",1],
["OL","Orbit Learning","India","Inbound","signed up 4 minutes ago",1],
["AL","Aster Labs","India","Inbound","steady · 180k SMS a month",0],
["VM","Vega Mobility","India","Outbound","volume dropped, reason unclear",0],
["SB","Saffron Bank","India","Partner","OTP only · renewal in November",0],
["MH","Meridian Health","Singapore","Inbound","onboarding, week 3",0],
["KI","Kite Insurance","India","Inbound","steady · campaign heavy",0],
["CE","Cobalt Energy","US","Outbound","first invoice paid",0],
["DL","Dune Logistics","UAE","Partner","growing on WhatsApp",0],
["PG","Peartree Grocers","India","Startup","free credit at 78%",0],
["LL","Lantern Legal","US","Inbound","quiet, healthy",0],
["RK","Rapid Kirana","India","Startup","first message sent yesterday",0]];

let CARDS=[
{s:"me",w:0,r:"Your hands",cust:"Orbit Learning",geo:"India · Inbound",clock:348,
 h:"Call Devika at Orbit Learning.",
 y:'Signed up <span class="l1">4 minutes ago</span> on the OTP trial. Quality 91 — business domain, 40 people, read the pricing page twice. Unassigned until you take her.',
 a:"Call Devika",solid:1,
 rev:[["Quality score","91 / 100 · business domain, 40 employees, 2 pricing visits"],
      ["Source","utm_campaign=otp-compare · google/cpc"],
      ["Rule","Inbound · quality ≥ 80 → human contact within 10 minutes"],
      ["Who she is","Devika Rao · Head of Product · orbitlearning.in · linkedin.com/in/devikarao"],
      ["What they do","K-12 test-prep platform · ~40 staff · Bengaluru · Android app, 60k installs"],
      ["Why they need OTP","App has a phone-number login. No OTP provider detected on their stack."],
      ["Owner","Unassigned"]]},

{s:"me",w:0,r:"Your judgment",cust:"Kanchan Pharma",geo:"India · Outbound",
 h:"Kanchan Pharma wants ₹0.11 per SMS.",
 y:'Your floor is ₹0.125. At 11L a month that is <span class="l1">₹1.4L a year</span> below floor, margin 4.1% against a 9% policy. Asked twice, still unanswered.',
 a:"Review the options",solid:1,
 rev:[["Current rate","₹0.128 · 11,00,000 SMS / month committed"],
      ["Margin at ₹0.11","4.1% · policy floor is 9%"],
      ["AI alternative","₹0.119 with 24-month term → margin 9.4%"],
      ["Comparable","Aster Labs ₹0.121 · Kite Insurance ₹0.124"],
      ["Competitor","Trial opened 12 Aug, ends 30 Sep"]]},

{s:"me",w:0,r:"Your voice",cust:"Falcon Pay",geo:"UAE · Partner",
 h:"Falcon Pay should hear this from you.",
 y:'OTP delivery failed for <span class="l1">4h 12m</span> yesterday on the Etisalat route. Draft is ready but Rashid trusts you — it should sound like you.',
 a:"Read the draft",solid:1,
 rev:[["Impact","9,412 OTPs delayed · 2 tickets · both closed"],
      ["Timeline","15:02 route failed · 15:14 failover · 19:14 recovered"],
      ["Root cause","Sent by support 19:40"],
      ["Draft opens","“Rashid — yesterday was on us, and here is exactly what happened.”"]]},

{s:"me",w:0,r:"Your approval",cust:"Bluebird Fintech",geo:"US · Inbound",
 h:"The WhatsApp quote for Bluebird is ready.",
 y:'180,000 conversations a month at <span class="l1">$0.0089</span>, margin 11.2%. Built from their email volume and US rate card v4. Nothing outside policy.',
 a:"Approve and send",solid:1,
 rev:[["Quote","WhatsApp Business · 180,000 conv/month · $0.0089"],
      ["Margin","11.2% · floor 9%"],
      ["Basis","Email volume Jun–Aug, +31% · US rate card v4"],
      ["Prepared","Today 08:14 by Pulse"],
      ["If unanswered","Reminder at 16:00, then held"]]},

{s:"me",w:0,r:"Your knowledge",cust:"Zippy Logistics",geo:"India · Inbound",
 h:"Did Imran say why Zippy paused WhatsApp?",
 y:'Zero volume since <span class="l1">14 August</span>. No ticket, no complaint, invoice paid on time. SMS unchanged. You met him on the 12th.',
 a:"Tell me what happened",solid:0,
 rev:[["WhatsApp","0 messages since 14 Aug · was 22% of spend"],
      ["SMS","2,40,000 / month · unchanged"],
      ["Support","No tickets in 90 days"],
      ["Billing","Invoice #MS-40118 paid 04 Aug, on time"]]},

{s:"me",w:0,r:"Your hands",cust:"Trellis Retail",geo:"India · Startup",
 h:"Trellis has never touched WhatsApp.",
 y:'<span class="l1">400k SMS</span> a month for order updates, up 12% this quarter. Kavita asked about WhatsApp on 22 July and nobody replied.',
 a:"See what to pitch",solid:0,
 rev:[["The opening","Kavita Rao, marketing — 22 Jul, unanswered"],
      ["Comparable","8 accounts, same profile → +38% median messaging spend"],
      ["Who to talk to","Kavita Rao, not Imran Shaikh"],
      ["Competitor moved","June"]]},

{s:"me",w:1,r:"Watch closely",cust:"Marigold Travel",geo:"Singapore · Partner",
 h:"Marigold may be slipping.",
 y:'SMS down <span class="l1">35%</span> over 14 days. Silent 22 days while we reached out 3 times. Siti still opens the reports weekly.',
 a:null,
 rev:[["Silence clock","22 days since they last responded"],
      ["Effort clock","3 days since we last reached out"],
      ["Volume","1,84,000 → 1,19,600 / month"],
      ["Next","Warm intro through the partner, before I ask you"]]},

{s:"me",w:1,r:"Watch closely",cust:"Nova Foods",geo:"India · Startup",
 h:"Nova is stuck in DLT approval.",
 y:'<span class="l1">Day 9</span> and still zero messages sent. Header pending with the operator. I have chased daily and escalated on day 7.',
 a:null,
 rev:[["Signed up","28 Aug · target first value 3 days"],
      ["Blocked on","Header NOVAFD pending · operator queue"],
      ["Chased","9 follow-ups · SPOC escalation 04 Sep"],
      ["Pattern","3rd startup this month on the same operator"]]},

{s:"team",w:0,r:"Your judgment",cust:"Arjun Nair",geo:"India · Inbound",
 h:"Arjun has not touched 6 of his accounts in 61 days.",
 y:'<span class="l1">6 accounts</span> with no meaningful conversation in 30 days. Prompted privately on 8 July and 2 August. Promises kept 96%.',
 a:"Look at his accounts",solid:1,
 rev:[["Accounts","64 accounts · India inbound"],
      ["Flat since","07 Jul"],
      ["Private prompts","08 Jul, 02 Aug — his view only"],
      ["Escalation rule","Manager after 2 prompts and 21 days"],
      ["Not in question","Response 3h · promises 96%"]]},

{s:"team",w:0,r:"Your hands",cust:"Unassigned",geo:"India · Partner",
 h:"46 accounts have had no owner since Vikram left.",
 y:'<span class="l1">14 days</span> unassigned. Three asked a question in that time and nobody answered.',
 a:"Reassign the accounts",solid:1,
 rev:[["Proposed split","India 28 → Rhea, Sana · UAE 11 → Arjun · Singapore 7 → Priya"],
      ["Basis","Current load, country, product overlap"],
      ["Unanswered","Dune Logistics, Cobalt Energy, Kite Insurance"]]},

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
      ["Raised tickets","Falcon Pay, Dune Logistics"],
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
 stats:[["9/10","promises kept","Promises kept","A promise is any commitment Pulse extracted from your email, calls or notes. One missed: the Falcon Pay incident note, due 17:00 today."],
  ["4h","first response","First response","Median time from a high-quality inbound signup to a real human reply. Target is 6h; the team average is 5h."],
  ["3","recovered","Accounts recovered","Accounts that were declining or silent and are now sending again. Vega Mobility, Kite Insurance, Saffron Bank."],
  ["2","activated","Products activated","A product that moved from considering or setting up to actively sending. WhatsApp at Dune Logistics, Email at Meridian Health."],
  ["18","accounts","Your accounts","Companies where you are the MSG91 owner across all ten products. Nine gained, one handed over this quarter."]],
 pills:1},
team:{lab:"Sales this September",h:'The team kept 41 of 48 promises. Response time is down to <em>five hours</em> from nine.',
 score:79,delta:"+4 from August",
 tip:["Team score","The median of 25 individual scores, not an average — one bad month cannot drag the team, and one great month cannot hide it."],
 stats:[["41/48","promises kept","Promises kept","Seven missed, six of them in the week two UAE reps were on leave."],
  ["5h","first response","First response","Down from 9h in July. UAE is the outlier at 9h; India is at 3h."],
  ["11","recovered","Accounts recovered","Across 25 reps. Rhea 3, Sana 2, Priya 2, four others 1 each."],
  ["9","activated","Products activated","WhatsApp 4 · Email 3 · Voice 1 · Segmento 1."],
  ["486","accounts","Team accounts","Owned across the team. 46 currently unassigned since Vikram left."]],
 movers:[["Rhea +3","accounts recovered"],["Arjun 100%","promises kept"],["Sana +4","products activated"]]},
company:{lab:"MSG91 this September",h:'Pulse handled 1,842 signals. <em>Sixty-three needed a human.</em>',
 score:92,delta:"+11 from August",
 tip:["Autonomy score","How much of the customer lifecycle runs without a person. 96.6% of signals resolved without escalation, weighted by how consequential each one was."],
 stats:[["1,842","signals","Signals","Every meaningful change: signup, payment, usage shift, message, meeting, ticket, DLT status."],
  ["63","reached a person","Escalations","Signals where AI decided only a human could resolve it. 41 judgment, 12 approval, 7 voice, 3 knowledge."],
  ["12","rules proposed","AI proposals","Rules AI wrote for itself after seeing the same decision resolved the same way. Nine accepted."]]}};

let CUST={
"Orbit Learning":{v:"Four minutes old and already worth a call.",
 s:"Business domain, 40 employees, read the pricing page twice, arrived on the OTP comparison campaign. Quality 91.",
 pe:[["Devika Rao","Signed up · not yet contacted","Decision maker"]],
 la:[["OTP","setting up","trial · 4 min"]],
 ev:[["09:12","Signed up on the OTP trial"],["09:10","Read /pricing — second visit"],["08:58","First visit · utm_campaign=otp-compare"]],
 money:[["—","received","No payments yet"],["—","wallet","No wallet"],["Trial","plan","OTP trial · 14 days"]]},
"Kanchan Pharma":{v:"Ready to commit, waiting on a rate nobody has answered.",
 s:"Asked twice for ₹0.11 against a ₹0.125 floor. 11L SMS a month committed if it clears.",
 pe:[["Dr. Meera Joshi","Asked twice · waiting since 12 Aug","Decision maker"],
     ["Rohit Bhatt","Completed the API test 21 Aug","Technical"],
     ["Sunita Rao","Pays within terms","Billing"]],
 la:[["SMS","considering","11L/mo if cleared"],["OTP","active","40k/mo"]],
 ev:[["03 Sep","Second rate request"],["21 Aug","API test completed"],["12 Aug","First rate request"],
     ["12 Aug","Competitor trial opened"],["04 Aug","Payment received"]],
 money:[["₹8,42,000","received · 12 months","INR"],["₹1,10,400","wallet balance",""],["₹0.128","current SMS rate",""]]},
"Trellis Retail":{v:"Growing on SMS, and blind to everything else.",
 s:"400k order-update SMS a month, up 12% this quarter. Marketing asked about WhatsApp in July and nobody replied.",
 pe:[["Kavita Rao","Asked about WhatsApp 22 Jul · last spoke 46d","Marketing"],
     ["Imran Shaikh","Runs the SMS integration · weekly","Technical"],
     ["Deepa Nair","Pays on time, never talks","Billing"]],
 la:[["SMS","growing","4,00,000/mo"],["OTP","active","62,000/mo"],["EMAIL","setting up","week 3"],
     ["WHATSAPP","considering","asked Jul"],["VOICE","stopped","ended Feb"]],
 ev:[["12 Sep","SMS crossed 4,00,000 for the first time"],["22 Jul","Kavita asked about WhatsApp order updates"],
     ["04 Jul","Payment received · ₹1,84,000"],["19 Jun","Email integration started"]],
 money:[["₹19,60,000","received · 12 months","INR"],["₹2,40,800","wallet balance",""],["₹0.119","current SMS rate",""]]},
"Marigold Travel":{v:"They are stepping back, and it is not because we forgot.",
 s:"SMS down 35% over 14 days. Silent 22 days while we reached out three times.",
 pe:[["Wei Lin Tan","Stopped replying 22d ago","Decision maker"],
     ["Siti Rahman","Still opens the reports weekly","Operations"]],
 la:[["SMS","declining","1,19,600/mo ▾35%"],["EMAIL","active","flat"],["WHATSAPP","paused","since Aug"]],
 ev:[["28 Aug","Volume began falling"],["25 Aug","Third outreach — no reply"],["15 Aug","Last reply from Wei Lin"],
     ["02 Aug","Delivery latency ticket · resolved"]],
 money:[["S$41,200","received · 12 months","SGD"],["S$3,900","wallet balance",""],["S$0.0412","current SMS rate",""]]},
"Falcon Pay":{v:"A solid account that just had a bad day.",
 s:"OTP delivery failed for 4h 12m yesterday on the Etisalat route. Everything else is healthy.",
 pe:[["Rashid Al Mansoori","Trusts you · spoke 9d ago","Decision maker"],
     ["Priya Kuruvilla","Raised both tickets","Technical"]],
 la:[["OTP","active","9,412 delayed, recovered"],["SMS","growing","▴18% this quarter"],["WHATSAPP","setting up","sandbox"]],
 ev:[["05 Sep","Etisalat route failed 15:02–19:14"],["05 Sep","Root cause sent by support"],
     ["28 Aug","WhatsApp sandbox opened"],["12 Aug","Payment received"]],
 money:[["AED 214,000","received · 12 months","AED"],["AED 18,400","wallet balance",""],["AED 0.0290","current OTP rate",""]]},
"Bluebird Fintech":{v:"Growing on email and ready for a second product.",
 s:"Email volume up 31% over two quarters. WhatsApp quote drafted and waiting on approval.",
 pe:[["Marcus Webb","Replies fast · spoke 8d ago","Decision maker"],
     ["Elena Cruz","Integrated in four days","Technical"]],
 la:[["EMAIL","growing","▴31% two quarters"],["WHATSAPP","considering","quote drafted"]],
 ev:[["06 Sep","Quote drafted by Pulse"],["29 Aug","Asked about WhatsApp pricing"],["14 Aug","Email volume record"]],
 money:[["$64,800","received · 12 months","USD"],["$4,100","wallet balance",""],["$0.00041","current email rate",""]]},
"Zippy Logistics":{v:"Something happened on 14 August and nobody knows what.",
 s:"WhatsApp went to zero with no ticket, no complaint and no missed invoice. SMS unchanged.",
 pe:[["Imran Qureshi","You met him 12 Aug","Technical"],["Naina Shetty","Quiet","Operations"]],
 la:[["WHATSAPP","stopped","0 since 14 Aug"],["SMS","active","2,40,000/mo"],["OTP","active","31,000/mo"]],
 ev:[["14 Aug","WhatsApp volume dropped to zero"],["12 Aug","Meeting with Imran"],["04 Aug","Invoice paid on time"]],
 money:[["₹11,20,000","received · 12 months","INR"],["₹1,86,000","wallet balance",""],["₹0.124","current SMS rate",""]]},
"Nova Foods":{v:"Nine days in and still cannot send a message.",
 s:"Header pending with the operator since day one. Target time to first value is three days.",
 pe:[["Aditi Sharma","Founder · patient so far","Decision maker"]],
 la:[["SMS","setting up","blocked on DLT"]],
 ev:[["06 Sep","Ninth follow-up to the DLT desk"],["04 Sep","Escalated to operator SPOC"],["28 Aug","Signed up"]],
 money:[["₹0","received","Startup programme"],["₹5,000","free credit",""],["—","rate","Not set"]]}};

let ASK={
churn:{q:"Who is most likely to churn this month?",big:"4",
 h:"Marigold Travel, Zippy Logistics, Vega Mobility and Nova Foods.",
 p:"All four stopped sending. Three went quiet before the volume moved.",
 brk:[["Marigold Travel","SMS ▾35% · silent 22d"],["Zippy Logistics","WhatsApp 0 since 14 Aug"],
      ["Vega Mobility","SMS ▾28% · silent 31d"],["Nova Foods","never sent · day 9"]],
 act:"Create recovery missions for all four",
 st:["Rhea Menon","today 09:12","your accounts","fresh to 08:55","2 accounts masked"]},
flat:{q:"Whose accounts are flat?",big:"2",
 h:"Arjun Nair at 61 days, Priya Sundaram at 34.",
 p:"Both kept their promises and answered fast. Neither started a new conversation with an existing customer in over a month.",
 brk:[["Arjun Nair","64 accounts · flat since 07 Jul · 2 prompts sent"],
      ["Priya Sundaram","51 accounts · flat since 03 Aug · not yet prompted"]],
 act:"Open Arjun's accounts",
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
      ["Top account","Falcon Pay · AED 214,000"]],
 act:"Look at the after-hours gap",
 st:["saved lens","Rhea Menon","today 09:16","UAE entity","AED only"]},
stuck:{q:"Which startups are stuck before their first message?",big:"3",
 h:"Nova Foods, Peartree Grocers and Rapid Kirana.",
 p:"All three on the same operator's DLT queue, all past day seven against a three-day target.",
 brk:[["Nova Foods","day 9 · header NOVAFD"],["Peartree Grocers","day 8 · header PRTREE"],
      ["Rapid Kirana","day 7 · cleared yesterday"]],
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
 ACT:["ACT","AI does this on its own. No card, no person, logged."],
 CARD:["CARD","AI stops here and puts a card in front of a person."]};
const TABTIP={
 connections:["Connections","What Pulse can reach. Everything AI can do depends on this list — an amber dot means something is switched off."],
 live:["Live","What AI is doing right now, as it happens. Nothing here needs you."],
 rules:["Rules","The policies AI follows, one set per motion. This is where you change its behaviour."],
 ailog:["AI log","Every decision AI made, with the evidence and the policy behind it. Searchable."],
 audit:["Audit log","Every action a person took — viewed, revealed, changed, exported. Separate from the AI log."],
 filtered:["Filtered","Signups AI suppressed, and why. Reviewable, never deleted."]};

let AUTO={
live:{sys:["Needs attention","The UAE after-hours routing rule fired 41 times in an hour.",
 "Normal is four. Paused at 09:02, nothing was sent. The office-hours window was changed at 08:58."],
 f:[["09:14","Drafted a recovery mail for Marigold Travel","Silence 22d, effort 3d. Held — the last two drafts to this account were edited.","draft","act"],
 ["09:11","Merged two missions on Zippy Logistics","Protect revenue and solve issue, same evidence.","merge",""],
 ["09:04","Chased the DLT desk for Nova Foods","Ninth follow-up. Escalated to the operator SPOC.","acted","ok"],
 ["08:59","Answered a rate question for Aster Labs","India rate card v7, inside policy. Sent from sana@msg91.com.","sent","ok"],
 ["08:52","Merged a duplicate signup","Third signup from trellisretail.in, different department.","merged","ok"],
 ["08:47","Scored 14 new signups","One crossed the call threshold — Orbit Learning, 91.","acted","ok"],
 ["08:31","Scheduled a follow-up on Bluebird Fintech","If no reply by Thursday, nudge once then hand back.","timer",""],
 ["08:22","Promoted subject line B on recovery mails","+18% reply rate over 240 sends. Policy v7 → v8.","learned","ok"],
 ["08:04","Failed over the AE route","Etisalat degraded. Switched at 08:04, 0 messages lost.","acted","ok"]]},
rules:{mo:[
 ["Inbound","Rhea, Sana, Arjun · 312 accounts",[["ACT","Score every signup within 60 seconds on domain, company size, pages read and UTM."],
  ["CARD","Quality 80+ → call within 10 minutes. Clock on the card, escalates to the manager at zero."],
  ["ACT","Quality 40–79 → three-mail onboarding over 12 days. No human unless they reply."],
  ["ACT","Below 40 → suppress and file under Filtered."]]],
 ["Outbound","Sana, Priya · 88 accounts",[["ACT","Research fit against ICP before any contact. No contact without a named reason."],
  ["ACT","Maximum two touches in 14 days."],["CARD","Any reply from a named decision maker → same-day human contact."],
  ["ACT","No reply after two touches → cool 90 days, then re-score."]]],
 ["Startup","Rhea, Arjun · 141 accounts",[["ACT","Confirm programme eligibility from the signup form."],
  ["ACT","Track days to first message. Chase DLT and sender ID daily."],
  ["CARD","Day 12 with no first message → a person takes over."],["ACT","Free credit at 80% → send the upgrade path."]]],
 ["Partner","Rhea, Priya · 94 accounts",[["ACT","Monthly digest to each partner of sourced accounts and outcomes."],
  ["CARD","Partner-sourced account goes quiet → route through the partner."],
  ["ACT","Never open a price conversation without the partner on the thread."],
  ["CARD","Partner-sourced volume down 20% → tell the partner manager."]]]],
 pr:[["Stop asking about cancellation clauses under ₹50k","Approved four times in a row with no edits.","Let AI handle it","Keep asking me"],
  ["Promote recovery mails from draft to send","22 drafts released unedited. Accounts under ₹1L a month only.","Promote to send","Not yet"]]},
ailog:{f:[
 ["09:14","Marigold Travel · risk detected · confidence 0.81","SMS −35%/14d (reports) · no inbound reply 22d (gmail) · 3 outbound attempts. Policy: Partner, protect revenue. Drafted recovery mail, held for human. FYI: Rhea.","draft","act"],
 ["09:11","Zippy Logistics · missions merged","Open protect-revenue mission already covered the WhatsApp pause. Duplicate suppressed.","merge",""],
 ["08:59","Aster Labs · rate question · confidence 0.94","Matched India rate card v7. No margin exception. Sent from sana@msg91.com. FYI: Sana.","sent","ok"],
 ["08:40","Vega Mobility · could not decide","Confidence 0.42 on cause of volume drop. Rules could not resolve. Escalated to Arjun.","escalated","act"],
 ["08:22","Experiment E-014 · variant B wins","+18% reply over 240 sends, significant. Promoted to default. Policy v7 → v8.","learned","ok"],
 ["07:51","Kite Insurance · recovery complete","Volume back to 94% of baseline after 3 touches. Mission closed, outcome recorded.","acted","ok"]]},
audit:{sys:["Anomaly","Arjun revealed payment history on 40 accounts between 01:52 and 02:14.",
 "Outside his hours, 12× his usual volume, 31 of 40 outside his own accounts. Export blocked. Flagged 02:16."],
 f:[["09:12","Rhea Menon revealed margin on Kanchan Pharma","Reason: rate request below floor. Level 2, commercial.","reveal",""],
 ["09:06","Sana Qureshi viewed Aster Labs","Level 0 only. Her own book.","view",""],
 ["08:58","Priya Sundaram changed the UAE office-hours window","Removed 18:00–02:00 GST from inbound routing.","config","act"],
 ["08:31","Rhea Menon approved a quote for Bluebird Fintech","$0.0089 per conversation, margin 11.2%. Sent.","approve",""],
 ["02:14","Arjun Nair attempted an export of 40 accounts","Requires a named reason and a second approver.","blocked","act"]]},
connections:{f:[]},
filtered:{f:[
 ["09:07","rahul.test@gmail.com","Free domain, no company, bounced verification, scraper user agent. Quality 4.","junk",""],
 ["08:52","Duplicate of Trellis Retail","Third signup from trellisretail.in, different department.","merged","ok"],
 ["08:41","Amrita University · student project","Named it a college assignment in the signup note. Quality 11. Sent free-tier docs.","junk",""],
 ["08:12","Competitor domain","Suppressed and flagged, not blocked.","junk",""],
 ["07:58","wecare-ngo.org re-scored","Sana marked it real — they run 200k SMS a year. Non-profit domains no longer lose 30 points.","learned","ok"]]}};


const DUP={s:"me",w:0,r:"Your hands",cust:"Trellis Retail",geo:"India · Startup",
 h:"Someone new at Trellis just signed up.",
 y:'Nikhil Bansal, growth lead, created his own account <span class="l1">this morning</span> — Trellis is already yours through Imran and Kavita. Either a new department is evaluating, or they are not getting what they need from you.',
 a:"Call Nikhil",solid:1,
 rev:[["Who he is","Nikhil Bansal · Growth Lead · joined Trellis Mar 2025 · linkedin.com/in/nikhilbansal"],
  ["What he did","Signed up on the WhatsApp trial, not SMS. Read /whatsapp-pricing twice."],
  ["Why it matters","Kavita asked about WhatsApp on 22 Jul and nobody replied. This is the same department asking again."],
  ["Already merged","Attached to Trellis Retail. No duplicate company created."],
  ["Not contacted","I have sent him nothing. A signup from an existing customer is a conversation, not a sequence."]]};

CARDS.splice(6,0,DUP);

const DONE_T=[
 ["09:22","Reassigned 11 UAE accounts to Arjun","from the unassigned accounts","Unassigned"],
 ["08:47","Reverted a startup credit","Lumen Tutors · 34 staff, above the limit","Lumen Tutors"],
 ["08:12","Approved the after-hours routing test","UAE inbound, four weeks","UAE inbound"]];
const DONE_C=[
 ["09:40","Told all nine customers about the UAE outage","full disclosure, as in March","OTP · UAE"],
 ["08:05","Sent the RCS ask to product","third quarter running","Product signal"]];
const DONE=[
 ["09:31","Called Devika at Orbit Learning","reached in 6 minutes · trial extended to 30 days","Orbit Learning"],
 ["09:18","Approved the WhatsApp quote for Bluebird","$0.0089 · sent from your mailbox","Bluebird Fintech"],
 ["08:54","Sent the incident note to Falcon Pay","edited the draft before sending","Falcon Pay"],
 ["08:22","Told Pulse why Zippy paused WhatsApp","cost decision · recovery play switched","Zippy Logistics"]];

let STANDINGS=[
 ["Sana Qureshi","SQ",91,"+5","up",0],["Rhea Menon","RM",86,"+7","up",1],
 ["Priya Sundaram","PS",84,"+2","up",0],["Arjun Nair","AN",81,"-3","down",0],
 ["Vikas Menon","VM",79,"+4","up",0],["Neha Kulkarni","NK",77,"+1","up",0],
 ["Farhan Ali","FA",74,"-1","down",0],["Ritu Shah","RS",72,"+6","up",0]];


const FLIGHT=[
 ["Bluebird Fintech","Quote sent, waiting on Marcus","them",3,0,"I nudge on Thursday, then hand it back to you"],
 ["Saffron Bank","Renewal quote with their finance team","them",8,0,"Second reminder goes Monday"],
 ["Cobalt Energy","Outbound · two touches sent","them",6,0,"Cooling until 04 Dec, then re-score"],
 ["Nova Foods","DLT header pending with the operator","us",9,1,"Chasing daily · SPOC escalated on day 7"],
 ["Dune Logistics","Contract sitting with legal since 21 Aug","us",16,1,"I have asked legal twice. This is the oldest thing you own."],
 ["Meridian Health","Onboarding · week 3 of 4","pulse",19,0,"Sequence running, two mails left. No human needed."],
 ["Rapid Kirana","First message sent, watching activation","pulse",1,0,"Watching volume for 7 days before I say anything"]];

ASK.flight={q:"What is in flight?",big:"7",
 h:"Three with them, two blocked here, two with me.",
 p:"Sorted by how long the ball has been sitting. Two are older than they should be.",
 cols:["Company","What","Ball","Days","What I am doing"],
 rows:FLIGHT.map(f=>[f[0],f[1],{them:"Them",us:"Blocked here",pulse:"Pulse"}[f[2]],f[3]+"d",f[5]]),
 act:"Chase everything over 7 days",
 st:["Rhea Menon","today 09:26","your accounts","fresh to 09:24"]};


const CONN=[
 ["Mailboxes · everyone's own","part","22 of 25 people connected · each person connects their own in Profile",
  "Silence detection · promise extraction · reply drafting · who said what",
  "Arjun Nair, Farhan Ali and Ritu Shah have not connected. For their 134 accounts I cannot tell silence from a missed follow-up.","Nudge them"],
 ["Calendars · everyone's own","part","22 of 25 people connected · each person connects their own in Profile",
  "Meeting prep 20 minutes before · post-meeting capture · promises made on calls","Same three people.","Nudge them"],
 ["MSG91 SMS","on","Sender IDs MSG91P, MSGIND · India, UAE",
  "Everything I send by SMS goes through our own product","",""],
 ["MSG91 WhatsApp","on","+91 90000 00000 · verified business account",
  "Outreach, recovery mails and onboarding nudges on WhatsApp","",""],
 ["MSG91 Email","on","pulse@msg91.com · plus each rep's own mailbox",
  "Sequences from Pulse, drafts from your address","",""],
 ["Slack","on","msg91.slack.com · #sales, #cs-alerts, and DMs",
  "FYI when I act on your account · daily digest · anomaly alerts","",""],
 ["Reports microservice","off","not connected",
  "Usage by product · consumption · delivery health · decline detection",
  "This is the biggest gap. Right now I can see payments but not usage, so I detect decline late and I cannot see delivery failures at all.","Connect"],
 ["Billing and subscriptions","off","not connected",
  "Active subscriptions · fees · renewal dates · lifecycle events",
  "Renewals are invisible to me. I am inferring them from payment dates.","Connect"],
 ["Hello · support","on","read-only · tickets and sentiment",
  "Support signals feed the owner's cards","",""],
 ["DLT desk","part","manual · no API",
  "Header and template status for Indian SMS",
  "A person still updates this. Three startups are stuck behind it right now.",""]];

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


const ME={gmail:1,cal:1,slack:1,email:1,push:1,name:null,email_addr:null};
const VOICE=["Short sentences","Opens with the point, never a greeting","Says sorry plainly, no hedging",
 "Signs off with just your first name","Never uses exclamation marks"];
const ONB=[
 ["Step 1 of 4","Connect your mailbox and calendar.",
  "Almost everything Pulse does starts here. Without your mail I cannot tell whether a customer went quiet or you simply forgot to follow up — and those need opposite responses.",
  "connect"],
 ["Step 2 of 4","These 18 accounts are yours.",
  "Pulled from MSG91. Remove anything that should not be yours and add anything I have missed — ownership decides who I bring things to, so it is worth thirty seconds now.",
  "book"],
 ["Step 3 of 4","This is how you write.",
  "I read your last twenty sent mails. When I draft something for you to send, it will sound like this. Delete what is wrong and add what I missed — this matters more than you would think.",
  "voice"],
 ["Step 4 of 4","That is everything.",
  "Six things need you this morning. I have already handled forty-seven others, and you can see every one of them in Autopilot whenever you want to check my work.",
  "done"]];
const ONBSTATE={dropped:new Set(),traits:VOICE.slice()};

const ROOM=[
 ["Claim an account","Dune Logistics has no owner and is growing on WhatsApp.",
  "UAE, partner-sourced, unassigned for 16 days. They asked a question on 22 August and nobody answered it. Their WhatsApp volume is up 22% anyway.",
  "AED 96,000 RECEIVED IN 12 MONTHS · 1 OF 11 UNOWNED IN YOUR COUNTRIES","Claim it"],
 ["Sell a second product","Six of your accounts use only one MSG91 product.",
  "Trellis, Saffron Bank, Kite Insurance, Lantern Legal, Cobalt Energy and Rapid Kirana. Trellis is the obvious one — 400k SMS a month and marketing already asked about WhatsApp.",
  "MEDIAN OUTCOME FOR THIS PROFILE: +38% MESSAGING SPEND IN TWO QUARTERS","See the best three"],
 ["Meet someone new","At five of your accounts you only know one person.",
  "If Imran leaves Zippy, you lose the account. Kavita at Trellis is the only person who has ever replied to you there. Single-thread accounts churn at roughly twice the rate.",
  "ZIPPY · TRELLIS · SAFFRON BANK · RAPID KIRANA · LANTERN LEGAL","Who to meet"],
 ["New prospects","Fourteen companies look like your best customers and are not with MSG91.",
  "Closest is Zenith Mart — a 200-store grocery chain running order SMS through a competitor, with an app that has a phone-number login and no OTP provider I can detect.",
  "MATCHED ON: VOLUME PROFILE · INDUSTRY · APP LOGIN · CURRENT PROVIDER","Look at them"],
 ["Wake something up","Vega Mobility left in March. Their new CTO used us at his last company.",
  "Arjun still owns it and has not touched it in 94 days. Rohan Desai joined in July from Aster Labs, where he ran our OTP integration himself.",
  "WAS ₹4,10,000 A YEAR · LEFT OVER DELIVERY LATENCY, SINCE FIXED","Read the story"],
 ["Worth ten minutes","You lose most often on rate — two of your last four.",
  "Both times you countered once and stopped. Sana holds ₹0.121 on comparable pharma accounts by leading with term length instead of price.",
  "PRIVATE · ONLY YOU SEE THIS","Ten minutes on this"]];

const ROOM_NEW=[
 ["Take your first accounts","Eleven unowned accounts are in your countries.",
  "Three are sending well and one asked a question nobody answered. Start with those — a live account teaches you more in a week than any document.",
  "46 UNOWNED IN TOTAL · 11 IN INDIA AND SINGAPORE","Show me the eleven"],
 ["Read before you call","Three accounts are worth understanding first.",
  "Trellis Retail, Kanchan Pharma and Falcon Pay. Each one is a different shape of MSG91 customer — a startup growing on volume, an outbound deal stuck on rate, and a partner account recovering from an outage.",
  "ABOUT 20 MINUTES","Open the first"],
 ["See how the team works","Six people are working 41 open situations right now.",
  "Team scope shows you what your colleagues are handling and how. The fastest way to learn the job here is to watch it happen.",
  "NOTHING IS HIDDEN FROM YOU","Open Team"],
 ["Ask me anything","I know every account, every payment and every conversation.",
  "Try: which of our customers use WhatsApp? What does a good Indian inbound signup look like? Who should I talk to at Trellis?",
  "ASK IN YOUR OWN WORDS · NO REPORTS TO LEARN","Ask something"]];

let PINNED={
team:[
 ["Response time by country","This month, high-quality inbound only","3h · 9h","IN · AE",[41,38,34,30,26,22,20],"uae"],
 ["Accounts with nobody on them","Unassigned since Vikram left, 14 days ago","46","3 asked questions",null,"cold"],
 ["Whose accounts are flat","No new conversation in 30 days","2","Arjun 61d, Priya 34d",null,"flat"]],
company:[
 ["Payments received this month","Four entities, native currency, never converted","₹1.42Cr","+ AED 402k · $184k · S$212k",null,"partner"],
 ["Escalation rate","Signals that reached a person","3.4%","▼ from 6.1% in June",[61,58,52,47,43,38,34],"churn"],
 ["Human minutes per signal","Total human time ÷ signals handled","2.4","▼ 41% since June",[41,40,36,33,29,26,24],"flat"],
 ["Top unmet product ask","Third quarter running","RCS","16 customers · 6 named a competitor",null,"stuck"]]};

const TAGS={
"Trellis Retail":[["High volume",0],["Order updates",0],["Startup programme",0],["Growing",1],["Single-thread risk",1]],
"Kanchan Pharma":[["Rate sensitive",0],["Pharma",0],["Competitor trial",1],["Decision pending",1]],
"Marigold Travel":[["Partner sourced",0],["Travel",0],["At risk",1],["Ghosting",1]],
"Falcon Pay":[["Partner sourced",0],["Fintech",0],["Had an incident",1]],
"Bluebird Fintech":[["Fintech",0],["Quote out",1],["Expanding",1]],
"Zippy Logistics":[["Logistics",0],["Reason unknown",1]],
"Nova Foods":[["Startup programme",0],["Blocked on DLT",1]],
"Orbit Learning":[["Edtech",0],["High quality inbound",1]]};

const OPEN={
"Trellis Retail":[["mission","Grow product · WhatsApp","Opened 12 Sep by Pulse · waiting on you to pitch Kavita","open"],
 ["promise","Send the WhatsApp pricing sheet","You said Friday, on the call with Kavita","due Fri"],
 ["watch","Volume above 400k","Pulse is watching for a plan change","auto"]],
"Kanchan Pharma":[["mission","Qualify · rate decision","Opened 12 Aug · blocked on your judgment","open"],
 ["overdue","Reply to Dr. Joshi","Asked twice. Second request 3 Sep.","4d late"],
 ["promise","Send revised rate","You said Wednesday, on the 15:00 call","due Wed"]],
"Marigold Travel":[["mission","Protect revenue","Opened 28 Aug by Pulse · recovery mail drafted, held for you","open"],
 ["watch","Silence 22 days","Pulse tries the partner first","auto"]],
"Falcon Pay":[["promise","Send the incident note","You said today, 17:00","due 17:00"],
 ["mission","Repair relationship","Opened 5 Sep after the outage","open"]],
"Bluebird Fintech":[["mission","Grow product · WhatsApp","Quote approved and sent 6 Sep","waiting"]],
"Zippy Logistics":[["mission","Solve issue · WhatsApp paused","Blocked — Pulse needs to know why","blocked"]],
"Nova Foods":[["mission","First value","Day 9 · blocked on the DLT header","blocked"]],
"Orbit Learning":[["mission","Qualify","Opened today · call within 10 minutes","open"]]};

const APPROVALS=[
 ["02 Sep","Peartree Grocers","Startup programme · ₹5,000 free credit","Sana Qureshi","Registered 2024, under 20 staff, seed stage"],
 ["31 Aug","Rapid Kirana","Startup programme · ₹5,000 free credit","Rhea Menon","Registered 2025, 6 staff, pre-seed"],
 ["28 Aug","Nova Foods","Startup programme · ₹5,000 free credit","Rhea Menon","Registered 2024, 11 staff, seed stage"],
 ["24 Aug","Lumen Tutors","Startup programme · ₹10,000 free credit","Arjun Nair","Registered 2023, 34 staff — above the usual limit"],
 ["19 Aug","Kettle Coffee","Startup programme · ₹5,000 free credit","Neha Kulkarni","Registered 2025, 4 staff"]];

const BULK=[
 ["Zenith Mart","zenithmart.in","new","200-store grocery chain · competitor SMS detected · quality 84"],
 ["Trellis Retail","trellisretail.in","dup","Already yours — this is Nikhil from growth, attached to the account"],
 ["Harbour Freight Co","harbourfreight.ae","new","UAE logistics · WhatsApp listed on site · quality 71"],
 ["gmail.com","rakesh.k@gmail.com","junk","Free mail domain, no company · suppressed"],
 ["Lumen Tutors","lumentutors.com","dup","Already a customer under Arjun Nair since Aug"],
 ["Sable Diagnostics","sablediag.in","new","Diagnostics chain · app with phone login, no OTP provider · quality 78"],
 ["Northwind Apparel","northwindapparel.com","new","US retail · Klaviyo for email, nothing for SMS · quality 66"]];

const PARTNERS=[
 ["Cloudbridge Systems","CB","India",14,"₹18,40,000",["SMS ₹11,20,000","OTP ₹4,80,000","WhatsApp ₹2,40,000"]],
 ["Gulf Tech Partners","GT","UAE",9,"AED 214,000",["OTP AED 128,000","SMS AED 61,000","WhatsApp AED 25,000"]],
 ["Meridian Digital","MD","Singapore",7,"S$88,200",["EMAIL S$46,000","SMS S$42,200"]],
 ["Northstar Consulting","NC","United States",5,"$61,400",["EMAIL $38,900","WHATSAPP $22,500"]],
 ["Vantage Reselling","VR","India",3,"₹4,60,000",["SMS ₹4,60,000"]]];

ASK.teamall={q:"Every account my team is handling",big:"486",
 h:"Across 25 people, with what is open on each.",
 p:"Sorted by what needs attention first. Forty-six have nobody on them.",
 cols:["Account","Owner","State","Open","Last touch"],
 rows:[["Kanchan Pharma","Sana Qureshi","rate decision pending","1 overdue","today"],
  ["Marigold Travel","Rhea Menon","declining","recovery held","22d"],
  ["Vega Mobility","Arjun Nair","declining","nothing open","94d"],
  ["Dune Logistics","unassigned","growing","contract with legal","16d"],
  ["Nova Foods","Rhea Menon","blocked on DLT","day 9","today"],
  ["Falcon Pay","Rhea Menon","recovering","1 promise due","1d"],
  ["Saffron Bank","Rhea Menon","renewal out","waiting on finance","8d"],
  ["Cobalt Energy","unassigned","outbound","cooling","6d"],
  ["Meridian Health","Priya Sundaram","onboarding","week 3 of 4","2d"],
  ["Trellis Retail","Rhea Menon","growing","WhatsApp pitch","2d"]],
 act:"Open the unassigned 46",
 st:["Rhea Menon","today 09:30","Sales team","manager view","payments masked"]};
ASK.partners={q:"Revenue by partner this month",big:"₹64.2L",
 h:"Thirty-eight accounts across five partners.",
 p:"Native currency only. Cloudbridge alone is 29% of partner-sourced revenue.",
 cols:["Partner","Country","Accounts","Received","First value"],
 rows:PARTNERS.map(x=>[x[0],x[2],String(x[3]),x[4],["9 days","11 days","14 days","12 days","21 days"][PARTNERS.indexOf(x)]]),
 act:"Send each partner their digest",
 st:["Rhea Menon","today 09:32","Partner motion","no conversion applied"]};


const WRONG=["Not important","Wrong person","Already handled","Bad information","Wrong timing"];

let REPS=[["Rhea Menon","RM","18 companies · India, Singapore",1],
 ["Sana Qureshi","SQ","22 companies · India",0],["Arjun Nair","AN","64 companies · India, UAE",0],
 ["Priya Sundaram","PS","51 companies · Singapore, US",0],["Neha Kulkarni","NK","19 companies · India",0]];

ASK.cold={q:"Which accounts have not been touched in 60 days?",big:"7",
 h:"Seven, and four of them are still paying.",
 p:"Sorted by how long the silence has run. Three belong to the unassigned book.",
 cols:["Company","Last touch","Owner","Products","State"],
 rows:[["Vega Mobility","94 days","Arjun Nair","SMS, OTP","declining"],
  ["Lantern Legal","81 days","Priya Sundaram","EMAIL","quiet"],
  ["Cobalt Energy","76 days","unassigned","SMS","quiet"],
  ["Saffron Bank","71 days","Rhea Menon","OTP","quiet"],
  ["Kite Insurance","68 days","unassigned","SMS, CAMPAIGN","quiet"],
  ["Meridian Health","64 days","Priya Sundaram","EMAIL, OTP","onboarding"],
  ["Dune Logistics","61 days","unassigned","WHATSAPP","growing"]],
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
ASK.churn.rows=[["Marigold Travel","SMS -35% / 14d","Rhea Menon","22d","3d"],
 ["Zippy Logistics","WhatsApp 0 since 14 Aug","Rhea Menon","19d","1d"],
 ["Vega Mobility","SMS -28% / 21d","Arjun Nair","31d","28d"],
 ["Nova Foods","never sent · day 9","Rhea Menon","2d","today"]];

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
 rows:[["promise","Reply to Dr. Joshi","Kanchan Pharma","2 Sep","4 days late"],
  ["promise","Send the incident note","Falcon Pay","today 17:00","due today"],
  ["promise","Send the WhatsApp pricing sheet","Trellis Retail","Fri","on track"],
  ["mission","Qualify · rate decision","Kanchan Pharma","—","blocked on you"],
  ["mission","Protect revenue","Marigold Travel","—","draft held"],
  ["mission","Grow product · WhatsApp","Trellis Retail","—","open"],
  ["mission","Grow product · WhatsApp","Bluebird Fintech","—","waiting on them"],
  ["mission","Repair relationship","Falcon Pay","—","open"],
  ["mission","First value","Nova Foods","—","blocked on DLT"],
  ["mission","Solve issue · WhatsApp paused","Zippy Logistics","—","blocked on you"],
  ["mission","Qualify","Orbit Learning","—","clock running"]],
 act:"Deal with the late one first",
 st:["Rhea Menon","today 09:34","your accounts","fresh to 09:33"]};
ASK.teammine={q:"Open promises and missions across the team",big:"214",
 h:"Forty-one promises, 173 missions. Nine promises are late.",
 p:"Late promises are the one number I would watch. They are the difference between a team that is busy and a team that is trusted.",
 cols:["Owner","Late","Due this week","Missions","Blocked"],
 rows:[["Rhea Menon","1","2","8","3"],["Sana Qureshi","0","4","11","2"],
  ["Arjun Nair","4","1","19","7"],["Priya Sundaram","2","3","14","4"],
  ["Neha Kulkarni","1","2","9","1"],["unassigned","1","0","6","6"]],
 act:"Look at Arjun's four",
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
 y:'Your team approved them and the credits are already live. Nothing needs you — but <span class="l1">one</span> was above the usual staff limit and you can revert any of them.',
 a:"Look through them",solid:0,
 rev:[["Why you are seeing this","Monthly FYI. Approvals do not wait for a manager."],
  ["Total credit granted","₹1,85,000 across 34 accounts"],
  ["Worth a look","Lumen Tutors · 34 staff · ₹10,000 · approved by Arjun on 24 Aug"],
  ["Reverting","Takes the credit back, notifies the approver, and writes an audit event."]]});

/* Detail behind a Live or AI-log row. The rows stay scannable; this is what
   opens in the right-hand panel. Keyed by timestamp — Live and the AI log
   describe the same events, so they share one record. */
const LOGDET={
"09:14":{subj:"Marigold Travel",act:"Risk detected · recovery mail drafted",conf:.81,
 src:[["SMS −35% over 14 days","reports"],["No inbound reply in 22 days","gmail"],["3 outbound attempts","gmail"]],
 pol:"Partner · protect revenue · v4",
 out:"Drafted a recovery mail and held it. The last two drafts to this account were edited before sending, so this one waits for a person.",
 fyi:"Rhea Menon",next:"Nothing goes out until you release it."},
"09:11":{subj:"Zippy Logistics",act:"Two missions merged into one",conf:.88,
 src:[["Open protect-revenue mission","pulse"],["WhatsApp volume 0 since 14 Aug","reports"]],
 pol:"Inbound · one mission per story · v2",
 out:"Both signals described the same WhatsApp pause. The duplicate was suppressed so the owner sees one card, not two.",
 fyi:"",next:"The surviving mission keeps both evidence trails."},
"09:04":{subj:"Nova Foods",act:"Chased the DLT desk · ninth follow-up",conf:.95,
 src:[["Header NOVAFD pending 9 days","DLT desk"],["Zero messages sent since signup","reports"]],
 pol:"Startup · chase DLT daily · v3",
 out:"Escalated to the operator SPOC on day 7. I chase this every morning until the header clears.",
 fyi:"Rhea Menon",next:"Day 12 with no first message hands this to you."},
"08:59":{subj:"Aster Labs",act:"Answered a rate question",conf:.94,
 src:[["Question matched India rate card v7","billing"],["No margin exception required","billing"]],
 pol:"Inbound · standard rate replies · v7",
 out:"Sent from sana@msg91.com under her signature. Inside policy, so no approval was needed.",
 fyi:"Sana Qureshi",next:"If they push below the floor it comes back to a person."},
"08:52":{subj:"Trellis Retail",act:"Duplicate signup merged",conf:.91,
 src:[["Third signup from trellisretail.in","signup form"],["Different department, same domain","signup form"]],
 pol:"Inbound · never create a duplicate company · v2",
 out:"Attached to the existing company. A signup from a customer is a conversation, not a new lead — no sequence was started.",
 fyi:"",next:"Shows on the account as a new contact, not a new deal."},
"08:47":{subj:"14 new signups",act:"Scored every signup",conf:.9,
 src:[["Domain, company size, pages read, UTM","signup form"],["Stack detection","enrichment"]],
 pol:"Inbound · score within 60 seconds · v9",
 out:"One crossed the call threshold — Orbit Learning at 91. Four were suppressed below 40. Nine entered the nurture sequence.",
 fyi:"Rhea Menon",next:"The suppressed four are reviewable under Filtered."},
"08:40":{subj:"Vega Mobility",act:"Could not decide · escalated",conf:.42,
 src:[["SMS −28% over 30 days","reports"],["No reply in 31 days","gmail"],["No ticket, invoice paid","billing"]],
 pol:"Outbound · escalate below 0.60 · v5",
 out:"Three rules matched and disagreed on the cause of the drop. Rather than guess at a recovery play, I handed it to Arjun.",
 fyi:"Arjun Nair",next:"Waiting on Arjun. I will not act on this account meanwhile."},
"08:31":{subj:"Bluebird Fintech",act:"Set itself a follow-up timer",conf:.86,
 src:[["Quote sent 09:18 yesterday","pulse"],["No reply yet","gmail"]],
 pol:"Inbound · one nudge then hand back · v3",
 out:"If Marcus has not replied by Thursday I nudge once, then this comes back to you. I will not chase a quote twice.",
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
"07:51":{subj:"Kite Insurance",act:"Recovery complete · mission closed",conf:.93,
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
const PEOPLE=["Rhea Menon","Sana Qureshi","Arjun Nair","Priya Sundaram","Neha Kulkarni",
 "Vikas Menon","Farhan Ali","Ritu Shah","Nikhil Bansal","Vikram Rao"];
function MARK(n,sz){if(CUST[n]||BOOK.some(b=>b[1]===n))return LOGO(n,sz);
 if(PEOPLE.includes(n))return AVI(n,sz);return "";}

const S={v:"now",scope:"me",tab:"live",ask:"mine",from:null,cust:null,doneOpen:0,flightOpen:1,roomOpen:0,newRep:0,askTab:"ask",ostep:0,sel:new Set(),doneIds:new Set(),C:new Set(),M:new Set()};
const main=$("#main");

function lensLab(){const c=[...S.C],m=[...S.M];if(!c.length&&!m.length)return "All";
 const p=a=>a.length<=2?a.join(" + "):a[0]+" +"+(a.length-1);
 return [c.length?p(c):null,m.length?p(m):null].filter(Boolean).join(" · ");}
function vis(){const inS=CARDS.filter(x=>x.s===S.scope);
 if(S.scope==="me")return inS;
 return inS.filter(x=>{const[co,mo]=x.geo.split(" · ");
  return (!S.C.size||S.C.has(co))&&(!S.M.size||S.M.has(mo));});}

const ctlHTML=()=>`<div class="ctl">
 <div class="scope" role="tablist">
  ${["me","team","company"].map(k=>`<button role="tab" data-sc="${k}" aria-selected="${S.scope===k}">${
   {me:"Me",team:"Team",company:"Company"}[k]}</button>`).join("")}</div>
 <span class="gr"></span>
 <span class="lensw"><button class="lensb" id="lensb" data-on="${lensLab()!=="All"}">
   <span>${lensLab()}</span><span class="car">▼</span></button>
  <div class="lens" id="lensm" hidden>
   <h4>Country</h4>${["India","UAE","US","Singapore"].map(c=>
    `<label><span>${c}</span><input type="checkbox" data-c="${c}" ${S.C.has(c)?"checked":""}><span class="bx"></span></label>`).join("")}
   <h4>Motion</h4>${["Inbound","Outbound","Startup","Partner"].map(m=>
    `<label><span>${m}</span><input type="checkbox" data-m="${m}" ${S.M.has(m)?"checked":""}><span class="bx"></span></label>`).join("")}
   <button class="clr" id="lensc">Clear all</button></div></span></div>`;

function render(){
 main.className="wrap"+(S.v==="auto"||S.v==="ask"?" wide":"");
 $("#amenu").hidden=true;
 $$('.nav button').forEach(b=>b.setAttribute("aria-selected",String(b.dataset.nav===S.v)));
 ({now:vNow,ask:vAsk,auto:vAuto,cust:vCust,profile:vProfile})[S.v]();
 window.scrollTo({top:0});
}

function cardHTML(c,i){
 const clk=c.clock?`<span class="clock" data-clk="${c.clock}">—</span>`:"";
 const btn=c.a?`<button class="go${c.solid?" solid":""}" ${c.sheet?`data-sheet="${c.sheet}"`:`data-do="${i}"`}>${c.a} →</button>`:"";
 return `<article class="card" data-w="${c.w}" id="card-${i}">
  <div class="eb"><span class="dot"></span>${c.r}</div>
  <h2>${c.h}</h2><p class="why">${c.y}</p>
  <div class="row">${clk}${btn}
   <span class="meta"><span class="lnk mkrow" data-cust="${c.cust}">${MARK(c.cust,20)}${c.cust}</span><span>${c.geo}</span></span>
   <span class="qa">
    <button data-rev="${i}">Evidence</button><span class="div"></span>
    <button data-do="${i}">Done</button>
    <button data-snooze="${i}">Snooze</button>
    <button data-reassign="${i}">Reassign</button>
    <button data-wrong="${i}">Wrong</button></span></div>
  <div class="rev" id="rev-${i}" hidden><dl>${c.rev.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
   <div class="lg">Opened by Rhea Menon · 09:24 · logged</div></div>
  <div class="wrong" id="wr-${i}" hidden><p>What did I get wrong? This is the most useful thing you can tell me.</p>
   <div class="opts">${WRONG.map(w=>`<button data-wsel="${i}">${w}</button>`).join("")}</div></div>
  </article>`;
}

function vNow(){
 const cards=S.newRep?[]:vis().filter(c=>!S.doneIds.has(CARDS.indexOf(c))), n=cards.filter(c=>!c.w).length;
 const who=S.scope==="me"?"you":S.scope==="team"?"the team":"the company";
 const sl=(S.scope!=="me"&&lensLab()!=="All")?` <span class="sl">· ${lensLab()}</span>`:"";
 const g=GROWTH[S.scope];
 let body;
 if(S.newRep){
  body=`<h1>Welcome, Nikhil.</h1>
   <p class="why" style="margin-top:18px;max-width:52ch">Nothing needs you yet — you have no accounts. Four things are worth doing today, and the first one gives you something real to work on.</p>`;
 } else if(!cards.length){
  const el=CARDS.filter(c=>c.s===S.scope&&!c.w).length;
  const filtered=lensLab()!=="All"&&S.scope!=="me";
  body=`<h1>${filtered?`Nothing needs ${who}${sl}.`:"You are clear."}</h1>
   <div class="zero">${filtered?"":`<div class="tk2">✓</div>`}
   <p>${filtered?el+" things need "+who+" elsewhere.":"Forty-seven things happened today and none of the rest need you. When you have time, here is where I would look."}</p>
   ${filtered?`<button class="go" id="clrf" style="margin-top:16px">Clear the filter →</button>`:""}</div>`;
 } else {
  body=`<h1>${n} thing${n===1?"":"s"} need${n===1?"s":""} ${who}${sl}.</h1>
   <div class="stack">${cards.map(c=>cardHTML(c,CARDS.indexOf(c))).join("")}</div>`;
 }
 const nThem=FLIGHT.filter(f=>f[2]==="them").length,nUs=FLIGHT.filter(f=>f[2]==="us").length,
  nAI=FLIGHT.filter(f=>f[2]==="pulse").length,nOld=FLIGHT.filter(f=>f[4]).length;
 const flightSec=S.scope==="me"?`<section class="flight">
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
    <span class="age">${d}d</span></div>`).join(""):""}</section>`:"";
 const pins=PINNED[S.scope];
 const pinSec=(pins&&!S.newRep)?`<section class="pinned"><div class="lab">Pinned for ${
   S.scope==="team"?"the team":"everyone"} · computed 4 minutes ago</div>
  ${pins.map(([q,sub,v,note,sp,key])=>`<div class="prow2" data-q2="${key}">
   <div class="q2"><b>${q}</b><span>${sub}</span></div>
   ${sp?`<span class="spark2">${(()=>{const mx=Math.max(...sp),mn=Math.min(...sp);return sp.map(h=>`<i style="height:${Math.round(28+72*(h-mn)/(mx-mn||1))}%"></i>`).join("");})()}</span>`:""}
   <div class="v2">${v}<em class="${note.indexOf("▼")===0?"up":""}">${note}</em></div></div>`).join("")}
  <p class="pinnote">Every one of these is an answer someone pinned from Ask. Open one to see the question, the rows behind it and who pinned it.</p></section>`:"";
 const list=S.newRep?ROOM_NEW:ROOM;
 const auto=S.newRep||!cards.length;
 const roomSec=S.scope==="me"?`<section class="room${auto?" open":""}">
  <div class="lab">${auto?"Where I would look":`<button id="rtog" style="font-family:inherit;letter-spacing:inherit;color:var(--faint)">Room to grow · ${list.length} ${S.roomOpen?"▾":"▸"}</button>`}</div>
  ${auto||S.roomOpen?`${auto?`<p class="lead2">Ranked by what it is worth against what it costs you. Nothing here is urgent — that is the point.</p>`:""}
   ${list.map(([k,h2,p2,ev,cta])=>`<div class="opp">
    <div class="ok3"><span class="dot"></span>${k}</div><h3>${h2}</h3><p>${p2}</p>
    <div class="ev2">${ev}</div>
    <div class="row"><button class="go solid">${cta} →</button>
     <button class="go">Not now</button></div></div>`).join("")}`:""}</section>`:"";
 const dlist=S.scope==="me"?DONE:S.scope==="team"?DONE_T:DONE_C;
 const dn=dlist.length+S.doneIds.size;
 const doneSec=(!S.newRep)?`<section class="done">
  <div class="lab"><button id="dtog" style="font-family:inherit;letter-spacing:inherit;color:var(--faint)">
   Done today · ${dn} ${S.doneOpen?"▾":"▸"}</button></div>
  ${S.doneOpen?[...S.doneIds].map(i=>`<div class="drow"><span class="tk">✓</span>
    <b>${CARDS[i].h.replace(/\.$/,"")}</b><i>just now</i>
    <button class="un" data-undo="${i}">Undo</button></div>`).join("")
   +dlist.map(([t,a,b2])=>`<div class="drow"><span class="tk">✓</span><b>${a}</b><i>${b2}</i>
    <time>${t}</time></div>`).join(""):""}</section>`:"";
 const wallTotal=(window.PulseLive&&PulseLive.state.counts&&PulseLive.state.counts.accounts)||0;
 const wallMore=window.PulseLive&&PulseLive.state.wallNext!=null;
 const wall=(S.scope!=="company"&&!S.newRep)?`<section class="wall"><div class="lab">${
   wallTotal?`Accounts · showing ${BOOK.length.toLocaleString("en-IN")} of ${wallTotal.toLocaleString("en-IN")}`
    :(S.scope==="me"?"Your accounts · 18":"Team accounts · showing 18 of 486")}</div>
  <div class="logos">${BOOK.map(([mo,nm,co,mt,st,hot])=>
   `<span data-cust="${nm}" data-tip="${nm}||${co} · ${mt} — ${st}">${LOGO(nm,40)}</span>`).join("")}</div>
  ${wallMore?`<div class="row" style="margin-top:14px"><button class="go" id="morewall">Load 40 more →</button></div>`:""}</section>`:"";
 const stand=S.scope==="team"?`<div class="stand"><div class="lab">Standings · all 25 · everyone sees this</div>
  ${STANDINGS.map(([nm,ini,sc,dl,d,me],i)=>`<div class="srow" data-me="${me}">
   <span class="rk">${i+1}</span><span class="nm mkrow">${AVI(nm,24)}${nm}${me?"<em>you</em>":""}</span>
   <span class="bar"><i style="width:${sc}%"></i></span>
   <span class="sc2">${sc}</span><span class="dl" data-d="${d}">${dl}</span></div>`).join("")}
  <div class="srow" style="border:none;color:var(--faint)"><span class="rk"></span>
   <span class="nm" style="font-weight:400;font-size:13px">17 more · median 74</span></div></div>`:"";
 const ban=(!ME.gmail&&S.scope==="me")?`<div class="banner"><span class="sd" style="width:8px;height:8px;border-radius:50%;background:var(--watch);margin-top:7px;flex:none"></span>
  <div class="bt"><b>I cannot see your conversations.</b>
  <span>Your mailbox is not connected, so for all 18 of your companies I am guessing at silence and I cannot draft anything in your voice. Six days like this and it becomes a card in your manager's view.</span></div>
  <button class="go solid" data-nav="profile">Connect it →</button></div>`:"";
 main.innerHTML=ctlHTML()+ban+
  `<p class="greet">${S.scope==="me"?"Friday, 6 September":S.scope==="team"?"Sales · 25 people":"MSG91 · all teams"}</p>`+
  body+(S.newRep?"":flightSec+doneSec)+roomSec+pinSec+
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
   <button data-atab="asked" aria-selected="${S.askTab==="asked"}">Asked · ${HISTORY.length}</button></div>`;
 if(S.askTab==="asked"){
  const sorted=HISTORY.slice().sort((x,y)=>(y[0]-x[0]));
  main.innerHTML=tabs+`<p class="lede" style="margin:24px 0 18px;font-size:14px;color:var(--muted);max-width:60ch">
    Pinned questions stay. Everything else fades after thirty days of nobody asking it, so this list stays short on its own.</p>
   ${sorted.map(([pin,q,meta,k])=>`<div class="lrow" data-q="${k}" style="cursor:pointer">
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
   <button class="go" style="padding:5px 13px;font-size:13px">Recompute</button>
   ${sel.size?`<span style="color:var(--br)">${sel.size} selected</span>
    <button class="go solid" style="padding:5px 13px;font-size:13px">Reassign ${sel.size} →</button>
    <button class="go" style="padding:5px 13px;font-size:13px">Create missions</button>`:
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
  <div class="row">${a.cols||!a.act?"":`<button class="go solid">${a.act} →</button>`}
   <button class="go" id="pinq">${isPinned?"★ Pinned · unpin":"Pin this answer…"}</button>
   <button class="go">Share</button></div>
  <div class="stamp">${a.st.map(x=>`<span>${x}</span>`).join("")}</div></div>`;
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
  return `<div class="item"${rowAttr}><time>${tm}</time>
  <div class="bd"><b>${a}</b><span>${b}</span></div>
  <span class="tg" data-t="${k}" data-tip="${TIP[tag][0]}||${TIP[tag][1]}">${tag}</span>
  ${hasd?`<span class="chev">→</span>`:""}</div>`;}).join("")}</div>`;
 let body="";
 if(S.tab==="connections"){
  body=`<p style="margin:26px 0 0;color:var(--ink2);max-width:62ch">Everything AI can do depends on this list.
   Where a dot is amber, something is switched off and I have said what it costs you.</p>
   <div style="margin-top:20px">${CONN.map(([n,st,who,unlocks,breaks,act])=>`<div class="conn" data-st="${st}">
    <span class="sd"></span><div class="cb"><b>${n}</b><span class="un">${who}</span>
     <span class="un" style="color:var(--ink2);margin-top:5px">${unlocks}</span>
     ${breaks?`<span class="br">${breaks}</span>`:""}</div>
    ${act?`<button class="act2">${act}</button>`:`<span class="rt2">${st==="on"?"LIVE":"PARTIAL"}</span>`}</div>`).join("")}</div>`;
 } else if(S.tab==="rules"){
  body=`<div class="manifest">
   <div class="mcol" data-k="yes"><h4>What I am allowed to do without asking · ${MANIFEST.yes.length}</h4>
    <ul>${MANIFEST.yes.map(x=>`<li>${x}</li>`).join("")}</ul></div>
   <div class="mcol" data-k="no"><h4>What always needs a person · ${MANIFEST.no.length}</h4>
    <ul>${MANIFEST.no.map(x=>`<li>${x}</li>`).join("")}</ul></div></div>
   <div class="lab" style="margin:34px 0 0">The rules behind that, by motion</div>
   <div class="mo4">${t.mo.map(([n,s,rs])=>`<div class="mo"><h4>${n}</h4><p class="sb">${s}</p>
   ${rs.map(([k,r])=>`<div class="ru" data-rule="${r.replace(/"/g,"&quot;")}">
     <em data-k="${k}" data-tip="${TIP[k][0]}||${TIP[k][1]}">${k}</em><span>${r}</span>
     <span class="pen">edit</span></div>`).join("")}
    <button class="add" style="font-size:13px;color:var(--br);padding:9px 0 0;border-top:1px solid var(--line);width:100%" data-newrule="${n}">＋ Add a rule to ${n}</button></div>`).join("")}</div>
   ${t.pr.map(([h,p,a,b])=>`<div class="prop"><h4>${h}</h4><p>${p}</p>
    <div class="row" style="margin-top:0"><button class="go solid">${a} →</button><button class="go">${b}</button></div></div>`).join("")}`;
 } else {
  /* Both log tabs page the same way. Anything with more behind it gets a
     button; anything that fits does not. */
  const moreId=S.tab==="audit"&&window.PulseLive&&PulseLive.state.auditNext!=null?"moreaudit"
   :S.tab==="filtered"&&window.PulseLive&&PulseLive.state.filteredNext!=null?"morefiltered":"";
  body=feed(t.f)+(moreId?`<div class="row" style="margin-top:16px"><button class="go" id="${moreId}">Load ${
   moreId==="moreaudit"?25:20} more →</button></div>`:"");
 }
 main.innerHTML=`<p class="greet" style="margin-top:34px">Autopilot</p>
  <h1>1,842 signals handled this month.</h1>
  <div class="tabs">${Object.keys(AUTO).map(k=>`<button data-tab="${k}" aria-selected="${k===S.tab}"
   data-tip="${TABTIP[k][0]}||${TABTIP[k][1]}">${
   {live:"Live",rules:"Rules",connections:"Connections",ailog:"AI log",audit:"Audit log",filtered:"Filtered"}[k]}</button>`).join("")}</div>
  ${t.sys?`<div class="sys"><div class="eb"><span class="dot"></span>${t.sys[0]}</div>
   <h4>${t.sys[1]}</h4><p>${t.sys[2]}</p>
   <div class="row"><button class="go solid">Review →</button><button class="go">Mark expected</button></div></div>`:""}
  ${body}`;
}

function vProfile(){
 const g=ME.gmail, c=ME.cal;
 main.innerHTML=`<button class="back" data-nav="now" style="font-size:13.5px;color:var(--muted);margin:26px 0 0;display:inline-block">← Back</button>
 <div class="phead2">${AVI(ME.name||"Rhea Menon",56)}
  <div><h1>${ME.name||"Rhea Menon"}</h1><span class="m2">${
   ME.name?[ME.email_addr,ME.accounts!=null?`${ME.accounts.toLocaleString("en-IN")} accounts`:""].filter(Boolean).join(" · ")
    :"Sales · India, Singapore · 18 companies · joined Mar 2024"}</span></div></div>
 <div class="sec"><h5>Your connections</h5>
  <div class="cxn" data-on="${g}"><span class="ico">M</span><div class="cx">
   <b>Your mailbox ${g?'<span class="ok2">CONNECTED</span>':'<span class="no2">NOT CONNECTED</span>'}</b>
   <p>${g?`${ME.email_addr||"rhea@msg91.com"} · connected 12 Mar 2024`:"Pulse cannot see your conversations. Silence detection, promise extraction and drafting in your voice are all switched off for your 18 companies."}</p>
   <div class="sc3">READ ONLY · CUSTOMER THREADS ONLY · NEVER PERSONAL MAIL<br>YOU CAN DISCONNECT AT ANY TIME AND I FORGET WITHIN 24 HOURS</div></div>
   <button class="go ${g?"":"solid"} cta" data-toggle="gmail">${g?"Disconnect":"Connect Google"}</button></div>
  <div class="cxn" data-on="${c}"><span class="ico">C</span><div class="cx">
   <b>Your calendar ${c?'<span class="ok2">CONNECTED</span>':'<span class="no2">NOT CONNECTED</span>'}</b>
   <p>${c?`${ME.email_addr||"rhea@msg91.com"} · meeting prep and post-meeting capture are on`:"No meeting prep, no post-meeting capture."}</p>
   <div class="sc3">TITLES, TIMES AND ATTENDEES OF CUSTOMER MEETINGS ONLY</div></div>
   <button class="go ${c?"":"solid"} cta" data-toggle="cal">${c?"Disconnect":"Connect Google"}</button></div>
  <div class="cxn" data-on="1"><span class="ico">W</span><div class="cx">
   <b>Your WhatsApp Business number <span class="ok2">+91 90000 00012</span></b>
   <p>Yours alone, provisioned by MSG91. Customers reply to you on it and every thread is visible to Pulse, which is why silence detection works on WhatsApp at all. Use this instead of your personal number.</p>
   <div class="sc3">SENDER IDS MSG91P AND MSGIND ARE SHARED ACROSS THE COMPANY AND MANAGED BY AN ADMIN</div></div>
   <button class="go cta" data-nav="auto" data-tab2="connections">See it</button></div></div>
 <div class="sec"><h5>How you write</h5>
  <div class="voice"><p style="margin:0;font-size:13.5px;color:var(--ink2)">Learned from your last 20 sent mails on 12 Mar, refreshed weekly.</p>
   <div class="vt">${VOICE.map(v=>`<span>${v}</span>`).join("")}</div>
   <blockquote>“Rashid — yesterday was on us. The Etisalat route failed at 3:02 and we moved you across twelve minutes later. Here is what we are changing so it does not happen again.”</blockquote>
   <div class="row" style="margin-top:14px"><button class="go">Relearn from recent mail</button>
    <button class="go">Something is wrong here</button></div></div></div>
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
    ${d.owner?`<span class="ownerchip">${AVI(d.owner,20)} ${d.owner}</span>`
     :`<span class="ownerchip" style="color:var(--watch)">No owner</span>`}</span></div></div>
  <p class="verdict">${d.v}</p><p class="why">${d.s}</p>
  <div class="row"><button class="go solid" data-sheet="log">Log what happened →</button>
   <button class="go">Open the thread</button>
   <button class="go" data-reassign2="${n}">Reassign</button></div>

  <div class="sec"><h5>Open on this account · ${op.length}</h5>
   ${op.map(([k,t,w,st])=>`<div class="oi"><span class="k2" data-t="${k}">${k}</span>
     <span class="d2">${t}<em>${w}</em></span><time>${st}</time></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Pulse keeps this list. Nothing here was typed by hand — log a call and it updates itself.</p></div>

  <div class="sec"><h5>Tags</h5>
   <div class="tags">${tg.map(([t,ai])=>`<span class="tag2" data-ai="${ai}">${t}
     <button class="x2" data-untag="${t}">✕</button></span>`).join("")}
    <button class="addtag" data-addtag>＋ Add a tag</button></div>
   <p style="font-size:12.5px;color:var(--faint);margin-top:11px">Dashed tags were added by Pulse from evidence, solid ones are yours, and both are filterable in Ask. Motion is not a tag — it is the single field above that decides which rules run, and an account has exactly one.</p></div>

  <div class="sec"><h5>People</h5>${d.pe.map(([a,r,rl])=>
   `<div class="pr" data-person="${a}" style="cursor:pointer"><b class="mkrow">${AVI(a,24)}${a}</b><span class="rl">${rl}</span><i>${r}</i></div>`).join("")}
   ${d.__peNext!=null?`<div class="row" style="margin-top:12px"><button class="go" id="morepeople">Load 10 more →</button></div>`:""}
   <button class="addtag" style="margin-top:12px;border-color:var(--line2);color:var(--br)" data-sheet="log">＋ Add a person</button></div>
  <div class="sec"><h5>Products</h5>${d.la.map(([pp,st,x])=>
   `<div class="ln"><span class="cp">${pp}</span><span class="st" data-s="${st}">${st}</span><i>${x}</i></div>`).join("")}</div>
  <div class="sec"><h5>Recently</h5>${d.ev.map(([t,e])=>`<div class="ev"><time>${t}</time><span>${e}</span></div>`).join("")}
   ${d.__evNext!=null?`<div class="row" style="margin-top:12px"><button class="go" id="morerecent">Load 10 more →</button></div>`:""}</div>
  <div class="sec"><h5>Commercial</h5>
   <div class="hid"><button class="hb" id="revm" data-tip="Level 2||Payments, wallet and rates are hidden by default. Opening them writes an audit event against your name.">Show payments and rates</button></div>
   <div class="money" id="moneyb" hidden>${d.money.map(([b2,s2,x])=>
    `<div><b>${b2}</b><span>${s2}${x?" · "+x:""}</span></div>`).join("")}</div></div></div>`;
}

function vPartner(){
 const pt=PARTNERS.find(x=>x[0]===S.partner)||PARTNERS[0];
 const accts=[["Falcon Pay","OTP AED 128,000","growing"],["Dune Logistics","WHATSAPP AED 25,000","growing"],
  ["Harbour Freight","SMS AED 61,000","active"]];
 main.innerHTML=`<div class="cpg"><button class="back" data-q="partners">← Back to partners</button>
  <div class="chead">${LOGO(pt[0],52)}<div><h1>${pt[0]}</h1>
   <span class="m">${pt[2]} · reseller · ${pt[3]} accounts sourced</span></div></div>
  <p class="verdict">${pt[4]} received this month across ${pt[3]} accounts.</p>
  <p class="why">Native currency, never converted. Their accounts reach first value faster than our own inbound.</p>
  <div class="sec"><h5>Revenue by service</h5>
   ${pt[5].map(x=>`<div class="ln"><span class="cp">${x.split(" ")[0]}</span>
    <span class="st"></span><i>${x.split(" ").slice(1).join(" ")}</i></div>`).join("")}</div>
  <div class="sec"><h5>Accounts they brought · ${pt[3]}</h5>
   ${accts.map(([a,rev,st])=>`<div class="lrow" data-cust="${a}" style="cursor:pointer">
    <span class="nm2">${LOGO(a,24)}${a}</span><span class="ds">${rev}</span>
    <span class="rt3">${st.toUpperCase()}</span></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Showing 3 of ${pt[3]}. Every account here is co-owned — no price conversation happens without them on the thread.</p></div>
  <div class="row" style="margin-top:26px"><button class="go solid">Send this month's digest →</button>
   <button class="go">Partner contacts</button></div></div>`;
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
 {g:"People",ic:AVI("Kavita Rao",25),t:"Kavita Rao",s:"Trellis Retail · marketing · asked about WhatsApp",rt:"↵",run:()=>{S.cust="Trellis Retail";S.v="cust";render();}},
 {g:"People",ic:AVI("Meera Joshi",25),t:"Dr. Meera Joshi",s:"Kanchan Pharma · decision maker · waiting on a rate",rt:"↵",run:()=>{S.cust="Kanchan Pharma";S.v="cust";render();}},
 {g:"People",ic:AVI("Rashid Al Mansoori",25),t:"Rashid Al Mansoori",s:"Falcon Pay · decision maker · UAE",rt:"↵",run:()=>{S.cust="Falcon Pay";S.v="cust";render();}},
 {g:"People",ic:AVI("Imran Shaikh",25),t:"Imran Shaikh",s:"Trellis Retail · technical owner",rt:"↵",run:()=>{S.cust="Trellis Retail";S.v="cust";render();}},
 {g:"Ask Pulse",ic:"?",t:"Who is most likely to churn this month?",s:"4 — Marigold, Zippy, Vega, Nova",rt:"↵",run:()=>{S.ask="churn";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Partner motion, this month",s:"Saved · ₹64.2L across four entities",rt:"saved",run:()=>{S.ask="partner";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"UAE entity, this quarter",s:"Saved · AED 402k · 11 unowned",rt:"saved",run:()=>{S.ask="uae";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"What is in flight?",s:"7 — 3 with them, 2 blocked here, 2 with Pulse",rt:"↵",run:()=>{S.ask="flight";S.sel=new Set();S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Whose accounts are flat?",s:"2 — Arjun 61 days, Priya 34 days",rt:"↵",run:()=>{S.ask="flat";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Which startups are stuck before first message?",s:"3, all on the same DLT queue",rt:"↵",run:()=>{S.ask="stuck";S.v="ask";render();}},
 {g:"Go to",ic:"◆",t:"Autopilot · Live",s:"What AI is doing right now",rt:"",run:()=>{S.tab="live";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Autopilot · Rules",s:"Four motions, four sets of rules",rt:"",run:()=>{S.tab="rules";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Connections",s:"What Pulse can reach · 2 not connected",rt:"",run:()=>{S.tab="connections";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Audit log",s:"What people viewed, revealed and changed",rt:"",run:()=>{S.tab="audit";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Filtered signups",s:"What AI suppressed, and why",rt:"",run:()=>{S.tab="filtered";S.v="auto";render();}},
 {g:"Go to",ic:"◆",t:"Your profile and connections",s:"Your mailbox, your calendar, how you write",rt:"",run:()=>{S.v="profile";render();}},
 {g:"Go to",ic:"◆",t:"Preview: a new teammate on day one",s:"What Nikhil sees with no accounts yet",rt:"",run:()=>{S.newRep=1;S.v="now";render();}},
 {g:"Go to",ic:"◆",t:"Back to the normal view",s:"Leave the new-teammate preview",rt:"",run:()=>{S.newRep=0;S.v="now";render();}},
 {g:"Do",ic:"+",t:"Add a company",s:"Prospect, partner referral or outbound target",rt:"⌘N"},
 {g:"Do",ic:"+",t:"Add accounts in bulk",s:"Paste a list or drop a CSV from an event",rt:"",run:()=>openSheet("bulk")},
 {g:"Do",ic:"✎",t:"Log a call or a meeting",s:"Write or talk — I turn it into the right work",rt:"",run:()=>openSheet("log")},
 {g:"Ask Pulse",ic:"?",t:"My open promises and missions",s:"Pinned · 11 open, 1 late",rt:"saved",run:()=>{S.ask="mine";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Open promises and missions across the team",s:"214 open, 9 late",rt:"↵",run:()=>{S.ask="teammine";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Every account my team is handling",s:"Pinned · 486 accounts, 46 unassigned",rt:"saved",run:()=>{S.ask="teamall";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Ask Pulse",ic:"?",t:"Revenue by partner this month",s:"Pinned · five partners, native currency",rt:"saved",run:()=>{S.ask="partners";S.sel=new Set();S.askTab="ask";S.v="ask";render();}},
 {g:"Do",ic:"→",t:"Reassign accounts",s:"46 accounts unowned since Vikram left",rt:""},
 {g:"Do",ic:"■",t:"Pause all automatic sending",s:"Global stop. Nothing goes out until you resume.",rt:""}];
let pS=0,pR=[];
/* Open a company page from anywhere, the same way a [data-cust] click does. */
function openCompany(name){
 S.from={v:S.v,scope:S.scope,ask:S.ask,tab:S.tab,label:
  S.v==="ask"?"Ask · "+ASK[S.ask].q:S.v==="auto"?"Autopilot":
  S.scope==="me"?"Now · your work":S.scope==="team"?"Now · the team":"Now · the company"};
 S.cust=name;S.v="cust";render();
 if(window.PulseLive&&window.PulseLive.loadAccount)
  window.PulseLive.loadAccount(name,PULSE_BAG,render);}

const askRow=(q)=>({g:"Ask Pulse",ic:"?",t:q,s:"Ask Pulse this question",rt:"↵",
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

let pQ="",pLimit=12;
function pF(q){const raw=q.trim();if(raw!==pQ)pLimit=12;pQ=raw;q=raw.toLowerCase();
 pR=q?PAL.filter(r=>(r.t+" "+r.s+" "+r.g).toLowerCase().includes(q)):PAL.slice(0,9);
 if(q)pR=pR.concat(askRow(raw));
 pS=0;pD();
 /* Real accounts come from the database, not the sample list, so the palette
    can find any of the ten thousand companies rather than the eighteen the
    prototype shipped with. Two characters is the server's own minimum. */
 if(q.length>=2&&window.PulseLive&&window.PulseLive.searchCompanies){
  window.PulseLive.searchCompanies(raw,PULSE_BAG,pLimit).then(rows=>{
   if(!rows||pQ!==raw)return;
   const live=rows.map(a=>({g:"Companies",ic:LOGO(a.name,26),t:a.name,
    s:[a.entity,a.motion,a.line].filter(Boolean).join(" · "),
    rt:a.owner?"":"NO OWNER",run:()=>openCompany(a.name)}));
   const more=window.PulseLive.state.searchMore
    ?[{g:"Companies",ic:"⋯",t:`Show more matches for "${raw}"`,s:`Showing ${live.length}`,rt:"",
       run:()=>{pLimit+=25;pF(pQ);}}]:[];
   pR=live.concat(more,PAL.filter(r=>(r.t+" "+r.s+" "+r.g).toLowerCase().includes(q)),askRow(raw));
   pD();});}}
function pD(){let o="",l="";pR.forEach((r,i)=>{if(r.g!==l){o+=`<div class="pg">${r.g}</div>`;l=r.g;}
 o+=`<button class="prw" data-p="${i}" aria-selected="${i===pS}">${(""+r.ic).startsWith("<")?r.ic:`<span class="ic">${r.ic}</span>`}
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

/* events */
document.addEventListener("click",e=>{
 const t=e.target;
 if(t.closest("[data-pal]")){pO();return;}
 const p=t.closest("[data-p]");if(p){pS=+p.dataset.p;pRun();return;}
 if(t===$("#pal")){pC();return;}
 if(t.closest("[data-crumb]")){const f=S.from;if(f){S.v=f.v;S.scope=f.scope;S.ask=f.ask;S.tab=f.tab;}
  else S.v="now";render();return;}
 const nv=t.closest("[data-nav]");if(nv){S.v=nv.dataset.nav;render();return;}
 const sc=t.closest("[data-sc]");if(sc){S.scope=sc.dataset.sc;render();return;}
 const cu=t.closest("[data-cust]");
 if(cu&&CUST[cu.dataset.cust]){$("#pk").hidden=true;
  S.from={v:S.v,scope:S.scope,ask:S.ask,tab:S.tab,label:
   S.v==="ask"?"Ask · "+ASK[S.ask].q:S.v==="auto"?"Autopilot":
   S.scope==="me"?"Now · your work":S.scope==="team"?"Now · the team":"Now · the company"};
  S.cust=cu.dataset.cust;S.v="cust";render();return;}
 if(t.closest("#lensb")){const m=$("#lensm");m.hidden=!m.hidden;return;}
 if(t.closest("#lensc")||t.closest("#clrf")){S.C.clear();S.M.clear();render();return;}
 const mn=t.closest("[data-menu]");
 if(mn){const id=mn.dataset.menu,m=$("#menu-"+id);const was=m.hidden;
  $$(".menu").forEach(x=>x.hidden=true);m.hidden=!was;return;}
 const rv=t.closest("[data-rev]");if(rv){const b=$("#rev-"+rv.dataset.rev);b.hidden=!b.hidden;
  $$(".menu").forEach(x=>x.hidden=true);return;}
 const dd=t.closest("[data-do]");if(dd){S.doneIds.add(+dd.dataset.do);S.doneOpen=1;render();return;}
 const sn=t.closest("[data-snooze]");if(sn){S.doneIds.add(+sn.dataset.snooze);render();return;}
 const un=t.closest("[data-undo]");if(un){S.doneIds.delete(+un.dataset.undo);render();return;}
 if(t.closest("#dtog")){S.doneOpen=S.doneOpen?0:1;render();return;}
 if(t.closest("#ftog")){S.flightOpen=S.flightOpen?0:1;render();return;}
 if(t.closest("#rtog")){S.roomOpen=S.roomOpen?0:1;render();return;}
 const wr=t.closest("[data-wrong]");if(wr){$$(".menu").forEach(x=>x.hidden=true);
  const w=$("#wr-"+wr.dataset.wrong);w.hidden=!w.hidden;return;}
 const ws=t.closest("[data-wsel]");if(ws){S.doneIds.add(+ws.dataset.wsel);render();return;}
 const nr=t.closest("[data-newrule]");if(nr){openRule("New rule · "+nr.dataset.newrule,1);return;}
 const rl=t.closest("[data-rule]");if(rl){openRule(rl.dataset.rule);return;}
 if(t.closest("#rtest")){$("#tres").hidden=false;return;}
 const ra=t.closest("[data-reassign]");if(ra){$$(".menu").forEach(x=>x.hidden=true);
  openReassign(CARDS[+ra.dataset.reassign].cust,1);return;}
 if(t.closest("#ovx")||t===$("#ov")){$("#ov").hidden=true;return;}
 const rpick=t.closest("[data-rep]");if(rpick){$$("[data-rep]").forEach(x=>
   x.setAttribute("aria-selected",String(x===rpick)));return;}
 if(t.closest("#ovdo")){$("#ov").hidden=true;return;}
 const q2=t.closest("[data-q2]");if(q2){openPanel("answer",q2.dataset.q2);return;}
 const lg=t.closest("[data-log]");if(lg){openPanel("decision",lg.dataset.log);return;}
 const rd=t.closest("[data-row-detail]");
 if(rd){openPanel("rowdetail",JSON.parse(decodeURIComponent(rd.dataset.rowDetail)));return;}
 const at=t.closest("[data-atab]");if(at){S.askTab=at.dataset.atab;render();return;}
 const hq=t.closest(".hrow");if(hq){S.ask=hq.dataset.q;S.sel=new Set();render();return;}
 if(t.closest("#morewall")){
  if(window.PulseLive)window.PulseLive.loadMoreAccounts(PULSE_BAG,render);return;}
 if(t.closest("#morepeople")){
  if(window.PulseLive)window.PulseLive.loadMoreAccountFeed("people",PULSE_BAG,render);return;}
 if(t.closest("#morerecent")){
  if(window.PulseLive)window.PulseLive.loadMoreAccountFeed("recently",PULSE_BAG,render);return;}
 if(t.closest("#morefiltered")){
  if(window.PulseLive)window.PulseLive.loadMoreFiltered(PULSE_BAG,render);return;}
 if(t.closest("#moreaudit")){
  if(window.PulseLive)window.PulseLive.loadMoreAudit(PULSE_BAG,render);return;}
 if(t.closest("#pinq")){togglePin();return;}
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
 const tb=t.closest("[data-tab]");if(tb){S.tab=tb.dataset.tab;render();return;}
 if(t.closest("#revm")){const m=$("#moneyb");m.hidden=!m.hidden;
  $("#revm").textContent=m.hidden?"Show payments and rates":"Hide payments and rates";return;}
 if(!t.closest(".lensw")){const m=$("#lensm");if(m)m.hidden=true;}
});
document.addEventListener("change",e=>{
 const rw=e.target.closest("[data-row]");
 if(rw){const n=+rw.dataset.row;rw.checked?S.sel.add(n):S.sel.delete(n);render();return;}
 const i=e.target.closest("#lensm input");if(!i)return;
 const set=i.dataset.c?S.C:S.M,v=i.dataset.c||i.dataset.m;
 i.checked?set.add(v):set.delete(v);render();
 const m=$("#lensm");if(m)m.hidden=false;});
$("#pq").addEventListener("input",e=>pF(e.target.value));
document.addEventListener("keydown",e=>{
 const open=!$("#pal").hidden;
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();open?pC():pO();return;}
 if(open){if(e.key==="Escape")pC();
  if(e.key==="ArrowDown"){e.preventDefault();pS=Math.min(pS+1,pR.length-1);pD();}
  if(e.key==="ArrowUp"){e.preventDefault();pS=Math.max(pS-1,0);pD();}
  if(e.key==="Enter"){e.preventDefault();pRun();}return;}
 if(e.key==="Escape"&&S.v==="cust"){S.v="now";render();}});

function drawOnb(){
 const i=S.ostep,[st,h,p2,kind]=ONB[i];
 $("#osteps").innerHTML=ONB.map((_,n)=>`<i data-on="${n===i?1:0}" data-done="${n<i?1:0}"></i>`).join("");
 let extra="",cta="Continue",skip=1;
 if(kind==="connect"){extra=`<div class="cxn" data-on="0"><span class="ico">G</span><div class="cx">
   <b>Google · mail and calendar</b><p>rhea@msg91.com</p>
   <div class="sc3">READ ONLY · CUSTOMER THREADS ONLY · NEVER PERSONAL MAIL<br>
    I NEVER SEND FROM YOUR ADDRESS WITHOUT YOU PRESSING SEND<br>
    DISCONNECT WHENEVER YOU LIKE — I FORGET WITHIN 24 HOURS</div></div></div>
   <div class="cxn" data-on="1"><span class="ico">W</span><div class="cx">
    <b>Your WhatsApp Business number <span class="ok2">+91 90000 00012</span></b>
    <p>Already provisioned. Save it now and stop giving out your personal number — every thread on this one is visible to Pulse.</p></div></div>`;
  cta="Connect Google →";}
 if(kind==="book"){const keep=BOOK.filter(b=>!ONBSTATE.dropped.has(b[1]));
  extra=`<div style="border-top:1px solid var(--line)">${keep.map(b=>`<div class="lrow">
    <span class="nm2">${LOGO(b[1],24)}${b[1]}</span>
    <span class="ds">${b[2]} · ${b[3]}</span>
    <button class="skip" data-drop="${b[1]}">Not mine</button></div>`).join("")}</div>
   <div class="row2" style="margin-top:16px">
    <button class="go">＋ Add an account I own</button>
    <span style="font-size:13px;color:var(--faint)">${keep.length} of 18 · nine came across when Vikram left${
     ONBSTATE.dropped.size?` · ${ONBSTATE.dropped.size} removed`:""}</span></div>`;
  cta="Save and continue →";skip=0;}
 if(kind==="voice"){extra=`<div class="voice">
   <div class="vt">${ONBSTATE.traits.map(v=>`<span>${v} <button data-untrait="${v}" style="color:var(--faint);margin-left:4px">✕</button></span>`).join("")}
    <button class="chip" data-addtrait>＋ Add how you write</button></div>
   <blockquote>“Rashid — yesterday was on us. The Etisalat route failed at 3:02 and we moved you across twelve minutes later.”</blockquote>
   <div class="row" style="margin-top:14px"><button class="go">Show me another example</button>
    <button class="go">Learn again from more mail</button></div></div>`;
  cta="That is me →";skip=0;}
 if(kind==="done"){skip=0;cta="Show me →";}
 $("#oc").innerHTML=`<div class="st2">${st}</div><h2>${h}</h2><p class="lead">${p2}</p>${extra}
  <div class="row2"><button class="go solid" id="onext">${cta}</button>
   ${i>0?`<button class="skip" id="oback">Back</button>`:""}
   ${skip?`<button class="skip" id="oskip">I will do this later</button>`:""}</div>`;
}
function openOnb(){S.ostep=0;$("#onb").hidden=false;drawOnb();}

document.addEventListener("click",e=>{
 const t=e.target;
 if(t.closest("#abtn")){const m=$("#amenu");m.hidden=!m.hidden;return;}
 if(!t.closest(".whow"))$("#amenu").hidden=true;
 if(t.closest("#startonb")){$("#amenu").hidden=true;openOnb();return;}
 if(t.closest("#onbx")){$("#onb").hidden=true;return;}
 if(t.closest("#oskip")){ME.gmail=0;ME.cal=0;S.ostep++;drawOnb();return;}
 if(t.closest("#oback")){S.ostep=Math.max(0,S.ostep-1);drawOnb();return;}
 const dp=t.closest("[data-drop]");if(dp){ONBSTATE.dropped.add(dp.dataset.drop);drawOnb();return;}
 const ut=t.closest("[data-untrait]");if(ut){
  ONBSTATE.traits=ONBSTATE.traits.filter(x=>x!==ut.dataset.untrait);drawOnb();return;}
 if(t.closest("[data-addtrait]")){ONBSTATE.traits.push("Uses the customer's first name only");drawOnb();return;}
 if(t.closest("#onext")){
  if(ONB[S.ostep][3]==="connect"){ME.gmail=1;ME.cal=1;}
  S.ostep++;
  if(S.ostep>=ONB.length){$("#onb").hidden=true;S.v="now";render();return;}
  drawOnb();return;}
 const tg=t.closest("[data-toggle]");
 if(tg){const k=tg.dataset.toggle;ME[k]=ME[k]?0:1;
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
    .map(([a,b2])=>`<div class="rp"><span class="av2">→</span><span class="tx2"><b>${a}</b><span>${b2}</span></span></div>`).join("")}
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
 who:"Rhea, Sana, Arjun · 312 accounts",
 ver:"v8 · changed by Priya Sundaram today 08:58 · 7 earlier versions"};

function openRule(title,kind){
 const d=RULEDEF;
 $("#ovb").innerHTML=`<div class="red">
  <h3>${title}</h3><p class="sub">Plain language on purpose — if you cannot read a rule aloud, it is too complicated to trust.</p>
  <h4>When</h4>
  <div class="cl2"><span class="fld">${d.when} <span class="car">▼</span></span></div>
  <h4>If all of these are true</h4>
  ${d.ifs.map(([f,o,v],i)=>`<div class="cl2"><span class="fld">${f} <span class="car">▼</span></span>
   <span class="fld">${o} <span class="car">▼</span></span>
   <button class="val">${v}</button><span class="gr2"></span>
   <button class="rm" data-rmif="${i}">Remove</button></div>`).join("")}
  <button class="add">＋ Add a condition</button>
  <h4>Then</h4>
  ${d.thens.map(([k,a,v],i)=>`<div class="cl2"><span class="kind" data-k="${k}">${k}</span>
   <span class="fld">${a} <span class="car">▼</span></span>
   ${v?`<button class="val">${v}</button>`:""}<span class="gr2"></span>
   <button class="rm" data-rmthen="${i}">Remove</button></div>`).join("")}
  <button class="add">＋ Add an action</button>
  <h4>Stop if</h4>
  ${d.stops.map(x=>`<div class="cl2"><span>${x}</span><span class="gr2"></span>
   <button class="rm">Remove</button></div>`).join("")}
  <button class="add">＋ Add a stop rule</button>
  <h4>Who it applies to</h4>
  <div class="who2">${d.who} <button class="add" style="padding:0;margin-left:8px">Change</button></div>
  <div class="row" style="margin-top:20px"><button class="go solid" id="ovdo">Save as v9 →</button>
   <button class="go" id="rtest">Test on the last 30 days</button>
   <button class="go" style="color:var(--watch)">Turn it off</button>
   <button class="go" id="ovx">Cancel</button></div>
  <div class="test" id="tres" hidden>Would have fired <b>41 times</b> in the last 30 days — 39 answered inside ten minutes, 2 escalated to a manager. Nothing would have been sent to a customer. Two signups would newly qualify under the change.</div>
  <div class="ver">${d.ver}<br>EVERY SAVE IS A NEW VERSION. NOTHING IS OVERWRITTEN.</div></div>`;
 $("#ov").hidden=false;
}



function openPanel(kind,arg){
 const B=$("#pkb");
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
    <button class="go">Recompute</button></div>
   <div class="stamp">${a.st.map(x=>`<span>${x}</span>`).join("")}</div>`;
 }
 if(kind==="partner"){
  const pt=PARTNERS.find(x=>x[0]===arg)||PARTNERS[0];
  const accts=[["Falcon Pay","OTP AED 128,000","growing"],["Dune Logistics","WHATSAPP AED 25,000","growing"],
   ["Harbour Freight","SMS AED 61,000","active"]];
  B.innerHTML=`<div class="pkh">${LOGO(pt[0],40)}<div class="t4"><div class="lb2">Partner · ${pt[2]}</div>
   <b>${pt[0]}</b></div><button class="cx2" data-pkx>✕</button></div>
   <div class="pkbig">${pt[4]}</div>
   <p class="why">Received this month across ${pt[3]} accounts they sourced. Native currency, never converted.</p>
   <h4>By service</h4>${pt[5].map(x=>`<div class="ln"><span class="cp">${x.split(" ")[0]}</span>
    <span class="st"></span><i>${x.split(" ").slice(1).join(" ")}</i></div>`).join("")}
   <h4>Accounts they brought · ${pt[3]}</h4>
   ${accts.map(([a,rev,st])=>`<div class="lrow" data-cust="${a}" style="cursor:pointer">
    <span class="nm2">${LOGO(a,22)}${a}</span><span class="ds">${rev}</span>
    <span class="rt3">${st.toUpperCase()}</span></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:12px">Showing 3 of ${pt[3]}. Every account here is co-owned — no price conversation happens without them on the thread.</p>
   <div class="row"><button class="go solid">Send this month's digest →</button>
    <button class="go">Partner contacts</button></div>`;
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
   <div class="lrow" data-rule="${d.pol.replace(/"/g,"&quot;")}" style="cursor:pointer">
    <span class="nm2">${d.pol}</span><span class="ds">Open in Rules</span><span class="rt3">→</span></div>
   ${d.fyi?`<div class="stamp"><span>FYI ${d.fyi}</span><span>logged</span></div>`:`<div class="stamp"><span>no person notified</span><span>logged</span></div>`}`;
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
   <div class="lrow" data-cust="${acct}" style="cursor:pointer"><span class="nm2">${LOGO(acct,22)}${acct}</span>
    <span class="ds">Open the account</span><span class="rt3">→</span></div>`:""}
   <p style="font-size:12.5px;color:var(--faint);margin-top:14px">Names here come from the admin who wrote the note. Pulse has no contacts table yet, so job titles and reporting lines are not available.</p>`;
 }
  $("#pk").hidden=false;
}
document.addEventListener("click",e=>{
 const t=e.target;
 if(t.closest("[data-pkx]")||t===$("#pk")){$("#pk").hidden=true;return;}
 const oa=t.closest("[data-openask]");
 if(oa){$("#pk").hidden=true;S.ask=oa.dataset.openask;S.sel=new Set();S.askTab="ask";S.v="ask";render();return;}
 const pp=t.closest("[data-person]");if(pp){openPanel("person",pp.dataset.person);return;}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#pk").hidden){$("#pk").hidden=true;}});

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
    <div class="ex2"><b>Person</b><span>Dr. Meera Joshi marked as the decision maker</span></div></div>
   <div class="row" style="margin-top:18px"><button class="go solid" id="ovdo">Save all five →</button>
    <button class="go">Change something</button><button class="go" id="ovx">Cancel</button></div>`;
 }
 if(kind==="bulk"){
  B.innerHTML=`<h3>Add accounts in bulk</h3>
   <p class="sub">Paste a list or drop a CSV from the event. I check every row against what we already have before anything is created.</p>
   <textarea class="logbox" style="min-height:70px" id="bulktx">zenithmart.in, trellisretail.in, harbourfreight.ae, rakesh.k@gmail.com, lumentutors.com, sablediag.in, northwindapparel.com</textarea>
   <div class="row" style="margin-top:12px"><button class="go">Upload a CSV instead</button>
    <span class="fresh">7 ROWS READ · CHECKED AGAINST 3,412 EXISTING ACCOUNTS</span></div>
   <div class="tbl" style="margin-top:16px"><div class="tblscroll"><table>
    <thead><tr><th>Company</th><th>Domain</th><th></th><th>What I found</th></tr></thead>
    <tbody>${BULK.map(([n,dm,r,note])=>`<tr>
     <td class="c">${r==="junk"?"":LOGO(n,18)+" "}${n}</td><td>${dm}</td>
     <td><span class="rowst" data-r="${r}">${r==="new"?"NEW":r==="dup"?"ALREADY OURS":"SUPPRESSED"}</span></td>
     <td style="white-space:normal;max-width:280px">${note}</td></tr>`).join("")}
    </tbody></table></div></div>
   <div class="row" style="margin-top:16px"><button class="go solid" id="ovdo">Create the 4 new ones →</button>
    <button class="go">Review the 2 duplicates</button><button class="go" id="ovx">Cancel</button></div>
   <div class="ver" style="font-family:var(--m);font-size:10.5px;color:var(--faint);margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
    NEW ACCOUNTS ARE ENRICHED AND SCORED BEFORE THEY REACH ANYONE. DUPLICATES ATTACH TO THE EXISTING ACCOUNT AND TELL ITS OWNER.</div>`;
 }
 if(kind==="approvals"){
  B.innerHTML=`<h3>Startup approvals · since 1 August</h3>
   <p class="sub">Your team approved these and the credits are already live. This is a monthly read, not a queue — but you can take any of them back.</p>
   ${APPROVALS.map(([dt,acct,what,who,why])=>`<div class="oi" style="align-items:flex-start">
    <time style="min-width:52px">${dt}</time>
    <span class="d2"><span class="mkrow">${LOGO(acct,20)}<b style="font-weight:500">${acct}</b></span>
     <em>${what} · approved by ${who}<br>${why}</em></span>
    <button class="skip" data-revert="${acct}">Revert</button></div>`).join("")}
   <p style="font-size:12.5px;color:var(--faint);margin-top:14px">29 more, all inside the usual limits. Reverting takes the credit back, notifies the person who approved it, and writes an audit event.</p>
   <div class="row" style="margin-top:16px"><button class="go solid" id="ovdo">Nothing to change →</button>
    <button class="go" id="ovx">Close</button></div>`;
 }
 if(kind==="tag"){
  B.innerHTML=`<h3>Add a tag</h3><p class="sub">Tags are free text and filterable in Ask. Pulse adds its own from evidence — those show dashed.</p>
   <div class="tags" style="margin-bottom:14px">${["Enterprise","Renewal Q4","Needs a case study","Reference-able","Price sensitive","Multi-department","Warm intro available"].map(t=>`<button class="tag2">${t}</button>`).join("")}</div>
   <input class="logbox" style="min-height:0;padding:11px 13px" placeholder="Or write a new one">
   <div class="row" style="margin-top:16px"><button class="go solid" id="ovdo">Add →</button>
    <button class="go" id="ovx">Cancel</button></div>`;
 }
 $("#ov").hidden=false;
}
document.addEventListener("click",e=>{
 const t=e.target;
 const sh=t.closest("[data-sheet]");if(sh){openSheet(sh.dataset.sheet);return;}
 if(t.closest("[data-addtag]")){openSheet("tag");return;}
 const ut=t.closest("[data-untag]");if(ut){const n=S.cust;
  TAGS[n]=(TAGS[n]||[]).filter(x=>x[0]!==ut.dataset.untag);render();return;}
 const r2=t.closest("[data-reassign2]");if(r2){openReassign(r2.dataset.reassign2,1);return;}
 const rv=t.closest("[data-revert]");if(rv){rv.textContent="Reverted";rv.style.color="var(--watch)";return;}
 const pr=t.closest("[data-partner]");if(pr){openPanel("partner",pr.dataset.partner);return;}
});

/* The current owner comes from the account itself. It used to be hardcoded to
   one sample name, which read as fact and was wrong on every real account. */
function ownerOf(name){
 const c=CUST[name];
 if(c&&c.owner)return c.owner;
 const row=BOOK.find(b=>b[1]===name);
 if(row&&row[5]===1)return "unassigned";
 return c&&c.__stub===false?"unassigned":"unassigned";}

function openReassign(name,single){
 const bulk=!single||name==="Unassigned";
 $("#ovb").innerHTML=`<h3>${bulk?"Reassign 46 accounts":"Reassign "+name}</h3>
  <p class="sub">${bulk?"Unowned since Vikram left, 14 days ago. Anyone can do this — it writes an audit event either way.":
   "Currently "+ownerOf(name)+". The new owner picks up every open mission and promise on this account."}</p>
  ${bulk?`<div class="lab" style="margin-bottom:6px">What Pulse suggests</div>
   <div class="splitb"><div><span>India · 28 accounts</span><b>Rhea, Sana</b></div>
    <div><span>UAE · 11 accounts</span><b>Arjun Nair</b></div>
    <div><span>Singapore · 7 accounts</span><b>Priya Sundaram</b></div></div>
   <div class="lab" style="margin-bottom:6px">Or give all 46 to one person</div>`:
   `<div class="lab" style="margin-bottom:6px">Hand it to</div>`}
  ${REPS.map(([n,i,m,me],ix)=>`<button class="rp" data-rep="${ix}" aria-selected="${ix===1&&!bulk?"true":"false"}">
   ${AVI(n,30)}<span class="tx2"><b>${n}${me?" · you":""}</b><span>${m}</span></span>
   ${ix===2&&bulk?'<span class="sug">SUGGESTED</span>':""}</button>`).join("")}
  <div class="row" style="margin-top:20px"><button class="go solid" id="ovdo">${bulk?"Apply the suggested split →":"Reassign →"}</button>
   <button class="go" id="ovx">Cancel</button></div>`;
 $("#ov").hidden=false;
}
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
  get ASK() { return ASK; },
  get AUTO() { return AUTO; },
  get STANDINGS() { return STANDINGS; },
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
  get ME() { return ME; },
};

if (window.PulseLive) {
  /* Ask answers and account pages are fetched on demand rather than up front:
     each is a separate query and most are never opened in a session. */
  const askSeen = new Set(), custSeen = new Set();
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-q]");
    /* A pinned typed question has no catalogue entry, so there is nothing here
       to fetch — the renderer re-asks it through askCustom instead. Without
       this it fired ?q=__typed:0 and got the "cannot answer that" placeholder
       back, cached under an id nothing should ever read. */
    if (q && !q.dataset.q.startsWith("__typed:") && !askSeen.has(q.dataset.q)) {
      askSeen.add(q.dataset.q);
      window.PulseLive.loadAnswer(q.dataset.q, PULSE_BAG, render);
    }
    const cu = e.target.closest("[data-cust]");
    if (cu && !custSeen.has(cu.dataset.cust)) {
      custSeen.add(cu.dataset.cust);
      window.PulseLive.loadAccount(cu.dataset.cust, PULSE_BAG, render);
    }
    /* Payments and rates are L2: fetched only on the deliberate reveal. */
    if (e.target.closest("#revm") && S.cust) {
      window.PulseLive.revealCommercial(S.cust, PULSE_BAG, render);
    }
  });

  window.PulseLive.boot(PULSE_BAG, render);
} else {
  render();
}
