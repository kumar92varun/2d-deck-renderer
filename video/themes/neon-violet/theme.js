/* Neon with the older violet magenta→cyan haze instead of the navy-black backdrop (was `--bg violet`).
   Everything else comes from neon. */
export default {
  name: "neon-violet",
  extends: "neon",
  palette: { bg: "#120A26" },
  background: [{ name: "neon-haze", variant: "violet" }, { name: "dust-field", count: 140, size: [3, 8], alpha: [0.08, 0.35] }],
};
