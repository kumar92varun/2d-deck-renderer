# Pilot: From Tokenmaxxing to Valuemaxxing

Exported from the planning doc on 2026-10-22: https://claude.ai/artifact/KTRBpFfBjyH1ayGDi2mf55
If the script or storyboard changes there, update this file too. This file is what Claude Code reads when building beats.

**One idea:** tokens are a cost, not a score, so measure the value you get per token.

| Spec | Main video | Short cut |
| --- | --- | --- |
| Format | 1920 × 1080, 30 fps | 1080 × 1920, 30 fps |
| Length | ~3:40–4:00, set by the Hindi recording | 60 s (beats 1, 4, 10, 12, 14, 17) |
| Audio | Varun's Hindi voiceover + music, added in his editor | Same, re-cut |
| Captions | Toggleable overlay layer | On by default |

**Mascot: Tok.** A rounded neon tile with dot eyes. In this video Tok is the token itself: cheap and cheerful at first, then piling up, then working smart.

**Core visual metaphor.** A two-bar neon meter, Tokens (magenta) and Value (cyan), on screen from beat 4 onward. Tokenmaxxing makes magenta blaze up while cyan barely glows. Valuemaxxing makes magenta dim and shrink while cyan rises and brightens.

## Build status

| Beat | Scene file | Status |
| --- | --- | --- |
| 1 | `scenes/tokenmaxxing/beat01.html` | rebuilt as the neon race opening (desktop only), timed to the recording (16 s); the old leaderboard version is `beat01-board.html` |
| 2 | `scenes/tokenmaxxing/beat02.html` | built, timed to the recording (33.2 s) |
| 3 | `scenes/tokenmaxxing/beat03.html` | built, timed to Take 2 recording (22.3 s) |
| 4 | `scenes/tokenmaxxing/beat04.html` | built, timed to the recording (18.7 s, no Tok, both bars rise) |
| 5 | `scenes/tokenmaxxing/beat05.html` | built, timed to the recording (23.8 s, desktop only) |
| 6 | `scenes/tokenmaxxing/beat06.html` | built, timed to the recording (19.8 s, desktop only); photo `assets/jensen-huang-2023.jpg` (CC BY 2.0, credited on screen) |
| 7 | `scenes/tokenmaxxing/beat07.html` | built, timed to the recording (17.1 s, desktop only); names and numbers on the boards are illustrative; "Claudeonomics" tagged "Meta · as reported" |
| 8 | `scenes/tokenmaxxing/beat08.html` | built, placeholder cues (waiting for recording) |
| 9 | `scenes/tokenmaxxing/beat09.html` | built, placeholder cues (waiting for recording); carries "* According to reports" |
| 10 | `scenes/tokenmaxxing/beat10.html` | built, placeholder cues (waiting for recording) |
| 11 | `scenes/tokenmaxxing/beat11.html` | built, placeholder cues (waiting for recording) |
| 12 | `scenes/tokenmaxxing/beat12.html` | built, placeholder cues (waiting for recording); first beat with a sad Tok (tokenminning) |
| 13 | `scenes/tokenmaxxing/beat13.html` | built, placeholder cues (waiting for recording) |
| 14 | `scenes/tokenmaxxing/beat14.html` | built, placeholder cues (waiting for recording) |
| 15 | `scenes/tokenmaxxing/beat15.html` | built, placeholder cues (waiting for recording) |
| 16 | `scenes/tokenmaxxing/beat16.html` | built, placeholder cues (waiting for recording); covers both rules 4 and 5 |
| 17 | `scenes/tokenmaxxing/beat17.html` | built, placeholder cues (waiting for recording) |

## Storyboard

Times are targets; each scene is re-timed to the recorded Hindi audio through its `CUES` block. Cue words are as spoken in the Hindi VO. The on-screen text column is English only; Hindi appears only in the voiceover.

| Beat | Time | Cue word (Hindi VO) | Visual | On-screen text |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:16 | race / features / bugs fix / code deploy / AI tokens consume | Neon starting grid in perspective, lanes tagged COMPANY A–F, countdown 3-2-1-GO, developers launch down the track. A gantry of signs (MORE FEATURES / BUGS FIXED / CODE SHIPPED) cracks out one by one; at "AI tokens consume" the lanes turn magenta, MORE TOKENS and the token counter appear, the pack surges. | MORE TOKENS |
| 2 | 0:16–0:49 | productive / under-productive / tokenmaxxing / hype / loss-making / valuemaxxing | Beat-1 board: gold PRODUCTIVE badge on the top row, bottom rows dim with an UNDER-PRODUCTIVE tag. Board leaves; "Tokenmaxxing" lights up, FALSE HYPE and LOSS-MAKING stamp on with a falling line. Tokenmaxxing is struck out and "Valuemaxxing" slams in (cyan). | Tokenmaxxing → Valuemaxxing |
| 3 | 0:16–0:38 | tokens / input / output | A sentence shatters into coloured tiles; one becomes Tok (squash on landing). Tiles stream into an AI box (in) and back out (out), each dropping a coin. | 1 token ≈ ¾ word · Input + Output = Cost |
| 4 | 0:49–1:08 | Tokenmaxxing / assumption / output / productive / AI Native / 2026 | Tiles fly non-stop into the AI box; the Tokens bar and the Value bar rise together. "More tokens → Better output?" appears, then PRODUCTIVE, AI NATIVE and Silicon Valley 2026 badges. No Tok mascot. | Tokenmaxxing = As many tokens as possible |
| 5 | 0:54–1:18 | tokenmaxxing / productivity / number / tokens / assume | A trend spreads through a network of company nodes and a popularity curve climbs (FAMOUS). Boardroom slide: empty AI-productivity gauge, blank ONE EASY NUMBER slot, leaders looking on; the token count fills the slot and swings the gauge; "More tokens → more productivity" is stamped ASSUMED. | More tokens → more productivity (assumed) |
| 6 | 1:18–1:38 | पाँच लाख / ढाई लाख / tokens / hype | Adoption bars shoot up. Photo of Jensen Huang (2023, credited) next to a PARAPHRASE card (no quote marks): $500K salary bar, $250K tokens bar, SOMETHING IS WRONG vs a short dashed bar. Hype meter spikes: HYPE. | $500K Salary vs $250K Tokens |
| 7 | 1:00–1:12 | Claudeonomics / Amazon / OpenAI | A generic leaderboard window titled "Claudeonomics"; more leaderboards pop up beside it, labelled with company names in plain text (no logos). | Leaderboards Everywhere |
| 8 | 1:12–1:22 | bills आने लगे / 1 जून | An invoice unrolls from the top of the screen and keeps going. A calendar flips to June 1. | Usage-based Billing · June 1 |
| 9 | 1:22–1:32 | 10 करोड़ डॉलर / चार महीनों | Big counter slams to $100M with a glow flare and screen shake. A 12-month budget bar drains empty by month 4. | $100M in One Month* · Full-Year Budget Gone in 4 Months* |
| 10 | 1:32–1:46 | ऊपर / नहीं | Tok runs in circles on a treadmill; paper docs pile up unread. Meter: magenta hits the ceiling and flares, cyan stays flat and dim. | Usage ↑ Value → |
| 11 | 1:46–2:02 | lines of code / budgets और caps | A retro code printout as a parallel. Leaderboards fall like dominoes; a cap line drops onto the magenta bar. | The Same Old Mistake: "Lines of Code" |
| 12 | 2:02–2:18 | valuemaxxing / हर token | Swing the other way: Tok starves on a near-empty bar ("tokenminning"), then a balanced scale. Formula card: Value ÷ Tokens. | Valuemaxxing = Value per Token |
| 13 | 2:18–2:30 | outcome से शुरुआत करो | Tok holds a checklist: merged PR, fixed bug, decision made. Each ticks. | Rule 1: Outcome First |
| 14 | 2:30–2:44 | सही काम, सही model / छोटे, सस्ते models | A router splits tasks: an email card goes to a small Tok, a gnarly bug goes to a big Tok. Coin cost labels on each lane. | Rule 2: Right Task, Right Model |
| 15 | 2:44–2:56 | volume नहीं, context / दस अधूरे retries | Left: ten vague prompts loop and burn coins. Right: one prompt with attached file icons hits first time. | Rule 3: Context, Not Volume |
| 16 | 2:56–3:22 | जहाँ फ़ायदा हो / हर usage number | Spotlights on three heavy tasks (code review, tests, research). Then the meter returns, now with an outcome readout beside each bar; cyan rises and brightens with magenta. | Rule 4: Spend Where It Pays · Rule 5: Pair Usage with Outcome |
| 17 | 3:22–3:40 | खर्च / score / मुझे इससे मिला क्या? | "Score" crumbles; "Cost" stays. Tok waves; end card with the five rules and a follow prompt. | Cost, Not Score · What Did I Get? |

\*Show "According to reports" in small type on beat 9; both figures come from press reports, not company filings. No company logos anywhere; company names as plain text only.

## Hindi voiceover script

**Bold words are cue words**: an animation lands exactly on them. [pause] = half a second. Numbers in brackets are beat numbers.

**Act 1 — Hook**

[1] इस साल की शुरुआत में दुनिया की कई बड़ी tech companies अपने developers के बीच एक race चला रही थी। ये race ज़्यादा **features** बनाने की, या ज़्यादा **bugs fix** करने की, या ज़्यादा **code deploy** करने की नहीं, बल्कि ज़्यादा **AI tokens consume** करने की थी।

[2] इस race में जो developers सबसे ज़्यादा AI tokens consume करते थे, उन्हें सबसे ज़्यादा **productive** माना जाता था। और जो कम tokens consume करते थे, उन्हें **under-productive** समझा जाता था। [pause] Hi guys, आज की video है **tokenmaxxing** के बारे में: क्यों अब उन्हीं बड़ी tech companies को समझ आया कि tokenmaxxing एक ग़लत **hype** था, और ज़्यादा AI tokens consume करने की race कराना बहुत ही **loss-making** decision था। [pause] और फिर मैं अपने personal developer experience के base पे आपको बताऊँगा कि कैसे हम tokenmaxxing को देखें **valuemaxxing** करने के लिए।

**Act 2 — Tokenmaxxing क्या है?**

[3] चलो, सबसे पहले समझते हैं कि **tokens** होते क्या हैं। जब भी हम AI से chat करते हैं, तो AI हमारे words को छोटे-छोटे parts में बाँटता है, जिन्हें हम **tokens** कहते हैं। एक token, एक English word का लगभग ¾ होता है। हर token: जो हम AI में **input** करते हैं, या AI हमें **output** देता है। उस हर एक token का पैसा लगता है।

[4] तो **Tokenmaxxing** का मतलब हुआ कि जितना हो सके, उतने ज़्यादा tokens consume करो। इसमें assumption ये थी कि ज़्यादा tokens use करने से output भी अच्छा आएगा, और ऐसे developers ज़्यादा productive है, ज़्यादा **"AI Native"** है। ये term Silicon Valley में **2026** की शुरुआत में चल पड़ी।

**Act 3 — Companies ने इसे बढ़ावा क्यों दिया**

[5] किसी भी नए trend की तरह, starting में **tokenmaxxing** का trend tech companies में famous हुआ। [pause] Actually, companies को चाहिए था एक simple सा AI **productivity** measure करने का **number**, जिससे leaders समझ पाएँ कि उनकी team कितना काम AI से करवा रही है। [pause] और tokens ज़्यादा use करने को **assume** किया गया कि इससे productivity improve ही होगी।

[6] **Tokenmaxxing** को बड़ी tech companies में तेज़ी से adapt किया जाने लगा। [pause] Nvidia के CEO Jensen Huang ने एक famous quote भी दिया कि अगर आपका **पाँच लाख** dollar salary वाला engineer **ढाई लाख** dollars के tokens नहीं consume कर रहा है, तो कुछ गड़बड़ है। [pause] इस quote ने tokenmaxxing को और भी ज़्यादा **hype** दी।

[7] **हर बड़ी company** जैसे **Meta**, **Amazon**, **OpenAI** में token consumption के leaderboards बन गए थे, जहाँ उनके developers को उनके tokens consume करने के base पे **rank** दी जाती थी। [pause] बताया जाता है कि Meta ने इस leaderboard को नाम भी दिया था: **"Claudeonomics"**।

**Act 4 — अब इसे रोका क्यों जा रहा है**

[8] फिर **bills आने लगे**। जब GitHub Copilot ने **1 जून** को usage-based billing शुरू की, तो ये खर्च नज़रअंदाज़ करना नामुमकिन हो गया।

[9] Reports के मुताबिक Meta का token खर्च **एक ही महीने में 10 करोड़ डॉलर** से ऊपर चला गया। और Uber ने अपना पूरे साल का AI budget सिर्फ़ **चार महीनों** में खत्म कर दिया।

[10] और productivity? लगभग वहीं की वहीं। Token leaderboard पर top करना आसान था: agents को गोल-गोल घुमाओ, या ऐसे docs लिखवाओ जिन्हें कोई नहीं पढ़ता। Usage **ऊपर** गया। Value **नहीं**। [pause]

[11] Mozilla के CTO ने इसकी तुलना उस पुरानी आदत से की, जब programmers को **lines of code** से आँका जाता था। तो leaderboards हटा दिए गए, Meta, Amazon, Microsoft और Uber में, और companies ने लगाए **budgets और caps**।

**Act 5 — Valuemaxxing: सही तरीका**

[12] तो क्या AI इस्तेमाल करना बंद कर दें? बिल्कुल नहीं। कुछ teams उल्टी तरफ़ चली गईं और अब कम से कम tokens इस्तेमाल करती हैं। वो भी उतना ही गलत है। असली लक्ष्य है **valuemaxxing**: **हर token** से ज़्यादा से ज़्यादा value निकालना।

[13] पहला नियम: **outcome से शुरुआत करो**। Prompt लिखने से पहले जान लो कि "done" कैसा दिखेगा: एक merged PR, एक fixed bug, या कोई फ़ैसला।

[14] दूसरा नियम: **सही काम, सही model**। दो लाइन का email लिखने के लिए सबसे बड़ा frontier model मत भेजो। आसान काम **छोटे, सस्ते models** को दो, और बड़े models बचाकर रखो मुश्किल problems के लिए।

[15] तीसरा नियम: **volume नहीं, context**। सही files के साथ एक साफ़ prompt, **दस अधूरे retries** से बेहतर है। Rework में ही tokens चुपचाप गायब होते हैं।

[16] चौथा नियम: **जहाँ फ़ायदा हो, वहाँ खुलकर खर्च करो**। लंबे code reviews, tests लिखकर चलाने वाले agents, गहरी research: वहाँ tokens जलाओ, सोच-समझकर। [pause] पाँचवाँ नियम: **हर usage number के साथ एक outcome रखो**। खर्च हुए tokens के बग़ल में: कितने bugs बंद हुए, कितने features ship हुए, कितने घंटे बचे। अगर value वाला bar नहीं बढ़ रहा, तो token वाला bar भी नहीं बढ़ना चाहिए।

**Act 6 — Close**

[17] Tokens एक **खर्च** हैं, **score** नहीं। ये मत पूछो "मैंने कितना AI इस्तेमाल किया?" पूछो **"मुझे इससे मिला क्या?"** यही है valuemaxxing। अगले video के लिए follow करो।

## Sources (for on-screen facts)

- Quartz, "The tokenmaxxing hangover": Meta leaderboard, "Token Legend", Copilot usage billing on June 1, Meta CTO memo
- LeadDev, "The tokenmaxxing hype didn't last long": Meta, Amazon, Microsoft, Uber ending leaderboards; "Claudeonomics"
- AP, "AI 'tokenmaxxing' fades as workplaces look to cut tech spending": token ≈ ¾ word, Jensen Huang quote, Mozilla CTO lines-of-code comparison
- ClickUp, "What Is Tokenmaxxing? The AI Metric That Broke Itself": Meta and Uber cost estimates, tokenminning
- SemiAnalysis, "TokenBudgeting": shift to budgets and caps
