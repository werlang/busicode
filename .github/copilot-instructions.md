# BusiCode - Copilot Instructions

## Project Architecture

**BusiCode** is a full-stack educational business simulation platform with a **dual-architecture**: a legacy frontend and a modern REST API backend with **JWT-based authentication**.

### Two Distinct Applications
1. **Legacy Web App** (`/web/`) - ES6 modules SPA with localStorage persistence
2. **Modern REST API** (`/api/`) - Express.js with MySQL, full CRUD operations, JWT authentication

### Key Architectural Decisions

**Authentication System**: Uses JWT tokens with bcrypt password hashing:
- Admin users stored in `admin_users` table with bcrypt-hashed passwords
- All write operations (POST, PUT, DELETE) require valid JWT token
- Read operations (GET) are public for student access
- Frontend operates in two modes: read-only (students) and full-access (authenticated admins)

**Backend API Design**: Uses a custom `Model` base class (`api/model/model.js`) that provides:
- Field-based validation (`allowUpdate`, `insertFields`)
- Automatic UUID generation with `crypto.randomUUID()`
- Instance-database synchronization after updates
- Consistent monetary field type conversion (`parseFloat()` everywhere)

**Database Patterns**: All monetary fields must return JavaScript `number` types, not strings. The static methods in models (`getAll`, `getByClass`) convert DB results using `.map()` with `parseFloat()`.

## Critical Development Workflows

### Docker Development
```bash
# Primary development command
docker compose up -d

# API logs for debugging
docker compose logs api

# API runs on :3000, Web on :80, MySQL on :3306
# Database auto-initializes with schema.sql on first startup
```

### Authentication Workflow
```javascript
// All write operations require authentication middleware
import { authenticateToken } from '../middleware/auth.js';
router.post('/', authenticateToken, async (req, res, next) => {
    // Protected route implementation
});

// Frontend authentication flow
const authManager = new AuthManager();
await authManager.login('admin', 'admin123');
const authenticatedRequest = authManager.getAuthenticatedRequest();
```

### Model Pattern Usage
```javascript
// Correct model instantiation pattern
const company = new Company(dbData);
await company.get(); // Always sync with DB before operations

// After updates, instances auto-sync
await company.addRevenue(description, amount);
// company.current_budget is now updated in memory
```

### Monetary Field Consistency
All monetary values must use `parseFloat()` conversion in:
- Model constructors (`price: parseFloat(price) || 0`)
- Static methods (`return products.map(p => ({ ...p, price: parseFloat(p.price) || 0 }))`)
- After database updates (`this.current_budget = parseFloat(newBudget)`)

## Authentication & Security

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Hash**: Generated with bcrypt salt rounds 10

### JWT Token Management
- **Expiration**: 24 hours
- **Secret**: `process.env.JWT_SECRET` or default fallback
- **Header Format**: `Authorization: Bearer <token>`
- **Payload**: `{ id, username, type: 'admin', iat, exp }`

### Protected Routes
All write operations require `authenticateToken` middleware:
```javascript
// Students: POST, PUT, DELETE
// Classes: POST, PUT, DELETE
// Companies: POST, PUT, DELETE (all member/revenue/expense operations)
// Products: POST, PUT, DELETE (including sales recording)
```

### Frontend Authentication States
- **Read-Only Mode**: Students can view all data, no action buttons visible
- **Admin Mode**: Full CRUD access after authentication
- **UI Indicators**: Header shows auth status, read-only warnings in sections

## Project-Specific Conventions

### UUID Generation
Always use `crypto.randomUUID()`, never external libraries. Set in model constructors if not provided.

### Error Handling
Use `CustomError` class with proper HTTP status codes:
```javascript
throw new CustomError(400, 'Student is already a member of this company');
throw new CustomError(401, 'Access token required'); // Auth errors
```

### Route Structure
- Routes mounted at root level (`/students`, `/companies`, not `/api/students`)
- Auth routes at `/auth/*` (login, logout, verify, status)
- Always refresh model instances: `await this.get()` before critical operations
- Use `include_details=true` query param for nested data

### Business Logic Constraints
- **Duplicate Prevention**: Companies check existing members before adding
- **Balance Validation**: Students need sufficient balance for contributions
- **Deletion Rules**: Products with sales cannot be deleted
- **Budget Tracking**: Revenues/expenses update company budget + instance properties
- **Authentication Required**: All data modification requires valid admin JWT

## Integration Points

### Database Schema (`database/schema.sql`)
- **Authentication**: `admin_users` table with bcrypt password hashing
- UUID primary keys across all tables
- DECIMAL(10,2) for all monetary fields
- Cascading deletes with foreign keys
- Unique constraints prevent duplicate memberships
- **Auto-initialization**: Schema runs automatically on first MySQL container start

### Cross-Component Communication
- Frontend: Event-driven SPA with view managers + authentication events
- Backend: Express middleware pipeline with centralized error handling + JWT validation
- Data Flow: Models ↔ MySQL helper ↔ Routes ↔ Frontend (with auth layer)

### Authentication Events
Frontend components listen for authentication changes:
```javascript
document.addEventListener('authenticationChanged', (event) => {
    const { type, isAuthenticated, admin } = event.detail;
    // Update UI state, enable/disable features
});
```

### External Dependencies
- **mysql2**: Connection pooling with auto-reconnect
- **Express**: RESTful API with CORS enabled + JWT auth middleware
- **bcrypt**: Password hashing (salt rounds: 10)
- **jsonwebtoken**: JWT token generation and validation
- **Docker**: Multi-service orchestration (api + mysql + web)

## Testing & Debugging

### Authentication Testing
```bash
# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test protected endpoint
curl -X POST http://localhost:3000/classes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Class"}'
```

Use the Postman collection (`BusiCode_API.postman_collection.json`) for API testing. It includes variable extraction for chained requests and authentication flows.

Key debugging files:
- `API_DOCUMENTATION.md` - Complete endpoint reference with auth requirements
- `debug-revenue.js` - Revenue flow debugging script
- `test-monetary-types.js` - Monetary type validation

## Critical Reminders for Development

### Always Update When Modifying Backend:
1. **API Documentation** (`API_DOCUMENTATION.md`) - Add/update endpoint specs
2. **Postman Collection** (`BusiCode_API.postman_collection.json`) - Add test requests
3. **Copilot Instructions** (this file) - Update architectural decisions
4. **Database Schema** (`schema.sql`) - Reflect table/column changes

### Authentication Implementation Pattern:
1. **Route Protection**: Add `authenticateToken` middleware to write operations
2. **Frontend Integration**: Update managers to handle auth tokens
3. **UI State Management**: Implement read-only mode for unauthorized users
4. **Error Handling**: Provide clear auth-related error messages
5. **Testing**: Always test both authenticated and unauthenticated scenarios
