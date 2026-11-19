/* arbeiten.js · «Was wir gemacht haben» je Bestandskunde (Robert 16.11.2026: «das müsste doch aus dem Sales Cockpit raus und dann bei Kunden rein, weil bei Kunden sind Bestandskunden»).
   Übernommen aus dem Sales Cockpit (Bereich «Unsere Kunden», Stand 14.11.2026), Bildschirme in arbeiten/. Felder je Arbeit: [Art, Titel, Satz, Adresse, Bild]. */
(function () {

/* ---------------------------------------------------------------- Unsere Kunden (Robert 14.11.2026: «dass Anna quasi einen Überblick hat, auch bei Kunden … dass sie sieht,
   was ich schon für den Kunden alles gemacht habe … so einen eigenen kleinen Bereich»). Je Kunde mit Vertrag ein Blatt mit allen Arbeiten im Laptop.
   Quellen: «Kunden» (haeuser.json: kurz, beigaben, seiten, werkzeuge), projekte.py (Adressen), Seitentitel der Arbeiten; alle Adressen am 14.11.2026 mit 200 geprüft.
   Bildschirme: schirme/kunde-<k>.webp, aufgenommen 14.11.2026 in 1440 px. */
const KSC = '/zentrale/werkzeuge/02-kundenliste/arbeiten/kunde-', KSALES = 'https://tastyrob123.github.io/txtme-sales/', KTXT = 'https://txtme-social.sites.deploybase.eu/';
window.KUNDEN_ARBEITEN = {
  txtme: {
    buehne: { k: 'Die Website', t: ['Der ', 'Webshop.'], lead: 'Die Website von txtme.social mit Shop, als Entwurf online. Dazu die Seite für die Beta mit Warteliste und die Drops durch das Jahr.',
      url: KTXT, bild: KSC + 'txtme-shop.webp',
      teile: [['Landingpage', 'The platform that wants you offline', 'landing/'], ['Drops', 'Saison-Welten: ein Shop, elf Anlässe', 'drops/']] },
    arbeiten: [
      ['Werkbank', 'Werkbank 2.0', 'Alles rund um den Shop an einem Ort: Seiten, Werkzeuge und Unterlagen.', KTXT + 'werkbank/', 'txtme-werkbank'],
      ['Event', 'rkn.ofc × txtme.social × ade', 'Die Präsentation für die Special Edition zur ADE-Woche mit Kameras, Rahmen und Abzügen.', KTXT + 'rkn/', 'txtme-rkn'],
      ['Event', 'Sponsoring für Events', 'Das Portfolio für Sponsoren von Events.', KTXT + 'rkn/sponsoring/', 'txtme-sponsoring'],
      ['Sales-Unterlagen', 'Die Sales-Unterlagen', 'Alle Unterlagen von txtme.social an einem Ort, zum Weiterschicken an Cafés, Partner und Botschafter, dazu unsere Arbeiten für Kunden von txtme.social.', KSALES, 'txtme-sales']],
    ausserdem: ['Instagram-Kampagne, erster Schub, mit elf Canva-Vorlagen'] },
  culinarium: {
    arbeiten: [
      ['Website', 'Die neue Website', 'Neun Seiten, als Entwurf online.', 'https://tastyrob123.github.io/culinarium-entwurf/', 'culinarium-website'],
      ['Werkbank', 'Die Werkbank', 'Website, Werkzeuge und Unterlagen an einem Ort.', 'https://tastyrob123.github.io/culinarium-demo/werkbank/index.html', 'culinarium-werkbank'],
      ['Vergleich', 'Bisher und neu', 'Die heutige Seite und die neue nebeneinander, mit den Korrekturen des Hauses.', 'https://tastyrob123.github.io/culinarium-entwurf/vergleich/', 'culinarium-vergleich'],
      ['Werkzeug', 'Der Tresen', 'Der Einstieg: von hier geht es in jedes Werkzeug.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/maison/index.html', 'culinarium-wz-maison'],
      ['Werkzeug', 'Das Schaufenster', 'Die Website selbst bearbeiten.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/bureau/index.html', 'culinarium-wz-bureau'],
      ['Werkzeug', 'Die Pairing-Karte', 'Menü und Drinks jedes Abends als Karte am Platz.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/carte/index.html', 'culinarium-wz-carte'],
      ['Werkzeug', 'Das Gästebuch', 'Die Anfragen der Gäste an einem Ort.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/reception/index.html', 'culinarium-wz-reception'],
      ['Werkzeug', 'Das Markenbuch', 'Die Marke zum Arbeiten, mit den Hausregeln zum Nachschlagen.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/livre/index.html', 'culinarium-wz-livre'],
      ['Werkzeug', 'Die Besucherliste', 'Wer die Website besucht und welche Seiten.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/registre/index.html', 'culinarium-wz-registre'],
      ['Werkzeug', 'Die Plakatwerkstatt', 'Flyer, Karten, Aushänge und Gutscheine im Stil des Culinarium.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/imprimerie/index.html', 'culinarium-wz-imprimerie']] },
  wildside: {
    arbeiten: [
      ['Website', 'Die neue Bar-Website', 'Acht Seiten für die Nachbarschafts-Mixology-Bar in Linden, als Entwurf online.', 'https://tastyrob123.github.io/culinarium-entwurf/wildside/', 'wildside-website'],
      ['Werkbank', 'Die Werkbank', 'Website, Werkzeuge und Unterlagen an einem Ort.', 'https://tastyrob123.github.io/culinarium-demo/werkbank/index.html', 'culinarium-werkbank'],
      ['Werkzeug', 'Der Tresen', 'Der Einstieg: von hier geht es in jedes Werkzeug.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/maison/index.html', 'culinarium-wz-maison'],
      ['Werkzeug', 'Das Schaufenster', 'Die Website selbst bearbeiten.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/bureau/index.html', 'culinarium-wz-bureau'],
      ['Werkzeug', 'Die Pairing-Karte', 'Menü und Drinks jedes Abends als Karte am Platz.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/carte/index.html', 'culinarium-wz-carte'],
      ['Werkzeug', 'Das Gästebuch', 'Die Anfragen der Gäste an einem Ort.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/reception/index.html', 'culinarium-wz-reception'],
      ['Werkzeug', 'Das Markenbuch', 'Die Marke zum Arbeiten, mit den Hausregeln zum Nachschlagen.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/livre/index.html', 'culinarium-wz-livre'],
      ['Werkzeug', 'Die Besucherliste', 'Wer die Website besucht und welche Seiten.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/registre/index.html', 'culinarium-wz-registre'],
      ['Werkzeug', 'Die Plakatwerkstatt', 'Flyer, Karten, Aushänge und Gutscheine im Stil des Culinarium.', 'https://tastyrob123.github.io/culinarium-demo/werkzeuge/imprimerie/index.html', 'culinarium-wz-imprimerie']] }
};
})();
