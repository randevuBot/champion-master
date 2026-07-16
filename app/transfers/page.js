import { TransfersContainer } from "@/containers/TransfersContainer";

export const metadata = {
  title: 'Transfer Pazarı | Champion Master',
};

export default function TransfersPage() {
  return (
    <div className="w-full h-full">
      <h1 className="text-3xl font-bold mb-6">Transferler</h1>
      <TransfersContainer />
    </div>
  );
}
