#!/bin/bash

# Port temizleme script'i - Frontend için

echo "🔍 Port 3000'de çalışan process'ler kontrol ediliyor..."

# Port 3000'i kullanan process'i bul
PID=$(lsof -ti:3000)

if [ -z "$PID" ]; then
    echo "✅ Port 3000 boş, kullanıma hazır!"
else
    echo "⚠️  Port 3000'de çalışan process bulundu (PID: $PID)"
    echo "🛑 Process durduruluyor..."
    kill -9 $PID
    echo "✅ Port 3000 temizlendi!"
fi

echo ""
echo "🚀 Şimdi 'npm run dev' ile frontend'i başlatabilirsiniz!"

