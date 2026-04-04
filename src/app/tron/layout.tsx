import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tron Dashboard — OVHcloud Node Tracker',
  description: 'Real-time tracking of TRON network nodes hosted on OVHcloud infrastructure.',
};

export default function TronLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
