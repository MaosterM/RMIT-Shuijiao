# Zenithium: 2-minute demo video script

**Recorded in OFFLINE DEMO MODE.** During the hackathon, Tide's network couldn't activate our TideCloak licence ("not enough ORKs returned an ok response"), so this video uses the app's clearly labelled offline mode. **Keep the red banner visible; don't crop it out.** In offline mode, "Log in with Tide" opens a small box where you type the demo username.

## Before you press record (about 5 minutes)

1. **Reset the data:** with the app running at http://localhost:3000, delete the folder `challenge_2/app/data/` (no restart needed). If the app isn't running: `cd challenge_2/app` → `npm run dev`.
2. **Open three separate browser sessions** (each keeps its own login):
   - **Window A: Chrome (normal)** for **Mr Lim Ah Kow** (`limahkow`)
   - **Window B: Chrome incognito** for **Lim Wei Jie** (`limweijie`)
   - **Window C: Edge** for **Lim Mei Ling** (`limmeiling`)

   Log each one in and arrange them so you can switch quickly. A on **Seal the Vault**, B and C on **Family Vault**.
3. **Have ready:** a sample will PDF (under 5 MB) and this text to paste:
   - **Will summary:** *The family home in Ipoh goes to Mei Ling. The shop lot in Klang goes to Wei Jie. My savings are to be shared equally, with care for your mother first.*
   - **IC:** *520314-08-5521*
   - **Assets:** *Maybank savings account, EPF (KWSP), Great Eastern life policy, shop lot title in Klang, house title in Ipoh*
4. Browser zoom 110%, close other tabs, silence notifications.

## Shot list and narration (≈ 250 words, about 2:00 at a calm pace)

| Time | On screen | Narration |
|---|---|---|
| **0:00–0:12**<br>Problem | A: **Home** page (title and three cards) | "Losing a parent is hard enough. In Malaysia, their will and papers often end up with one person or one company, and the family simply has to trust them. Zenithium changes that." |
| **0:12–0:27**<br>Planner names his heirs | A: **Seal the Vault** → **Step 1**: tick **Lim Wei Jie** and **Lim Mei Ling**, approvals **2 of 2** → **Name my heirs**. Step 2 appears with both heirs **WAITING** | "Mr Lim chooses who will hold the keys: his son and his daughter. Both must agree before anything can be opened." |
| **0:27–0:45**<br>Heirs set up their keys | C (Mei Ling): message *"Mr Lim Ah Kow has named you as one of his heirs"* → **Set up my family key** → her code appears. B (Wei Jie): **Set up my family key**. Back to A: both turn **READY** with their codes → tick **"Yes, the codes match"** for each | "Each heir creates their own family key, on their own device. Mr Lim checks each code with his children, so he knows the keys are really theirs, and not swapped by anyone, including us." |
| **0:45–1:02**<br>Planner seals | A: **Step 3**: paste will, IC and assets → **Will (Wasiat)** + attach the PDF → **Encrypt and seal the vault** → *"Thank you. Everything is now safely sealed…"* | "He writes down his wishes and attaches his will. Everything is encrypted in his own browser, and the key is split between his two children." |
| **1:02–1:15**<br>Database View | A: **Database View** → scroll the table, then the raw JSON | "This is all our database ever sees: scrambled text. We cannot read your family's will, even if we wanted to." |
| **1:15–1:30**<br>Son alone is blocked | B (Wei Jie): **Request unlock** → **Approve unlock** (badge **1 OF 2 APPROVED**) → **Open the vault** → *"The vault stays sealed for now: 1 of 2…"* | "Wei Jie tries to open it on his own. One approval isn't enough. Without his sister's share, the key cannot be rebuilt. That's mathematics, not a disabled button." |
| **1:30–1:47**<br>Daughter approves, vault opens | C (Mei Ling): **Approve unlock** → badge **UNLOCKED** (B updates within 3 seconds) → **Open the vault** → *"What was left for your family"* → click the PDF; it opens | "Mei Ling approves from her own device. Two of two. The vault opens, for the family only, and their father's words are there to read." |
| **1:47–2:00**<br>Why TideCloak + online version | A: **Home**. Last 5 seconds: **end-card overlay**<br>**"Want the online version with real TideCloak?<br>github.com/&lt;your-repo&gt; → challenge_2/SETUP.md"** | "With TideCloak, no single party, not even us, can unlock alone. Tide's network was down today, so this demo runs in offline mode; to try the real TideCloak version, follow SETUP.md in our repo. Zenithium: kept safe, together." |

## Recording tips

- Speak slowly and warmly; pause for a beat after "Two of two."
- Paste long text instead of typing on camera, and cut any waiting in editing.
- If you run long, shorten the key-setup shot by showing only Mei Ling's setup on camera (do Wei Jie's just before, off camera) and saying "Wei Jie does the same."
- Keep the online-version line and the end card: they tell judges where the real TideCloak version is. Replace `<your-repo>` with your GitHub link.
- If a take goes wrong: delete `app/data/` and start again from shot 2 (the windows stay logged in).
