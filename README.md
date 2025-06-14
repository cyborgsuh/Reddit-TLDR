# 🚀 Reddit TLDR

> ### AI-powered insights from Reddit discussions

Reddit TLDR is a powerful web application that leverages Google's Gemini AI to analyze and summarize discussions from Reddit. Instead of manually sifting through hundreds of comments to gauge public opinion, this tool automates the process, providing you with a clear, concise overview of sentiment and key talking points on any given topic.

---

## ✨ Key Features

*   **🎯 Targeted Reddit Analysis:** Search for any term to pull relevant posts.
*   **🧠 Powered by Gemini AI:** Utilizes Google's state-of-the-art AI for nuanced sentiment analysis and summarization.
*   **📊 At-a-Glance Results:** Each post is tagged with a sentiment: `Positive`, `Negative`, `Mixed`, or `Neutral`.
*   **🔬 Detailed Post Drill-Down:** View top comments and a bulleted list of positive/negative aspects for any individual post.
*   **📋 Comprehensive Summary:** Get a high-level dashboard with sentiment distribution and aggregated key insights.
*   **⏱️ Performance Metrics:** See exactly how long the data retrieval and AI processing took.

---

## 🛠️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need the following software installed on your machine:
*   **Node.js** (v18 or higher is recommended)
*   **npm** (which comes bundled with Node.js)
*   A **Google Gemini API Key**. You can get one for free from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  **Clone the repository:**
    ```bash
    https://github.com/Mustafa-Almitamy/Reddit-TLDR.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd reddit-tldr
    ```

3.  **Install NPM packages:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Once the server is running, open your browser and navigate to `http://localhost:5173` (or the address shown in your terminal) to see the application.

---

##  walkthrough How It Works: A Visual Guide

Here is a step-by-step walkthrough of the user journey from search to summary.

### **Step 1: Configure Your Analysis**

Start by entering your search term and providing your Google AI Studio API key. You can also adjust advanced settings like the number of posts to analyze, which gives you an estimated processing time.
![Form](/images/Form.png "Form")


### **Step 2: Select Your AI Model**

Choose the Gemini model that best fits your needs for performance and quality. The recommended model is highlighted for convenience.
![Fill](/images/Fill.png "Fill")



### **Step 3: View the Initial Analysis Results**

After clicking "Analyze Sentiment," the app fetches Reddit posts and presents them in a list. Each post is tagged with its overall sentiment (e.g., `Negative`, `Mixed`), allowing you to quickly identify trends.
![Cards](/images/Cards.png "Cards")



### **Step 4: Drill Down for Deeper Insights**

Click on any post to expand it. Here you can see the top comments from the thread and a concise, AI-generated summary of the key negative (or positive) aspects discussed.
![Drill](/images/Drill.png "Drill")


### **Step 5: Review the Final Summary Dashboard**

At the bottom of the results, a full **Analysis Summary** provides a holistic view. It includes:
*   **Sentiment Distribution:** A visual breakdown of the overall sentiment.
*   **Key Insights:** Aggregated positive and negative points from all discussions.
*   **Performance Metrics:** A transparent look at the analysis speed.
![Summary](/images/Summary.png "Summary")



---

## 🔮 Future Roadmap

This project is currently in a demonstration phase to showcase its core functionality.

> **📌 Important Note:**
> The app will go live once authentication, data storage, analytics, and other important features are implemented. Future plans include user accounts for saving API keys, storing analysis history, and potentially sharing public report pages.
