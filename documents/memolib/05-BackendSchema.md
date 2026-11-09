# Backend Schema - MemoLib (Prisma)
## Modèles Principaux
- **User** (id, email, name, role)
- **Client** (id, firstName, lastName, email, phone)
- **Case** (id, title, description, status, clientId)
- **Document** (id, title, content, status, caseId)
- **Invoice** (id, amount, status, dueDate, caseId)
