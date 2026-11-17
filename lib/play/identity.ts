/**
 * Anonymous identity for the live playground. A visitor is only a random short id for one tab; the animal name and
 * colour are derived from that id on every client, so no free text ever travels over the wire.
 */
export const ADJECTIVES = [
  "Sneaky", "Cosmic", "Fuzzy", "Turbo", "Sleepy", "Jazzy", "Mighty", "Wobbly", "Zesty", "Gentle", "Rowdy", "Plucky",
  "Dapper", "Breezy", "Cheeky", "Nimble", "Bouncy", "Mellow", "Spunky", "Quirky", "Sparky", "Dreamy", "Snazzy", "Clever",
  "Giddy", "Bold", "Lucky", "Peppy", "Groovy", "Frosty", "Sunny", "Wily",
] as const;

export const ANIMALS = [
  { name: "Otter", emoji: "🦦" }, { name: "Fox", emoji: "🦊" }, { name: "Panda", emoji: "🐼" }, { name: "Owl", emoji: "🦉" },
  { name: "Koala", emoji: "🐨" }, { name: "Llama", emoji: "🦙" }, { name: "Penguin", emoji: "🐧" }, { name: "Tiger", emoji: "🐯" },
  { name: "Frog", emoji: "🐸" }, { name: "Hedgehog", emoji: "🦔" }, { name: "Octopus", emoji: "🐙" }, { name: "Raccoon", emoji: "🦝" },
  { name: "Capybara", emoji: "🐹" }, { name: "Narwhal", emoji: "🐋" }, { name: "Sloth", emoji: "🦥" }, { name: "Badger", emoji: "🦡" },
  { name: "Falcon", emoji: "🦅" }, { name: "Gecko", emoji: "🦎" }, { name: "Moose", emoji: "🫎" }, { name: "Walrus", emoji: "🦭" },
  { name: "Bunny", emoji: "🐰" }, { name: "Lemur", emoji: "🐒" }, { name: "Dolphin", emoji: "🐬" }, { name: "Yak", emoji: "🐃" },
  { name: "Flamingo", emoji: "🦩" }, { name: "Beaver", emoji: "🦫" }, { name: "Lynx", emoji: "🐱" }, { name: "Moth", emoji: "🦋" },
  { name: "Turtle", emoji: "🐢" }, { name: "Bat", emoji: "🦇" }, { name: "Crab", emoji: "🦀" }, { name: "Duck", emoji: "🦆" },
] as const;

export const ID_PATTERN = /^[a-z0-9]{8}$/;

/** FNV-1a, 32 bit. Stable and dependency free. */
export function hash32(text: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Murmur-style finaliser so ids that differ in one character still pick very different names and colours. */
function mix(h: number): number {
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

export type Identity = { adjective: string; animal: string; emoji: string; name: string; hue: number; color: string };

export function identityFromId(id: string): Identity {
  const h = mix(hash32(id));
  const h2 = mix(hash32(id, 0x9e3779b9));
  const adjective = ADJECTIVES[h % ADJECTIVES.length];
  const a = ANIMALS[(h >>> 7) % ANIMALS.length];
  const hue = h2 % 360;
  return { adjective, animal: a.name, emoji: a.emoji, name: `${adjective} ${a.name}`, hue, color: `hsl(${hue} 88% 64%)` };
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** A random per-tab id from 8 random bytes. Never stored beyond sessionStorage and never linked to anything else. */
export function idFromBytes(bytes: ArrayLike<number>): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length];
  return out;
}

export function randomId(): string {
  const bytes = new Uint8Array(8);
  try { crypto.getRandomValues(bytes); } catch { for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256); }
  return idFromBytes(bytes);
}

/**
 * The realtime room for a page. The path is hashed so readable (including unlisted) URLs never reach the
 * realtime provider, and the version prefix lets the protocol change without old tabs talking to new ones.
 */
export function roomFor(pathname: string): string {
  const clean = (pathname.split(/[?#]/)[0] || "/").replace(/\/+$/, "").toLowerCase() || "/";
  return `mg1-${hash32(clean).toString(36)}${hash32(clean, 0x1234567).toString(36)}`;
}
