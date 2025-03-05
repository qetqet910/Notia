// 사용자 타입 정의
type User = {
  id: string
  key: string
  email?: string
  socialId?: string
  provider?: string
  createdAt: string
}

// 그룹 타입 정의
type Group = {
  id: string
  name: string
  key: string
  ownerId: string
  members: string[] // 사용자 ID 배열
  createdAt: string
}

class DatabaseService {
  // 로컬 스토리지를 사용한 간단한 구현
  // 실제로는 Firebase, Supabase 등의 서비스 사용

  // 사용자 관련 메서드
  users = {
    // 사용자 생성
    create: async (userData: Partial<User>): Promise<User> => {
      const id = crypto.randomUUID()
      const user: User = {
        id,
        key: userData.key || "",
        email: userData.email,
        socialId: userData.socialId,
        provider: userData.provider,
        createdAt: userData.createdAt || new Date().toISOString(),
      }

      // 로컬 스토리지에 저장
      const users = this.getUsers()
      users.push(user)
      localStorage.setItem("users", JSON.stringify(users))

      return user
    },

    // 키로 사용자 찾기
    findByKey: async (key: string): Promise<User | null> => {
      const users = this.getUsers()
      const user = users.find((u) => u.key === key)
      return user || null
    },

    // 소셜 ID로 사용자 찾기 또는 생성
    findOrCreate: async (userData: { socialId: string; provider: string; email?: string }): Promise<User> => {
      const users = this.getUsers()
      let user = users.find((u) => u.socialId === userData.socialId && u.provider === userData.provider)

      if (!user) {
        // 새 사용자 생성
        const key = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

        user = await this.users.create({
          key,
          socialId: userData.socialId,
          provider: userData.provider,
          email: userData.email,
        })
      }

      return user
    },
  }

  // 그룹 관련 메서드
  groups = {
    // 그룹 생성
    create: async (groupData: { name: string; ownerId: string }): Promise<Group> => {
      const id = crypto.randomUUID()
      const key = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

      const group: Group = {
        id,
        name: groupData.name,
        key,
        ownerId: groupData.ownerId,
        members: [groupData.ownerId],
        createdAt: new Date().toISOString(),
      }

      // 로컬 스토리지에 저장
      const groups = this.getGroups()
      groups.push(group)
      localStorage.setItem("groups", JSON.stringify(groups))

      return group
    },

    // 키로 그룹 찾기
    findByKey: async (key: string): Promise<Group | null> => {
      const groups = this.getGroups()
      const group = groups.find((g) => g.key === key)
      return group || null
    },

    // 그룹에 사용자 추가
    addMember: async (groupId: string, userId: string): Promise<Group | null> => {
      const groups = this.getGroups()
      const groupIndex = groups.findIndex((g) => g.id === groupId)

      if (groupIndex === -1) return null

      if (!groups[groupIndex].members.includes(userId)) {
        groups[groupIndex].members.push(userId)
        localStorage.setItem("groups", JSON.stringify(groups))
      }

      return groups[groupIndex]
    },
  }

  // 로컬 스토리지에서 사용자 목록 가져오기
  private getUsers(): User[] {
    const usersJson = localStorage.getItem("users")
    return usersJson ? JSON.parse(usersJson) : []
  }

  // 로컬 스토리지에서 그룹 목록 가져오기
  private getGroups(): Group[] {
    const groupsJson = localStorage.getItem("groups")
    return groupsJson ? JSON.parse(groupsJson) : []
  }
}

export const db = new DatabaseService()

