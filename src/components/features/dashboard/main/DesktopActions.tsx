import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/features/dashboard/UserProfile';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';

export const DesktopActions = ({
  handleCreateNote,
}: {
  handleCreateNote: () => void;
}) => (
  <div className="flex items-center gap-2">
    <Button
      id="tour-create-note"
      variant="outline"
      size="sm"
      onClick={handleCreateNote}
    >
      <PlusCircle className="mr-2 h-4 w-4" />새 노트
    </Button>
    <div id="tour-user-profile">
      <UserProfile />
    </div>
  </div>
);
