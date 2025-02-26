// src/pages/Home.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, Calendar, Bell } from 'lucide-react';

import logoImage from '@/stores/Logo.png';
import PlaceHolder from '@/stores/Placeholder.png';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="border-b py-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">
              <img src={logoImage} className='max-w-40 cursor-pointer' alt="" />
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              onClick={() => navigate('/download')}
            >
              앱 다운로드
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-[#61C9A8] hover:bg-[#61C9A8] text-white"
            >
              로그인
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                일과 생활을 관리하세요
              </h1>
              <p className="text-xl text-muted-foreground">
                당신과 당신의 팀 모두의 생활을 단순화하세요. 세계 최고의 작업 관리자 및 할일 목록 앱입니다.
              </p>
              <div className="space-x-4">
                <Button 
                  className="bg-[#61C9A8] hover:bg-[#61C9A8] text-white"
                  size="lg"
                  onClick={() => navigate('/signup')}
                >
                  앱 다운로드
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>374K+ 리뷰(예정)</span>
              </div>
            </div>
            <div className="flex-1">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <img 
                    src={PlaceHolder}
                    alt="제품 미리보기 사진" 
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <CheckCircle2 className="w-12 h-12 text-[#61C9A8] mb-4" />
                <h3 className="text-xl font-semibold mb-2">작업 관리</h3>
                <p className="text-muted-foreground">
                  할 일을 쉽게 추가하고 구성하세요. 우선순위를 지정하고 마감일을 설정하세요.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Calendar className="w-12 h-12 text-[#61C9A8] mb-4" />
                <h3 className="text-xl font-semibold mb-2">일정 관리</h3>
                <p className="text-muted-foreground">
                  캘린더와 통합하여 모든 일정을 한눈에 확인하세요.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Bell className="w-12 h-12 text-[#61C9A8] mb-4" />
                <h3 className="text-xl font-semibold mb-2">리마인더</h3>
                <p className="text-muted-foreground">
                  중요한 일정을 놓치지 않도록 알림을 설정하세요.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <blockquote className="text-lg italic">
                  "간단하고 직관적이며 매우 유력합니다"
                </blockquote>
                <div className="mt-4">
                  <img src="/api/placeholder/100/30" alt="The Verge" className="h-8" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <blockquote className="text-lg italic">
                  "시중 최고의 할일 목록 앱"
                </blockquote>
                <div className="mt-4">
                  <img src="/api/placeholder/100/30" alt="PC Magazine" className="h-8" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <blockquote className="text-lg italic">
                  "최고에 못 미치는 것은 없다"
                </blockquote>
                <div className="mt-4">
                  <img src="/api/placeholder/100/30" alt="TechRadar" className="h-8" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">지금 시작하세요</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            더 효율적인 일과 생활 관리를 위한 첫 걸음을 내딛어보세요.
          </p>
          <Button 
            className="bg-[#61C9A8] hover:bg-[#61C9A8] text-white"
            size="lg"
            onClick={() => navigate('/signup')}
          >
            무료로 시작하기
          </Button>
        </div>
      </section>

      <footer className="bg-gray-50 mt-12 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} HyeonMin Kim. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;