/**
 * 텍스트 청킹 유틸리티
 * 마침표 단위로 분할, 최소 32자 기준 적용
 */

const MIN_CHUNK_SIZE = 32;

export function splitIntoChunks(text: string, numChunks: number): string[] {
  if (numChunks <= 1) {
    return [text];
  }

  // 마침표 기준으로 문장 분리
  const sentences = text.split(/\. /).map((s, i, arr) =>
    i < arr.length - 1 ? s + '.' : s
  );

  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // 현재 청크에 문장 추가
    if (currentChunk.length > 0) {
      currentChunk += ' ' + sentence;
    } else {
      currentChunk = sentence;
    }

    // 마지막 문장이거나, 32자 이상이고 다음 문장이 있으면 청크 완성
    const isLastSentence = i === sentences.length - 1;
    const meetsMinSize = currentChunk.length >= MIN_CHUNK_SIZE;
    const hasNextSentence = i < sentences.length - 1;

    if (isLastSentence || (meetsMinSize && hasNextSentence)) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  }

  // 남은 청크가 있으면 추가
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
