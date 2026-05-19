export function EmptyState({ message }: { message: string }) {
  return (
    <div className="hero bg-base-100 rounded-box border border-dashed border-base-300 py-12">
      <div className="hero-content text-center">
        <div>
          <div className="text-5xl mb-4" aria-hidden>
            🎵
          </div>
          <p className="text-lg opacity-80 max-w-md">{message}</p>
        </div>
      </div>
    </div>
  );
}
