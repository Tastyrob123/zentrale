/* Familien: Häuser, die zusammengehören, wie im Atelier der Agentur-Seite (seite/work.html, «Designstudien»).
   Eine Quelle für «Kunden» und das Sales Cockpit. Bild der gemeinsamen Startseite: /werkzeuge/13-sales-cockpit/familien/schirm-familie-<k>.webp.
   Adresse der gemeinsamen Startseite: zuerst die Adresse «Familie» eines Hauses in «Kunden», sonst start (aus ~/Versand-Schutz/projekte.py).
   Chalet Rustica gehört seit 08.11.2026 zur Familie Zurbriggen, Hotel Seiler au Lac seit 09.11.2026 zum Grand Beau-Rivage (dieselben Eigentümer). */
window.TASTY_FAMILIEN = [
  { k: 'maeder', t: ['Familie Maeder.', 'Vier Häuser.'], s: 'Vier Häuser einer Familie in Interlaken und im Kandertal: eine gemeinsame Startseite, darunter jedes Haus mit eigener Website und eigener Welt.', ids: ['carlton', 'doldenhorn', 'ruedihus', 'gasterntal'], projekt: 'familie-maeder', start: 'https://maeder.tastystudios.ch/', sparte: 'hotel' },
  { k: 'zurbriggen', t: ['Familie Zurbriggen.', 'Vier Häuser.'], s: 'Saas-Almagell und Zermatt: eine gemeinsame Startseite, darunter die Häuser einer Familie, Websites, die einander nicht gleichen.', ids: ['monte-moro', 'zermatt', 'wellness', 'rustica'], sparte: 'hotel' },
  { k: 'rivage-seiler', t: ['Beau-Rivage & Seiler.', 'Zwei Häuser.'], s: 'Zwei Partnerhäuser derselben Eigentümer, an der Aare in Interlaken und am Brienzersee in Bönigen: eine gemeinsame Startseite, darunter jedes Haus mit eigener Website.', ids: ['beau-rivage', 'seiler'], sparte: 'hotel', stand: { p: 50, t: 'Erst ein Bildentwurf' } },
  { k: 'kuchler', t: ['Familie Kuchler.', 'Zwei Häuser.'], s: 'Zwei Häuser der Familie Kuchler im Thurgau, zwei eigene Welten: die Stube mit Degustationsmenü und der Tisch am Hafen.', ids: ['schaefli', 'schloessli'], sparte: 'gastro', stand: { p: 100, t: 'Fertig, noch lokal' } }
];
