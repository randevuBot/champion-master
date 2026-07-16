import { MatchContainer } from "@/containers/MatchContainer";

export const metadata = {
  title: 'Maç Günü | Champion Master',
};

export default function MatchPage() {
  return (
    <div className="w-full h-full">
      <h1 className="text-3xl font-bold mb-6">Maç Günü</h1>
      <MatchContainer />
    </div>
  );
}
