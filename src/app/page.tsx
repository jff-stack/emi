import { EmiTerminal } from "@/components/emi/EmiTerminal";

/**
 * @description Home page - Entry point for the Emi AI Intake Companion
 * Displays the EmiTerminal with voice interface prominently featured
 */
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight text-slate-100 mb-3">
            Emi
          </h1>
          <p className="text-xl text-slate-400">
            Your AI Intake Companion
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Speak naturally — I&apos;m here to listen and help prepare for your visit
          </p>
        </header>

        {/* Main Terminal Interface */}
        <EmiTerminal />
      </div>
    </main>
  );
}
