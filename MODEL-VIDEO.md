# Model: pagină pentru un video nou pe CameraVAR.ro

Fișierul ăsta e doar un ghid pentru tine. Nu apare pe site.

## Pașii

1. În `content/blog` fă un folder nou, cu data și un nume scurt, de exemplu `2026-11-10-fcsb-rapid`.
2. În el fă un fișier cu același nume și terminația `.md`, de exemplu `2026-11-10-fcsb-rapid.md`.
3. Copiază în fișier modelul de mai jos și înlocuiește:
   - titlul (`title`) și descrierea (`description`, una-două fraze, apare în Google);
   - data (`date`), în formatul an-lună-zi;
   - tag-urile (`tags`), scrise exact ca la articolele vechi: "FCSB", "Rapid", "Dinamo", "CS U Craiova", "CFR Cluj", "Presa sportivă", "Antrenori", "Suporteri" etc.;
   - adresa paginii (`permalink`), cu litere mici, fără diacritice, cu cratime între cuvinte și terminată în `/index.html`;
   - textul (același ca în email);
   - linkul videoului din ultimul rând.
4. Publici din GitHub Desktop (Commit + Push). Pagina e live după ce deploy-ul din Netlify ajunge Published.
5. În email pui linkul spre pagina de pe site: `https://cameravar.ro/` + ce ai scris la `permalink`, fără `index.html`. De exemplu `https://cameravar.ro/fcsb-rapid/`.

## Modelul

```
---
title: Titlul videoului
description: Una-două fraze despre ce e în video.
date: 2026-11-10
tags: ["FCSB", "Rapid"]
permalink: "fcsb-rapid/index.html"
---

Primul paragraf din email.

Al doilea paragraf.

{% youtube "https://www.youtube.com/watch?v=ID-UL-VIDEOULUI" %}
```

Exemplu complet: `content/blog/2026-11-02-dinamo-vs-craiova/2026-11-02-dinamo-vs-craiova.md`
