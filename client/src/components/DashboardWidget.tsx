interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function DashboardWidget({ title, children, className = "" }: DashboardWidgetProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}>
      <h3 className="font-inter font-semibold text-lg text-neutral-dark mb-6">
        {title}
      </h3>
      {children}
    </div>
  );
}