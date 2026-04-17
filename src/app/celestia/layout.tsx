import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Celestia Dashboard — OVHcloud Node Tracker',
  description: 'Real-time tracking of Celestia network nodes hosted on OVHcloud infrastructure.',
};

export default function CelestiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
