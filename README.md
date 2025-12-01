# The Glitch Dungeon: Dark Descent

Ein atmosphärischer Dark-Fantasy Roguelike Dungeon Crawler im Browser.

> *Die alten Mauern halten der Realität nicht mehr stand. Die Zeit springt, Räume verschieben sich. Wirst du den Kern erreichen, bevor deine Existenz ausgelöscht wird?*

![Status](https://img.shields.io/badge/Status-Spielbar-brightgreen)
![Technologie](https://img.shields.io/badge/Vanilla-JS%20%7C%20HTML5%20Canvas-yellow)
![Lizenz](https://img.shields.io/badge/Lizenz-Privat-red)

---

## Spielen

Öffne `index.html` in einem modernen Browser – keine Installation erforderlich.

---

## Spielkonzept

Kämpfe dich durch prozedural generierte Ebenen einer instabilen Realität. Die namensgebende **Glitch-Mechanik** verändert die Welt um dich herum: Wände verschieben sich, neue Gegner spawnen, und der Druck steigt mit jeder verstrichenen Runde.

**Kernprinzip:** Finde den Schlüssel, erreiche den Ausgang – bevor der Glitch dich überwältigt.

---

## Features

### Drei spielbare Klassen
| Klasse | Stärke | Schwäche |
|--------|--------|----------|
| **Krieger** | Hohe HP, Ausdauer | Laut, langsam |
| **Schurke** | Schnell, leise, Stealth | Fragil |
| **Magier** | Fernkampf (Feuerball), Mana | Sehr wenig HP |

### Biome (10 Varianten)
Katakomben → Eishöhle → Sumpf → Vulkan → Astral → Nekro → Kristall → Leere → Labyrinth → Chaos

Jedes Biom hat eigene Farbpaletten, Terrain-Effekte (Rutschiges Eis, Giftiger Sumpf, Lava-Schaden) und Monster-Pools.

### Gegner-System
- **12 Monster-Typen** mit individuellen Sprites und Verhalten (Skelett, Schleim, Golem, Geist, Mimic...)
- **12 Adjektiv-Modifikatoren** verändern Stats und Effekte (Giftig, Brennend, Eisig, Hungrig...)
- **KI-Zustände**: Schlafend, Patrouillierend, Jagend
- **Status-Effekte**: Gift, Brennen, Fluch, Eisig, Lebensdieb

### Loot & Ausrüstung
- **Waffen, Rüstungen, Relikte** mit prozeduraler Generierung
- **10 Materialien** (Holz → Mithril → Arkan) mit Bonus-Eigenschaften
- **11 Seltenheitsstufen** (Abgenutzt bis EWIG mit Regenbogen-Effekt)
- **Suffixe** für zusätzliche Boni ("des Blutes", "der Zeit"...)

### Schattenhändler (Shop)
Nach jedem Level: Upgrades kaufen, Auswahl sperren, Angebot neu würfeln.

Kategorien: Tränke, Stats, Rituale (Glitch-Verzögerung), Fackelschein, Bannkreise...

### Persistenz
Spielfortschritt (Gold, erreichte Tiefe, Shop-Upgrades) wird im Local Storage gespeichert.

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
| **1–9** | Shop-Auswahl |

Alternativ: Maussteuerung (Klick zum Bewegen/Angreifen, Magier: Klick für Feuerball-Ziel)

---

## Technische Details

**Stack:** Reines HTML5 + Vanilla JavaScript (~580 Zeilen, minifiziert in einer Datei)

- **Rendering:** HTML5 Canvas mit prozeduralen Pixel-Sprites
- **Audio:** Web Audio API für generierte Soundeffekte
- **Beleuchtung:** Echtzeit-Lichtsystem mit Fackeln und Spieler-Radius
- **Speicherung:** LocalStorage (`GD4_Dark_Save`)

**Performance:** Läuft auf jedem modernen Browser ohne externe Abhängigkeiten.

---

## Projektstruktur

```
├── index.html      # Komplettes Spiel (HTML + CSS + JS)
├── impressum.html  # Impressum & Datenschutz
└── README.md
```

---

## Roadmap / Offene Ideen

- [ ] Bosskämpfe alle 5 Ebenen
- [ ] Mehr Skill-Varianten pro Klasse
- [ ] Achievements / Freischaltbares
- [ ] Sound-Toggle
- [ ] Mobile Touch-Steuerung optimieren

---

## Autor

Entwickelt von **Zukunftsbastler**

[Impressum & Datenschutz](impressum.html)
