import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <Header />
      <main className="flex-1 pt-16">
        <section className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6 lg:px-8">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Bihar&apos;s{" "}
            <span className="text-cyan-400">Fastest Growing</span>{" "}
            E-Commerce Platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-500">
            Empowering local sellers, delighting customers. Shop from thousands
            of products with lightning-fast delivery across Bihar.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/seller/register"
              className="rounded-lg bg-cyan-500 px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
            >
              Start Selling
            </a>
            <a
              href="#features"
              className="rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Learn More
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
