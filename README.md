# Algorithm Visualizer:

## Colors:
	- #45a049 - highlight green
	- #2f2f2f - page background
	- #484848 - buttons, etc
	- #2f4f4f - visual default
	- #ffd700 - visual highlight yellow
	- #dc143c - visual pivot
	- aliceblue - text color

## General TODO
    - Maradék algoritmusok megvalósítása
	- timer válotozó külön kiszedése
	- fa algoritmusnál start gomb kivétele
    - Hunglish javítása
    - Source Code implementálása eval-al
	- tagek kivétele
	- recolor app
	- avl fa source code
	- left side scrollable
	- limitek hozzáadása az algoritmusok
	- jarvis step counter
	- await delay(Math.max(100, 900 - get(speed) * 8));
	- max 4 depth
	- restart - start work properly
	- code cleanup
    - Dokumentáció

## Algoritmus Checklist
    - [ ] Alap adatok
    - [ ] Vizualizáló indexek
    - [ ] Előkalkulált lépésszám
    - [ ] Algoritmus futás
    - [ ] HTML
    - [ ] CSS


## Hátralévő algoritmusok
	- Bináris fa
	- AVL-fa
	- B-fa
	- Prios Fekete Fa
	- 2-3 fa
	- 2-3-4 fa

Updatere szorul:
Penzvalto: - progress bar, canvas display, log tweak
heapsort: - alkalmaazni rá a többi rendező algoritmus elemeit: random start input, stb
		  - vizualizálás javitás + css
binary heap: SVG looks funny, css, step by step visual, empty heap

------Szakdolgozat doksi:---------


Bevezetés-----


Specifikáció------


Megvalósítás-------
- fa algoritmusoknál egy input mezö elegendö beszúrni, keresni, törölni


Tesztelés--------
- viualizálás tesztelés
- korlátok tesztelése
- source code line tesztelése
- sebesség megvalósítás / reális / kiegyensúlyozott futás idö minden algoritmusnál
- start - resume - restart sorrend tesztelés (convek hull pl ne startkor, hanem restartkor randomizáljon)
- fa algoritmusnál mélység limit


Megvalósítási ötletek amik nem valósultak meg---------
- lépegetö megvalosítás

Összegzés---------


	

## Doku:

Hátizsák probléma ötlet: 
	tárgyak módosáitása - elvetettem az ötletet, mivel nem használata csak marginálisan javította volna a felhasználó felületett és nagyon zsúfolt lett volna a felület.