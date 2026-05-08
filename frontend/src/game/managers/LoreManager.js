import worldLoreData from '../data/lore.json';
import pixData from '../data/npcs/pix.json';
import donByteData from '../data/npcs/don_byte.json';
import terminalData from '../data/npcs/terminal_antiguo.json';
import krak7Data from '../data/npcs/krak_7.json';
import archivistaData from '../data/npcs/archivista.json';
import desertorData from '../data/npcs/desertor.json';
import ecoPrimeraData from '../data/npcs/eco_primera.json';
import tejedorData from '../data/npcs/tejedor.json';
import sombra9Data from '../data/npcs/sombra_9.json';
import huerfanoData from '../data/npcs/nexo_huerfano.json';

const ALL_NPCS = [
  pixData, donByteData, terminalData, krak7Data,
  archivistaData, desertorData, ecoPrimeraData,
  tejedorData, sombra9Data, huerfanoData
];

const SEEN_KEY = 'loreSeen';
const PROGRESS_KEY = 'loreNpcProgress';

function getSeenSet() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveSeenSet(seenSet) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seenSet]));
}

function getProgressMap() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return new Map(raw ? JSON.parse(raw) : []);
  } catch { return new Map(); }
}

function saveProgressMap(map) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...map]));
}

export class LoreManager {
  constructor(scene) {
    this.scene = scene;
    this.worldLore = worldLoreData.worldLore;
    this.npcs = ALL_NPCS;
  }

  getWorldLore() {
    return this.worldLore;
  }

  getNextEvent(sector) {
    const seen = getSeenSet();
    const progress = getProgressMap();

    const candidates = [];

    for (const npc of this.npcs) {
      for (let i = 0; i < npc.encounters.length; i++) {
        const enc = npc.encounters[i];
        if (sector >= enc.minSector && sector <= enc.maxSector && !seen.has(enc.id)) {
          candidates.push({ npc, encounter: enc });
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const progA = progress.get(a.npc.id) || 0;
      const progB = progress.get(b.npc.id) || 0;
      if (progA !== progB) return progA - progB;
      return a.encounter.minSector - b.encounter.minSector;
    });

    return candidates[0];
  }

  markEventSeen(eventId) {
    const seen = getSeenSet();
    seen.add(eventId);
    saveSeenSet(seen);
  }

  advanceNpcProgress(npcId) {
    const progress = getProgressMap();
    const current = progress.get(npcId) || 0;
    progress.set(npcId, current + 1);
    saveProgressMap(progress);
  }

  getNpcProgress(npcId) {
    return getProgressMap().get(npcId) || 0;
  }

  getNpcInfo(npcId) {
    return this.npcs.find(n => n.id === npcId) || null;
  }

  getAllNpcs() {
    return this.npcs;
  }

  getTotalSeen() {
    return getSeenSet().size;
  }

  hasEventBeenSeen(eventId) {
    return getSeenSet().has(eventId);
  }

  resetProgress() {
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  }
}
