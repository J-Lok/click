import { Navigate } from 'react-router-dom';

/**
 * /employees redirects to /team which is the canonical team-management page.
 * Kept as a route for backwards-compatibility with any saved links.
 */
export function EmployeesPage() {
  return <Navigate to="/team" replace />;
}