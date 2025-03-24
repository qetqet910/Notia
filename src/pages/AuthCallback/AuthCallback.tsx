"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        console.error("Auth error:", error);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        navigate("/dashboard");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">인증 오류</h2>
          <p className="mt-2">{error}</p>
          <p className="mt-4">3초 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold">인증 처리 중...</h2>
        <p className="mt-2">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
};
