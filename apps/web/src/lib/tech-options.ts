export interface TechOption {
  value: string;
  label: string;
}

export const FRONTEND_OPTIONS: TechOption[] = [
  { value: "nextjs", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "solid", label: "Solid.js" },
];

export const BACKEND_OPTIONS: TechOption[] = [
  { value: "nodejs", label: "Node.js" },
  { value: "express", label: "Express.js" },
  { value: "fastapi", label: "FastAPI" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "nestjs", label: "NestJS" },
  { value: "go", label: "Go/Gin" },
  { value: "spring", label: "Spring Boot" },
];

export const DATABASE_OPTIONS: TechOption[] = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "sqlite", label: "SQLite" },
  { value: "redis", label: "Redis" },
  { value: "dynamodb", label: "DynamoDB" },
  { value: "supabase", label: "Supabase" },
  { value: "planetscale", label: "PlanetScale" },
];

export const AUTH_SERVICE_OPTIONS: TechOption[] = [
  { value: "auth0", label: "Auth0" },
  { value: "clerk", label: "Clerk" },
  { value: "supabase_auth", label: "Supabase Auth" },
  { value: "firebase_auth", label: "Firebase Auth" },
  { value: "nextauth", label: "NextAuth.js" },
  { value: "passport", label: "Passport.js" },
  { value: "jwt", label: "JWT (Custom)" },
];

export const PAYMENT_GATEWAY_OPTIONS: TechOption[] = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "square", label: "Square" },
  { value: "razorpay", label: "Razorpay" },
  { value: "paddle", label: "Paddle" },
];

export const PACKAGE_MANAGER_OPTIONS_NODE: TechOption[] = [
  { value: "npm", label: "npm" },
  { value: "yarn", label: "Yarn" },
  { value: "pnpm", label: "pnpm" },
  { value: "bun", label: "Bun" },
];

export const PACKAGE_MANAGER_OPTIONS_PYTHON: TechOption[] = [
  { value: "pip", label: "pip" },
  { value: "pipenv", label: "Pipenv" },
  { value: "poetry", label: "Poetry" },
  { value: "pipx", label: "pipx" },
  { value: "conda", label: "Conda" },
  { value: "uv", label: "uv" },
];

export const PACKAGE_MANAGER_OPTIONS_JAVA: TechOption[] = [
  { value: "maven", label: "Maven" },
  { value: "gradle", label: "Gradle" },
];

export const PACKAGE_MANAGER_OPTIONS_GO: TechOption[] = [
  { value: "go-mod", label: "Go Modules (go mod)" },
];

export const PACKAGE_MANAGER_OPTIONS_DOTNET: TechOption[] = [
  { value: "nuget", label: "NuGet" },
  { value: "dotnet-cli", label: ".NET CLI (dotnet)" },
];

// Keep generic alias for existing consumers
export const PACKAGE_MANAGER_OPTIONS: TechOption[] = PACKAGE_MANAGER_OPTIONS_NODE;

export const ORM_OPTIONS: TechOption[] = [
  { value: "prisma", label: "Prisma" },
  { value: "drizzle", label: "Drizzle ORM" },
  { value: "typeorm", label: "TypeORM" },
  { value: "sequelize", label: "Sequelize" },
  { value: "sqlalchemy", label: "SQLAlchemy" },
  { value: "mongoose", label: "Mongoose" },
  { value: "tortoise", label: "Tortoise ORM" },
  { value: "django_orm", label: "Django ORM" },
  { value: "gorm", label: "GORM" },
  { value: "entity_framework", label: "Entity Framework" },
];

export const RUNTIME_OPTIONS: TechOption[] = [
  { value: "nodejs", label: "Node.js" },
  { value: "deno", label: "Deno" },
  { value: "bun", label: "Bun" },
  { value: "python3.12", label: "Python 3.12" },
  { value: "python3.11", label: "Python 3.11" },
  { value: "go1.22", label: "Go 1.22" },
  { value: "java21", label: "Java 21" },
  { value: "dotnet8", label: " .NET 8" },
];
