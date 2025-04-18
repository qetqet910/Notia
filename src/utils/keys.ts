/**
 * 랜덤 키 생성 함수
 * @param length 키 길이 (기본값: 16)
 * @returns 생성된 랜덤 키
 */
export function generateRandomKey(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""

  // 암호학적으로 안전한 난수 생성기 사용
  const randomValues = new Uint8Array(length)
  window.crypto.getRandomValues(randomValues)

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }

  return result
}

/**
 * 키를 포맷팅하는 함수 (4자리마다 하이픈 추가)
 * @param key 포맷팅할 키
 * @returns 포맷팅된 키 (예: XXXX-XXXX-XXXX-XXXX)
 */
export function formatKey(key: string): string {
  // 하이픈 제거
  const cleanKey = key.replace(/-/g, "")

  // 4자리마다 하이픈 추가
  let formattedKey = ""
  for (let i = 0; i < cleanKey.length; i += 4) {
    formattedKey += cleanKey.substring(i, i + 4)
    if (i + 4 < cleanKey.length) {
      formattedKey += "-"
    }
  }

  return formattedKey
}

/**
 * 키가 유효한지 확인하는 함수
 * @param key 확인할 키
 * @returns 키 유효성 여부
 */
export function isValidKey(key: string): boolean {
  // 하이픈 제거
  const cleanKey = key.replace(/-/g, "")

  // 길이 확인 (16자)
  if (cleanKey.length !== 16) {
    return false
  }

  // 허용된 문자만 포함하는지 확인
  const validChars = /^[A-Z0-9]+$/
  return validChars.test(cleanKey)
}
