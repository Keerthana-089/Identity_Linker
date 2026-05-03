# 🔗 IDENTITY LINKER  
### Cross-Platform OSINT Identity Correlation Tool  

🌐 **Live Demo:** https://identity-linker.c-keerthana089.workers.dev/  
⚠️ *For authorized OSINT research only*  

---

## 🧠 Overview

**Identity Linker** is an OSINT-powered web application that correlates usernames, email patterns, and profile metadata across multiple platforms to build a **360-degree view of a user's digital presence**.

Instead of treating profiles independently, the system models identity as a **graph problem**, combining fuzzy matching and multi-platform data aggregation.

👉 Input a username → Get a connected identity graph across platforms.

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|------|-----------|--------|
| **Frontend** | React + Vite + Tailwind CSS | OSINT dashboard UI |
| **Auth** | Supabase Auth | User authentication |
| **Database** | Supabase (PostgreSQL) | Store investigations & matches |
| **Backend** | Supabase Edge Functions | OSINT pipeline APIs |
| **Graph Visualization** | D3.js | Interactive identity graph |
| **Deployment** | Cloudflare Workers | Edge hosting |
| **Matching Engine** | Python + Flask + NetworkX | OSINT + similarity analysis |

---

## 🚀 Features

### 🔍 OSINT Data Collection
Scans multiple platforms in parallel:

- GitHub  
- GitLab  
- Reddit  
- Dev.to  
- StackOverflow  
- Keybase  
- Twitter / X (existence check)  
- Instagram (existence check)  
- Facebook (existence check)  

👉 Returns:
- Username  
- Bio  
- Location  
- Email patterns  
- Account existence  

---

### 🧠 Fuzzy Matching Engine

| Algorithm | Purpose |
|----------|--------|
| Levenshtein | Character similarity |
| Partial Ratio | Substring match |
| Token Sort | Word-level match |
| Jaro-Winkler | Prefix similarity |
| Soundex | Phonetic similarity |
| Metaphone | Advanced phonetic matching |

👉 Final score:
- Username (40%)
- Bio (30%)
- Email (20%)
- Location (10%)

---

### 🌐 Graph Visualization

- Interactive **D3.js force graph**
- Nodes = profiles  
- Edges = similarity links  
- Edge thickness = confidence  
- Zoom, pan, drag supported  

---

### 📊 Confidence Classification

| Level | Meaning |
|------|--------|
| HIGH | Strong match |
| MEDIUM | Possible match |
| LOW | Weak match |

---

### 🚫 Not-Found Tracking

| Status | Meaning |
|------|--------|
| FOUND | Profile data retrieved |
| EXISTS | Profile exists |
| NOT FOUND | No account found |
| ERROR | API issue |

---

## 🏗️ System Architecture

```
User Input (username)
        ↓
OSINT Data Collection
        ↓
Fuzzy Matching Engine
        ↓
Similarity Scoring
        ↓
Graph Construction
        ↓
Visualization (UI)
```

---

## 📁 Project Structure

```
identity-linker/
├── src/
│   ├── pages/
│   ├── components/
│   ├── lib/
├── supabase/
│   ├── functions/
│   └── migrations/
├── public/
```

### 🐍 Python Backend

```
identity-linker-python/
├── main.py
├── core/
├── graph/
├── visualization/
├── api/
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|-------|--------|-------------|
| GET | /api/health | Health check |
| POST | /api/search | OSINT scan |
| POST | /api/correlate | Matching |
| POST | /api/graph/build | Graph build |
| POST | /api/full-pipeline | Full pipeline |

---

## 🧪 Example Workflow

```bash
POST /api/full-pipeline
{
  "username": "johndoe",
  "threshold": 50
}
```

---

## 💡 Use Cases

- 🕵️ OSINT investigations  
- 🚨 Fraud detection  
- 🌐 Digital footprint analysis  
- 💼 Background verification  
- 🤖 Bot / fake account detection  

---

## ⚖️ Ethics & Usage

⚠️ This project is strictly for authorized and ethical use only

- Uses only public data  
- No scraping of private content  
- Respects API limits  
- Follows platform policies  

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

---

## 🏗️ Build

```bash
npm run build
```

---

## 👩‍💻 Author

**Keerthana C**  
GitHub: https://github.com/Keerthana-089  

---

## ⭐ Project Vision

To build a system that understands **identity as a network**, not isolated profiles.

---

<div align="center">

🔍 Built for OSINT Intelligence & Digital Identity Analysis  

</div>
