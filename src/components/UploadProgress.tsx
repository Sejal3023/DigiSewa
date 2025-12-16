import React from 'react';
import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  progress: number;
  message: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress, message }) => {
  return (
    <div className="w-full mt-4">
      <Progress value={progress} className="w-full" />
      <p className="text-center text-sm text-muted-foreground mt-2">
        {message}
      </p>
    </div>
  );
};

export default UploadProgress;
