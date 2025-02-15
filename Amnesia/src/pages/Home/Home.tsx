"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, Home, Calendar, Tag, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Editor } from "../../components/features/Editor/Editor"
import { NoteList } from "../../components/features/NoteList/NoteList"
import { useTags } from "../../hooks/useTags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const HomePage: React.FC = () => {
  const { allTags, selectedTag, setSelectedTag } = useTags()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const menuItems = [
    { icon: <Home className="w-4 h-4" />, text: "홈", tooltip: "모든 메모 보기" },
    { icon: <Calendar className="w-4 h-4" />, text: "오늘", tooltip: "오늘의 메모" },
    { icon: <Tag className="w-4 h-4" />, text: "레이블", tooltip: "태그별 보기" },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? "auto" : "0px" }}
        className={`relative ${isSidebarOpen ? "w-64" : "w-0"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">MEMO</h1>
            </div>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="메모 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full bg-gray-50 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <TooltipProvider>
              <ul className="space-y-1">
                {menuItems.map((item, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          {item.icon}
                          <span className="ml-3">{item.text}</span>
                        </Button>
                      </li>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </ul>
            </TooltipProvider>

            {/* Tags */}
            <div className="mt-6">
              <h2 className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400">태그</h2>
              <ul className="mt-2 space-y-1">
                {allTags.map((tag) => (
                  <li key={tag}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        selectedTag === tag
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      <Tag className="w-4 h-4" />
                      <span className="ml-3 truncate">{tag}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        {/* Sidebar Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full shadow-md"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">새 메모</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <Editor />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {selectedTag ? `${selectedTag} 태그의 메모` : "모든 메모"}
              </h2>
              <NoteList tagFilter={selectedTag} searchQuery={searchQuery} />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

