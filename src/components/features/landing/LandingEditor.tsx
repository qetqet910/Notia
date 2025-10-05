import React, { useState } from 'react';
import { useNoteParser } from '@/hooks/useNoteParser';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Code from 'lucide-react/dist/esm/icons/code';
import { motion } from 'framer-motion';
import { initialContent } from '@/constants/home';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';

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
  const { tags, reminders } = useNoteParser(content);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white/50 shadow-2xl shadow-green-500/10 border-gray-200">
      <div className="flex justify-end p-2 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className="flex items-center gap-1"
          >
            <Code className="w-4 h-4" />
            <span>수정</span>
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            <span>미리보기</span>
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {viewMode === 'edit' ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="여기에 입력해보세요..."
              className="w-full h-48 resize-none border-gray-200 focus:ring-green-500 bg-transparent text-base custom-scrollbar"
            />
          ) : (
            <div className="w-full h-48 overflow-y-auto p-3 bg-gray-50 rounded-md border border-gray-200 custom-scrollbar">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ ...props }) => (
                    <h1 className="text-2xl font-bold" {...props} />
                  ),
                  h2: ({ ...props }) => (
                    <h2 className="text-xl font-bold" {...props} />
                  ),
                  h3: ({ ...props }) => (
                    <h3 className="text-lg font-bold" {...props} />
                  ),
                  p: ({ ...props }) => <p className="my-2" {...props} />,
                  ul: ({ ...props }) => (
                    <ul className="list-disc list-inside" {...props} />
                  ),
                  ol: ({ ...props }) => (
                    <ol className="list-decimal list-inside" {...props} />
                  ),
                  li: ({ ...props }) => <li className="ml-4" {...props} />,
                  blockquote: ({ ...props }) => (
                    <blockquote
                      className="border-l-4 border-gray-300 pl-4 italic text-gray-600"
                      {...props}
                    />
                  ),
                  code: ({ ...props }) => (
                    <code
                      className="bg-gray-200 rounded px-1 text-sm"
                      {...props}
                    />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </motion.div>

        <div className="mt-6 space-y-6">
          {tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center mb-3">
                <Tag className="h-5 w-5 mr-2 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-800 ">태그</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-base">
                    #{tag.text}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {reminders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800 ">
                  리마인더
                </h3>
              </div>
              <div className="space-y-3">
                {reminders
                  .filter((reminder) => reminder.parsedDate)
                  .map((reminder, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50  rounded-lg border border-gray-200 "
                    >
                      <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-grow">
                        <p className="font-medium text-gray-900 ">
                          {reminder.reminderText}
                        </p>
                        <p className="text-sm text-green-600  font-semibold">
                          {formatDate(reminder.parsedDate!)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
