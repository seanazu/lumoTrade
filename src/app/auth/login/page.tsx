import { LoginForm } from "@/components/modules/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center font-bold text-2xl">
          L
        </div>
        <h1 className="text-3xl font-bold mb-2 glow-text">LumoTrade</h1>
        <p className="text-muted-foreground">AI Stock Brain</p>
      </div>
      <LoginForm />
    </div>
  );
}
