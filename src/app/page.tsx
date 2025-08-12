import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Interview Scheduler</h1>
      <p className="opacity-80">Drag-and-drop calendar with Google sync and reminders.</p>
      <div className="flex gap-4">
        <Link href="/login" className="px-5 py-2 bg-blue-600 rounded hover:bg-blue-500">Login</Link>
        <Link href="/dashboard" className="px-5 py-2 bg-gray-700 rounded hover:bg-gray-600">Dashboard</Link>
      </div>
    </main>
  );
}
