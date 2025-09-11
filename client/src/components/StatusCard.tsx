import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendLabel?: string;
}

export default function StatusCard({ title, value, icon, trend, trendLabel }: StatusCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{trend}</span>
            {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
