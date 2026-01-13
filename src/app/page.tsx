import { redirect } from 'next/navigation';

export default function IndexPage() {
  const now = Date.now();
  redirect(`/home?kpix=${now}`);
}
