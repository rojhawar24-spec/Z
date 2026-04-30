# 📚 LinguaLearn

Interactief talen leren met AI — Engels, Nederlands, Frans, Spaans en Duits.

## ✨ Features

- 🔐 Login & registreren (email of Google)
- 📚 Grammatica lessen (5 talen)
- 📝 Toetsen met scores
- ✏️ Interactieve oefeningen
- 🤖 AI taaldocent (Premium via PayPal)
- 🌙 Donkere/lichte modus
- 🔥 Streak systeem & XP punten

---

## 🚀 Lokaal opstarten (VS Code)

### 1. Download / Clone het project

```
git clone https://github.com/JOUW_USERNAME/JOUW_REPO.git
cd JOUW_REPO
```

### 2. Installeer dependencies

```
npm install
```

### 3. Maak een .env bestand

Kopieer `.env.example` naar `.env`:

```
cp .env.example .env
```

Open `.env` in VS Code en vul je echte API keys in (verkrijgbaar via de links hieronder).

### 4. Start de development server

```
npm run dev
```

Open `http://localhost:5173` in je browser.

### 5. Build voor productie

```
npm run build
```

De gebouwde site staat in `dist/index.html` (alles in één bestand).

---

## 🔑 API Keys verkrijgen

### Anthropic (Claude AI)
1. Ga naar console.anthropic.com
2. Maak een account
3. Klik op API Keys → Create Key
4. Kopieer de key naar je .env bestand

### PayPal Client ID
1. Ga naar developer.paypal.com
2. Login met je PayPal account
3. Maak een App aan onder "Apps & Credentials"
4. Kopieer de Client ID naar je .env bestand

---

## 🔒 Beveiliging

- ✅ `.env` staat in `.gitignore` → wordt NOOIT naar GitHub gepusht
- ✅ API keys alleen in `.env` — nooit hardcoded in de code
- ✅ Voor production: gebruik GitHub Secrets

---

## 📦 Tech Stack

- React 19 + TypeScript
- Vite 7 (build tool)
- Tailwind CSS 4 (styling)
- Anthropic Claude (AI)
- PayPal SDK (betalingen)

---

## ⚠️ Belangrijk

Geef je API keys NOOIT aan iemand anders! Als ze gelekt zijn:
- Claude key → revoke op console.anthropic.com
- PayPal key → maak nieuwe app aan op developer.paypal.com
