import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/mirats/ui/Icon";

interface StatusDonutChartProps {
  title: string;
  data: { name: string; value: number; color: string }[];
  icon?: string;
  totalLabel?: string;
}

export function StatusDonutChart({ title, data, icon, totalLabel }: StatusDonutChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          {icon && <Icon name={icon as any} size="tiny" className="text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 flex flex-col items-center justify-center relative">
        <div className="w-full h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  borderColor: 'hsl(var(--border))',
                  fontSize: '12px',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid hsl(var(--border))',
                }} 
                itemStyle={{ 
                  color: 'hsl(var(--popover-foreground))',
                  padding: '2px 0',
                  fontWeight: '600'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-[calc(50%+10px)] flex flex-col items-center">
          <span className="text-xl font-black tabular-nums">{total}</span>
          {totalLabel && <span className="text-[8px] font-bold text-muted-foreground uppercase">{totalLabel}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
