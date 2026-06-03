import { Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-fire-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-fire-600/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-ember-600/10 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fire-500 to-ember-600 text-2xl shadow-lg shadow-fire-600/30">
              🔥
            </div>
            <h1 className="text-2xl font-bold text-white">Fire Extinguisher Management</h1>
            <p className="mt-2 text-sm text-slate-400">Secure access to your fire safety records</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur dark:bg-slate-900/95">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
