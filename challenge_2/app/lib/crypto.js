// Browser-side cryptography for Zenithium. Everything here runs in the user's browser (WebCrypto).
// The server only ever receives the base64 ciphertext these functions produce.
//
//   - AES-GCM 256: encrypts the vault contents and each uploaded file (envelope encryption)
//   - RSA-OAEP 2048: each heir's personal keypair, used to pass key shares between heirs
//   - Shamir secret sharing over GF(256): splits the vault key so that any `threshold` heirs
//     together can rebuild it, and fewer than `threshold` learn nothing about it

const subtle = () => globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------- base64 helpers ----------
export function toB64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromB64(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
export const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

// ---------- AES-GCM (symmetric) ----------
export async function aesEncrypt(keyBytes, plainBytes) {
  const key = await subtle().importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = randomBytes(12);
  const ct = await subtle().encrypt({ name: "AES-GCM", iv }, key, plainBytes);
  return { iv: toB64(iv), ct: toB64(ct) };
}
export async function aesDecrypt(keyBytes, { iv, ct }) {
  const key = await subtle().importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  return new Uint8Array(await subtle().decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ct)));
}
export const aesEncryptText = (keyBytes, text) => aesEncrypt(keyBytes, enc.encode(text));
export const aesDecryptText = async (keyBytes, box) => dec.decode(await aesDecrypt(keyBytes, box));

// ---------- RSA-OAEP (per-heir keypair) ----------
const RSA = { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };

export async function generateHeirKeypair() {
  const kp = await subtle().generateKey(RSA, true, ["encrypt", "decrypt"]);
  return {
    publicJwk: await subtle().exportKey("jwk", kp.publicKey),
    privateJwk: await subtle().exportKey("jwk", kp.privateKey),
  };
}
export async function rsaEncrypt(publicJwk, bytes) {
  const key = await subtle().importKey("jwk", publicJwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  return toB64(await subtle().encrypt({ name: "RSA-OAEP" }, key, bytes));
}
export async function rsaDecrypt(privateJwk, b64) {
  const key = await subtle().importKey("jwk", privateJwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
  return new Uint8Array(await subtle().decrypt({ name: "RSA-OAEP" }, key, fromB64(b64)));
}

// ---------- Shamir secret sharing over GF(256) ----------
// Each share = [x, y_1 .. y_n] where y_i = f_i(x) for a random polynomial f_i of degree threshold-1
// whose constant term is secret byte i. Any `threshold` shares rebuild the secret by Lagrange
// interpolation at x = 0; fewer shares reveal nothing.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x ^= x << 1; // multiply by generator 3 in GF(256) with the AES polynomial 0x11b
    if (x & 0x100) x ^= 0x11b;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);
const gfDiv = (a, b) => {
  if (b === 0) throw new Error("division by zero");
  return a === 0 ? 0 : EXP[(LOG[a] + 255 - LOG[b]) % 255];
};

export function splitSecret(secret, nShares, threshold) {
  if (threshold < 1 || threshold > nShares || nShares > 255) throw new Error("invalid threshold");
  const shares = Array.from({ length: nShares }, (_, i) => {
    const s = new Uint8Array(secret.length + 1);
    s[0] = i + 1; // x coordinate (never 0)
    return s;
  });
  for (let b = 0; b < secret.length; b++) {
    const coeffs = randomBytes(threshold);
    coeffs[0] = secret[b];
    for (const share of shares) {
      const x = share[0];
      let y = 0;
      for (let k = threshold - 1; k >= 0; k--) y = gfMul(y, x) ^ coeffs[k]; // Horner
      share[b + 1] = y;
    }
  }
  return shares;
}

export function combineShares(shares) {
  const len = shares[0].length - 1;
  const out = new Uint8Array(len);
  for (let b = 0; b < len; b++) {
    let acc = 0;
    for (let i = 0; i < shares.length; i++) {
      const xi = shares[i][0];
      let num = 1;
      let den = 1;
      for (let j = 0; j < shares.length; j++) {
        if (i === j) continue;
        const xj = shares[j][0];
        num = gfMul(num, xj); // (0 - xj) == xj in GF(2^8)
        den = gfMul(den, xi ^ xj);
      }
      acc ^= gfMul(shares[i][b + 1], gfDiv(num, den));
    }
    out[b] = acc;
  }
  return out;
}

export const textBytes = (s) => enc.encode(s);
export const bytesText = (b) => dec.decode(b);

// Short, human-comparable fingerprint of an heir's public key (like Signal "safety numbers").
// The planner compares it with the heir in person or by phone before sealing.
export async function keyFingerprint(publicJwk) {
  const digest = new Uint8Array(await subtle().digest("SHA-256", enc.encode(`${publicJwk.e}.${publicJwk.n}`)));
  const hex = Array.from(digest.slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return hex.match(/.{4}/g).join("-");
}
