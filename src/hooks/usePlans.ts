import { useState, useEffect } from 'react';
import { Plan } from '@/types';

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 초기 일정 데이터 로드
  useEffect(() => {
    const loadPlans = () => {
      setLoading(true);
      try {
        // 로컬 스토리지에서 일정 데이터 가져오기
        const savedPlans = localStorage.getItem('plans');
        if (savedPlans) {
          // JSON으로 저장된 날짜를 Date 객체로 변환
          const parsedPlans = JSON.parse(savedPlans, (key, value) => {
            if (key === 'startDate' || key === 'endDate') {
              return new Date(value);
            }
            return value;
          });
          setPlans(parsedPlans);
        }
      } catch (err) {
        console.error('일정 로드 중 오류 발생:', err);
        setError(err instanceof Error ? err : new Error('일정 로드 중 오류 발생'));
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  // 일정 데이터가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (plans.length > 0) {
      localStorage.setItem('plans', JSON.stringify(plans));
    }
  }, [plans]);

  // 일정 추가
  const addPlan = (newPlan: Plan) => {
    setPlans(prevPlans => [...prevPlans, newPlan]);
  };

  // 일정 업데이트
  const updatePlan = (updatedPlan: Plan) => {
    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === updatedPlan.id 
          ? updatedPlan
          : plan
      )
    );
  };

  // 일정 삭제
  const deletePlan = (planId: string) => {
    setPlans(prevPlans => prevPlans.filter(plan => plan.id !== planId));
  };

  // 일정 완료 상태 토글
  const togglePlanCompleted = (planId: string) => {
    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId
          ? { ...plan, completed: !plan.completed }
          : plan
      )
    );
  };

  // 태그로 일정 필터링
  const getPlansByTag = (tag: string) => {
    return plans.filter(plan => plan.tags.includes(tag));
  };

  // 날짜로 일정 필터링 (해당 날짜에 진행 중인 일정)
  const getPlansByDate = (date: Date) => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    return plans.filter(plan => {
      const planStartDate = new Date(plan.startDate);
      planStartDate.setHours(0, 0, 0, 0);
      
      const planEndDate = new Date(plan.endDate);
      planEndDate.setHours(23, 59, 59, 999);
      
      return dateOnly >= planStartDate && dateOnly <= planEndDate;
    });
  };

  // 우선순위로 일정 필터링
  const getPlansByPriority = (priority: 'low' | 'medium' | 'high') => {
    return plans.filter(plan => plan.priority === priority);
  };

  // 완료 상태로 일정 필터링
  const getPlansByCompletionStatus = (completed: boolean) => {
    return plans.filter(plan => plan.completed === completed);
  };

  // 모든 태그 가져오기
  const getAllTags = () => {
    const tagSet = new Set<string>();
    plans.forEach(plan => {
      plan.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  return {
    plans,
    loading,
    error,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlanCompleted,
    getPlansByTag,
    getPlansByDate,
    getPlansByPriority,
    getPlansByCompletionStatus,
    getAllTags
  };
};