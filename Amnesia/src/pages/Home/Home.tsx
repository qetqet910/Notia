import type React from "react"
import { useState } from "react"
import { FiMenu, FiHome, FiCalendar, FiTag, FiPlus } from "react-icons/fi"

// 할 일 항목의 타입 정의
interface Task {
  id: number
  text: string
  completed: boolean
}

// 사이드바 메뉴 항목의 타입 정의
interface MenuItem {
  icon: React.ReactNode
  text: string
}

export const Home = (): JSX.Element => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Todoist 클론 만들기", completed: false },
    { id: 2, text: "React 학습하기", completed: true },
    { id: 3, text: "Tailwind CSS 익히기", completed: false },
  ])

  const [newTask, setNewTask] = useState<string>("")

  const menuItems: MenuItem[] = [
    { icon: <FiHome className="mr-2" />, text: "홈" },
    { icon: <FiCalendar className="mr-2" />, text: "오늘" },
    { icon: <FiTag className="mr-2" />, text: "레이블" },
  ]

  const addTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }])
      setNewTask("")
    }
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 왼쪽 사이드바 */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <div className="flex items-center mb-6">
          <FiMenu className="mr-2" />
          <h1 className="text-xl font-semibold">MEMO</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
                {item.icon} {item.text}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-4">오늘 할 일</h2>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center bg-white p-3 rounded shadow">
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="mr-2" />
              <span className={task.completed ? "line-through text-gray-500" : ""}>{task.text}</span>
            </li>
          ))}
        </ul>
        <form onSubmit={addTask} className="mt-4 flex">
          <input
            type="text"
            value={newTask}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask(e.target.value)}
            placeholder="할 일 추가..."
            className="flex-1 p-2 border rounded-l"
          />
          <button type="submit" className="bg-red-500 text-white p-2 rounded-r">
            <FiPlus />
          </button>
        </form>
      </div>
    </div>
  )
}

