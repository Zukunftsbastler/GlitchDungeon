# The Glitch Dungeon – Analyse & Optimierungs-Roadmap

> Rigorose Prüfung des Spiels über alle gängigen Bewertungskategorien, mit priorisierter
> Rangfolge der sinnvollsten Änderungen. Stand: Juli 2026, Basis: `index.html` (~1725 Zeilen),
> `netlify/functions/leaderboard.js`.
>
> Kontext: Das Spiel ist bewusst im Code-Golfing-/Demoscene-Stil in einer Datei gehalten,
> damit es vollständig in das Context Window einer Coding-KI passt. Alle Vorschläge
> respektieren diese Constraint – nichts davon erfordert Frameworks, Assets oder ein Build-System.

---

## TL;DR – Priorisierte Rangfolge

| Rang | Maßnahme | Kategorie | Aufwand | Wirkung |
|------|----------|-----------|---------|---------|
| 1 | **Kritische Bugfixes** (Chaos-Crash, Boss-Scaling-Stopp, Leaderboard-Gear, Rarity-Inflation) | Stabilität/Balance | Klein | Sehr hoch |
| 2 | **Late-Game-Variation: Level-Mutatoren + Biom-Zyklus 2** | Content-Vielfalt | Mittel | Sehr hoch |
| 3 | **Generative Musik** (WebAudio, pro Biom) | Audio | Mittel | Sehr hoch |
| 4 | **Dungeon-Struktur-Generator** (Räume, Special Rooms, Fallen, Events) | Content-Vielfalt | Mittel–Groß | Sehr hoch |
| 5 | **Elite-Monster & Doppel-Adjektive** | Content-Vielfalt | Klein | Hoch |
| 6 | **Unique-Items & aktive Gegenstände** | Loot-Vielfalt | Mittel | Hoch |
| 7 | **Skill-Wahl / Klassen-Ausbau** (2.–3. Fähigkeit pro Klasse) | Gameplay-Tiefe | Mittel | Hoch |
| 8 | **Sound-Toggle + Lautstärkeregler** (Roadmap-Punkt) | UX/Audio | Klein | Mittel |
| 9 | **Google Fonts lokal einbetten** (DSGVO + Offline) | Recht/Technik | Klein | Mittel |
| 10 | **Seeded Runs / Daily Challenge** | Meta/Retention | Mittel | Hoch |
| 11 | **Barrierefreiheit** (Photosensitivität, Farbenblindheit, Schriftgrößen) | Accessibility | Klein–Mittel | Mittel |
| 12 | **Save-Versionierung + Export/Import** | Technik/Persistenz | Klein | Mittel |
| 13 | **Mobile-Feinschliff** (D-Pad, Tooltips, Haptik) | UX Mobile | Mittel | Mittel |
| 14 | **Server-Aufräumen** (tote Kommentare, Rate-Limit-Realität) | Code-Qualität/Security | Klein | Niedrig–Mittel |

Begründung der Reihenfolge: Rang 1 sind billige Fixes mit direktem Qualitätsgewinn (ein Biom crasht aktuell reproduzierbar). Rang 2–4 adressieren exakt die benannte Schwäche – zu wenig Variation in späten Ebenen – dort steckt der größte Spielspaß-Hebel. Musik (Rang 3) ist das auffälligste fehlende Sinnes-Feature. Alles ab Rang 8 ist Politur.

---

## 1. Stabilität & Bugs (KRITISCH – zuerst beheben)

### 1.1 Chaos-Biom crasht beim Glitch ⚠️
`shuffleUI()` greift auf `$('dpad')` zu – **ein Element mit dieser ID existiert nicht im DOM**
(`index.html:1495`, Rücksetzung `index.html:1504`). Beim ersten Realitätsbruch im Chaos-Biom
(Tiefe 46–49) wirft `dpad.style.transform` einen `TypeError`, der `turnLogic()` mitten in der
Ausführung abbricht: Map-Glitch, Glitch-Spawns und `updateUI()` laufen für diesen Zug nicht mehr.
**Fix:** `let dpad=$('dpad'); if(dpad)…` oder die beiden Zeilen entfernen.

### 1.2 Boss-Scaling endet bei Tiefe 50 ⚠️
`startBossLevel()` skaliert Bosse über `hpMul=1+bossIdx*0.25` (`index.html:592`), aber
`bossIdx=Math.floor((lvl-1)/5)%BOSSES.length` ist modulo 10. Der Knochenfürst auf **Tiefe 55 hat
exakt dieselben Werte wie auf Tiefe 5** (150 HP), während der Spieler um Größenordnungen stärker
ist. Ab Tiefe 50 sind Bosse triviale Formalitäten.
**Fix:** Skalierung an `lvl` statt an `bossIdx` koppeln, z.B. `hpMul=1+((lvl-5)/5)*0.25`
(entspricht bis Tiefe 50 dem Status quo, wächst danach weiter).

### 1.3 Leaderboard-Gear-Anzeige ist immer leer
`packGear()` (`index.html:1337`) vergleicht `RARITIES.findIndex(r=>r.col===e.col)` – aber `e.col`
ist die **Material-Farbe** (`mat.c`, z.B. `#a65`), die Rarity-Farbe steht in `e.rarityCol`.
`findIndex` liefert immer `-1`, die Bestenliste zeigt für alle Spieler „Keine"-Gear-Punkte.
**Fix:** `e.rarityCol` vergleichen (oder besser: den Rarity-Index beim Item speichern).

### 1.4 Rarity-Inflation bei Bodenloot
In `genItem()` (`index.html:1275`) wächst `rMax=2+lvl*0.7+maxLvl*0.2` linear. Ab Tiefe ~15–20
würfelt praktisch jeder Bodenfund im obersten Rarity-Bereich; „EWIG" ist im Midgame schon
Massenware. Die 11 Seltenheitsstufen verlieren dadurch genau die Spannung, für die sie gebaut wurden.
**Fix:** Verteilung wie im Shop (`pickTier()`-Gauß) verwenden statt Uniform-Roll mit wachsendem Max –
die Logik existiert bereits, sie muss nur geteilt werden.

### 1.5 Glitch-Monster spawnen ohne Positionsprüfung
`index.html:1067`: Glitch-Spawns nutzen rohes `rnd(1,GRID-2)` – sie können **in Wänden oder direkt
auf dem Spieler** landen. Zusätzlich haben sie `bits:0`, d.h. das gefährlichste Monster des Spiels
gibt keinerlei Belohnung (falls gewollt, im Grimoire/Tooltip kommunizieren).
**Fix:** `getFreeNear()`/`getRandomArenaPos()`-artige Suche verwenden.

### 1.6 Kleinere Bugs (Sammelposten, je 1–5 Zeilen)
- **Shop-Statuszeile zeigt veraltete Werte:** `drawShop()` (`index.html:1251`) rendert
  `meta.maxHp`/`meta.dmg` – Passives wirken aber auf `game.stats`. Anzeige weicht von realen
  Werten ab. → `game.stats.maxHp` etc. anzeigen.
- **Patrouillierende Gegner können auf das Spielerfeld laufen:** Der Random-Walk
  (`index.html:914`) prüft via `isBlocked()` nur Wände und andere Gegner, nicht den Spieler →
  Gegner/Spieler-Überlappung möglich.
- **`ctx.fillStyle='#pink'`** beim Ratten-Sprite (`index.html:1192`) ist keine gültige Farbe –
  der Schwanz erbt die Körperfarbe. → `'pink'` ohne `#`.
- **Toter Code:** Der `vis==='POTION'`-Trink-Pfad in `inv_action()` (`index.html:1578`) ist
  unerreichbar – ins Inventar gelangen nur `genItem`-Equipment-Items ohne `vis`-Feld.
- **`escapeHtml()` escapt keine Anführungszeichen** (`index.html:214`), wird aber in
  `title="${name}"`-Attributen benutzt (`index.html:1366`). Aktuell durch Server-Sanitizing
  gedeckt – als Defense-in-Depth `"`→`&quot;` ergänzen.
- **Kein Versionsfeld im Save-Format** (`save()`, `index.html:1333`) – jede zukünftige
  Strukturänderung riskiert kaputte Bestands-Saves. → `v:1` aufnehmen + Migrationszweig.

---

## 2. Content-Vielfalt: Late Game (Kernproblem, wie vom Autor benannt)

Der strukturelle Befund: **Ab Tiefe 50 wiederholt sich das Spiel exakt.** Biome
(`(lvl-1)/5 % 10`), Bosse (modulo 10, s. Bug 1.2) und Map-Generatoren loopen; nur Monster-HP
skaliert weiter. Gleichzeitig wächst die Gegnerzahl `2+(level/2|0)` unbegrenzt – auf Tiefe 60
stehen 32 Gegner auf einem 20×20-Grid, was eher Chaos als Herausforderung erzeugt.

### 2.1 Level-Mutatoren (bester Aufwand/Nutzen-Faktor)
Ein Array aus ~15–20 Modifikatoren, von denen ab Tiefe ~10 pro Ebene 1 (später 2–3) zufällig
aktiv sind und beim Level-Announcement angezeigt werden:

```js
const MUTATORS=[
 {n:"Finsternis",     d:"Lichtradius halbiert",           f:s=>s.lightMul=0.5},
 {n:"Blutmond",       d:"Gegner +50% Schaden, +50% Gold", f:s=>{s.eDmg=1.5;s.loot=1.5}},
 {n:"Zeitriss",       d:"Glitch-Timer -40%",              f:s=>s.glitchMul=0.6},
 {n:"Horde",          d:"Doppelte Gegner, halbe HP",      f:s=>{s.cnt=2;s.eHp=0.5}},
 {n:"Elitejagd",      d:"Nur Elite-Gegner, Loot +1 Tier", f:s=>{s.elite=1;s.tier=1}},
 {n:"Nebelwelt",      d:"Gegner-Tooltips verborgen",      f:s=>s.fog=1},
 {n:"Schatzkammer",   d:"3x Truhen, kein Schlüssel-Spawn bis Glitch 2",f:s=>s.chests=3},
 // … Gift-Regen, Doppel-Boss, Pazifisten-Bonus, invertierte Steuerung (kurz), …
];
```

Das ist der mit Abstand billigste Weg, aus denselben 10 Biomen hunderte gefühlt
unterschiedliche Ebenen zu machen – und es passt thematisch perfekt zum Glitch-Narrativ
(„die Realität degeneriert mit der Tiefe").

### 2.2 Biom-Zyklus 2+ („korrumpierte" Biome)
Ab dem zweiten Durchlauf (`Tiefe > 50`) bestehende Biome mit einem Overlay versehen statt sie
identisch zu wiederholen: invertierte Palette, gemischte Monster-Pools zweier Biome, kombinierte
Tile-Effekte (Eis **und** Lava in einer Ebene), permanenter Mini-Glitch. Die Daten dafür
(Paletten, `f(x,y)`, `mobs`, `TILE_FX`) existieren alle schon – es ist reine Kombinatorik:

```js
if(cycle>0){ B={...B, n:"KORRUMPIERTE "+B.n,
  mobs:[...B.mobs,...BIOMES[(game.biome+cycle)%10].mobs],
  c:B.c.map(invertHue), fx:'GLITCHY'}; }
```

### 2.3 Gegnerzahl deckeln, Qualität statt Quantität
`cnt=Math.min(12, 2+(level/2|0))` und den Überschuss in Elite-Status umwandeln (siehe 2.4).
32 Trash-Mobs auf 400 Feldern sind kein Härtegrad, sondern Rauschen.

### 2.4 Elite-Monster & Doppel-Adjektive
Das Adjektiv-System (`ADJ_DATA`, 12 Einträge) ist bereits multiplikativ gebaut – zwei Adjektive
zu stapeln („Brennender Riesiger Golem": 2.0×HP · 1.5×DMG · beide FX) kostet ~10 Zeilen und
vergrößert den effektiven Monsterraum von 192 auf >2000 Kombinationen. Elite-Regeln:
ab Tiefe 15 z.B. 15% Chance, visuell durch Aura/Größe markiert, garantierter Item-Drop.
Grimoire kann Doppel-Adjektive als eigene Sammelkategorie zählen (Achievements gratis dazu).

### 2.5 Boss-Varianz
- Boss-Scaling-Fix (1.2) zuerst.
- Ab Zyklus 2: Bosse erhalten ein zufälliges **zweites** Verhaltens-Modul aus dem bestehenden
  Set (`AURA`+`CHARGE`, `SPLIT`+`TRAIL` …) – die Mechaniken sind bereits sauber getrennt
  implementiert (`bossAct()`), Kombination ist fast gratis.
- Optional: Mini-Boss (Elite mit Boss-Mechanik `mech:` gibt es schon bei OOZE/GAZER/GARGOYLE/
  BASILISK) alle 5 Ebenen zwischen den Bossen.

---

## 3. Audio: Generative Musik (fehlt komplett)

Aktuell existieren nur 7 Oszillator-SFX (`sfx()`, `index.html:1652`). Ein generativer
Musik-Layer im Demoscene-Stil ist mit ~80–120 Zeilen WebAudio machbar und braucht null Assets:

**Architektur-Vorschlag:**
1. **Ein Master-`GainNode`** (auch gleich für den Sound-Toggle nutzbar, siehe Rang 8).
2. **Pro Biom ein Musik-Profil** direkt in `BIOMES` ergänzen – Skala, Tempo, Wellenform,
   Filter-Charakter:
   ```js
   // in BIOMES[i]: mus:{scale:[0,3,5,7,10], root:110, bpm:60, wave:'triangle', dark:0.8}
   ```
   Katakomben = dorisch/langsam, Eishöhle = hohe Glockentöne + langes Delay, Vulkan =
   tiefes Brummen + rhythmisches Rauschen, Chaos = Zufallsskala mit Detune.
3. **Sequencer via `setInterval`/Lookahead**: Bassdrone (gehaltener Ton auf `root`),
   dünne Arpeggio-Stimme (zufällige Skalentöne, Wahrscheinlichkeit ~40% pro Step),
   Perkussion aus gefiltertem Noise-Buffer.
4. **Dynamik an den Spielzustand koppeln** – das ist der eigentliche Gewinn:
   - `game.timers.glitch < 5` → Tempo +20%, Detune/Dissonanz einblenden
   - Boss-Level → zusätzliche tiefe Oktave + Halbton-Ostinato
   - `game.p.hidden` (Stealth) → alles außer Drone wegfiltern (Lowpass)
   - Glitch-Event → 1 Takt Bitcrush (WaveShaper) auf dem Master
5. **Autoplay-Policy beachten:** Start erst nach der ersten User-Geste – der bestehende
   `au()`-Hook (`index.html:202`) ist genau der richtige Ort.

Aufwand: überschaubar; Wirkung: verwandelt die Atmosphäre des gesamten Spiels und zahlt direkt
auf den Demoscene-Anspruch ein („alles generativ").

---

## 4. Dungeon-Generierung & Struktur

Aktuell: pro Biom eine Noise-Formel `f(x,y)` + zwei `carvePath`-Linien (Start→Schlüssel→Exit).
Das erzeugt zuverlässig lösbare, aber strukturell gleichförmige Ebenen – Räume, Engstellen,
Landmarken und „Orte" fehlen.

- **4.1 Zweiter Generator-Typ (Räume + Korridore):** Klassischer BSP- oder
  Random-Rooms-Generator (~40 Zeilen) als Alternative, pro Ebene zufällig Noise- oder
  Raum-Modus. Labyrinth-Biom könnte einen echten Maze-Algorithmus (rekursives Backtracking)
  bekommen statt der Sinus-Formel.
- **4.2 Special Rooms / Points of Interest** (je ~10–20 Zeilen):
  - **Schrein:** Buff gegen Preis (HP-Opfer → Permanent-Bonus für den Run)
  - **Verschlossene Schatzkammer:** Wand mit hoher Härte (Bergbau-Stat wird endlich wertvoll!)
  - **Glitch-Riss:** freiwilliger Teleport in eine zufällige Ebene ±3
  - **Gefangenen-Käfig:** Mini-Eskorte oder Belohnungsentscheidung
- **4.3 Fallen:** Druckplatten (sichtbar für Schurken!), Pfeilfallen, Glitch-Minen – gibt dem
  Rogue-Stealth eine zweite Dimension und den Biomen mehr taktische Textur.
- **4.4 Run-Events:** Zwischen Ebenen mit kleiner Wahrscheinlichkeit ein Text-Event mit
  2 Optionen (Canvas-Box existiert schon als Tutorial-Box, `index.html:1156`). Sehr billig,
  hoher Varianz-Gewinn.

---

## 5. Loot- & Item-System

Solide Basis (11 Typen × 10 Materialien × 11 Rarities × 7 Suffixe), aber alles ist
**passiv-statistisch** – kein Item verändert, *wie* man spielt.

- **5.1 Unique-Items** (~8–12 Stück, handgeschrieben, an Rarity „EWIG" oder Boss-Drops
  gekoppelt) mit regelbrechenden Effekten: „Glitchklinge" (Teleport hinter das Ziel),
  „Spiegelharnisch" (reflektiert den REFLECT-Boss-Effekt zurück), „Uhr des Händlers"
  (Shop erscheint alle 3 Ebenen), „Leerenstiefel" (immun gegen Tile 8, aber −25% max HP).
- **5.2 Aktive Konsumables im Inventar:** Aktuell existiert nur der Bannkreis (Scroll-Counter).
  Tränke/Bomben/Teleport-Rollen als echte Inventar-Items geben dem Rucksack (und dem
  Rucksack-Upgrade!) mehr Bedeutung. Der tote POTION-Pfad in `inv_action()` (Bug 1.6) ist
  quasi die vorbereitete Steckdose dafür.
- **5.3 Zweiter Suffix ab hoher Rarity** („des Blutes **und** der Zeit") – triviale Erweiterung
  von `genItem()`, spürbare Endgame-Loot-Tiefe.
- **5.4 Set-/Synergie-Boni:** Material-Gleichheit über 3 Slots (voll Obsidian → +10% Krit)
  belohnt gezieltes Sammeln statt reinem Statvergleich.

---

## 6. Klassen & Spielstile

3 Klassen × 1 Skill ist die dünnste Achse des Spiels (auch laut eigener Roadmap).

- **6.1 Skill-Wahl bei Boss-Sieg:** Nach jedem Boss 1 aus 2 Skill-Optionen wählen
  (Krieger: Schildwall/Erdbeben; Schurke: Rauchbombe/Giftklinge; Magier: Frostnova/Blink).
  Nutzt den bestehenden `triggerBossVictory()`-Screen und gibt Boss-Kills eine Belohnung
  jenseits von Loot.
- **6.2 Klassen-Quirks vertiefen:** Krieger könnte Wände als Waffe nutzen (Wand auf Gegner
  stürzen), Schurke Fallen entschärfen/nutzen, Magier Tile-Effekte umwandeln (Lava einfrieren).
  Verzahnt Klassen mit den Biomen – aktuell spielen sich alle Biome für alle Klassen gleich.
- **6.3 Vierte Klasse** (später): z.B. „Glitchling" – nutzt den Glitch-Timer aktiv als
  Ressource. Erst sinnvoll, wenn 6.1 steht.

---

## 7. Balance (Zahlenwerk)

- **7.1 Rarity-Kurve Bodenloot** → siehe Bug 1.4 (dringend).
- **7.2 Gegnerzahl-Cap** → siehe 2.3.
- **7.3 Boss-Scaling** → siehe Bug 1.2.
- **7.4 Reroll-Kosten `*=3`** (`index.html:1661`): 10→30→90→270 ist steil; ×3 bestraft
  Shop-Interaktion schnell prohibitiv. ×2 mit Cap wäre gnädiger; alternativ Reset pro Ebene
  dokumentieren (passiert de facto durch `game.rerollCost=10` bei GameOver/Bossieg).
- **7.5 Tile 8 (Leere) = Sofort-Tod** ohne Rettungswurf ist der härteste Effekt des Spiels und
  trifft auch neue Spieler im Leere-Biom (Tiefe 36+). Vorschlag: einmal pro Ebene
  „Kante erwischt" (1 Zug festhängen + Stamina-Verlust), erst danach tödlich – oder
  Fallschaden + Teleport zum Start.
- **7.6 Glitch-Spawns ohne Gold** (Bug 1.5): Entweder Belohnung geben oder als bewusste
  „Flieh!"-Mechanik im Tooltip kennzeichnen.

---

## 8. UX & UI

- **8.1 Sound-Toggle + Volume** (eigener Roadmap-Punkt): Mit dem Master-Gain aus Abschnitt 3
  fast gratis. Persistenz in localStorage.
- **8.2 Todes-Screen ohne Kontext:** Beim Game Over erscheint sofort der Shop – es fehlt eine
  kurze Run-Zusammenfassung (Todesursache, Kills, Gold, neue Grimoire-Einträge, Bestwert-Vergleich).
  Roguelike-Standard, wichtig für die „noch ein Run"-Schleife.
- **8.3 `prompt()`/`alert()`/`confirm()`** (`index.html:488,1334,1335`) brechen den sonst
  liebevollen Stil und blockieren auf Mobile teils unschön. Eigene DOM-Dialoge im Spiel-Look
  (die Inventar-Overlay-Infrastruktur existiert).
- **8.4 Shop-Anzeige-Bug** → siehe 1.6 (falsche Statwerte).
- **8.5 Gegner-Absichten:** Bei `CHARGE`/`RANGED`-Mobs wird die Vorwarnung nur als Partikel
  angezeigt; ein Telegraph-Overlay (wie beim Boss-`chargePreview`) auch für normale Mobs würde
  die Lesbarkeit spürbar verbessern.

---

## 9. Onboarding & Tutorial

Das Tutorial ist überraschend stark (klassenspezifische Räume, Gabel-Warnung, Trigger-System) –
beste Einzelkomponente des Spiels. Kleinigkeiten:

- Statuseffekte (Gift/Brand/Fluch/Eis) werden nirgends erklärt, tauchen aber ab Ebene 1 auf.
  Ein Grimoire-Tab „Effekte" oder Erst-Kontakt-Hinweis (wie `tutShownExhaust`) würde reichen.
- Diagonal-Angriffs-Asymmetrie („Feinde greifen diagonal an – du nicht") ist die wichtigste
  und am leichtesten überlesene Regel – verdient eine visuelle Demo statt nur Text.

---

## 10. Barrierefreiheit & Gesundheit

- **10.1 Photosensitivität:** Astral-/Chaos-Tiles und der Chaos-Glitch flackern mit
  Frame-Frequenz-Zufallsblitzen (`index.html:1091,1096`). Ein „Reduzierte Effekte"-Toggle
  (Flackern → sanftes Pulsieren) ist eine kleine Änderung mit realem Schutzwert.
- **10.2 Farbenblindheit:** Gift (grün) vs. Heilung (grün), HP- vs. Stamina-Balken – Symbole
  existieren teils schon (☠️/🔥), konsequent auf allen Statusanzeigen doppelt kodieren.
- **10.3 Schriftgrößen:** 9–11px in Grimoire/Passiv-Slots ist auf Mobile grenzwertig.
- **10.4 Keine reine Tastatur-Bedienung des Inventars** (nur Maus/Touch).

---

## 11. Technik & Performance

Grundsätzlich sauber für den Ansatz: ein 640×640-Canvas, 20×20-Grid, Light-Layer als
Offscreen-Canvas, keine Abhängigkeiten. Anmerkungen:

- **11.1 `Math.random()` im Renderpfad** (Tile-Glitzer, `index.html:1088ff`): unkritisch für
  Performance, aber verhindert deterministische Frames. Wichtiger:
- **11.2 Kein seedbarer RNG.** Ein 5-Zeilen-Mulberry32 statt `Math.random()` in der
  *Generierungs*-Logik (nicht im Renderer) ermöglicht: reproduzierbare Dungeons, Seed-Sharing,
  **Daily Challenge** (alle Spieler, derselbe Seed, eigenes Leaderboard – perfekte Synergie mit
  der bestehenden Netlify-Infrastruktur). Das ist der Retention-Hebel Nr. 1 (Rang 10).
- **11.3 Google-Fonts-`@import`** (`index.html:8`) widerspricht „ohne externe Abhängigkeiten",
  bricht Offline-Play – und ist für eine deutsche Seite mit Impressum ein reales
  **DSGVO-Risiko** (LG München I, IP-Übertragung an Google). → WOFF2 als Base64 einbetten oder
  auf Systemfonts mit `font-family`-Fallback ausweichen.
- **11.4 Save-Format ohne Version** → siehe 1.6.
- **11.5 Datei-Organisation:** Falls die Context-Window-Constraint es erlaubt: Daten-Blöcke
  (BIOMES/BESTIARY/ITEM_POOL/BOSSES/TUT) klar von der Engine trennen (Kommentar-Banner genügen).
  Erleichtert genau den KI-gestützten Workflow, für den das Projekt gebaut ist.

---

## 12. Sicherheit & Backend

Die Pentest-Runde hat das meiste abgedeckt (Sanitizing, CORS-Whitelist, Rate-Limit,
Server-Timestamp, UID-Dedupe). Rest:

- **12.1 `leaderboard.js` enthält LLM-Arbeitsnotizen als Kommentare** (Zeilen 104–122, 203–233:
  „Let's check the client code…", „I MUST fix this") plus die tote, nie aufgerufene
  `validateData()`-Funktion. Sollte vor jedem Weiterbau aufgeräumt werden – es ist öffentlich
  deploybarer Code.
- **12.2 Rate-Limiting ist nur kosmetisch:** In-Memory-`Map` + `setInterval` überlebt
  Lambda-Cold-Starts nicht und gilt pro Instanz. Für echtes Limiting Redis (`INCR`+`EXPIRE`)
  nutzen – der Client ist ohnehin verbunden. Kein akutes Risiko, aber falsche Sicherheit.
- **12.3 Score-Plausibilität:** Der Server validiert Typen/Ranges, aber nicht Plausibilität
  (Tiefe 999 mit 0 Kills passiert clientseitig trivial). Einfache Heuristik: `depth`
  vs. `kills`-Verhältnis, Mindest-Züge pro Tiefe. Bei einem Spaß-Leaderboard nice-to-have.
- **12.4 `escapeHtml`-Quotes** → siehe 1.6.

---

## 13. Meta-Progression & Retention

- **13.1 Achievements sind rein passiv** – sie schalten nichts frei. Schon 2–3 Freischaltungen
  (Startgold-Bonus, kosmetische Heldenfarbe, 4. Klasse hinter „Kernsucher") würden den
  bestehenden 16 Erfolgen Zugkraft geben. (Roadmap-Punkt „Freischaltbares".)
- **13.2 Daily Challenge** → siehe 11.2.
- **13.3 Run-Statistik-Historie** (letzte 10 Runs lokal) füttert den Todes-Screen (8.2).
- **13.4 „Der Kern":** Das Narrativ verspricht ein Ziel („Wirst du den Kern erreichen?") –
  aktuell gibt es keins. Ein echtes Finale auf Tiefe 100 (Spezial-Boss + Abspann + NG+-Modus)
  gibt dem Endlos-Spiel einen Ankerpunkt und macht die Tiefe-Leaderboards bedeutungsvoller.

---

## Anhang: Was bereits gut ist (nicht anfassen)

- **Tutorial-System** mit klassenspezifischen Übungsräumen und Kontext-Triggern
- **Energie-basiertes Zugsystem** (Speed als echte Taktik-Ressource)
- **Adjektiv×Monster-Matrix + Grimoire** als Sammelmechanik
- **Boss-Mechanik-Module** – sauber getrennt und dadurch kombinierbar (siehe 2.5)
- **Stealth-/Noise-Modell** mit Wanddämpfung (`checkAggro`, `index.html:860`) – ungewöhnlich
  ausgefeilt für die Codegröße
- **Merkmodus im Shop** (Items gegen Gebühr über den Tod hinaus reservieren) – cleveres,
  originelles Design
- **Security-Härtung** des Leaderboards (nach Pentest) auf gutem Stand

---

*Erstellt durch Code-Review der Ranges `index.html:1–1725`, `netlify/functions/leaderboard.js:1–383`, README, pentest/-Unterlagen.*
