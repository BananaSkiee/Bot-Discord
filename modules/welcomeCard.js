const Canvas = require("canvas");
const path = require("path");

// Memuat font gg sans
let fontFamily = "Sans-Serif";
try {
  const fontPath = path.join(__dirname, "../assets/Lato-Black.ttf");
  
  Canvas.registerFont(fontPath, { family: "DiscordFont" });
  fontFamily = "DiscordFont";
  console.log("Font Discord 'ggsans-ExtraBold.ttf' berhasil dimuat.");
} catch (error) {
  console.error("GAGAL MEMUAT FONT: Pastikan file 'ggsans-ExtraBold.ttf' ada di dalam folder 'assets'.");
  console.error(error); 
}


module.exports = async function generateWelcomeCard(member) {
  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext("2d");

  const background = await Canvas.loadImage(path.join(__dirname, "../assets/bg.jpeg"));
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const canvasCenterX = canvas.width / 2;
  const avatarSize = 105;    
  const avatarY = 90;        
  const welcomeTextY = 190;  
  const userTextY = 215;     

  const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
  const avatar = await Canvas.loadImage(avatarURL);

  // Menggambar border lingkaran
  ctx.save();
  ctx.beginPath();
  ctx.arc(canvasCenterX, avatarY, (avatarSize / 2) + 1, 0, Math.PI * 2, true);
  // ctx.arc(canvasCenterX, avatarY, (avatarSize / 2) + 5, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.strokeStyle = '#2ECC71'; 
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Gambar avatar di dalamnya
  ctx.save();
  ctx.beginPath();
  ctx.arc(canvasCenterX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, canvasCenterX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
  ctx.restore();

  // --- MENGGAMBAR TEKS (TANPA GARIS PINGGIR) ---
  ctx.textAlign = "center";

  // 1. Tulis "WELCOME"
  ctx.fillStyle = "#F1C40F"; 
  ctx.font = `45px ${fontFamily}`;
  // PERUBAHAN: Baris di bawah ini dihapus untuk menghilangkan outline hitam
  ctx.strokeText("WELCOME", canvasCenterX, welcomeTextY); 
  ctx.fillText("WELCOME", canvasCenterX, welcomeTextY);

  // 2. Tulis nama pengguna
  ctx.fillStyle = "#E67E22"; 
  const username = member.user.username.toUpperCase();
  ctx.font = `28px ${fontFamily}`;
  // PERUBAHAN: Baris di bawah ini dihapus untuk menghilangkan outline hitam
  ctx.strokeText(username, canvasCenterX, userTextY);
  ctx.fillText(username, canvasCenterX, userTextY);

  return canvas.toBuffer("image/png");
};
