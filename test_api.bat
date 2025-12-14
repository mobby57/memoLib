@echo off
echo Testing Minimal Backend API...
echo.

echo 1. Health Check:
curl -s http://localhost:8000/health
echo.
echo.

echo 2. Register User:
curl -s -X POST http://localhost:8000/api/users/register -H "Content-Type: application/json" -d "{\"prenom\":\"Jane\",\"nom\":\"Smith\"}"
echo.
echo.

echo 3. List Users:
curl -s http://localhost:8000/api/users/
echo.
echo.

echo 4. Send Email:
curl -s -X POST http://localhost:8000/api/mails/send -H "Content-Type: application/json" -d "{\"user_id\":1,\"to\":\"test@example.com\",\"subject\":\"Test Email\",\"body\":\"Hello from minimal backend!\"}"
echo.
echo.

echo 5. Access Points:
echo - API: http://localhost:8000
echo - Docs: http://localhost:8000/docs  
echo - MailHog: http://localhost:8025
echo - MinIO: http://localhost:9001
echo.
pause