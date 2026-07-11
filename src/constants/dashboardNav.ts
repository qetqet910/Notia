import CalendarIcon from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import List from 'lucide-react/dist/esm/icons/list';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Trash from 'lucide-react/dist/esm/icons/trash-2';

export const NAV_ITEMS = [
  { id: 'notes', label: '노트', icon: List },
  { id: 'reminder', label: '리마인더', icon: Clock },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  { id: 'timeline', label: '타임라인', icon: Activity },
  { id: 'trash', label: '휴지통', icon: Trash },
];
