import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PlusCircle, Calendar, Check, Trash2, Edit } from 'lucide-react';
import { Plan } from '@/types';

interface PlanManagerProps {
  plans: Plan[];
  onAddPlan: (plan: Plan) => void;
  onUpdatePlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
}

export const PlanManager: React.FC<PlanManagerProps> = ({
  plans,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'upcoming' | 'completed'
  >('all');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState<Plan>({
    id: '',
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000), // 1 hour later
    completed: false,
    priority: 'medium',
    tags: [],
  });
  const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false);

  const filteredPlans = plans.filter((plan) => {
    if (activeFilter === 'completed') return plan.completed;
    if (activeFilter === 'upcoming')
      return !plan.completed && plan.startDate >= new Date();
    return true;
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const priorityLabels = {
    low: '낮음',
    medium: '중간',
    high: '높음',
  };

  const handleCreatePlan = () => {
    const planToAdd = {
      ...newPlan,
      id: Date.now().toString(),
    };
    onAddPlan(planToAdd);
    setNewPlan({
      id: '',
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      completed: false,
      priority: 'medium',
      tags: [],
    });
    setIsNewPlanDialogOpen(false);
  };

  const handleUpdatePlan = () => {
    if (editingPlan) {
      onUpdatePlan(editingPlan);
      setEditingPlan(null);
    }
  };

  const togglePlanCompletion = (plan: Plan) => {
    onUpdatePlan({
      ...plan,
      completed: !plan.completed,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <Tabs
          value={activeFilter}
          onValueChange={(v) =>
            setActiveFilter(v as 'all' | 'upcoming' | 'completed')
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">모든 일정</TabsTrigger>
            <TabsTrigger value="upcoming">예정된 일정</TabsTrigger>
            <TabsTrigger value="completed">완료된 일정</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={() => setIsNewPlanDialogOpen(true)}
        >
          <PlusCircle className="h-4 w-4 mr-1" />새 일정
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {filteredPlans.length > 0 ? (
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full p-0 h-6 w-6 mr-3 mt-1"
                      onClick={() => togglePlanCompletion(plan)}
                    >
                      <div
                        className={`h-5 w-5 rounded-full border ${
                          plan.completed
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        } flex items-center justify-center`}
                      >
                        {plan.completed && <Check className="h-3 w-3" />}
                      </div>
                    </Button>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-medium ${
                            plan.completed
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {plan.title}
                        </h3>

                        <div className="flex items-center gap-2">
                          <Badge className={priorityColors[plan.priority]}>
                            {priorityLabels[plan.priority]}
                          </Badge>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>일정 수정</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label
                                    htmlFor="title"
                                    className="text-sm font-medium"
                                  >
                                    제목
                                  </label>
                                  <Input
                                    id="title"
                                    value={editingPlan?.title || ''}
                                    onChange={(e) =>
                                      setEditingPlan((prev) =>
                                        prev
                                          ? { ...prev, title: e.target.value }
                                          : null,
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label
                                    htmlFor="description"
                                    className="text-sm font-medium"
                                  >
                                    설명
                                  </label>
                                  <Textarea
                                    id="description"
                                    value={editingPlan?.description || ''}
                                    onChange={(e) =>
                                      setEditingPlan((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              description: e.target.value,
                                            }
                                          : null,
                                      )
                                    }
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      시작일
                                    </label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-start"
                                        >
                                          <Calendar className="mr-2 h-4 w-4" />
                                          {editingPlan?.startDate
                                            ? format(
                                                editingPlan.startDate,
                                                'PPP',
                                                { locale: ko },
                                              )
                                            : '날짜 선택'}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                          mode="single"
                                          selected={editingPlan?.startDate}
                                          onSelect={(date) =>
                                            setEditingPlan((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    startDate:
                                                      date || new Date(),
                                                  }
                                                : null,
                                            )
                                          }
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      종료일
                                    </label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-start"
                                        >
                                          <Calendar className="mr-2 h-4 w-4" />
                                          {editingPlan?.endDate
                                            ? format(
                                                editingPlan.endDate,
                                                'PPP',
                                                { locale: ko },
                                              )
                                            : '날짜 선택'}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                          mode="single"
                                          selected={editingPlan?.endDate}
                                          onSelect={(date) =>
                                            setEditingPlan((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    endDate: date || new Date(),
                                                  }
                                                : null,
                                            )
                                          }
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    우선순위
                                  </label>
                                  <Select
                                    value={editingPlan?.priority || 'medium'}
                                    onValueChange={(value) =>
                                      setEditingPlan((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              priority: value as
                                                | 'low'
                                                | 'medium'
                                                | 'high',
                                            }
                                          : null,
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="우선순위 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">낮음</SelectItem>
                                      <SelectItem value="medium">
                                        중간
                                      </SelectItem>
                                      <SelectItem value="high">높음</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">취소</Button>
                                </DialogClose>
                                <Button onClick={handleUpdatePlan}>저장</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  정말로 삭제하시겠습니까?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 작업은 되돌릴 수 없습니다. 이 일정은
                                  영구적으로 삭제됩니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeletePlan(plan.id)}
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                      )}

                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {format(plan.startDate, 'PPP', { locale: ko })} -{' '}
                          {format(plan.endDate, 'PPP', { locale: ko })}
                        </span>
                      </div>

                      {plan.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p>일정이 없습니다</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsNewPlanDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />새 일정
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* New Plan Dialog */}
      <Dialog open={isNewPlanDialogOpen} onOpenChange={setIsNewPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 일정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-title" className="text-sm font-medium">
                제목
              </label>
              <Input
                id="new-title"
                value={newPlan.title}
                onChange={(e) =>
                  setNewPlan((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-description" className="text-sm font-medium">
                설명
              </label>
              <Textarea
                id="new-description"
                value={newPlan.description}
                onChange={(e) =>
                  setNewPlan((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(newPlan.startDate, 'PPP', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newPlan.startDate}
                      onSelect={(date) =>
                        setNewPlan((prev) => ({
                          ...prev,
                          startDate: date || new Date(),
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(newPlan.endDate, 'PPP', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newPlan.endDate}
                      onSelect={(date) =>
                        setNewPlan((prev) => ({
                          ...prev,
                          endDate: date || new Date(),
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">우선순위</label>
              <Select
                value={newPlan.priority}
                onValueChange={(value) =>
                  setNewPlan((prev) => ({
                    ...prev,
                    priority: value as 'low' | 'medium' | 'high',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="우선순위 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">중간</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewPlanDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleCreatePlan} disabled={!newPlan.title}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
