# 🚀 Reddit TLDR

> **AI-powered Reddit Insights & Summarization Platform**

Reddit TLDR is a full-stack web application that leverages Google's Gemini AI to analyze, summarize, and visualize sentiment from Reddit discussions. Designed for researchers, marketers, and curious users, it transforms complex Reddit threads into actionable insights—saving you hours of manual reading and analysis.

---

## 🌟 Features

- **🔍 Smart Reddit Search:** Instantly search any topic or keyword and fetch relevant Reddit posts and comments.
- **🤖 Gemini AI Summarization:** Uses Google Gemini AI for advanced sentiment analysis and concise, human-like summaries.
- **📈 Visual Sentiment Dashboard:** Interactive charts and cards show sentiment distribution and key talking points at a glance.
- **📝 Drill-Down Analysis:** Expand any post to see top comments and AI-generated lists of positive/negative aspects.
- **🔑 Secure API Key Management:** Store your Gemini API key securely with encryption and manage it from your settings.
- **🗝️ User Authentication:** Sign up, log in, and manage your account securely. OAuth with Reddit for higher API limits.
- **⚙️ Customizable Preferences:** Set default models, post counts, and save frequently used keywords.
- **🛡️ Account & Security Tools:** Change password, manage API keys, and access a Danger Zone for account deletion.
- **🕵️‍♂️ Keyword Monitoring:** Automatically track keywords on Reddit and get notified of new mentions.
- **🌗 Dark Mode:** Beautiful, responsive UI with full dark mode support.

---

## 🌐 Try It Live

> **The easiest way to experience Reddit TLDR is to use the live demo:**
>
> 👉 [https://reddit-tldr.netlify.app/](https://reddit-tldr.netlify.app/)
>
> No local setup required. Just sign up and start exploring Reddit insights instantly!

---

## 📦 Tech Stack & Architecture

- **Frontend:** React + TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **AI:** Google Gemini API (via user-provided key)
- **Deployment:** Netlify (serverless functions for Reddit API proxy)
- **Other:** React Router, Lucide Icons, custom hooks & context

---

## 🖥️ Usage Guide

1. **Sign Up & Log In:** Create an account or log in. Connect your Reddit account for enhanced features.
2. **Configure Analysis:** Enter a search term, select your AI model, and set the number of posts to analyze.
3. **Run Analysis:** Click "Analyze Sentiment" to fetch and process Reddit data.
4. **Explore Results:** View sentiment tags, expand posts for details, and review the summary dashboard.
5. **Manage Settings:** Go to the Settings page to manage your API key, preferences, keywords, and account.
6. **Monitor Keywords:** Set up keyword monitoring to track new Reddit mentions automatically.

---

## 🛡️ Security & Privacy
- **API Keys** are encrypted and never shared.
- **User Data** is stored securely in Supabase.
- **OAuth** with Reddit is used for higher API rate limits and privacy.

---

## 🛠️ Project Structure

```
Reddit-TLDR/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Main app pages (Dashboard, Settings, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React context providers
│   ├── lib/                # Supabase and utility libraries
│   └── utils/              # Helper functions
├── public/                 # Static assets
├── netlify/functions/      # Serverless backend functions
├── supabase/               # Database and edge function code
├── images/                 # App screenshots and illustrations
├── package.json            # Project metadata and scripts
└── README.md               # Project documentation
```

---

## 📸 Screenshots

- **Form & Model Selection:**
  ![Form](/images/Form.png)
  ![Fill](/images/Fill.png)
- **Results & Drill-Down:**
  ![Cards](/images/Cards.png)
  ![Drill](/images/Drill.png)
- **Summary Dashboard:**
  ![Summary](/images/Summary.png)

---

## 🚀 Roadmap & Contributions

- [ ] Public report sharing
- [ ] Email notifications for keyword monitoring
- [ ] More AI models and analytics
- [ ] Community features

**Contributions are welcome!** Please open issues or pull requests for suggestions and improvements.

---

## 👤 Credits

- **AI:** Google Gemini
- **Backend:** Supabase
- **UI:** Tailwind CSS, Lucide Icons

