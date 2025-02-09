import { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { Plan, Task } from '../types/plan';

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const savedPlans = await db.getPlans();
        setPlans(savedPlans);
      } catch (error) {
        console.error('Failed to load plans:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const addPlan = async (plan: Omit<Plan, 'id'>) => {
    const newPlan = { ...plan, id: Date.now() };
    try {
      await db.savePlan(newPlan);
      setPlans(prev => [...prev, newPlan]);
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const updatePlan = async (id: number, updates: Partial<Plan>) => {
    try {
      const updatedPlan = { ...plans.find(p => p.id === id), ...updates };
      await db.savePlan(updatedPlan as Plan);
      setPlans(prev => prev.map(p => p.id === id ? updatedPlan as Plan : p));
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  return {
    plans,
    loading,
    addPlan,
    updatePlan
  };
}; 