import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';

interface FeatureUnderConstructionProps {
  featureName: string;
  message?: string;
}

const FeatureUnderConstruction = ({
  featureName,
  message = '현재 점검 중인 기능입니다.',
}: FeatureUnderConstructionProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>{featureName}</span>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default FeatureUnderConstruction;
