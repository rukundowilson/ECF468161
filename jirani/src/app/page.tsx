import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Inventory Management System</h1>
          <p className="text-lg text-gray-600 mb-8">Manage your products, variants, and inventory</p>
          <div className="space-x-4">
            <Link
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Products
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
