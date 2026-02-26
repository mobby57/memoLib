@echo off
setlocal enabledelayedexpansion

echo Adding DOTENV_KEY to Vercel...
set "KEY=dotenv://:key_c5a23ec9afccaac00455b6468733f07371b3f20027945742cad7697e5f2c479a@dotenv.org/vault/.env.vault?environment=production"

(
  echo !KEY!
  echo.
  echo.
) | vercel env add DOTENV_KEY production

echo.
echo DOTENV_KEY added to Vercel production!
echo.
pause
