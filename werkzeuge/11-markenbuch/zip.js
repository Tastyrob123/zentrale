/* Kleines ZIP ohne Kompression (Dateien nur abgelegt), damit alle Logo-Dateien mit einem Klick kommen. Keine fremde Bibliothek. */
(function () {
  var TAB = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xffffffff; for (var i = 0; i < b.length; i++) c = TAB[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

  /* dateien: [{name, daten: Uint8Array}] → Blob */
  window.baueZip = function (dateien) {
    var teile = [], verzeichnis = [], versatz = 0, enc = new TextEncoder();
    var jetzt = new Date();
    var zeit = (jetzt.getHours() << 11) | (jetzt.getMinutes() << 5) | (jetzt.getSeconds() >> 1);
    var datum = ((jetzt.getFullYear() - 1980) << 9) | ((jetzt.getMonth() + 1) << 5) | jetzt.getDate();
    dateien.forEach(function (d) {
      var name = enc.encode(d.name), crc = crc32(d.daten), groesse = d.daten.length;
      var kopf = new DataView(new ArrayBuffer(30));
      kopf.setUint32(0, 0x04034b50, true); kopf.setUint16(4, 20, true); kopf.setUint16(6, 0x0800, true); kopf.setUint16(8, 0, true);
      kopf.setUint16(10, zeit, true); kopf.setUint16(12, datum, true); kopf.setUint32(14, crc, true);
      kopf.setUint32(18, groesse, true); kopf.setUint32(22, groesse, true); kopf.setUint16(26, name.length, true); kopf.setUint16(28, 0, true);
      teile.push(new Uint8Array(kopf.buffer), name, d.daten);
      var z = new DataView(new ArrayBuffer(46));
      z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint16(10, 0, true);
      z.setUint16(12, zeit, true); z.setUint16(14, datum, true); z.setUint32(16, crc, true); z.setUint32(20, groesse, true); z.setUint32(24, groesse, true);
      z.setUint16(28, name.length, true); z.setUint32(42, versatz, true);
      verzeichnis.push(new Uint8Array(z.buffer), name);
      versatz += 30 + name.length + groesse;
    });
    var vLaenge = verzeichnis.reduce(function (s, t) { return s + t.length; }, 0);
    var ende = new DataView(new ArrayBuffer(22));
    ende.setUint32(0, 0x06054b50, true); ende.setUint16(8, dateien.length, true); ende.setUint16(10, dateien.length, true);
    ende.setUint32(12, vLaenge, true); ende.setUint32(16, versatz, true);
    return new Blob(teile.concat(verzeichnis, [new Uint8Array(ende.buffer)]), { type: 'application/zip' });
  };
})();
