# JAPA - Visa Application Assistant Frontend

A comprehensive frontend application for managing visa applications, recommendations, and document tracking.

## Features

- **Landing Page**: Overview of the application with features and how it works
- **Authentication**: Login and Register pages with dummy authentication
- **Home Dashboard**: User overview with active applications and quick actions
- **Recommendations**: Personalized visa recommendations based on user profile
- **Checklist**: Detailed checklist for each visa with progress tracking
- **Documents**: Document management and tracking system
- **Profile**: User profile management

## Tech Stack

- React 18
- React Router DOM 6
- Vite
- React Icons

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Usage

1. **Landing Page**: Start at the root URL (`/`) to see the landing page
2. **Register/Login**: Create an account or login (dummy authentication - any credentials work)
3. **Get Recommendations**: Navigate to the recommendation page to see visa options
4. **View Checklist**: Click on any visa recommendation to see the detailed checklist
5. **Manage Documents**: Upload and track your visa documents
6. **Update Profile**: Keep your information up to date

## Pages

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/home` - User dashboard (protected)
- `/recommendation` - Visa recommendations (protected)
- `/checklist/:visaId` - Visa checklist page (protected)
- `/documents` - Document management (protected)
- `/profile` - User profile (protected)

## Dummy Data

The application uses dummy data for:

- Visa recommendations
- User recommendations
- Documents
- Checklist items

All data is stored in `src/data/dummyData.js`

## Design

The application follows the design system from `design.json`:

- Color palette: #FFFFFF, #E8F1FF, #4A90E2, #333333, #FFD0D6
- Clean, professional, minimalist design
- Responsive layout

## Notes

- Authentication is dummy-based (no real backend)
- All data is stored in localStorage for session persistence
- File uploads are simulated (no actual file handling)
