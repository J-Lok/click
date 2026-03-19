import { Users } from 'lucide-react';

export function EmployeesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Employés</h2>
      <div className="card card-inner flex flex-col items-center justify-center gap-4 text-slate-400 py-16">
        <Users size={48} className="opacity-60" />
        <p className="text-center max-w-sm">
          La gestion des employés sera disponible dans une prochaine version. Vous pourrez
          afficher les équipes, les rôles et les plannings.
        </p>
      </div>
    </div>
  );
}
