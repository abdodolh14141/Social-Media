import HeroForm from "@/app/components/Posts/HeroHome/HeroForm";

export default function Home() {
  return (
    <div className="w-full h-lvh font-sans">
      <main>
        <section className="pt-10 p-2 rounded-lg">
          <div className="w-full h-full">
            <HeroForm />
          </div>
        </section>
      </main>
    </div>
  );
}
