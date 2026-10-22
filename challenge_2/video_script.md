# Zenithium: 2-minute demo video script

**Recorded in OFFLINE DEMO MODE.** During the hackathon, Tide's network couldn't activate our TideCloak licence ("not enough ORKs returned an ok response"), so this video uses the app's clearly labelled offline mode. **Keep the red banner visible; don't crop it out.** In offline mode, "Log in with Tide" opens a small box where you type the demo username.

## Before you press record (about 5 minutes)

1. **Reset the data:** with the app running at http://localhost:3000, delete the folder `challenge_2/app/data/`. There's no need to restart; the app reads the file on every request. (If the app isn't running: `cd challenge_2/app` → `npm run dev`.)
2. **Use two different browsers**, e.g. **Chrome on the left** and **Edge on the right** (or a normal window and an incognito window). Two windows of the *same* browser share one login and will overwrite each other.
3. **Set up the heirs' keys (off camera):**
   - Left (Chrome): Log in → `limweijie` → **Family Vault** → **Set up my family key**.
   - Right (Edge): Log in → `limmeiling` → **Family Vault** → **Set up my family key**.
4. **Log the left browser in as the planner:** Log out → Log in → `limahkow` → go to **Home**.
5. **Have ready:** a sample will PDF (under 5 MB), and the text below copied so you can paste it:
   - **Will summary:** *The family home in Ipoh goes to Mei Ling. The shop lot in Klang goes to Wei Jie. My savings are to be shared equally, with care for your mother first.*
   - **IC:** *520314-08-5521*
   - **Assets:** *Maybank savings account, EPF (KWSP), Great Eastern life policy, shop lot title in Klang, house title in Ipoh*
6. Browser zoom 110%, close other tabs, silence notifications.

## Shot list and narration (≈ 240 words, about 2:00 at a calm pace)

| Time | On screen | Narration |
|---|---|---|
| **0:00–0:15**<br>Problem | Left browser, **Home** page: title and the three cards | "Losing a parent is hard enough. In Malaysia, their will, MyKad and land titles usually end up with one person or one company, and the family simply has to trust them. That's often where disputes begin. Zenithium changes that." |
| **0:15–0:40**<br>Planner seals | Left (logged in as **Mr Lim Ah Kow**) → **Seal the Vault** → paste will summary, IC and assets → choose **Will (Wasiat)** → attach the PDF → **Encrypt and seal the vault** → green message *"Thank you. Everything is now safely sealed…"* | "Mr Lim writes down what his family will need, and attaches his will. When he presses seal, everything is encrypted in his own browser, before it ever leaves his laptop. The key that opens it is split between his two children. Zenithium never holds it." |
| **0:40–1:00**<br>Database View | Left → **Database View** → slowly scroll the table (every value is ciphertext), then the raw JSON | "This is exactly what our database stores, and what an admin, our hosting provider or a hacker would see: scrambled text. Only harmless labels, like the document type and date, are readable. We cannot read your family's will, even if we wanted to." |
| **1:00–1:20**<br>Son alone is blocked | Left: **Log out** → Log in → `limweijie` → **Family Vault** (badge **SEALED**) → **Request unlock** → **Approve unlock** (badge **1 OF 2 APPROVED**) → **Open the vault** → message *"The vault stays sealed for now: 1 of 2 family approvals…"* | "Later, Wei Jie tries to open the vault on his own. He asks, and he approves, but one approval isn't enough. Without his sister's share, the key simply cannot be rebuilt. It isn't a disabled button; it's mathematics." |
| **1:20–1:45**<br>Daughter approves, vault opens | Right (Edge, **Mei Ling**) → **Family Vault** → **Approve unlock**. Show both windows: the progress bar fills and the badge turns **UNLOCKED** (the left updates within 3 seconds). Right → **Open the vault** → *"What was left for your family"* appears → click the PDF; it opens in a new tab | "Mei Ling approves from her own account, on her own device. Two of two. The vault opens, only in their browsers, and their father's words are there for the family to read." |
| **1:45–2:00**<br>Why TideCloak + online version | Back to **Home** (the three cards). For the last 5 seconds, add an **end-card text overlay** (in your video editor):<br>**"Want the online version with real TideCloak?<br>github.com/&lt;your-repo&gt; → challenge_2/SETUP.md"** | "In most apps, the company holds the keys. With TideCloak, no single party, not even us, can unlock alone. Tide's network was down today, so this demo runs in our labelled offline mode. To try the online version with real TideCloak, follow SETUP.md in our repo. Zenithium: kept safe, together." |

## Recording tips

- Speak slowly and warmly; pause for a beat after "Two of two."
- Paste the long text instead of typing it on camera.
- If an action takes a moment, cut the wait in editing.
- If you run long, drop the sentence *"Only harmless labels, like the document type and date, are readable."* Keep the online-version line and the end card: they tell judges where the real TideCloak version is.
- Replace `<your-repo>` in the end card with your public GitHub repo link before exporting. Also put the link in the video description or submission form if there is one.
- If something goes wrong mid-take, repeat step 1 of the checklist (delete `app/data/`) and set up the two heir keys again before the next take.
