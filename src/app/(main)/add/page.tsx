import { AddConcertForm } from "@/components/AddConcertForm";

export default function AddConcertPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Add Concert</h1>
      <p className="text-sm opacity-70 mb-6">
        Fill in the details and costs for a show you attended. Total cost is
        calculated automatically.
      </p>
      <AddConcertForm />
    </div>
  );
}
