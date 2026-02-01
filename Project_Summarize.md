## Project Overview
Sellor is a web-based e-commerce platform that allows individuals and small sellers to easily create their own online shops and sell products through a single system. Instead of building a personal website, sellers can register on Sellor, create a store, and manage their products using a seller dashboard. Each store is assigned a unique public URL, enabling buyers to access the store directly online.

The system supports product grouping and categorization to help sellers organize their items and to improve product discovery for buyers. Buyers can browse stores, search for products using keywords, and apply filters such as category, price, size, and condition. Each product has a detailed page displaying images, descriptions, and seller information.

Sellor is designed as a responsive web application that works on both desktop and mobile devices. The platform also includes basic inquiry or order functionality, allowing buyers to contact sellers regarding products. Administrators manage the overall system by overseeing user accounts, store listings, and platform data.

The goal of the project is to provide a simple, scalable, and centralized solution for small online sellers while offering buyers an efficient way to discover products and stores in one place.


## Project Structure
- Frontend: React + TypeScript (TSX) with component-driven architecture and shared UI primitives.
- Backend: FastAPI services that expose REST endpoints and orchestrate authentication, stores, and product logic.
- Data layer: SQLAlchemy models, PostgreSQL, and migration tooling for schema evolution.
- Supporting services: [ ] Placeholder for services (e.g., media storage, email, analytics) to document as needed.

## Key Features
- [ ] Store creation + unique public URL generation
- [ ] Product grouping, categorization, and filtering for buyers
- [ ] Responsive seller dashboard with inventory and order management
- [ ] Placeholder for admin controls, inquiries, or campaign features

## Development Roadmap
1. [ ] Research & design final requirements (e.g., UX flows, API contracts)
2. [ ] Build MVP storefront + dashboard flows
3. [ ] Expand to admin tooling, analytics, or automations
4. [ ] Iteration & polish based on user feedback
5. [ ] Future milestones: ______________ (insert upcoming goals)

## Environment & Setup
- Local requirements: Node.js __, Python __, PostgreSQL __, and migration CLI (e.g., Alembic or similar).
- [ ] Document exact version pins and environment variables for frontend/backend.
- [ ] Add setup script instructions (npm install, pip install, migrations, env files).
- Testing environment notes: [ ] Placeholder for test db setup, mocks, or staging links.

## API/Backend Overview
- FastAPI handles business logic, authentication, and store/product endpoints.
- [ ] Document critical endpoints (e.g., `POST /stores`, `GET /products`, `POST /inquiries`).
- [ ] Note middleware, auth guards, pagination, or caching strategies that need highlighting.

## Database Schema
- Core tables: `users`, `stores`, `products`, `product_groups`, `inquiries`, `orders`.
- [ ] Add ERD or field descriptions once finalized (indexes, constraints, UUIDs).
- Migrations managed via [ ] (insert tool name) to keep schema in sync.

## Testing & Deployment
- Unit + integration tests in backend (specify frameworks/patterns once available).
- Frontend testing strategy placeholder: [ ] (e.g., React Testing Library, Cypress).
- Deployment: [ ] Host/reactive pipeline details (e.g., Vercel, AWS, Docker) with rollout steps.

## Current Status
- [ ] Document which modules are complete (frontend pages, API endpoints, etc.).
- [ ] Highlight blockers or dependencies (design, third-party APIs, legal reviews).
- [ ] Capture latest deployment/testing results or manual QA notes.

## Known Issues / TODOs
- [ ] Issue tracker placeholder (e.g., performance, validation, image uploads).
- [ ] TODO: Add analytics instrumentation and error monitoring coverage.
- [ ] TODO: Review admin privilege model before launch.

## Future Enhancements
- [ ] Wishlist items (subscriptions, seller promotions, recommendations, multi-language).
- [ ] Growth topics (partner integrations, fulfillment sync, social commerce hooks).
- [ ] Optional: mobile-first experience improvements or native wrappers.

## Action Items
- [ ] Identify next concrete engineering task (e.g., finalize API schemas).
- [ ] Sync with stakeholders on prioritization for the next sprint.
- [ ] Update this summary with details once new decisions land.