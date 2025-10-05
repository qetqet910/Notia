import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import Users from 'lucide-react/dist/esm/icons/users';
import Settings from 'lucide-react/dist/esm/icons/settings';
import { Team } from '@/types';

interface TeamSpaceListProps {
  teams: Team[];
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: () => void;
  onManageTeam: (teamId: string) => void;
  isLoading: boolean;
}

export const TeamSpaceList: React.FC<TeamSpaceListProps> = ({
  teams,
  onSelectTeam,
  onCreateTeam,
  onManageTeam,
  isLoading,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          팀 스페이스
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCreateTeam}>
          <PlusCircle className="h-4 w-4 mr-1" />
          팀 만들기
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>로딩 중...</p>
        ) : teams.length > 0 ? (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => onSelectTeam(team.id)}
                >
                  {team.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onManageTeam(team.id)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            소속된 팀이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
