'use client';

// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { DownloadPage } from '@/pages/Download';
import { NotFound } from '@/pages/404';
import { AuthCallback } from '@/components/features/AuthCallback';
import { ProtectedRoute } from '@/components/features/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabaseClient';

function App() {
  // const { isInitializing } = useAuth()
  // // 이벤트 처리 중인지 추적하는 ref
  // const isProcessingRef = useRef(false)
  // // 마지막 이벤트와 시간을 추적하는 ref
  // const lastEventRef = useRef<{ event: string | null; time: number }>({
  //   event: null,
  //   time: 0,
  // })

  // useEffect(() => {
  //   // 이미 리스너가 설정되었는지 확인하는 플래그
  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange((event, session) => {
  //     // 이벤트 디바운싱 - 같은 이벤트가 짧은 시간 내에 반복되는 경우 무시
  //     const now = Date.now()
  //     if (lastEventRef.current.event === event && now - lastEventRef.current.time < 1000) {
  //       return
  //     }

  //     // 이벤트 정보 업데이트
  //     lastEventRef.current = {
  //       event,
  //       time: now,
  //     }

  //     // 이미 처리 중인 경우 중복 처리 방지
  //     if (isProcessingRef.current) {
  //       return
  //     }

  //     // 처리 시작
  //     isProcessingRef.current = true

  //     try {
  //       console.log("Auth 상태 변경:", event, session)

  //       // 현재 isGeneratingKey 상태 가져오기
  //       const isGeneratingKey = useAuthStore.getState().isGeneratingKey

  //       // 키 생성 중에는 리디렉션 방지
  //       if (isGeneratingKey) {
  //         console.log("키 생성 중 리디렉션 방지")
  //         return
  //       }

  //       if (event === "SIGNED_IN" && session) {
  //         // 로그인 처리
  //       } else if (event === "SIGNED_OUT") {
  //         // 로그아웃 처리
  //         // 여기서 추가 작업이 필요한 경우만 수행
  //         // 주의: 여기서 다시 signOut을 호출하지 않도록 합니다
  //       }
  //     } finally {
  //       // 일정 시간 후에 처리 플래그 해제
  //       setTimeout(() => {
  //         isProcessingRef.current = false
  //       }, 100)
  //     }
  //   })

  //   return () => {
  //     subscription.unsubscribe()
  //   }
  // }, [])

  // // 앱 초기화 중에는 간단한 로딩 화면 표시
  // if (isInitializing) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <h2 className="text-xl font-medium">앱 초기화 중...</h2>
  //         <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#61C9A8] mx-auto"></div>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 보호된 라우트 */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 및 리디렉션 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
