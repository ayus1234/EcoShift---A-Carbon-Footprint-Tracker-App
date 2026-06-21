# EcoShift – A Carbon Footprint Tracker App

**EcoShift** is a web-based application designed to help individuals, especially interns, track their sustainable habits and measure real-time CO₂ savings. It promotes environmental awareness through habit tracking, data visualization, and community engagement.

---

## 🎯 Challenge Details
- **Chosen Vertical**: Environmental Sustainability & Habit Tracking
- **Approach and Logic**: The application focuses on translating abstract environmental impact into tangible metrics. It provides an intuitive interface for users to log daily sustainable actions. The backend logically calculates CO₂ savings based on predefined, scientifically-backed metrics for each action, storing this data in a lightweight, local SQLite database for speed and reliability.
- **How the Solution Works**: Users create a personal profile, select sustainability habits they wish to track, and regularly log their actions. The dashboard dynamically aggregates this data to show both individual milestones and collective community impact, leveraging Chart.js for real-time visualization. Data can be seamlessly exported for presentation.
- **Assumptions Made**: 
  - Assumes standard CO₂ emission factors for activities (e.g., 0.21 kg CO₂/km for driving vs cycling).
  - Assumes users will accurately and honestly self-report their activities.
  - Designed for a single-server deployment during the prototype phase.

## ✅ Challenge Compliance & Architectural Excellence
- **Repository Size**: Strictly under 10MB.
- **Git Strategy**: Entire project is housed within a single `main` branch.
- **Public Visibility**: The GitHub repository is configured as public.
- **Modular MVC Architecture**: The codebase is split logically into `routes/`, `db/`, and `middleware/` for maximum maintainability and separation of concerns.
- **Advanced Security**: Fully implemented Helmet (with strict CSP), Express-Rate-Limit, Express-Validator, HPP (HTTP Parameter Pollution protection), and payload limits.
- **Accessibility (a11y)**: Achieved full WCAG AA compliance with optimized color contrasts (4.5:1 ratio) and proper semantic HTML/ARIA attributes.

---

## 🔗 Live Demo

- [EcoShift – A Carbon Footprint Tracker App](https://ecoshift-a-carbon-footprint-tracker-app.onrender.com/)

---

## 🌟 Features
- ✅ Track daily sustainable actions (cycling, plant-based meals, etc.)
- 📊 Real-time dashboard with CO₂ savings, top performers, and category breakdowns
- 👥 Profile creation, switching, and management
- 📝 Log actions with quantity, date, and notes
- 📤 Export data as CSV, summary reports, and presentation-ready formats
- 📅 Date range filtering and quick select options
- 🔒 Local storage for auto-saving form data and preferences

---

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS (Bootstrap), JavaScript (Chart.js)
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Other Libraries**: date-fns, body-parser, cors

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)

### Installation
```bash
git clone https://github.com/your-username/ecoshift.git
cd ecoshift
npm install
```

### Run the App
```bash
npm start
# or for development
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📸 Screenshots

### 🏠 Landing Page
<img width="984" height="614" alt="Landing Page" src="https://github.com/user-attachments/assets/2c20af64-7cbe-4a8d-a2dd-fc6f98642cd9" />
  
The landing page introduces EcoShift with key features and a clear call-to-action for users to get started.

---

### 📊 Impact Dashboard
<img width="996" height="501" alt="Impact Dashboard" src="https://github.com/user-attachments/assets/09e04943-9619-4702-ad48-7eadf507de44" />
  
A summary dashboard displaying total CO₂ saved, active users, total actions, and average savings per person within a selected date range.

---

### 📈 Dashboard Analytics
<img width="908" height="620" alt="Dashboard Analytics" src="https://github.com/user-attachments/assets/ffc74fc7-fb38-4698-af32-5221a68996f6" />
  
Detailed analytics with category-wise CO₂ savings, top performers, and recent activity logs for better insights.

---

### 📝 Log Action
<img width="776" height="612" alt="Log Action" src="https://github.com/user-attachments/assets/53334334-166a-450c-a3f7-9d9e1f585e34" />
 
A form to log sustainable actions with fields for habit selection, date, quantity, and optional notes.

---

### 📝 My Recent Actions
<img width="753" height="416" alt="Log Action (2)" src="https://github.com/user-attachments/assets/b73b73b9-7bc5-4f3d-b27c-10ac54090f30" />
  
A list of recently logged sustainable actions with details like date, quantity, and CO₂ savings.

---

### 👤 Create Profile
<img width="760" height="527" alt="Create Profile" src="https://github.com/user-attachments/assets/f8f7db40-af7f-4ccc-9ec9-bc6dfedb9f8c" />
  
A profile creation form for entering user details such as name, email, and internship start date.

---

### 🔄 Switch Profile
<img width="508" height="473" alt="Switch Profile" src="https://github.com/user-attachments/assets/6125c587-4507-4495-bfe0-7d4222091e39" />
  
A dialog to switch between multiple user profiles, showing names, emails, and start dates.

---

### 🧾 Current Profile
<img width="458" height="492" alt="Current Profile" src="https://github.com/user-attachments/assets/0256f2f6-6f8a-48a6-bbe3-a37b10fb4cf5" />
  
A profile details view displaying user information, profile ID, and selected habits.

---

### 📤 Export & Reporting
<img width="580" height="590" alt="Export   Reporting" src="https://github.com/user-attachments/assets/92903caf-8769-432f-9276-535b3af24537" />
  
An export and reporting interface offering options to download CSV data, generate summary reports, and prepare presentation-ready insights.

---

## 📤 Export Capabilities
- **CSV Export**: Raw data for Excel/Google Sheets
- **Summary Report**: Executive overview with key metrics
- **Individual Reports**: Per-user progress summaries
- **Presentation Data**: Stakeholder-ready insights

---

## ⚙️ Configuration
- Configurable via `config.json`
- Supports themes, language, date format, and CO₂ factors
- Data retention: 365 days
- Export formats: CSV, HTML, PDF

---

## 📡 API Endpoints
- `GET /api/habits`
- `POST /api/users`
- `GET /api/users`
- `POST /api/users/:userId/habits`
- `GET /api/users/:userId/habits`
- `POST /api/logs`
- `GET /api/users/:userId/logs`
- `GET /api/dashboard`

---

## 📄 License
This project is licensed under the MIT License.

---

## 🙌 Acknowledgements
- Stakeholders and mentors for feedback
- Open-source libraries: Chart.js, Bootstrap, date-fns

