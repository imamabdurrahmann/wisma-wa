# Wisma WA Bot

WhatsApp integration untuk Wisma Bot menggunakan Baileys.

## Setup di Termux (HP Android)

### 1. Install dependencies
```bash
pkg update && pkg upgrade -y
pkg install git nodejs python
```

### 2. Clone repo
```bash
cd ~
git clone https://github.com/muhamzafar/wisma-wa.git
cd wisma-wa
```

### 3. Clone wisma-bot
```bash
git clone https://github.com/muhamzafar/wisma-bot.git
```

### 4. Install npm dependencies
```bash
cd wisma-wa
npm install
```

### 5. Jalankan bot
```bash
node index.js
```

### 6. Scan QR Code
- Akan muncul QR code di terminal
- Buka WhatsApp → Settings → Linked Devices → Scan QR

### 7. Done!
Bot akan jalan dan siap menerima pesan.

## Struktur
```
wisma-wa/
├── index.js      # WhatsApp connection (Baileys)
├── package.json  # Dependencies
├── auth/         # WhatsApp session (auto-created)
└── wisma-bot/   # Python bot files
    ├── config.py
    ├── db.py
    ├── handlers.py
    ├── templates.py
    └── main.py
```

## Notes
- HP harus online terus
- Jangan close Termux
- Session tersimpan di folder `auth/`
- Kalo mau reset: hapus folder `auth/` dan scan QR lagi