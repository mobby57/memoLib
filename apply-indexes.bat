@echo off
echo Applying performance indexes...

dotnet ef migrations add AddPerformanceIndexes --context MemoLibDbContext
dotnet ef database update

echo Done!
pause
