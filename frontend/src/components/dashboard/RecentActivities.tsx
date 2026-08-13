import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const activities = [
  {
    title: 'Recent Activities',
    description: 'Faucibus massa studio.',
    time: '3 hours ago',
    dotColor: 'bg-sky-500',
  },
  {
    title: 'Recent Activities',
    description: 'Suspendisse morbi commodo...',
    time: '5 hours ago',
    dotColor: 'bg-amber-500',
  },
  {
    title: 'Recent Activities',
    description: 'Nemo enim ipsam voluptatem...',
    time: '5 hours ago',
    dotColor: 'bg-emerald-500',
  },
];

export function RecentActivities() {
  return (
    <Card className="h-full border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-base font-semibold text-slate-800">
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative border-l border-slate-200 ml-3 space-y-6">
          {activities.map((activity, index) => (
            <div key={index} className="relative pl-6">
              <div
                className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${activity.dotColor} ring-4 ring-white`}
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-800">
                  {activity.title}
                </span>
                <span className="text-xs text-slate-500">{activity.description}</span>
                <span className="text-xs font-medium text-slate-400">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
