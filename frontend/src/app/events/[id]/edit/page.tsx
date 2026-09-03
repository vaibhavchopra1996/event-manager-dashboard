import { EditEvent } from '@/components/EditEvent';

export default async function EditEventPage({ params }: PageProps<'/events/[id]/edit'>) {
  const { id } = await params;
  return <EditEvent eventId={Number(id)} />;
}
