# Konoz Bag - Luxury Handbag E-commerce Platform

A modern, full-stack e-commerce application for luxury handbags built with Next.js, featuring admin dashboard, order management, product customization, and customer comments.

## Features

- 🛍️ **Product Catalog**: Display luxury handbag colors with images and pricing
- 🛒 **Order Management**: Customer ordering with size, color, and delivery options
- 👨‍💼 **Admin Dashboard**: Manage orders, products, and comments with filtering and deletion
- 💬 **Customer Comments**: Leave and manage product reviews
- 🎨 **Custom Colors**: Request custom colors with reference images
- 📧 **Email Notifications**: Order status updates and notifications
- 🌐 **Multi-language Support**: Arabic and English translations
- 📱 **Responsive Design**: Mobile-first UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Resend for notifications
- **Deployment**: Vercel
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ ([Download here](https://nodejs.org/))
- npm or yarn
- Git
- A Vercel account ([Sign up here](https://vercel.com/))
- PostgreSQL database (for production)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd konoz-bag
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/konoz_bag"
   RESEND_API_KEY="your_resend_api_key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed initial data (optional):**
   ```bash
   npx prisma db seed
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment to Vercel

Follow these steps to deploy your Konoz Bag application to Vercel:

### Step 1: Prepare Your Project

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Push to your Git repository:**
   ```bash
   git push origin main
   ```

### Step 2: Set Up Vercel Account and CLI

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```
   Follow the prompts to authenticate with your Vercel account.

### Step 3: Configure Database for Production

Since this project uses Prisma with PostgreSQL, you need a production database:

1. **Create a PostgreSQL database:**
   - Use [Supabase](https://supabase.com/), [PlanetScale](https://planetscale.com/), or [Railway](https://railway.app/)
   - Or use Vercel's Postgres add-on if available

2. **Update your DATABASE_URL:**
   - Get the connection string from your database provider
   - It should look like: `postgresql://username:password@host:port/database`

### Step 4: Deploy to Vercel

1. **Deploy the project:**
   ```bash
   vercel
   ```

2. **Follow the prompts:**
   - Link to existing project or create new: Choose "Create new project"
   - Project name: Enter "konoz-bag" or your preferred name
   - Directory: Press Enter (current directory)
   - Build settings: Vercel will auto-detect Next.js

3. **Set environment variables in Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add the following variables:
     - `DATABASE_URL`: Your production database URL
     - `RESEND_API_KEY`: Your Resend API key
     - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (e.g., `https://konoz-bag.vercel.app`)

4. **Run database migrations on Vercel:**
   ```bash
   vercel env pull .env.local
   npx prisma generate
   npx prisma db push
   ```

5. **Redeploy if needed:**
   ```bash
   vercel --prod
   ```

### Step 5: Post-Deployment Setup

1. **Access your admin dashboard:**
   - Visit `https://your-deployment-url.vercel.app/admin`
   - Password: `konozbag/rama`

2. **Seed initial products (optional):**
   - In the admin dashboard, click "Seed Collection" to add sample products

3. **Configure domain (optional):**
   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain if desired

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `RESEND_API_KEY` | API key for Resend email service | Yes |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application | Yes |

## Database Schema

The application uses Prisma ORM with the following main models:
- `ProductImage`: Product colors with images and pricing
- `Order`: Customer orders with status tracking
- `Comment`: Customer product reviews

## Usage

### For Customers:
- Browse products on the homepage
- Select size, color, and delivery options
- Place orders with OTP verification
- Leave comments on products
- Request custom colors with reference images

### For Admins:
- Access admin dashboard at `/admin`
- Manage orders: filter by status, update status, delete with/without notification
- Add/edit/delete products
- Moderate comments: view and delete inappropriate comments

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a Pull Request

## License

This project is private and proprietary.

---

Built with ❤️ using Next.js and deployed on Vercel
