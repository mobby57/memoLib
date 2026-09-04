import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY non définie dans .env');
    process.exit(1);
}

const clerk = createClerkClient({ secretKey });

// L'ID de l'utilisateur Clerk (récupéré depuis votre utilisateur avocat@test.com)
const USER_ID = 'user_3IsJXY2JD0dMSXwrnXPAz8NsC7p';

async function main() {
    try {
        const session = await clerk.sessions.create({
            userId: USER_ID,
        });
        const token = await clerk.sessions.getToken(session.id);
        console.log(token);
    } catch (error) {
        console.error('❌ Erreur :', error.message);
        process.exit(1);
    }
}

main();
