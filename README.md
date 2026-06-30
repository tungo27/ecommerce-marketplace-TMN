# E-commerce Marketplace

This project is an E-commerce Marketplace system comprising 3 main parts:
- **Backend**: NestJS API
- **Frontend Storefront**: Customer-facing interface (Next.js)
- **Frontend Backoffice**: Administrator interface (Vite + React)

## System Requirements
- Node.js (version 18+ or latest)
- Git

## Setup and Run Instructions (For New Members)

### 1. Clone the code to your machine
Open your terminal / command prompt and run:
```bash
git clone <your-repo-url>
cd ecommerce-marketplace
```

### 2. Install dependencies
The project uses **npm workspaces**, so you only need to run the `npm install` command once in the root directory to install for all parts (backend, frontend):
```bash
npm install
```

### 3. Configure environment variables and Database (if any)
- Navigate to the `backend` directory and configure environment variables if necessary (e.g., create a `.env` file from `.env.example`).
- If the Backend uses Prisma as an ORM, run the following command to regenerate the Prisma Client:
```bash
cd backend
npx prisma generate
cd ..
```

### 4. Start the entire system
The project is pre-configured with a command to run all 3 servers simultaneously. From the root directory of the project, simply run:
```bash
npm run dev
```

### 5. Access the system
After successfully starting, the services will be available at the following addresses:
- **Frontend Storefront (Customers)**: [http://localhost:3000](http://localhost:3000)
- **Frontend Backoffice (Admin)**: [http://localhost:3001](http://localhost:3001)
- **Backend NestJS API**: [http://localhost:4000](http://localhost:4000)

#### 📖 API Documentation (Swagger UI)
Swagger is integrated into the Backend allowing you to view and test APIs directly from your browser.
- **Swagger Link**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---
*Note: If you are using Windows and when running the `npm run dev` command the terminal stops (freezes) and doesn't continue, please click inside that terminal and press `Enter` or `Esc` to resume (this is a feature of Windows Quick Edit Mode).*
