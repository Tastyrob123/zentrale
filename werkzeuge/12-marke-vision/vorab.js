/* Marke & Vision · im <head> nach kleid/tasty.js: die Seite bleibt verborgen, bis das Foto der ersten Ansicht (auch eines Kapitels) da ist.
   marke-vision.js nimmt die Klasse weg; spätestens nach 1,5 s in jedem Fall sichtbar. */
document.documentElement.classList.add('mv-wartet');
setTimeout(function () { document.documentElement.classList.remove('mv-wartet'); }, 1500);
