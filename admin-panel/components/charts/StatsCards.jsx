import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects
 */
export default function StatsCards({ stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon && (
              <div className={`p-2 rounded-lg ${stat.iconBg || 'bg-blue-100'}`}>
                {stat.icon}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change !== undefined && (
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {stat.change >= 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+{stat.change}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{stat.change}%</span>
                  </>
                )}
                <span className="ml-1">from last period</span>
              </p>
            )}
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
