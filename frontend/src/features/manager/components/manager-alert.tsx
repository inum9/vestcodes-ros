import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ManagerAlert({ message }: { message: string }) {
  return (
    <Alert className="rounded-2xl border-warning/40 bg-warning-light text-warning-dark">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
