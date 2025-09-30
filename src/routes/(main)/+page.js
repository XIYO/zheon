export const load = async ({ fetch, depends }) => {
        depends('summaries:list');

        try {
                const response = await fetch('/api/summaries');
                if (!response.ok) {
                        console.error('요약 목록을 불러오지 못했습니다:', await response.text());
                        return { summaries: [] };
                }

                const payload = await response.json();
                return {
                        summaries: payload.summaries ?? []
                };
        } catch (error) {
                console.error('요약 목록을 불러오지 못했습니다:', error);
                return { summaries: [] };
        }
};
