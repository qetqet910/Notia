"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Calendar, Tag, Search, ChevronLeft, ChevronRight, Plus, Menu } from "lucide-react"
import { Editor } from "../../components/features/Editor/Editor"
import { NoteList } from "../../components/features/NoteList/NoteList"
import { useTags } from "../../hooks/useTags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/Logo"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const HomePage: React.FC = () => {
  const { allTags, selectedTag, setSelectedTag } = useTags()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewNote, setIsNewNote] = useState(false)

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
        className={`relative ${
          isSidebarOpen ? "w-72" : "w-0"
        } bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-100/50 dark:shadow-none overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <Logo />
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
                className="pl-9 w-full bg-gray-50/50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4">
            <TooltipProvider>
              <ul className="space-y-1">
                {menuItems.map((item, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
            <div className="mt-8">
              <div className="px-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">태그</h2>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <ul className="mt-2 space-y-1">
                {allTags.map((tag) => (
                  <li key={tag}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start group ${
                        selectedTag === tag
                          ? "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      <Tag
                        className={`w-4 h-4 ${
                          selectedTag === tag ? "text-violet-500" : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      />
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
          className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full shadow-sm border-gray-100 dark:border-gray-600"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {!isSidebarOpen && (
                <Button variant="ghost" size="icon" className="mr-4" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedTag ? `${selectedTag} 태그의 메모` : "모든 메모"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsNewNote(!isNewNote)}
                className="bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600"
              >
                <Plus className="w-4 h-4 mr-2" />새 메모
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-8">
            <AnimatePresence>
              {isNewNote && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
                    <Editor />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <section>
              <NoteList tagFilter={selectedTag} searchQuery={searchQuery} />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

