# The Glitch Dungeon: Dark Descent

Ein atmosphärischer Dark-Fantasy Roguelike Dungeon Crawler im Browser.

> *Die alten Mauern halten der Realität nicht mehr stand. Die Zeit springt, Räume verschieben sich. Wirst du den Kern erreichen, bevor deine Existenz ausgelöscht wird?*

![Status](https://img.shields.io/badge/Status-Spielbar-brightgreen)
![Technologie](https://img.shields.io/badge/Vanilla-JS%20%7C%20HTML5%20Canvas-yellow)
![Lizenz](https://img.shields.io/badge/Lizenz-Privat-red)

---

## Spielen

Öffne `public/index.html` in einem modernen Browser – keine Installation erforderlich.

---

## Spielkonzept

Kämpfe dich durch prozedural generierte Ebenen einer instabilen Realität. Die namensgebende **Glitch-Mechanik** verändert die Welt um dich herum: Wände verschieben sich, neue Gegner spawnen, und der Druck steigt mit jeder verstrichenen Runde.

**Kernprinzip:** Finde den Schlüssel, erreiche den Ausgang – bevor der Glitch dich überwältigt.

---

## Features

### Drei spielbare Klassen
| Klasse | Spielstil | Stärke | Schwäche |
|--------|-----------|--------|----------|
| **Krieger** | „Viele kommen" – Dauerkämpfer im Pulk | Hohe HP & Rüstung, ×1.4 Schaden, geht im Kampf nicht aus der Puste, Wirbelwind | Laut, langsam |
| **Schurke** | „Keiner kommt" – Tarnung & Burst | Schnell, leise, **Hinterhalt ×2.5** aus der Unsichtbarkeit, Tarnung bricht Aggro sofort | Fragil, muss Ausdauer haushalten |
| **Magier** | „Keiner kommt nah" – Distanzkontrolle | Feuerball mit Splash, skaliert stark mit Zauber-Items | Sehr wenig HP, schwacher Nahkampf |

Details und Zahlen zum Klassen-/Monster-Balancing: [BALANCING.md](BALANCING.md)

### Biome (10 Varianten + Korruption)
Katakomben → Eishöhle → Sumpf → Vulkan → Astral → Nekro → Kristall → Leere → Labyrinth → Chaos

Jedes Biom hat eigene Farbpaletten, Terrain-Effekte (Rutschiges Eis, Giftiger Sumpf, Lava-Schaden), Monster-Pools und ein **eigenes generatives Musik-Profil**. Ab Tiefe 51 wiederholen sich die Biome nicht einfach: **Korrumpierte** (und später **Zerfallene**) Varianten mischen die Monster-Pools zweier Biome, härten Wände und beschleunigen den Realitätszerfall.

### Level-Mutatoren (ab Tiefe 8)
Jede Ebene kann zufällige Modifikatoren tragen (bis zu 3 ab Tiefe 50), die beim Betreten angekündigt werden – z.B. **Blutmond** (+50% Gegner-Schaden & Gold), **Finsternis** (halber Lichtradius), **Horde**, **Elitejagd**, **Zeitriss**, **Pazifist** (Bonus-Gold ohne Kill) u.v.m.

### Gegner-System
- **16 Monster-Typen** mit individuellen Sprites und Verhalten (Skelett, Schleim, Golem, Geist, Mimic, Basilisk, Gargoyle...)
- **12 Adjektiv-Modifikatoren** verändern Stats und Effekte (Giftig, Brennend, Eisig, Hungrig...)
- **Elite-Monster** mit *zwei* gestapelten Adjektiven, Aura-Ring und garantiertem Item-Drop (ab Tiefe 12)
- **KI-Zustände**: Schlafend, Patrouillierend, Jagend
- **Status-Effekte**: Gift, Brennen, Fluch, Eisig, Lebensdieb

### Bosse (alle 5 Ebenen)
10 Boss-Typen mit eigenen Mechaniken (Aura, Teilung, Lava-Spur, Phasen-Teleport, Beschwörung, Reflektion, schrumpfende Arena, Sturmangriff...). Die Skalierung wächst mit der Tiefe unbegrenzt weiter; ab dem zweiten Biom-Zyklus absorbieren Bosse eine **zweite Mechanik** eines anderen Bosses. Nach dem ersten Boss-Sieg eines Runs wählst du eine **Skill-Spezialisierung** (z.B. Erdbeben/Blutrausch für den Krieger, Schattenschritt/Giftklinge für den Schurken, Kettenblitz/Frostkern für den Magier).

### Dungeon-Struktur
- **Zwei Map-Generatoren**: organisches Biom-Noise oder Räume+Korridore
- **Schreine** (Opfer gegen Run-Boni), **Glitch-Risse** (riskante Ebenen-Sprünge), **Schatzkammern** hinter harten Wänden (Bergbau!), **Fallen** (Schurken sehen sie sofort)
- **Run-Events** zwischen Ebenen: Händler, Glücksspiel, Blutaltar, Zeitblase

### Loot & Ausrüstung
- **Waffen, Rüstungen, Relikte** mit prozeduraler Generierung
- **10 Materialien** (Holz → Mithril → Arkan) mit Bonus-Eigenschaften
- **11 Seltenheitsstufen** (Abgenutzt bis EWIG mit Regenbogen-Effekt), Doppel-Suffixe ab "Mystisch"
- **8 Unique-Items** mit regelbrechenden Effekten (Glitchklinge, Leerenamulett, Spiegelharnisch...)
- **Set-Bonus** bei kompletter Ausrüstung aus demselben Material
- **Konsumables** im Inventar: Heiltrank, Sprengphiole, Teleport-Rolle, Schildtrank

### Audio (vollständig generativ)
- **Generative Musik** über die Web Audio API: pro Biom eigene Skala, Tempo, Klangfarbe **und ein eigenes Schlagzeug-Pattern** (Kick/HiHat/Snare als 16-Step-Bitmasken)
- **Harmonie & Leitmotiv, komplett generativ:** Akkordfolge (i–VI–iv–v) über einem Tonika-Orgelpunkt, alle Stimmen spielen akkordeigene Töne. Das Spiel hat **ein einziges, festes Leitmotiv** (16 Töne, Vorder-/Nachsatz mit Halb- und Ganzschluss): generativ erzeugt aus 48 deterministischen Kandidaten, bewertet nach Harmonielehre-Regeln (Schrittbewegung, Leap-Recovery, ein einziger Höhepunkt, Bogen-Kontur). Es erklingt zu Beginn jedes Levels und dann alle 8 Takte – jeweils eingefärbt durch Skala, Grundton und Klangfarbe des aktuellen Bioms
- **Stufenloser Gefahr-Pegel**: Aggro, niedriger Lebensbalken und nahender Realitätsbruch heben Schlagzeug-Lautstärke, Tempo und Notendichte weich an (Lerp, kein hartes Umschalten); Stealth dünnt die Musik aus, Boss-Kämpfe fügen eine Halbton-Reibung hinzu
- **Probehören im Grimoire**: alle 10 Biom-Tracks von Anfang an anwählbar; beim Biomwechsel schaltet die Musik automatisch zurück auf den Biom-Track (AUTO)
- **Soundeffekte** aus synthetisierten Oszillatoren
- Getrennte Toggles für Musik (M) und Effekte (N)

### Schattenhändler (Shop)
Nach jedem Level: Upgrades kaufen, Auswahl sperren, Angebot neu würfeln.

Kategorien: Tränke, Stats, Rituale (Glitch-Verzögerung), Fackelschein, Bannkreise...

### Tägliche Prüfung (Daily Challenge)
Optionaler Modus mit festem Tages-Seed: alle Spieler erhalten dieselben Dungeons (deterministischer Mulberry32-RNG).

### Persistenz
Spielfortschritt (Gold, erreichte Tiefe, Shop-Upgrades) wird versioniert im Local Storage gespeichert und lässt sich als Base64-String **exportieren/importieren** (Gerätewechsel).

---

## Steuerung

| Taste | Aktion |
|-------|--------|
| **W A S D** / **Pfeiltasten** | Bewegen / Angreifen |
| **Leertaste** | Warten / Shop neu würfeln |
| **B** | Klassenspezifische Fähigkeit |
| **F** | Bannkreis (Flächenschaden) |
| **I** | Inventar |
| **L** | Shop-Auswahl sperren |
| **R** | Reinkarnation (nach Game Over) |
| **M** / **N** | Musik / Soundeffekte an-aus |
| **1–9** | Shop-Auswahl / Entscheidungs-Dialoge |

Alternativ: Maussteuerung (Klick zum Bewegen/Angreifen, Magier: Klick für Feuerball-Ziel). Auf Touch-Geräten erscheint zusätzlich ein **D-Pad** (Vorsicht im Chaos-Biom – der Glitch dreht es gerne).

---

## Technische Details

**Stack:** Reines HTML5 + Vanilla JavaScript (~2.000 Zeilen, komplett in einer Datei)

- **Rendering:** HTML5 Canvas mit prozeduralen Pixel-Sprites; **Kreaturen-Generator** (16×16: Archetyp-Maske + gespiegeltes Hash-Rauschen + 3-Ton-Rampe + Kontur + Leuchtaugen – jede Kreatur ein Unikat, Klassiker wie Skelett & Mimic bleiben handgezeichnet), Hi-DPI-Canvas (scharfe Lichter/Texte, grobe Pixel), **Glitch-Post-FX** (Zeilen-Versatz + Kanaltrennung beim Realitätsbruch, dezente Scanlines, Biom-Farbgrading), bullige Boss-Sprites mit Kontur & Dithering, Rarity-Schein unter Bodenloot
- **Audio:** Web Audio API für generierte Soundeffekte **und generative Musik** (keine Audio-Assets)
- **Beleuchtung:** Echtzeit-Lichtsystem mit Fackeln und Spieler-Radius
- **Zufallsquelle:** Math.random + seedbarer Mulberry32 für den Daily-Modus
- **Speicherung:** LocalStorage (`GD4_Dark_Save`, versioniert) mit Export/Import
- **Fonts:** Nur System-Schriften bzw. lokal installierte Fonts – **keine externen Requests** (DSGVO-sicher, offline-fähig)
- **Barrierefreiheit:** Toggle für reduzierte Effekte (kein Zufalls-Flackern/UI-Chaos)

**Performance:** Läuft auf jedem modernen Browser ohne externe Abhängigkeiten.

---

## Projektstruktur

```
├── public/            # Wird veröffentlicht – nur Spieldateien
│   ├── index.html     # Komplettes Spiel (HTML + CSS + JS)
│   └── impressum.html # Impressum & Datenschutz
└── README.md
```

---

## Roadmap / Offene Ideen

- [x] Bosskämpfe alle 5 Ebenen (10 Boss-Typen, endlose Skalierung, Zweitmechaniken ab Zyklus 2)
- [x] Mehr Skill-Varianten pro Klasse (Spezialisierungs-Wahl beim Boss-Sieg)
- [x] Achievements (16 Erfolge + Grimoire)
- [x] Sound-Toggle (getrennt für Musik und Effekte)
- [x] Mobile Touch-Steuerung optimieren (D-Pad auf Touch-Geräten)
- [x] Generative Musik pro Biom
- [x] Level-Mutatoren & korrumpierte Biome (Late-Game-Varianz)
- [x] Schreine, Fallen, Schatzkammern, Glitch-Risse & Run-Events
- [x] Unique-Items, Konsumables, Set-Boni
- [x] Daily Challenge (fester Tages-Seed)
- [ ] Erfolge als Freischaltungen (z.B. 4. Klasse)
- [ ] Echtes Finale auf Tiefe 100 („Der Kern")
- [ ] Run-Zusammenfassung beim Tod

Die vollständige Analyse mit priorisierten Optimierungen steht in [OPTIMIERUNGEN.md](OPTIMIERUNGEN.md).

---

## Autor

Entwickelt von **Zukunftsbastler**

[Impressum & Datenschutz](impressum.html)
