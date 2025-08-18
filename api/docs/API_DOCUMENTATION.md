# BusiCode API Documentation

## Overview

The BusiCode API provides endpoints for managing educational business simulations, including classes, students, companies, and products. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL:** `http://localhost:3000`

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Data Types

### Monetary Values
All monetary values in the API are returned as JavaScript numbers (not strings):
- `price`: Product prices (e.g., `29.99`)
- `balance`: Student balances (e.g., `100.50`)
- `budget`: Company budgets (e.g., `200.00`)
- `amount`: Transaction amounts (e.g., `150.75`)
- `contribution`: Member contributions (e.g., `50.00`)

### Identifiers
- All entity IDs are UUIDs (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)

### Dates
- All timestamps are in ISO 8601 format (e.g., `"2025-08-17T10:00:00Z"`)

## Response Format

All API responses follow this general format:

```json
{
  "message": "Success message",
  "data": { ... },
  "error": false
}
```

Error responses:
```json
{
  "error": true,
  "message": "Error description",
  "details": "Additional error details (optional)"
}
```

## HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

# Classes API

## Get All Classes

**GET** `/classes`

### Query Parameters
- `include_students` (optional): `true` to include students in response

### Response
```json
{
  "classes": [
    {
      "id": "uuid",
      "name": "Class Name",
      "createdAt": "2025-08-16T10:00:00Z",
      "students": [] // Only if include_students=true
    }
  ]
}
```

### Example Request
```bash
GET /classes?include_students=true
```

## Get Class by ID

**GET** `/classes/{id}`

### Query Parameters
- `include_students` (optional): `true` to include students

### Response
```json
{
  "class": {
    "id": "uuid",
    "name": "Class Name",
    "createdAt": "2025-08-16T10:00:00Z",
    "students": [] // Only if include_students=true
  }
}
```

## Create Class

**POST** `/classes`

### Request Body
```json
{
  "name": "New Class Name"
}
```

### Response
```json
{
  "message": "Class created successfully",
  "class": {
    "id": "uuid",
    "name": "New Class Name",
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Update Class

**PUT** `/classes/{id}`

### Request Body
```json
{
  "name": "Updated Class Name"
}
```

### Response
```json
{
  "message": "Class updated successfully",
  "class": {
    "id": "uuid",
    "name": "Updated Class Name",
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Get Class Statistics

**GET** `/classes/{id}/stats`

### Response
```json
{
  "class": {
    "id": "uuid",
    "name": "Class Name",
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "stats": {
    "totalStudents": 25,
    "totalInitialBalance": 2500.00,
    "totalCurrentBalance": 2300.50,
    "averageInitialBalance": 100.00,
    "averageCurrentBalance": 92.02
  }
}
```

## Get Students in Class

**GET** `/classes/{id}/students`

### Response
```json
{
  "class": {
    "id": "uuid",
    "name": "Class Name",
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "students": [
    {
      "id": "uuid",
      "name": "Student Name",
      "classId": "uuid",
      "initialBalance": 100.00,
      "currentBalance": 95.50,
      "createdAt": "2025-08-16T10:00:00Z"
    }
  ]
}
```

## Add Student to Class

**POST** `/classes/{id}/students`

### Request Body
```json
{
  "name": "Student Name",
  "initialBalance": 100.00
}
```

### Response
```json
{
  "message": "Student added to class successfully",
  "student": {
    "id": "uuid",
    "name": "Student Name",
    "classId": "uuid",
    "initialBalance": 100.00,
    "currentBalance": 100.00,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Reset All Student Balances

**POST** `/classes/{id}/reset-balances`

### Response
```json
{
  "message": "All student balances reset successfully",
  "class": {
    "id": "uuid",
    "name": "Class Name",
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "students": [
    {
      "id": "uuid",
      "name": "Student Name",
      "classId": "uuid",
      "initialBalance": 100.00,
      "currentBalance": 100.00,
      "createdAt": "2025-08-16T10:00:00Z"
    }
  ]
}
```

## Delete Class

**DELETE** `/classes/{id}`

### Response
```json
{
  "message": "Class deleted successfully",
  "class": {
    "id": "uuid",
    "name": "Class Name",
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

---

# Students API

## Get All Students

**GET** `/students`

### Query Parameters
- `class_id` (optional): Filter by class ID

### Response
```json
{
  "students": [
    {
      "id": "uuid",
      "name": "Student Name",
      "classId": "uuid",
      "initialBalance": 100.00,
      "currentBalance": 95.50,
      "createdAt": "2025-08-16T10:00:00Z"
    }
  ]
}
```

## Get Student by ID

**GET** `/students/{id}`

### Response
```json
{
  "student": {
    "id": "uuid",
    "name": "Student Name",
    "classId": "uuid",
    "initialBalance": 100.00,
    "currentBalance": 95.50,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Create Student

**POST** `/students`

### Request Body
```json
{
  "name": "Student Name",
  "classId": "uuid",
  "initialBalance": 100.00
}
```

### Response
```json
{
  "message": "Student created successfully",
  "student": {
    "id": "uuid",
    "name": "Student Name",
    "classId": "uuid",
    "initialBalance": 100.00,
    "currentBalance": 100.00,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Update Student

**PUT** `/students/{id}`

### Request Body
```json
{
  "name": "Updated Student Name",
  "initialBalance": 150.00
}
```

### Response
```json
{
  "message": "Student updated successfully",
  "student": {
    "id": "uuid",
    "name": "Updated Student Name",
    "classId": "uuid",
    "initialBalance": 150.00,
    "currentBalance": 150.00,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Update Student Balance

**PUT** `/students/{id}/balance`

### Request Body
```json
{
  "amount": 25.00,
  "operation": "add" // "add", "deduct", or "reset"
}
```

### Response
```json
{
  "message": "Student balance added successfully",
  "student": {
    "id": "uuid",
    "name": "Student Name",
    "classId": "uuid",
    "initialBalance": 100.00,
    "currentBalance": 120.50,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Delete Student

**DELETE** `/students/{id}`

### Response
```json
{
  "message": "Student deleted successfully",
  "student": {
    "id": "uuid",
    "name": "Student Name",
    "classId": "uuid",
    "initialBalance": 100.00,
    "currentBalance": 95.50,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

---

# Companies API

## Get All Companies

**GET** `/companies`

### Query Parameters
- `class_id` (optional): Filter by class ID
- `include_details` (optional): `true` to include members and financial summary

### Response
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Company Name",
      "classId": "uuid",
      "initialBudget": 200.00,
      "currentBudget": 180.50,
      "createdAt": "2025-08-16T10:00:00Z",
      "members": [], // Only if include_details=true
      "financialSummary": {} // Only if include_details=true
    }
  ]
}
```

## Get Company by ID

**GET** `/companies/{id}`

### Query Parameters
- `include_details` (optional): `true` to include members and financial summary

### Response
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 180.50,
    "createdAt": "2025-08-16T10:00:00Z",
    "members": [], // Only if include_details=true
    "financialSummary": {} // Only if include_details=true
  }
}
```

## Create Company

**POST** `/companies`

### Request Body
```json
{
  "name": "New Company",
  "classId": "uuid",
  "memberIds": ["student-uuid-1", "student-uuid-2"],
  "memberContributions": {
    "student-uuid-1": 100.00,
    "student-uuid-2": 100.00
  }
}
```

### Notes
- Duplicate member IDs in the `memberIds` array are not allowed
- The initial budget is calculated from the sum of all member contributions
- Member contributions are deducted from student balances
- At least one member is required

### Response
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "uuid",
    "name": "New Company",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 200.00,
    "createdAt": "2025-08-16T10:00:00Z",
    "members": [
      {
        "id": "student-uuid-1",
        "name": "Student 1",
        "classId": "uuid",
        "initialBalance": 100.00,
        "currentBalance": 0.00,
        "contribution": 100.00,
        "joinedAt": "2025-08-16T10:00:00Z"
      }
    ],
    "financialSummary": {
      "initialBudget": 200.00,
      "currentBudget": 200.00,
      "totalExpenses": 0.00,
      "totalRevenues": 0.00,
      "profit": 0.00,
      "expenseCount": 0,
      "revenueCount": 0
    }
  }
}
```

## Update Company

**PUT** `/companies/{id}`

### Request Body
```json
{
  "name": "Updated Company Name"
}
```

### Response
```json
{
  "message": "Company updated successfully",
  "company": {
    "id": "uuid",
    "name": "Updated Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 180.50,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Get Company Members

**GET** `/companies/{id}/members`

### Response
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 180.50,
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "members": [
    {
      "id": "student-uuid",
      "name": "Student Name",
      "classId": "uuid",
      "initialBalance": 100.00,
      "currentBalance": 0.00,
      "contribution": 100.00,
      "joinedAt": "2025-08-16T10:00:00Z"
    }
  ]
}
```

## Add Member to Company

**POST** `/companies/{id}/members`

### Request Body
```json
{
  "studentId": "student-uuid",
  "contribution": 50.00
}
```

### Notes
- The student cannot already be a member of the company
- The contribution amount will be deducted from the student's balance
- A contribution of 0 is allowed

### Response
```json
{
  "message": "Member added to company successfully",
  "membership": {
    "company_id": "uuid",
    "student_id": "student-uuid",
    "contribution": 50.00,
    "created_at": "2025-08-16T10:00:00Z"
  }
}
```

## Remove Member from Company

**DELETE** `/companies/{id}/members/{studentId}`

### Response
```json
{
  "message": "Member removed from company successfully"
}
```

## Get Company Expenses

**GET** `/companies/{id}/expenses`

### Response
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 180.50,
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "expenses": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "description": "Office supplies",
      "amount": 19.50,
      "created_at": "2025-08-16T10:00:00Z"
    }
  ]
}
```

## Add Expense

**POST** `/companies/{id}/expenses`

### Request Body
```json
{
  "description": "Office supplies",
  "amount": 19.50
}
```

### Response
```json
{
  "message": "Expense added successfully",
  "expense": {
    "id": "uuid",
    "company_id": "uuid",
    "description": "Office supplies",
    "amount": 19.50,
    "created_at": "2025-08-16T10:00:00Z"
  },
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 180.50,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Get Company Revenues

**GET** `/companies/{id}/revenues`

### Response
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 180.50,
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "revenues": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "description": "Product sales: Widget (5 units)",
      "amount": 150.00,
      "created_at": "2025-08-16T10:00:00Z"
    }
  ]
}
```

## Add Revenue

**POST** `/companies/{id}/revenues`

### Request Body
```json
{
  "description": "Consulting services",
  "amount": 150.00
}
```

### Response
```json
{
  "message": "Revenue added successfully",
  "revenue": {
    "id": "uuid",
    "company_id": "uuid",
    "description": "Consulting services",
    "amount": 150.00,
    "created_at": "2025-08-16T10:00:00Z"
  },
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 350.00,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Get Financial Summary

**GET** `/companies/{id}/financial-summary`

### Response
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 330.50,
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "financialSummary": {
    "initialBudget": 200.00,
    "currentBudget": 330.50,
    "totalExpenses": 19.50,
    "totalRevenues": 150.00,
    "profit": 130.50,
    "expenseCount": 1,
    "revenueCount": 1
  }
}
```

## Distribute Profits

**POST** `/companies/{id}/distribute-profits`

### Request Body
```json
{
  "studentId": "student-uuid",
  "amount": 50.00,
  "description": "Quarterly profit distribution"
}
```

### Notes
- The distribution amount is checked against the company's current budget (not calculated profit)
- The distribution creates an expense record and adds money to the student's balance
- Only company members can receive profit distributions

### Response
```json
{
  "message": "Profits distributed successfully",
  "distribution": {
    "expense": {
      "id": "uuid",
      "company_id": "uuid",
      "description": "Quarterly profit distribution to Student Name",
      "amount": 50.00,
      "created_at": "2025-08-16T10:00:00Z"
    },
    "student": {
      "id": "student-uuid",
      "name": "Student Name",
      "classId": "uuid",
      "initialBalance": 100.00,
      "currentBalance": 50.00,
      "createdAt": "2025-08-16T10:00:00Z"
    },
    "distributedAmount": 50.00
  }
}
```

## Delete Company

**DELETE** `/companies/{id}`

### Response
```json
{
  "message": "Company deleted successfully",
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "classId": "uuid",
    "initialBudget": 200.00,
    "currentBudget": 180.50,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

---

# Products API

## Get All Products

**GET** `/products`

### Query Parameters
- `company_id` (optional): Filter by company ID
- `class_id` (optional): Filter by class ID
- `include_details` (optional): `true` to include company and sales stats
- `start_date` (optional): Filter products launched on or after this date (ISO 8601 format)
- `end_date` (optional): Filter products launched on or before this date (ISO 8601 format)

### Response
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 29.99,
      "companyId": "uuid",
      "salesCount": 5,
      "totalRevenue": 149.95,
      "launchedAt": "2025-08-16T10:00:00Z",
      "createdAt": "2025-08-16T10:00:00Z",
      "company": {}, // Only if include_details=true
      "salesStats": {} // Only if include_details=true
    }
  ]
}
```

### Example Requests
```bash
# Get all products
GET /products

# Get products for a specific company
GET /products?company_id=550e8400-e29b-41d4-a716-446655440000

# Get products for a specific class
GET /products?class_id=550e8400-e29b-41d4-a716-446655440000

# Get products launched after a specific date
GET /products?start_date=2025-01-01

# Get products launched within a date range
GET /products?start_date=2025-01-01&end_date=2025-12-31

# Get products for a company within a date range with details
GET /products?company_id=550e8400-e29b-41d4-a716-446655440000&start_date=2025-01-01&end_date=2025-12-31&include_details=true

# Get products for a class launched on a specific day
GET /products?class_id=550e8400-e29b-41d4-a716-446655440000&start_date=2025-08-17T00:00:00Z&end_date=2025-08-17T23:59:59Z
```

### Notes
- Date parameters accept ISO 8601 formatted strings (e.g., `2025-08-17` or `2025-08-17T10:00:00Z`)
- Date filtering uses the `launched_at` timestamp from the products table
- Date filtering can be combined with company and class filtering for precise queries
- Results are ordered by launch date (most recent first) when date filtering is applied

## Get Product by ID

**GET** `/products/{id}`

### Query Parameters
- `include_details` (optional): `true` to include company and sales stats

### Response
```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "price": 29.99,
    "companyId": "uuid",
    "salesCount": 5,
    "totalRevenue": 149.95,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z",
    "company": {}, // Only if include_details=true
    "salesStats": {} // Only if include_details=true
  }
}
```

## Launch Product

**POST** `/products`

### Request Body
```json
{
  "name": "New Product",
  "price": 29.99,
  "companyId": "uuid"
}
```

### Response
```json
{
  "message": "Product launched successfully",
  "product": {
    "id": "uuid",
    "name": "New Product",
    "price": 29.99,
    "companyId": "uuid",
    "salesCount": 0,
    "totalRevenue": 0.00,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z",
    "company": {
      "id": "uuid",
      "name": "Company Name",
      "classId": "uuid",
      "initialBudget": 200.00,
      "currentBudget": 180.50,
      "createdAt": "2025-08-16T10:00:00Z"
    },
    "salesStats": {
      "totalSales": 0,
      "totalRevenue": 0.00,
      "averageOrderValue": 0,
      "salesCount": 0,
      "firstSale": null,
      "lastSale": null
    }
  }
}
```

## Update Product

**PUT** `/products/{id}`

### Request Body
```json
{
  "name": "Updated Product Name",
  "price": 34.99
}
```

### Response
```json
{
  "message": "Product updated successfully",
  "product": {
    "id": "uuid",
    "name": "Updated Product Name",
    "price": 34.99,
    "companyId": "uuid",
    "salesCount": 5,
    "totalRevenue": 149.95,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Record Product Sale

**POST** `/products/{id}/sales`

### Request Body
```json
{
  "quantity": 3,
  "unitPrice": 29.99 // Optional, uses product price if not provided
}
```

### Response
```json
{
  "message": "Sale recorded successfully",
  "sale": {
    "id": "uuid",
    "product_id": "uuid",
    "quantity": 3,
    "unit_price": 29.99,
    "total_amount": 89.97,
    "sale_date": "2025-08-16T10:00:00Z",
    "created_at": "2025-08-16T10:00:00Z"
  },
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "price": 29.99,
    "companyId": "uuid",
    "salesCount": 8,
    "totalRevenue": 239.92,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "companyRevenue": 89.97
}
```

## Get Product Sales

**GET** `/products/{id}/sales`

### Response
```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "price": 29.99,
    "companyId": "uuid",
    "salesCount": 8,
    "totalRevenue": 239.92,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "sales": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 3,
      "unit_price": 29.99,
      "total_amount": 89.97,
      "sale_date": "2025-08-16T10:00:00Z",
      "created_at": "2025-08-16T10:00:00Z"
    }
  ]
}
```

## Get Sales Statistics

**GET** `/products/{id}/sales/stats`

### Response
```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "price": 29.99,
    "companyId": "uuid",
    "salesCount": 8,
    "totalRevenue": 239.92,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z"
  },
  "salesStats": {
    "totalSales": 8,
    "totalRevenue": 239.92,
    "averageOrderValue": 59.98,
    "salesCount": 4,
    "firstSale": {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 29.99,
      "total_amount": 59.98,
      "sale_date": "2025-08-15T09:00:00Z",
      "created_at": "2025-08-15T09:00:00Z"
    },
    "lastSale": {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 3,
      "unit_price": 29.99,
      "total_amount": 89.97,
      "sale_date": "2025-08-16T10:00:00Z",
      "created_at": "2025-08-16T10:00:00Z"
    }
  }
}
```

## Update Product Price

**PUT** `/products/{id}/price`

### Request Body
```json
{
  "price": 34.99
}
```

### Response
```json
{
  "message": "Product price updated successfully",
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "price": 34.99,
    "companyId": "uuid",
    "salesCount": 8,
    "totalRevenue": 239.92,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

## Delete Product

**DELETE** `/products/{id}`

### Notes
- Products with existing sales records cannot be deleted
- This prevents data integrity issues with sales history

### Response
```json
{
  "message": "Product deleted successfully",
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "price": 29.99,
    "companyId": "uuid",
    "salesCount": 0,
    "totalRevenue": 0.00,
    "launchedAt": "2025-08-16T10:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

---

# Health Check

## API Health Check

**GET** `/health`

### Response
```json
{
  "message": "BusiCode API is running!",
  "timestamp": "2025-08-16T10:00:00Z"
}
```

---

# Testing Workflow

## Recommended Testing Order

1. **Health Check** - Verify API is running
2. **Create Class** - Create a test class
3. **Add Students** - Add students to the class
4. **Create Company** - Create a company with student members
5. **Add Financial Transactions** - Add expenses and revenues
6. **Launch Product** - Create a product for the company
7. **Record Sales** - Record product sales
8. **Check Financial Summary** - Verify all calculations

## Sample Test Data

### Class
```json
{
  "name": "Test Class A"
}
```

### Students
```json
{
  "name": "John Doe",
  "classId": "{class-id}",
  "initialBalance": 100.00
}
```

### Company
```json
{
  "name": "TechStart Inc",
  "classId": "{class-id}",
  "memberIds": ["{student-id-1}", "{student-id-2}"],
  "memberContributions": {
    "{student-id-1}": 50.00,
    "{student-id-2}": 50.00
  }
}
```

### Product
```json
{
  "name": "Smart Widget",
  "price": 29.99,
  "companyId": "{company-id}"
}
```

### Product Sale
```json
{
  "quantity": 5,
  "unitPrice": 29.99
}
```

---

# Error Handling

## Common Error Responses

### 400 Bad Request
```json
{
  "error": true,
  "message": "Name is required"
}
```

### 404 Not Found
```json
{
  "error": true,
  "message": "Student not found"
}
```

### 409 Conflict
```json
{
  "error": true,
  "message": "Cannot delete class with students. Delete students first."
}
```

### 500 Internal Server Error
```json
{
  "error": true,
  "message": "Internal server error"
}
```

---

# Database Requirements

Ensure MySQL is running with the schema from `database/schema.sql` loaded before testing the API.

## Environment Variables

Required environment variables:
- `MYSQL_HOST` (default: mysql)
- `MYSQL_PORT` (default: 3306)
- `MYSQL_DATABASE` (default: busicode)
- `MYSQL_USER` (default: root)
- `MYSQL_PASSWORD` (default: asdf1234)

## Running with Docker

The project includes Docker configuration:

```bash
# Start the services
docker compose up -d

# View logs
docker compose logs api
docker compose logs mysql

# Stop services
docker compose down
```

The API will be available at `http://localhost:3000`

---

**Last Updated:** August 17, 2025
**API Version:** 1.0.0
