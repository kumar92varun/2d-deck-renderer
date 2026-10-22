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
| 1 | `scenes/tokenmaxxing/beat01.html` | built, placeholder cues (waiting for recording) |
| 2 | `scenes/tokenmaxxing/beat02.html` | built, placeholder cues (waiting for recording) |
| 3 | `scenes/tokenmaxxing/beat03.html` | built, placeholder cues (waiting for recording) |
| 4 | `scenes/tokenmaxxing/beat04.html` | built, placeholder cues (waiting for recording) |
| 5–17 | — | not started |

## Storyboard

Times are targets; each scene is re-timed to the recorded Hindi audio through its `CUES` block. Cue words are as spoken in the Hindi VO. The on-screen text column is English only; Hindi appears only in the voiceover.

| Beat | Time | Cue word (Hindi VO) | Visual | On-screen text |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:08 | Tokens जलाने | A glowing leaderboard slides in; names and big magenta numbers tick upward. Rows for "code shipped" and "bugs fixed" get struck through. | TOKENS BURNED |
| 2 | 0:08–0:16 | "Token Legend" / valuemaxxing | A gold badge stamps onto the top row with a glow flare. Title card: "tokenmaxxing" crosses out to "valuemaxxing" in neon cyan. | Tokenmaxxing → Valuemaxxing |
| 3 | 0:16–0:28 | tokens / अंदर / बाहर | A sentence shatters into coloured tiles; one becomes Tok (squash on landing). Tiles stream into an AI box (in) and back out (out), each dropping a coin. | 1 token ≈ ¾ word · Input + Output = Cost |
| 4 | 0:28–0:40 | Tokenmaxxing / 2026 | Tok shovels tiles into the box non-stop. The meter appears: magenta Tokens bar blazes up, cyan Value bar barely glows. | Tokenmaxxing = Usage as Score |
| 5 | 0:40–0:50 | एक number | A boardroom slide with a single giant counter; executives (simple silhouettes) nod. | AI Adoption = Just 1 Number |
| 6 | 0:50–1:00 | ढाई लाख डॉलर के tokens | Quote card with speaker name. Two stacked bars: $500K salary vs $250K tokens. | $500K Salary vs $250K Tokens · Jensen Huang, Nvidia |
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

[1] इस साल की शुरुआत में, दुनिया की कुछ सबसे बड़ी tech companies में एक leaderboard चलता था। Code ship करने का नहीं। Bugs fix करने का नहीं। **Tokens जलाने** का। [pause]

[2] और जो सबसे ऊपर होते, उन्हें मिलते थे titles, जैसे **"Token Legend"**। आज की कहानी है tokenmaxxing की, और उसे कुछ बेहतर में बदलने की: **valuemaxxing**।

**Act 2 — Tokenmaxxing क्या है?**

[3] पहले समझते हैं token क्या है। जब भी आप AI से बात करते हैं, आपके शब्द छोटे-छोटे टुकड़ों में कटते हैं, जिन्हें कहते हैं **tokens**। English में एक token लगभग पौने शब्द के बराबर होता है। और हर token का पैसा लगता है: जो **अंदर** जाता है, और जो **बाहर** आता है।

[4] **Tokenmaxxing** मतलब, जितने हो सके उतने tokens इस्तेमाल करना, और उस number को सबूत मान लेना कि आप productive हैं, "AI-native" हैं। ये term Silicon Valley में **2026** की शुरुआत में चल पड़ा।

**Act 3 — Companies ने इसे बढ़ावा क्यों दिया**

[5] और कुछ समय तक companies को ये बहुत पसंद आया। Leaders को चाहिए था **एक number**, जिससे साबित हो कि teams सच में AI अपना रही हैं। और token usage गिनना आसान था।

[6] बड़े-बड़े नाम इसके साथ थे। Nvidia के Jensen Huang ने कहा कि अगर आपका पाँच लाख डॉलर वाला engineer **ढाई लाख डॉलर के tokens** नहीं जला रहा, तो कुछ गड़बड़ है।

[7] Meta में एक internal leaderboard था, बताया जाता है उसका नाम था **"Claudeonomics"**, जो लोगों को token खपत के हिसाब से rank करता था। जल्द ही **Amazon**, **OpenAI** और बाकियों के पास भी अपने leaderboards थे।

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
