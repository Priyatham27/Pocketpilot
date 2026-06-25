# ✈️ PocketPilot — Personal Finance & Budget Planner

**PocketPilot** is a state-of-the-art personal finance assistant designed to help you track your cash flow, manage debt, set savings goals, schedule upcoming bills, and plan trip budgets. Built with a modern glassmorphic UI, responsive layouts, smooth micro-animations, and client-side persistence, PocketPilot empowers you to take absolute control of your financial destiny.

---

## ✨ Premium Features & Modules

### 🏠 Time-Aware Dashboard & Greetings
* **Personalized Greeting**: Greets you with dynamic messages (Good Morning ☀️, Afternoon 🌤️, Evening 🌙, Night 🌌) customized with your editable display name.
* **Today's Snapshot**: View at a glance your active earnings, expenses, transaction counts, and net balance for the current day.
* **Smart Insights Widget**: Provides rules-based financial highlights, warnings (e.g. exceeding spending limits), savings achievements, and payment reminders.
* **Daily Inspiration Quotes**: Refreshes daily with a pool of **245+ hand-curated financial and self-discipline quotes** from legendary investors and philosophers, featuring a random non-repeating picker.
* **SVG Circular Goal Wheels**: Renders animated circular progress rings tracking your income goals, savings targets, and monthly spending limits.

### ✈️ Trip Budget Planner
* **Dynamic Budget Constructor**: Estimate costs across transportation, lodging, food, shopping, sightseeing, and emergency buffer pools.
* **Contribution Logger**: Gradually allocate savings towards individual trips with dates and notes.
* **Visual Travel Calendar**: View trips scheduled on an interactive timeline calendar.
* **Confetti Celebration**: Fires a celebratory animation when a trip reaches 100% funding.

### 📝 Financial Notes & Reminders Board
* **Kanban Notes Layout**: Write down financial ideas, salary changes, or repayment checklists.
* **Priority Levels & Tags**: Tag notes and color-code them by priority (High, Medium, Low).
* **Archive & Pinning**: Pin crucial notes to keep them visible at the top, or archive completed notes to keep your dashboard clean.
* **Due Date Reminders**: Set calendar alerts for key notes.

### 📊 Advanced Multi-Sheet Export Center
* Select individual data sheets (Transactions, Debts, Loans, Bills, Notes, Savings Goals, and Trips).
* Download data in one click as:
  * **CSV Format** (standard spreadsheet readable).
  * **Multi-Sheet Excel Workbook (.xlsx)** (tabbed per category using `xlsx`).
  * **Auto-Table Styled PDF Report** (beautifully structured PDF tables using `jspdf` and `jspdf-autotable`).

### ⏰ Payments Timeline & Bill Reminders
* Log recurring utility bills and subscriptions with due dates.
* Tracks outstanding vs paid items and displays total unpaid amounts.
* Interactive visual timeline plotting all upcoming payments (Debts, Loans, and Bills) color-coded by urgency.

### 🛍️ Smart Purchase Planner & Priority Purchases
* **Purchase Planner**: Log items you plan to buy in the future, allocate a budget, and set urgency priority.
* **Priority Purchases**: Highlights urgent purchases with deadlines and tracks total immediate capital required to purchase them.

### 💳 Debts & Loans Managers
* Track who you owe money to (Debts) and who owes you money or bank loan balances (Loans).
* Record partial payments and remaining balances with automated progress tracking.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js 13](https://nextjs.org/) (App Router, Client-Side State)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with LocalStorage persist middleware)
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Date Utilities**: [date-fns](https://date-fns.org/)
* **Export Libraries**: [XLSX](https://github.com/SheetJS/sheetjs), [jsPDF](https://github.com/parallax/jsPDF), [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v16 or higher) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Priyatham27/Pocketpilot.git
   cd Pocketpilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

4. Run TypeScript checks & Linter:
   ```bash
   npm run typecheck
   # and
   npm run lint
   ```

5. Build for production:
   ```bash
   npm run build
   ```
