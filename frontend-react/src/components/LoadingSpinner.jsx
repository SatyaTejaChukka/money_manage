import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ fullScreen = false, size = "default", className = "" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12"
  };

  const spinner = (
    <Loader2 
      className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} 
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center p-4">{spinner}</div>;
};

export default LoadingSpinner;
