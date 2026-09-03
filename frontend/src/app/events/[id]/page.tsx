import { EventDetail } from '@/components/EventDetail';

export default async function EventPage({ params }: PageProps<'/events/[id]'>) {
  const { id } = await params;
  return <EventDetail eventId={Number(id)} />;
}
