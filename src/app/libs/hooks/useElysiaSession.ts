import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function useElysiaSession() {
    const { data, error, isLoading, mutate } = useSWR('/api/users/session', fetcher, {
        revalidateOnFocus: false,
        shouldRetryOnError: false
    });

    const session = data?.session;

    return {
        session,
        data: session ? { user: session } : null,
        status: isLoading ? 'loading' : session ? 'authenticated' : 'unauthenticated',
        error,
        mutate
    };
}
