// components/Loader.jsx
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function Loader({
  size = "md",
  variant = "dots",
  color = "indigo",
  label,
  fullScreen = false,
  center = true,
  className = "",
  showDelay = 100,
}) {
  const [show, setShow] = useState(showDelay === 0);

  useEffect(() => {
    if (showDelay > 0) {
      const timer = setTimeout(() => setShow(true), showDelay);
      return () => clearTimeout(timer);
    }
  }, [showDelay]);

  if (!show) return null;

  const sizeClasses = {
    xs: { container: "gap-1.5", dot: "size-1.5", icon: "w-3 h-3" },
    sm: { container: "gap-2", dot: "size-2", icon: "w-4 h-4" },
    md: { container: "gap-2", dot: "size-3", icon: "w-5 h-5" },
    lg: { container: "gap-3", dot: "size-4", icon: "w-6 h-6" },
    xl: { container: "gap-4", dot: "size-6", icon: "w-8 h-8" },
  };

  const colorClasses = {
    indigo: "bg-indigo-600 dark:bg-indigo-300",
    blue: "bg-blue-600 dark:bg-blue-300",
    gray: "bg-gray-600 dark:bg-gray-300",
    green: "bg-green-600 dark:bg-green-300",
    red: "bg-red-600 dark:bg-red-300",
    purple: "bg-purple-600 dark:bg-purple-300",
    pink: "bg-pink-600 dark:bg-pink-300",
    yellow: "bg-yellow-600 dark:bg-yellow-300",
  };

  const variants = {
    dots: (
      <div className={`flex ${sizeClasses[size].container}`}>
        <span
          className={`${sizeClasses[size].dot} animate-bounce rounded-full ${colorClasses[color]}`}
        />
        <span
          className={`${sizeClasses[size].dot} animate-bounce rounded-full ${colorClasses[color]} [animation-delay:0.2s]`}
        />
        <span
          className={`${sizeClasses[size].dot} animate-bounce rounded-full ${colorClasses[color]} [animation-delay:0.4s]`}
        />
      </div>
    ),
    spinner: (
      <Loader2
        className={`${sizeClasses[size].icon} animate-spin ${colorClasses[color].replace("bg-", "text-")}`}
      />
    ),
    ring: (
      <div className="relative">
        <div
          className={`${sizeClasses[size].dot} rounded-full border-2 ${colorClasses[color].replace("bg-", "border-")} border-t-transparent animate-spin`}
        />
      </div>
    ),
    bars: (
      <div className={`flex ${sizeClasses[size].container} h-8 items-end`}>
        <span
          className={`${sizeClasses[size].dot} animate-[bounce_1s_ease-in-out_infinite] rounded ${colorClasses[color]} [animation-delay:-0.9s]`}
        />
        <span
          className={`${sizeClasses[size].dot} animate-[bounce_1s_ease-in-out_infinite] rounded ${colorClasses[color]} [animation-delay:-0.6s]`}
        />
        <span
          className={`${sizeClasses[size].dot} animate-[bounce_1s_ease-in-out_infinite] rounded ${colorClasses[color]} [animation-delay:-0.3s]`}
        />
      </div>
    ),
    pulse: (
      <div className={`${sizeClasses[size].dot} rounded-full ${colorClasses[color]} animate-pulse`} />
    ),
    steps: (
      <div className={`flex ${sizeClasses[size].container}`}>
        {[0, 0.3, 0.6].map((delay, index) => (
          <span
            key={index}
            className={`${sizeClasses[size].dot} rounded-full ${colorClasses[color]} animate-[ping_1.5s_ease-in-out_infinite]`}
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    ),
  };

  const loaderContent = (
    <div className={`${center ? "flex flex-col items-center justify-center" : ""} ${className}`}>
      <div className={center ? "flex items-center justify-center" : ""}>
        {variants[variant]}
      </div>
      {label && (
        <p className={`mt-3 text-sm font-medium ${getTextColor(color)}`}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="text-center">
          {loaderContent}
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return loaderContent;
}

function getTextColor(color) {
  const colorMap = {
    indigo: "text-indigo-600 dark:text-indigo-300",
    blue: "text-blue-600 dark:text-blue-300",
    gray: "text-gray-600 dark:text-gray-300",
    green: "text-green-600 dark:text-green-300",
    red: "text-red-600 dark:text-red-300",
    purple: "text-purple-600 dark:text-purple-300",
    pink: "text-pink-600 dark:text-pink-300",
    yellow: "text-yellow-600 dark:text-yellow-300",
  };
  return colorMap[color] || colorMap.indigo;
}

// Specific loader variants for different use cases
export function PageLoader({ message = "Loading page..." }) {
  return (
    <Loader
      variant="dots"
      size="lg"
      color="indigo"
      label={message}
      fullScreen
      center
    />
  );
}

export function ContentLoader({ message = "Loading content..." }) {
  return (
    <div className="py-12">
      <Loader
        variant="spinner"
        size="lg"
        color="gray"
        label={message}
        center
      />
    </div>
  );
}

export function ButtonLoader({ size = "sm", color = "white" }) {
  return (
    <Loader
      variant="spinner"
      size={size}
      color={color}
      center={false}
      className="inline-flex"
    />
  );
}

export function TableLoader({ columns = 5, rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"
              style={{
                animationDelay: `${(rowIndex * 0.1 + colIndex * 0.05)}s`,
                maxWidth: colIndex === 0 ? "120px" : "auto",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonLoader({ type = "card", count = 1 }) {
  const skeletons = Array.from({ length: count });

  const skeletonTypes = {
    card: (
      <div className="space-y-4">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    ),
    line: (
      <div className="space-y-3">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    ),
    avatar: (
      <div className="flex items-center gap-3">
        {skeletons.map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    ),
    grid: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return skeletonTypes[type] || skeletonTypes.card;
}

export default function DefaultLoader() {
  return <Loader variant="dots" size="md" color="indigo" />;
}

export function useLoader(initialState = false, delay = 100) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isLoading) {
      timeoutId = setTimeout(() => setIsDelayed(true), delay);
    } else {
      setIsDelayed(false);
    }

    return () => clearTimeout(timeoutId);
  }, [isLoading, delay]);

  const start = () => setIsLoading(true);
  const stop = () => setIsLoading(false);
  const toggle = () => setIsLoading(prev => !prev);

  return {
    isLoading,
    isDelayed,
    start,
    stop,
    toggle,
    LoaderComponent: ({ children, ...props }) => (
      <>
        {/* {isDelayed && <Loader {...props} />} */}
        {!isDelayed && children}
      </>
    ),
  };
}

// HOW TO USE 
// // 1. Basic usage (like original)
// <Loader />

// // 2. With custom configurationE
// <Loader 
//   variant="spinner"
//   size="lg"
//   color="blue"
//   label="Processing..."
//   center
// />

// // 3. Full-screen page loader
// <PageLoader message="Loading dashboard..." />

// // 4. Content loader
// <ContentLoader message="Fetching data..." />

// // 5. Button loader
// <button disabled>
//   <ButtonLoader />
//   Submitting...
// </button>

// // 6. Skeleton loading
// <SkeletonLoader type="grid" count={3} />

// // 7. Table loader
// <TableLoader columns={4} rows={6} />

// // 8. Using the hook
// const { isLoading, LoaderComponent } = useLoader();

// <LoaderComponent variant="dots">
//   <YourContent />
// </LoaderComponent>