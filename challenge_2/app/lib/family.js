// Demo family. Usernames must match the Tide accounts you create (see challenge_2/SETUP.md).
// Roles: a user is the planner/heir if they have the realm role "planner"/"heir" in TideCloak,
// OR (fallback for a quick demo setup) their username is listed here.
export const FAMILY = {
  threshold: 2, // approvals needed to open the vault (2 of 2 by default)
  planner: { username: "limahkow", name: "Mr Lim Ah Kow" },
  heirs: [
    { username: "limweijie", name: "Lim Wei Jie", relation: "son" },
    { username: "limmeiling", name: "Lim Mei Ling", relation: "daughter" },
  ],
};

export const TIDE_TAG = "message"; // the template realm grants _tide_message.selfencrypt/.selfdecrypt to every user

export const DOC_TYPES = ["Will (Wasiat)", "IC (MyKad)", "Land title (Geran)", "Bank statement", "EPF / KWSP statement", "Insurance policy", "Other"];

export function roleOf(username, realmRoles = []) {
  const u = (username || "").toLowerCase();
  if (realmRoles.includes("planner") || u === FAMILY.planner.username) return "planner";
  if (realmRoles.includes("heir") || FAMILY.heirs.some((h) => h.username === u)) return "heir";
  return "guest";
}

export function displayName(username) {
  const u = (username || "").toLowerCase();
  if (u === FAMILY.planner.username) return FAMILY.planner.name;
  return FAMILY.heirs.find((h) => h.username === u)?.name || username;
}
