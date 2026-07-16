import { TacticsContainer } from "@/containers/TacticsContainer";

export const metadata = {
  title: 'Taktikler | Champion Master',
};

export default function TacticsPage() {
  return (
    <div className="w-full h-full">
      <h1 className="text-3xl font-bold mb-6">Taktik Tahtası</h1>
      <TacticsContainer />
    </div>
  );
}
