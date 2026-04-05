# 🏦 FinTrack Dashboard

A premium, high-performance financial analytics dashboard designed for modern financial tracking. Built with **React 19**, **Tailwind CSS v4**, and **Recharts**, it offers a seamless, interactive experience for monitoring income, expenses, and overall financial health.

![Dashboard Preview](https://via.placeholder.com/1200x600/0f172a/ffffff?text=FinTrack+Dashboard+Preview)

## ✨ Key Features

- **📊 Comprehensive Analytics**: Interactive charts showing balance trends, spending by category, and income vs. expense comparisons using **Recharts**.
- **💳 Transaction Management**: A robust system to add, edit, and delete transactions with full data persistence.
- **🔍 Advanced Filtering**: Deep search and filter capabilities by transaction type (Income/Expense), date range, and categories.
- **📈 Monthly Insights**: Automated calculations for top spending categories and month-over-month performance analysis.
- **🛡️ Role-Based Interface**: Secure **Administrator** and **Viewer** roles to control data manipulation capabilities.
- **🌓 Adaptive Theme**: Sleek Dark and Light modes with system preference detection.
- **📥 Data Portability**: Export your entire financial history to **CSV** or **JSON** formats instantly.
- **💾 Local Persistence**: All data is securely stored in your browser's `localStorage`, ensuring zero data loss without a backend.

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) (Vite & TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (The latest evolution of CSS-in-JS)
- **Visuals**: [Recharts](https://recharts.org/) (Composable charting library)
- **Icons**: [Lucide React](https://lucide.dev/) (Clean, consistent iconography)
- **Animations**: [Motion](https://motion.dev/) (Formally Framer Motion for fluid UI transitions)
- **Date Management**: `date-fns` (Precise date formatting and logic)


## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fintrack-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## 📖 Usage Guide

### Admin vs. Viewer Mode
- **Administrator**: Can create, edit, and delete all transactions. Use the role switcher in the sidebar to toggle permissions.
- **Viewer**: Read-only access to all charts and transaction history. Useful for safely sharing your finances.

### Filtering & Exporting
- Use the **Transactions** tab to sort and filter through thousands of entries.
- Click the **Export** buttons in the header to save your data for external use in Excel or other tools.

## 🤖 Future Roadmap
- [ ] **AI-Powered Insights**: Integration with Google Gemini for automated financial advice and anomaly detection.
- [ ] **Budgeting Mode**: Set monthly limits and get real-time alerts.
- [ ] **Cloud Sync**: Optional backend integration for cross-device synchronization.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
