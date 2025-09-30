function generateTextGraph(data, symbol = "BTC") {
  const height = 10; // tinggi grafik
  const width = data.length;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Normalisasi data ke tinggi grafik
  const normalized = data.map((val) =>
    Math.round(((val - min) / range) * (height - 1))
  );

  // Buat grafik baris demi baris dari atas ke bawah
  let lines = [];
  for (let row = height - 1; row >= 0; row--) {
    let line = "";
    for (let col = 0; col < width; col++) {
line += normalized[col] >= row ? " █" : "  ";    }
    lines.push(line);
  }

  // Tambahkan garis dasar dan info harga
  const current = data[data.length - 1];
  const previous = data[data.length - 2] || current;
  const delta = current - previous;
  const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;

  lines.push("‾".repeat(width * 2));
  lines.push(`${symbol}: $${current.toLocaleString()} (${deltaStr})`);

  return lines.join("\n");
}

// export supaya bisa dipakai di file lain
module.exports = generateTextGraph;
