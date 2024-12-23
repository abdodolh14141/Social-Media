import HeroForm from "@/app/components/Posts/HeroHome/HeroForm";

export default function Home() {
  return (
    <div className="w-full h-lvh">
      <main>
        <section className="pt-32 p-2 rounded-lg">
          <div className="max-w-lg mb-8">
            <h1 className="text-5xl font-bold text-center">
              Your One Link <br /> For Eveything
            </h1>
          </div>
          <div className="w-full">
            <HeroForm />
          </div>
        </section>
      </main>
    </div>
  );
}
