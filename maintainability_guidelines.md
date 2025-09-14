# Maintainability Guidelines

Dieses Dokument fasst zentrale Handlungsprinzipien zur Sicherung und Verbesserung der Wartbarkeit von Softwaresystemen zusammen. Die Guidelines orientieren sich an acht Dimensionen der Wartbarkeit und dienen als allgemeine Leitplanken für Architektur- und Entwicklungsentscheidungen.

---

## Inhaltsverzeichnis

1. [Modularität](#1-modularität)
2. [Wiederverwendbarkeit](#2-wiederverwendbarkeit)
3. [Analysierbarkeit](#3-analysierbarkeit)
4. [Modifizierbarkeit](#4-modifizierbarkeit)
5. [Testbarkeit](#5-testbarkeit)
6. [Wissensmanagement](#6-wissensmanagement)
7. [Testqualität](#7-testqualität)
8. [Abhängigkeitsmanagement](#8-abhängigkeitsmanagement)

---

## 1. Modularität

- Systeme in klar abgegrenzte und unabhängige Module zerlegen.
- Abhängigkeiten zwischen Modulen auf ein Minimum reduzieren.
- Schichtenarchitekturen oder ähnliche Konzepte nutzen, um eine klare Struktur vorzugeben.
- Zyklische Abhängigkeiten vermeiden und frühzeitig auflösen.
- Module so gestalten, dass sie möglichst autonom funktionieren können.

---

## 2. Wiederverwendbarkeit

- Kleine, fokussierte Module und Funktionen entwickeln, die klar eine Aufgabe erfüllen.
- Schnittstellen und Funktionssignaturen so einfach wie möglich halten.
- Verantwortlichkeiten trennen, damit Module in verschiedenen Kontexten nutzbar bleiben.
- Hohe Kohäsion innerhalb eines Moduls sicherstellen, um logische Zusammengehörigkeit zu wahren.

---

## 3. Analysierbarkeit

- Code so gestalten, dass er leicht zu verstehen ist.
- Funktionen und Klassen möglichst klein und übersichtlich halten.
- Komplexität im Kontrollfluss reduzieren und auf unnötige Verschachtelungen verzichten.
- Module in handhabbare Einheiten zerlegen, anstatt sehr große Dateien entstehen zu lassen.
- Logische Zusammengehörigkeit von Elementen sicherstellen, um die Verständlichkeit zu erhöhen.

---

## 4. Modifizierbarkeit

- Änderungen sollten lokal bleiben und nicht das gesamte System betreffen.
- Kopplung reduzieren und Schnittstellen gezielt nutzen, um Abhängigkeiten zu minimieren.
- Komplexität kontrollieren, damit Anpassungen risikoarm und effizient möglich sind.
- Regelmäßig Refactoring betreiben, um langfristige Anpassbarkeit zu sichern.

---

## 5. Testbarkeit

- Software so aufbauen, dass einzelne Komponenten isoliert testbar sind.
- Komplexität und Abhängigkeiten vermeiden, die Tests erschweren.
- Externe Aufrufe abstrahieren und über klar abgegrenzte Adapter- oder Schnittstellen auslagern.
- Parameter und Eingaben überschaubar halten, um die Zahl möglicher Testfälle zu reduzieren.

---

## 6. Wissensmanagement

- Wissen im Team verteilen, statt Einzelpersonen für bestimmte Bereiche allein verantwortlich zu machen.
- Wichtige Architektur- und Designentscheidungen dokumentieren.
- Angemessene Kommentare im Code nutzen, die Entscheidungsrationale und komplexe Logik erklären.
- Projekt-Dokumentation aktuell halten und zentral zugänglich machen.
- Konsistente Terminologie verwenden und Änderungen nachvollziehbar dokumentieren.

---

## 7. Testqualität

- Tests aussagekräftig gestalten und sicherstellen, dass sie relevante Aspekte des Codes prüfen.
- Für alle wesentlichen Module und Funktionen passende Tests bereitstellen.
- Sowohl die Breite (Abdeckung von Codezeilen) als auch die Tiefe (Abdeckung von Entscheidungszweigen) der Tests sicherstellen.
- Kontinuierlich prüfen, ob Tests zuverlässig Regressionen erkennen und wartbar bleiben.

---

## 8. Abhängigkeitsmanagement

- Externe Bibliotheken bewusst und sparsam einsetzen.
- Vermeiden, dass lange Ketten von transitive Abhängigkeiten unkontrolliert wachsen.
- Regelmäßig prüfen, ob eingesetzte Abhängigkeiten aktiv gepflegt werden.
- Abhängigkeiten aktuell halten und Updates in den Entwicklungsprozess integrieren.
- Tools zur Überwachung von Abhängigkeiten nutzen, um Sicherheits- und Wartbarkeitsrisiken früh zu erkennen.

---
