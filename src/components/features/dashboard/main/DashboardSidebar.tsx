import { Button } from '@/components/ui/button';
import { GoalProgress } from '@/components/features/dashboard/GoalProgress';
import { NAV_ITEMS } from '@/constants/dashboardNav';

export const DashboardSidebar = ({
  activeTab,
  setActiveTab,
  onTagSelect,
  isEditing,
  popularTags,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTagSelect: (tag: string) => void;
  isEditing: boolean;
  popularTags: { tag: string; count: number }[];
}) => {
  return (
    <aside
      className={`border-r border-border bg-muted p-4 hidden md:flex overflow-y-auto justify-between flex-col h-full ${
        isEditing ? 'w-0 opacity-0' : 'w-48'
      }`}
    >
      <nav id="tour-sidebar-nav" className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
      <div>
        {popularTags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              인기 태그
            </h3>
            <div className="flex flex-col gap-1">
              {popularTags.map(({ tag, count }) => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  className="justify-between text-xs"
                  onClick={() => {
                    setActiveTab('notes');
                    onTagSelect(tag);
                  }}
                >
                  <span>#{tag}</span>
                  <span className="bg-muted-foreground/20 rounded-full px-2 py-0.5 text-xs">
                    {count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
        <div id="tour-goal-progress">
          <GoalProgress />
        </div>
      </div>
    </aside>
  );
};
