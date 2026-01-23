# 🔬 LapManagerPro - Medical Laboratory Management System

A comprehensive, full-stack Laboratory Information Management System (LIMS) built with Next.js 14, designed to streamline medical laboratory operations.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css)

## ✨ Features

### 🏥 Patient Management
- Complete patient records with demographic information
- Visit history tracking with multiple visits per patient
- Quick search and filtering capabilities
- Referring doctor management

### 🧪 Test Management
- Customizable test templates with parameters
- Reference ranges with age/gender-specific values
- Test categories organization
- Lab-to-Lab external test outsourcing

### 📊 Specialized Testing Modules
- **CASA (Computer-Assisted Semen Analysis)** - Comprehensive reproductive health testing with 50+ parameters
- **Culture & Sensitivity** - Advanced microbiology with antibiotic susceptibility testing
- **Standard Lab Tests** - CBC, Chemistry, Hormones, and more

### 📄 Professional PDF Reports
- Customizable headers and footers
- Laboratory branding with logo
- Electronic signatures
- Multi-language support (Arabic RTL included)

### 💰 Billing & Payments
- Fee tracking and invoicing
- Discount management with audit trails
- Partial payment support
- Receipt generation with QR code for digital payments

### 🔐 User Management & Security
- Role-based access control (Super Admin, Admin, User)
- Granular permissions system
- Audit logging for compliance
- Secure authentication with NextAuth.js

### 🌐 Internationalization
- **4 Languages**: English, Arabic (RTL), French, Spanish
- Fully translated UI and reports
- Locale-aware date/currency formatting

### ☁️ Cloud Features (Online Version)
- Automatic daily backups
- Multi-device sync
- Zero IT setup required
- 99.9% uptime guarantee

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js |
| **Styling** | Tailwind CSS |
| **UI Components** | Custom components with Framer Motion |
| **PDF Generation** | Custom PDF engine |
| **Deployment** | Vercel |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon account)
- npm/yarn/pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/medical-lab-minimal.git
   cd medical-lab-minimal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following in `.env.local`:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── (protected)/   # Authenticated pages
│   │   └── (public)/      # Public pages
│   ├── api/               # API routes
│   └── lib/               # Server utilities
├── components/            # React components
│   ├── landing/          # Landing page components
│   └── ui/               # Reusable UI components
├── messages/             # i18n translation files
└── prisma/               # Database schema & migrations
```

## 📊 Database Schema

Key models include:
- `Patient` - Patient demographics and contact info
- `PatientVisit` - Visit records with financials
- `Test` - Individual test records
- `TestTemplate` - Reusable test definitions
- `CasaAnalysis` - CASA test data
- `CultureSensitivity` - Microbiology results
- `User` - Authentication and roles

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Contact

- **Website**: [lapmanagerpro.com](https://medical-lab-minimal-kdp7.vercel.app/)
- **Email**: support@lapmanagerpro.com
- **Phone**: +2 (011) 26649009

---

Made with ❤️ for medical laboratories worldwide
