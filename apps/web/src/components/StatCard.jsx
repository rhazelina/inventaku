// components/StatCard.jsx
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useLoader } from "./Loader";

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  change = 0,
  loading = false,
  color = "blue",
  href,
  onClick
}) {
  const { isLoading: isInternalLoading, LoaderComponent } = useLoader(loading, 300);

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
    orange: { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" },
    indigo: { bg: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-200" },
    gray: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
  };

  const selectedColor = colorClasses[color] || colorClasses.blue;

  const content = (
    <div className={`bg-white rounded-xl border ${selectedColor.border} p-5 shadow-sm hover:shadow-md transition-shadow h-full`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${selectedColor.bg}`}>
          {Icon && <Icon className={`w-6 h-6 ${selectedColor.text}`} />}
        </div>
        <div className="flex items-center">
          {change !== 0 && (
            <span className={`inline-flex items-center text-sm font-medium px-2 py-0.5 rounded-full mr-2 ${
              change > 0 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {change > 0 ? (
                <span className="inline-flex items-center">
                  <span className="mr-1">↑</span> {Math.abs(change)}%
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <span className="mr-1">↓</span> {Math.abs(change)}%
                </span>
              )}
            </span>
          )}
          {href && <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </div>
      
      <div className="mb-1">
        {isInternalLoading ? (
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">{value}</div>
        )}
      </div>
      
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      
      {isInternalLoading && (
        <div className="mt-2">
          <LoaderComponent variant="dots" size="sm" color={color} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block hover:no-underline">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left hover:no-underline">
        {content}
      </button>
    );
  }

  return content;
}