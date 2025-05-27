/**
 * 에러 처리 관련 유틸리티 함수들
 */

/**
 * 에러를 사용자 친화적인 형태로 변환합니다
 * @param {unknown} error - 처리할 에러 객체
 * @returns {Record<string, unknown>} - 포맷된 에러 응답
 */
export function handleError(error) {
	if (error instanceof Error) {
		return { message: error.message };
	}
	return { message: 'An unknown error occurred.' };
}

/**
 * 자막 관련 에러를 처리합니다
 * @param {unknown} error - 자막 에러
 * @returns {Record<string, unknown>} - 포맷된 에러 응답
 */
export function handleSubtitleError(error) {
	if (error instanceof Error) {
		// 자막 관련 특별한 에러 메시지 처리
		if (error.message.includes('subtitle')) {
			return { message: '자막을 추출할 수 없습니다. YouTube URL을 확인해주세요.' };
		}
		return { message: error.message };
	}
	return { message: '자막 처리 중 알 수 없는 오류가 발생했습니다.' };
}

/**
 * 데이터베이스 에러를 처리합니다
 * @param {unknown} error - 데이터베이스 에러
 * @param {string} operation - 수행하려던 작업명
 * @returns {Record<string, unknown>} - 포맷된 에러 응답
 */
export function handleDatabaseError(error, operation = 'database operation') {
	console.error(`Database error during ${operation}:`, error);
	return { message: `${operation} 중 오류가 발생했습니다.` };
}
