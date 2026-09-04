#!/bin/bash
echo "NEXTAUTH_URL=\"http://10.255.255.254:3000\"" > .env.test
echo "NEXTAUTH_SECRET=\"test-secret-123\"" >> .env.test
echo "NEXT_PUBLIC_APP_URL=\"http://10.255.255.254:3000\"" >> .env.test
echo "✅ .env.test mis à jour"
