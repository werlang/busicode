# BusiCode - Copilot Instructions

## Project Architecture

**BusiCode** is a full-stack educational business simulation platform with a **dual-architecture**: a legacy frontend and a modern REST API backend.

### Two Distinct Applications
1. **Legacy Web App** (`/web/`) - ES6 modules SPA with localStorage persistence
2. **Modern REST API** (`/api/`) - Express.js with MySQL, full CRUD operations

### Key Architectural Decisions

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

## Project-Specific Conventions

### UUID Generation
Always use `crypto.randomUUID()`, never external libraries. Set in model constructors if not provided.

### Error Handling
Use `CustomError` class with proper HTTP status codes:
```javascript
throw new CustomError(400, 'Student is already a member of this company');
```

### Route Structure
- Routes mounted at root level (`/students`, `/companies`, not `/api/students`)
- Always refresh model instances: `await this.get()` before critical operations
- Use `include_details=true` query param for nested data

### Business Logic Constraints
- **Duplicate Prevention**: Companies check existing members before adding
- **Balance Validation**: Students need sufficient balance for contributions
- **Deletion Rules**: Products with sales cannot be deleted
- **Budget Tracking**: Revenues/expenses update company budget + instance properties

## Integration Points

### Database Schema (`database/schema.sql`)
- UUID primary keys across all tables
- DECIMAL(10,2) for all monetary fields
- Cascading deletes with foreign keys
- Unique constraints prevent duplicate memberships

### Cross-Component Communication
- Frontend: Event-driven SPA with view managers
- Backend: Express middleware pipeline with centralized error handling
- Data Flow: Models ↔ MySQL helper ↔ Routes ↔ Frontend

### External Dependencies
- **mysql2**: Connection pooling with auto-reconnect
- **Express**: RESTful API with CORS enabled
- **Docker**: Multi-service orchestration (api + mysql + web)

## Testing & Debugging

Use the Postman collection (`BusiCode_API.postman_collection.json`) for API testing. It includes variable extraction for chained requests.

Key debugging files:
- `API_DOCUMENTATION.md` - Complete endpoint reference
- `debug-revenue.js` - Revenue flow debugging script
- `test-monetary-types.js` - Monetary type validation
