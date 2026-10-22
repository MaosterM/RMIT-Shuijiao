# Zenithium 🌿
### Your family's wishes, kept safe together

**RMIT Hackathon 2026 · Challenge 2: "Build Without Blind Trust: Vibe coding with TideCloak"**
**Team ShuijiaoT07 · Taylor's University Malaysia**

---

## Introduction

Losing someone you love is hard enough. Afterwards, the papers they leave behind, such as their will, MyKad, land titles and savings, usually sit with **one person, one law firm or one company**, and the family simply has to trust them. That's where documents go missing, one relative ends up in control, and families fall into disputes.

**Zenithium** keeps those documents gently sealed so that **no single party can open them**: not our admins, not the database host, not any one family member. They open only when the **family agrees together**, with each heir approving from their own Tide account.

| 🔒 Admin can't read | 🤝 No single heir can unlock | 🌿 Encrypted before it leaves your device |
|---|---|---|
| Our database holds only scrambled text. Even we can't read your loved one's will. | The vault key is split between the heirs. It takes 2 of 2 to open it. | Words and documents are sealed in your browser, with TideCloak guarding the keys. |

## The brief

> *"A working app without unilateral control over protected data or decisions."* (Challenge 2, RMIT Hackathon 2026)

Our answer for estate settlement in Malaysia:

1. **The planner** (Mr Lim Ah Kow) writes a will summary, IC number and asset list, and attaches documents (PDF/JPG/PNG).
2. Everything is **encrypted in the browser** with TideCloak and AES-GCM before it is saved. The **Database View** shows that the server only stores ciphertext.
3. After he passes away, **his heirs** (son Lim Wei Jie and daughter Lim Mei Ling) can request to open the vault. **One heir alone is blocked.** When both approve, the vault opens and the will PDF can be read, by the family only.

**Built with:** Next.js 16 · TideCloak (`@tidecloak/nextjs`: login, `doEncrypt` / `doDecrypt`) · WebCrypto (AES-GCM, RSA-OAEP) · Shamir secret sharing.
**Impact:** SDG 16 (fair, dispute-free estate processes) · SDG 1 (heirs can claim what's theirs) · SDG 5 (widows and elderly spouses get an equal say).

> **Honesty note:** some parts are simulated, including the **quorum approval workflow** (run by our app, though the key never leaves the heirs) and death verification. If TideCloak isn't set up, the app runs in a clearly labelled **offline demo mode**. Full details are in [MOCKED.md](MOCKED.md).

## How to run

You only need **[Node.js](https://nodejs.org) 20 or 22**.

```bash
git clone <this-repo-url>
cd <repo>/challenge_2/app
npm install
npm run dev
```

Open **http://localhost:3000** and log in as one of the demo family members:

| Who | Username | What they do |
|---|---|---|
| Mr Lim Ah Kow | `limahkow` | seals the vault |
| Lim Wei Jie (son) | `limweijie` | heir: requests and approves |
| Lim Mei Ling (daughter) | `limmeiling` | heir: approves |

**Try it** (use three separate browser sessions, e.g. Chrome, Chrome incognito and Edge, so each person stays logged in):
1. As `limahkow`: **Seal the Vault** → **Step 1**: tick Wei Jie and Mei Ling, 2 of 2 → **Name my heirs**.
2. As each heir: **Family Vault** shows *"Mr Lim Ah Kow has named you…"* → **Set up my family key** → note the code shown.
3. As `limahkow`: **Step 2**: check that each heir's code matches → tick **Yes, the codes match** → **Step 3**: fill in the form, attach a PDF → **Encrypt and seal the vault**.
4. Open **Database View** to see that everything is ciphertext.
5. As `limweijie`: **Request unlock** → **Approve unlock** → **Open the vault**. It's blocked (1 of 2).
6. As `limmeiling`: **Approve unlock**. The vault unlocks and the will PDF opens.

This quick start runs in **offline demo mode** (red banner: login and TideCloak encryption are simulated).

### Want the online version with real TideCloak?
You're very welcome to try it. Follow **[SETUP.md](SETUP.md)** (Docker + one setup script, about 10–15 minutes). The app switches to real TideCloak automatically once the realm is set up; no code changes are needed.

**Please note:** because of the outage described below, we could not test the online mode end to end. The setup steps were verified up to Tide's licence activation, and the TideCloak code follows the official `@tidecloak/nextjs` template (`TideCloakProvider`, `useTideCloak`, `doEncrypt` / `doDecrypt` with the template's `message` tag, `verifyTideCloakToken`). Small issues are still possible on first run, and Tide's network must be healthy when you try it.

> **About our demo video:** it was recorded in offline demo mode. During the hackathon on 22 Oct 2026, Tide's network couldn't activate our TideCloak licence: the realm setup failed on Tide's side with *"not enough ORKs returned an ok response"* and Tide's node returned HTTP 503. This happened with several emails and on a clean network. The TideCloak integration (login, `doEncrypt` / `doDecrypt`, server-side token checks) is fully wired in the code. See [MOCKED.md](MOCKED.md).

## More

| File | What's inside |
|---|---|
| [SETUP.md](SETUP.md) | full setup with TideCloak, troubleshooting, how it works |
| [MOCKED.md](MOCKED.md) | everything that is simulated |
| [STUDY.md](STUDY.md) | plain-English guide and judge Q&A |
| [video_script.md](video_script.md) | 2-minute demo script |
| `summary.docx` | 1-page project summary |
