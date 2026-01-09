const BASE_URL = 'http://localhost:3000';

function getToken() {
    return localStorage.getItem('auth_token');
}

async function request(method: string, url: string, body: any = null) {
    const token = getToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options: any = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

export const api = {
    // Auth
    getProfile: () => request('GET', '/users/me'),

    // QA
    getQuestions: () => request('GET', '/questions'),
    getQuestion: (id: string) => request('GET', `/questions/${id}`),
    createQuestion: (data: { title: string; content: string; difficulty: string }) =>
        request('POST', '/questions', data),

    postAnswer: (questionId: string, content: string) =>
        request('POST', `/questions/${questionId}/answers`, { content }),

    acceptAnswer: (answerId: string) => request('POST', `/answers/${answerId}/accept`),
    verifyAnswer: (answerId: string) => request('POST', `/answers/${answerId}/verify`),

    vote: (targetId: number, targetType: 'question' | 'answer', value: number) => {
        const voteType = value === 1 ? 'upvote' : 'downvote';
        const endpoint = targetType === 'question'
            ? `/questions/${targetId}/vote`
            : `/answers/${targetId}/vote`;
        return request('POST', endpoint, { vote_type: voteType });
    }
};
