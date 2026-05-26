import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-village-bg flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4 animate-float">🗺️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">This path leads nowhere</h2>
        <p className="text-gray-500 text-sm mb-6">
          The village you&apos;re looking for doesn&apos;t exist — or it moved.
        </p>
        <Link href="/village/map" className="village-btn-primary inline-block">
          Back to the Village
        </Link>
      </div>
    </div>
  );
}
