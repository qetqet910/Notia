import { supabase } from '@/services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * 이미지를 Supabase Storage 버킷에 업로드하고 공용 URL을 반환합니다.
 * @param file 업로드할 이미지 파일
 * @param userId 사용자 ID (경로 생성용)
 * @returns 업로드된 이미지의 공용 URL
 */
export const uploadImageToSupabase = async (file: File, userId: string): Promise<string | null> => {
  try {
    if (!file.type.startsWith('image/')) {
      console.error('File is not an image');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('note-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('note-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    return null;
  }
};
