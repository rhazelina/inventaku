// src/components/Loader.tsx
import { FC } from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  light?: boolean;
}

const Loader: FC<LoaderProps> = ({ size = "md", className = "", light = false }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-solid animate-spin ${
          light ? "border-white border-t-transparent" : "border-blue-600 border-t-transparent"
        }`}
      ></div>
    </div>
  );
};

export default Loader;
