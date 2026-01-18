import { EmiTerminal } from "@/components/emi/EmiTerminal";

/**
 * @description Home page - Entry point for the Emi AI Intake Companion
 * Displays the main EmiTerminal component in a centered container
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 mb-2">
            Emi
          </h1>
          <p className="text-lg text-slate-400">
            AI Intake Companion
          </p>
        </header>

        {/* Main Terminal Interface */}
        <EmiTerminal />
      </div>
    </main>
  );
}
