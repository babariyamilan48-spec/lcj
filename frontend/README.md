# LCJ Frontend

Modern React application built with Next.js 14, TypeScript, and TailwindCSS for the LCJ Career Assessment System.

## 🚀 Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Zustand** for state management
- **React Query** for API data fetching
- **Framer Motion** for animations
- **React Hook Form** with Zod validation
- **Responsive Design** for all devices

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   ├── globals.css     # Global styles
│   │   └── (routes)/       # Route groups
│   ├── components/         # Reusable components
│   │   ├── ui/            # Base UI components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── data/              # Static data (migrated from original)
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production
```bash
npm run build
npm start
```

### Testing
```bash
npm run test
npm run test:watch
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=LCJ Career Assessment
```

### TailwindCSS
The project uses TailwindCSS with custom configuration for:
- Custom color palette
- Custom animations
- Responsive design utilities
- Component classes

## 📱 Components

### Core Components
- **Layout Components**: Header, Footer, Sidebar
- **Form Components**: Input, Button, Select, Checkbox
- **UI Components**: Card, Modal, Toast, Loading
- **Test Components**: Quiz interface, Results display

### State Management
- **App Store**: Global application state
- **User Store**: User authentication and profile
- **Test Store**: Test progress and results

## 🎨 Styling

### Design System
- **Colors**: Primary and secondary color palettes
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale
- **Components**: Reusable component classes

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Flexible layouts and grids

## 🔌 API Integration

### Service Layer
- **HTTP Client**: Axios with interceptors
- **Error Handling**: Centralized error management
- **Caching**: React Query for data caching
- **Authentication**: JWT token management

### API Endpoints
- Authentication endpoints
- User management
- Test administration
- Results and reports

## 🧪 Testing

### Testing Stack
- **Jest**: Test runner
- **React Testing Library**: Component testing
- **MSW**: API mocking

### Test Structure
```
__tests__/
├── components/     # Component tests
├── hooks/         # Hook tests
├── utils/         # Utility tests
└── integration/   # Integration tests
```

## 📦 Deployment

### Docker
```bash
docker build -t lcj-frontend .
docker run -p 3000:3000 lcj-frontend
```

### Vercel
The application is configured for easy deployment on Vercel.

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use conventional commits

## 📄 License

This project is part of the LCJ Career Assessment System.
