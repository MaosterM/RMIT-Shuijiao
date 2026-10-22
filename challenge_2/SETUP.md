# Zenithium: full setup guide

**RMIT Hackathon 2026 · Challenge 2 "Build Without Blind Trust: Vibe coding with TideCloak" · Team ShuijiaoT07 (Taylor's University Malaysia)**

When someone passes away, their will, MyKad and asset papers usually sit with one person, one law firm or one company, and the family has to trust them. Zenithium seals those documents so that **no single party can open them**: not the Zenithium admin, not the database host, not any one family member. They open only when a **quorum of heirs** (2 of 2 by default) approves, each from their own Tide account.

- **Admin can't read:** the database stores only ciphertext ([Database View](#demo-test-script)).
- **No single heir can unlock:** the vault key is split between the heirs (Shamir secret sharing). One heir alone cannot rebuild it.
- **Encrypted before it leaves your device:** text and files are encrypted in the browser, with TideCloak (`doEncrypt` / `doDecrypt`) protecting the keys.

> ⚠️ Some parts are simulated, including the **SIMULATED QUORUM** approval workflow and death verification. See **[MOCKED.md](MOCKED.md)**. For a plain-English explanation for presenters, see **[STUDY.md](STUDY.md)**.

## Contents of this folder

| Path | What |
|---|---|
| `app/` | Next.js 16 app, built on the official `@tidecloak/nextjs` template |
| `README.md` | short introduction and quick start |
| `MOCKED.md` | everything that is simulated |
| `STUDY.md` | study guide for presenting to judges |
| `summary.docx` | 1-page project summary |
| `video_script.md` | 2-minute demo shot list and narration |
| `make_zip.sh` / `make_zip.ps1` | build `sourcecodes.zip` from `app/` (no `node_modules`, `.next` or data) |

## How to run it

There are two ways to run Zenithium:

| | **A. Quick start (offline demo)** | **B. Full setup with TideCloak** |
|---|---|---|
| Needs | Node.js only | Node.js + Docker + bash/curl/jq + internet |
| Time | ~3 minutes | ~10–15 minutes |
| Login & `doEncrypt`/`doDecrypt` | **simulated** (red banner) | **real TideCloak** |
| Everything else (encryption, key splitting, Database View, quorum) | real | real |

The app picks the mode automatically. If `app/tidecloak.json` contains a realm config, it uses TideCloak; if the file is `{}`, it runs in OFFLINE DEMO MODE.

### Prerequisites

| Tool | Version | Needed for | Check |
|---|---|---|---|
| [Node.js](https://nodejs.org) LTS | 20 or 22 (includes npm) | A and B | `node -v` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | any recent, **running** | B | `docker info` |
| bash + curl | | B (realm setup script) | Windows: use **Git Bash** (comes with [Git for Windows](https://git-scm.com/download/win)) |
| [jq](https://jqlang.org/download/) | 1.6+ | B | `jq --version` |

Install jq: **Windows** `winget install jqlang.jq` (then reopen the terminal) · **macOS** `brew install jq` · **Ubuntu/Debian** `sudo apt install jq`.

> **Network note:** `npm install` needs `registry.npmjs.org`, and TideCloak needs to reach Tide's network (`*.tideprotocol.com`). Some campus or venue Wi-Fi blocks or intercepts these (errors like `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or `SSL connection could not be established`). If you see them, switch to a phone hotspot.

### Get the code

```bash
git clone <this-repo-url>
cd <repo>/challenge_2/app
```
Or unzip `sourcecodes.zip` and `cd` into the extracted folder (it contains the contents of `app/`).

### A. Quick start (offline demo, no Docker)

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. A red **OFFLINE DEMO MODE** banner confirms the mode. (If there's no banner and login fails, `app/tidecloak.json` holds another machine's TideCloak config: set its contents to `{}` and restart.) Click **Log in with Tide** and type one of the demo usernames (`limahkow`, `limweijie`, `limmeiling`), then follow the [demo test script](#demo-test-script). Use a second browser (or a private window) to be a second person at the same time.

### B. Full setup with real TideCloak

**1. Start the TideCloak dev server** (any terminal):

```bash
docker run --name mytidecloak -d -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest
```
PowerShell (one line): `docker run --name mytidecloak -d -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password tideorg/tidecloak-dev:latest`

Wait until http://localhost:8080 loads (about 30–60 seconds; `docker logs -f mytidecloak` shows progress). The admin console login is **admin / password**.

**2. Install, create the realm, run** (on Windows, use a **Git Bash** terminal for these):

```bash
cd challenge_2/app
npm install
bash init/tcinit.sh     # same as: npm run init
npm run dev
```

The setup script (from the official TideCloak template) creates realm **`zenithium`** and client **`zenithium-app`**, activates the free dev licence, enables Tide governance, and writes **`app/tidecloak.json`**. It reads its settings from `init/.env.example`. When it finishes it prints `All done. Realm 'zenithium' is provisioned…`. Restart `npm run dev` afterwards so the app picks up `tidecloak.json`. The red banner disappears and **Log in with Tide** opens the real Tide login.

**3. Create the three Tide accounts.** Open http://localhost:3000 → **Log in with Tide** → create a new Tide account. Do this once per person, each in its own browser or private window, using exactly these usernames:

| Person | Tide username | Role in Zenithium |
|---|---|---|
| Mr Lim Ah Kow (planner) | `limahkow` | planner |
| Lim Wei Jie (son) | `limweijie` | heir |
| Lim Mei Ling (daughter) | `limmeiling` | heir |

**Roles:** Zenithium treats a user as planner or heir if they have the TideCloak realm role `planner` or `heir`. For a quick demo, it also accepts the usernames above. Change names, usernames or the threshold in `app/lib/family.js`. To use real realm roles instead: in the admin console, open realm *zenithium* → Realm roles → create `planner` and `heir`, assign them to the users, and approve the resulting change requests. Every user already has the `_tide_message.selfencrypt` / `_tide_message.selfdecrypt` roles from the template realm, which Zenithium uses for `doEncrypt` / `doDecrypt`.

### Stop, reset and start over

| To… | Do |
|---|---|
| Stop the app | `Ctrl+C` in the `npm run dev` terminal |
| Clear the demo data (vault, keys, approvals) | stop the app, delete `app/data/`, start again |
| Stop / start TideCloak | `docker stop mytidecloak` / `docker start mytidecloak` |
| Remove TideCloak completely | `docker rm -f mytidecloak`, then set `app/tidecloak.json` back to `{}` and redo step B |

### Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` / 403 | Your network intercepts npm. Use a phone hotspot or another network. |
| `Missing dependency: jq` | Install jq (see Prerequisites) and reopen the terminal |
| `npm run init` does nothing or errors on Windows | Run `bash init/tcinit.sh` from **Git Bash**, not PowerShell or cmd |
| `setUpTideRealm failed … SSL connection could not be established` | TideCloak can't reach Tide's network; switch networks (see Network note) |
| `setUpTideRealm failed … KEYGEN_FAILED` / `FinalizeWallet 500` | Tide's licensing service failed. Delete the realm in the admin console (or `docker rm -f mytidecloak` and start again) and retry later. Meanwhile, use the offline demo (path A). |
| Port 3000 or 8080 already in use | Stop the other program, or run `npm run dev -- -p 3001` (then also update `CLIENT_APP_URL` in `init/.env.example` before running the init) |
| "Waiting for … to set up their family key" on the Seal page | The planner must name the heirs first (Step 1); then each heir logs in and clicks **Set up my family key** on the Family Vault page |
| Seal button stays grey | Name heirs (Step 1), wait for both keys (Step 2 shows READY), tick **Yes, the codes match** for each heir, and fill in the will summary |

## Demo test script

Use two browsers (or one normal and one private window) to act as different people.

1. **Planner names his heirs.** Log in as `limahkow` → **Seal the Vault** → **Step 1**: tick Lim Wei Jie and Lim Mei Ling, choose **2 of 2** → **Name my heirs**.
2. **Heirs set up their family keys.** Log in as `limweijie` → **Family Vault**. It says *"Mr Lim Ah Kow has named you as one of his heirs"* → **Set up my family key** and note the code (fingerprint). Do the same as `limmeiling` in another browser.
3. **Planner confirms and seals.** As `limahkow` → **Step 2**: both heirs show **READY** with their codes; compare them and tick **Yes, the codes match**. **Step 3**: fill in a will summary, an IC number and assets, choose a document type, attach a PDF (≤ 5 MB), then click **Encrypt and seal the vault**.
4. **Database View.** Open **Database View**. Every sensitive field and document is ciphertext; only the document type, date and uploader are readable. *This is what an admin or attacker sees.*
5. **Son tries alone.** Log in as `limweijie` → **Family Vault**. The badge shows **SEALED**. Click **Request unlock**, then **Approve unlock** (badge: **1 OF 2 APPROVED**), then **Open the vault**. It is **blocked**: "The vault stays sealed for now: 1 of 2 family approvals…".
6. **Daughter approves** (second browser or laptop). Log in as `limmeiling` → **Family Vault** → **Approve unlock**. The progress bar updates live on both screens within 3 seconds, and the badge shows **UNLOCKED**.
7. **Open.** Either heir clicks **Open the vault**. The will, IC and assets appear, and the PDF opens in a new browser tab.

To demo on two laptops, run the app on one machine and open `http://<that-machine's-IP>:3000` on the other. You must then also add that URL to the client's redirect URIs and web origins in the TideCloak admin console. Two browsers on one laptop is simpler.

## Make the submission zip

```bash
bash make_zip.sh            # macOS / Linux / Git Bash
```
```powershell
powershell -ExecutionPolicy Bypass -File make_zip.ps1   # Windows
```

## How it works (one paragraph)

The planner's browser creates a random 256-bit **vault key**, encrypts the will, IC, assets and each file with AES-GCM, and also seals the text fields and file keys with **TideCloak `doEncrypt`**. The vault key is split into **Shamir shares**, one per heir, and each share is encrypted to that heir's RSA public key. Each heir's **private** key is sealed with their own TideCloak `doEncrypt`, so only their Tide account can use it. To approve, an heir unseals their private key (`doDecrypt`), decrypts their share and re-encrypts it to every heir. Once **threshold** shares are available, an heir's browser rebuilds the vault key and decrypts everything locally. Zenithium's server only ever stores ciphertext. See `app/lib/crypto.js`, `app/app/seal/page.jsx`, `app/app/vault/page.jsx` and `app/app/api/*`.
