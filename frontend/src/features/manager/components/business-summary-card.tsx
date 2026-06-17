import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type BusinessSummaryCardProps = {
  insights: string[];
  loading?: boolean;
};

export default function BusinessSummaryCard({ insights, loading }: BusinessSummaryCardProps) {
  return (
    <Card className="border-app-border bg-gradient-to-br from-primary-light/50 via-app-card to-beige-light/30 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-app-text-title">
          <Lightbulb className="h-4 w-4 text-primary-dark" />
          Today&apos;s business summary
        </CardTitle>
        <p className="text-sm text-app-text-secondary">Key insights from served orders</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ul className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex gap-3">
                <Skeleton className="h-2 w-2 shrink-0 rounded-full mt-2" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-app-text-primary">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {insight}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
