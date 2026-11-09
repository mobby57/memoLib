import { auth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function Dashboard() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const cases = await prisma.case.findMany({
    orderBy: { dateLimiteRecours: 'asc' },
    take: 10,
  });

  const now = new Date().getTime();
  const urgentCasesCount = cases.filter(c =>
    c.dateLimiteRecours && new Date(c.dateLimiteRecours).getTime() - now < 48 * 3600 * 1000
  ).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Bienvenue, Maître {user?.firstName || 'Avocat'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800">Dossiers Actifs</h2>
          <p className="text-4xl font-bold text-blue-600">{cases.length}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h2 className="text-xl font-semibold text-red-800">Urgents (&lt; 48h)</h2>
          <p className="text-4xl font-bold text-red-600">{urgentCasesCount}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Prochaines Échéances</h2>

      <div className="space-y-4">
        {cases.length === 0 ? (
          <p className="text-gray-500">Aucun dossier pour le moment.</p>
        ) : (
          cases.map((c) => {
            const isUrgent =
              c.dateLimiteRecours &&
              new Date(c.dateLimiteRecours).getTime() - now < 48 * 3600 * 1000;
            const borderClass = isUrgent
              ? "border-red-500 bg-red-50"
              : "border-green-500 bg-green-50";

            return (
              <div key={c.id} className={`p-4 rounded-lg border-l-4 ${borderClass}`}>
                <h3 className="font-bold text-lg">{c.title}</h3>
                <p className="text-sm font-semibold text-gray-800 mt-2">
                  Date limite :{" "}
                  {c.dateLimiteRecours
                    ? new Date(c.dateLimiteRecours).toLocaleString('fr-FR')
                    : 'Non définie'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
