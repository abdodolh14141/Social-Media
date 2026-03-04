// @/app/libs/hooks/useElysiaSession.ts
import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function useElysiaSession() {
    const { data, error, isLoading, mutate } = useSWR('/api/users/session', fetcher, {
        revalidateOnFocus: false,
        shouldRetryOnError: false
    });

    const session = data?.session;
    const isAdmin = data?.isAdmin || false; // Extract isAdmin here

    return {
        session,
        isAdmin, // Now directly accessible
        data: session ? { user: session } : null,
        status: isLoading ? 'loading' : session ? 'authenticated' : 'unauthenticated',
        error,
        mutate
    };
}