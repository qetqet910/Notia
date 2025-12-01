import React, { useState, useMemo } from 'react';
import { parseNoteContent } from '@/utils/noteParser';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

import { motion, AnimatePresence } from 'framer-motion';
import { initialContent } from '@/constants/home';
import { MarkdownPreview } from '@/components/features/dashboard/MarkdownPreview';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Code from 'lucide-react/dist/esm/icons/code';

const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date)) return '날짜 정보 없음';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow =
    date.toDateString() ===
    new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
  const timeString = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  if (isToday) return `오늘 ${timeString}`;
  if (isTomorrow) return `내일 ${timeString}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${timeString}`;
};

export const LandingEditor: React.FC = () => {
  const [content, setContent] = useState(initialContent);
  const { tags, reminders } = useMemo(() => parseNoteContent(content), [content]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white backdrop-blur-sm shadow-2xl shadow-green-500/10 border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-2 pl-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
        </div>
        <div className="flex items-center bg-gray-200/50 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === 'edit'
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-gray-200/50'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>에디터</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === 'preview'
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-gray-200/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>미리보기</span>
          </button>
        </div>
      </div>
      <CardContent className="p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {viewMode === 'edit' ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="여기에 입력해보세요..."
              className="w-full h-[300px] resize-none border-none focus-visible:ring-0 bg-transparent text-base leading-relaxed p-6 custom-scrollbar font-['Orbit'] placeholder:text-muted-foreground/50"
              style={{ fontSize: '16px' }}
            />
          ) : (
            <div className="w-full h-[300px] overflow-y-auto p-6 bg-white/50 custom-scrollbar">
              <MarkdownPreview content={content} />
            </div>
          )}
        </motion.div>

        <div className="bg-gray-50/50 border-t border-gray-100 p-4 space-y-3 min-h-[120px]">
          <AnimatePresence>
            {tags.length > 0 && (
              <motion.div
                key="tags-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="flex items-center mb-3">
                  <Tag className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-base cursor-pointer hover:bg-primary/20">
                        {tag.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {reminders.length > 0 && (
              <motion.div
                key="reminders-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="flex items-center mb-3">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {reminders
                      .filter((reminder) => reminder.parsedDate)
                      .map((reminder, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border text-sm"
                        >
                          <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {reminder.reminderText}
                            </p>
                            <p className="text-xs text-blue-500 font-semibold">
                              {formatDate(reminder.parsedDate!)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
