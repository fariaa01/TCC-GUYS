const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Calcule o diretório `public/uploads` a partir da raiz do projeto de forma robusta
// (subindo três níveis a partir deste arquivo: src/infrastructure/middlewares -> projeto)
const uploadDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads');

// Garante que a pasta exista (mkdir -p)
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  // Se falhar ao criar, loga o erro — multer callback ainda tratará problemas ao gravar
  console.error('Falha ao criar diretório de uploads:', err);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;
