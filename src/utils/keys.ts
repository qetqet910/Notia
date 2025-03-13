  /**
   * 지정된 길이의 랜덤 키를 생성합니다.
   * @param length 키 길이 (기본값: 16)
   * @returns 생성된 랜덤 키
   */
  export function generateRandomKey(length: number): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""

    // 암호학적으로 안전한 난수 생성
    const randomValues = new Uint32Array(length)
    window.crypto.getRandomValues(randomValues)

    for (let i = 0; i < length; i++) {
      result += characters.charAt(randomValues[i] % characters.length)
    }

    return result
  }
  
  /**
   * 키를 포맷팅합니다 (XXXX-XXXX-XXXX-XXXX 형식)
   * @param key 포맷팅할 키
   * @returns 포맷팅된 키
   */
  export function formatKey(key: string): string {
    if (!key || key.length !== 16) return key
  
    const chunks = []
    for (let i = 0; i < key.length; i += 4) {
      chunks.push(key.substring(i, i + 4))
    }
  
    return chunks.join("-")
  }
  
  /**
   * 포맷팅된 키에서 대시를 제거합니다.
   * @param formattedKey 포맷팅된 키
   * @returns 원래 키
   */
  export function cleanKey(formattedKey: string): string {
    return formattedKey.replace(/-/g, "")
  }
  