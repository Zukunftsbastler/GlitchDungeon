# Balancing-Refactor: Klassen vs. Monster-Progression

> Stand: Juli 2026. Detail-Sichtung der drei Klassen, Gegenüberstellung mit der
> Monster-Schwierigkeitskurve, Diagnose der Grind-Probleme und die umgesetzten Änderungen.

---

## 1. Diagnose: Warum es sich wie Grind anfühlte

### 1.1 Die Ausdauer-Ökonomie widersprach der Krieger-Fantasie (Hauptproblem)

**Ist-Zustand vor dem Refactor:**

| | Krieger | Schurke | Magier |
|---|---|---|---|
| Ausdauer-Pool | **10** | 15 | 8 |
| Kosten pro Angriff | 3 (pauschal für alle) | 3 | 3 |
| Regeneration | +1/Zug – **nur bei Untätigkeit** | +1 | +1 |

Der Krieger – die designierte Dauerkampf-Klasse – hatte den *zweitkleinsten* Pool und
zahlte dieselben Angriffskosten wie alle anderen. Ergebnis: **3 Schläge, dann ~9 Züge
warten** (die Regeneration pausierte in jedem Zug mit Aktion, `game.exert`). Genau das
beschriebene „außer Puste"-Gefühl.

### 1.2 Monster-HP wuchs schneller als Spieler-Schaden

Monster-HP-Formel: `(2 + pow·2.5 + √pow·2) · st[0]` mit `pow ≈ Tiefe`.
Die Eishöhle (Biom 2, Tiefe 6–9) hat zudem einen reinen **Tank-Pool**:
Golem (×2.5 HP), Elementar (×2.0), Gargoyle (×1.6), Schatten (×1.2).

| Tiefe 6 | Monster-HP (Golem) | Krieger-Schaden (typisch) | Schläge nötig | Ausdauer nötig |
|---|---|---|---|---|
| **Vorher** | ~55 | ~7–8 | 7–8 | 21–24 (Pool: 10!) |
| **Nachher** | ~35–43 | ~11–15 | 3–4 | 3–4 (Pool: 20, Kampf-Regen) |

Items skalierten zu flach, um das aufzufangen – die Progression fühlte sich wie
Stat-Grind ohne Macht-Zuwachs an.

### 1.3 Zu viele Gegner, keine Raum für Klassen-Strategie

Alte Formel `2 + Tiefe/2`: schon Tiefe 1 hatte 2 Gegner, Tiefe 8 hatte 6.
Bei der Dichte gibt es keine Situationen, in denen der Schurke schleichen, der
Magier Distanz halten oder der Krieger sich gezielt umzingeln lassen kann –
es ist immer überall Kontakt.

### 1.4 „In der Wand gefangen"

Zwei konkrete Ursachen im Code:
1. Der Spieler behält beim Levelwechsel seine Position (das alte Exit-Feld), aber der
   Verbindungspfad wurde **immer von Ecke (1,1)** aus gegraben – die Spielerposition
   konnte komplett eingemauert sein.
2. `getFree()` in `spawnActors` akzeptierte Positionen **in Wänden mit HP ≤ 5**
   (für Gegner, Items und Fackeln).

---

## 2. Umgesetzte Änderungen

### 2.1 Klassen-Refactor (Kern: Ausdauer-Ökonomie + Schadensmultiplikator)

| | Krieger | Schurke | Magier |
|---|---|---|---|
| HP | 20 → **26** | 12 | 8 → **9** |
| Ausdauer | 10 → **20** | 15 → **16** | 8 |
| Mana | – | – | 20 → **22** |
| Speed | 8 (langsam, gewollt) | 15 | 10 → **9** |
| **Angriffskosten** (neu: `atkCost`) | **1** | **2** | **3** |
| **Ausdauer-Regen** (neu pro Klasse) | **2/Zug, Kampf: 1** | 1.5 (Kampf: 0) | 1 (Kampf: 0) |
| **Schadensmultiplikator** (neu: `dmgMul`) | **×1.4** | ×1.1 | ×0.7 |

- **Krieger:** Basisangriffe sind jetzt netto ~kostenlos (Kosten 1, Kampf-Regen 1) –
  er geht im normalen Kampf **nie** mehr aus der Puste. Ausdauer ist seine Ressource
  für Wirbelwind (5), Wände (2) und gegen Eisig-Debuffs (−5). ×1.4-Schaden liefert
  die „schnell viel Schaden"-Fantasie.
- **Schurke:** **Hinterhalt ist jetzt Basis-Fähigkeit** (vorher hinter der
  Giftklinge-Spezialisierung versteckt): Angriff aus der Tarnung = **×2.5 Schaden**,
  macht sichtbar. Der Loop „anschleichen → Burst → verschwinden" funktioniert ab
  Minute 1; Unsichtbarkeit bricht Aggro sofort (war schon so). Die
  Giftklinge-Spezialisierung vergiftet zusätzlich und erstattet 3 Ausdauer.
- **Magier:** Nahkampf bewusst schwach (×0.7) – Distanz ist Pflicht. Der Feuerball
  skaliert neu mit `Schaden + spellDmg·3.5` (vorher `·3` auf schwächerer Basis),
  Splash = 40 % davon. Stab-Items geben spellDmg 3 statt 2.

### 2.2 Gegnerzahl (nach Vorgabe)

```
Tiefe 1–2:   1 Gegner
Tiefe 3–9:   2–4 (1 + Tiefe/3, Cap 4)
Tiefe 10+:   +1 alle 4 Tiefen, Cap 10
Mutatoren (Horde, Elitejagd, …) skalieren darauf; absolutes Cap 14.
```
Weniger, dafür stärkere und lohnendere Kämpfe – Eliten, Bosse und Glitch-Spawns
liefern die Dichte-Spitzen.

### 2.3 Progression über Items (steilere Item-Kurve, flachere Monster-Kurve)

- Monster-HP: `pow·2.5` → **`pow·1.8`** (≈ −25 % im Mid-Game, Tank-Pools spürbar).
- Golem ×2.5 → **×2.0**, Elementar ×2.0 → **×1.7** (entschärft speziell die Eishöhle).
- Waffen-Grundwerte: Dolch 2→**3**, Schwert 3.5→**4.5**, Axt 4→**5.5**,
  Hammer 4.5→**6**, Stab spellDmg 2→**3**.
- **Material-Floor nach Tiefe**: ab Tiefe 8 kein Holz mehr, ab 16 min. Stahl,
  ab 24 min. Obsidian … (Cap Adamant) – Bodenloot wird nie mehr „Müll-Roll".
- Startwaffen: Krieger/Schurke dmg 2→**3**, Magier +spellDmg 1.

### 2.4 Spawn-Sicherheit (Bugfixes)

- Verbindungspfad wird jetzt **von der echten Spielerposition** aus gegraben
  (nicht von Ecke 1,1) + Freiraum-Tasche (Spieler-Feld + 4 Nachbarn) beim Levelstart.
- `getFree()` lehnt **jede** Wand ab (vorher: Wände mit HP ≤ 5 erlaubt) und
  blockt Spieler-/Schlüssel-/Exit-Felder.
- **Anti-Einmauerung beim Glitch**: schließt der Realitätsbruch alle 4 Nachbarfelder,
  reißt er sofort eines wieder auf („RISS").

---

## 3. Klassen-Strategie-Matrix (Soll-Zustand, jetzt erreichbar)

| Klasse | Gewollte Situation | Werkzeuge dafür |
|---|---|---|
| **Krieger** | „Viele kommen" – laut sein, Gegner ziehen, im Pulk stehen | noise 10 zieht Aggro, 26 HP + Rüstung + Def-Klassenbonus tanken, atkCost 1 + Kampf-Regen für Dauerdruck, Wirbelwind belohnt Umzingelung |
| **Schurke** | „Keiner kommt" – ungesehen bleiben, Ziele einzeln legen | noise 2, Speed 15 (Doppelzüge), Tarnung bricht Aggro sofort, Hinterhalt ×2.5, Fallen-Sicht |
| **Magier** | „Keiner kommt nah" – Distanz erzwingen | Feuerball-Reichweite 6 + Splash + spellDmg-Skalierung, Nahkampf ×0.7 als harte Ansage, Frostkern/Kettenblitz als Spezialisierung |

---

## 4. Verifikation

27 + 13 Smoke-Tests (Node-Harness über das komplette Spiel-Script), u.a.:
- Tiefe 1/2 = exakt 1 Gegner; Tiefe 9 ≤ 4 (ohne Mutator); Tiefe 13 ≈ 5 ✅
- 30+ Ebenen mit übernommener Spielerposition: nie in Wand, nie eingemauert,
  keine Gegner/Items in Wänden ✅
- Krieger: atkCost 1, Pool ≥ 20, 15 Angriffe in Folge ohne Erschöpfung ✅
- Schurken-Hinterhalt aus Tarnung trifft mit ×2.5 und enttarnt ✅
- Golem auf Tiefe 6: max ~43 HP (vorher ~55+) ✅
- Feuerball mit Basis-Stab ≥ 18 Schaden ✅

**Empfohlener Playtest-Fokus:** Krieger in der Eishöhle (Tiefe 6–9) – dort war der
alte Frust am größten; und Schurken-Loop (Tarnung → Hinterhalt → Flucht → erneut tarnen)
auf Ausdauer-Gefühl prüfen.

---

## 5. Balance-Werkzeuge (Telemetrie + Monte-Carlo-Simulator)

### 5.1 In-Game-Telemetrie
Das Spiel protokolliert pro Ebene einen kompakten Datensatz (Ring-Puffer, letzte 200 Ebenen,
localStorage `GD4_BL`): Tiefe, Klasse, Biom, Mutatoren, Züge, Wartezüge, Schaden
verursacht/erlitten, Kills, Crits, Ausdauer-Leerläufe (`starve`), Glitches, HP Start/Ende,
Todesursache (`foe`). Export über den **BALANCE-LOG**-Button im Start-Screen-Footer.

**Workflow:** Normal spielen → Log exportieren → zusammen mit subjektiven Eindrücken
(„Tiefe 12–15 zäh", „Boss 2 trivial") abgeben. Die Kombination aus Gefühl und Zahlen
lokalisiert Probleme präzise (z.B. „zäh" + hohe `waits`/`starve` = Ressourcenproblem;
„zäh" + hohe `turns` bei niedrigem `dT` = Damage-Schwamm-Problem).

### 5.2 Headless-Simulator (nicht ausgeliefert, `scratchpad/sim.js`)
Die Spiellogik läuft vollständig in Node (kein Browser nötig) – ein Greedy-Bot spielt
komplette Runs (30/Klasse) und liefert Überlebenskurven, Todesursachen und die
Telemetrie-Metriken. Der Bot kitet nicht und kauft nicht ein → **Untergrenze** der
Spielstärke: Was der Bot schafft, schafft jeder; wo alle Bots sterben, lohnt ein Blick.

### 5.3 Erste Sim-Befunde & daraus abgeleitete Fixes (Juli 2026)
- **Boss 1 war rechnerisch unschaffbar für Nahkämpfer** (150 HP bei ~7–14 Spieler-DMG,
  Kontaktschaden 10 im 2er-Radius): 28/30 Krieger-Bots starben dort.
  → Knochenfürst **150→110 HP, 10→7 DMG**; Yeti moderat 180→150/12→10.
  Boss bleibt der Skill-Check (Bot ohne Kiten: ~5 % Erfolg), ist aber mit Hit&Run fair.
- **Magier hatte basal `manaRegen: 0`** – das Tutorial behauptete Regeneration, real gab es
  nur die Auffüllung beim Ebenenwechsel (4 Feuerbälle/Ebene). → Basis-Regeneration **0.25/Zug**.
- **Krieger-Ausdauer-Fix bestätigt:** `starve = 0.0` über alle Tiefenbänder (vorher Kernproblem).
- **Beobachtung für die nächste Runde:** Der eine Bot, der Boss 1 überlebte, lief danach
  fast ungebremst bis Tiefe 25 (Schadens-Quote ≤ 0.23) – Verdacht: nach Boss 1 zu flach.
  Entscheidung erst nach menschlichem Telemetrie-Log.
