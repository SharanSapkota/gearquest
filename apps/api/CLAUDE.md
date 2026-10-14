# API rules
- Module layout: modules/<name>/<name>.{routes,controller,service,repository,model}.ts
- Routes file exports a Router, mounted in app.ts under /api/v1/<name>.
- Services are classes or plain functions that receive the repository via parameter (easy to mock in tests).
- Repositories return plain objects (.lean()), never Mongoose documents.
- Auth: Google ID token verified with google-auth-library, then we issue our own JWT in an httpOnly cookie. requireAuth middleware sets req.user.
- Serialize responses through a mapper that strips private fields (phone, googleId, email) unless explicitly allowed.
- Tests: vitest, mock the repository in service tests.