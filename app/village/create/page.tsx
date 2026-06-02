'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The camera IS the create page per spec. Redirect immediately.
export default function CreatePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/village/create/camera');
  }, [router]);
  return null;
}
