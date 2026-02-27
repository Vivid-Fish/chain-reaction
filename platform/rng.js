// platform/rng.js — Seeded PRNG with fork support
// Uses mulberry32 (fast, good distribution, small state)
// Fork creates independent sub-streams so consumption order doesn't couple

export function createRNG(seed) {
  let s = seed | 0;

  function next() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    random: next,

    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },

    float(min, max) {
      return min + next() * (max - min);
    },

    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },

    shuffle(arr) {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },

    fork(label) {
      // Derive a new seed from current state + label hash
      let h = s;
      for (let i = 0; i < label.length; i++) {
        h = (h + label.charCodeAt(i)) | 0;
        h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
        h = (h ^ (h >>> 16)) | 0;
      }
      return createRNG(h);
    },
  };
}
