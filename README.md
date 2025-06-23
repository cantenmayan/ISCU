# ISCU
Integrating Shop with Code Upgrades

Electronic Test Bench Management & AI Integration Dashboard
Overview
This dashboard is a robust, production-ready React application designed to centralize the management of your electronic test bench and general workshop operations. It provides a structured way to track equipment, manage projects, log maintenance, and lays the foundational groundwork for advanced AI integration, specifically with the "Phonix" AI cluster.

The application is built with React for a dynamic and responsive user interface, utilizes Tailwind CSS for modern styling, and leverages Google Cloud Firestore for real-time, multi-user data persistence.

Features
Shop Overview: A high-level view of your workshop's health, efficiency metrics (initially placeholders for future AI integration), inventory projections, and the operational status of your Phonix AI cluster. Includes actionable links to relevant sections.

Equipment Inventory:

Comprehensive tracking of all tools, components, and equipment.

CRUD (Create, Read, Update, Delete) operations for managing inventory items.

Pre-populated with default equipment list on first load if the database is empty.

Real-time updates visible across all connected user sessions.

Projects:

Dedicated section for managing individual projects.

Track project status, due dates, required tools, hardware, blockers, and notes.

CRUD operations for project entries.

Pre-populated with default project examples.

Real-time updates.

Maintenance Log:

Track maintenance and calibration records for equipment.

Record item, last service date, next due date, and notes.

CRUD operations for maintenance entries.

Pre-populated with default maintenance records.

Real-time updates.

AI Integration Concepts: Outlines potential future integrations with the "Phonix" AI cluster for predictive maintenance, automated testing assistance, workplace safety monitoring, intelligent inventory management, and problem-solving with available components.

Responsive Design: Optimized for seamless use on both mobile devices and workstation computers.

User Feedback: Custom notification system for success and error messages, and confirmation modals for critical actions like deletion.

Getting Started
Follow these steps to get your dashboard up and running.

Prerequisites
Node.js and npm (or yarn) installed on your development machine.

A Google Cloud Firebase project set up.

Firestore Database initialized in your Firebase project.

Firebase Authentication (anonymous sign-in is used by default).

1. Firebase Setup
Create a Firebase Project: Go to the Firebase Console and create a new project.

Initialize Firestore: In your Firebase project, navigate to "Firestore Database" and click "Create database." Start in "production mode" for security rules, as we will define them next.

Enable Authentication: In your Firebase project, go to "Authentication," then "Sign-in method." Enable the "Anonymous" provider.

Get Firebase Config: In your Firebase project settings (⚙️ icon next to "Project overview" -> "Project settings"), find your "Web app's config" snippet. It will look something like this:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


You will need the projectId and appId values. The firebaseConfig object (stringified) and appId are provided to the Canvas environment as __firebase_config and __app_id variables, respectively.

2. Firestore Security Rules
Crucial for multi-user functionality! Navigate to "Firestore Database" -> "Rules" in your Firebase Console and replace the existing rules with the following. These rules allow any authenticated user (including anonymous users in this setup) to read and write to the public equipment, maintenance, and projects collections.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write to the public equipment data
    match /artifacts/{appId}/public/data/equipment/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Allow authenticated users to read and write to the public maintenance data
    match /artifacts/{appId}/public/data/maintenance/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Allow authenticated users to read and write to the public projects data
    match /artifacts/{appId}/public/data/projects/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Rule for private user data (if you add user-specific private collections later)
    match /artifacts/{appId}/users/{userId}/{collection=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}


3. Running the Application
This application is provided as a single React App.js component. To run it locally, you can set up a standard React project:

Create a new React project:

npx create-react-app my-workshop-dashboard
cd my-workshop-dashboard


Replace src/App.js: Delete the contents of src/App.js and paste the entire React code block provided in the immersive artifact into it.

Add Tailwind CSS CDN: In your public/index.html file, inside the <head> section, ensure the Tailwind CSS CDN is linked. (The React code itself injects this, but for a traditional setup, it's good practice to ensure it's there or configured via PostCSS if you prefer a build step).

<script src="https://cdn.tailwindcss.com"></script>


Add Inter Font Link: Also in public/index.html, inside the <head> section:

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">


Simulate Global Variables (for local testing): The Canvas environment provides __app_id, __firebase_config, and __initial_auth_token globally. For local development, you might need to mock these or replace them directly in App.js temporarily:

// In App.js, near the top where these are declared:
const appId = 'your-firebase-project-id'; // Replace with your actual project ID
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "your-firebase-project-id",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}; // Replace with your actual Firebase config object
const initialAuthToken = null; // Or generate a custom token for testing if needed


Remember to remove or comment out these hardcoded values before deploying if you intend to use them in a dynamic environment like Canvas.

Start the development server:

npm start
# or
yarn start


The application should open in your browser (usually http://localhost:3000).

Future Enhancements & AI Integration (Phonix Cluster)
This dashboard is built with future expansion in mind, particularly for deep integration with your "Phonix" AI cluster.

Real-time Metrics in Shop Overview:

Tool Utilization: Implement IoT sensors (e.g., RFID tags on tools, current sensors on power tools) connected to Phonix. Phonix processes this data to calculate and push real-time tool usage metrics to Firestore, which the dashboard then displays.

Project Completion Rate: Integrate Phonix with task management or Git repositories. AI models analyze commit history, task status updates, and estimated vs. actual times to provide accurate completion rates.

Rework Rate / Average Repair Time: Require more detailed logging within the maintenance and project sections (e.g., specific repair tasks with start/end times, identifying "rework" tags). Phonix can analyze these logs to derive insights.

Intelligent Inventory Management:

Automated Reordering: Phonix analyzes historical consumption patterns (from equipment/project logs) and current inventory levels to predict when specific consumables or components will run low. It can then trigger automated reorder suggestions or even direct purchase orders via integrated APIs.

Component Problem Solving: When a project lists requiredHardware or requiredTools, Phonix can cross-reference this with your live inventory. If an item is missing or low, Phonix could suggest alternatives from Salvaged Components or recommend a purchase.

Predictive Maintenance:

Install sensors on critical workshop equipment (e.g., vibration sensors on grinders, temperature sensors on power supplies). Phonix's machine learning models can analyze this sensor data to detect anomalies and predict equipment failures before they happen, scheduling proactive maintenance tasks in the dashboard's Maintenance Log.

Workplace Safety Monitoring:

Integrate vision systems and ambient sensors (e.g., air quality, noise levels) with Phonix. AI can monitor for unsafe practices (e.g., not wearing safety glasses), detect spills or hazards, and alert relevant personnel, potentially creating safety incident logs within the dashboard.

Contributing
Contributions are welcome! If you have ideas for improvements, bug fixes, or new features, please feel free to:

Fork the repository.

Create a new branch (git checkout -b feature/your-feature-name).

Make your changes.

Commit your changes (git commit -m 'Add new feature').

Push to your branch (git push origin feature/your-feature-name).

Open a Pull Request.

7% of your profits if that so happens. buy me a coffee if it helps you out :)

License
This project is open-sourced under the MIT License. See the LICENSE file for more details.
