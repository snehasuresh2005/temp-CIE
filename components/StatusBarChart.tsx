import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface StatusBarChartProps {
  title: string;
  data: { label: string; count: number; color?: string }[];
}

const DEFAULT_COLORS = [
  '#FFC107', // Pending - yellow
  '#2196F3', // Approved - blue
  '#4CAF50', // Collected - green
  '#757575', // Returned - grey
  '#F44336', // Rejected - red
  '#9C27B0', // User Returned - purple
  '#FF9800', // Overdue - orange
];

export const StatusBarChart: React.FC<StatusBarChartProps> = ({ title, data }) => {
  return (
    <ResponsiveContainer width="100%" height={40 + data.length * 40}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        barCategoryGap={16}
      >
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tick={{ fontSize: 16 }}
          width={120}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: any, name: any) => [value, 'Count']}
          cursor={{ fill: '#f5f5f5' }}
        />
        <Bar dataKey="count" radius={[8, 8, 8, 8]}>
          {data.map((entry, idx) => (
            <Cell key={`cell-${entry.label}`} fill={entry.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
          ))}
          <LabelList dataKey="count" position="right" style={{ fontWeight: 'bold', fontSize: 16 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StatusBarChart; 