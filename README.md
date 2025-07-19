# 🤖 AI Agent UI — Powered by Puter

A minimalist AI frontend for Puter Agents — supports chat, image generation, model switching, and persistent conversations per user.
No backend. No setup. Just log in and build.

---

## ✨ Features

- 🔐 Login via [Puter](https://puter.com)
- 💬 Chat with your agent
- 🖼️ Generate images from text
- 🧠 Switch between AI models
- 📀 Auto-save chat history per user (stored via Puter)
- 🗑️ Delete history anytime

---

## ⚙️ Tech Stack

- React + Vite
- TailwindCSS (optional)
- Puter.js SDK
- Local session management

---

## 🚀 Getting Started

```bash
git clone https://github.com/minproducer/ai-agent.git
cd ai-agent
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

---

## 🧪 Dev Notes

- No custom backend — only Puter auth + API via SDK
- User data (chat, models) stored by Puter account
- Extendable UI for future plugins or agents

---

## 📆 Build for Production

```bash
npm run build
```

Static files in `/dist`, ready for Vercel, Netlify, etc.

---

## 🙇 Author

**MinProducer**
🔗 [Facebook](https://fb.com/minproducer.fb) | [GitHub](https://github.com/minproducer) | [Telegram](https://t.me/minproducer)

---

## 🛍️ Philosophy

> “Small tools. Big power. Your agent, your way.”

---

## 📜 License

MIT — fork, remix, hack to your heart’s content.
