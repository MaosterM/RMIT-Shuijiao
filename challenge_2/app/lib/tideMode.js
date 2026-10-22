// TideCloak is used whenever `npm run init` has written a real adapter config to tidecloak.json.
// Otherwise the app runs in OFFLINE DEMO MODE (simulated login/encryption, clearly labelled).
import tcConfig from "../tidecloak.json";

export const TIDE_ENABLED = Boolean(tcConfig && tcConfig.realm);
export { tcConfig };
