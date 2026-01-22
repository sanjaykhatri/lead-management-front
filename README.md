# Lead Management System - Frontend

A modern, full-featured Lead Management System built with Next.js, TypeScript, Material-UI, and Tailwind CSS. This application provides a comprehensive platform for managing leads, service providers, locations, and subscriptions.

## 🚀 Features

### Admin Panel
- **Dashboard**: Overview of all leads with filtering and real-time updates
- **Leads Management**: View, filter, and manage leads by status, location, and date
- **Users Management**: Admin user management system
- **Service Providers**: Manage service provider accounts and subscriptions
- **Locations**: Manage business locations
- **Plans**: Subscription plan management
- **Analytics**: Business analytics and reporting
- **Settings**: System configuration and Pusher real-time settings

### Provider Panel
- **Dashboard**: Service provider dashboard with assigned leads
- **Leads Management**: View and update lead status
- **Profile Management**: Update provider profile information
- **Subscription**: View and manage subscription plans
- **Authentication**: Secure login, signup, and password recovery

### Public Interface
- **Location Selection**: Public interface for selecting locations
- **Lead Submission**: Submit leads for specific locations

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.7 (App Router)
- **Language**: TypeScript 5
- **UI Libraries**: 
  - Material-UI (MUI) 7.3.6
  - Tailwind CSS 4
- **State Management**: React Hooks
- **HTTP Client**: Axios 1.13.2
- **Real-time**: Pusher.js 8.4.0
- **Notifications**: React Hot Toast 2.6.0
- **Icons**: Heroicons, Iconify
- **Styling**: Emotion, Perfect Scrollbar

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (or yarn/pnpm/bun)
- **Backend API**: The backend API server should be running (default: `http://localhost:8000`)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lead-management-front
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Optional: Add other environment variables as needed
```

**Note**: The API URL should point to your backend server. If your backend runs on a different port or domain, update this accordingly.

### 4. Build Icons (Automatic)

Icons are automatically built during `npm install` via the `postinstall` script. If you need to rebuild them manually:

```bash
npm run build:icons
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
lead-management-front/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin panel routes
│   │   ├── dashboard/            # Admin dashboard
│   │   ├── leads/                # Leads management
│   │   ├── users/                # User management
│   │   ├── service-providers/    # Service provider management
│   │   ├── locations/            # Location management
│   │   ├── plans/                # Subscription plans
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── settings/             # System settings
│   │   └── login/                # Admin login
│   ├── provider/                 # Service provider routes
│   │   ├── dashboard/            # Provider dashboard
│   │   ├── leads/                # Provider leads
│   │   ├── profile/              # Provider profile
│   │   ├── subscription/         # Subscription management
│   │   ├── login/                # Provider login
│   │   ├── signup/               # Provider signup
│   │   └── forgot-password/      # Password recovery
│   ├── lead/                     # Public lead submission
│   │   └── [location]/           # Location-specific lead form
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (location selection)
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── provider/                 # Provider-specific components
│   ├── common/                   # Shared components
│   └── ui/                       # UI components (Button, Card, etc.)
├── hooks/                        # Custom React hooks
│   └── usePusher.ts              # Pusher real-time hook
├── lib/                          # Utility libraries
│   ├── api.ts                    # Axios API client configuration
│   └── cn.ts                     # Class name utility
├── assets/                       # Static assets
│   └── iconify-icons/            # Icon assets
├── vendor/                       # Third-party vendor code
│   └── vuexy-starter/            # Vuexy template components
├── public/                       # Public static files
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Tokens are stored in `localStorage` and automatically included in API requests via Axios interceptors.

### Admin Authentication
- Login: `/admin/login`
- Protected routes require authentication
- Automatic redirect to login on 401/403 errors

### Provider Authentication
- Login: `/provider/login`
- Signup: `/provider/signup`
- Password Recovery: `/provider/forgot-password`

## 🔄 Real-time Updates

The application uses Pusher for real-time updates:

- **Admin Channel**: Real-time lead assignments and status updates
- **Provider Channels**: Private channels for provider-specific notifications
- Configuration is fetched from backend settings
- Automatic reconnection on disconnect

## 🎨 Styling

The project uses a combination of:
- **Tailwind CSS**: Utility-first CSS framework
- **Material-UI**: Component library with theming
- **Emotion**: CSS-in-JS for dynamic styling
- **Vuexy Template**: Pre-built admin template components

## 📡 API Integration

The API client is configured in `lib/api.ts`:

- Base URL from `NEXT_PUBLIC_API_URL` environment variable
- Automatic token injection from localStorage
- Error handling and automatic redirects
- Request/response interceptors

## 🧪 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling

### Component Organization
- Keep components in appropriate directories
- Use shared components from `components/ui/`
- Admin components in `components/admin/`
- Provider components in `components/provider/`

### API Calls
- Use the configured `api` instance from `lib/api.ts`
- Handle loading and error states
- Implement proper TypeScript interfaces

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify `NEXT_PUBLIC_API_URL` in `.env.local`
   - Ensure backend server is running
   - Check CORS configuration on backend

2. **Authentication Issues**
   - Clear localStorage and try logging in again
   - Verify token format and expiration
   - Check backend authentication endpoints

3. **Pusher Connection Issues**
   - Verify Pusher configuration in backend settings
   - Check browser console for connection errors
   - Ensure Pusher credentials are correct

4. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`

5. **Icon Build Errors**
   - Run `npm run build:icons` manually
   - Check `assets/iconify-icons/` directory exists

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run build:icons` - Build icon assets

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your production API URL
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted with Node.js

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Pusher Documentation](https://pusher.com/docs)

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license information here]

## 👨‍💻 Support

For issues and questions:
- Check the troubleshooting section
- Review the code documentation
- Contact the development team

---

**Built with ❤️ using Next.js and TypeScript**
