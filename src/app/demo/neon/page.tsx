import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';

export default async function NeonDemoPage() {
  // Fetch existing comments
  const sql = neon(`${process.env.DATABASE_URL}`);
  const comments = await sql`SELECT comment FROM comments ORDER BY comment`;

  async function create(formData: FormData) {
    'use server';
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    const comment = formData.get('comment') as string;
    // Insert the comment from the form into the Postgres database (tagged template syntax)
    await sql`INSERT INTO comments (comment) VALUES (${comment})`;
    // Revalidate to show the new comment
    revalidatePath('/demo/neon');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Neon Database Demo
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Add a Comment
          </h2>
          <form action={create} className="flex gap-4">
            <input
              type="text"
              placeholder="Write a comment..."
              name="comment"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium 
                         rounded-lg transition-colors duration-200"
            >
              Submit
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Comments ({comments.length})
          </h2>
          {comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No comments yet. Add one above!
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map((row, index) => (
                <li
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {row.comment}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
