# Reaft + Tailwind CSS Sample App

This is a sample application demonstrating the Reaft library (a React-like library) with Tailwind CSS.

## Features

- ⚛️ **Reaft**: Custom React-like library with hooks support
- 🎨 **Tailwind CSS**: Utility-first CSS framework
- ⚡ **Vite**: Fast development server and build tool
- 📦 **TypeScript**: Full TypeScript support

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Navigate to the project directory:
   ```bash
   cd libs/reaft/samples/hello-world-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## What's Included

- **Reaft Components**: Function components with hooks
- **State Management**: `useState` hook implementation
- **Event Handling**: Synthetic event system
- **Responsive Design**: Tailwind CSS classes
- **Hot Module Replacement**: Fast development feedback

## Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
├── index.css        # Global styles and Tailwind imports
├── App.css          # Component-specific styles
├── vite-env.d.ts    # Type definitions
└── assets/
    └── react.svg    # React logo asset
```

## Learn More

- [Reaft Documentation](../../README.md)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)