# On Mind - Personal Journal & Note-Taking App

A modern, privacy-focused journal and note-taking application built with React, TypeScript, and Firebase.

## 🚀 Features

- **Personal Journaling** - Record daily thoughts, moods, and experiences
- **Smart Categorization** - Organize entries by categories (Ideas, Code Vault, YouTube, etc.)
- **Flashcards** - Create and manage learning flashcards
- **Search & Filter** - Find entries quickly with powerful search
- **Favorites & Pins** - Mark important entries for easy access
- **Mood Tracking** - Track your emotional state over time
- **YouTube Integration** - Save and organize video content
- **Responsive Design** - Works seamlessly on desktop and mobile

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd OM
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Firebase configuration in `.env.local`

4. **Set up Firebase:**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password + Google)
   - Create a Firestore database
   - Download your Firebase config and service account key

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- Firebase project
- Git

### Available Scripts

- `npm run dev` - Start development server (http://localhost:3002)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (Header, etc.)
│   ├── AuthForm.tsx    # Authentication forms
│   ├── EntryCard.tsx   # Entry display components
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
│   ├── firebase.ts     # Firebase configuration
│   ├── firebase-client.ts # Firebase client functions
│   └── ...
└── main.tsx           # Application entry point
```

## 🔐 Authentication

The app supports multiple authentication methods:
- **Email/Password** - Traditional account creation
- **Google OAuth** - Sign in with Google

## 📊 Data Migration

If migrating from Supabase (like this project did):
1. Use the migration scripts in the root directory
2. Follow the `FIREBASE_MIGRATION_GUIDE.md` for detailed instructions

## 🚀 Deployment

### Environment Variables

Required environment variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🔒 Security

- All user data is private and secured by Firestore security rules
- Authentication is handled by Firebase Auth
- No sensitive data is stored in the client

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Follow the troubleshooting guide in the documentation

## 🎉 Acknowledgments

- Built with modern React patterns and best practices
- Migrated from Supabase to Firebase for better reliability
- Inspired by the need for a simple, powerful personal note-taking solution

---

**Happy Journaling!** 📖✨