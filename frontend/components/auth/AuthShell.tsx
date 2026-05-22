type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-bc-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute -inset-4 bg-cover bg-center blur-sm scale-105"
        style={{ backgroundImage: "url('/images/login-library-bg.png')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-bc-bg/86 via-bc-bg/58 to-bc-primary/36 dark:from-bc-bg/92 dark:via-bc-bg/76 dark:to-bc-primary/28"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(45,30,18,0.28)_100%)]"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        <div className="bc-card p-8 bg-white/90 dark:bg-bc-surface/90 backdrop-blur-xl shadow-bc-xl">
          {children}
        </div>
      </div>
    </main>
  );
}
